// e layout helper: camera, target, visitor and chair spots for the low hero still, with ground heights.
// node lookdev/e-geom.mjs 42.8 -26.3 0.7 23 8  (camera x, z, height above sand, colossus offset right of centre in degrees, up-tilt in degrees)
const ss=(x,a,b)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
const ridge=u=>1-Math.abs(Math.sin(u));
function duneField(x,z){const w=Math.sin(x*0.011+z*0.007)*2.2+Math.cos(z*0.0043-x*0.002)*1.4;const a=Math.pow(ridge(x*0.021+z*0.012+w),1.8);const b=Math.pow(ridge(x*0.047-z*0.019+w*0.6+1.3),2.0);const c=0.5+0.5*Math.sin(x*0.13+z*0.09);return 0.68*a+0.26*b+0.06*c}
const patch=(x,z)=>0.5*Math.sin(x*0.9+Math.sin(z*0.7)*1.3)*Math.cos(z*0.8-x*0.3)+0.3*Math.sin(x*2.1+z*1.7+1.1)+0.2*Math.sin(x*0.23-z*0.31);
const rectDist=(x,z,x0,x1,z0,z1)=>Math.hypot(Math.max(x0-x,0,x-x1),Math.max(z0-z,0,z-z1));
function g(x,z){const r=Math.hypot(x*0.85,z+20);const flat=ss(r,38,78);const edge=ss(rectDist(x,z,-13,13,-29.6,-6),0,4);let site=0.16*edge+0.07*edge*patch(x*0.5,z*0.5);const wall=Math.min(rectDist(x,z,-10.75,10.75,-30,-27.4),rectDist(x,z,-10.3,10.3,-35,-30),rectDist(x,z,-21,-12,-36,-30));site+=0.6*Math.exp(-wall/1.15)*(0.75+0.25*Math.sin(x*0.9+z*0.4));const A=2+7*ss(r,40,170)+Math.min(10,0.03*Math.max(0,r-170));return site*(1-flat)+(A*duneField(x,z)-0.6)*flat}
const [cx,cz,camH,off,tilt]=process.argv.slice(2).map(Number);
const G=[29,-66];let ux=G[0]-cx,uz=G[1]-cz;const D=Math.hypot(ux,uz);ux/=D;uz/=D;
const a=off*Math.PI/180;const L=[uz,-ux];// left of u
const dx=Math.cos(a)*ux+Math.sin(a)*L[0],dz=Math.cos(a)*uz+Math.sin(a)*L[1];
const left=[dz,-dx],right=[-dz,dx];
const cy=g(cx,cz)+camH;const f=(v)=>+v.toFixed(2);
const P=(dist,lat)=>[f(cx+dx*dist+left[0]*lat),f(cz+dz*dist+left[1]*lat)];
const facing=(deg)=>{const b=deg*Math.PI/180;const fx=Math.cos(b)*ux-Math.sin(b)*L[0],fz=Math.cos(b)*uz-Math.sin(b)*L[1];return Math.atan2(fx,fz)};
const out={D:f(D),groundCam:f(g(cx,cz)),pos:[f(cx),f(cy),f(cz)],target:[f(cx+dx*20),f(cy+20*Math.tan(tilt*Math.PI/180)),f(cz+dz*20)],
 claude:P(3.0,0.6),codex:P(3.6,-0.3),chairL:P(5.6,2.5),chairR:P(4.6,-2.9),
 yawToPtahRight20:f(facing(20)),facadeCorner:f(Math.atan2(10-cx,-30-cz)),viewYaw:f(Math.atan2(dx,dz))};
// ground under points
for(const k of ['claude','codex','chairL','chairR'])out[k+'G']=f(g(...out[k]));
console.log(JSON.stringify(out));
