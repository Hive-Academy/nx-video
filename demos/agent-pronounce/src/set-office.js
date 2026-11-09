import * as THREE from 'three';
import { hash, noise1, clamp, ease } from './util.js';
import { tourSpec, speak, listen, idle, anticipate, sceneCue } from './cribs.js';
import { custom } from './cribs-camera.js';
import { bolt as makeBolt } from './craft.js';

const V = (x,y,z) => new THREE.Vector3(x,y,z);
const pulse = (t,at,w) => t < at ? 0 : Math.exp(-3*((t-at)/w)**2);

async function build(scene, assets, ctx) {
  const look = await ctx.useLook('office', { boltMode: true });
  const h = look.handles;
  h.bolts.forEach(b => { b.visible = false; });
  h.flash.intensity = 0;
  const sparkPos = h.laptopScreen.position.clone().add(V(0,0.08,0.02));
  const sparkArc = makeBolt(sparkPos, sparkPos.clone().add(V(-0.28,0.55,0.22)), 713, {depth:4,core:0.014,glow:0.065});
  sparkArc.visible = false; scene.add(sparkArc);
  const sparkTrails = [];
  for (let i=0;i<7;i++) {
    const end=sparkPos.clone().add(V((hash('spark-x',i)-0.5)*0.7,0.24+hash('spark-y',i)*0.5,(hash('spark-z',i)-0.5)*0.5));
    const trail=makeBolt(sparkPos,end,900+i,{depth:2,core:0.005,glow:0.025});
    trail.visible=false; scene.add(trail); sparkTrails.push(trail);
  }
  const n = 28, geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3),3));
  const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ color:'#E1F4FF', size:0.065, transparent:true, opacity:0, depthWrite:false, toneMapped:false, blending:THREE.AdditiveBlending }));
  scene.add(sparks);
  const sparkVel = Array.from({length:n}, (_,i) => {
    const a = hash('office-spark',i)*Math.PI*2;
    return V(Math.cos(a),0.4+hash('office-spark-y',i),Math.sin(a)).multiplyScalar(0.45+hash('office-spark-speed',i));
  });
  const whiteMat = new THREE.MeshBasicMaterial({color:'#FFFFFF', transparent:true, opacity:0, depthTest:false, depthWrite:false, toneMapped:false});
  const whiteout = new THREE.Mesh(new THREE.PlaneGeometry(4,4),whiteMat);
  whiteout.renderOrder = 999;
  scene.add(whiteout);
  const glass = scene.children.find(o => o.isMesh && o.material?.isMeshPhysicalMaterial && o.material.opacity === 0.08);
  const glassOpacity = glass?.material.opacity ?? 0;
  const screenColor = h.laptopScreen.material.color.clone();
  const robots = {Codex:h.codex, Claude:h.claude};
  for (const r of Object.values(robots)) r.seat = {x:r.root.position.x,y:r.root.position.y,z:r.root.position.z,yaw:r.root.rotation.y};
  return {robots:{},cast:robots,h,sparks,sparkVel,sparkPos,sparkArc,sparkTrails,whiteout,whiteMat,glass,glassOpacity,screenColor,
    post:{bloom:{...look.bloom},exposure:look.exposure,toneMapping:'aces',shadows:true}};
}

