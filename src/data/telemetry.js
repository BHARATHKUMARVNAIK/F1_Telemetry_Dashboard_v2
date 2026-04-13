/**
 * MULTI-DRIVER TELEMETRY ENGINE
 *
 * Architecture:
 * 1. Each driver has a "speed offset profile" — per-corner modifiers that
 *    encode their car's strengths (downforce circuit, power circuit, etc.)
 *    and driving style (late braker, early apexer, high-commitment).
 * 2. The base speed profile (VER's) is adjusted by these offsets to generate
 *    unique but physically consistent telemetry for every driver.
 * 3. Lap time scaling ensures the generated profiles match real Q3 times.
 * 4. All channels (throttle, brake, gear, RPM) are derived from speed.
 *
 * For FastF1 integration: replace buildDriverTelemetry() with a fetch call
 * to your Python API endpoint — the rest of the app does not change.
 */

import { mkRng, lerpWP, sub } from '../utils/math.js';
import { DRIVER_LAPTIME } from '../utils/colors.js';

export const LAP = 5412;   // Bahrain circuit length (metres)
export const N   = 300;    // telemetry sample points per lap
export const DIST = Array.from({length:N},(_,i)=>Math.round((i/N)*LAP));

// ─── BASE SPEED PROFILE (VER reference) ──────────────────────────────────────
const BASE_WP = [
  [0,172],[90,200],[220,250],[380,288],[490,304],[580,311],[638,285],
  [682,178],[725,110],[762,83],[798,88],[868,135],[945,185],[1038,240],
  [1085,202],[1128,155],[1168,112],[1215,80],[1252,88],[1315,130],[1405,192],
  [1488,242],[1558,256],[1618,182],[1668,142],[1728,150],[1808,188],[1892,228],
  [1988,268],[2098,292],[2208,308],[2308,232],[2358,158],[2392,75],[2418,62],
  [2452,70],[2518,120],[2608,172],[2715,228],[2828,270],[2942,292],[3018,228],
  [3058,175],[3098,118],[3138,88],[3178,96],[3238,140],[3328,198],[3418,198],
  [3458,160],[3505,120],[3542,80],[3578,97],[3648,150],[3758,212],[3868,265],
  [3968,295],[4058,308],[4098,312],[4152,252],[4218,198],[4292,220],[4378,268],
  [4452,218],[4508,162],[4558,73],[4618,108],[4698,160],[4788,212],[4878,256],
  [4958,202],[5038,178],[5095,164],[5162,152],[5228,156],[5308,167],[5412,172]
];

// ─── PER-DRIVER SPEED OFFSETS ─────────────────────────────────────────────────
// Format: [distanceStart, distanceEnd, speedDeltaKph]
// Positive = faster than base in that zone, negative = slower
// These encode car philosophy and driving style:
//   Red Bull: straight-line speed, late braking, lower apex carry
//   Ferrari:  high downforce, better fast corners, earlier throttle
//   McLaren:  excellent traction, good under braking
//   Mercedes: high-speed stability, mid-speed corners
//   Aston:    mechanical grip, slow corners
/*
const DRIVER_OFFSETS = {
  VER: [], // reference driver
  LEC: [[0,680,−2],[682,1220,+3],[1480,1700,+6],[2380,2460,+4],[3730,4110,+6],[4430,4570,+5],[5050,5412,+2]],
  SAI: [[0,680,−3],[682,1220,+2],[1480,1700,+4],[2380,2460,+6],[3730,4110,+4],[4430,4570,+4],[5050,5412,+1]],
  PER: [[0,680,−1],[682,1220,−2],[1220,1480,−3],[2380,2460,+2],[3730,4110,+1],[4430,4570,−1]],
  NOR: [[0,680,−4],[682,1220,+1],[1480,1700,+3],[2380,2460,+3],[2700,3000,+2],[3730,4110,+3],[4430,4570,+2]],
  PIA: [[0,680,−5],[682,1220,+2],[1480,1700,+2],[2380,2460,+2],[2700,3000,+1],[3730,4110,+2]],
  ALO: [[0,680,−6],[682,1220,+1],[1220,1480,+3],[2380,2460,+1],[2700,3000,+3],[3730,4110,+1]],
  RUS: [[0,680,−5],[682,1220,0],[1220,1480,+1],[2380,2460,0],[2700,3000,+2],[3730,4110,+2],[4430,4570,+1]],
  HAM: [[0,680,−5],[682,1220,+1],[1220,1480,+2],[2380,2460,+1],[2700,3000,+1],[3730,4110,+2],[4430,4570,+1]],
  STR: [[0,680,−9],[682,1220,−2],[1220,1480,+1],[2380,2460,−1],[3730,4110,0]],
  ALB: [[0,680,−11],[682,1220,−3],[1220,1480,0],[2380,2460,−2],[3730,4110,−1]],
};
*/
const DRIVER_OFFSETS = {
  VER: [], // reference driver
  LEC: [[0,680,-2],[682,1220,3],[1480,1700,6],[2380,2460,4],[3730,4110,6],[4430,4570,5],[5050,5412,2]],
  SAI: [[0,680,-3],[682,1220,2],[1480,1700,4],[2380,2460,6],[3730,4110,4],[4430,4570,4],[5050,5412,1]],
  PER: [[0,680,-1],[682,1220,-2],[1220,1480,-3],[2380,2460,2],[3730,4110,1],[4430,4570,-1]],
  NOR: [[0,680,-4],[682,1220,1],[1480,1700,3],[2380,2460,3],[2700,3000,2],[3730,4110,3],[4430,4570,2]],
  PIA: [[0,680,-5],[682,1220,2],[1480,1700,2],[2380,2460,2],[2700,3000,1],[3730,4110,2]],
  ALO: [[0,680,-6],[682,1220,1],[1220,1480,3],[2380,2460,1],[2700,3000,3],[3730,4110,1]],
  RUS: [[0,680,-5],[682,1220,0],[1220,1480,1],[2380,2460,0],[2700,3000,2],[3730,4110,2],[4430,4570,1]],
  HAM: [[0,680,-5],[682,1220,1],[1220,1480,2],[2380,2460,1],[2700,3000,1],[3730,4110,2],[4430,4570,1]],
  STR: [[0,680,-9],[682,1220,-2],[1220,1480,1],[2380,2460,-1],[3730,4110,0]],
  ALB: [[0,680,-11],[682,1220,-3],[1220,1480,0],[2380,2460,-2],[3730,4110,-1]],
};

