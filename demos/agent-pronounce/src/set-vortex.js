import * as THREE from 'three';
import { hash, noise1, clamp, ease } from './util.js';
import { sceneCue } from './cribs.js';
import { custom } from './cribs-camera.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
async function build(scene,assets,ctx) {
  const look=await ctx.useLook('vortex');
  const h=look.handles;
  const tunnelTex=h.tunnel.material.map;
  const streakStart=h.streaks.map(s=>s.position.z);
  const dustStart=h.dustPoints.geometry.attributes.position.array.slice();
  const entryTex=tunnelTex.clone();entryTex.repeat.set(1,1);entryTex.offset.set(0,0);entryTex.needsUpdate=true;
  const entryMat=new THREE.MeshBasicMaterial({map:entryTex,transparent:true,opacity:1,depthTest:false,depthWrite:false,toneMapped:true});
  const entryStorm=new THREE.Mesh(new THREE.PlaneGeometry(40,24),entryMat);
  entryStorm.renderOrder=1000;scene.add(entryStorm);
  return {robots:{},h,tunnelTex,streakStart,dustStart,entryStorm,entryMat,
    post:{bloom:{...look.bloom},exposure:look.exposure,toneMapping:'aces',shadows:true}};
}
function plan(world,ctx) {
  const duration=ctx.duration, land=sceneCue(ctx,'land',3);
  const shot=custom('vortex',(t)=>({pos:V(0,0.3,3.6-1.7*ease.sineInOut(clamp(t/duration))),target:V(0,-0.15,-3-2*t/duration),fov:58}),7);
  shot.t0=0;
  function update(t) {
    const h=world.h;
    const entry=clamp((t-0.12)/0.28);
    world.entryStorm.visible=entry<1;
    world.entryMat.opacity=1-ease.sineInOut(entry);
    if(world.entryStorm.visible){world.entryStorm.position.copy(shot.sample(t).pos).lerp(shot.sample(t).target,0.12);world.entryStorm.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(shot.sample(t).pos,shot.sample(t).target,V(0,1,0)));}
    world.tunnelTex.offset.y=((t*0.12)%1+1)%1;
    world.tunnelTex.offset.x=((t*0.025)%1+1)%1;
    h.tunnel.rotation.set(Math.PI/2,0,0);
    const motion=t*3/duration;
    h.tumble.position.set(0.16*Math.sin(motion*1.2),-0.65+0.12*Math.sin(motion*1.8),-0.4-0.32*motion);
    h.tumble.rotation.set(0.25+0.08*Math.sin(motion*1.4),-0.35+0.1*Math.sin(motion*0.9),0.42+0.14*motion+0.04*noise1(motion*2,'vortex-tumble'));
    [h.codex,h.claude].forEach((r,i)=>r.apply({eyeSX:1.36,eyeSY:1.42,pitch:-0.17+0.04*Math.sin(t*2+i),roll:(i?1:-1)*0.12,nod:0.08*Math.sin(t*3+i),glow:0.55+0.15*Math.sin(t*4+i),blink:0}));
    h.streaks.forEach((s,i)=>{s.position.z=((world.streakStart[i]+t*(7+4*hash('streak-speed',i))+72)%34+34)%34-34;});
    const arr=h.dustPoints.geometry.attributes.position.array;
    for(let i=0;i<arr.length/3;i++){arr[i*3]=world.dustStart[i*3];arr[i*3+1]=world.dustStart[i*3+1];arr[i*3+2]=((world.dustStart[i*3+2]+t*(6+4*hash('dust-speed',i))+80)%24+24)%24-22;}
    h.dustPoints.geometry.attributes.position.needsUpdate=true;
    const u=clamp((t-land)/Math.max(0.1,duration-land));
    h.glow.intensity=60+40*u;
    world.post.bloom.strength=0.5+1.3*u;
    world.post.exposure=1.05+0.35*u;
    h.sunDisc.material.color.set('#FFC47B');
  }
  return {start:-0.4,specs:{},noSettle:true,shots:[shot],update,info:{cues:{land}}};
}
export const KINDS={vortex:{build,plan}};
