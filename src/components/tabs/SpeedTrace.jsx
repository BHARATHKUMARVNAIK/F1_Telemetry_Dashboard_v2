import { useMemo } from 'react';
import LineChart from '../LineChart.jsx';
import { MetricCard, InfoCard, Legend, SectionLabel } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { ALL_TELEMETRY, DIST, computeDelta } from '../../data/telemetry.js';
import { DRS_ZONES, CORNERS } from '../../data/circuit.js';
import { DRIVER_COLORS, DRIVER_LAPTIME, withAlpha } from '../../utils/colors.js';
import { fmtLap, sub } from '../../utils/math.js';

const sDist = sub(DIST);

export default function SpeedTrace() {
  const { selectedDrivers } = useDashboard();

  const series = useMemo(() =>
    selectedDrivers.map(code => ({
      code, label: code,
      data: ALL_TELEMETRY[code].s.speed,
      color: DRIVER_COLORS[code],
      unit: ' km/h',
    })), [selectedDrivers]);

  const stats = useMemo(() =>
    selectedDrivers.map(code => {
      const spd = ALL_TELEMETRY[code].speed;
      return {
        code,
        top: Math.max(...spd),
        min: Math.min(...spd),
        lapTime: DRIVER_LAPTIME[code],
        color: DRIVER_COLORS[code],
      };
    }), [selectedDrivers]);

  const fastest = stats.reduce((a, b) => a.lapTime < b.lapTime ? a : b);

  return (
    <div>
      {/* Metrics per driver */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px,1fr))', gap: 9, marginBottom: '1rem' }}>
        {stats.map(s => (
          <MetricCard key={s.code}
            label={`${s.code} Lap Time`}
            value={fmtLap(s.lapTime)}
            sub={`Top: ${s.top} · Min: ${s.min} km/h`}
            color={s.color} accent={s.color}
          />
        ))}
        <MetricCard
          label="Fastest Driver"
          value={fastest.code}
          sub={fmtLap(fastest.lapTime)}
          color={fastest.color} accent={fastest.color}
        />
      </div>

      <Legend items={[
        ...selectedDrivers.map(code => ({ color: DRIVER_COLORS[code], label: code })),
        { color: 'rgba(34,197,94,0.6)', label: 'DRS zones', dash: '5 3' },
      ]} />

      <LineChart
        series={series}
        xData={sDist} yMin={55} yMax={330}
        yLabel="Speed (km/h)" height={320}
        drsZones={DRS_ZONES} corners={CORNERS}
      />

      {/* Per-driver lap time delta table */}
      <SectionLabel style={{ marginTop: '1.25rem' }}>Qualifying gap to pole (VER reference)</SectionLabel>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Driver', 'Lap Time', 'Gap to Pole', 'Top Speed', 'Min Speed'].map(h => (
                <th key={h} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.sort((a,b)=>a.lapTime-b.lapTime).map((s, i) => {
              const gap = s.lapTime - fastest.lapTime;
              return (
                <tr key={s.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0 }}/>
                      <strong style={{ color:s.color, fontWeight:700 }}>{s.code}</strong>
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px', fontFamily:'monospace', fontSize:12, color:'#eeeef5' }}>{fmtLap(s.lapTime)}</td>
                  <td style={{ padding:'8px 10px', fontFamily:'monospace', color: gap === 0 ? '#22C55E' : '#F87171' }}>
                    {gap === 0 ? 'POLE' : `+${gap.toFixed(3)}s`}
                  </td>
                  <td style={{ padding:'8px 10px', color: s.color, fontWeight:600 }}>{s.top} km/h</td>
                  <td style={{ padding:'8px 10px', color:'rgba(255,255,255,0.55)' }}>{s.min} km/h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginTop:'1.25rem' }}>
        <InfoCard accent="#3B82F6" title="Multi-driver speed trace"
          body="Overlaying 3–5 speed traces reveals the exact track sections where each car has a performance advantage. Straight-line speed divergence exposes power unit and drag differences; corner speed divergence reveals aerodynamic downforce and mechanical grip hierarchy." />
        <InfoCard accent="#22C55E" title="DRS activation"
          body="Green-shaded zones are DRS regions — drivers open the rear wing flap here, adding 12–15 km/h. In qualifying, every driver uses DRS every lap. The speed step between DRS-open and closed is visible as a kink in each speed trace at zone entry." />
        <InfoCard accent="#F59E0B" title="Hover sync"
          body="Hover over any chart to see synchronized values across all channels simultaneously. This mirrors the real pit wall workflow where engineers inspect all telemetry channels at the same track position when diagnosing a performance issue." />
      </div>
    </div>
  );
}
