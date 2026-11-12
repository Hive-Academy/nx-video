import * as THREE from 'three';
import { hash, noise1, clamp, ease } from './util.js';
import { tourSpec, speak, listen, idle, anticipate, sceneCue } from './cribs.js';
import { custom } from './cribs-camera.js';
import { bolt as makeBolt } from './craft.js';
import { vortexTexture } from './look-vortex.js';

const V = (x,y,z) => new THREE.Vector3(x,y,z);
const pulse = (t,at,w) => t < at ? 0 : Math.exp(-3*((t-at)/w)**2);

async function build(scene, assets, ctx) {
  const look = await ctx.useLook('office', { boltMode: false });
  const h = look.handles;
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
  const stormMat = new THREE.MeshBasicMaterial({map:vortexTexture(), transparent:true, opacity:0, depthTest:false, depthWrite:false, toneMapped:true});
  const stormVeil = new THREE.Mesh(new THREE.PlaneGeometry(40,24),stormMat);
  stormVeil.renderOrder = 900; scene.add(stormVeil);
  const windGeo = new THREE.BufferGeometry();
  windGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(360*3),3));
  const wind = new THREE.Points(windGeo,new THREE.PointsMaterial({color:'#D9A85A',size:0.045,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
  scene.add(wind);
  const glass = scene.children.find(o => o.isMesh && o.material?.isMeshPhysicalMaterial && o.material.opacity === 0.08);
  const glassOpacity = glass?.material.opacity ?? 0;
  const screenColor = h.laptopScreen.material.color.clone();
  const robots = {Codex:h.codex, Claude:h.claude};
  for (const r of Object.values(robots)) r.seat = {x:r.root.position.x,y:r.root.position.y,z:r.root.position.z,yaw:r.root.rotation.y};
  return {robots:{},cast:robots,h,sparks,sparkVel,sparkPos,sparkArc,sparkTrails,stormVeil,stormMat,wind,glass,glassOpacity,screenColor,
    post:{bloom:{...look.bloom},exposure:look.exposure,toneMapping:'aces',shadows:true}};
}

function plan(world,ctx) {
  const duration=ctx.duration;
  const entrance=sceneCue(ctx,'entrance',4), landingIn=sceneCue(ctx,'landingIn',10.827), landingOut=sceneCue(ctx,'landingOut',15.327);
  const tah=sceneCue(ctx,'tah',24.087);
  const spark=sceneCue(ctx,'spark',29.658);
  const dip=sceneCue(ctx,'dip',spark+0.2);
  const rumble=sceneCue(ctx,'rumble',33.898), pull=sceneCue(ctx,'pull',35.298), through=sceneCue(ctx,'through',duration);
  const specs={};
  for (const name of ['Codex','Claude']) specs[name]=tourSpec(name,world.cast[name].seat,{scale:world.cast[name].scale,seedTag:'office'});
  for(const id of ['N1','N2','N3','N4','N5','S2','O1','O3']) {
    const row=ctx.row(id); if(!row) continue;
    const speaker=row.speaker; if(!specs[speaker]) continue;
    anticipate(specs[speaker],row);speak(specs[speaker],row);listen(specs,speaker,row);
  }
  idle(specs.Codex,0,duration);idle(specs.Claude,0,duration);
  for (const spec of Object.values(specs)) spec.eyes.push({t0:rumble,t1:duration+1,sx:1.3,sy:1.3});
  const heroPose={pos:V(0.06,1.18,1.85),target:V(0,0.76,-1.44),fov:37};
  const drift=(t,phase)=>V(0.025*Math.sin(t*0.55+phase),0.012*Math.sin(t*0.43+phase),0.012*Math.sin(t*0.31+phase));
  const close=(name,t,phase)=>{
    const x=name==='Codex'?-0.43:0.45;
    const d=drift(t,phase);
    return {pos:V(x+(name==='Codex'?-0.1:0.1),1.02,0.76).add(d),target:V(x,0.81,-1.44).add(d.clone().multiplyScalar(0.35)),fov:30};
  };
  const wide=(t)=>({pos:heroPose.pos.clone().add(drift(t,0)),target:heroPose.target.clone().add(drift(t,1)),fov:heroPose.fov});
  const entranceShot=custom('office entrance',(t)=>{
    const progress=clamp(t/entrance);
    const u=ease.sineInOut(progress);
    const look=ease.sineInOut(clamp(progress*1.4));
    return {pos:V(0.48-0.38*u,2.85-1.53*u,-3.75+6.7*u),
      target:V(0,2.5-1.68*look,-11+9.8*look),fov:38};
  },4.2);entranceShot.t0=0;
  const screen=world.h.laptopScreen;
  const screenCenter=screen.position.clone();
  const screenNormal=new THREE.Vector3(0,0,1).applyQuaternion(screen.quaternion);
  const screenPose={pos:screenCenter.clone().addScaledVector(screenNormal,0.54),target:screenCenter.clone(),fov:27};
  const shot2=custom('conversation to screen',(t)=>{
    const u=ease.sineInOut(clamp((t-(landingIn-0.8))/0.8));
    const base=t<7.794?close('Codex',t,0.3):close('Claude',t,1.4);
    return {pos:base.pos.lerp(screenPose.pos,u),target:base.target.lerp(screenPose.target,u),fov:base.fov+(screenPose.fov-base.fov)*u};
  },4.2);shot2.t0=entrance;
  const shot3=custom('landing insert return',(t)=>{
    const u=ease.sineInOut(clamp((t-(landingOut-0.8))/0.8));
    return {pos:screenPose.pos.clone().lerp(heroPose.pos,u),target:screenPose.target.clone().lerp(heroPose.target,u),fov:screenPose.fov+(38-screenPose.fov)*u};
  },4.2);shot3.t0=landingIn;
  const coverage=[
    ['two shot after insert',landingOut,wide],
    ['Claude question',17.853,(t)=>close('Claude',t,2)],
    ['Codex problem',20.3,(t)=>close('Codex',t,3)],
    ['Claude reaction',22.3,(t)=>close('Claude',t,4)],
    ['Claude Tah',24.1,(t)=>close('Claude',t,5)],
    ['Codex pterodactyl',27.458,(t)=>close('Codex',t,6)],
    ['Codex old',30.512,(t)=>close('Codex',t,7)]
  ].map(([label,start,sample])=>{const s=custom(label,sample,4.2);s.t0=start;return s;});
  const shot5=custom('storm and pull',(t)=>{
    const u=ease.sineInOut(clamp((t-pull)/(through-pull)));
    const base=wide(t);
    return {pos:base.pos.lerp(screenCenter.clone().addScaledVector(screenNormal,0.11),u),target:base.target.lerp(screenCenter,u),fov:37-7*u};
  },4.2);shot5.t0=rumble;
  function update(t) {
    const h=world.h;
    for (const name of ['Codex','Claude']) {
      const r=world.cast[name];
      const pose=ctx.getSim().robotPose(name,t);
      r.root.position.set(r.seat.x,r.seat.y+(pose.lift||0),r.seat.z);
      r.root.rotation.y=r.seat.yaw;
      const breathing=0.018*Math.sin(2.1*t+(name==='Claude'?1:0));
      const lean=name==='Claude'?0.14*ease.sineInOut(clamp((t-(tah-0.8))/0.65))*(1-ease.sineInOut(clamp((t-(tah+2.5))/0.8))):0;
      const danger=ease.sineInOut(clamp((t-rumble)/0.35));
      const grip=ease.sineInOut(clamp((t-pull)/0.35));
      const flinch=0.22*pulse(t,dip,0.42)+0.48*danger;
      const glance=name==='Codex'?(t<landingOut?-0.2:t>=rumble?0.35:0):t>=rumble?-0.3:t>=entrance&&t<landingIn?0.22:0;
      const blink=Math.max(0,1-Math.abs(((t+(name==='Claude'?0.45:0.1))*0.72)%1-0.5)/0.065);
      const speaker=(name==='Codex'&&(t>=20.3&&t<22.3||t>=27.458&&t<33.898))||(name==='Claude'&&(t>=17.853&&t<20.3||t>=23.257&&t<27.458));
      const gesture=speaker?0.1*Math.sin(Math.PI*clamp((t-(name==='Codex'?t<23?20.578:t<30?27.458:30.512:t<21?17.853:23.257))/1.5)):0;
      r.root.position.z=r.seat.z+0.12*grip;
      r.apply({...pose,bx:(pose.fx||0)+lean+gesture-0.2*grip,liftModel:(pose.lift||0)/r.scale,
        pitch:(pose.pitch||0)+breathing+flinch-0.32*grip,headYaw:(pose.headYaw||0)+glance+0.04*Math.sin(t*1.15)+(speaker?0.13:0)+0.38*danger,
        blink:Math.max(pose.blink||0,blink)});
    }
    const arrival=ease.sineInOut(clamp((t-1.7)/2.3));
    if(world.glass) world.glass.material.opacity=world.glassOpacity*(1-ease.sineInOut(clamp((t-3.2)/0.7)));
    h.ceiling.visible=t>=3.9;
    h.city.material.map=h.cityDetailedMap;
    h.cityLayers.forEach((layer,i)=>{layer.material.opacity=1;layer.position.x=0.045*i*Math.sin(t*0.32);layer.visible=true;});
    h.cityBeacons.forEach((light,i)=>{light.material.opacity=0.2+0.8*Math.pow(0.5+0.5*Math.sin(1.1*t+hash('beacon-phase',i)*6.28),6);light.visible=true;});
    const flicker=0.75+0.25*noise1(t*21,'office-dip');
    const firstDip=0.52*ease.sineInOut(clamp((t-dip)/0.12))*(1-ease.sineInOut(clamp((t-(dip+0.7))/0.6)));
    const build=ease.sineInOut(clamp((t-rumble)/0.55));
    const storm=build*(0.75+0.25*flicker);
    const dim=Math.min(0.65,firstDip+0.54*storm);
    const wind=ease.sineInOut(clamp((t-pull)/(through-pull)));
    h.stormScreen.material.opacity=0.9*build;
    h.plant.rotation.z=0.12*build*Math.sin((t-rumble)*19)+0.16*wind*Math.sin((t-pull)*11);
    h.laptop.rotation.y=Math.PI+0.2-0.14*ease.sineInOut(clamp((t-(landingIn-1.2))/0.5))*(1-ease.sineInOut(clamp((t-landingOut)/0.6)));
    const tahPulse=pulse(t,tah,0.18);
    h.laptopScreen.material.color.copy(world.screenColor).multiplyScalar(0.55+0.45*arrival+0.8*tahPulse+0.85*build*noise1(t*38,'screen'));
    h.key.intensity=26*(1-dim);
    h.lampGlow.intensity=3.2*(1-dim);
    h.spill.intensity=(0.35+1.1*arrival+2*tahPulse+1.2*pulse(t,spark,0.35)+2.6*build*noise1(t*30,'storm'))*(1-0.25*dim);
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
    world.post.bloom.strength=0.22+0.38*sparkGlow+0.4*build;
    world.post.exposure=1-0.28*build;
    const pose=shot5.sample(t);
    world.stormVeil.position.copy(pose.pos).lerp(pose.target,0.16);
    world.stormVeil.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pose.pos,pose.target,V(0,1,0)));
    world.stormMat.opacity=ease.sineInOut(clamp((t-(through-0.6))/0.4));
    world.stormVeil.visible=world.stormMat.opacity>0;
    const a=world.wind.geometry.attributes.position.array;
    for(let i=0;i<a.length/3;i++){
      const phase=hash('wind',i), angle=hash('wind-angle',i)*Math.PI*2;
      const travel=((t-pull)*1.8+phase+10)%1;
      a[i*3]=screenCenter.x+Math.cos(angle)*(0.08+travel*2.7);
      a[i*3+1]=screenCenter.y+Math.sin(angle)*(0.06+travel*1.5);
      a[i*3+2]=screenCenter.z+travel*2.6;
    }
    world.wind.geometry.attributes.position.needsUpdate=true;
    world.wind.material.opacity=build*0.8;
    world.wind.visible=build>0;
  }
  return {start:-0.6,specs,shots:[entranceShot,shot2,shot3,...coverage,shot5],update,hits:[],info:{cues:{entrance,landingIn,landingOut,tah,spark,dip,rumble,pull,through}}};
}
export const KINDS={office:{build,plan}};
