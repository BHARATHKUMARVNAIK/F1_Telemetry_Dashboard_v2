import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext.jsx';
import { ALL_DRIVERS, DRIVER_COLORS, DRIVER_FULL, DRIVER_NUM, DRIVER_TEAM, DRIVER_LAPTIME } from '../utils/colors.js';
import { fmtLap } from '../utils/math.js';

export default function DriverSelector() {
  const { selectedDrivers, toggleDriver } = useDashboard();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative', zIndex:50 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:10,
          background:'#14141f', border:'1px solid rgba(255,255,255,0.14)',
          borderRadius:8, padding:'7px 12px', color:'#eeeef5',
          fontSize:12, cursor:'pointer', minWidth:220,
        }}
      >
        {/* Driver color dots */}
        <div style={{ display:'flex', gap:3 }}>
          {selectedDrivers.map(code => (
            <span key={code} style={{
              width:8, height:8, borderRadius:'50%',
              background: DRIVER_COLORS[code], flexShrink:0,
            }}/>
          ))}
        </div>
        <span style={{ flex:1, textAlign:'left' }}>
          {selectedDrivers.length === 1
            ? selectedDrivers[0]
            : `${selectedDrivers.length} drivers selected`}
        </span>
        <span style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0,
          background:'#14141f', border:'1px solid rgba(255,255,255,0.14)',
          borderRadius:10, padding:8, minWidth:300,
          boxShadow:'0 12px 40px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', padding:'4px 8px 8px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Select 2–5 drivers · {selectedDrivers.length} selected
          </div>
          {ALL_DRIVERS.map((code, i) => {
            const selected = selectedDrivers.includes(code);
            const disabled = !selected && selectedDrivers.length >= 5;
            const color = DRIVER_COLORS[code];
            return (
              <div key={code}
                onClick={() => !disabled && toggleDriver(code)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'7px 10px', borderRadius:6, cursor: disabled ? 'not-allowed' : 'pointer',
                  background: selected ? `${color}18` : 'transparent',
                  opacity: disabled ? 0.4 : 1,
                  transition:'background 0.1s',
                }}
                onMouseEnter={e => { if(!disabled && !selected) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = selected ? `${color}18` : 'transparent'; }}
              >
                {/* Check indicator */}
                <div style={{
                  width:14, height:14, borderRadius:3, flexShrink:0,
                  background: selected ? color : 'transparent',
                  border: selected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {selected && <span style={{fontSize:9, color:'#fff', fontWeight:800}}>✓</span>}
                </div>

                {/* Driver number badge */}
                <div style={{
                  width:22, height:22, borderRadius:4, background: color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:9, fontWeight:800, color:'#fff', flexShrink:0,
                }}>{DRIVER_NUM[code]}</div>

                {/* Driver info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:color }}>{code}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:1 }}>
                    {DRIVER_FULL[code]} · {DRIVER_TEAM[code]}
                  </div>
                </div>

                {/* Q3 Lap time */}
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', textAlign:'right' }}>
                  {fmtLap(DRIVER_LAPTIME[code])}
                </div>
              </div>
            );
          })}

          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', marginTop:6, padding:'6px 8px 0' }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>
              Lap times: Bahrain 2024 Qualifying Q3
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
