/**
 * LineChart — multi-driver synchronized SVG line chart
 *
 * Supports:
 *  - N driver series with persistent color mapping
 *  - Hover sync via DashboardContext (hovering one chart syncs all others)
 *  - DRS zone shading
 *  - Corner label markers on x-axis
 *  - Zeroline + split fill for delta charts
 *  - Smooth SVG polyline rendering (zero dependencies)
 */

import { useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext.jsx';
import { sub } from '../utils/math.js';

const W = 820;
const PAD = { t: 14, r: 22, b: 42, l: 58 };

export default function LineChart({
  series,      // [{ code, label, data, color, fill, dash, unit, width }]
  xData,       // array of x values (distances)
  yMin, yMax,
  yLabel,
  height = 230,
  drsZones,
  zeroline,
  corners,
  formatY,     // optional custom y-axis formatter
}) {
  const { hoverIndex, setHoverIndex } = useDashboard();
  const H = height;
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const xRange = xData[xData.length - 1] - xData[0];
  const yRange = yMax - yMin;

  const px = (xv) => PAD.l + ((xv - xData[0]) / xRange) * cW;
  const py = (yv) => PAD.t + (1 - Math.max(0, Math.min(1, (yv - yMin) / yRange))) * cH;

  const toPoints = (ys) =>
    ys.map((y, i) => `${px(xData[i]).toFixed(1)},${py(y).toFixed(1)}`).join(' ');

  // Sync hover across all charts
  const onMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, ((e.clientX - rect.left) / rect.width * W - PAD.l) / cW));
    setHoverIndex(Math.round(fraction * (xData.length - 1)));
  }, [xData, cW, setHoverIndex]);

  const hoverX = hoverIndex !== null ? px(xData[Math.min(hoverIndex, xData.length-1)]) : null;

  const yStep = (yMax - yMin) / 5;
  const yTicks = Array.from({length:6}, (_,i) => yMin + yStep * i);
  const xTicks = Array.from({length:12}, (_,i) => i*500).filter(v => v <= 5412);

  const fmtY = formatY || ((v) => Number.isInteger(v) ? v : v.toFixed(1));

  const tooltipRight = hoverIndex !== null && (hoverIndex / xData.length) > 0.62;

  return (
    <div style={{ position:'relative', userSelect:'none' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`} width="100%"
        style={{ display:'block', overflow:'visible' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* DRS zones */}
        {drsZones?.map(({start,end,label},k) => (
          <g key={k}>
            <rect x={px(start)} y={PAD.t} width={Math.max(0,px(end)-px(start))} height={cH}
              fill="rgba(34,197,94,0.07)" />
            <text x={(px(start)+px(end))/2} y={PAD.t+10} textAnchor="middle"
              fontSize={8} fill="rgba(34,197,94,0.7)" fontWeight={700}>DRS</text>
          </g>
        ))}

        {/* Grid */}
        {yTicks.map(v => (
          <line key={v} x1={PAD.l} x2={PAD.l+cW} y1={py(v)} y2={py(v)}
            stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>
        ))}
        {xTicks.map(v => (
          <line key={v} x1={px(v)} x2={px(v)} y1={PAD.t} y2={PAD.t+cH}
            stroke="rgba(255,255,255,0.03)" strokeWidth={0.5}/>
        ))}

        {/* Zero line for delta charts */}
        {zeroline && (
          <>
            <defs>
              <clipPath id="above"><rect x={PAD.l} y={PAD.t} width={cW} height={Math.max(0,py(0)-PAD.t)}/></clipPath>
              <clipPath id="below"><rect x={PAD.l} y={py(0)} width={cW} height={Math.max(0,PAD.t+cH-py(0))}/></clipPath>
            </defs>
            <line x1={PAD.l} x2={PAD.l+cW} y1={py(0)} y2={py(0)}
              stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeDasharray="4 3"/>
            {series[0] && (
              <>
                <polygon clipPath="url(#above)"
                  points={`${px(xData[0])},${py(0)} ${toPoints(series[0].data)} ${px(xData[xData.length-1])},${py(0)}`}
                  fill="rgba(59,130,246,0.16)"/>
                <polygon clipPath="url(#below)"
                  points={`${px(xData[0])},${py(0)} ${toPoints(series[0].data)} ${px(xData[xData.length-1])},${py(0)}`}
                  fill="rgba(239,68,68,0.16)"/>
              </>
            )}
          </>
        )}

        {/* Area fills */}
        {!zeroline && series.map((s,si) => s.fill && (
          <polygon key={si}
            points={`${px(xData[0])},${py(yMin)} ${toPoints(s.data)} ${px(xData[xData.length-1])},${py(yMin)}`}
            fill={s.fill}/>
        ))}

        {/* Series lines */}
        {series.map((s,si) => (
          <polyline key={si} points={toPoints(s.data)}
            fill="none" stroke={s.color} strokeWidth={s.width||2}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={s.dash||'none'}/>
        ))}

        {/* Corner markers */}
        {corners?.map(c => (
          <g key={c.n}>
            <line x1={px(c.dist)} x2={px(c.dist)} y1={PAD.t+cH} y2={PAD.t+cH+5}
              stroke="rgba(255,255,255,0.18)" strokeWidth={1}/>
            <text x={px(c.dist)} y={H-2} textAnchor="middle"
              fontSize={7} fill="rgba(255,255,255,0.3)">{c.n}</text>
          </g>
        ))}

        {/* Hover crosshair */}
        {hoverX !== null && (
          <>
            <line x1={hoverX} x2={hoverX} y1={PAD.t} y2={PAD.t+cH}
              stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeDasharray="3 2"/>
            {series.map((s,si) => {
              const idx = Math.min(hoverIndex, s.data.length-1);
              return (
                <circle key={si} cx={hoverX} cy={py(s.data[idx])} r={4}
                  fill={s.color} opacity={0.9}
                  stroke={s.color} strokeOpacity={0.3} strokeWidth={7}/>
              );
            })}
          </>
        )}

        {/* Y-axis labels */}
        {yTicks.map(v => (
          <text key={v} x={PAD.l-7} y={py(v)+4} textAnchor="end"
            fontSize={9} fill="rgba(255,255,255,0.35)">{fmtY(v)}</text>
        ))}

        {/* X-axis labels */}
        {xTicks.filter((_,i)=>i%2===0).map(v => (
          <text key={v} x={px(v)} y={H-(corners?20:8)} textAnchor="middle"
            fontSize={9} fill="rgba(255,255,255,0.3)">{v}m</text>
        ))}

        {/* Axis titles */}
        <text x={12} y={PAD.t+cH/2} textAnchor="middle"
          fontSize={10} fill="rgba(255,255,255,0.3)"
          transform={`rotate(-90,12,${PAD.t+cH/2})`}>{yLabel}</text>
      </svg>

      {/* Floating tooltip */}
      {hoverIndex !== null && (
        <div style={{
          position:'absolute', top:8, pointerEvents:'none', zIndex:30,
          left: tooltipRight ? 'auto' : `calc(${(hoverX/W)*100}% + 10px)`,
          right: tooltipRight ? `calc(${((W-hoverX)/W)*100}% + 10px)` : 'auto',
          background:'rgba(14,14,24,0.97)',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:8, padding:'8px 12px', minWidth:140,
        }}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:6,fontWeight:500}}>
            📍 {xData[Math.min(hoverIndex,xData.length-1)]}m
          </div>
          {series.map((s,si) => {
            const idx = Math.min(hoverIndex, s.data.length-1);
            const v = s.data[idx];
            const fmt = typeof v==='number' ? (Math.abs(v)<1?v.toFixed(3):v.toFixed(1)) : v;
            return (
              <div key={si} style={{color:s.color, marginBottom:2, fontWeight:500, fontSize:11}}>
                {s.label}: {fmt}{s.unit||''}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
