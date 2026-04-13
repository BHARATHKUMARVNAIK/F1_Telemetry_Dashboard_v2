
# 🏎️ F1 Pit Wall Platform v2.0

**A production-grade, multi-driver Formula 1 race-engineering analysis platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Chart%20Libraries-Zero-red)](package.json)

> Compare up to 5 drivers simultaneously. Analyze speed, throttle, brake, RPM, gear, tyre degradation, and lap delta. AI-generated corner insights. Full strategy recommendation engine. SVG track map with telemetry heatmap. All with zero external chart libraries.

---

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/f1-telemetry-platform.git
cd f1-telemetry-platform
npm install
npm run dev          # → http://localhost:5173
npm run build        # Production build → /dist
npm run deploy       # Deploy to GitHub Pages
```

---

## 📸 Features

| Tab | What it shows |
|-----|--------------|
| ⚡ **Speed Trace** | Multi-driver speed vs distance · DRS zones · Q3 lap time table |
| 🎮 **Throttle & Brake** | Throttle %, brake pressure, RPM, gear selection — all synchronized |
| ⏱ **Lap Delta** | Gap trace vs fastest driver · sector-by-sector breakdown |
| 🗺 **Track Map** | SVG Bahrain circuit · speed/throttle/brake/gear/DRS overlay modes |
| 🔴 **Tyre Model** | Per-driver compound degradation · fuel effect · rate comparison |
| 📐 **Corner Analysis** | Min speed per corner · multi-driver bar chart · sortable table |
| 🧠 **AI Insights** | Automated race-engineer recommendations · time loss heatmap |
| ♟ **Strategy Engine** | Pit strategy scoring · Gantt timeline · undercut/overcut alerts |

### Key capabilities
- **Dynamic driver selection** — choose any 2–5 drivers from the full 2024 Bahrain Q3 grid
- **Hover sync** — moving the cursor on any chart highlights the same track position on every other chart simultaneously
- **Persistent color mapping** — each driver's color is consistent across all 8 tabs
- **Zero chart libraries** — every visualization is a custom SVG component
- **FastF1-ready** — swap the modelled data arrays for real telemetry without touching the UI layer

---

## 🏗️ Architecture

```
src/
├── context/
│   └── DashboardContext.jsx   ← shared state: selected drivers, hover sync, map mode
│
├── data/
│   ├── telemetry.js           ← multi-driver telemetry engine
│   │                             speed waypoints · brake zones · throttle ramps
│   │                             gear · RPM · tyre degradation · fuel model
│   │                             lap delta · sector splits · real lap time scaling
│   ├── circuit.js             ← Bahrain circuit: corners · DRS zones · SVG track path
│   ├── analysis.js            ← corner insight engine: apex speed · braking point
│   │                             throttle pickup · time-loss quantification
│   └── strategy.js            ← strategy engine: stint pace prediction
│                                 undercut scoring · pit window optimization
│
├── utils/
│   ├── math.js                ← smoothstep · seeded LCG · formatters
│   └── colors.js              ← 11-driver persistent color palette
│
├── components/
│   ├── LineChart.jsx          ← reusable synchronized SVG line chart
│   ├── TrackMap.jsx           ← SVG circuit with telemetry overlay
│   ├── DriverSelector.jsx     ← multi-select dropdown with Q3 times
│   ├── Header.jsx             ← sticky top bar
│   ├── UI.jsx                 ← MetricCard · InfoCard · Legend · SeverityBadge
│   └── tabs/
│       ├── SpeedTrace.jsx
│       ├── ThrottleBrake.jsx
│       ├── LapDelta.jsx
│       ├── TrackMapTab.jsx
│       ├── TyreDegradation.jsx
│       ├── CornerAnalysis.jsx
│       ├── CornerInsights.jsx
│       └── Strategy.jsx
│
├── App.jsx                    ← root + tab routing
├── main.jsx                   ← React entry point
└── index.css                  ← global dark theme
```

### Architectural decisions

**React Context for hover sync** — When hovering the speed chart, all other charts need to display the crosshair at the same track distance. Lifting this into a context avoids prop-drilling 4 levels deep and ensures synchronization even if tabs are independently rendered.

**Seeded LCG for deterministic data** — Every driver's telemetry uses a Linear Congruential Generator seeded from their driver code. The same seed always produces the same "noise", making charts reproducible across renders — critical for debugging and for any future snapshot testing.

**Smoothstep interpolation** — Speed profiles are built from `~75 waypoints` per driver interpolated with `t² × (3−2t)`. This produces realistic S-curve transitions matching real F1 telemetry shape without requiring actual sensor data.

**Physical lap time scaling** — After generating a raw speed profile, the engine scales all speeds by the ratio needed to match each driver's real 2024 Bahrain Q3 lap time. This ensures the derived lap delta is physically accurate to the actual qualifying result.

**Zero external chart libraries** — All visualizations are custom SVG polylines with coordinate transforms written by hand. This demonstrates deep understanding of rendering primitives and produces smaller bundle sizes than Chart.js/Recharts (which add ~300KB gzipped).

---

## 🔌 Real Data Integration (FastF1)

Replace the modelled arrays with real telemetry in under 20 lines:

### Python extraction script

```python
# scripts/extract_session.py
import fastf1
import json

