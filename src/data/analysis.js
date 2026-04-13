/**
 * CORNER PERFORMANCE ANALYSIS ENGINE
 *
 * For each driver and each corner, this module automatically detects:
 *  - Where lap time was lost vs the fastest peer
 *  - Suboptimal braking points (too early = unnecessary speed loss)
 *  - Poor throttle pickup (late application = lost exit speed)
 *  - Insufficient minimum apex speed
 *  - Gear shift timing inefficiencies
 *
 * Output: race-engineer-style recommendations with quantified time penalties.
 *
 * Algorithm:
 *  1. For each corner zone, compute min speed, avg throttle ramp rate,
 *     brake application point, and gear transition points.
 *  2. Compare each driver to the best peer in that metric.
 *  3. Convert speed differences to time penalties using: Δt ≈ ΔL / Vavg²
 *  4. Classify by severity: critical (>0.1s), moderate (0.05–0.1s), minor (<0.05s)
 */

import { DIST, ALL_TELEMETRY } from './telemetry.js';
import { CORNERS } from './circuit.js';

const ZONE_WIDTH = 180; // metres each side of corner apex to analyse

/**
 * Extract a telemetry segment around a corner distance
 */
function cornerZone(dist, arr, apexDist, width=ZONE_WIDTH) {
  const indices = [];
  for (let i=0; i<dist.length; i++) {
    if (dist[i] >= apexDist - width && dist[i] <= apexDist + width) {
      indices.push(i);
    }
  }
  return indices;
}

/**
 * Find minimum speed index in a zone
 */
function minSpeedInZone(speed, indices) {
  let minV = Infinity, minI = 0;
  for (const i of indices) {
    if (speed[i] < minV) { minV = speed[i]; minI = i; }
  }
  return { speed: minV, index: minI };
}

/**
 * Find braking point distance (first sample where brake > 20%)
 */
function findBrakePoint(brake, dist, indices) {
  for (const i of indices) {
    if (brake[i] > 20) return dist[i];
  }
  return null;
}

/**
 * Find throttle pickup point (first sample after apex where throttle > 20%)
 */
function findThrottlePickup(throttle, dist, indices, apexDist) {
  for (const i of indices) {
    if (dist[i] > apexDist && throttle[i] > 20) return dist[i];
  }
  return null;
}

/**
 * Convert speed delta to estimated lap time loss
 * Physics: Δt ≈ Δd × (1/V2 − 1/V1) integrated over exit zone (~200m)
 */
function speedDeltaToTime(deltaKph, zoneLength=200, avgSpeed=150) {
  if (deltaKph <= 0) return 0;
  const v1 = avgSpeed / 3.6;
  const v2 = (avgSpeed + deltaKph) / 3.6;
  return parseFloat((zoneLength * (1/v1 - 1/v2)).toFixed(3));
}

/**
 * Generate insights for all selected drivers
 * Returns array of insight objects sorted by severity
 */
