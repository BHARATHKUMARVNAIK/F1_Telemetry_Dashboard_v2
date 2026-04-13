import { useMemo } from 'react';
import LineChart from '../LineChart.jsx';
import { MetricCard, InfoCard, Legend, SectionLabel } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { ALL_TELEMETRY, DIST, computeDelta, SECTORS, sectorTime } from '../../data/telemetry.js';
import { DRS_ZONES, CORNERS } from '../../data/circuit.js';
import { DRIVER_COLORS, DRIVER_LAPTIME } from '../../utils/colors.js';
import { sub, fmtDelta } from '../../utils/math.js';

const sDist = sub(DIST);

export default function LapDelta() {
  const { selectedDrivers } = useDashboard();

  // Reference = fastest driver in selection
  const refCode = useMemo(() =>
    selectedDrivers.reduce((best, code) =>
      DRIVER_LAPTIME[code] < DRIVER_LAPTIME[best] ? code : best,
      selectedDrivers[0]
    ), [selectedDrivers]);

  const refSpeed = ALL_TELEMETRY[refCode].speed;

  const deltaSeries = useMemo(() =>
    selectedDrivers
      .filter(code => code !== refCode)
      .map(code => {
        const raw = computeDelta(refSpeed, ALL_TELEMETRY[code].speed);
        return {
          label: `${code} vs ${refCode}`,
          data: sub(raw),
          color: DRIVER_COLORS[code],
          unit: 's',
          width: 2.5,
        };
      }), [selectedDrivers, refCode]);

  // Final delta for each driver
  const finalDeltas = useMemo(() =>
    selectedDrivers.map(code => {
      if (code === refCode) return { code, delta: 0 };
      const raw = computeDelta(refSpeed, ALL_TELEMETRY[code].speed);
      return { code, delta: raw[raw.length - 1] };
    }), [selectedDrivers, refCode]);

  // Sector times
  const sectorData = useMemo(() =>
    SECTORS.map(sec => ({
      ...sec,
      times: selectedDrivers.map(code => ({
        code,
        time: sectorTime(ALL_TELEMETRY[code].speed, sec.start, sec.end),
      })),
    })), [selectedDrivers]);

  const allDeltas = deltaSeries.flatMap(s => s.data);
  const yMin = Math.min(...allDeltas, 0) - 0.08;
  const yMax = Math.max(...allDeltas, 0) + 0.08;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:9, marginBottom:'1rem' }}>
        {finalDeltas.map(({ code, delta }) => (
          <MetricCard key={code}
            label={code === refCode ? `${code} (REF)` : `${code} vs ${refCode}`}
            value={code === refCode ? 'POLE' : fmtDelta(delta)}
            sub={code === refCode ? 'Reference driver' : delta > 0 ? `${code} is slower` : `${code} is faster`}
            color={DRIVER_COLORS[code]}
            accent={DRIVER_COLORS[code]}
          />
        ))}
      </div>

      {deltaSeries.length > 0 ? (
        <>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>
            <span style={{ color:'#3B82F6' }}>Below zero</span> = faster than {refCode} &nbsp;·&nbsp;
            <span style={{ color:'#EF4444' }}>Above zero</span> = slower than {refCode} &nbsp;·&nbsp;
            Reference: <strong style={{ color: DRIVER_COLORS[refCode] }}>{refCode}</strong>
          </div>
          <Legend items={deltaSeries.map(s => ({ color: s.color, label: s.label }))} />
          <LineChart
            series={deltaSeries}
            xData={sDist}
            yMin={yMin} yMax={yMax}
            yLabel="Gap (s)" height={300}
            drsZones={DRS_ZONES}
            zeroline
            corners={CORNERS}
          />
        </>
      ) : (
        <div style={{ padding:'2rem', textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:13 }}>
          Select at least 2 drivers to see the gap trace
        </div>
      )}

      {/* Sector time comparison */}
      <SectionLabel style={{ marginTop:'1.5rem' }}>Sector time comparison</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {sectorData.map(sec => {
          const bestTime = Math.min(...sec.times.map(t => t.time));
          return (
            <div key={sec.id} style={{ background:'#14141f', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:13 }}>{sec.name}</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{sec.start}–{sec.end}m</span>
              </div>
              {sec.times.sort((a,b)=>a.time-b.time).map(({ code, time }) => {
                const delta = time - bestTime;
                const isBest = delta === 0;
                return (
                  <div key={code} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}>
                      <span style={{ width:7,height:7,borderRadius:'50%',background:DRIVER_COLORS[code],flexShrink:0 }}/>
                      <span style={{ color:DRIVER_COLORS[code], fontWeight:600 }}>{code}</span>
                    </span>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,0.7)' }}>{time.toFixed(3)}s</span>
                      {!isBest && (
                        <span style={{ fontSize:10, color:'#F87171', marginLeft:6 }}>+{delta.toFixed(3)}</span>
                      )}
                      {isBest && (
                        <span style={{ fontSize:9, color:'#22C55E', marginLeft:6, fontWeight:700 }}>⚡BEST</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
        <InfoCard accent="#8B5CF6" title="Gap trace explained"
          body="The gap trace plots cumulative time difference between drivers at each point on track. A rising line means the compared driver is losing time at that section; a falling line means they're gaining. Crossing zero = lead change. This is the most actionable race-engineering chart — it pinpoints exactly where time is built or lost." />
        <InfoCard accent="#3B82F6" title="Sector timing"
          body="Each circuit is divided into three sectors for timing purposes. Sector 1 covers the main straight and first corners; Sector 2 the technical mid-section; Sector 3 the run to the finish. Comparing sector times shows which car concept is better suited to each type of racing section." />
        <InfoCard accent="#F59E0B" title="Reference driver selection"
          body="The gap trace always computes gap against the fastest selected driver (automatic pole reference). This means you can add a backmarker and immediately see where they lose time relative to the benchmark — the same approach used by engineers when onboarding a new driver to a team." />
      </div>
    </div>
  );
}
