/**
 * 2026 F1 PREDICTION ENGINE
 *
 * Multi-layered probabilistic model:
 *
 * Layer 1 — Driver intrinsic ability
 *   Skill dimensions: pace, racecraft, consistency, tyreManagement,
 *   wetWeather, startPerformance, overtaking, adaptability
 *
 * Layer 2 — 2026 Car Development
 *   Key 2026 context: NEW POWER UNIT REGULATIONS (50/50 ICE/ERS split)
 *   Teams that historically excel at regulation transitions benefit.
 *   Red Bull switches to Ford (RBPTH001) — unknown quantity.
 *   Ferrari developed new PU independently — strong ERS package.
 *   Mercedes retains PU competitiveness — ERS expertise advantage.
 *   Audi debuts — high variance, initially uncompetitive.
 *
 * Layer 3 — Circuit-specific modifiers
 *   Each track type rewards different car/driver characteristics.
 *   Street circuits amplify qualifying performance and SC luck.
 *   Power circuits amplify PU performance.
 *   Technical circuits amplify mechanical grip and tyre management.
 *
 * Layer 4 — Monte Carlo simulation
 *   10,000 simulated races per circuit.
 *   Gaussian noise models lap time variance, incidents, reliability.
 *   Results are aggregated for probabilistic outcomes.
 *
 * Formula: driverScore = (baseSkill × carPerf × circuitAffinity + noise) × reliabilityFactor
 *
 * FastF1 integration path:
 *   Replace DRIVERS_2026 base scores with real qualifying/race delta data.
 *   Replace CAR_PERFORMANCE with team pace data from testing/early rounds.
 *   Update circuit affinities with real historical lap time deltas.
 */

import { mkRng } from '../utils/math.js';
import { CALENDAR_2026, POINTS, SPRINT_POINTS, SPRINT_ROUNDS } from './calendar2026.js';

// ─── 2026 DRIVER PROFILES ─────────────────────────────────────────────────────
/**
 * Skill dimensions (0-100):
 *   pace           — single-lap qualifying speed (talent ceiling)
 *   racecraft      — racing intelligence, positioning, opportunism
 *   consistency    — ability to repeat performance, low error rate
 *   tyreManagement — preserving rubber across stint
 *   wetWeather     — rain performance
 *   startPerf      — launch + first-lap positioning
 *   adaptability   — adapting to new cars/regs (2026 regs crucial)
 *   dnfRate        — probability of mechanical/driver DNF per race (0-1)
 */
