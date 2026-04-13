import { useState, useMemo } from 'react';
import { MetricCard, InfoCard, Pill, SectionLabel } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { ALL_TELEMETRY, DIST } from '../../data/telemetry.js';
import { CORNERS } from '../../data/circuit.js';
import { DRIVER_COLORS } from '../../utils/colors.js';
import { clamp } from '../../utils/math.js';

const TYPE_STYLE = {
  fast:   {bg:'rgba(59,130,246,0.15)',c:'#60A5FA'},
  medium: {bg:'rgba(34,197,94,0.12)', c:'#4ADE80'},
  slow:   {bg:'rgba(239,68,68,0.12)', c:'#F87171'},
  hairpin:{bg:'rgba(245,158,11,0.12)',c:'#FCD34D'},
  chicane:{bg:'rgba(139,92,246,0.15)',c:'#A78BFA'},
};

// Get min speed for a driver at a given corner
function getMinSpeed(code, apexDist, width=180) {
  const tel = ALL_TELEMETRY[code];
  let minV = Infinity;
  for (let i=0; i<DIST.length; i++) {
    if (DIST[i] >= apexDist-width && DIST[i] <= apexDist+width) {
      if (tel.speed[i] < minV) minV = tel.speed[i];
    }
  }
  return minV === Infinity ? 0 : minV;
}

const W=800, PAD={t:12,r:22,b:36,l:56};

