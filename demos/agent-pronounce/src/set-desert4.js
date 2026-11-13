// Approved v4 desert: one look-kit world, seek-time acting and the real tour on its stone screen.
import * as THREE from 'three';
import { SHOTS, SCREEN, CHAIR_K, VIS_U, groundAt } from './look-desert4.js';
import { BODY } from './robot-body.js';
import { custom } from './cribs-camera.js';
import { assetUrl } from './assets.js';
import { clamp, ease, hash } from './util.js';
const V = (...a) => new THREE.Vector3(...a);
const smooth = (t, a, b) => ease.sineInOut(clamp((t-a)/(b-a)));
const fov = mm => 2*Math.atan(36/(2*(16/9)*mm))*180/Math.PI;

async function build(scene, assets, ctx) {
  // Build the richest approved setup once. Other cameras reuse the same world.
  const look = await ctx.useLook('desert', { shot:'e' });
  const h = look.handles;
  const loader = new THREE.ImageLoader();
  const sequence = {fps:10,clips:(ctx.cfg.cues.tours||[]).map(c=>({...c,count:Math.ceil((c.end-c.start)*10),dir:`assets/live-demo/stills/${c.clip}-seq`}))};
  const clips = [];
  for (const c of sequence.clips) {
    const images = [];
    // Bounded batches avoid hundreds of simultaneous image decodes.
    for (let n=0;n<c.count;n+=8) {
      images.push(...await Promise.all(Array.from({length:Math.min(8,c.count-n)}, async(_,j) => {
        const t=await loader.loadAsync(assetUrl(`${c.dir}/${String(n+j+1).padStart(3,'0')}.jpg`));
        return t;
      })));
    }
    clips.push({...c,images});
  }
  const screenCanvas=document.createElement('canvas');screenCanvas.width=1280;screenCanvas.height=720;
  const screenContext=screenCanvas.getContext('2d');
  const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
  screenTexture.generateMipmaps=false;screenTexture.minFilter=THREE.LinearFilter;
  screenTexture.repeat.y=h.screenCrop.repeatY;screenTexture.offset.y=h.screenCrop.offsetY;
  const front=0.152*CHAIR_K;
  const contact = h.visitors.map(r => {
    r.setState({seat:{y:h.chairs[0].userData.seatY,front,z:front-BODY.thigh*VIS_U+0.07*VIS_U},standZ:front+0.32*CHAIR_K});
    return {r};
  });
  const crewHome=h.crews.map(c=>({c, robots:c.robots.map(r=>({r,pos:r.root.position.clone()}))}));
  // A single frozen screen texture remains the idle state before/after the tours.
  return { robots:{}, handles:h, clips, fps:sequence.fps, idleTexture:h.screen.material.emissiveMap,
    screenContext,screenTexture,screenImage:null,contact,crewHome,post:{film:look.film,shadows:true}, look };
}

