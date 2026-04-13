// ─────────────────────────────────────────────────────────────────────────────
// BAHRAIN INTERNATIONAL CIRCUIT — Sakhir, 5.412 km
// ─────────────────────────────────────────────────────────────────────────────

export const CIRCUIT = {
  name: 'Bahrain International Circuit',
  location: 'Sakhir, Bahrain',
  length: 5412,
  corners: 15,
};

export const DRS_ZONES = [
  { start: 498,  end: 678,  label: 'DRS 1' },
  { start: 3748, end: 4098, label: 'DRS 2' },
];

export const CORNERS = [
  { n:'T1',    type:'medium',  dist:730,  ver:83,  lec:79,  desc:'High-speed right from DRS zone. Braking from 311 km/h.' },
  { n:'T2',    type:'medium',  dist:1050, ver:112, lec:116, desc:'Linked left. Car attitude from T1 exit critical.' },
  { n:'T3',    type:'hairpin', dist:1220, ver:80,  lec:84,  desc:'Slow hairpin. Late apex, drag-limited exit.' },
  { n:'T4',    type:'slow',    dist:1560, ver:88,  lec:86,  desc:'Tight right. Traction and mechanical grip.' },
  { n:'T5/6',  type:'chicane', dist:1700, ver:144, lec:150, desc:'Fast chicane. Ferrari aero advantage here.' },
  { n:'T8',    type:'hairpin', dist:2420, ver:62,  lec:68,  desc:'Slowest point. 62 km/h from 290 in ~80m.' },
  { n:'T10',   type:'medium',  dist:2820, ver:140, lec:137, desc:'Double right. Rear stability from mechanical setup.' },
  { n:'T11',   type:'slow',    dist:3140, ver:88,  lec:84,  desc:'Tight left before back section.' },
  { n:'T13',   type:'hairpin', dist:3545, ver:80,  lec:84,  desc:'Penultimate hairpin into DRS 2 zone.' },
  { n:'T14',   type:'fast',    dist:4100, ver:198, lec:204, desc:'Fastest corner. LEC carries 6 km/h more.' },
  { n:'T15',   type:'hairpin', dist:4560, ver:73,  lec:79,  desc:'Final hairpin before sweepers.' },
  { n:'T17/18',type:'medium',  dist:5100, ver:164, lec:167, desc:'Final complex. High-speed back to DRS straight.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// BAHRAIN CIRCUIT SVG PATH
// The circuit is represented as a normalized path in a 600×380 viewBox.
// Each point pair [x, y] corresponds to a real track location.
// Corners are annotated with their number, type, and position.
// ─────────────────────────────────────────────────────────────────────────────

// Track outline path — outer line of the Bahrain circuit
// Approximated from the actual circuit geometry
export const TRACK_PATH =
  'M 72 232 ' +
  'L 490 232 ' +                              // Main straight
  'C 530 232 548 220 552 202 ' +              // T1 entry
  'C 556 182 550 162 536 152 ' +              // T1-T2
  'C 522 142 505 140 490 148 ' +              // T2
  'L 468 162 ' +                              // T2-T3
  'C 452 170 442 188 444 205 ' +              // T3 entry
  'C 446 222 458 234 472 240 ' +              // T3 apex
  'C 488 246 498 240 504 228 ' +              // T3 exit
  'L 516 200 ' +                              // T3-T4
  'C 524 180 520 158 508 145 ' +              // T4
  'C 496 132 478 128 462 136 ' +              // T4-T5
  'C 446 144 434 160 430 178 ' +              // T5
  'C 422 196 412 198 400 190 ' +              // T5/6
  'L 368 170 ' +                              // towards T6
  'C 350 160 330 162 318 174 ' +              // T6
  'L 280 200 ' +                              // after chicane
  'C 260 214 248 230 246 248 ' +              // straight section
  'C 244 266 250 284 264 292 ' +              // curve
  'C 278 300 298 298 312 288 ' +              // T7 area
  'C 326 278 332 262 328 246 ' +              // T8 entry
  'C 324 230 312 220 298 218 ' +              // T8 apex (hairpin)
  'C 284 216 270 222 262 234 ' +              // T8 exit
  'L 220 280 ' +                              // T9
  'C 205 298 192 308 175 308 ' +              // T10 area
  'C 158 308 145 296 142 278 ' +              // T10 apex
  'C 139 260 148 244 163 238 ' +              // T10-T11
  'L 175 234 ' +
  'C 190 228 200 212 198 196 ' +              // T11
  'C 196 180 184 168 170 166 ' +              // T11 exit
  'C 156 164 142 172 136 186 ' +              // T12
  'C 130 200 134 218 146 226 ' +              // T12-T13
  'C 158 234 174 232 184 222 ' +              // T13 hairpin
  'C 194 212 196 198 188 188 ' +              // T13 exit
  'L 210 148 ' +                              // back section
  'C 220 134 238 126 256 128 ' +              // T14 approach
  'C 274 130 288 144 290 162 ' +              // T14 entry
  'C 292 180 282 194 268 198 ' +              // T14 fast corner
  'L 248 208 ' +
  'C 228 216 210 232 208 252 ' +              // T14-T15
  'C 206 272 216 290 232 298 ' +              // T15 area
  'C 248 306 268 302 278 288 ' +              // T15 hairpin
  'C 288 274 286 256 274 248 ' +              // T15 exit
  'L 256 240 ' +
  'C 240 232 220 232 200 240 ' +              // T16
  'C 170 252 150 270 140 292 ' +              // T17
  'C 128 316 124 340 130 358 ' +              // T17 deep
  'C 136 376 152 386 172 384 ' +              // bottom
  'L 290 384 ' +                              // bottom straight
  'C 330 384 360 364 368 332 ' +              // T18 exit
  'C 376 300 364 268 342 256 ' +              // T18
  'L 310 248 ' +
  'C 288 244 268 250 256 264 ' +              // towards start
  'L 180 310 ' +
  'C 160 330 132 340 110 332 ' +              // last section
  'C 88 322 72 302 72 280 ' +                 // return to SF
  'L 72 232 Z';                               // close

// Simplified centerline for racing line overlay
export const RACING_LINE_POINTS = [
  // [x, y, distance_m] — sampled at key circuit positions
  [100,232],[150,232],[200,232],[250,232],[300,232],[350,232],[400,232],
  [440,232],[480,232],[520,232],[540,222],[548,205],[544,185],[536,165],
  [524,152],[510,146],[494,146],[478,154],[466,164],[454,175],[446,196],
  [450,218],[462,232],[478,238],[494,236],[508,222],[518,200],[522,178],
  [516,155],[504,143],[488,134],[470,134],[452,142],[438,158],[428,176],
  [422,192],[412,192],[396,184],[372,168],[350,162],[330,166],[316,178],
  [294,196],[272,216],[254,240],[248,262],[250,284],[268,296],[290,296],
  [314,284],[326,264],[322,244],[308,224],[292,220],[274,220],[258,232],
  [234,268],[210,284],[192,300],[175,308],[160,304],[145,292],[140,276],
  [142,258],[152,244],[168,238],[180,230],[196,212],[194,196],[182,172],
  [164,168],[148,178],[136,194],[132,214],[140,228],[160,232],[180,226],
  [192,214],[192,196],[184,186],[200,158],[218,140],[244,130],[268,132],
  [284,148],[290,168],[278,192],[256,206],[236,220],[214,248],[210,270],
  [220,292],[240,304],[264,304],[278,290],[282,270],[272,252],[254,244],
  [232,236],[208,240],[178,256],[148,278],[132,308],[128,342],[136,374],
  [168,384],[290,384],[340,366],[368,338],[370,308],[354,274],[320,252],
  [286,248],[260,260],[220,298],[175,318],[130,318],[98,300],[72,276],
  [72,250],[72,232]
];

// Corner positions in SVG space for labels
export const CORNER_SVG = [
  { n:'T1',    x:540, y:192, type:'medium'  },
  { n:'T2',    x:500, y:148, type:'medium'  },
  { n:'T3',    x:475, y:244, type:'hairpin' },
  { n:'T4',    x:510, y:146, type:'slow'    },
  { n:'T5/6',  x:410, y:185, type:'chicane' },
  { n:'T8',    x:298, y:218, type:'hairpin' },
  { n:'T10',   x:152, y:302, type:'medium'  },
  { n:'T11',   x:166, y:168, type:'slow'    },
  { n:'T13',   x:140, y:228, type:'hairpin' },
  { n:'T14',   x:287, y:150, type:'fast'    },
  { n:'T15',   x:280, y:296, type:'hairpin' },
  { n:'T17/18',x:128, y:350, type:'medium'  },
];

// DRS zones in SVG space
export const DRS_SVG = [
  { x1:150, y1:232, x2:460, y2:232, label:'DRS 1 — Main straight' },
  { x1:206, y1:140, x2:280, y2:140, label:'DRS 2 — Back straight (approx)' },
];

export function speedToGear(v) {
  if(v<75)return 1; if(v<110)return 2; if(v<145)return 3;
  if(v<185)return 4; if(v<225)return 5; if(v<265)return 6;
  if(v<295)return 7; return 8;
}
