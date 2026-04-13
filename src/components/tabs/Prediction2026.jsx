/**
 * Prediction2026 — 2026 Grand Prix Winner Prediction Tab
 *
 * Views:
 *   Championship   — season-long driver & constructor odds
 *   Race Predictor — per-race win probabilities + explainer
 *   Points Curve   — projected cumulative points season arc
 *   Constructors   — team championship projection
 */

import { useState, useMemo } from 'react';
import {
  DRIVERS_2026, ALL_DRIVERS_2026, CAR_2026,
  getRacePrediction, computeChampionshipOdds, computeConstructorOdds,
  seasonPointsCurve, explainPrediction, confidenceScore,
} from '../../data/prediction2026.js';
import { CALENDAR_2026, SPRINT_ROUNDS } from '../../data/calendar2026.js';
import { SectionLabel } from '../UI.jsx';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const pct  = (v, dec=1) => (v * 100).toFixed(dec) + '%';
const fmt  = (v) => v.toFixed(1);

function DriverDot({ code, size=8 }) {
  const d = DRIVERS_2026[code];
  return <span style={{ width:size, height:size, borderRadius:'50%', background:d?.color||'#888', display:'inline-block', flexShrink:0 }}/>;
}

function ConfidenceMeter({ score }) {
  const color = score >= 70 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', width:80, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score}%`, background:color, borderRadius:2, transition:'width 0.5s' }}/>
      </div>
      <span style={{ fontSize:10, color, fontWeight:600 }}>{label} {score}%</span>
    </div>
  );
}

