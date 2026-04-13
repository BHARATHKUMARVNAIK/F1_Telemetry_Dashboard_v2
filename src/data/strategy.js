/**
 * STRATEGY RECOMMENDATION ENGINE
 *
 * This module acts as a simplified pit-wall strategist.
 * It models:
 *  1. Stint pace evolution (tyre degradation + fuel effect)
 *  2. Pit stop time loss (stationary time + pit lane delta)
 *  3. Undercut opportunity scoring
 *  4. Overcut scenario modelling
 *  5. One-stop vs two-stop total race time comparison
 *  6. Optimal pit window by compound combination
 *
 * All calculations are deterministic and can be swapped for
 * real tyre models from FastF1's laps.pick_tyre_compound() data.
 */

import { mkRng } from '../utils/math.js';
import { DRIVER_LAPTIME } from '../utils/colors.js';
import { ALL_TELEMETRY } from './telemetry.js';

const RACE_LAPS      = 57;   // Bahrain Grand Prix race distance
const PIT_LOSS       = 22.0; // Approximate pit stop time loss (stationary + delta)
const SAFETY_CAR_P   = 0.35; // Probability of safety car in any stint

// ─── COMPOUND DEFINITIONS ─────────────────────────────────────────────────────
export const COMPOUNDS = {
  SOFT:   { id:'SOFT',   color:'#EF4444', label:'Soft C3',   maxLaps:22, baseTime:0.00, degradRate:0.072, cliffLap:12 },
  MEDIUM: { id:'MEDIUM', color:'#F59E0B', label:'Medium C2', maxLaps:32, baseTime:0.55, degradRate:0.038, cliffLap:18 },
  HARD:   { id:'HARD',   color:'#9CA3AF', label:'Hard C1',   maxLaps:42, baseTime:1.10, degradRate:0.016, cliffLap:28 },
};

// ─── STINT TIME MODEL ─────────────────────────────────────────────────────────
/**
 * Predict average lap time for a stint starting on a fresh compound
 * at a given fuel level, running n laps
 * Returns array of [lap, predictedTime]
 */
export function predictStintPace(driverCode, compound, startFuelKg, laps) {
  const baseLapTime = DRIVER_LAPTIME[driverCode] || 90.0;
  // Qualifying → race pace delta (fuel, tyres, conservative delta mode)
  const raceDelta = 4.5;
  const compData = COMPOUNDS[compound];
  const rng = mkRng(driverCode.charCodeAt(0) + compound.charCodeAt(0));

  return Array.from({length:laps}, (_,i) => {
    const lap = i + 1;
    const fuel = Math.max(0, startFuelKg - 2.4 * i);
    const fuelPenalty = fuel * 0.035;
    const tyre = compData.baseTime + compData.degradRate * i +
                 (i > compData.cliffLap
                   ? 0.006 * Math.pow(i - compData.cliffLap, 1.6)
                   : 0);
    const noise = (rng() - 0.5) * 0.08;
    return {
      lap,
      time: parseFloat((baseLapTime + raceDelta + fuelPenalty + tyre + noise).toFixed(3)),
    };
  });
}

// ─── STRATEGY SCENARIOS ───────────────────────────────────────────────────────
/**
 * Compute total race time for a given pit strategy
 * strategy: [{compound, startLap, endLap}]
 */
export function computeRaceTime(driverCode, strategy) {
  let totalTime = 0;
  let fuel = 105;

  for (let s = 0; s < strategy.length; s++) {
    const { compound, startLap, endLap } = strategy[s];
    const stintLaps = endLap - startLap;
    const stintFuel = fuel;
    fuel -= 2.4 * stintLaps;

    const pace = predictStintPace(driverCode, compound, stintFuel, stintLaps);
    totalTime += pace.reduce((a, p) => a + p.time, 0);
    if (s < strategy.length - 1) totalTime += PIT_LOSS;
  }

  return parseFloat(totalTime.toFixed(2));
}

// ─── PRE-DEFINED STRATEGY TEMPLATES ──────────────────────────────────────────
export const STRATEGY_TEMPLATES = [
  {
    id: 'S_M',
    name: 'Soft → Medium',
    description: 'Fast qualifying pace early, stable medium compound for bulk of race',
    stops: 1,
    stints: [
      {compound:'SOFT',   startLap:1,  endLap:16},
      {compound:'MEDIUM', startLap:17, endLap:57},
    ],
  },
  {
    id: 'S_H',
    name: 'Soft → Hard',
    description: 'Aggressive soft start, ultra-durable hard for maximum stint length',
    stops: 1,
    stints: [
      {compound:'SOFT', startLap:1,  endLap:14},
      {compound:'HARD', startLap:15, endLap:57},
    ],
  },
  {
    id: 'M_H',
    name: 'Medium → Hard',
    description: 'Conservative one-stop. Sacrifices early pace for stability.',
    stops: 1,
    stints: [
      {compound:'MEDIUM', startLap:1,  endLap:28},
      {compound:'HARD',   startLap:29, endLap:57},
    ],
  },
  {
    id: 'S_M_M',
    name: 'Soft → Medium → Medium',
    description: 'Aggressive two-stop. Maximum pace throughout, at cost of track position.',
    stops: 2,
    stints: [
      {compound:'SOFT',   startLap:1,  endLap:13},
      {compound:'MEDIUM', startLap:14, endLap:35},
      {compound:'MEDIUM', startLap:36, endLap:57},
    ],
  },
  {
    id: 'M_S_H',
    name: 'Medium → Soft → Hard',
    description: 'Two-stop with soft splash. Useful in safety car scenarios.',
    stops: 2,
    stints: [
      {compound:'MEDIUM', startLap:1,  endLap:20},
      {compound:'SOFT',   startLap:21, endLap:34},
      {compound:'HARD',   startLap:35, endLap:57},
    ],
  },
];