function applyOffsets(baseSpeed, dist, offsets) {
  return baseSpeed.map((v, i) => {
    let delta = 0;
    for (const [s, e, d] of offsets) {
      if (dist[i] >= s && dist[i] < e) { delta = d; break; }
    }
    return Math.round(v + delta);
  });
}

// ─── SCALE TO MATCH REAL LAP TIMES ───────────────────────────────────────────
function scaleToLapTime(speedArr, targetSeconds) {
  // Compute simulated lap time from speed profile
  let simTime = 0;
  for (let i = 1; i < speedArr.length; i++) {
    const dd = DIST[i] - DIST[i-1];
    simTime += dd / (speedArr[i] / 3.6);
  }
  // Scale all speeds by the ratio needed to match target lap time
  const scale = simTime / targetSeconds;
  return speedArr.map(v => Math.round(v * scale));
}

// ─── BRAKING ZONES ────────────────────────────────────────────────────────────
// [distStart, distEnd, peakPressure%]
const BASE_BZ = [
  [618,728,92],[1078,1200,80],[1515,1642,68],[2268,2395,100],
  [2990,3112,88],[3430,3538,90],[4095,4215,74],[4430,4558,100],[4960,5065,70]
];

// Each driver shifts braking points slightly (negative = later/more aggressive)
/*
const BZ_SHIFT = {
  VER:0, LEC:3, SAI:5, PER:2, NOR:4, PIA:6, ALO:−3, RUS:4, HAM:−2, STR:8, ALB:10
};
*/
const BZ_SHIFT = {
  VER: 0,
  LEC: 3,
  SAI: 5,
  PER: 2,
  NOR: 4,
  PIA: 6,
  ALO: -3,
  RUS: 4,
  HAM: -2,
  STR: 8,
  ALB: 10
};

function getDriverBZ(code) {
  const shift = BZ_SHIFT[code] || 0;
  return BASE_BZ.map(([s,e,p]) => [s+shift, e+shift, p]);
}

// Throttle ramp zones [start, end]
const BASE_RAMPS = [
  [728,910],[1200,1430],[1642,1930],[2395,2700],
  [3112,3380],[3538,3720],[4215,4428],[4561,4800],[5065,5280]
];

// Each driver has a different throttle aggression (how quickly they open)
const THR_AGGRESSION = {
  VER:1.0, LEC:0.95, SAI:0.92, PER:0.88, NOR:0.93,
  PIA:0.90, ALO:0.97, RUS:0.91, HAM:0.96, STR:0.85, ALB:0.82
};

function getThrottle(d, bz, aggression) {
  for (const [s,e] of bz) { if (d>=s && d<=e) return 0; }
  for (const [s,e] of BASE_RAMPS) {
    if (d>=s && d<=e) {
      const t = (d-s)/(e-s);
      return Math.round(Math.pow(t, 2/aggression) * 100);
    }
  }
  return 100;
}

function getBrake(d, bz) {
  for (const [s,e,p] of bz) {
    if (d>=s && d<=e) {
      const t=(d-s)/(e-s);
      const profile=t<0.35?t/0.35:t<0.65?1:(1-t)/0.35;
      return Math.max(0, Math.min(100, Math.round(profile*p)));
    }
  }
  return 0;
}

function speedToGear(v) {
  if(v<75)return 1; if(v<110)return 2; if(v<145)return 3;
  if(v<185)return 4; if(v<225)return 5; if(v<265)return 6;
  if(v<295)return 7; return 8;
}