function ProbabilityBar({ prob, color, label, maxProb=1, showPct=true }) {
  const pctW = Math.max(2, (prob / Math.max(maxProb, 0.01)) * 100);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
      <div style={{ width:90, fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:500, display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
        <DriverDot code={label} />
        <span style={{ color: color }}>{label}</span>
      </div>
      <div style={{ flex:1, height:8, borderRadius:4, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pctW}%`, background:color, borderRadius:4, transition:'width 0.4s' }}/>
      </div>
      {showPct && <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontFamily:'monospace', width:46, textAlign:'right', flexShrink:0 }}>{pct(prob)}</span>}
    </div>
  );
}

// ─── VIEW 1: CHAMPIONSHIP OVERVIEW ───────────────────────────────────────────
function ChampionshipView() {
  const champOdds = useMemo(() => computeChampionshipOdds(), []);
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() =>
    Object.values(champOdds).sort((a,b) => b.championP - a.championP),
    [champOdds]
  );

  const displayed = showAll ? sorted : sorted.slice(0, 10);
  const maxChampP = sorted[0]?.championP || 1;

  return (
    <div>
      {/* Top 3 hero cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, marginBottom:'1.5rem' }}>
        {sorted.slice(0,3).map((item, i) => {
          const d = item.driver;
          const medals = ['🥇','🥈','🥉'];
          return (
            <div key={d.code} style={{
              background:'#14141f', borderRadius:12, padding:'14px 16px',
              border:`1px solid ${d.color}30`,
              borderTop:`3px solid ${d.color}`,
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ fontSize:22, position:'absolute', top:12, right:14, opacity:0.9 }}>{medals[i]}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                {i === 0 ? 'Predicted champion' : `P${i+1} favourite`}
              </div>
              <div style={{ fontSize:18, fontWeight:700, color:d.color, marginBottom:2 }}>{d.code}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>{d.name}</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#eeeef5', letterSpacing:'-0.02em' }}>{pct(item.championP,0)}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:6 }}>championship probability</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
                Projected pts: <strong style={{ color:d.color }}>{item.projPoints}</strong>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                Top 3 chance: {pct(item.top3P,0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full championship probability chart */}
      <SectionLabel>Driver championship probability — 2026 season (3,000 simulations)</SectionLabel>
      <div style={{ background:'#14141f', borderRadius:12, padding:'16px', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'1rem' }}>
        {displayed.map(item => (
          <ProbabilityBar
            key={item.driver.code}
            prob={item.championP}
            color={item.driver.color}
            label={item.driver.code}
            maxProb={maxChampP}
          />
        ))}
        {!showAll && sorted.length > 10 && (
          <button onClick={() => setShowAll(true)} style={{
            marginTop:8, padding:'5px 12px', fontSize:11, borderRadius:6,
            border:'1px solid rgba(255,255,255,0.14)', background:'transparent',
            color:'rgba(255,255,255,0.45)', cursor:'pointer',
          }}>Show all {sorted.length} drivers</button>
        )}
      </div>

      {/* Points projection per driver */}
      <SectionLabel>Projected season points</SectionLabel>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>
              {['P','Driver','Team','Champ %','Top-3 %','Proj Pts','Wins','Car Rating'].map(h => (
                <th key={h} style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.35)', textAlign:'left', padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => {
              const d = item.driver;
              const carPerf = Math.round(CAR_2026[d.team]?.overallPerf * 100) || '—';
              return (
                <tr key={d.code} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'8px 10px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{i+1}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <DriverDot code={d.code} />
                      <span style={{ color:d.color, fontWeight:700 }}>{d.code}</span>
                      <span style={{ color:'rgba(255,255,255,0.35)', fontSize:10 }}>#{d.number}</span>
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px', color:'rgba(255,255,255,0.5)', fontSize:10 }}>{d.team}</td>
                  <td style={{ padding:'8px 10px', color:d.color, fontWeight:700, fontFamily:'monospace' }}>{pct(item.championP,1)}</td>
                  <td style={{ padding:'8px 10px', color:'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>{pct(item.top3P,0)}</td>
                  <td style={{ padding:'8px 10px', fontFamily:'monospace', fontWeight:600, color:'rgba(255,255,255,0.8)' }}>{item.projPoints}</td>
                  <td style={{ padding:'8px 10px', color:'rgba(255,255,255,0.4)', fontSize:10 }}>{d.wins} career</td>
                  <td style={{ padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:40, height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${carPerf}%`, background: carPerf>=90?'#22C55E':carPerf>=80?'#F59E0B':'#EF4444', borderRadius:2 }}/>
                      </div>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{carPerf}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Methodology note */}
      <div style={{ marginTop:'1.5rem', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10, padding:'12px 16px' }}>
        <div style={{ fontSize:10, fontWeight:600, color:'#60A5FA', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Prediction methodology</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.7 }}>
          3,000 season simulations using a multi-factor model: <strong style={{color:'rgba(255,255,255,0.75)'}}>driver skill</strong> (pace, racecraft, consistency, tyre management, wet weather — weighted by circuit type) ×{' '}
          <strong style={{color:'rgba(255,255,255,0.75)'}}>2026 car performance</strong> (new PU regulations, aerodynamic concept, development rate) ×{' '}
          <strong style={{color:'rgba(255,255,255,0.75)'}}>circuit affinity</strong> (historical performance, track type match). Gaussian noise models race variance, safety cars, and weather events.
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 2: RACE PREDICTOR ───────────────────────────────────────────────────
function RacePredictor() {
  const [selectedRace, setSelectedRace] = useState('BHR');
  const [expandedDriver, setExpandedDriver] = useState(null);

  const circuit  = CALENDAR_2026.find(c => c.id === selectedRace);
  const preds    = useMemo(() => getRacePrediction(selectedRace, 15), [selectedRace]);
  const conf     = useMemo(() => confidenceScore(selectedRace), [selectedRace]);
  const isSprint = SPRINT_ROUNDS.has(selectedRace);
  const maxWinP  = preds[0]?.winP || 1;

  const insights = useMemo(() =>
    expandedDriver ? explainPrediction(expandedDriver, selectedRace) : [],
    [expandedDriver, selectedRace]
  );

  const typeColors = { power:'#60A5FA', technical:'#4ADE80', street:'#F87171', high_speed:'#A78BFA', balanced:'#FCD34D' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, alignItems:'start' }}>
      {/* Race selector sidebar */}
      <div style={{ background:'#0e0e18', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden', maxHeight:620, overflowY:'auto' }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          2026 Calendar — 24 races
        </div>
        {CALENDAR_2026.map(race => (
          <div key={race.id}
            onClick={() => { setSelectedRace(race.id); setExpandedDriver(null); }}
            style={{
              padding:'9px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:8,
              background: selectedRace === race.id ? 'rgba(59,130,246,0.12)' : 'transparent',
              borderLeft: selectedRace === race.id ? '3px solid #3B82F6' : '3px solid transparent',
              transition:'background 0.1s',
            }}
            onMouseEnter={e => { if(selectedRace!==race.id) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if(selectedRace!==race.id) e.currentTarget.style.background='transparent'; }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{race.flag}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color: selectedRace===race.id ? '#eeeef5' : 'rgba(255,255,255,0.65)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                R{race.round} {race.name.replace(' Grand Prix','').replace(' GP','')}
              </div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{race.date}</div>
            </div>
            {isSprint && race.id === selectedRace && (
              <span style={{ fontSize:8, background:'rgba(245,158,11,0.2)', color:'#F59E0B', borderRadius:3, padding:'1px 4px', fontWeight:700, flexShrink:0 }}>SPR</span>
            )}
          </div>
        ))}
      </div>

      {/* Race detail panel */}
      <div>
        {/* Circuit header */}
        <div style={{ background:'#14141f', borderRadius:12, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.07)', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:20 }}>{circuit?.flag}</span>
                <span style={{ fontSize:16, fontWeight:700, color:'#eeeef5' }}>{circuit?.name}</span>
                {isSprint && <span style={{ fontSize:9, background:'rgba(245,158,11,0.2)', color:'#F59E0B', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>SPRINT WEEKEND</span>}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{circuit?.circuit} · Round {circuit?.round} · {circuit?.date}</div>
            </div>
            <ConfidenceMeter score={conf} />
          </div>

          {/* Circuit stats pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { label:'Type', val: circuit?.type?.replace('_',' '), color: typeColors[circuit?.type] },
              { label:'Tyre Wear', val: `${circuit?.tyreWear}/10` },
              { label:'Overtaking', val: `${circuit?.overtakingDiff}/10 difficulty` },
              { label:'SC Prob', val: `${Math.round((circuit?.safetyCarP||0)*100)}%` },
              { label:'Rain', val: `${Math.round((circuit?.weatherP||0)*100)}%` },
              { label:'DRS Zones', val: circuit?.drsZones },
              { label:'Laps', val: `${circuit?.laps} × ${circuit?.length}km` },
            ].map(p => (
              <span key={p.label} style={{ fontSize:10, background:'rgba(255,255,255,0.06)', borderRadius:5, padding:'3px 8px', color:p.color||'rgba(255,255,255,0.5)' }}>
                <span style={{ color:'rgba(255,255,255,0.3)', marginRight:3 }}>{p.label}:</span>
                <strong>{p.val}</strong>
              </span>
            ))}
          </div>

          <div style={{ marginTop:8, fontSize:11, color:'rgba(255,255,255,0.4)', fontStyle:'italic' }}>{circuit?.notes}</div>
        </div>

        {/* Win probability bars */}
        <SectionLabel>Win probability — click driver for AI explanation</SectionLabel>
        <div style={{ background:'#14141f', borderRadius:12, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.07)', marginBottom:12 }}>
          {preds.map((item, i) => {
            const d = item.driver;
            const isExp = expandedDriver === d.code;
            return (
              <div key={d.code} style={{ marginBottom: i < preds.length-1 ? 8 : 0 }}>
                <div
                  onClick={() => setExpandedDriver(isExp ? null : d.code)}
                  style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'4px 6px', borderRadius:6, background: isExp ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                  {/* Position badge */}
                  <span style={{ width:20, height:20, borderRadius:4, background: i===0?'#F59E0B':i===1?'rgba(255,255,255,0.3)':i===2?'rgba(180,100,0,0.6)':'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.7)', flexShrink:0 }}>
                    {i+1}
                  </span>

                  <div style={{ width:38, flexShrink:0 }}>
                    <span style={{ color:d.color, fontWeight:700, fontSize:12 }}>{d.code}</span>
                  </div>

                  {/* Win probability bar */}
                  <div style={{ flex:1, height:10, borderRadius:5, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(item.winP/maxWinP)*100}%`, background:d.color, borderRadius:5 }}/>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'flex', gap:14, flexShrink:0 }}>
                    <span style={{ fontSize:11, fontFamily:'monospace', color:d.color, fontWeight:700, width:46, textAlign:'right' }}>{pct(item.winP)}</span>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', width:52, textAlign:'right' }}>Podium {pct(item.podiumP,0)}</span>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', width:42, textAlign:'right' }}>{fmt(item.avgPts)}pts</span>
                  </div>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{isExp ? '▲' : '▼'}</span>
                </div>

                {/* AI Explainer panel */}
                {isExp && (
                  <div style={{ margin:'6px 0 8px', padding:'12px 14px', background:'rgba(14,14,24,0.8)', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                      🧠 Why {d.name} is {i===0?'the favourite':'predicted P'+(i+1)} at {circuit?.name}
                    </div>
                    {insights.map((ins, ii) => (
                      <div key={ii} style={{ display:'flex', gap:10, marginBottom:8, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:6, borderLeft:`3px solid ${d.color}60` }}>
                        <span style={{ fontSize:16, flexShrink:0 }}>{ins.icon}</span>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.55)', marginBottom:2, textTransform:'uppercase', letterSpacing:'0.04em' }}>{ins.category}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{ins.text}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:8, marginTop:10, padding:'8px 10px', background:'rgba(59,130,246,0.08)', borderRadius:6 }}>
                      <span style={{ fontSize:16 }}>📊</span>
                      <div>
                        <div style={{ fontSize:10, fontWeight:600, color:'#60A5FA', marginBottom:2 }}>Summary statistics</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>
                          Win: <strong style={{color:d.color}}>{pct(item.winP)}</strong> ·
                          Podium: <strong>{pct(item.podiumP)}</strong> ·
                          Top 5: <strong>{pct(item.top5P)}</strong> ·
                          DNF risk: <strong style={{color:'#F87171'}}>{pct(item.dnfP)}</strong> ·
                          Exp. pts: <strong>{fmt(item.avgPts)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Podium probability pie-style */}
        <SectionLabel>Podium finish probability — top 8</SectionLabel>
        <div style={{ background:'#14141f', borderRadius:12, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.07)' }}>
          {preds.slice(0,8).map(item => {
            const d = item.driver;
            return (
              <div key={d.code} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ color:d.color, fontWeight:700, fontSize:11, width:38, flexShrink:0 }}>{d.code}</span>
                <div style={{ flex:1, height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${item.podiumP*100}%`, background:d.color, opacity:0.75, borderRadius:3 }}/>
                </div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontFamily:'monospace', width:40, textAlign:'right', flexShrink:0 }}>{pct(item.podiumP,0)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 3: POINTS PROJECTION CURVE ─────────────────────────────────────────
const W=820, PAD={t:14,r:22,b:50,l:58};

function PointsCurveChart({ curves }) {
  const H = 340;
  const cW = W-PAD.l-PAD.r, cH = H-PAD.t-PAD.b;
  const maxPts = Math.max(...curves.flatMap(c => c.curve));
  const numRaces = CALENDAR_2026.length;

  const px = i => PAD.l + (i/(numRaces-1))*cW;
  const py = v => PAD.t + (1 - v/maxPts)*cH;

  const yTicks = Array.from({length:6},(_,i)=>Math.round(maxPts/5*i/10)*10);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
      {/* Grid */}
      {yTicks.map(v=>(
        <line key={v} x1={PAD.l} x2={PAD.l+cW} y1={py(v)} y2={py(v)}
          stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>
      ))}
      {/* Sprint race markers */}
      {CALENDAR_2026.map((r,i)=>SPRINT_ROUNDS.has(r.id)&&(
        <rect key={r.id} x={px(i)-4} y={PAD.t} width={8} height={cH}
          fill="rgba(245,158,11,0.06)"/>
      ))}
      {/* Driver curves */}
      {curves.map(({code, curve})=>{
        const d = DRIVERS_2026[code];
        const pts = curve.map((v,i)=>`${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
        return (
          <g key={code}>
            <polyline points={pts} fill="none" stroke={d.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx={px(curve.length-1)} cy={py(curve[curve.length-1])} r={4} fill={d.color}/>
            <text x={px(curve.length-1)+7} y={py(curve[curve.length-1])+4}
              fontSize={10} fill={d.color} fontWeight={700}>{code}</text>
          </g>
        );
      })}
      {/* Race labels every 4 races */}
      {CALENDAR_2026.filter((_,i)=>i%4===0||i===CALENDAR_2026.length-1).map((r,_,arr)=>{
        const i = CALENDAR_2026.indexOf(r);
        return (
          <g key={r.id}>
            <line x1={px(i)} x2={px(i)} y1={PAD.t+cH} y2={PAD.t+cH+5} stroke="rgba(255,255,255,0.18)" strokeWidth={1}/>
            <text x={px(i)} y={H-2} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.3)">{r.id}</text>
          </g>
        );
      })}
      {yTicks.map(v=>(
        <text key={v} x={PAD.l-8} y={py(v)+4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.35)">{v}</text>
      ))}
      <text x={14} y={PAD.t+cH/2} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)"
        transform={`rotate(-90,14,${PAD.t+cH/2})`}>Cumulative points</text>
    </svg>
  );
}

function PointsCurveView() {
  const champOdds = useMemo(() => computeChampionshipOdds(), []);
  const topDrivers = useMemo(() =>
    Object.entries(champOdds).sort((a,b)=>b[1].championP-a[1].championP).slice(0,6).map(([c])=>c),
    [champOdds]
  );
  const [selected, setSelected] = useState(() => topDrivers.slice(0,4));

  const curves = useMemo(() => seasonPointsCurve(selected), [selected]);

  const toggleDriver = (code) => {
    setSelected(prev =>
      prev.includes(code) ? (prev.length > 1 ? prev.filter(c=>c!==code) : prev)
        : prev.length < 6 ? [...prev, code] : prev
    );
  };

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Select drivers (max 6):</span>
        {topDrivers.map(code => {
          const d = DRIVERS_2026[code];
          const on = selected.includes(code);
          return (
            <button key={code} onClick={()=>toggleDriver(code)} style={{
              padding:'4px 10px', fontSize:11, borderRadius:6, cursor:'pointer',
              border:`1px solid ${d.color}${on?'88':'33'}`,
              background: on ? `${d.color}20` : 'transparent',
              color: on ? d.color : 'rgba(255,255,255,0.35)', fontWeight: on?700:400,
            }}>{code}</button>
          );
        })}
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginLeft:4 }}>
          <span style={{color:'rgba(245,158,11,0.6)'}}>■</span> = sprint weekend
        </span>
      </div>

      <div style={{ background:'#14141f', borderRadius:12, padding:'14px 4px 4px', border:'1px solid rgba(255,255,255,0.07)' }}>
        <PointsCurveChart curves={curves} />
      </div>

      {/* Season milestones */}
      <SectionLabel style={{marginTop:'1.25rem'}}>Projected season milestones</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
        {['Mid-season leader (R12)','Pre-finale leader (R22)','Final champion'].map((milestone, mi) => {
          const champOddsArr = useMemo(() => computeChampionshipOdds(), []);
          const raceIdx = [11,21,23][mi];
          const leader = selected.reduce((best, code) => {
            const c = curves.find(c=>c.code===code);
            const bestC = curves.find(c=>c.code===best);
            const idx = Math.min(raceIdx, CALENDAR_2026.length-1);
            return (c?.curve[idx]||0) > (bestC?.curve[idx]||0) ? code : best;
          }, selected[0]);
          const d = DRIVERS_2026[leader];
          const pts = curves.find(c=>c.code===leader)?.curve[Math.min(raceIdx, CALENDAR_2026.length-1)] || 0;
          return (
            <div key={milestone} style={{ background:'#14141f', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)', borderLeft:`3px solid ${d?.color}` }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:4 }}>{milestone}</div>
              <div style={{ fontSize:16, fontWeight:700, color:d?.color }}>{leader}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>{pts} projected pts</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── VIEW 4: CONSTRUCTORS ─────────────────────────────────────────────────────
function ConstructorsView() {
  const constructors = useMemo(() => computeConstructorOdds(), []);
  const maxPts = constructors[0]?.projPoints || 1;

  const TEAM_COLORS = {
    'Red Bull':'#3B82F6', 'Ferrari':'#EF4444', 'Mercedes':'#A78BFA',
    'McLaren':'#FBBF24', 'Aston Martin':'#34D399', 'Williams':'#FB7185',
    'Alpine':'#38BDF8', 'Haas':'#F472B6', 'Sauber/Audi':'#C084FC', 'Racing Bulls':'#67E8F9',
  };

  return (
    <div>
      {/* Top 3 team hero cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginBottom:'1.5rem' }}>
        {constructors.slice(0,3).map((team,i) => {
          const color = TEAM_COLORS[team.team] || '#888';
          const drivers = team.drivers.map(c => DRIVERS_2026[c]);
          return (
            <div key={team.team} style={{
              background:'#14141f', borderRadius:12, padding:'14px 16px',
              border:`1px solid ${color}30`, borderTop:`3px solid ${color}`,
            }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                {['Predicted champion','P2 favourite','P3 favourite'][i]}
              </div>
              <div style={{ fontSize:17, fontWeight:700, color, marginBottom:6 }}>{team.team}</div>
              <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                {drivers.map(d => d && (
                  <span key={d.code} style={{ fontSize:11, background:`${d.color}18`, color:d.color, borderRadius:4, padding:'2px 7px', fontWeight:700 }}>
                    {d.code}
                  </span>
                ))}
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:'#eeeef5' }}>{team.projPoints}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:4 }}>projected points</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
                Constructor champion: <strong style={{ color }}>{pct(team.championP,0)}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Constructor points bars */}
      <SectionLabel>Projected constructor standings — 2026 season</SectionLabel>
      <div style={{ background:'#14141f', borderRadius:12, padding:'16px', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'1rem' }}>
        {constructors.map((team,i) => {
          const color = TEAM_COLORS[team.team] || '#888';
          const pctW = (team.projPoints / maxPts) * 100;
          return (
            <div key={team.team} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', width:18 }}>{i+1}</span>
                  <span style={{ fontSize:12, fontWeight:700, color }}>{team.team}</span>
                  <div style={{ display:'flex', gap:4 }}>
                    {team.drivers.map(c => DRIVERS_2026[c]).filter(Boolean).map(d=>(
                      <DriverDot key={d.code} code={d.code} size={7}/>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
                    WCC: <strong style={{ color }}>{pct(team.championP,0)}</strong>
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color, fontFamily:'monospace' }}>{team.projPoints}</span>
                </div>
              </div>
              <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pctW}%`, background:color, opacity:0.8, borderRadius:4 }}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Car development scores */}
      <SectionLabel>2026 car performance ratings</SectionLabel>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>
              {['Team','Overall','Straight-line','Cornering','Tyre Deg','Reliability','Dev Rate','Reg Adaptation'].map(h=>(
                <th key={h} style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.35)', textAlign:'left', padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {constructors.map(team => {
              const car = CAR_2026[team.team];
              const color = TEAM_COLORS[team.team]||'#888';
              if(!car) return null;

              const rating = (v, max=1) => {
                const pctV = Math.round(v/max*100);
                const c = pctV>=90?'#22C55E':pctV>=80?'#F59E0B':'#EF4444';
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:30, height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pctV}%`, background:c, borderRadius:2 }}/>
                    </div>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>{pctV}</span>
                  </div>
                );
              };

              return (
                <tr key={team.team} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'8px 10px', fontWeight:700, color }}>{team.team}</td>
                  <td style={{ padding:'8px 10px' }}>{rating(car.overallPerf)}</td>
                  <td style={{ padding:'8px 10px' }}>{rating(car.straightLine)}</td>
                  <td style={{ padding:'8px 10px' }}>{rating(car.cornering)}</td>
                  <td style={{ padding:'8px 10px' }}>{rating(car.tyreDeg)}</td>
                  <td style={{ padding:'8px 10px' }}>{rating(car.reliability)}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ fontSize:10, color: car.developmentRate>1.03?'#22C55E':car.developmentRate>1.0?'#F59E0B':'#EF4444', fontWeight:600 }}>
                      {car.developmentRate > 1 ? '+' : ''}{((car.developmentRate-1)*100).toFixed(0)}%/rnd
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>{rating(car.regAdaptation)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SEASON RACE WINNER GRID ──────────────────────────────────────────────────
function SeasonCalendarView() {
  const [expanded, setExpanded] = useState(null);

  const racePredictions = useMemo(() =>
    CALENDAR_2026.map(race => {
      const preds = getRacePrediction(race.id, 3);
      return { race, preds, conf: confidenceScore(race.id) };
    }), []
  );

  return (
    <div>
      <SectionLabel>Predicted race winners — full 2026 season</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:8 }}>
        {racePredictions.map(({ race, preds, conf }) => {
          const fav = preds[0];
          if (!fav) return null;
          const d = fav.driver;
          const isExp = expanded === race.id;
          const isSprint = SPRINT_ROUNDS.has(race.id);

          return (
            <div key={race.id}
              onClick={() => setExpanded(isExp ? null : race.id)}
              style={{
                background:'#14141f', borderRadius:10, padding:'10px 12px',
                border:`1px solid ${isExp ? d.color+'60' : 'rgba(255,255,255,0.07)'}`,
                cursor:'pointer', transition:'border-color 0.15s',
              }}
              onMouseEnter={e => { if(!isExp) e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { if(!isExp) e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>R{race.round}</span>
                    <span style={{ fontSize:13 }}>{race.flag}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
                      {race.name.replace(' Grand Prix','')}
                    </span>
                    {isSprint && <span style={{ fontSize:7, background:'rgba(245,158,11,0.2)', color:'#F59E0B', borderRadius:3, padding:'1px 4px', fontWeight:700 }}>SPR</span>}
                  </div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)' }}>{race.date} · {race.circuit}</div>
                </div>
                <ConfidenceMeter score={conf} />
              </div>

              {/* Predicted winner */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background:`${d.color}12`, borderRadius:7, marginBottom:isExp?8:0 }}>
                <span style={{ fontSize:18 }}>🏆</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:d.color }}>{d.code}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{d.name}</div>
                </div>
                <div style={{ marginLeft:'auto', textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:d.color }}>{pct(fav.winP,0)}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>win prob</div>
                </div>
              </div>

              {/* Expanded: P2, P3 */}
              {isExp && (
                <>
                  {preds.slice(1).map((p, pi) => {
                    const pd = p.driver;
                    return (
                      <div key={pd.code} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', marginBottom:3, background:'rgba(255,255,255,0.03)', borderRadius:5 }}>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', width:16 }}>P{pi+2}</span>
                        <DriverDot code={pd.code} />
                        <span style={{ fontSize:11, color:pd.color, fontWeight:700, flex:1 }}>{pd.code}</span>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontFamily:'monospace' }}>{pct(p.winP)}</span>
                      </div>
                    );
                  })}
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:6, fontStyle:'italic' }}>{race.notes}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const VIEWS = [
  { id:'championship', label:'Championship', icon:'🏆' },
  { id:'races',        label:'Race Calendar', icon:'🗓' },
  { id:'predictor',    label:'Race Predictor', icon:'🎯' },
  { id:'points',       label:'Points Curve', icon:'📈' },
  { id:'constructors', label:'Constructors', icon:'🏭' },
];

export default function Prediction2026() {
  const [view, setView] = useState('championship');

  return (
    <div>
      {/* Feature header */}
      <div style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(59,130,246,0.08))', borderRadius:12, padding:'16px 20px', marginBottom:'1.25rem', border:'1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ background:'#E8002D', borderRadius:6, padding:'3px 9px', fontSize:14, fontWeight:900, color:'#fff', fontFamily:'monospace' }}>F1</div>
          <span style={{ fontSize:15, fontWeight:700, color:'#eeeef5' }}>2026 Season Prediction Engine</span>
          <span style={{ fontSize:10, background:'rgba(34,197,94,0.15)', color:'#4ADE80', borderRadius:5, padding:'2px 8px', fontWeight:600 }}>MONTE CARLO · 3,000 SIMULATIONS</span>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
          New 50/50 ICE/ERS power unit regulations · Active aerodynamics · Red Bull switches to Ford RBPTH001 · Hamilton joins Ferrari · Antonelli to Mercedes · Audi F1 debut · 24 races across 6 continents
        </div>
      </div>

      {/* Sub-navigation */}
      <div style={{ display:'flex', gap:6, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding:'7px 14px', fontSize:12, borderRadius:8, cursor:'pointer',
            border:'1px solid rgba(255,255,255,0.14)',
            background: view===v.id ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
            color: view===v.id ? '#F87171' : 'rgba(255,255,255,0.5)',
            fontWeight: view===v.id ? 700 : 400,
            display:'flex', alignItems:'center', gap:6,
          }}>
            <span>{v.icon}</span>{v.label}
          </button>
        ))}
      </div>

      {/* View content */}
      {view === 'championship'  && <ChampionshipView />}
      {view === 'races'         && <SeasonCalendarView />}
      {view === 'predictor'     && <RacePredictor />}
      {view === 'points'        && <PointsCurveView />}
      {view === 'constructors'  && <ConstructorsView />}
    </div>
  );
}
