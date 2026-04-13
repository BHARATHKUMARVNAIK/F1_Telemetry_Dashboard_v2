/**
 * TrackMap — SVG Bahrain circuit with telemetry overlay
 *
 * Modes:
 *   speed    — color-coded speed heatmap along racing line
 *   throttle — green=open, red=closed
 *   brake    — red intensity = brake pressure
 *   gear     — color per gear number (1=dark, 8=bright)
 *   drs      — show DRS activation zones
 *
 * The circuit is rendered using:
 *   1. A static grey track outline (bezier path approximation)
 *   2. Per-driver colored dots along the racing line showing channel value
 *   3. Corner labels positioned at each corner's SVG coordinate
 *   4. DRS zone overlays
 *
 * The racing line is a 100-point polyline approximating the Bahrain layout.
 * Each point maps to a lap distance, allowing telemetry values to be
 * interpolated and color-mapped at every position on track.
 */

import { useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext.jsx';
import { ALL_TELEMETRY, DIST } from '../data/telemetry.js';
import { CORNER_SVG, DRS_SVG } from '../data/circuit.js';
import { DRIVER_COLORS, withAlpha } from '../utils/colors.js';
import { clamp } from '../utils/math.js';

// ─── BAHRAIN TRACK CENTER LINE POINTS ──────────────────────────────────────
// Hand-placed SVG coordinates approximating the Bahrain circuit centerline
// Each point: [x, y, approx_dist_metres]
const TRACK_POINTS = [
  [80,248,0],[120,248,150],[165,248,300],[210,248,450],[255,248,600],
  [300,248,750],[345,248,900],[390,248,1050],[425,248,1150],
  [455,248,1250],[480,245,1350],[502,238,1420],[516,224,1480],
  [522,208,1530],[520,192,1580],[512,178,1630],[498,166,1680],
  [482,158,1720],[464,154,1760],[446,157,1810],[432,167,1850],
  [424,180,1890],[422,196,1940],[428,210,1980],[440,220,2030],
  [456,226,2080],[470,226,2130],[483,220,2180],[492,208,2230],
  [496,194,2280],[494,180,2330],[486,168,2370],[474,160,2410],
  [458,156,2450],[438,158,2490],[422,165,2530],[408,176,2570],
  [398,188,2610],[394,202,2640],[396,216,2670],[404,228,2710],
  [418,236,2760],[436,240,2810],[452,240,2860],[464,234,2910],
  [470,222,2960],[468,208,3000],[460,196,3050],[446,188,3090],
  [428,185,3130],[410,185,3170],[394,189,3210],[380,196,3250],
  [368,206,3290],[360,218,3340],[356,232,3390],[356,248,3430],
  [360,264,3480],[368,276,3530],[380,284,3570],[396,288,3610],
  [412,288,3650],[426,284,3690],[436,274,3730],[440,260,3790],
  [438,244,3860],[428,230,3930],[412,218,4000],[394,208,4060],
  [374,202,4110],[354,200,4160],[334,202,4210],[316,208,4260],
  [302,218,4310],[292,230,4360],[288,244,4400],[290,258,4450],
  [298,268,4490],[310,274,4530],[324,274,4570],[336,268,4610],
  [342,256,4650],[340,242,4690],[330,230,4740],[314,222,4800],
  [294,218,4860],[272,218,4920],[250,222,4970],[232,230,5020],
  [218,240,5060],[206,252,5100],[196,266,5140],[186,282,5180],
  [176,296,5220],[168,308,5260],[158,318,5300],[148,322,5350],[136,318,5380],[80,248,5412]
];

// ─── COLOR MAPS ──────────────────────────────────────────────────────────────
function speedColor(v, min=60, max=320) {
  const t = clamp((v-min)/(max-min), 0, 1);
  // Jet-style: blue→cyan→green→yellow→red
  if (t < 0.25) { const u=t/0.25; return `rgb(0,${Math.round(u*255)},255)`; }
  if (t < 0.5)  { const u=(t-0.25)/0.25; return `rgb(0,255,${Math.round((1-u)*255)})`; }
  if (t < 0.75) { const u=(t-0.5)/0.25; return `rgb(${Math.round(u*255)},255,0)`; }
  const u=(t-0.75)/0.25; return `rgb(255,${Math.round((1-u)*255)},0)`;
}

function throttleColor(v) {
  // Red (closed) → Green (open)
  const t = clamp(v/100, 0, 1);
  return `rgb(${Math.round((1-t)*230)},${Math.round(t*200+30)},40)`;
}

function brakeColor(v) {
  const t = clamp(v/100, 0, 1);
  return t > 0.05
    ? `rgb(255,${Math.round((1-t)*80)},${Math.round((1-t)*60)})`
    : 'rgba(255,255,255,0.15)';
}

const GEAR_COLORS = ['','#4ADE80','#22D3EE','#3B82F6','#8B5CF6','#EC4899','#F97316','#EF4444','#FCD34D'];

function gearColor(g) { return GEAR_COLORS[clamp(g,1,8)] || '#888'; }

// ─── INTERPOLATE TELEMETRY AT TRACK POINT ────────────────────────────────────
function getTelAtDist(tel, channel, targetDist) {
  // Find nearest DIST index
  let best = 0, bestDiff = Infinity;
  for (let i=0; i<DIST.length; i++) {
    const d = Math.abs(DIST[i] - targetDist);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return tel[channel]?.[best] ?? 0;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function TrackMap({ height=420 }) {
  const { selectedDrivers, mapMode, setMapMode, hoverIndex, setHoverIndex } = useDashboard();

  const MODES = [
    { id:'speed',    label:'Speed',    unit:'km/h' },
    { id:'throttle', label:'Throttle', unit:'%' },
    { id:'brake',    label:'Brake',    unit:'%' },
    { id:'gear',     label:'Gear',     unit:'' },
    { id:'drs',      label:'DRS',      unit:'' },
  ];

  // Build colored segments per driver
  const driverOverlays = useMemo(() => {
    if (mapMode === 'drs') return [];
    return selectedDrivers.map((code, di) => {
      const tel = ALL_TELEMETRY[code];
      const offset = di * 3; // offset each driver's line slightly for visibility
      return TRACK_POINTS.map((pt, i) => {
        const [x, y, dist] = pt;
        let val, col;
        if (mapMode === 'speed') {
          val = getTelAtDist(tel, 'speed', dist);
          col = speedColor(val);
        } else if (mapMode === 'throttle') {
          val = getTelAtDist(tel, 'throttle', dist);
          col = throttleColor(val);
        } else if (mapMode === 'brake') {
          val = getTelAtDist(tel, 'brake', dist);
          col = brakeColor(val);
        } else if (mapMode === 'gear') {
          val = getTelAtDist(tel, 'gear', dist);
          col = gearColor(val);
        }
        return { x, y, col, val, dist };
      });
    });
  }, [selectedDrivers, mapMode]);

  // Build polyline points (with driver offset)
  const OFFSETS = [0, -4, 4, -8, 8];

  return (
    <div style={{ position:'relative' }}>
      {/* Mode selector */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={()=>setMapMode(m.id)} style={{
            padding:'5px 12px', fontSize:11, borderRadius:6,
            border:'1px solid rgba(255,255,255,0.14)',
            background: mapMode===m.id ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: mapMode===m.id ? '#eeeef5' : 'rgba(255,255,255,0.45)',
            cursor:'pointer', fontWeight: mapMode===m.id ? 600 : 400,
          }}>{m.label}</button>
        ))}

        {/* Color scale legend */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, fontSize:10, color:'rgba(255,255,255,0.4)' }}>
          {mapMode === 'speed' && (
            <>
              <span>60</span>
              <div style={{ width:80, height:6, borderRadius:3, background:'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)' }}/>
              <span>320 km/h</span>
            </>
          )}
          {mapMode === 'gear' && (
            <div style={{ display:'flex', gap:3 }}>
              {[1,2,3,4,5,6,7,8].map(g => (
                <span key={g} style={{ width:16, height:16, borderRadius:3, background:GEAR_COLORS[g], display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'rgba(0,0,0,0.7)' }}>{g}</span>
              ))}
            </div>
          )}
          {mapMode === 'throttle' && (
            <>
              <span style={{color:'#ef4444'}}>■</span><span>Closed</span>
              <span style={{color:'#22c55e'}}>■</span><span>Open</span>
            </>
          )}
          {mapMode === 'brake' && (
            <>
              <span style={{color:'rgba(255,255,255,0.3)'}}>■</span><span>None</span>
              <span style={{color:'#ef4444'}}>■</span><span>Max</span>
            </>
          )}
        </div>
      </div>

      {/* Driver line legend */}
      <div style={{ display:'flex', gap:14, marginBottom:10, fontSize:11, flexWrap:'wrap' }}>
        {selectedDrivers.map(code => (
          <span key={code} style={{ display:'flex', alignItems:'center', gap:5, color: DRIVER_COLORS[code] }}>
            <span style={{ width:24, height:3, background:DRIVER_COLORS[code], borderRadius:2, display:'inline-block' }}/>
            {code}
          </span>
        ))}
      </div>

      {/* SVG circuit */}
      <div style={{ background:'#0e0e18', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
        <svg viewBox="0 0 600 380" width="100%" style={{ display:'block' }}>

          {/* Circuit background outline */}
          <path
            d={`M ${TRACK_POINTS.map(([x,y])=>`${x},${y}`).join(' L ')} Z`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${TRACK_POINTS.map(([x,y])=>`${x},${y}`).join(' L ')} Z`}
            fill="none"
            stroke="#1a1a28"
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Telemetry overlays per driver */}
          {mapMode !== 'drs' && driverOverlays.map((pts, di) => {
            const offset = OFFSETS[di] || 0;
            // Render as colored line segments
            return pts.map((pt, pi) => {
              if (pi === 0) return null;
              const prev = pts[pi-1];
              // Perpendicular offset for multi-driver separation
              const dx = pt.x - prev.x, dy = pt.y - prev.y;
              const len = Math.sqrt(dx*dx+dy*dy)||1;
              const ox = (-dy/len)*offset, oy = (dx/len)*offset;
              return (
                <line key={pi}
                  x1={prev.x+ox} y1={prev.y+oy}
                  x2={pt.x+ox}   y2={pt.y+oy}
                  stroke={pt.col} strokeWidth={3.5}
                  strokeLinecap="round" opacity={0.9}/>
              );
            });
          })}

          {/* DRS zones */}
          {(mapMode === 'drs' || true) && (
            <>
              {/* DRS 1 — main straight */}
              {TRACK_POINTS.filter(([,,d])=>d>=0&&d<=680).map(([x,y,d],i) => (
                <circle key={i} cx={x} cy={y} r={5} fill="rgba(34,197,94,0.55)" opacity={mapMode==='drs'?1:0.3}/>
              ))}
              {/* DRS 2 — back straight approximate */}
              {TRACK_POINTS.filter(([,,d])=>d>=3700&&d<=4100).map(([x,y,d],i) => (
                <circle key={i} cx={x} cy={y} r={5} fill="rgba(34,197,94,0.55)" opacity={mapMode==='drs'?1:0.3}/>
              ))}
              {mapMode==='drs' && (
                <>
                  <text x={170} y={236} fontSize={9} fill="#22c55e" fontWeight={700}>DRS 1</text>
                  <text x={396} y={188} fontSize={9} fill="#22c55e" fontWeight={700}>DRS 2</text>
                </>
              )}
            </>
          )}

          {/* Start/Finish line */}
          <rect x={79} y={236} width={4} height={24} fill="#fff" opacity={0.7}/>
          <text x={90} y={244} fontSize={8} fill="rgba(255,255,255,0.5)">S/F</text>

          {/* Corner labels */}
          {CORNER_SVG.map(c => {
            const typeColors = {fast:'#60A5FA', medium:'#4ADE80', slow:'#F87171', hairpin:'#FCD34D', chicane:'#A78BFA'};
            return (
              <g key={c.n}>
                <circle cx={c.x} cy={c.y} r={7} fill={typeColors[c.type]||'#888'} opacity={0.85}/>
                <text x={c.x} y={c.y+4} textAnchor="middle" fontSize={6.5} fill="#000" fontWeight={800}>
                  {c.n.replace('T','')}
                </text>
              </g>
            );
          })}

          {/* Circuit name */}
          <text x={300} y={368} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.2)">
            Bahrain International Circuit — Sakhir — 5.412 km
          </text>
        </svg>
      </div>

      {/* Corner type legend */}
      <div style={{ display:'flex', gap:12, marginTop:10, fontSize:10, color:'rgba(255,255,255,0.4)', flexWrap:'wrap' }}>
        {[['#60A5FA','Fast (180+ km/h)'],['#4ADE80','Medium'],['#F87171','Slow'],['#FCD34D','Hairpin'],['#A78BFA','Chicane']].map(([c,l]) => (
          <span key={l} style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:c,display:'inline-block'}}/>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