function plan(world,ctx) {
  const S2=ctx.row('S2'), O1=ctx.row('O1'), O3=ctx.row('O3'), O4=ctx.row('O4'), duration=ctx.duration;
  const entrance=sceneCue(ctx,'entrance',4), tah=sceneCue(ctx,'tah',4.98);
  const spark=sceneCue(ctx,'spark',10.201);
  const dip=sceneCue(ctx,'dip',spark+0.2);
  const crackle=sceneCue(ctx,'crackle',13.015), bolt=sceneCue(ctx,'bolt',13.815);
  const flash=sceneCue(ctx,'flash',16.161);
  const specs={};
  for (const name of ['Codex','Claude']) specs[name]=tourSpec(name,world.cast[name].seat,{scale:world.cast[name].scale,seedTag:'office'});
  if (S2) {anticipate(specs.Claude,S2);speak(specs.Claude,S2);listen(specs,'Claude',S2);}
  if (O1) {anticipate(specs.Codex,O1);speak(specs.Codex,O1);listen(specs,'Codex',O1);}
  if (O3) {anticipate(specs.Codex,O3);speak(specs.Codex,O3);listen(specs,'Codex',O3);}
  idle(specs.Codex,0,duration);idle(specs.Claude,0,duration);
  for (const spec of Object.values(specs)) {
    spec.eyes.push({t0:bolt,t1:bolt+1.1,sx:1.35,sy:1.35});
    spec.eyes.push({t0:flash,t1:duration+1,sx:1.45,sy:1.45});
  }
  const heroPose={pos:V(0.1,1.32,2.95),target:V(0,0.7,-1.2),fov:40};
  const entranceShot=custom('office entrance',(t)=>{
    const progress=clamp(t/entrance);
    const u=ease.sineInOut(progress)+0.16*Math.sin(Math.PI*progress)**2;
    const tilt=ease.sineInOut(clamp((t-1.5)/0.75));
    return {pos:V(0.1,3.05-1.73*u,3.35-0.4*u),
      target:V(0,4.0-3.3*tilt,-11+9.8*tilt),fov:40};
  },4.2);entranceShot.t0=0;
  const hero=custom('office hero',()=>heroPose,4.2);hero.t0=entrance;
  const boltShot=custom('office bolt',()=>({pos:V(0.25,1.08,2.9),target:V(0,0.85,-1.2),fov:46}),4.2);boltShot.t0=12.4;
  function update(t) {
    const h=world.h;
    for (const name of ['Codex','Claude']) {
      const r=world.cast[name];
      const pose=ctx.getSim().robotPose(name,t);
      r.root.position.set(r.seat.x,r.seat.y+(pose.lift||0),r.seat.z);
      r.root.rotation.y=r.seat.yaw;
      const breathing=0.018*Math.sin(2.1*t+(name==='Claude'?1:0));
      const lean=name==='Claude'?0.14*ease.sineInOut(clamp((t-3.7)/0.65))*(1-ease.sineInOut(clamp((t-7.2)/0.8))):0;
      const flinch=0.22*pulse(t,dip,0.42)+0.33*pulse(t,bolt,0.38);
      const glance=t>=10.7&&t<11.65?(name==='Claude'?-0.18:0.18):t>=14.55&&t<16?(name==='Claude'?-0.12:0.12):0;
      const blink=Math.max(0,1-Math.abs(((t+(name==='Claude'?0.45:0.1))*0.72)%1-0.5)/0.065);
      r.apply({...pose,bx:(pose.fx||0)+lean,liftModel:(pose.lift||0)/r.scale,
        pitch:(pose.pitch||0)+breathing+flinch,headYaw:(pose.headYaw||0)+glance+0.04*Math.sin(t*1.15),
        blink:Math.max(pose.blink||0,blink)});
    }
    const arrival=ease.sineInOut(clamp((t-1.7)/2.3));
    if(world.glass) world.glass.material.opacity=world.glassOpacity*(1-ease.sineInOut(clamp((t-3.2)/0.7)));
    h.ceiling.visible=t>=3.9;
    h.city.material.map=h.cityDetailedMap;
    h.cityLayers.forEach((layer,i)=>{layer.material.opacity=1;layer.position.x=0.045*i*Math.sin(t*0.32);layer.visible=true;});
    h.cityBeacons.forEach((light,i)=>{light.material.opacity=0.2+0.8*Math.pow(0.5+0.5*Math.sin(1.1*t+hash('beacon-phase',i)*6.28),6);light.visible=true;});
    const flicker=0.75+0.25*noise1(t*21,'office-dip');
    const firstDip=0.52*ease.sineInOut(clamp((t-dip)/0.12))*(1-ease.sineInOut(clamp((t-11.2)/0.6)));
    const build=clamp((t-crackle)/(bolt-crackle));
    const storm=t<crackle?0:t<bolt?0.17+0.4*build:t<flash?0.55:0;
    const dim=firstDip+storm*(0.78+0.22*flicker);
    const burst=t<bolt?0:t<bolt+0.25?1:Math.exp(-3.6*(t-bolt-0.25));
    const white=ease.power2In(clamp((t-flash)/0.16));
    const tahPulse=pulse(t,tah,0.18);
    h.laptopScreen.material.color.copy(world.screenColor).multiplyScalar(0.55+0.45*arrival+0.8*tahPulse+0.45*build*noise1(t*38,'screen'));
    h.key.intensity=26*(1-dim)*(1-0.25*burst);
    h.lampGlow.intensity=3.2*(1-dim);
    h.spill.intensity=(0.35+2.1*arrival+2*tahPulse+1.2*pulse(t,spark,0.35)+4*burst+2*build*noise1(t*30,'crackle'))*(1-0.25*dim);
    h.flash.intensity=12*burst+40*white;
    h.bolts.forEach(b=>{b.visible=burst>0.12;});
    const su=(t-(spark-0.04))/0.5;
    const sparkGlow=su>=0&&su<0.3?1-su/0.3:0;
    world.sparkArc.visible=sparkGlow>0;
    world.sparkTrails.forEach((trail,i)=>{trail.visible=su>=0.025*i&&su<0.25+0.025*i;});
    world.sparks.visible=su>=0&&su<1;
    if(world.sparks.visible) {
      const a=world.sparks.geometry.attributes.position.array;
      world.sparkVel.forEach((v,i)=>{a[i*3]=world.sparkPos.x+v.x*su*0.5;a[i*3+1]=world.sparkPos.y+v.y*su*0.5-0.2*su*su;a[i*3+2]=world.sparkPos.z+v.z*su*0.5;});
      world.sparks.geometry.attributes.position.needsUpdate=true;
      world.sparks.material.opacity=1-su;
    }
    world.post.bloom.strength=0.22+0.38*sparkGlow+0.75*burst+3.2*white;
    world.post.exposure=1+0.25*burst+2.2*white;
    world.whiteout.visible=white>0.002;
    if(world.whiteout.visible) {
      const pose=(t<boltShot.t0?hero:boltShot).sample(t);
      world.whiteout.position.copy(pose.pos).lerp(pose.target,0.12);
      world.whiteout.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pose.pos,pose.target,V(0,1,0)));
      world.whiteMat.opacity=white;
    }
  }
  return {start:-0.6,specs,shots:[entranceShot,hero,boltShot],update,hits:[{t:bolt,amp:0.018},{t:flash,amp:0.028}],info:{cues:{entrance,tah,spark,dip,crackle,bolt,flash}}};
}
export const KINDS={office:{build,plan}};
