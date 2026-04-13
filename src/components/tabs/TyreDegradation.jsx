import { useState, useMemo } from 'react';
import { MetricCard, InfoCard, Legend, SectionLabel } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { ALL_TELEMETRY, FUEL_LAPS } from '../../data/telemetry.js';
import { DRIVER_COLORS, withAlpha } from '../../utils/colors.js';
import { fmtLap } from '../../utils/math.js';

const COMPOUNDS = {
  soft:   { label:'Soft C3',   color:'#EF4444', dash:'none',  life:20, key:'softDeg' },
  medium: { label:'Medium C2', color:'#F59E0B', dash:'6 3',   life:28, key:'medDeg'  },
  hard:   { label:'Hard C1',   color:'#9CA3AF', dash:'2 2',   life:38, key:'hardDeg' },
};
const W=800, PAD={t:14,r:22,b:40,l:62};

function TyreChart({ drivers, compound, yMin, yMax }) {
  const H=260, cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const comp = COMPOUNDS[compound];
  const maxLaps = comp.life;
  const [hover, setHover] = useState(null);

  const px = i => PAD.l + (i/(maxLaps-1))*cW;
  const py = v => PAD.t + (1-(v-yMin)/(yMax-yMin))*cH;

  const yTicks = Array.from({length:6},(_,i)=>yMin+((yMax-yMin)/5)*i);
  const xTicks = Array.from({length:Math.ceil(maxLaps/5)+1},(_,i)=>i*5).filter(v=>v<maxLaps);

  return (
    <div style={{position:'relative'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}
        onMouseMove={e=>{
          const rect=e.currentTarget.getBoundingClientRect();
          const lapF=(((e.clientX-rect.left)/rect.width)*W-PAD.l)/cW;
          setHover(Math.max(0,Math.min(maxLaps-1,Math.round(lapF*(maxLaps-1)))));
        }}
        onMouseLeave={()=>setHover(null)}>

        {yTicks.map(v=>(<line key={v} x1={PAD.l} x2={PAD.l+cW} y1={py(v)} y2={py(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>))}

        {drivers.map(code=>{
          const data = ALL_TELEMETRY[code]?.[comp.key];
          if(!data) return null;
          const pts = data.map((_,i)=>`${px(i).toFixed(1)},${py(data[i]).toFixed(1)}`).join(' ');
          return (
            <g key={code}>
              <polyline points={pts} fill="none" stroke={DRIVER_COLORS[code]} strokeWidth={2.5} strokeDasharray={comp.dash}/>
              <circle cx={px(data.length-1)} cy={py(data[data.length-1])} r={4} fill={DRIVER_COLORS[code]}/>
            </g>
          );
        })}

        {hover!==null && (
          <line x1={px(hover)} x2={px(hover)} y1={PAD.t} y2={PAD.t+cH}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="3 2"/>
        )}

        {yTicks.map(v=>(<text key={v} x={PAD.l-8} y={py(v)+4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.38)">{v.toFixed(1)}s</text>))}
        {xTicks.map(v=>(<text key={v} x={px(v)} y={H-5} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.35)">L{v+1}</text>))}
        <text x={14} y={PAD.t+cH/2} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)"
          transform={`rotate(-90,14,${PAD.t+cH/2})`}>Lap time (s)</text>
      </svg>

      {hover!==null && (
        <div style={{position:'absolute',top:8,left:`calc(${(px(hover)/W)*100}% + 10px)`,background:'rgba(14,14,24,0.97)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'8px 12px',fontSize:11,pointerEvents:'none',zIndex:20}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:6}}>Lap {hover+1} — {comp.label}</div>
          {drivers.map(code=>{
            const data=ALL_TELEMETRY[code]?.[comp.key];
            if(!data||hover>=data.length) return null;
            return (<div key={code} style={{color:DRIVER_COLORS[code],marginBottom:2,fontWeight:500}}>{code}: {data[hover].toFixed(3)}s</div>);
          })}
        </div>
      )}
    </div>
  );
}

export default function TyreDegradation() {
  const { selectedDrivers } = useDashboard();
  const [activeCompound, setActiveCompound] = useState('soft');
  const [view, setView] = useState('compounds'); // compounds | fuel | comparison

  // Degradation rate comparison
  const degradStats = useMemo(() =>
    selectedDrivers.map(code => {
      const s = ALL_TELEMETRY[code].softDeg;
      const m = ALL_TELEMETRY[code].medDeg;
      const h = ALL_TELEMETRY[code].hardDeg;
      const softRate = s.length >= 3 ? (s[s.length-1]-s[0])/(s.length-1) : 0;
      const medRate  = m.length >= 3 ? (m[m.length-1]-m[0])/(m.length-1) : 0;
      const hardRate = h.length >= 3 ? (h[h.length-1]-h[0])/(h.length-1) : 0;
      return { code, softRate, medRate, hardRate };
    }), [selectedDrivers]);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:9, marginBottom:'1rem' }}>
        <MetricCard label="Soft C3 max life" value="~20 laps" sub="Cliff at lap 12" color="#EF4444" accent="#EF4444"/>
        <MetricCard label="Medium C2 life"   value="~28 laps" sub="Balanced window" color="#F59E0B" accent="#F59E0B"/>
        <MetricCard label="Hard C1 life"     value="~38 laps" sub="Very consistent"  color="#9CA3AF" accent="#9CA3AF"/>
        <MetricCard label="Pit stop loss"    value="~22s"     sub="Stationary + delta" color="rgba(255,255,255,0.6)"/>
      </div>

      {/* View toggle */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {[['compounds','Compound View'],['fuel','Fuel Effect'],['comparison','Rate Comparison']].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{
            padding:'5px 12px',fontSize:11,borderRadius:6,
            border:'1px solid rgba(255,255,255,0.14)',
            background:view===v?'rgba(255,255,255,0.1)':'transparent',
            color:view===v?'#eeeef5':'rgba(255,255,255,0.45)',
            cursor:'pointer',fontWeight:view===v?600:400,
          }}>{l}</button>
        ))}

        {view==='compounds' && (
          <div style={{display:'flex',gap:4,marginLeft:8}}>
            {Object.entries(COMPOUNDS).map(([k,c])=>(
              <button key={k} onClick={()=>setActiveCompound(k)} style={{
                padding:'4px 10px',fontSize:11,borderRadius:5,border:`1px solid ${c.color}44`,
                background:activeCompound===k?`${c.color}22`:'transparent',
                color:c.color,cursor:'pointer',fontWeight:600,
              }}>{c.label}</button>
            ))}
          </div>
        )}
      </div>

      {view==='compounds' && (
        <>
          <Legend items={selectedDrivers.map(code=>({color:DRIVER_COLORS[code],label:`${code} — ${COMPOUNDS[activeCompound].label}`}))}/>
          <TyreChart
            drivers={selectedDrivers}
            compound={activeCompound}
            yMin={89.8} yMax={93.8}
          />
        </>
      )}

      {view==='fuel' && (
        <>
          <SectionLabel>Fuel-corrected race pace (VER reference)</SectionLabel>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:8}}>
            105 kg starting fuel · 2.4 kg/lap burn · each 10 kg = +0.35s lap time
          </div>
          {(() => {
            const H=260,cW=W-PAD.l-PAD.r,cH=H-PAD.t-PAD.b,laps=FUEL_LAPS.length;
            const yMin=90.4,yMax=92.4;
            const px=i=>PAD.l+(i/(laps-1))*cW;
            const py=v=>PAD.t+(1-(v-yMin)/(yMax-yMin))*cH;
            const yTicks=Array.from({length:5},(_,i)=>yMin+((yMax-yMin)/4)*i);
            return (
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
                {yTicks.map(v=>(<line key={v} x1={PAD.l} x2={PAD.l+cW} y1={py(v)} y2={py(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>))}
                <polyline points={FUEL_LAPS.map((v,i)=>`${px(i)},${py(v)}`).join(' ')} fill="none" stroke="#8B5CF6" strokeWidth={2.5}/>
                {[0,10,20,30,40].map(v=>(<text key={v} x={px(v)} y={H-5} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.35)">L{v+1}</text>))}
                {yTicks.map(v=>(<text key={v} x={PAD.l-8} y={py(v)+4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.38)">{v.toFixed(1)}s</text>))}
                <text x={14} y={PAD.t+cH/2} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)" transform={`rotate(-90,14,${PAD.t+cH/2})`}>Lap time (s)</text>
              </svg>
            );
          })()}
        </>
      )}

      {view==='comparison' && (
        <>
          <SectionLabel>Degradation rate comparison (seconds per lap)</SectionLabel>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead>
                <tr>
                  {['Driver','Soft rate','Medium rate','Hard rate','Best compound'].map(h=>(
                    <th key={h} style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.35)',textAlign:'left',padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {degradStats.map(s=>{
                  const best = s.softRate<s.medRate&&s.softRate<s.hardRate?'Soft':s.medRate<s.hardRate?'Medium':'Hard';
                  return (
                    <tr key={s.code} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'8px 10px'}}>
                        <span style={{display:'flex',alignItems:'center',gap:7}}>
                          <span style={{width:8,height:8,borderRadius:'50%',background:DRIVER_COLORS[s.code],flexShrink:0}}/>
                          <strong style={{color:DRIVER_COLORS[s.code]}}>{s.code}</strong>
                        </span>
                      </td>
                      <td style={{padding:'8px 10px',color:'#EF4444',fontFamily:'monospace'}}>+{s.softRate.toFixed(4)}s</td>
                      <td style={{padding:'8px 10px',color:'#F59E0B',fontFamily:'monospace'}}>+{s.medRate.toFixed(4)}s</td>
                      <td style={{padding:'8px 10px',color:'#9CA3AF',fontFamily:'monospace'}}>+{s.hardRate.toFixed(4)}s</td>
                      <td style={{padding:'8px 10px'}}>
                        <span style={{background:best==='Soft'?'rgba(239,68,68,0.15)':best==='Medium'?'rgba(245,158,11,0.15)':'rgba(156,163,175,0.15)',color:best==='Soft'?'#F87171':best==='Medium'?'#FCD34D':'#D1D5DB',borderRadius:4,padding:'2px 7px',fontSize:9,fontWeight:600}}>{best}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginTop:'1.25rem'}}>
        <InfoCard accent="#EF4444" title="Thermal degradation cliff"
          body="Soft tyres contain more oil compound and less silica — they generate grip faster but overheat beyond ~100°C. When rubber surface temperature exceeds the operating window, lap times escalate exponentially. The cliff is visible as the steepening curve in the soft trace after lap 11." />
        <InfoCard accent="#8B5CF6" title="Fuel load effect"
          body="F1 cars start with ~105 kg of fuel, burning 2.4 kg/lap. Every 10 kg adds ~0.35s of lap time due to increased load under braking and lateral g. Fuel-corrected pace removes this effect, showing a car's 'natural' pace progression across a race stint." />
        <InfoCard accent="#F59E0B" title="Strategy implications"
          body="The degradation rate directly determines pit stop window. A driver with lower soft degradation can extend their first stint, gaining track position. The crossover point — where a worn soft runs slower than a new medium — defines the latest possible pit lap for an undercut to work." />
      </div>
    </div>
  );
}