// RPM model: F1 engines rev to ~15,000 RPM
// RPM ∝ speed × gear_ratio_factor — approximated per gear
const GEAR_RPM_FACTOR = [0, 190, 145, 112, 88, 70, 58, 48, 41];
function speedToRPM(v, g) {
  const base = v * (GEAR_RPM_FACTOR[g] || 50);
  return Math.round(Math.min(15200, Math.max(6000, base)));
}

// ─── TYRE DEGRADATION ─────────────────────────────────────────────────────────
function buildTyreDeg(base, rate, cliff, noise, laps, rng) {
  return Array.from({length:laps}, (_,i) => {
    const lin  = base + rate*i;
    const th   = cliff * Math.pow(Math.max(0, i - laps*0.55), 1.8) * 0.004;
    return parseFloat((lin + th + (rng()-0.5)*noise).toFixed(3));
  });
}

// ─── FUEL MODEL ───────────────────────────────────────────────────────────────
export const FUEL_LAPS = Array.from({length:44}, (_,i) => {
  const fuelMass = Math.max(0, 105 - 2.4*i);
  const bonus = (105 - fuelMass) * 0.035;
  const rng = mkRng(99+i);
  return parseFloat((92.2 - bonus + (rng()-0.5)*0.04).toFixed(3));
});

// ─── MAIN BUILD FUNCTION ──────────────────────────────────────────────────────
const _cache = {};

export function buildDriverTelemetry(code) {
  if (_cache[code]) return _cache[code];

  const rng = mkRng(code.split('').reduce((a,c)=>a+c.charCodeAt(0),0));
  const offsets = DRIVER_OFFSETS[code] || [];
  const bz = getDriverBZ(code);
  const aggr = THR_AGGRESSION[code] || 0.9;

  // Build raw speed from base + offsets
  let rawSpeed = DIST.map(d => Math.round(lerpWP(BASE_WP, d)));
  rawSpeed = applyOffsets(rawSpeed, DIST, offsets);

  // Scale to match real qualifying lap time
  const speed = scaleToLapTime(rawSpeed, DRIVER_LAPTIME[code]);
  const throttle = DIST.map((d,i) => getThrottle(d, bz, aggr));
  const brake    = DIST.map((d)   => getBrake(d, bz));
  const gear     = speed.map(speedToGear);
  const rpm      = speed.map((v,i) => speedToRPM(v, gear[i]));

  // Tyre degradation (per driver, slightly different rates)
  const rf = 0.9 + rng()*0.2;
  const r1=mkRng(rng()*999|0), r2=mkRng(rng()*999|0), r3=mkRng(rng()*999|0);
  const softDeg   = buildTyreDeg(90.45+rng()*0.15, 0.068*rf, 1.8*rf, 0.06, 20, r1);
  const medDeg    = buildTyreDeg(91.18+rng()*0.12, 0.035*rf, 0.6*rf, 0.04, 28, r2);
  const hardDeg   = buildTyreDeg(91.82+rng()*0.08, 0.015*rf, 0.3*rf, 0.03, 38, r3);

  // Subsampled for rendering
  const ss = (a) => a.filter((_,i)=>i%2===0);

  const tel = {
    code, speed, throttle, brake, gear, rpm,
    softDeg, medDeg, hardDeg,
    s: {
      dist: ss(DIST), speed: ss(speed), throttle: ss(throttle),
      brake: ss(brake), gear: ss(gear), rpm: ss(rpm),
    }
  };

  _cache[code] = tel;
  return tel;
}

// ─── LAP DELTA (vs VER) ────────────────────────────────────────────────────────
export function computeDelta(speedA, speedB) {
  const d = [0];
  for (let i=1; i<speedA.length; i++) {
    const dx = DIST[i]-DIST[i-1];
    const ta = dx/(speedA[i]/3.6);
    const tb = dx/(speedB[i]/3.6);
    d.push(parseFloat((d[i-1]+(tb-ta)).toFixed(4)));
  }
  return d;
}

// ─── SECTOR SPLITS ────────────────────────────────────────────────────────────
export const SECTORS = [
  {id:'S1', name:'Sector 1', start:0,    end:1900},
  {id:'S2', name:'Sector 2', start:1900, end:3200},
  {id:'S3', name:'Sector 3', start:3200, end:5412},
];

export function sectorTime(speedArr, start, end) {
  let t = 0;
  for (let i=1; i<DIST.length; i++) {
    if (DIST[i] >= start && DIST[i] <= end) {
      const dx = DIST[i]-DIST[i-1];
      t += dx/(speedArr[i]/3.6);
    }
  }
  return parseFloat(t.toFixed(3));
}

// Pre-build all drivers at import time (fast, ~2ms each)
export const ALL_TELEMETRY = {};
['VER','LEC','SAI','PER','NOR','PIA','ALO','RUS','HAM','STR','ALB'].forEach(c => {
  ALL_TELEMETRY[c] = buildDriverTelemetry(c);
});
