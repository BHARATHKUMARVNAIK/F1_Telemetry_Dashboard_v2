import TrackMap from '../TrackMap.jsx';
import { InfoCard, SectionLabel } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { DRIVER_COLORS, DRIVER_FULL } from '../../utils/colors.js';

export default function TrackMapTab() {
  const { selectedDrivers, mapMode } = useDashboard();

  const modeDescriptions = {
    speed:    { title:'Speed heatmap', body:'Each segment of the racing line is colour-coded by vehicle speed. Blue = slow (hairpins, braking zones), green/yellow = medium speed, red = maximum speed (DRS straights, fast corners). Multiple driver lines are offset perpendicular to the track axis for visibility.' },
    throttle: { title:'Throttle zones', body:'Green = throttle open (100%), red = throttle closed (0%). Braking zones appear as large red bands. Corner exits show the throttle ramp — the transition from red to green is the critical traction zone where lap time is won or lost.' },
    brake:    { title:'Brake pressure overlay', body:'Red intensity shows brake pressure applied at each track position. Bright red = maximum pressure (hairpins, chicanes). White/transparent = no braking. Comparing brake zone lengths between drivers reveals who is braking later and harder.' },
    gear:     { title:'Gear selection map', body:'Each colour represents a gear (1=green to 8=yellow). Hairpins appear as dark low-gear zones; DRS straights are bright yellow (8th). Gear selection is a derived channel from speed — real implementation would use the CAN bus gear encoder signal.' },
    drs:      { title:'DRS activation zones', body:'Green dots mark the two DRS zones on the Bahrain circuit. Zone 1 covers the main straight; Zone 2 covers the back straight. DRS activation adds ~12–15 km/h of straight-line speed by opening the rear wing flap.' },
  };

  const current = modeDescriptions[mapMode];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem', flexWrap:'wrap' }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#eeeef5' }}>
          Bahrain International Circuit — Telemetry Overlay
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {selectedDrivers.map(code => (
            <span key={code} style={{
              display:'flex', alignItems:'center', gap:5,
              background:`${DRIVER_COLORS[code]}18`,
              border:`1px solid ${DRIVER_COLORS[code]}35`,
              borderRadius:6, padding:'3px 8px',
              fontSize:11, color:DRIVER_COLORS[code], fontWeight:600,
            }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:DRIVER_COLORS[code] }}/>
              {code}
            </span>
          ))}
        </div>
      </div>

      <TrackMap height={460} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginTop:'1.25rem' }}>
        <InfoCard accent="#22C55E" title={current.title} body={current.body} />
        <InfoCard accent="#3B82F6" title="Multi-driver line separation"
          body="When multiple drivers are selected, each racing line is offset by 3–4 pixels perpendicular to the track direction. This prevents lines from overlapping while maintaining accurate positional mapping. Real F1 analysis tools use the same technique for multi-car overlays." />
        <InfoCard accent="#F59E0B" title="Track map applications"
          body="Engineers use circuit overlays to identify brake point discrepancies (one driver locks up consistently at T8), throttle application zones (who opens throttle earliest at T1 exit), and gear strategy differences (is a driver using 7th or 8th gear through T14?). Each pattern reveals a setup or technique question." />
      </div>

      <SectionLabel style={{ marginTop:'1.5rem' }}>Circuit corner reference</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
        {[
          {label:'Fast (180+ km/h)', color:'#60A5FA', corners:'T14, T17/18'},
          {label:'Medium (130–180)', color:'#4ADE80', corners:'T1, T2, T10'},
          {label:'Slow (80–130)',    color:'#F87171', corners:'T4, T11'},
          {label:'Hairpin (<80)',    color:'#FCD34D', corners:'T3, T8, T13, T15'},
          {label:'Chicane',         color:'#A78BFA', corners:'T5/6'},
          {label:'DRS zones',       color:'rgba(34,197,94,0.8)', corners:'S/F straight, Back straight'},
        ].map(item=>(
          <div key={item.label} style={{ background:'#14141f', borderRadius:8, padding:'8px 12px', border:'1px solid rgba(255,255,255,0.07)', borderLeft:`3px solid ${item.color}` }}>
            <div style={{ fontSize:10, fontWeight:600, color:item.color, marginBottom:3 }}>{item.label}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{item.corners}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
