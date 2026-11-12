import {LINES as OLD} from './script-data.mjs';
export const FPS=30;
const r=x=>+x.toFixed(3),snap=x=>Math.ceil(x*FPS)/FPS,clean=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
const line=(row,speaker,text,scene,tts=text)=>({row,speaker,text,scene,tts,settings:{}});
const old=id=>({...OLD.find(x=>x.row===id)});
export const LINES=[
 line('N1','Codex','I found a new coding-agent app.','office'),
 line('N2','Claude','Another one? What does this one do?','office'),
 line('N3','Codex','It runs all of us. Side by side. On one plan.','office','It runs all of us. <break time="0.5s" /> Side by side. <break time="0.5s" /> On one plan.'),
 line('N4','Claude',"Huh. What's it called?",'office'),
 line('N5','Codex',"…That's the problem.",'office'),
 old('S2'),old('O1'),old('O3'),{...old('O4'),scene:'desert'},old('D1'),old('D2'),
 line('D3','Conductor',"Look around. Many crews. One plan. Nothing goes up until it's checked.",'desert',"Look around. <break time=\"0.5s\" /> Many crews. <break time=\"0.5s\" /> One plan. <break time=\"0.5s\" /> Nothing goes up until it's checked."),
 old('D5'),old('D6')
];
export const SCENES=[['office','office',['N1','N2','N3','N4','N5','S2','O1','O3']],['vortex','vortex',[]],['desert','desert',['O4','D1','D2','D3','D5','D6']],['intro','2d',[]],['endcard','2d',[]]];
export function placeholderVoice(l){const words=l.text.split(/\s+/),d=Math.max(words.length/3,.65);return {duration:r(d),words:words.map((word,i)=>({word,start:r(i*d/words.length),end:r((i+1)*d/words.length)}))};}
export function layout(voices){
 const rows={},scenes=[];let t=0;
 for(const [id,kind,ids] of SCENES){
  const start=r(t),s={id,kind,rows:ids,start};
  if(id==='vortex')t+=3.5;else if(id==='intro')t+=6;else if(id==='endcard')t+=4;
  else{
   t+=id==='office'?4:5;
   for(let i=0;i<ids.length;i++){
    const key=ids[i],l=LINES.find(x=>x.row===key),v=voices[key]||placeholderVoice(l);
    if(i){const prev=LINES.find(x=>x.row===ids[i-1]);t+=id==='desert'&&key==='D1'?1.45:prev.speaker===l.speaker?.5:1.1;}
    if(key==='N4')t=Math.max(t,rows.N3.start-.4+4.5+.6);
    if(key==='D6'){const p=rows.D5.start+rows.D5.words.find(w=>clean(w.word)==='desktop').start;t=Math.max(t,p+20.8);}
    const stretch=Math.max(1,l.text.split(/\s+/).length/3/v.duration),duration=r(v.duration*stretch);
    rows[key]={row:key,start:r(t),duration,speaker:l.speaker,text:l.text,kind:'line',scene:id,sceneKind:kind,words:v.words.map(w=>({word:w.word,start:r(w.start*stretch),end:r(w.end*stretch)}))};
    t+=duration;
   }
   if(id==='office')t+=3.6;if(id==='desert')t+=2.7;
  }
  s.duration=r(t-start);s.end=r(t);scenes.push(s);t=snap(t);
 }
 const by=id=>scenes.find(s=>s.id===id);
 const word=(id,value,edge='start')=>{const w=rows[id].words.find(x=>clean(x.word)===clean(value));if(!w)throw Error(`missing ${id} ${value}`);return rows[id].start+w[edge]};
 const local=(scene,at)=>r(at-by(scene).start);
 const office=by('office'),rumble=r(rows.O3.start+rows.O3.duration+.6-office.start),pull=r(rumble+1.4),through=r(pull+1.6);
 office.duration=through;office.end=r(office.start+through);
 const delta=office.end-by('vortex').start;
 if(Math.abs(delta)>.0001){let shifting=false;for(const scene of scenes){if(scene.id==='vortex')shifting=true;if(shifting){scene.start=r(scene.start+delta);scene.end=r(scene.end+delta);for(const key of scene.rows)rows[key].start=r(rows[key].start+delta);}}t=r(t+delta);}
 office.cues={entrance:4,landingIn:local('office',rows.N3.start-.4),landingOut:local('office',rows.N3.start+4.1),tah:local('office',word('S2','Tah?')),spark:local('office',word('O1','pterodactyl.','end')),dip:local('office',word('O1','pterodactyl.','end')+.2),rumble,pull,through,end:through};
 by('vortex').cues={land:2.6};
 const desert=by('desert'),portal=local('desert',word('D5','desktop.'));
 desert.cues={sofaLand:.3,reveal:1.8,rise:local('desert',rows.O4.start),pan:local('desert',word('D3','Look')),stamp:local('desert',word('D3','checked.')),portal,pushIn:portal,showcaseEnd:r(portal+20),d6:local('desert',rows.D6.start),titleTilt:r(desert.duration-2),end:desert.duration};
 by('intro').cues={chisel:.6,tag:3.2,line:4.2,end:6};by('endcard').cues={end:4};
 const hits=[['electric-spark',office.start+office.cues.spark],['lights-dip',office.start+office.cues.dip],['rumble',office.start+rumble],['sandstorm',office.start+pull],['desert-wind',desert.start-.4],['work-crew',desert.start],['stone-stamp',desert.start+desert.cues.stamp],['choir-swell',desert.start+portal-.3],['chisel',by('intro').start+.6]];
 return {total:r(t),rows,timeline:Object.values(rows),scenes,sfxHits:hits.map(([take,at])=>({id:take,take,at:r(at),volume:take==='desert-wind'||take==='work-crew'?.25:.7}))};
}