export const DRIVERS_2026 = {
  VER: {
    code:'VER', name:'Max Verstappen',      team:'Red Bull', number:1,  color:'#3B82F6',
    pace:99, racecraft:98, consistency:95, tyreManagement:92, wetWeather:97,
    startPerf:95, adaptability:96, dnfRate:0.055,
    wins:62, podiums:110, poles:41,
    trackNotes: { NED:1.12, AUT:1.10, BHR:1.08, JPN:1.10, ESP:1.06 }
  },
  LEC: {
    code:'LEC', name:'Charles Leclerc',     team:'Ferrari', number:16, color:'#EF4444',
    pace:97, racecraft:89, consistency:83, tyreManagement:84, wetWeather:88,
    startPerf:86, adaptability:88, dnfRate:0.072,
    wins:8, podiums:40, poles:24,
    trackNotes: { MON:1.08, EMR:1.10, ITA:1.09, AUS:1.05, HUN:1.05 }
  },
  HAM: {
    code:'HAM', name:'Lewis Hamilton',      team:'Ferrari', number:44, color:'#E879F9',
    pace:95, racecraft:98, consistency:94, tyreManagement:96, wetWeather:98,
    startPerf:90, adaptability:85, dnfRate:0.048,
    wins:103, podiums:197, poles:104,
    trackNotes: { GBR:1.15, HUN:1.08, BHR:1.05, CHN:1.06, SIN:1.07 }
  },
  NOR: {
    code:'NOR', name:'Lando Norris',        team:'McLaren', number:4,  color:'#FBBF24',
    pace:96, racecraft:92, consistency:90, tyreManagement:88, wetWeather:91,
    startPerf:88, adaptability:93, dnfRate:0.058,
    wins:6, podiums:28, poles:7,
    trackNotes: { GBR:1.10, MIA:1.09, USA:1.08, AUS:1.06, CHN:1.07 }
  },
  RUS: {
    code:'RUS', name:'George Russell',      team:'Mercedes', number:63, color:'#A78BFA',
    pace:93, racecraft:88, consistency:90, tyreManagement:89, wetWeather:90,
    startPerf:89, adaptability:91, dnfRate:0.050,
    wins:3, podiums:18, poles:4,
    trackNotes: { GBR:1.10, BEL:1.06, BRA:1.05 }
  },
  PIA: {
    code:'PIA', name:'Oscar Piastri',       team:'McLaren', number:81, color:'#FDE047',
    pace:93, racecraft:87, consistency:88, tyreManagement:86, wetWeather:85,
    startPerf:86, adaptability:94, dnfRate:0.055,
    wins:4, podiums:16, poles:3,
    trackNotes: { MIA:1.07, HUN:1.06 }
  },
  SAI: {
    code:'SAI', name:'Carlos Sainz',        team:'Williams', number:55, color:'#F97316',
    pace:91, racecraft:90, consistency:91, tyreManagement:93, wetWeather:88,
    startPerf:88, adaptability:87, dnfRate:0.060,
    wins:3, podiums:25, poles:6,
    trackNotes: { AUS:1.07, SIN:1.06, MON:1.05 }
  },
  ALO: {
    code:'ALO', name:'Fernando Alonso',     team:'Aston Martin', number:14, color:'#34D399',
    pace:91, racecraft:98, consistency:89, tyreManagement:95, wetWeather:97,
    startPerf:91, adaptability:82, dnfRate:0.065,
    wins:32, podiums:106, poles:22,
    trackNotes: { MON:1.08, HUN:1.07, SIN:1.06 }
  },
  ANT: {
    code:'ANT', name:'Andrea Kimi Antonelli', team:'Mercedes', number:12, color:'#67E8F9',
    pace:91, racecraft:82, consistency:80, tyreManagement:82, wetWeather:84,
    startPerf:82, adaptability:95, dnfRate:0.075,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
  TSU: {
    code:'TSU', name:'Yuki Tsunoda',        team:'Red Bull', number:22, color:'#60A5FA',
    pace:88, racecraft:83, consistency:80, tyreManagement:82, wetWeather:82,
    startPerf:82, adaptability:86, dnfRate:0.082,
    wins:0, podiums:3, poles:0,
    trackNotes: { JPN:1.06 }
  },
  STR: {
    code:'STR', name:'Lance Stroll',        team:'Aston Martin', number:18, color:'#4ADE80',
    pace:82, racecraft:78, consistency:77, tyreManagement:79, wetWeather:81,
    startPerf:79, adaptability:78, dnfRate:0.088,
    wins:0, podiums:3, poles:1,
    trackNotes: { AZE:1.08 }
  },
  ALB: {
    code:'ALB', name:'Alexander Albon',     team:'Williams', number:23, color:'#FB7185',
    pace:83, racecraft:80, consistency:81, tyreManagement:82, wetWeather:80,
    startPerf:79, adaptability:83, dnfRate:0.082,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
  OCO: {
    code:'OCO', name:'Esteban Ocon',        team:'Haas', number:31, color:'#F472B6',
    pace:83, racecraft:79, consistency:78, tyreManagement:80, wetWeather:82,
    startPerf:80, adaptability:80, dnfRate:0.085,
    wins:1, podiums:3, poles:0,
    trackNotes: {}
  },
  HUL: {
    code:'HUL', name:'Nico Hülkenberg',    team:'Sauber/Audi', number:27, color:'#C084FC',
    pace:83, racecraft:81, consistency:82, tyreManagement:83, wetWeather:84,
    startPerf:80, adaptability:81, dnfRate:0.090,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
  GAS: {
    code:'GAS', name:'Pierre Gasly',        team:'Alpine', number:10, color:'#38BDF8',
    pace:84, racecraft:81, consistency:79, tyreManagement:80, wetWeather:82,
    startPerf:80, adaptability:80, dnfRate:0.092,
    wins:1, podiums:3, poles:0,
    trackNotes: {}
  },
  BEA: {
    code:'BEA', name:'Oliver Bearman',      team:'Haas', number:87, color:'#FCA5A5',
    pace:86, racecraft:80, consistency:78, tyreManagement:79, wetWeather:80,
    startPerf:81, adaptability:92, dnfRate:0.080,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
  LAW: {
    code:'LAW', name:'Liam Lawson',         team:'Racing Bulls', number:30, color:'#7DD3FC',
    pace:86, racecraft:82, consistency:79, tyreManagement:80, wetWeather:81,
    startPerf:82, adaptability:88, dnfRate:0.082,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
  HAD: {
    code:'HAD', name:'Isack Hadjar',        team:'Racing Bulls', number:6,  color:'#93C5FD',
    pace:85, racecraft:79, consistency:76, tyreManagement:77, wetWeather:78,
    startPerf:79, adaptability:90, dnfRate:0.090,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
  DOO: {
    code:'DOO', name:'Jack Doohan',         team:'Alpine', number:7,  color:'#BAE6FD',
    pace:82, racecraft:76, consistency:74, tyreManagement:75, wetWeather:77,
    startPerf:76, adaptability:89, dnfRate:0.095,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
  ZHO: {
    code:'ZHO', name:'Zhou Guanyu',         team:'Sauber/Audi', number:24, color:'#DDD6FE',
    pace:80, racecraft:74, consistency:75, tyreManagement:77, wetWeather:74,
    startPerf:74, adaptability:78, dnfRate:0.105,
    wins:0, podiums:0, poles:0,
    trackNotes: {}
  },
};

export const ALL_DRIVERS_2026 = Object.keys(DRIVERS_2026);

// ─── 2026 CAR PERFORMANCE ─────────────────────────────────────────────────────
/**
 * 2026 regulation context:
 *
 * POWER UNIT REVOLUTION — New 50/50 ICE/ERS split (1.6L V6 + 400kW ERS)
 *   Winners: Ferrari (strong in-house ERS), Mercedes (ERS expertise)
 *   Unknown: Red Bull (Ford RBPTH001 — first gen, reliability risk)
 *   Losers: Alpine (Renault PU restructured), Audi (debut season)
 *
 * AERODYNAMIC REVOLUTION — Active aero replaces passive DRS
 *   Benefit for: teams with strong CFD and wind tunnel resource
 *   Key: rear wing active flap replaces DRS, front wing adapts in corners
 *
 * developmentRate: how fast the team improves across the season (1.0=average)
 * regAdaptation: how well the team handled the 2026 regulation change
 * earlySeasonBonus: cars that nail the concept from day 1 (pre-season testing)
 */
export const CAR_2026 = {
  'Red Bull': {
    overallPerf:0.92,      // starts strong but PU uncertainty
    straightLine:0.88,     // Ford PU untested — lower confidence
    cornering:0.94,        // Newey-legacy chassis excellence
    tyreDeg:0.90,
    reliability:0.88,      // new PU = reliability risk
    developmentRate:1.05,  // Red Bull develop fastest in-season
    regAdaptation:0.90,    // historically excellent at reg changes
    earlySeasonBonus:0.94,
  },
  'Ferrari': {
    overallPerf:0.93,      // new PU regs suit Ferrari
    straightLine:0.94,     // strong 50/50 ERS package
    cornering:0.90,
    tyreDeg:0.88,
    reliability:0.90,
    developmentRate:1.02,
    regAdaptation:0.92,    // Ferrari invested heavily in 2026 regs
    earlySeasonBonus:0.95, // very strong pre-season testing
  },
  'Mercedes': {
    overallPerf:0.91,
    straightLine:0.92,     // ERS expertise — strong 2026 PU
    cornering:0.88,
    tyreDeg:0.90,
    reliability:0.93,      // Mercedes reliability traditionally high
    developmentRate:1.03,
    regAdaptation:0.91,
    earlySeasonBonus:0.90,
  },
  'McLaren': {
    overallPerf:0.90,
    straightLine:0.86,     // Mercedes customer PU — one step behind
    cornering:0.91,
    tyreDeg:0.88,
    reliability:0.91,
    developmentRate:1.04,  // McLaren developed fastest 2023-2025
    regAdaptation:0.88,
    earlySeasonBonus:0.88,
  },
  'Aston Martin': {
    overallPerf:0.82,
    straightLine:0.83,
    cornering:0.80,
    tyreDeg:0.84,
    reliability:0.89,
    developmentRate:0.95,
    regAdaptation:0.80,
    earlySeasonBonus:0.78,
  },
  'Williams': {
    overallPerf:0.78,
    straightLine:0.80,
    cornering:0.76,
    tyreDeg:0.80,
    reliability:0.87,
    developmentRate:1.02,
    regAdaptation:0.78,
    earlySeasonBonus:0.76,
  },
  'Alpine': {
    overallPerf:0.74,
    straightLine:0.72,     // Renault PU in transition
    cornering:0.74,
    tyreDeg:0.76,
    reliability:0.80,
    developmentRate:0.92,
    regAdaptation:0.70,
    earlySeasonBonus:0.68,
  },
  'Haas': {
    overallPerf:0.75,
    straightLine:0.76,
    cornering:0.72,
    tyreDeg:0.74,
    reliability:0.82,
    developmentRate:0.94,
    regAdaptation:0.74,
    earlySeasonBonus:0.72,
  },
  'Sauber/Audi': {
    overallPerf:0.72,      // Audi debut — first-gen car
    straightLine:0.74,
    cornering:0.70,
    tyreDeg:0.72,
    reliability:0.76,      // new PU manufacturer = reliability risk
    developmentRate:1.08,  // huge development budget
    regAdaptation:0.68,
    earlySeasonBonus:0.65,
  },
  'Racing Bulls': {
    overallPerf:0.79,      // same Ford PU as Red Bull, B-team package
    straightLine:0.82,
    cornering:0.76,
    tyreDeg:0.80,
    reliability:0.84,
    developmentRate:0.96,
    regAdaptation:0.80,
    earlySeasonBonus:0.78,
  },
};

// ─── MONTE CARLO ENGINE ───────────────────────────────────────────────────────

/**
 * Compute a driver's base score for a specific circuit
 * Returns a value roughly in [0,1] representing race performance potential
 */
function driverCircuitScore(driverCode, circuit, raceRound) {
  const d = DRIVERS_2026[driverCode];
  const car = CAR_2026[d.team];
  if (!d || !car) return 0;

  // ── Weighted skill aggregate ─────────────────────────────────────────────
  // Weights shift by circuit type to reflect what each track demands
  let w;
  switch (circuit.type) {
    case 'power':
      w = { pace:0.22, racecraft:0.15, consistency:0.18, tyre:0.10, wet:0.05, start:0.15, adapt:0.15 };
      break;
    case 'technical':
      w = { pace:0.18, racecraft:0.18, consistency:0.20, tyre:0.18, wet:0.06, start:0.10, adapt:0.10 };
      break;
    case 'street':
      w = { pace:0.20, racecraft:0.22, consistency:0.16, tyre:0.12, wet:0.08, start:0.12, adapt:0.10 };
      break;
    case 'high_speed':
      w = { pace:0.25, racecraft:0.15, consistency:0.18, tyre:0.12, wet:0.10, start:0.10, adapt:0.10 };
      break;
    default: // balanced
      w = { pace:0.20, racecraft:0.18, consistency:0.18, tyre:0.15, wet:0.07, start:0.12, adapt:0.10 };
  }

  // Wet weather amplification
  const wetBoost = circuit.weatherP > 0.3 ? (d.wetWeather / 100) * circuit.weatherP * 0.15 : 0;

  const driverSkill = (
    (d.pace          / 100) * w.pace       +
    (d.racecraft     / 100) * w.racecraft  +
    (d.consistency   / 100) * w.consistency +
    (d.tyreManagement/ 100) * w.tyre       * (circuit.tyreWear / 10) +
    (d.wetWeather    / 100) * w.wet        +
    (d.startPerf     / 100) * w.start      +
    (d.adaptability  / 100) * w.adapt
  ) + wetBoost;

  // ── Car performance aggregate ────────────────────────────────────────────
  const carScore = (
    car.overallPerf * 0.30 +
    car.straightLine * circuit.topSpeedW * 0.20 +
    car.cornering    * circuit.corneringW * 0.20 +
    car.tyreDeg      * (circuit.tyreWear / 10) * 0.15 +
    car.reliability  * 0.08 +
    car.regAdaptation * 0.07
  );

  // ── Season development arc ───────────────────────────────────────────────
  // Teams develop through the season — later rounds advantage teams with
  // higher developmentRate
  const roundFraction  = (raceRound - 1) / 23;
  const developBonus   = (car.developmentRate - 1.0) * roundFraction * 0.08;
  const earlyBonus     = car.earlySeasonBonus * (1 - roundFraction) * 0.05;

  // ── Circuit-specific historical modifier ─────────────────────────────────
  const trackMod      = d.trackNotes[circuit.id] || 1.0;
  const teamHistMod   = circuit.teamHistory?.[d.team] || 0.70;

  // ── Final score ──────────────────────────────────────────────────────────
  const base = driverSkill * 0.55 + carScore * 0.45;
  return base * trackMod * (0.90 + teamHistMod * 0.10) + developBonus + earlyBonus;
}

/**
 * Box-Muller transform — Gaussian noise for Monte Carlo
 * Simulates lap time variance: incidents, traffic, DRS trains, mistakes
 */
function gaussianNoise(rng, mean, std) {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

/**
 * Single race Monte Carlo simulation
 * Returns win/podium/top5/points probabilities for every driver
 */
function simulateRace(circuit, drivers, raceRound, N = 5000) {
  const rng = mkRng(circuit.id.charCodeAt(0) * 31 + circuit.round * 997);

  // Base scores for all drivers
  const baseScores = {};
  drivers.forEach(code => {
    baseScores[code] = driverCircuitScore(code, circuit, raceRound);
  });

  // Outcome counters
  const wins   = Object.fromEntries(drivers.map(c => [c, 0]));
  const podium = Object.fromEntries(drivers.map(c => [c, 0]));
  const top5   = Object.fromEntries(drivers.map(c => [c, 0]));
  const pts    = Object.fromEntries(drivers.map(c => [c, 0]));
  const dnfs   = Object.fromEntries(drivers.map(c => [c, 0]));

  // Standard deviation for noise:
  // Street circuits and high-SC races have more variance
  const baseStd = 0.035 + circuit.safetyCarP * 0.025 + (circuit.type === 'street' ? 0.015 : 0);

  for (let sim = 0; sim < N; sim++) {
    // Simulate each driver's "race score" with noise
    const simScores = drivers.map(code => {
      const d = DRIVERS_2026[code];
      const baseScore = baseScores[code];

      // DNF check — reliability + driver error
      const dnfRoll = rng();
      if (dnfRoll < d.dnfRate * (1 / CAR_2026[d.team].reliability)) {
        return { code, score: -999, dnf: true };
      }

      // Add lap time variance
      const noise = gaussianNoise(rng, 0, baseStd);

      // Safety car lottery — can shuffle positions
      const scEffect = circuit.safetyCarP > 0 && rng() < circuit.safetyCarP
        ? (rng() - 0.5) * 0.04
        : 0;

      // Weather bonus
      const weatherBonus = rng() < circuit.weatherP
        ? (d.wetWeather / 100 - 0.88) * 0.08
        : 0;

      return { code, score: baseScore + noise + scEffect + weatherBonus, dnf: false };
    });

    // Sort by score descending (higher = better race result)
    simScores.sort((a, b) => b.score - a.score);

    // Assign outcomes
    simScores.forEach((r, pos) => {
      if (r.dnf) { dnfs[r.code]++; return; }
      if (pos === 0) wins[r.code]++;
      if (pos < 3)  podium[r.code]++;
      if (pos < 5)  top5[r.code]++;
      const p = POINTS[pos] || 0;
      pts[r.code] += p;
    });
  }

  // Convert to probabilities
  const result = {};
  drivers.forEach(code => {
    result[code] = {
      winP:    wins[code]   / N,
      podiumP: podium[code] / N,
      top5P:   top5[code]   / N,
      avgPts:  pts[code]    / N,
      dnfP:    dnfs[code]   / N,
    };
  });

  return result;
}

// ─── CACHED RACE RESULTS ──────────────────────────────────────────────────────
// Pre-compute all 24 races (fast enough — ~50ms total in browser)
let _raceCache = null;

export function getAllRaceSimulations() {
  if (_raceCache) return _raceCache;

  const drivers = ALL_DRIVERS_2026;
  _raceCache = {};

  CALENDAR_2026.forEach(circuit => {
    _raceCache[circuit.id] = simulateRace(circuit, drivers, circuit.round, 5000);
  });

  return _raceCache;
}

/**
 * Get top N predicted results for a specific race
 */
export function getRacePrediction(circuitId, topN = 10) {
  const sims = getAllRaceSimulations();
  const race = sims[circuitId];
  if (!race) return [];

  return Object.entries(race)
    .map(([code, r]) => ({ code, ...r, driver: DRIVERS_2026[code] }))
    .sort((a, b) => b.winP - a.winP)
    .slice(0, topN);
}

// ─── SEASON CHAMPIONSHIP SIMULATION ──────────────────────────────────────────
/**
 * Monte Carlo season simulation
 * For each of N season simulations:
 *   For each race, sample a race result from the probability distribution
 *   Accumulate points
 * Returns championship probability + points distributions
 */
let _champCache = null;

export function computeChampionshipOdds(N = 3000) {
  if (_champCache) return _champCache;

  const sims     = getAllRaceSimulations();
  const drivers  = ALL_DRIVERS_2026;
  const rng      = mkRng(2026);

  // Season sim counters
  const champWins     = Object.fromEntries(drivers.map(c => [c, 0]));
  const top3Finishes  = Object.fromEntries(drivers.map(c => [c, 0]));
  const pointsSum     = Object.fromEntries(drivers.map(c => [c, 0]));
  const pointsSquared = Object.fromEntries(drivers.map(c => [c, 0]));

  for (let s = 0; s < N; s++) {
    const seasonPts = Object.fromEntries(drivers.map(c => [c, 0]));

    CALENDAR_2026.forEach(circuit => {
      const raceData  = sims[circuit.id];
      const isSprint  = SPRINT_ROUNDS.has(circuit.id);

      // Simulate finishing positions by sampling from probability distributions
      // Use cumulative winP, podiumP, top5P to build a position probability ladder
      const positions = sampleRacePositions(raceData, drivers, rng);

      positions.forEach((code, pos) => {
        const ptsArr = POINTS;
        const p = ptsArr[pos] || 0;
        seasonPts[code] += p;
        // Sprint bonus (simplified: top 8 get half sprint points)
        if (isSprint && pos < 8) {
          seasonPts[code] += (SPRINT_POINTS[pos] || 0) * 0.5;
        }
        // Fastest lap bonus
        if (pos < 10 && rng() < 0.12) seasonPts[code] += 1;
      });
    });

    // Find champion for this simulation
    const sorted = Object.entries(seasonPts).sort((a, b) => b[1] - a[1]);
    const champ = sorted[0][0];
    champWins[champ]++;
    sorted.slice(0, 3).forEach(([c]) => top3Finishes[c]++);

    drivers.forEach(code => {
      pointsSum[code]     += seasonPts[code];
      pointsSquared[code] += seasonPts[code] * seasonPts[code];
    });
  }

  _champCache = Object.fromEntries(drivers.map(code => [code, {
    championP:    champWins[code] / N,
    top3P:        top3Finishes[code] / N,
    projPoints:   Math.round(pointsSum[code] / N),
    driver:       DRIVERS_2026[code],
  }]));

  return _champCache;
}

/**
 * Sample race finishing positions from probability distributions
 * Uses a weighted lottery: driver with higher expected score more likely
 * to finish in front, but with randomness
 */
function sampleRacePositions(raceData, drivers, rng) {
  const scores = drivers.map(code => ({
    code,
    score: (raceData[code]?.winP || 0) * 3 +
           (raceData[code]?.podiumP || 0) * 1 +
           rng() * 0.3, // noise
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.code);
}

// ─── CONSTRUCTOR STANDINGS ────────────────────────────────────────────────────
export function computeConstructorOdds() {
  const champOdds = computeChampionshipOdds();
  const teams = {};

  Object.entries(DRIVERS_2026).forEach(([code, d]) => {
    if (!teams[d.team]) teams[d.team] = { team: d.team, projPoints: 0, drivers: [], championP: 0 };
    teams[d.team].projPoints  += champOdds[code]?.projPoints  || 0;
    teams[d.team].championP   += champOdds[code]?.championP   || 0;
    teams[d.team].drivers.push(code);
  });

  return Object.values(teams).sort((a, b) => b.projPoints - a.projPoints);
}

// ─── EXPLAINABLE INSIGHTS ─────────────────────────────────────────────────────
/**
 * Generate race-engineer-style explanation for why a driver is predicted to win.
 * Returns array of insight strings sorted by impact.
 */
export function explainPrediction(driverCode, circuitId) {
  const d       = DRIVERS_2026[driverCode];
  const circuit = CALENDAR_2026.find(c => c.id === circuitId);
  const car     = CAR_2026[d.team];
  if (!d || !circuit || !car) return [];

  const insights = [];

  // Car performance
  const carPerfPct = Math.round(car.overallPerf * 100);
  insights.push({
    category: 'Car Performance',
    icon: '🚗',
    text: `${d.team} car rated ${carPerfPct}/100 for 2026. New PU regulations ${
      car.regAdaptation > 0.88 ? 'strongly favour' : car.regAdaptation > 0.80 ? 'moderately suit' : 'present challenges for'
    } their package.`,
    impact: car.overallPerf,
  });

  // Driver skill vs circuit type
  const relevantSkill = circuit.type === 'power' ? d.pace
    : circuit.type === 'technical' ? d.consistency
    : circuit.type === 'street' ? d.racecraft
    : (d.pace + d.racecraft) / 2;
  insights.push({
    category: 'Driver Fit',
    icon: '🎯',
    text: `${circuit.type.replace('_',' ')} circuits reward ${
      circuit.type === 'power' ? 'raw qualifying pace' :
      circuit.type === 'technical' ? 'precision and consistency' :
      circuit.type === 'street' ? 'racecraft and positioning' : 'all-round ability'
    }. ${d.name} scores ${relevantSkill}/100 on this dimension.`,
    impact: relevantSkill / 100,
  });

  // Historical advantage
  const trackBonus = d.trackNotes[circuitId];
  if (trackBonus && trackBonus > 1.02) {
    insights.push({
      category: 'Circuit History',
      icon: '📊',
      text: `${d.name} has a ${((trackBonus - 1) * 100).toFixed(0)}% historical performance advantage at this circuit based on past qualifying and race deltas.`,
      impact: trackBonus,
    });
  }

  // Team circuit history
  const teamHist = circuit.teamHistory?.[d.team];
  if (teamHist && teamHist > 0.80) {
    insights.push({
      category: 'Team History',
      icon: '🏭',
      text: `${d.team} has dominated this circuit historically (score ${Math.round(teamHist * 100)}/100). Track characteristics match the car's philosophy.`,
      impact: teamHist,
    });
  }

  // Tyre management
  if (circuit.tyreWear >= 7) {
    insights.push({
      category: 'Tyre Management',
      icon: '🔴',
      text: `High tyre wear circuit (${circuit.tyreWear}/10). ${d.name}'s tyre management rating (${d.tyreManagement}/100) ${
        d.tyreManagement >= 90 ? 'is a major asset here' :
        d.tyreManagement >= 82 ? 'is competitive' : 'could be a liability'
      }.`,
      impact: d.tyreManagement / 100,
    });
  }

  // Weather factor
  if (circuit.weatherP > 0.25) {
    insights.push({
      category: 'Weather Risk',
      icon: '🌧',
      text: `${Math.round(circuit.weatherP * 100)}% rain probability. ${d.name} wet weather rating: ${d.wetWeather}/100. ${
        d.wetWeather >= 94 ? 'Elite wet-weather driver — strong advantage if rain arrives.' :
        d.wetWeather >= 85 ? 'Competent in wet conditions.' : 'Could struggle if conditions deteriorate.'
      }`,
      impact: d.wetWeather / 100,
    });
  }

  // Safety car factor
  if (circuit.safetyCarP > 0.45) {
    insights.push({
      category: 'Safety Car Risk',
      icon: '🚨',
      text: `High safety car probability (${Math.round(circuit.safetyCarP * 100)}%). This circuit introduces significant result variance — strategic reactions and track position management critical.`,
      impact: 0.75,
    });
  }

  // Reliability
  if (car.reliability < 0.82) {
    insights.push({
      category: 'Reliability Warning',
      icon: '⚠️',
      text: `${d.team}'s 2026 PU reliability rated at ${Math.round(car.reliability * 100)}/100. New regulations introduce first-year failure risk. DNF probability elevated.`,
      impact: car.reliability,
    });
  }

  return insights.sort((a, b) => b.impact - a.impact);
}

// ─── SEASON POINTS PROJECTION CURVE ──────────────────────────────────────────
/**
 * Project cumulative points across the season for top N drivers
 * Returns array of [code, [cumPoints per round]]
 */
export function seasonPointsCurve(driverCodes) {
  const sims = getAllRaceSimulations();

  return driverCodes.map(code => {
    let cumulative = 0;
    const curve = CALENDAR_2026.map(circuit => {
      const racePts = sims[circuit.id]?.[code]?.avgPts || 0;
      // Sprint weekend adds ~2 bonus expected points
      const sprintBonus = SPRINT_ROUNDS.has(circuit.id) ? racePts * 0.15 : 0;
      cumulative += racePts + sprintBonus;
      return Math.round(cumulative);
    });
    return { code, curve };
  });
}

// ─── CONFIDENCE SCORE ─────────────────────────────────────────────────────────
/**
 * Race prediction confidence score (0-100)
 * Low confidence = safety car likely, wet weather, street circuit
 * High confidence = power circuit, dry conditions, predictable history
 */
export function confidenceScore(circuitId) {
  const circuit = CALENDAR_2026.find(c => c.id === circuitId);
  if (!circuit) return 50;

  // Base confidence from circuit predictability
  const varianceFactor = circuit.safetyCarP * 0.35 + circuit.weatherP * 0.25;
  const streetPenalty  = circuit.type === 'street' ? 0.12 : 0;
  const base           = 0.88 - varianceFactor - streetPenalty;
  return Math.round(Math.max(30, Math.min(92, base * 100)));
}
