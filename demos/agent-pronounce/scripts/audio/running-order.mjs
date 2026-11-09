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
  else if(id==='intro')t+=10;
  else if(id==='endcard')t+=3;
  else {
   t+=id==='office'?4:1.5;
   for(let i=0;i<ids.length;i++){
    const key=ids[i],l=LINES.find(x=>x.row===key),v=voices[key]||placeholderVoice(l);
    if(i)t+=key==='D4'?.1:key==='O3'?1.2:key==='O4'?1.5:.75;
    const stretch=Math.max(1,l.text.split(/\s+/).length/3/v.duration),duration=r(v.duration*stretch);
    rows[key]={row:key,start:r(t),duration,speaker:l.speaker,text:l.text,kind:'line',scene:id,sceneKind:kind,
      words:v.words.map(w=>({word:w.word,start:r(w.start*stretch),end:r(w.end*stretch)}))};
    t+=duration;
   }
   t+=id==='office'?Math.max(.6,rows.O4.start+.6-t):.7;
  }
  s.duration=r(t-start);s.end=r(t);scenes.push(s);t=snap(t);
 }
 const by=id=>scenes.find(s=>s.id===id);
 const word=(id,text,edge='start')=>{const w=rows[id].words.find(x=>clean(x.word)===clean(text));if(!w)throw Error(`missing ${id} ${text}`);return rows[id].start+w[edge]};
 const local=(scene,at)=>r(at-by(scene).start);
 const office=by('office');office.cues={entrance:4,tah:local('office',word('S2','Tah?')),spark:local('office',word('O1','pterodactyl.','end')),dip:local('office',word('O1','pterodactyl.','end')+.2),bolt:local('office',word('O3','old.')),flash:local('office',word('O4','Old.')),end:office.duration};
 office.cues.crackle=r(office.cues.bolt-.8);
 by('vortex').cues={land:2.6};
 const desert=by('desert');desert.cues={sofaLand:.3,rise:local('desert',rows.D1.start),pan:local('desert',word('D3','Look')),stamp:local('desert',word('D4','—checked!')),cursorPass:local('desert',rows.D4.start),portal:local('desert',word('D5','desktop.')),end:desert.duration};
 by('intro').cues={card1:.6,card2:1.8,card3:3,card4:4.2,card5:5.4,card6:6.6,chisel:7.8,tag:8.8};
 by('endcard').cues={end:3};
 const hits=[['electric-crackle',office.start+office.cues.crackle],['electric-spark',office.start+office.cues.spark],['lights-dip',office.start+office.cues.dip],['thunder-bolt',office.start+office.cues.bolt],['flash-boom',office.start+office.cues.flash],['sandstorm',by('vortex').start],['desert-wind',desert.start],['work-crew',desert.start],['stone-stamp',desert.start+desert.cues.stamp],['choir-swell',desert.start+desert.cues.portal],['chisel',by('intro').start+7.8]];
 return {total:r(t),rows,timeline:Object.values(rows),scenes,sfxHits:hits.map(([take,at])=>({id:take,take,at:r(at),volume:take==='desert-wind'||take==='work-crew'?.25:.7}))};
}