fastf1.Cache.enable_cache('cache/')
session = fastf1.get_session(2024, 'Bahrain', 'Q')
session.load()

drivers = ['VER', 'LEC', 'SAI', 'NOR', 'PIA']
output = {}

for code in drivers:
    lap = session.laps.pick_driver(code).pick_fastest()
    tel = lap.get_telemetry().add_distance()
    
    output[code] = {
        'speed':    tel['Speed'].round().tolist(),
        'throttle': tel['Throttle'].round().tolist(),
        'brake':    (tel['Brake'].astype(float) * 100).round().tolist(),
        'gear':     tel['nGear'].tolist(),
        'rpm':      tel['RPM'].round().tolist(),
        'distance': tel['Distance'].round().tolist(),
        'lapTime':  lap['LapTime'].total_seconds(),
    }

with open('src/data/real_telemetry.json', 'w') as f:
    json.dump(output, f)

print("Done. Lap times:")
for code in drivers:
    lap = session.laps.pick_driver(code).pick_fastest()
    print(f"  {code}: {lap['LapTime']}")
```

### React side (3-line swap in telemetry.js)

```js
// In src/data/telemetry.js — replace the buildDriverTelemetry function:
import realData from './real_telemetry.json';

export function buildDriverTelemetry(code) {
  const d = realData[code];
  if (!d) return buildModelledTelemetry(code); // fallback to model
  return {
    code,
    speed:    d.speed,
    throttle: d.throttle,
    brake:    d.brake,
    gear:     d.gear,
    rpm:      d.rpm,
    // tyre degradation stays modelled until FastF1 race data is loaded
    softDeg: buildTyreDeg(90.45, 0.072, 1.8, 0.06, 20, mkRng(42)),
    medDeg:  buildTyreDeg(91.18, 0.038, 0.6, 0.04, 28, mkRng(31)),
    hardDeg: buildTyreDeg(91.82, 0.017, 0.3, 0.03, 38, mkRng(53)),
    s: {
      dist:     sub(d.distance),
      speed:    sub(d.speed),
      throttle: sub(d.throttle),
      brake:    sub(d.brake),
      gear:     sub(d.gear),
      rpm:      sub(d.rpm),
    }
  };
}
```

The entire UI layer — all 8 tabs, all charts, all analysis — continues working without any changes. The data layer is fully decoupled from the presentation layer.

---

## 🚢 Deployment

### GitHub Pages

```bash
# Add to package.json:
# "homepage": "https://YOUR_USERNAME.github.io/f1-telemetry-platform"
# "deploy": "gh-pages -d dist"

npm run build
npm run deploy
```

Add `base: '/f1-telemetry-platform/'` to `vite.config.js` for subdirectory hosting.

### Vercel (zero-config)

```bash
npx vercel --prod
```

### Netlify

Drag `/dist` to [app.netlify.com/drop](https://app.netlify.com/drop).

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 📈 Roadmap

- [ ] **Live FastF1 session loader** — Python FastAPI backend with real-time data
- [ ] **All circuits** — Extend circuit.js to support all 24 2024 calendar tracks  
- [ ] **Race pace mode** — Load race data (not just qualifying) for stint analysis
- [ ] **Tyre stint detection** — Auto-detect stint boundaries from lap time variance
- [ ] **Weather channel** — Overlay air/track temperature and rain flag
- [ ] **ERS channel** — Energy deployment analysis (MGU-K, MGU-H)
- [ ] **G-force traces** — Lateral and longitudinal acceleration channels
- [ ] **Driver fingerprinting** — ML clustering of driving style across a season
- [ ] **Pit stop optimizer** — Optimal pit lap under traffic and safety car scenarios
- [ ] **Season heatmap** — Driver performance matrix across all 2024 rounds

---

## 🧠 Telemetry Concepts Reference

**Speed Trace** — Speed (km/h) vs distance (m). The sawtooth shape encodes the circuit: climbs on straights, drops at braking zones. Comparing traces shows exactly where gaps form.

**Throttle ramp** — The quadratic opening of throttle on corner exit, limited by rear tyre traction. A 10m earlier ramp = ~0.05s per corner = ~0.7s/lap over 15 corners.

**Trail braking** — Maintaining light brake pressure into the corner apex. Shifts weight forward to rotate the car without losing rear traction. Visible as a gradual brake release rather than a hard cutoff.

**Lap delta (gap trace)** — Cumulative time difference, computed as `Δt = Δd/v` at each segment. Positive = reference driver ahead at that point; negative = comparison driver ahead. The single most actionable chart for race engineering.

**Minimum corner speed** — Slowest point through a corner (at apex). Every 1 km/h ≈ 0.005s of lap time. 5 km/h average deficit over 12 corners = 0.3s — the gap between P3 and P7.

**Tyre degradation cliff** — When soft compound rubber exceeds ~100°C operating temperature consistently, lap times increase exponentially. The "cliff" lap depends on track temperature, driving style, and car setup.

**Undercut** — Pitting before a rival, setting fast laps on fresh tyres, emerging ahead after their stop. Viable when tyre delta > 0.8s/lap and gap < 22s (pit loss).

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**[⭐ Star this repo](https://github.com/YOUR_USERNAME/f1-telemetry-platform)** · Built for motorsport engineers and data enthusiasts

</div>
