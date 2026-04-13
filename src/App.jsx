import { useState } from 'react';
import { DashboardProvider } from './context/DashboardContext.jsx';
import Header from './components/Header.jsx';
import SpeedTrace      from './components/tabs/SpeedTrace.jsx';
import ThrottleBrake   from './components/tabs/ThrottleBrake.jsx';
import TyreDegradation from './components/tabs/TyreDegradation.jsx';
import CornerAnalysis  from './components/tabs/CornerAnalysis.jsx';
import LapDelta        from './components/tabs/LapDelta.jsx';
import TrackMapTab     from './components/tabs/TrackMapTab.jsx';
import CornerInsights  from './components/tabs/CornerInsights.jsx';
import Strategy        from './components/tabs/Strategy.jsx';
import Prediction2026  from './components/tabs/Prediction2026.jsx';

const TABS = [
  { id:'speed',      label:'Speed Trace',      icon:'⚡', component: SpeedTrace },
  { id:'pedals',     label:'Throttle & Brake', icon:'🎮', component: ThrottleBrake },
  { id:'delta',      label:'Lap Delta',        icon:'⏱', component: LapDelta },
  { id:'map',        label:'Track Map',        icon:'🗺', component: TrackMapTab },
  { id:'tyres',      label:'Tyre Model',       icon:'🔴', component: TyreDegradation },
  { id:'corners',    label:'Corner Analysis',  icon:'📐', component: CornerAnalysis },
  { id:'insights',   label:'AI Insights',      icon:'🧠', component: CornerInsights },
  { id:'strategy',   label:'Strategy Engine',  icon:'♟', component: Strategy },
  { id:'predict26',  label:'2026 Predictions', icon:'🏆', component: Prediction2026, highlight: true },
];

function TabBar({ active, setActive }) {
  return (
    <div style={{
      background:'#0e0e18', borderBottom:'1px solid rgba(255,255,255,0.07)',
      padding:'0 1.5rem', display:'flex', gap:0,
      overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch',
    }}>
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => setActive(tab.id)} style={{
          padding:'10px 15px', fontSize:11.5,
          fontWeight: active===tab.id ? 600 : 400,
          color: active===tab.id
            ? (tab.highlight ? '#F87171' : '#eeeef5')
            : tab.highlight ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.38)',
          cursor:'pointer', border:'none', background:'none',
          borderBottom: active===tab.id
            ? `2px solid ${tab.highlight ? '#EF4444' : '#3B82F6'}`
            : '2px solid transparent',
          whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6,
          transition:'color 0.15s',
        }}
          onMouseEnter={e=>{ if(active!==tab.id) e.currentTarget.style.color=tab.highlight?'rgba(239,68,68,0.9)':'rgba(255,255,255,0.65)'; }}
          onMouseLeave={e=>{ if(active!==tab.id) e.currentTarget.style.color=tab.highlight?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.38)'; }}
        >
          <span style={{fontSize:13}}>{tab.icon}</span>
          {tab.label}
          {tab.highlight && active !== tab.id && (
            <span style={{fontSize:7,background:'rgba(239,68,68,0.2)',color:'#F87171',borderRadius:3,padding:'1px 4px',fontWeight:700,marginLeft:2}}>NEW</span>
          )}
        </button>
      ))}
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('speed');
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? SpeedTrace;

  return (
    <div style={{ minHeight:'100vh', background:'#07070d', color:'#eeeef5' }}>
      <Header />
      <TabBar active={activeTab} setActive={setActiveTab} />
      <main style={{ maxWidth:1280, margin:'0 auto', padding:'1.5rem 1.5rem 3rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'rgba(255,255,255,0.22)', marginBottom:'1.25rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          <span>Dashboard</span><span>/</span>
          <span style={{color:'rgba(255,255,255,0.45)'}}>{TABS.find(t=>t.id===activeTab)?.label}</span>
        </div>
        <ActiveComponent />
      </main>
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'0.875rem 1.5rem', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, fontSize:10, color:'rgba(255,255,255,0.18)' }}>
        <span>F1 Pit Wall Platform v2.0 · React + Custom SVG · Zero chart libraries · FastF1-ready · 2026 Prediction Engine</span>
        <span>Real data: <code style={{fontFamily:'monospace',color:'rgba(255,255,255,0.35)'}}>pip install fastf1</code></span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider><AppContent /></DashboardProvider>
  );
}
