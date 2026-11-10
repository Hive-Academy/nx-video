import {LINES,SCENES} from './script-data.mjs';
export const FPS=30;
const r=x=>+x.toFixed(3), snap=x=>Math.ceil(x*FPS)/FPS;
const clean=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
export function placeholderVoice(l){
 const words=l.text.split(/\s+/),d=Math.max(words.length/3,.65);
 return {duration:r(d),words:words.map((word,i)=>({word,start:r(i*d/words.length),end:r((i+1)*d/words.length)}))};
}
export function layout(voices){
 const rows={},scenes=[];let t=0;
 for(const [id,kind,ids] of SCENES){
  const start=r(t),s={id,kind,rows:ids,start};
  if(id==='vortex')t+=3.5;
  else if(id==='intro')t+=6;
  else if(id==='endcard')t+=4;
  else {
   t+=id==='office'?4:3.2;
   for(let i=0;i<ids.length;i++){
    const key=ids[i],l=LINES.find(x=>x.row===key),v=voices[key]||placeholderVoice(l);
    if(i)t+=key==='D4'?.2:key==='O3'?1.2:1.05;
    const stretch=Math.max(1,l.text.split(/\s+/).length/3/v.duration),duration=r(v.duration*stretch);
    rows[key]={row:key,start:r(t),duration,speaker:l.speaker,text:l.text,kind:'line',scene:id,sceneKind:kind,
      words:v.words.map(w=>({word:w.word,start:r(w.start*stretch),end:r(w.end*stretch)}))};
    t+=duration;
   }
   t+=id==='office'?1.6:0;
   if(id==='desert'){const d6=rows.D6,portal=rows.D5.start+rows.D5.duration+.4,desired=portal+17.6;const shift=r(desired-d6.start);d6.start=desired;t+=shift+2.7;}
  }
  s.duration=r(t-start);s.end=r(t);scenes.push(s);t=snap(t);
 }
 const by=id=>scenes.find(s=>s.id===id);
 const word=(id,text,edge='start')=>{const w=rows[id].words.find(x=>clean(x.word)===clean(text));if(!w)throw Error(`missing ${id} ${text}`);return rows[id].start+w[edge]};
 const local=(scene,at)=>r(at-by(scene).start);
 const office=by('office');office.cues={entrance:4,tah:local('office',word('S2','Tah?')),spark:local('office',word('O1','pterodactyl.','end')),dip:local('office',word('O1','pterodactyl.','end')+.2),bolt:local('office',word('O3','old.')),flash:local('office',word('O4','Old.')),end:office.duration};
 office.cues.crackle=r(office.cues.bolt-.8);
 by('vortex').cues={land:2.6};
 const desert=by('desert');const portal=local('desert',rows.D5.start+rows.D5.duration+.4);desert.cues={sofaLand:.3,reveal:1.8,rise:local('desert',rows.D1.start),pan:local('desert',word('D3','Look')),stamp:local('desert',word('D4','checked!')),cursorPass:local('desert',rows.D4.start),portal,pushIn:portal,showcaseEnd:r(portal+16.8),d6:local('desert',rows.D6.start),titleTilt:r(desert.duration-2),end:desert.duration};
 by('intro').cues={chisel:.6,tag:3.2,line:4.2,end:6};
 by('endcard').cues={end:4};
 const hits=[['electric-crackle',office.start+office.cues.crackle],['electric-spark',office.start+office.cues.spark],['lights-dip',office.start+office.cues.dip],['thunder-bolt',office.start+office.cues.bolt],['flash-boom',office.end-.8],['sandstorm',by('vortex').start-.3],['desert-wind',desert.start-.4],['work-crew',desert.start],['stone-stamp',desert.start+desert.cues.stamp],['choir-swell',desert.start+desert.cues.portal-.3],['chisel',by('intro').start+.6]];
 return {total:r(t),rows,timeline:Object.values(rows),scenes,sfxHits:hits.map(([take,at])=>({id:take,take,at:r(at),volume:take==='desert-wind'||take==='work-crew'?.25:.7}))};
}
