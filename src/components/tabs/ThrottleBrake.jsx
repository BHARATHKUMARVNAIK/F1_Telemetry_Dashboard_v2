import { useMemo } from 'react';
import LineChart from '../LineChart.jsx';
import { InfoCard, Legend, SectionLabel } from '../UI.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { ALL_TELEMETRY, DIST } from '../../data/telemetry.js';
import { DRS_ZONES, CORNERS } from '../../data/circuit.js';
import { DRIVER_COLORS, withAlpha } from '../../utils/colors.js';
import { sub } from '../../utils/math.js';

const sDist = sub(DIST);

export default function ThrottleBrake() {
  const { selectedDrivers } = useDashboard();

  const thrSeries = useMemo(() =>
    selectedDrivers.map(code => ({
      label: code, data: ALL_TELEMETRY[code].s.throttle,
      color: DRIVER_COLORS[code],
      fill: withAlpha(DRIVER_COLORS[code], 0.07),
      unit: '%',
    })), [selectedDrivers]);

  const brkSeries = useMemo(() =>
    selectedDrivers.map(code => ({
      label: code, data: ALL_TELEMETRY[code].s.brake,
      color: DRIVER_COLORS[code],
      fill: withAlpha(DRIVER_COLORS[code], 0.08),
      unit: '%',
    })), [selectedDrivers]);

  const rpmSeries = useMemo(() =>
    selectedDrivers.map(code => ({
      label: code, data: ALL_TELEMETRY[code].s.rpm,
      color: DRIVER_COLORS[code],
      unit: ' rpm',
    })), [selectedDrivers]);

  const gearSeries = useMemo(() =>
    selectedDrivers.map(code => ({
      label: code, data: ALL_TELEMETRY[code].s.gear,
      color: DRIVER_COLORS[code],
      width: 1.5,
      unit: '',
    })), [selectedDrivers]);

  const legendItems = selectedDrivers.map(code => ({
    color: DRIVER_COLORS[code], label: code,
  }));

  return (
    <div>
      <Legend items={legendItems} />

      <SectionLabel>Throttle application (%)</SectionLabel>
      <LineChart series={thrSeries} xData={sDist}
        yMin={0} yMax={110} yLabel="Throttle (%)" height={195}
        drsZones={DRS_ZONES} corners={CORNERS} />

      <SectionLabel>Brake pressure (%)</SectionLabel>
      <LineChart series={brkSeries} xData={sDist}
        yMin={0} yMax={110} yLabel="Brake (%)" height={185}
        corners={CORNERS} />

      <SectionLabel>Engine RPM</SectionLabel>
      <LineChart series={rpmSeries} xData={sDist}
        yMin={5500} yMax={15500} yLabel="RPM" height={185}
        drsZones={DRS_ZONES} corners={CORNERS}
        formatY={v => (v/1000).toFixed(0)+'k'} />

      <SectionLabel>Gear selection (1–8)</SectionLabel>
      <LineChart series={gearSeries} xData={sDist}
        yMin={0} yMax={9} yLabel="Gear" height={160}
        corners={CORNERS} formatY={v => Math.round(v)} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginTop:'1.25rem' }}>
        <InfoCard accent="#3B82F6" title="Throttle application"
          body="F1 throttle is near-binary: 100% on straights, 0% in braking zones. The critical zone is corner exit — the quadratic ramp rate is limited by rear tyre traction. A driver who opens throttle 10m earlier at every corner gains ~0.7s per lap purely from exit speed." />
        <InfoCard accent="#EF4444" title="Brake pressure"
          body="Carbon-carbon discs reach 1,500°C in under 2 seconds. The triangle profile — build, peak, trail — shows trail braking: maintaining light brake pressure into the apex rotates the car while keeping front-axle load. Comparing brake points between drivers reveals who is most aggressive under braking." />
        <InfoCard accent="#8B5CF6" title="Engine RPM channel"
          body="F1 power units rev to ~15,000 RPM. The RPM trace reveals gear shift timing: sharp drops at downshifts, peaks before upshifts. In DRS zones, 8th gear is held at redline (~14,500 RPM). RPM vs throttle correlation exposes ERS (hybrid energy) deployment strategy." />
        <InfoCard accent="#F59E0B" title="Gear shift timing"
          body="8-speed semi-automatic gearboxes shift in ~15ms. Upshift timing on corner exit is critical — staying in a lower gear longer keeps engine RPM in the power band, but risks over-revving. Engineers optimize gear maps per circuit corner profile." />
      </div>
    </div>
  );
}
