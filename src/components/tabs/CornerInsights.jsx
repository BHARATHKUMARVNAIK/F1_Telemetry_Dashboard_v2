import { useMemo, useState } from 'react';
import { MetricCard, SeverityBadge, SectionLabel, InfoCard } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { analyzeCorners, cornerLossTable } from '../../data/analysis.js';
import { DRIVER_COLORS } from '../../utils/colors.js';

const TYPE_ICONS = {
  apex_speed:     { icon:'🔺', label:'Apex Speed' },
  throttle_pickup:{ icon:'⚡', label:'Throttle Pickup' },
  braking_point:  { icon:'🛑', label:'Braking Point' },
  comparative:    { icon:'📊', label:'Comparative' },
};

const CORNER_TYPE_COLOR = {
  fast:'#60A5FA', medium:'#4ADE80', slow:'#F87171', hairpin:'#FCD34D', chicane:'#A78BFA'
};

export default function CornerInsights() {
  const { selectedDrivers } = useDashboard();
  const [filter, setFilter] = useState('ALL'); // driver filter
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const insights = useMemo(() => analyzeCorners(selectedDrivers), [selectedDrivers]);
  const lossTable = useMemo(() => cornerLossTable(selectedDrivers), [selectedDrivers]);

  const filtered = insights.filter(i =>
    (filter === 'ALL' || i.driver === filter || i.driver === 'ALL') &&
    (typeFilter === 'ALL' || i.type === typeFilter)
  );

  const totalInsights = insights.length;
  const criticalCount = insights.filter(i=>i.severity==='critical').length;
  const totalLoss = Object.values(lossTable).reduce((a,b)=>a+b.totalLoss,0);

  return (
    <div>
      {/* Summary metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:9, marginBottom:'1rem' }}>
        <MetricCard label="Total insights" value={totalInsights} sub="Across all corners" color="rgba(255,255,255,0.8)"/>
        <MetricCard label="Critical issues" value={criticalCount} sub="Require attention" color="#F87171" accent="#EF4444"/>
        {selectedDrivers.map(code=>(
          <MetricCard key={code}
            label={`${code} total loss`}
            value={`${(lossTable[code]?.totalLoss||0).toFixed(3)}s`}
            sub={`vs best peer`}
            color={DRIVER_COLORS[code]} accent={DRIVER_COLORS[code]}
          />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginRight:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Driver:</span>
        {['ALL', ...selectedDrivers, 'ALL (comparative)'].map(f => {
          const val = f === 'ALL (comparative)' ? 'comparative_all' : f;
          return (
            <button key={f} onClick={()=>setFilter(val==='comparative_all'?'ALL_COMP':f)} style={{
              padding:'4px 10px', fontSize:11, borderRadius:6,
              border:`1px solid ${f==='ALL'||f.includes('ALL') ? 'rgba(255,255,255,0.14)' : `${DRIVER_COLORS[f]}44`}`,
              background: filter===f ? (f==='ALL'||f.includes('ALL') ? 'rgba(255,255,255,0.1)' : `${DRIVER_COLORS[f]}22`) : 'transparent',
              color: f==='ALL'||f.includes('ALL') ? (filter===f?'#eeeef5':'rgba(255,255,255,0.45)') : DRIVER_COLORS[f],
              cursor:'pointer', fontWeight:filter===f?600:400,
            }}>{f}</button>
          );
        })}

        <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginLeft:10, marginRight:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Type:</span>
        {[['ALL','All issues'],['apex_speed','Apex Speed'],['throttle_pickup','Throttle'],['braking_point','Braking'],['comparative','Comparison']].map(([v,l])=>(
          <button key={v} onClick={()=>setTypeFilter(v)} style={{
            padding:'4px 10px', fontSize:11, borderRadius:6,
            border:'1px solid rgba(255,255,255,0.12)',
            background:typeFilter===v?'rgba(255,255,255,0.1)':'transparent',
            color:typeFilter===v?'#eeeef5':'rgba(255,255,255,0.4)',
            cursor:'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* Time loss heatmap per driver per corner */}
      <SectionLabel>Time loss heatmap by corner</SectionLabel>
      <div style={{ overflowX:'auto', marginBottom:'1.25rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${selectedDrivers.length+1},auto)`, gap:4, width:'fit-content' }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', padding:'4px 8px', fontWeight:600 }}>Corner</div>
          {selectedDrivers.map(code=>(
            <div key={code} style={{ fontSize:9, color:DRIVER_COLORS[code], padding:'4px 8px', fontWeight:700, textAlign:'center' }}>{code}</div>
          ))}
          {['T1','T2','T3','T4','T5/6','T8','T10','T11','T13','T14','T15','T17/18'].map(cn=>(
            <>
              <div key={cn} style={{ fontSize:10, color:'rgba(255,255,255,0.5)', padding:'4px 8px', fontFamily:'monospace', borderTop:'1px solid rgba(255,255,255,0.05)' }}>{cn}</div>
              {selectedDrivers.map(code=>{
                const corner = lossTable[code]?.byCorner?.find(c=>c.corner===cn);
                const loss = corner?.loss||0;
                const intensity = Math.min(1, loss/0.15);
                return (
                  <div key={code} style={{
                    padding:'4px 8px', textAlign:'center',
                    background:`rgba(239,68,68,${intensity*0.6})`,
                    fontSize:10, fontFamily:'monospace',
                    color: intensity>0.3 ? '#fff' : 'rgba(255,255,255,0.4)',
                    borderRadius:3, borderTop:'1px solid rgba(255,255,255,0.05)',
                    minWidth:55,
                  }}>
                    {loss>0?`-${loss.toFixed(3)}s`:'—'}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Insights list */}
      <SectionLabel>Race engineer insights ({filtered.length} shown)</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && (
          <div style={{ padding:'2rem', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
            No insights match current filters.
          </div>
        )}
        {filtered.slice(0,25).map((insight, i) => {
          const typeInfo = TYPE_ICONS[insight.type] || { icon:'📌', label:'Insight' };
          const isExp = expanded===i;
          return (
            <div key={i}
              style={{
                background: '#14141f',
                border: `1px solid ${insight.severity==='critical'?'rgba(239,68,68,0.3)':insight.severity==='moderate'?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.07)'}`,
                borderRadius:10,
                padding:'12px 14px',
                cursor:'pointer',
              }}
              onClick={()=>setExpanded(isExp?null:i)}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:16 }}>{typeInfo.icon}</span>

                {/* Driver badge */}
                {insight.driver !== 'ALL' && (
                  <span style={{ fontSize:11, fontWeight:700, color:DRIVER_COLORS[insight.driver]||'#888',
                    background:`${DRIVER_COLORS[insight.driver]||'#888'}18`, borderRadius:4, padding:'2px 7px' }}>
                    {insight.driver}
                  </span>
                )}

                <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)', flex:1 }}>
                  {insight.message}
                </span>

                <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                  <SeverityBadge severity={insight.severity}/>
                  <span style={{ fontSize:10, fontFamily:'monospace',
                    color:insight.timeLoss>0.1?'#F87171':insight.timeLoss>0.05?'#FCD34D':'#4ADE80' }}>
                    {insight.timeLoss>0?`-${insight.timeLoss.toFixed(3)}s`:''}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{isExp?'▲':'▼'}</span>
                </div>
              </div>

              {isExp && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:8, lineHeight:1.6 }}>
                    {insight.message}
                  </div>
                  <div style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:7, padding:'8px 12px' }}>
                    <div style={{ fontSize:10, fontWeight:600, color:'#A78BFA', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      🎯 Race engineer recommendation
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', lineHeight:1.65 }}>
                      {insight.recommendation}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:9, background:'rgba(255,255,255,0.07)', borderRadius:4, padding:'2px 7px', color:'rgba(255,255,255,0.4)' }}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <span style={{ fontSize:9, background:'rgba(255,255,255,0.07)', borderRadius:4, padding:'2px 7px', color:'rgba(255,255,255,0.4)' }}>
                      📍 {insight.corner}
                    </span>
                    {insight.timeLoss > 0 && (
                      <span style={{ fontSize:9, background:'rgba(239,68,68,0.12)', borderRadius:4, padding:'2px 7px', color:'#F87171' }}>
                        ⏱ −{insight.timeLoss.toFixed(3)}s estimated
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginTop:'1.5rem' }}>
        <InfoCard accent="#EF4444" title="How insights are generated"
          body="Each corner is analysed for three performance metrics: apex minimum speed (vs best peer), throttle pickup distance (vs earliest peer), and brake point distance (vs latest peer). Speed differences are converted to time using physics: Δt = ΔL × (1/V1 − 1/V2)." />
        <InfoCard accent="#8B5CF6" title="Severity classification"
          body="Critical = estimated time loss > 0.10s at a single corner. Moderate = 0.05–0.10s. Minor = less than 0.05s. Critical issues are the priorities for setup changes, coaching sessions, or simulator work before the next session." />
        <InfoCard accent="#22C55E" title="Acting on recommendations"
          body="Race engineers use insights like these to brief drivers between sessions: 'You're losing 0.18s at T10 on throttle pickup — watch your exit video.' In qualifying trim, fixing one moderate issue can move a driver from P6 to P4 on the grid." />
      </div>
    </div>
  );
}