function plan(world, ctx) {
  const h=world.handles, cues=ctx.cfg.cues || ctx.cfg.actions;
  const rise=cues.rise, pan=cues.pan, start=cues.showcaseStart, end=cues.showcaseEnd;
  const crew=h.crews.find(c=>c.key==='mid');
  const leader=crew.leader.root.getWorldPosition(V()), sled=crew.sledge.getWorldPosition(V());
  const dpos=leader.clone().addScaledVector(crew.dir,3).addScaledVector(V(crew.dir.z,0,-crew.dir.x),2.7).setY(leader.y+1.75);
  const dtarget=leader.clone().lerp(sled,.55).add(V(0,.15,0));
  const poses=Object.fromEntries(Object.entries(SHOTS).map(([key,s])=>[key,{pos:key==='d'?dpos:V(...s.pos),target:key==='d'?dtarget:V(...s.target),fov:fov(s.mm)}]));
  // Cuts use approved setups; the screen shot pushes b->c while the world stays at the edges.
  const keyAt=t=>t<rise-1?'a':t<pan?'e':t<start?'d':t<end?'b':t<cues.d6?'e':'a';
  const cameraAt=t=>{
    const key=keyAt(t), p=poses[key];
    const out={pos:p.pos.clone(),target:p.target.clone(),fov:p.fov};
    if(key==='b') { const u=smooth(t,start,start+3); out.pos.lerp(poses.c.pos,u);out.target.lerp(poses.c.target,u);out.fov+=(poses.c.fov-out.fov)*u; }
    if(t>=cues.titleTilt){
      const u=smooth(t,cues.titleTilt,ctx.duration-.05);
      out.pos.lerp(V(6.65,9.35,-28.5),u);out.target.lerp(V(6.65,9.35,-30.38),u);out.fov+=(28-out.fov)*u;
    }
    return out;
  };
  const shot=custom('desert-v4-approved',cameraAt,20); shot.t0=0;shot.still=true;
  function update(t) {
    const key=keyAt(t), S=SHOTS[key], cam=cameraAt(t), screenOn=smooth(t,pan,start);
    const screenPush=key==='b'?smooth(t,start,start+3):0;
    const seats=key==='b'?S.seats.map((v,i)=>({...v,chair:v.chair.map((x,j)=>x+(SHOTS.c.seats[i].chair[j]-x)*screenPush),look:screenPush>.5?SHOTS.c.seats[i].look:v.look})):S.seats;
    const voice=ctx.rows.filter(r=>r.speaker==='Conductor').reduce((v,r)=>Math.max(v,...r.words.map(w=>smooth(t,r.localStart+w.start-.05,r.localStart+w.start+.06)*(1-smooth(t,r.localStart+w.end,r.localStart+w.end+.12)))),0);
    h.colossus.setState({eyeGlow:smooth(t,rise-.6,rise),voice,headYaw:S.ptah.headYaw||0,headPitch:S.ptah.headPitch||0,sceptreTilt:0});
    h.screen.material.emissiveIntensity=1.55*screenOn;
    h.screenLight.intensity=1.6*screenOn;
    let texture=world.idleTexture;
    for(const clip of world.clips) if(t>=clip.start && t<clip.end){
      const image=clip.images[Math.min(clip.count-1,Math.floor((t-clip.start)*world.fps))];
      if(world.screenImage!==image){world.screenContext.drawImage(image,0,0,1280,720);world.screenTexture.needsUpdate=true;world.screenImage=image;}
      texture=world.screenTexture;
    }
    h.screen.material.emissiveMap=texture;
    // Every assignment is absolute: jumping backward resets seats, gaze, pose and screen.
    h.visitors.forEach((r,i)=>{
      const v=seats[i], chair=h.chairs[i], [cx,cz]=v.chair;
      const ptah=h.ptahAnchor.position;
      const at=v.at||v.chair;
      const toward=v.face==='camera'?cam.pos:v.face==='ptah'?ptah:V(SCREEN.x+(cx<.5?-1.2:1.2),0,SCREEN.face);
      const yaw=Math.atan2(toward.x-at[0],toward.z-at[1])+v.yaw;
      const gy=v.stand?groundAt(cx,cz):.06;
      chair.position.set(cx,gy-.01,cz);chair.rotation.y=yaw+Math.PI+(v.chairYaw||0);
      const other=seats.find(o=>o.name===v.look);
      const gaze=v.look==='camera'?cam.pos:v.look==='ptah'?ptah.clone().add(V(0,h.ptahAnchor.height*.9,0)):other?V((other.at||other.chair)[0],1.4,(other.at||other.chair)[1]):V(SCREEN.x,SCREEN.y,SCREEN.face);
      const stand=v.stand?smooth(t,rise,rise+1.25):0;
      if(v.stand){r.root.position.set(cx+(at[0]-cx)*stand,gy+(groundAt(at[0],at[1])-gy)*stand,cz+(at[1]-cz)*stand);r.root.rotation.y=yaw;r.setState({lookAt:gaze,standZ:0});r.setPose(stand<1?'stand-up':'standing-idle',stand,t);}
      else {const settle=t>=cues.sofaLand?.025*Math.exp(-6*(t-cues.sofaLand))*Math.sin(18*(t-cues.sofaLand)):0;chair.position.y+=settle;r.root.position.copy(chair.position);r.root.rotation.y=yaw;r.setState({lookAt:gaze,standZ:.152*CHAIR_K+.32*CHAIR_K});r.setPose(other?'seated-turn':'seated-idle',other?1:t,t);}
      if(r.contactShadow){r.contactShadow.visible=!!v.stand;r.contactShadow.position.copy(r.root.position).add(V(0,.01,0));}
    });
    for(const {c,robots} of world.crewHome) {
      // Haulers lean and breathe against taut ropes. Their feet move in a deterministic gait.
      const progress=.8*smooth(t,0,ctx.duration);
      c.haulGroup.position.set(0,progress*Math.tan(c.slope),progress);
      c.haulGroup.updateWorldMatrix(true,true);
      robots.forEach(({r,pos},i)=>{r.root.position.copy(pos);r.setState({haulCycle:1});r.setPose('haul',t,t+hash(c.key,i)*3);});
    }
    for(const b of h.braziers)b.update(t);
    if(h.rim){
      const mid=V();for(const s of seats)mid.add(V(s.chair[0],.75,s.chair[1]));mid.multiplyScalar(.5);
      h.rim.position.set(mid.x+.5,3.6,mid.z-7.5);h.rim.target.position.copy(mid);
      h.rim.intensity=key==='d'?0:key==='e'?28:screenOn*28;
    }
    if(h.ptahRim)h.ptahRim.intensity=key==='e'?9:0;
    if(h.bounce)h.bounce.intensity=key==='e'?5:0;
    const film=world.post.film;
    film.dof.aperture=S.dof.aperture+(SHOTS.c.dof.aperture-S.dof.aperture)*screenPush;film.dof.maxblur=S.dof.maxblur+(SHOTS.c.dof.maxblur-S.dof.maxblur)*screenPush;
    film.dof.focus=key==='d'?dpos.distanceTo(leader.clone().lerp(sled,.35)):typeof S.dof.focus==='number'?S.dof.focus+(SHOTS.c.dof.focus-S.dof.focus)*screenPush:h.visitors.reduce((v,r)=>v+r.face().distanceTo(cam.pos),0)/h.visitors.length;
    if(t>=cues.titleTilt)film.dof.focus+= (1.88-film.dof.focus)*smooth(t,cues.titleTilt,ctx.duration-.05);
    world.post.filmFrame=Math.round(t*30);
  }
  return {specs:{},shots:[shot],update,noSettle:true,near:.1,far:2400,info:{cues,approvedShots:Object.keys(SHOTS)}};
}
export const KINDS={desert:{build,plan}};