function MultiDriverBarChart({ corners, drivers, sortMode }) {
  const H=240, cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const yMin=55, yMax=220;
  const [hovCorner, setHovCorner] = useState(null);

  const sorted = sortMode==='speed'
    ? [...corners].sort((a,b)=>getMinSpeed(drivers[0],b.dist)-getMinSpeed(drivers[0],a.dist))
    : corners;

  const barGroupW = cW/sorted.length;
  const barW = Math.min(14, (barGroupW*0.75)/drivers.length - 2);
  const py = v => PAD.t+(1-(v-yMin)/(yMax-yMin))*cH;

  return (
    <div style={{position:'relative'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
        {[60,80,100,120,140,160,180,200].map(v=>(
          <line key={v} x1={PAD.l} x2={PAD.l+cW} y1={py(v)} y2={py(v)}
            stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>
        ))}
        {sorted.map((c,ci)=>{
          const cx = PAD.l+barGroupW*ci+barGroupW/2;
          const groupW = barW*drivers.length+(drivers.length-1)*2;
          const startX = cx-groupW/2;
          return (
            <g key={c.n} style={{cursor:'pointer'}}
              onMouseEnter={()=>setHovCorner(c.n)}
              onMouseLeave={()=>setHovCorner(null)}>
              {drivers.map((code,di)=>{
                const v = getMinSpeed(code, c.dist);
                const isHov = hovCorner===c.n;
                return (
                  <rect key={code}
                    x={startX+di*(barW+2)} y={py(v)}
                    width={barW} height={Math.max(1,py(yMin)-py(v))}
                    fill={DRIVER_COLORS[code]} rx={2}
                    opacity={isHov?1:0.78}/>
                );
              })}
              <text x={cx} y={H-3} textAnchor="middle"
                fontSize={9} fill={hovCorner===c.n?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.35)'}
                fontWeight={hovCorner===c.n?600:400}>{c.n}</text>

              {/* Hover tooltip in SVG */}
              {hovCorner===c.n && (() => {
                const tipX = cx+barGroupW/2>W-140?cx-130:cx+barGroupW/2+4;
                const tipH = 18+drivers.length*14;
                return (
                  <g>
                    <rect x={tipX} y={PAD.t+4} width={118} height={tipH} rx={5}
                      fill="rgba(14,14,24,0.97)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.5}/>
                    <text x={tipX+7} y={PAD.t+16} fontSize={9} fill="rgba(255,255,255,0.55)" fontWeight={600}>{c.n} — {c.type}</text>
                    {drivers.map((code,di)=>{
                      const v=getMinSpeed(code,c.dist);
                      return (<text key={code} x={tipX+7} y={PAD.t+28+di*14} fontSize={9} fill={DRIVER_COLORS[code]}>{code}: {v} km/h</text>);
                    })}
                  </g>
                );
              })()}
            </g>
          );
        })}
        {[80,130,180].map(v=>(<text key={v} x={PAD.l-8} y={py(v)+4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.38)">{v}</text>))}
        <text x={14} y={PAD.t+cH/2} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)"
          transform={`rotate(-90,14,${PAD.t+cH/2})`}>Min speed (km/h)</text>
      </svg>
    </div>
  );
}

export default function CornerAnalysis() {
  const { selectedDrivers } = useDashboard();
  const [sortMode, setSortMode] = useState('default');

  // Corner data with all drivers' min speeds
  const cornerData = useMemo(() =>
    CORNERS.map(c => ({
      ...c,
      speeds: selectedDrivers.reduce((acc, code) => {
        acc[code] = getMinSpeed(code, c.dist);
        return acc;
      }, {}),
    })), [selectedDrivers]);

  // Who wins the most corners
  const cornerWins = useMemo(() => {
    const wins = {};
    selectedDrivers.forEach(c => { wins[c] = 0; });
    cornerData.forEach(c => {
      const best = selectedDrivers.reduce((a,b) => c.speeds[a]>c.speeds[b]?a:b);
      wins[best] = (wins[best]||0)+1;
    });
    return wins;
  }, [selectedDrivers, cornerData]);

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:9,marginBottom:'1rem'}}>
        {selectedDrivers.map(code=>(
          <MetricCard key={code}
            label={`${code} corners won`}
            value={`${cornerWins[code]||0} / ${CORNERS.length}`}
            sub="Higher minimum speed"
            color={DRIVER_COLORS[code]} accent={DRIVER_COLORS[code]}
          />
        ))}
      </div>

      {/* Legend + sort */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:10}}>
        <div style={{display:'flex',gap:12,fontSize:11,color:'rgba(255,255,255,0.45)',flexWrap:'wrap'}}>
          {selectedDrivers.map(code=>(
            <span key={code} style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:12,height:12,background:DRIVER_COLORS[code],borderRadius:2,display:'inline-block',opacity:0.85}}/>
              {code}
            </span>
          ))}
        </div>
        <select value={sortMode} onChange={e=>setSortMode(e.target.value)}
          style={{background:'#14141f',border:'1px solid rgba(255,255,255,0.14)',color:'rgba(255,255,255,0.7)',borderRadius:6,padding:'4px 9px',fontSize:11,cursor:'pointer'}}>
          <option value="default">Sort: lap order</option>
          <option value="speed">Sort: speed descending</option>
        </select>
      </div>

      <MultiDriverBarChart corners={CORNERS} drivers={selectedDrivers} sortMode={sortMode}/>

      <SectionLabel style={{marginTop:'1.25rem'}}>Corner-by-corner breakdown</SectionLabel>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr>
              <th style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.35)',textAlign:'left',padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>Corner</th>
              <th style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.35)',textAlign:'left',padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>Type</th>
              {selectedDrivers.map(code=>(
                <th key={code} style={{fontSize:10,fontWeight:600,textAlign:'right',padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)',color:DRIVER_COLORS[code]}}>{code}</th>
              ))}
              <th style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.35)',textAlign:'left',padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>Winner</th>
              <th style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.35)',textAlign:'left',padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>Spread</th>
            </tr>
          </thead>
          <tbody>
            {cornerData.map((c,i)=>{
              const ts = TYPE_STYLE[c.type]||TYPE_STYLE.medium;
              const bestCode = selectedDrivers.reduce((a,b)=>c.speeds[a]>c.speeds[b]?a:b);
              const worstCode = selectedDrivers.reduce((a,b)=>c.speeds[a]<c.speeds[b]?a:b);
              const spread = c.speeds[bestCode]-c.speeds[worstCode];
              return (
                <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'8px 10px',fontWeight:700,fontFamily:'monospace'}}>{c.n}</td>
                  <td style={{padding:'8px 10px'}}>
                    <span style={{background:ts.bg,color:ts.c,borderRadius:4,padding:'2px 7px',fontSize:9,fontWeight:600}}>{c.type}</span>
                  </td>
                  {selectedDrivers.map(code=>{
                    const v=c.speeds[code];
                    const isBest=code===bestCode;
                    return (
                      <td key={code} style={{padding:'8px 10px',textAlign:'right',fontFamily:'monospace',fontWeight:isBest?700:400,color:isBest?DRIVER_COLORS[code]:'rgba(255,255,255,0.6)'}}>
                        {v}
                        {isBest&&<span style={{fontSize:8,marginLeft:4,color:'#22C55E'}}>⚡</span>}
                      </td>
                    );
                  })}
                  <td style={{padding:'8px 10px'}}>
                    <span style={{color:DRIVER_COLORS[bestCode],fontWeight:700}}>{bestCode}</span>
                  </td>
                  <td style={{padding:'8px 10px',fontFamily:'monospace',color:spread>=8?'#F87171':spread>=4?'#FCD34D':'#4ADE80'}}>
                    {spread} km/h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginTop:'1.25rem'}}>
        <InfoCard accent="#22C55E" title="Minimum corner speed"
          body="The apex speed — the slowest point through a corner. Every 1 km/h of minimum speed is worth ~0.005s of lap time. Over 12 corners with a 5 km/h average deficit, that's 0.3s per lap — roughly the gap between P1 and P5 on a typical qualifying day." />
        <InfoCard accent="#3B82F6" title="Corner type hierarchy"
          body="Fast corners (180+ km/h) are dominated by aerodynamic downforce. Medium corners balance aero and mechanical grip. Hairpins and slow corners are determined by mechanical grip, trail braking depth, and traction on exit. Comparing drivers by corner type reveals car philosophy differences." />
        <InfoCard accent="#F59E0B" title="Speed spread interpretation"
          body="A large spread (8+ km/h) between drivers at one corner indicates either a significant car balance difference at that specific speed range, or a driver-specific technique issue (over-caution, commitment gap). Small spreads mean the corner is equally well-handled by all cars in the field." />
      </div>
    </div>
  );
}