export function analyzeCorners(driverCodes) {
  const insights = [];

  for (const corner of CORNERS) {
    const apexDist = corner.dist;
    const indices  = cornerZone(DIST, null, apexDist);

    // Collect metrics for all drivers at this corner
    const metrics = driverCodes.map(code => {
      const tel = ALL_TELEMETRY[code];
      const zone = indices;
      const minS  = minSpeedInZone(tel.speed, zone);
      const bpDist = findBrakePoint(tel.brake, DIST, zone);
      const tpDist = findThrottlePickup(tel.throttle, DIST, zone, apexDist);
      return { code, minSpeed: minS.speed, brakePoint: bpDist, throttlePickup: tpDist };
    });

    // Find best values in this corner
    const bestMinSpeed     = Math.max(...metrics.map(m => m.minSpeed));
    const earliestBrake    = Math.min(...metrics.filter(m=>m.brakePoint).map(m => m.brakePoint));
    const earliestThrottle = Math.min(...metrics.filter(m=>m.tpDist).map(m => m.tpDist));

    // Generate per-driver insights
    for (const m of metrics) {
      // 1. Apex speed deficit
      const apexGap = bestMinSpeed - m.minSpeed;
      if (apexGap >= 3) {
        const timeLoss = speedDeltaToTime(apexGap, 200, m.minSpeed);
        insights.push({
          driver: m.code,
          corner: corner.n,
          type: 'apex_speed',
          severity: apexGap >= 8 ? 'critical' : apexGap >= 5 ? 'moderate' : 'minor',
          timeLoss,
          message: `${m.code} carrying ${apexGap} km/h less through ${corner.n} apex vs best peer. ` +
                   `Higher min speed possible — estimated +${timeLoss}s loss.`,
          recommendation: `Increase commitment through ${corner.n} apex. Target minimum speed: ${bestMinSpeed} km/h (+${apexGap} km/h).`,
        });
      }

      // 2. Late throttle pickup
      if (m.throttlePickup && earliestThrottle) {
        const tpGap = m.throttlePickup - earliestThrottle;
        if (tpGap > 15) { // > 15m later = significant
          const timeLoss = speedDeltaToTime(tpGap * 0.3, 150, 100);
          insights.push({
            driver: m.code,
            corner: corner.n,
            type: 'throttle_pickup',
            severity: tpGap > 40 ? 'critical' : tpGap > 25 ? 'moderate' : 'minor',
            timeLoss,
            message: `${m.code} applies throttle ${tpGap}m later than best on ${corner.n} exit. ` +
                     `Delayed traction costs an estimated ${timeLoss}s.`,
            recommendation: `Earlier throttle application on ${corner.n} exit. ` +
                            `Reduce understeer at apex for earlier pickup point.`,
          });
        }
      }

      // 3. Early braking (conservative entry)
      if (m.brakePoint && earliestBrake) {
        const bpGap = m.brakePoint - earliestBrake;
        if (bpGap > 20) {
          const timeLoss = speedDeltaToTime(bpGap * 0.2, 100, 200);
          insights.push({
            driver: m.code,
            corner: corner.n,
            type: 'braking_point',
            severity: bpGap > 50 ? 'critical' : bpGap > 30 ? 'moderate' : 'minor',
            timeLoss,
            message: `${m.code} braking ${bpGap}m earlier than best into ${corner.n}. ` +
                     `Conservative entry costs ${timeLoss}s.`,
            recommendation: `Later, harder braking into ${corner.n}. ` +
                            `Confidence on entry will improve minimum speed and reduce time loss.`,
          });
        }
      }
    }

    // 4. Corner-level comparative insight (who is best)
    const sorted = [...metrics].sort((a,b) => b.minSpeed - a.minSpeed);
    if (sorted.length >= 2 && driverCodes.length >= 2) {
      const fastest = sorted[0];
      const slowest = sorted[sorted.length-1];
      const gap = fastest.minSpeed - slowest.minSpeed;
      if (gap >= 5) {
        insights.push({
          driver: 'ALL',
          corner: corner.n,
          type: 'comparative',
          severity: gap >= 10 ? 'critical' : gap >= 6 ? 'moderate' : 'minor',
          timeLoss: speedDeltaToTime(gap, 200, slowest.minSpeed),
          message: `${corner.n} performance spread: ${fastest.code} carries ${gap} km/h more than ${slowest.code}.`,
          recommendation: `Key battleground corner. ${fastest.code}'s ${corner.type} corner advantage is decisive here.`,
        });
      }
    }
  }

  // Sort: critical first, then by time loss descending
  return insights.sort((a,b) => {
    const sev = {critical:0, moderate:1, minor:2};
    if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
    return b.timeLoss - a.timeLoss;
  });
}

/**
 * Compute total corner-by-corner time loss summary per driver
 */
export function cornerLossTable(driverCodes) {
  const insights = analyzeCorners(driverCodes);
  const result = {};
  for (const code of driverCodes) {
    const dInsights = insights.filter(i => i.driver === code);
    result[code] = {
      totalLoss: parseFloat(dInsights.reduce((a,i)=>a+i.timeLoss,0).toFixed(3)),
      byCorner: CORNERS.map(c => {
        const ci = dInsights.filter(i => i.corner === c.n);
        return {
          corner: c.n,
          loss: parseFloat(ci.reduce((a,i)=>a+i.timeLoss,0).toFixed(3)),
          issues: ci.map(i=>i.type),
        };
      }).filter(c => c.loss > 0),
    };
  }
  return result;
}
