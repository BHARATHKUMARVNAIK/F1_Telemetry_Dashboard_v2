export function mkRng(seed){let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280;}}
export function lerpWP(wp,x){
  if(x<=wp[0][0])return wp[0][1];
  if(x>=wp[wp.length-1][0])return wp[wp.length-1][1];
  for(let i=0;i<wp.length-1;i++){
    if(x>=wp[i][0]&&x<wp[i+1][0]){
      let t=(x-wp[i][0])/(wp[i+1][0]-wp[i][0]);
      t=t*t*(3-2*t);
      return wp[i][1]+(wp[i+1][1]-wp[i][1])*t;
    }
  }
  return wp[wp.length-1][1];
}
export const sub=(a,n=2)=>a.filter((_,i)=>i%n===0);
export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export const fmtDelta=(s,p=3)=>(s>=0?'+':'')+s.toFixed(p)+'s';
export function fmtLap(s){const m=Math.floor(s/60);return m+':'+(s%60).toFixed(3).padStart(6,'0');}
export function lerp(a,b,t){return a+(b-a)*t;}
