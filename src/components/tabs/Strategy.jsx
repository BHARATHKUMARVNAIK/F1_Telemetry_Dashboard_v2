import { useMemo, useState } from 'react';
import { MetricCard, SeverityBadge, InfoCard, SectionLabel } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { generateRecommendations, STRATEGY_TEMPLATES, COMPOUNDS, predictStintPace, computeRaceTime } from '../../data/strategy.js';
import { DRIVER_COLORS, DRIVER_LAPTIME } from '../../utils/colors.js';
import { fmtLap } from '../../utils/math.js';

const RACE_LAPS = 57;
const W=760, PAD={t:14,r:22,b:40,l:62};

// ─── STRATEGY GANTT CHART ─────────────────────────────────────────────────────
function StrategyGantt({ strategies, drivers }) {
  const H = 40 + drivers.length * 36;
  const cW = W-PAD.l-PAD.r;
  const cH = H-PAD.t-PAD.b;
  const px = lap => PAD.l + ((lap-1)/(RACE_LAPS-1))*cW;
  const lapTicks = [1,10,20,30,40,50,57];
  const cmpColors = { SOFT:'#EF4444', MEDIUM:'#F59E0B', HARD:'#9CA3AF' };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
      {/* Grid lines */}
      {lapTicks.map(v=>(
        <g key={v}>
          <line x1={px(v)} x2={px(v)} y1={PAD.t} y2={PAD.t+cH} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5}/>
          <text x={px(v)} y={H-4} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.35)">L{v}</text>
        </g>
      ))}

      {drivers.map((code, di) => {
        const strategy = strategies[code];
        if (!strategy) return null;
        const y = PAD.t + di*36 + 6;
        const rowH = 22;
        return (
          <g key={code}>
            {/* Driver label */}
            <text x={PAD.l-8} y={y+rowH/2+4} textAnchor="end" fontSize={10}
              fill={DRIVER_COLORS[code]} fontWeight={700}>{code}</text>

            {strategy.stints.map((stint, si) => {
              const x1 = px(stint.startLap);
              const x2 = px(stint.endLap);
              const barW = Math.max(2, x2-x1);
              const col = cmpColors[stint.compound];
              return (
                <g key={si}>
                  <rect x={x1} y={y} width={barW} height={rowH}
                    fill={col} opacity={0.8} rx={3}/>
                  {/* Pit stop marker */}
                  {si > 0 && (
                    <polygon points={`${x1-1},${y} ${x1+5},${y+rowH/2} ${x1-1},${y+rowH}`}
                      fill="rgba(255,255,255,0.9)"/>
                  )}
                  {barW > 30 && (
                    <text x={x1+barW/2} y={y+rowH/2+4} textAnchor="middle"
                      fontSize={8} fill="rgba(0,0,0,0.75)" fontWeight={800}>
                      {stint.compound.slice(0,3)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Total race time */}
            <text x={PAD.l+cW+8} y={y+rowH/2+4} fontSize={9}
              fill="rgba(255,255,255,0.4)" fontFamily="monospace">
              {(computeRaceTime(code, strategy.stints)/60).toFixed(1)}m
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── STINT PACE CHART ─────────────────────────────────────────────────────────
function StintPaceChart({ driver, strategyId }) {
  const H=220, cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const tmpl = STRATEGY_TEMPLATES.find(s=>s.id===strategyId);
  if(!tmpl) return null;

  const allPaces = tmpl.stints.map(stint=>
    predictStintPace(driver, stint.compound, 105-2.4*(stint.startLap-1), stint.endLap-stint.startLap)
  );
  const allTimes = allPaces.flatMap(p=>p.map(x=>x.time));
  const yMin = Math.min(...allTimes)-0.3, yMax = Math.max(...allTimes)+0.5;
  const py = v => PAD.t+(1-(v-yMin)/(yMax-yMin))*cH;

  let globalLap = 0;
  const cmpColors = {SOFT:'#EF4444',MEDIUM:'#F59E0B',HARD:'#9CA3AF'};

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
      {[0.25,0.5,0.75,1].map(f=>(<line key={f} x1={PAD.l} x2={PAD.l+cW} y1={PAD.t+f*cH} y2={PAD.t+f*cH} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}/>))}

      {tmpl.stints.map((stint,si) => {
        const pace = allPaces[si];
        const stintLen = stint.endLap-stint.startLap;
        const pts = pace.map((p,i)=>{
          const lap = globalLap+i;
          const x = PAD.l+(lap/(RACE_LAPS-1))*cW;
          return `${x.toFixed(1)},${py(p.time).toFixed(1)}`;
        }).join(' ');
        const startX = PAD.l+(globalLap/(RACE_LAPS-1))*cW;
        const endX   = PAD.l+((globalLap+stintLen-1)/(RACE_LAPS-1))*cW;
        globalLap += stintLen;

        return (
          <g key={si}>
            <rect x={startX} y={PAD.t} width={Math.max(1,endX-startX)} height={cH}
              fill={`${cmpColors[stint.compound]}10`}/>
            <polyline points={pts} fill="none" stroke={cmpColors[stint.compound]} strokeWidth={2}/>
            {si<tmpl.stints.length-1&&(
              <line x1={endX} x2={endX} y1={PAD.t} y2={PAD.t+cH}
                stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="3 2"/>
            )}
          </g>
        );
      })}

      {[1,10,20,30,40,50,57].map(v=>(<text key={v} x={PAD.l+((v-1)/(RACE_LAPS-1))*cW} y={H-5} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.3)">L{v}</text>))}
      <text x={14} y={PAD.t+cH/2} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)"
        transform={`rotate(-90,14,${PAD.t+cH/2})`}>Lap time (s)</text>
    </svg>
  );
}

export default function Strategy() {
  const { selectedDrivers } = useDashboard();
  const [selectedStrategy, setSelectedStrategy] = useState('S_M');
  const [paceDriver, setPaceDriver] = useState(selectedDrivers[0]);

  const recs = useMemo(() => generateRecommendations(selectedDrivers), [selectedDrivers]);

  // Best strategy per driver
  const optimalStrategies = useMemo(() => {
    const result = {};
    selectedDrivers.forEach(code => {
      const scored = STRATEGY_TEMPLATES.map(t => ({
        ...t, totalTime: computeRaceTime(code, t.stints)
      })).sort((a,b)=>a.totalTime-b.totalTime);
      result[code] = scored[0];
    });
    return result;
  }, [selectedDrivers]);

  // All strategies scored for selected driver (table)
  const allScored = useMemo(() =>
    STRATEGY_TEMPLATES.map(t => ({
      ...t, totalTime: computeRaceTime(paceDriver, t.stints)
    })).sort((a,b)=>a.totalTime-b.totalTime),
    [paceDriver]
  );

  const bestTime = allScored[0]?.totalTime||0;

  // Gantt: show selected strategy for all drivers
  const ganttStrategies = useMemo(() => {
    const tmpl = STRATEGY_TEMPLATES.find(t=>t.id===selectedStrategy);
    const result = {};
    selectedDrivers.forEach(code => { result[code] = tmpl; });
    return result;
  }, [selectedStrategy, selectedDrivers]);

  const stratRecs = recs.filter(r=>r.type==='optimal_strategy');
  const undercutRecs = recs.filter(r=>r.type==='undercut');
  const cliffRecs = recs.filter(r=>r.type==='tyre_cliff');

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:9,marginBottom:'1rem'}}>
        <MetricCard label="Race distance" value={`${RACE_LAPS} laps`} sub="Bahrain 2024" color="rgba(255,255,255,0.7)"/>
        <MetricCard label="Pit stop loss" value="~22.0s" sub="Stationary + in/out" color="rgba(255,255,255,0.6)"/>
        {selectedDrivers.map(code => (
          <MetricCard key={code}
            label={`${code} optimal`}
            value={optimalStrategies[code]?.name||'—'}
            sub={`${(optimalStrategies[code]?.totalTime/60||0).toFixed(1)} min projected`}
            color={DRIVER_COLORS[code]} accent={DRIVER_COLORS[code]}
          />
        ))}
      </div>

      {/* SECTION: Strategy Gantt */}
      <SectionLabel>Race strategy timeline</SectionLabel>
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
        {STRATEGY_TEMPLATES.map(t=>(
          <button key={t.id} onClick={()=>setSelectedStrategy(t.id)} style={{
            padding:'5px 11px',fontSize:11,borderRadius:6,
            border:'1px solid rgba(255,255,255,0.14)',
            background:selectedStrategy===t.id?'rgba(255,255,255,0.1)':'transparent',
            color:selectedStrategy===t.id?'#eeeef5':'rgba(255,255,255,0.45)',
            cursor:'pointer',fontWeight:selectedStrategy===t.id?600:400,
          }}>{t.name}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:10,marginBottom:8,flexWrap:'wrap'}}>
        {[['SOFT','#EF4444'],['MEDIUM','#F59E0B'],['HARD','#9CA3AF']].map(([c,col])=>(
          <span key={c} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.45)'}}>
            <span style={{width:20,height:10,background:col,borderRadius:2,opacity:0.8,display:'inline-block'}}/>
            {c.charAt(0)+c.slice(1).toLowerCase()}
          </span>
        ))}
        <span style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginLeft:6}}>▸ = Pit stop · time shown = projected race time</span>
      </div>
      <StrategyGantt strategies={ganttStrategies} drivers={selectedDrivers}/>

      {/* SECTION: Strategy scoring table */}
      <SectionLabel style={{marginTop:'1.5rem'}}>Strategy scoring</SectionLabel>
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Driver reference:</span>
        {selectedDrivers.map(code=>(
          <button key={code} onClick={()=>setPaceDriver(code)} style={{
            padding:'4px 9px',fontSize:11,borderRadius:5,
            border:`1px solid ${DRIVER_COLORS[code]}44`,
            background:paceDriver===code?`${DRIVER_COLORS[code]}22`:'transparent',
            color:DRIVER_COLORS[code],cursor:'pointer',fontWeight:paceDriver===code?700:400,
          }}>{code}</button>
        ))}
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr>
              {['Strategy','Stops','Projected time','Gap to best','Description'].map(h=>(
                <th key={h} style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.35)',textAlign:'left',padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allScored.map((s,i) => {
              const gap = s.totalTime-bestTime;
              return (
                <tr key={s.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)',background:i===0?'rgba(34,197,94,0.05)':'transparent'}}
                  onMouseEnter={e=>{ if(i>0) e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=i===0?'rgba(34,197,94,0.05)':'transparent'; }}>
                  <td style={{padding:'8px 10px',fontWeight:600,color:i===0?'#22C55E':'#eeeef5'}}>
                    {i===0&&<span style={{fontSize:9,marginRight:5}}>⭐</span>}{s.name}
                  </td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'rgba(255,255,255,0.6)'}}>{s.stops}</td>
                  <td style={{padding:'8px 10px',fontFamily:'monospace',color:i===0?'#22C55E':'rgba(255,255,255,0.7)'}}>{(s.totalTime/60).toFixed(3)} min</td>
                  <td style={{padding:'8px 10px',fontFamily:'monospace',color:gap===0?'#22C55E':'#F87171'}}>
                    {gap===0?'Best':'+'+gap.toFixed(2)+'s'}
                  </td>
                  <td style={{padding:'8px 10px',color:'rgba(255,255,255,0.45)',fontSize:10}}>{s.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION: Stint pace projection */}
      <SectionLabel style={{marginTop:'1.5rem'}}>Stint pace projection — {paceDriver} · {allScored[0]?.name}</SectionLabel>
      <StintPaceChart driver={paceDriver} strategyId={allScored[0]?.id}/>

      {/* SECTION: Undercut & Cliff alerts */}
      {(undercutRecs.length > 0 || cliffRecs.length > 0) && (
        <>
          <SectionLabel style={{marginTop:'1.5rem'}}>Live alerts</SectionLabel>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[...cliffRecs,...undercutRecs].map((r,i)=>(
              <div key={i} style={{
                background:'#14141f',
                border:`1px solid ${r.type==='tyre_cliff'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.25)'}`,
                borderRadius:10,padding:'12px 14px',
                display:'flex',alignItems:'flex-start',gap:12,
              }}>
                <span style={{fontSize:20,flexShrink:0}}>{r.type==='tyre_cliff'?'🔥':'🎯'}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <span style={{fontSize:12,fontWeight:600,color:DRIVER_COLORS[r.driver]||'#eeeef5'}}>{r.headline}</span>
                    <SeverityBadge severity={r.severity}/>
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.6}}>{r.detail}</div>
                  {r.confidence&&(
                    <div style={{marginTop:4,fontSize:10,color:'rgba(255,255,255,0.35)'}}>
                      Confidence: <span style={{color:r.confidence==='high'?'#22C55E':r.confidence==='medium'?'#FCD34D':'#F87171',fontWeight:600}}>{r.confidence.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginTop:'1.5rem'}}>
        <InfoCard accent="#22C55E" title="Strategy scoring methodology"
          body="Each strategy is evaluated by summing predicted lap times across all stints. Stint pace = base lap time + tyre degradation + fuel load effect. Pit stop time loss (~22s) is added for each stop. The lowest total time wins. This mirrors the Monte Carlo simulations run by F1 strategy departments." />
        <InfoCard accent="#F59E0B" title="Undercut mechanism"
          body="An undercut works when a driver pits before their rival, sets fast laps on fresh tyres, and emerges from the pits ahead after the rival also stops. It requires the tyre advantage per lap to exceed the pit loss — typically viable when tyre delta exceeds 0.8s/lap and gap is under 20s." />
        <InfoCard accent="#EF4444" title="Overcut (inverse)"
          body="An overcut is the reverse: stay out on worn tyres, build a large gap, then pit later than the rival. Used when: the rival car cannot overtake on track, the safety car is expected, or the remaining stint on worn tyres is shorter than the pit delta. High risk, high reward." />
        <InfoCard accent="#8B5CF6" title="FastF1 integration path"
          body="For live strategy: connect the Python FastF1 API to pull real stint data, tyre age, and live gap times. Feed these as inputs to the same predictStintPace() function with real lap time deltas. The strategy engine here is designed to accept that substitution without structural changes." />
      </div>
    </div>
  );
}
