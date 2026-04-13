// ─────────────────────────────────────────────────────────────────────────────
// DRIVER COLOR PALETTE — persistent color mapping across ALL charts
// Colors chosen for maximum distinguishability on dark backgrounds
// ─────────────────────────────────────────────────────────────────────────────
export const DRIVER_COLORS = {
  VER: '#3B82F6', // Blue         — Red Bull
  LEC: '#EF4444', // Red          — Ferrari
  SAI: '#F97316', // Orange       — Ferrari #2
  PER: '#67E8F9', // Cyan         — Red Bull #2
  NOR: '#FBBF24', // Amber        — McLaren
  PIA: '#FDE047', // Yellow       — McLaren #2
  ALO: '#34D399', // Emerald      — Aston Martin
  RUS: '#A78BFA', // Violet       — Mercedes
  HAM: '#E879F9', // Fuchsia      — Mercedes #2
  STR: '#4ADE80', // Green        — Aston #2
  ALB: '#FB7185', // Rose         — Williams
};

export const DRIVER_TEAM = {
  VER:'Red Bull RB20', LEC:'Ferrari SF-24', SAI:'Ferrari SF-24',
  PER:'Red Bull RB20', NOR:'McLaren MCL38', PIA:'McLaren MCL38',
  ALO:'Aston AMR24',   RUS:'Mercedes W15', HAM:'Mercedes W15',
  STR:'Aston AMR24',   ALB:'Williams FW46',
};

export const DRIVER_FULL = {
  VER:'Max Verstappen',   LEC:'Charles Leclerc', SAI:'Carlos Sainz',
  PER:'Sergio Perez',     NOR:'Lando Norris',    PIA:'Oscar Piastri',
  ALO:'Fernando Alonso',  RUS:'George Russell',  HAM:'Lewis Hamilton',
  STR:'Lance Stroll',     ALB:'Alex Albon',
};

export const DRIVER_NUM = {
  VER:1, LEC:16, SAI:55, PER:11, NOR:4, PIA:81, ALO:14, RUS:63, HAM:44, STR:18, ALB:23
};

// Q3 Bahrain 2024 lap times (seconds) — used for delta computation
export const DRIVER_LAPTIME = {
  VER:89.179, LEC:89.407, SAI:89.614, PER:89.817, NOR:89.953,
  PIA:90.121, ALO:90.269, RUS:90.310, HAM:90.382, STR:90.749, ALB:90.927,
};

export const ALL_DRIVERS = ['VER','LEC','SAI','PER','NOR','PIA','ALO','RUS','HAM','STR','ALB'];
export const DEFAULT_DRIVERS = ['VER','LEC','NOR'];

export function withAlpha(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