// ─── UNDERCUT ANALYSIS ────────────────────────────────────────────────────────
/**
 * Determine if an undercut is viable between two drivers
 * An undercut works when: driver pits early, sets fast laps on fresh tyres,
 * and emerges ahead of their rival who pits a lap or two later.
 *
 * Rule of thumb: undercut gain ≈ (tyre_delta × n_laps) - pit_loss
 */
export function analyzeUndercut(attackerCode, defenderCode, currentLap, gapToDefender) {
  const attackerTime = DRIVER_LAPTIME[attackerCode];
  const defenderTime = DRIVER_LAPTIME[defenderCode];
  const qualyDelta = defenderTime - attackerTime;

  // Estimate fresh tyre advantage (soft vs worn medium)
  const freshTyreAdv = 1.1; // seconds per lap advantage of new soft vs worn medium
  const undercut = [];

  for (let pitin = currentLap; pitin <= Math.min(currentLap + 5, RACE_LAPS - 15); pitin++) {
    const lapsToEmerge = 1; // laps attacker is in pits
    const tyreGainPerLap = freshTyreAdv;
    const lapsToOvercut = Math.ceil((PIT_LOSS - gapToDefender) / tyreGainPerLap);

    // Estimated position when defender pits (assuming they pit 2 laps later)
    const gainAfter2Laps = (2 * tyreGainPerLap) - PIT_LOSS + gapToDefender;

    undercut.push({
      pitLap: pitin,
      estimatedGain: parseFloat(gainAfter2Laps.toFixed(2)),
      viable: gainAfter2Laps > 0,
      confidence: gainAfter2Laps > 1.5 ? 'high' : gainAfter2Laps > 0 ? 'medium' : 'low',
    });
  }

  return undercut;
}

// ─── GENERATE STRATEGY RECOMMENDATIONS ───────────────────────────────────────
export function generateRecommendations(driverCodes, currentLap=1) {
  const recs = [];

  // For each driver, score all strategies
  for (const code of driverCodes) {
    const scored = STRATEGY_TEMPLATES.map(tmpl => {
      const total = computeRaceTime(code, tmpl.stints);
      return { ...tmpl, totalTime: total };
    }).sort((a,b) => a.totalTime - b.totalTime);

    const best = scored[0];
    const second = scored[1];
    const gap = parseFloat((second.totalTime - best.totalTime).toFixed(2));

    recs.push({
      driver: code,
      type: 'optimal_strategy',
      severity: 'info',
      headline: `${code} optimal: ${best.name}`,
      detail: `${best.name} saves ${gap}s vs ${second.name} over ${RACE_LAPS} laps. ` +
              `Total projected race time: ${(best.totalTime/60).toFixed(1)} mins.`,
      strategies: scored.slice(0, 3),
    });
  }

  // Undercut opportunities between selected drivers
  if (driverCodes.length >= 2) {
    for (let i=0; i<driverCodes.length; i++) {
      for (let j=i+1; j<driverCodes.length; j++) {
        const a = driverCodes[i], b = driverCodes[j];
        const gap = parseFloat((DRIVER_LAPTIME[b] - DRIVER_LAPTIME[a]).toFixed(3));
        if (Math.abs(gap) < 2.0) {
          const undercutAnalysis = analyzeUndercut(a, b, currentLap, Math.abs(gap));
          const viableLaps = undercutAnalysis.filter(u=>u.viable);
          if (viableLaps.length > 0) {
            const best = viableLaps[0];
            recs.push({
              driver: a,
              target: b,
              type: 'undercut',
              severity: best.confidence === 'high' ? 'critical' : 'moderate',
              headline: `${a} undercut window vs ${b}`,
              detail: `Pitting lap ${best.pitLap} yields estimated +${best.estimatedGain}s gain over ${b}. ` +
                      `Fresh soft tyres provide ~1.1s/lap advantage over worn medium.`,
              confidence: best.confidence,
            });
          }
        }
      }
    }
  }

  // Tyre cliff warnings
  for (const code of driverCodes) {
    const tel = ALL_TELEMETRY[code];
    // Simulate soft tyre at lap 13 (approaching cliff)
    const softAtLap13 = tel.softDeg?.[12];
    const softAtLap11 = tel.softDeg?.[10];
    if (softAtLap13 && softAtLap11) {
      const degradRate = softAtLap13 - softAtLap11;
      if (degradRate > 0.2) {
        recs.push({
          driver: code,
          type: 'tyre_cliff',
          severity: 'critical',
          headline: `${code}: soft tyre cliff imminent`,
          detail: `${code}'s soft compound degrading at ${degradRate.toFixed(2)}s/lap — cliff threshold approaching. ` +
                  `Recommend pitting within 2 laps to avoid time loss exceeding pit stop delta.`,
        });
      }
    }
  }

  return recs;
}
