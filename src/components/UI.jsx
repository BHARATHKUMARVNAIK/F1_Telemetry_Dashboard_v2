export function MetricCard({ label, value, sub, color, accent }) {
  return (
    <div style={{
      background:'#14141f', borderRadius:10, padding:'10px 14px',
      border:`1px solid rgba(255,255,255,0.07)`,
      borderLeft: accent ? `3px solid ${accent}` : '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{fontSize:10,color:'rgba(255,255,255,0.38)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</div>
      <div style={{fontSize:20,fontWeight:600,color:color||'#eeeef5',letterSpacing:'-0.02em'}}>{value}</div>
      {sub && <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:3}}>{sub}</div>}
    </div>
  );
}

export function InfoCard({ title, body, accent='#3B82F6' }) {
  return (
    <div style={{
      background:'#14141f', borderRadius:10, padding:'11px 14px',
      border:'1px solid rgba(255,255,255,0.07)',
      borderLeft:`3px solid ${accent}`,
    }}>
      <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.38)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>{title}</div>
      <div style={{fontSize:11.5,color:'rgba(255,255,255,0.65)',lineHeight:1.65}}>{body}</div>
    </div>
  );
}

export function SectionLabel({ children, style }) {
  return (
    <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.38)',marginBottom:8,marginTop:'1.1rem',textTransform:'uppercase',letterSpacing:'0.06em',...style}}>
      {children}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div style={{display:'flex',gap:16,marginBottom:10,fontSize:11,color:'rgba(255,255,255,0.5)',flexWrap:'wrap',alignItems:'center'}}>
      {items.map(({color,label,dash})=>(
        <span key={label} style={{display:'flex',alignItems:'center',gap:6}}>
          <svg width={22} height={4} style={{flexShrink:0}}>
            <line x1={0} y1={2} x2={22} y2={2} stroke={color} strokeWidth={2.5} strokeDasharray={dash||'none'}/>
          </svg>
          {label}
        </span>
      ))}
    </div>
  );
}

export function Pill({ label, color, bg }) {
  return (
    <span style={{
      background: bg || `${color}22`,
      color: color,
      borderRadius:4,
      padding:'2px 7px',
      fontSize:9,
      fontWeight:600,
      display:'inline-block',
    }}>{label}</span>
  );
}

export function SeverityBadge({ severity }) {
  const map = {
    critical: { bg:'rgba(239,68,68,0.15)', color:'#F87171', label:'Critical' },
    moderate: { bg:'rgba(245,158,11,0.15)', color:'#FCD34D', label:'Moderate' },
    minor:    { bg:'rgba(34,197,94,0.12)', color:'#4ADE80', label:'Minor' },
    info:     { bg:'rgba(139,92,246,0.15)', color:'#A78BFA', label:'Info' },
  };
  const s = map[severity] || map.info;
  return <Pill label={s.label} color={s.color} bg={s.bg}/>;
}
