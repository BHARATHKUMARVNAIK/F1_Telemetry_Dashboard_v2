/**
 * 2026 F1 CALENDAR & CIRCUIT INTELLIGENCE
 *
 * Each circuit entry contains everything the prediction engine needs:
 *   - Track type (determines car performance weighting)
 *   - Overtaking difficulty (affects quali-to-race conversion)
 *   - Tyre wear severity (amplifies tyre management skill)
 *   - Safety car probability (introduces result variance)
 *   - Weather probability (amplifies wet-weather skill)
 *   - Historical team advantages (encoded from 2018-2025 data)
 *   - Characteristic factors (top speed vs cornering balance)
 *
 * 2026-SPECIFIC NOTES:
 * New active aero regulations reduce dirty-air effect by ~30%,
 * making overtaking easier at all circuits. DRS zones retained but
 * their relative importance slightly reduced.
 *
 * Circuit types:
 *   power       — long straights, high top speed, PU performance critical
 *   technical   — slow corners, mechanical grip, precision driving
 *   street      — walls close, no run-off, heavy braking zones
 *   balanced    — mix of high/medium speed, rewards all-round cars
 *   high_speed  — sustained fast sweepers, downforce-critical
 */

export const CALENDAR_2026 = [
  {
    id:'BHR', round:1, name:'Bahrain Grand Prix', circuit:'Bahrain International Circuit',
    city:'Sakhir', country:'Bahrain', flag:'🇧🇭', date:'2026-03-01',
    type:'balanced', length:5.412, laps:57,
    tyreWear:7, overtakingDiff:4, safetyCarP:0.28, weatherP:0.05, drsZones:2,
    topSpeedW:0.55, corneringW:0.45,
    teamHistory:{ RedBull:0.88, Ferrari:0.72, Mercedes:0.65, McLaren:0.58 },
    notes:'Season opener. Hot, abrasive, demands tyre management. Red Bull historically dominant.'
  },
  {
    id:'SAU', round:2, name:'Saudi Arabian Grand Prix', circuit:'Jeddah Corniche Circuit',
    city:'Jeddah', country:'Saudi Arabia', flag:'🇸🇦', date:'2026-03-08',
    type:'street', length:6.174, laps:50,
    tyreWear:4, overtakingDiff:7, safetyCarP:0.52, weatherP:0.02, drsZones:3,
    topSpeedW:0.72, corneringW:0.28,
    teamHistory:{ RedBull:0.82, Mercedes:0.70, Ferrari:0.68, McLaren:0.55 },
    notes:'Ultra-fast street circuit. Safety car likely. Favours power and straight-line speed.'
  },
  {
    id:'AUS', round:3, name:'Australian Grand Prix', circuit:'Albert Park Circuit',
    city:'Melbourne', country:'Australia', flag:'🇦🇺', date:'2026-03-22',
    type:'street', length:5.278, laps:58,
    tyreWear:5, overtakingDiff:6, safetyCarP:0.45, weatherP:0.22, drsZones:4,
    topSpeedW:0.50, corneringW:0.50,
    teamHistory:{ Ferrari:0.78, RedBull:0.75, McLaren:0.68, Mercedes:0.62 },
    notes:'Resurfaced 2022. Strong Ferrari history. Variable weather adds lottery element.'
  },
  {
    id:'JPN', round:4, name:'Japanese Grand Prix', circuit:'Suzuka International Racing Course',
    city:'Suzuka', country:'Japan', flag:'🇯🇵', date:'2026-04-05',
    type:'high_speed', length:5.807, laps:53,
    tyreWear:6, overtakingDiff:6, safetyCarP:0.30, weatherP:0.35, drsZones:1,
    topSpeedW:0.42, corneringW:0.58,
    teamHistory:{ RedBull:0.92, Mercedes:0.70, Ferrari:0.65, McLaren:0.60 },
    notes:'Aerodynamic excellence rewarded. Wet weather frequent in April. Honda/Red Bull spiritual home.'
  },
  {
    id:'CHN', round:5, name:'Chinese Grand Prix', circuit:'Shanghai International Circuit',
    city:'Shanghai', country:'China', flag:'🇨🇳', date:'2026-04-19',
    type:'balanced', length:5.451, laps:56,
    tyreWear:6, overtakingDiff:4, safetyCarP:0.35, weatherP:0.30, drsZones:2,
    topSpeedW:0.52, corneringW:0.48,
    teamHistory:{ RedBull:0.80, Mercedes:0.72, Ferrari:0.65, McLaren:0.70 },
    notes:'Sprint weekend. Shanghai rewards balanced setup. McLaren strong recently.'
  },
  {
    id:'MIA', round:6, name:'Miami Grand Prix', circuit:'Miami International Autodrome',
    city:'Miami', country:'USA', flag:'🇺🇸', date:'2026-05-03',
    type:'street', length:5.412, laps:57,
    tyreWear:5, overtakingDiff:5, safetyCarP:0.40, weatherP:0.18, drsZones:3,
    topSpeedW:0.60, corneringW:0.40,
    teamHistory:{ RedBull:0.80, McLaren:0.78, Ferrari:0.68, Mercedes:0.62 },
    notes:'Sprint weekend. McLaren home advantage in USA. High-energy circuit suits aggressive driving.'
  },
  {
    id:'EMR', round:7, name:'Emilia Romagna Grand Prix', circuit:'Autodromo Enzo e Dino Ferrari',
    city:'Imola', country:'Italy', flag:'🇮🇹', date:'2026-05-17',
    type:'technical', length:4.909, laps:63,
    tyreWear:5, overtakingDiff:8, safetyCarP:0.38, weatherP:0.28, drsZones:2,
    topSpeedW:0.40, corneringW:0.60,
    teamHistory:{ Ferrari:0.88, RedBull:0.75, Mercedes:0.62, McLaren:0.58 },
    notes:'Ferrari tifosi. Very difficult to overtake. Qualifying critical. Wet weather common.'
  },
  {
    id:'MON', round:8, name:'Monaco Grand Prix', circuit:'Circuit de Monaco',
    city:'Monte Carlo', country:'Monaco', flag:'🇲🇨', date:'2026-05-24',
    type:'street', length:3.337, laps:78,
    tyreWear:3, overtakingDiff:10, safetyCarP:0.62, weatherP:0.25, drsZones:1,
    topSpeedW:0.20, corneringW:0.80,
    teamHistory:{ Ferrari:0.82, RedBull:0.78, Mercedes:0.65, McLaren:0.60 },
    notes:'Pure qualifying circuit. Overtaking near-impossible. Safety car almost guaranteed. Luck factor highest.'
  },
  {
    id:'CAN', round:9, name:'Canadian Grand Prix', circuit:'Circuit Gilles Villeneuve',
    city:'Montréal', country:'Canada', flag:'🇨🇦', date:'2026-06-07',
    type:'power', length:4.361, laps:70,
    tyreWear:4, overtakingDiff:5, safetyCarP:0.48, weatherP:0.32, drsZones:2,
    topSpeedW:0.70, corneringW:0.30,
    teamHistory:{ RedBull:0.78, Ferrari:0.75, Mercedes:0.72, McLaren:0.65 },
    notes:'Power circuit. Safety car frequent at the Wall of Champions. Weather variable. Suits high-ERS packages.'
  },
  {
    id:'ESP', round:10, name:'Spanish Grand Prix', circuit:'Circuit de Barcelona-Catalunya',
    city:'Barcelona', country:'Spain', flag:'🇪🇸', date:'2026-06-21',
    type:'balanced', length:4.657, laps:66,
    tyreWear:7, overtakingDiff:5, safetyCarP:0.22, weatherP:0.15, drsZones:2,
    topSpeedW:0.50, corneringW:0.50,
    teamHistory:{ RedBull:0.85, Mercedes:0.75, Ferrari:0.68, McLaren:0.65 },
    notes:'Benchmark circuit. Teams run updates here. Tyre management crucial in heat. Reveals true car hierarchy.'
  },
  {
    id:'AUT', round:11, name:'Austrian Grand Prix', circuit:'Red Bull Ring',
    city:'Spielberg', country:'Austria', flag:'🇦🇹', date:'2026-06-28',
    type:'power', length:4.318, laps:71,
    tyreWear:5, overtakingDiff:3, safetyCarP:0.35, weatherP:0.30, drsZones:3,
    topSpeedW:0.65, corneringW:0.35,
    teamHistory:{ RedBull:0.95, Ferrari:0.72, McLaren:0.68, Mercedes:0.60 },
    notes:'Red Bull home race. Sprint weekend. Elevation changes test aerodynamics. Frequent rain in Austria.'
  },
  {
    id:'GBR', round:12, name:'British Grand Prix', circuit:'Silverstone Circuit',
    city:'Northampton', country:'Great Britain', flag:'🇬🇧', date:'2026-07-05',
    type:'high_speed', length:5.891, laps:52,
    tyreWear:6, overtakingDiff:4, safetyCarP:0.30, weatherP:0.40, drsZones:2,
    topSpeedW:0.45, corneringW:0.55,
    teamHistory:{ Mercedes:0.88, RedBull:0.80, McLaren:0.75, Ferrari:0.65 },
    notes:'Hamilton stomping ground. McLaren home advantage. High-speed corners demand downforce. Rain likely.'
  },
  {
    id:'BEL', round:13, name:'Belgian Grand Prix', circuit:'Circuit de Spa-Francorchamps',
    city:'Spa', country:'Belgium', flag:'🇧🇪', date:'2026-07-26',
    type:'power', length:7.004, laps:44,
    tyreWear:4, overtakingDiff:4, safetyCarP:0.38, weatherP:0.50, drsZones:2,
    topSpeedW:0.68, corneringW:0.32,
    teamHistory:{ RedBull:0.88, Ferrari:0.72, Mercedes:0.70, McLaren:0.65 },
    notes:'Legendary circuit. Eau Rouge commitment separates drivers. Unpredictable micro-climate weather. Sprint.'
  },
  {
    id:'HUN', round:14, name:'Hungarian Grand Prix', circuit:'Hungaroring',
    city:'Budapest', country:'Hungary', flag:'🇭🇺', date:'2026-08-02',
    type:'technical', length:4.381, laps:70,
    tyreWear:7, overtakingDiff:8, safetyCarP:0.25, weatherP:0.20, drsZones:1,
    topSpeedW:0.35, corneringW:0.65,
    teamHistory:{ Ferrari:0.80, Mercedes:0.78, RedBull:0.75, McLaren:0.72 },
    notes:'High-downforce twisty circuit. Extremely difficult to overtake. Qualifying decisive. Suits Ferrari.'
  },
  {
    id:'NED', round:15, name:'Dutch Grand Prix', circuit:'Circuit Zandvoort',
    city:'Zandvoort', country:'Netherlands', flag:'🇳🇱', date:'2026-08-30',
    type:'technical', length:4.259, laps:72,
    tyreWear:6, overtakingDiff:8, safetyCarP:0.28, weatherP:0.38, drsZones:2,
    topSpeedW:0.38, corneringW:0.62,
    teamHistory:{ RedBull:0.98, Ferrari:0.62, McLaren:0.65, Mercedes:0.60 },
    notes:'Verstappen home race. Orange Army atmosphere. Banked turns unique aerodynamic challenge. Very hard to pass.'
  },
  {
    id:'ITA', round:16, name:'Italian Grand Prix', circuit:'Autodromo Nazionale Monza',
    city:'Monza', country:'Italy', flag:'🇮🇹', date:'2026-09-06',
    type:'power', length:5.793, laps:53,
    tyreWear:3, overtakingDiff:3, safetyCarP:0.40, weatherP:0.22, drsZones:2,
    topSpeedW:0.88, corneringW:0.12,
    notes:'Temple of Speed. Low downforce setup. Safety car almost guarantees chaos. Ferrari tifosi. PU the key.'
  },
  {
    id:'AZE', round:17, name:'Azerbaijan Grand Prix', circuit:'Baku City Circuit',
    city:'Baku', country:'Azerbaijan', flag:'🇦🇿', date:'2026-09-20',
    type:'street', length:6.003, laps:51,
    tyreWear:4, overtakingDiff:5, safetyCarP:0.55, weatherP:0.08, drsZones:2,
    topSpeedW:0.78, corneringW:0.22,
    teamHistory:{ RedBull:0.80, Ferrari:0.72, Mercedes:0.65, McLaren:0.60 },
    notes:'Highest top speeds on calendar (370+ km/h). Safety car almost guaranteed. Wild lottery race historically.'
  },
  {
    id:'SIN', round:18, name:'Singapore Grand Prix', circuit:'Marina Bay Street Circuit',
    city:'Singapore', country:'Singapore', flag:'🇸🇬', date:'2026-09-27',
    type:'street', length:4.940, laps:61,
    tyreWear:5, overtakingDiff:8, safetyCarP:0.55, weatherP:0.30, drsZones:3,
    topSpeedW:0.30, corneringW:0.70,
    teamHistory:{ Ferrari:0.78, McLaren:0.72, RedBull:0.65, Mercedes:0.68 },
    notes:'Night race in heat and humidity. Demands tyre management. Safety cars common. Qualifying critical at tight circuit.'
  },
  {
    id:'USA', round:19, name:'United States Grand Prix', circuit:'Circuit of the Americas',
    city:'Austin', country:'USA', flag:'🇺🇸', date:'2026-10-18',
    type:'balanced', length:5.513, laps:56,
    tyreWear:6, overtakingDiff:4, safetyCarP:0.35, weatherP:0.28, drsZones:2,
    topSpeedW:0.52, corneringW:0.48,
    teamHistory:{ RedBull:0.88, McLaren:0.72, Ferrari:0.68, Mercedes:0.70 },
    notes:'Sprint weekend. Big braking zones, undulations. McLaren recently strong. MotoGP-style kerbs cause issues.'
  },
  {
    id:'MEX', round:20, name:'Mexico City Grand Prix', circuit:'Autodromo Hermanos Rodriguez',
    city:'Mexico City', country:'Mexico', flag:'🇲🇽', date:'2026-10-25',
    type:'power', length:4.304, laps:71,
    tyreWear:4, overtakingDiff:4, safetyCarP:0.30, weatherP:0.15, drsZones:3,
    topSpeedW:0.72, corneringW:0.28,
    teamHistory:{ RedBull:0.88, Mercedes:0.70, Ferrari:0.65, McLaren:0.62 },
    notes:'High altitude (2285m) drastically reduces aero and ERS performance. PU power dominant factor. Red Bull traditionally strongest.'
  },
  {
    id:'BRA', round:21, name:'São Paulo Grand Prix', circuit:'Autodromo José Carlos Pace',
    city:'São Paulo', country:'Brazil', flag:'🇧🇷', date:'2026-11-08',
    type:'balanced', length:4.309, laps:71,
    tyreWear:5, overtakingDiff:3, safetyCarP:0.45, weatherP:0.50, drsZones:2,
    topSpeedW:0.55, corneringW:0.45,
    teamHistory:{ RedBull:0.78, McLaren:0.75, Mercedes:0.72, Ferrari:0.68 },
    notes:'Sprint weekend. Interlagos magic — high overtaking. Rain highly probable. Lenda for Brazilian GP drama.'
  },
  {
    id:'LVG', round:22, name:'Las Vegas Grand Prix', circuit:'Las Vegas Strip Circuit',
    city:'Las Vegas', country:'USA', flag:'🇺🇸', date:'2026-11-21',
    type:'power', length:6.201, laps:50,
    tyreWear:3, overtakingDiff:5, safetyCarP:0.40, weatherP:0.05, drsZones:2,
    topSpeedW:0.80, corneringW:0.20,
    teamHistory:{ RedBull:0.78, Ferrari:0.72, Mercedes:0.68, McLaren:0.65 },
    notes:'Night race in cold desert air. Long straight (1.9 km) amplifies PU differences. Cold asphalt affects tyre warm-up.'
  },
  {
    id:'QAT', round:23, name:'Qatar Grand Prix', circuit:'Lusail International Circuit',
    city:'Lusail', country:'Qatar', flag:'🇶🇦', date:'2026-11-29',
    type:'high_speed', length:5.380, laps:57,
    tyreWear:9, overtakingDiff:5, safetyCarP:0.28, weatherP:0.03, drsZones:2,
    topSpeedW:0.50, corneringW:0.50,
    teamHistory:{ RedBull:0.88, McLaren:0.78, Mercedes:0.68, Ferrari:0.65 },
    notes:'Sprint weekend. Extremely high tyre wear. Hot night conditions. Tyre management the decisive factor.'
  },
  {
    id:'ABU', round:24, name:'Abu Dhabi Grand Prix', circuit:'Yas Marina Circuit',
    city:'Abu Dhabi', country:'UAE', flag:'🇦🇪', date:'2026-12-06',
    type:'balanced', length:5.281, laps:58,
    tyreWear:4, overtakingDiff:5, safetyCarP:0.22, weatherP:0.02, drsZones:2,
    topSpeedW:0.55, corneringW:0.45,
    teamHistory:{ RedBull:0.82, Mercedes:0.72, Ferrari:0.68, McLaren:0.68 },
    notes:'Season finale. Night race. Post-2021 redesign improved racing. Championship deciders have happened here.'
  },
];

export const SPRINT_ROUNDS = new Set(['CHN','MIA','AUT','BEL','USA','BRA','QAT']);

export const CIRCUIT_BY_ID = Object.fromEntries(CALENDAR_2026.map(r => [r.id, r]));

// Points scoring system (standard + bonus)
export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];
export const FASTEST_LAP_BONUS = 1; // if in top 10
