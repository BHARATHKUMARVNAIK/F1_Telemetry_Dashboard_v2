import DriverSelector from './DriverSelector.jsx';
import { useDashboard } from '../context/DashboardContext.jsx';
import { DRIVER_COLORS, DRIVER_NUM } from '../utils/colors.js';

export default function Header() {
  const { selectedDrivers } = useDashboard();

  return (
    <header style={{
      background: '#0e0e18',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '0.65rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          background: '#E8002D', borderRadius: 6,
          padding: '3px 9px', fontSize: 14, fontWeight: 900,
          color: '#fff', letterSpacing: '0.04em', fontFamily: 'monospace',
        }}>F1</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#eeeef5', letterSpacing: '-0.01em' }}>
            Pit Wall Platform <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>v2.0</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
            2024 Bahrain GP · Qualifying Q3 · Sakhir · 5.412 km
          </div>
        </div>
      </div>

      {/* Center: active driver pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
        {selectedDrivers.map(code => (
          <div key={code} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${DRIVER_COLORS[code]}18`,
            border: `1px solid ${DRIVER_COLORS[code]}35`,
            borderRadius: 7, padding: '4px 9px',
          }}>
            <span style={{
              width: 19, height: 19, borderRadius: 3,
              background: DRIVER_COLORS[code],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>{DRIVER_NUM[code]}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: DRIVER_COLORS[code] }}>{code}</span>
          </div>
        ))}
      </div>

      {/* Right: driver selector */}
      <DriverSelector />
    </header>
  );
}
