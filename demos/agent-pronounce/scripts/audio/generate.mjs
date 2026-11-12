// Episode 6 audio pipeline. Requires ELEVENLABS_API_KEY in repository .env and ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
import {AUDIO,api,run,duration,ensureDir,exists,rel} from './lib.mjs';
import {CAST,SFX,MODEL,OUTPUT_FORMAT,MUSIC_PROMPT,END_MUSIC_PROMPT} from './script-data.mjs';
import {layout,LINES} from './running-order.mjs';
const dir=n=>{const p=path.join(AUDIO,n);ensureDir(p);return p;};
const voDir=dir('vo'),sfxDir=dir('sfx'),musicDir=dir('music'),alignDir=dir('align');
const force=process.argv.includes('--force');
const redoAt=process.argv.indexOf('--redo'),redo=new Set(redoAt>=0?(process.argv[redoAt+1]||'').split(','):[]);
const d3Alignment=path.join(alignDir,'d3.json');
if(exists(d3Alignment)&&!JSON.parse(fs.readFileSync(d3Alignment,'utf8')).words?.some(w=>String(w.word).toLowerCase().replace(/[^a-z]/g,'')==='checked'))redo.add('D3');
fs.writeFileSync(path.join(AUDIO,'voices.json'),JSON.stringify({model_id:MODEL,output_format:OUTPUT_FORMAT,voices:CAST,lines:LINES.map(l=>({row:l.row,speaker:l.speaker,text:l.text,tts:l.tts,voice_id:CAST[l.speaker].voice_id}))},null,2));
const voice={};
for(const l of LINES){
 const file=path.join(voDir,`${l.row.toLowerCase()}-${l.speaker.toLowerCase()}.mp3`);
 if(force||redo.has(l.row)||!exists(file)){
  console.log('TTS',l.row);
  const cast=CAST[l.speaker];
  fs.writeFileSync(file,await api('POST',`/v1/text-to-speech/${cast.voice_id}`,{query:{output_format:OUTPUT_FORMAT},accept:'audio/mpeg',json:{text:l.tts,model_id:MODEL,voice_settings:{...cast.settings,...l.settings}}}));
 }
 // Forced alignment maps actual audio to caption tokens. Fallback is proportional if API alignment fails.
 const aligned=path.join(alignDir,`${l.row.toLowerCase()}.json`);
 let words;
 if(exists(aligned)&&!force&&!redo.has(l.row)&&fs.statSync(aligned).mtimeMs>=fs.statSync(file).mtimeMs&&Array.isArray(JSON.parse(fs.readFileSync(aligned,'utf8')).words))words=JSON.parse(fs.readFileSync(aligned,'utf8')).words;
 else {
  try {
   const form=new FormData();form.set('file',new Blob([fs.readFileSync(file)],{type:'audio/mpeg'}),path.basename(file));form.set('text',l.tts.replace(/<break[^>]*\/>/g,' '));
   const a=await api('POST','/v1/forced-alignment',{form});
   const tokens=l.text.split(/\s+/),chars=a.characters||[];
   let p=0;
   words=tokens.map(word=>{const q=p+word.length;const segment=chars.slice(p,q);p=q+1;return {word,start:segment[0]?.start??0,end:segment.at(-1)?.end??0};});
  }catch(e){console.warn('alignment fallback',l.row,e.message);const toks=l.text.split(/\s+/),d=duration(file);words=toks.map((word,i)=>({word,start:i*d/toks.length,end:(i+1)*d/toks.length}));}
  fs.writeFileSync(aligned,JSON.stringify({words},null,2));
 }
 // Add a quiet, low and roomy parallel send while retaining the original consonants.
 let final=file;
 if(l.speaker==='Conductor'){
  final=path.join(voDir,`${l.row.toLowerCase()}-ptah-room.mp3`);
  if(force||redo.has(l.row)||!exists(final))run('ffmpeg',['-y','-v','error','-i',file,'-filter_complex','[0:a]asplit=2[dry][send];[send]asetrate=44100*0.88,aresample=44100,aecho=0.6:0.3:85:0.22,volume=0.24[wet];[dry][wet]amix=inputs=2:normalize=0,alimiter=limit=0.88[out]','-map','[out]','-c:a','libmp3lame','-b:a','192k',final]);
 }
 if(l.row==='D6'){
  final=path.join(voDir,'d6-codex-whisper.mp3');
  if(force||redo.has(l.row)||!exists(final))run('ffmpeg',['-y','-v','error','-i',file,'-af','highpass=f=230,lowpass=f=5200,volume=0.72','-c:a','libmp3lame','-b:a','192k',final]);
 }
 voice[l.row]={file:rel(final),duration:duration(final),words};
}
const L=layout(voice),voices={};
for(const l of LINES){const v=voice[l.row];voices['vo-'+l.row.toLowerCase()]={row:l.row,file:v.file,duration:v.duration,words:v.words,envelope:[],text:l.text,tts:l.tts};}
const sfx={};
for(const [id,s] of Object.entries(SFX)){
 const hit=L.sfxHits.find(h=>h.take===id);
 if(!hit)continue;
 const file=path.join(sfxDir,`${id}.mp3`);
 if(force||!exists(file)){console.log('SFX',id);fs.writeFileSync(file,await api('POST','/v1/sound-generation',{json:{text:s.prompt,duration_seconds:s.duration,prompt_influence:.45},accept:'audio/mpeg'}));}
 sfx[id]={file:rel(file),start:hit.at,duration:Math.min(duration(file),Math.max(.1,L.total-hit.at)),volume:hit.volume};
}
const thunder=path.join(sfxDir,'thunder-bolt.mp3'),rumbleHit=L.sfxHits.find(h=>h.take==='rumble');
if(exists(thunder)){
 const low=path.join(sfxDir,'rumble-low.mp3');
 if(!exists(low))run('ffmpeg',['-y','-v','error','-i',thunder,'-af','lowpass=f=260,volume=0.8','-c:a','libmp3lame','-b:a','128k',low]);
 sfx.rumble={file:rel(low),start:rumbleHit.at,duration:duration(low),volume:.45};
}
const windHit=L.sfxHits.find(h=>h.take==='sandstorm');
if(windHit){
 const wind=path.join(sfxDir,'sandstorm.mp3'),long=path.join(sfxDir,'sandstorm-transition.mp3');
 const windLength=+(L.scenes.find(s=>s.id==='desert').start-windHit.at).toFixed(3);
 if(!exists(long)||fs.statSync(long).size===0||Math.abs(duration(long)-windLength)>.1)run('ffmpeg',['-y','-v','error','-stream_loop','-1','-i',wind,'-t',String(windLength),'-af',`afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0,windLength-.4)}:d=0.4`,'-c:a','libmp3lame','-b:a','128k',long]);
 sfx.sandstorm={file:rel(long),start:windHit.at,duration:windLength,volume:.5};
}
const desert=L.scenes.find(s=>s.id==='desert');
const title=L.scenes.find(s=>s.id==='intro');
sfx['window-return']={file:rel(path.join(sfxDir,'choir-swell.mp3')),start:+(desert.start+desert.cues.showcaseEnd-.7).toFixed(3),duration:2.2,volume:.26};
sfx['title-scrape']={file:rel(path.join(sfxDir,'chisel.mp3')),start:+(title.start-.25).toFixed(3),duration:Math.min(1,duration(path.join(sfxDir,'chisel.mp3'))),volume:.3};
const introStart=L.scenes.find(s=>s.id==='intro').start;
// The title wall uses the chisel cue; the former cast-card plucks are removed.
async function music(id,prompt,seconds){
 const file=path.join(musicDir,`${id}.mp3`),raw=path.join(musicDir,`${id}-raw.mp3`);
 if(force||!exists(file)){
  if(force||!exists(raw)){console.log('MUSIC',id);fs.writeFileSync(raw,await api('POST','/v1/music',{json:{prompt,music_length_ms:seconds*1000,model_id:'music_v1'},accept:'audio/mpeg'}));}
  run('ffmpeg',['-y','-v','error','-i',raw,'-af',`atrim=duration=${seconds},apad=pad_dur=${seconds}`,'-t',String(seconds),'-c:a','libmp3lame','-b:a','192k',file]);
 }
 return {file:rel(file),duration:seconds,volume:.45};
}
const intro=await music('intro-theme',MUSIC_PROMPT,10),end=await music('end-sting',END_MUSIC_PROMPT,3);
const office=L.scenes.find(s=>s.id==='office');
const officeBed=path.join(musicDir,'office-night-bed.mp3');
run('ffmpeg',['-y','-v','error','-stream_loop','-1','-i',path.join(sfxDir,'night-ambience.mp3'),'-t',String(office.duration),'-af',`highpass=f=100,lowpass=f=1400,volume='if(between(t,4,${Math.max(4,office.duration-.6)}),0.4,1)':eval=frame,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0,office.duration-.6)}:d=0.6`,'-c:a','libmp3lame','-b:a','128k',officeBed]);
// Showcase bed: even 20 s of the cached house-tour bed (the 20–40 s slice sits near −12 dBFS
// before the quieter break). A 0.6 s fade-in, a 0.8 s fade-out, a −14 dB hold under D5,
// and +3 dB lifts at the three clip changes are baked in. measure-mix reads only a
// constant data-volume, so the file has to carry the envelope the render will play.
const showcaseStart=+(desert.start+desert.cues.pushIn).toFixed(3);
const showcaseEndAbs=+(desert.start+desert.cues.showcaseEnd).toFixed(3);
const bedDur=+(showcaseEndAbs+0.3-showcaseStart).toFixed(3);
const d5=L.timeline.find(x=>x.row==='D5');
const duckUntil=+(d5.start+d5.duration-showcaseStart).toFixed(3);
const riseUntil=+(duckUntil+0.43).toFixed(3);
const duckLin=(10**(-14/20)).toFixed(4);
const liftLin=(10**(3/20)).toFixed(4);
const liftAdd=(liftLin-1).toFixed(4);
const bump=at=>{const a=at.toFixed(3),b=(at+0.08).toFixed(3),c=(at+0.45).toFixed(3);return `if(between(t,${a},${b}),1+(t-${a})/0.08*${liftAdd},if(between(t,${b},${c}),${liftLin}-(t-${b})/0.37*${liftAdd},1))`;};
const bedEnv=`if(lt(t,${duckUntil}),${duckLin},if(lt(t,${riseUntil}),${duckLin}+${(1-duckLin).toFixed(4)}*(t-${duckUntil})/0.43,1))*${bump(5)}*${bump(10)}*${bump(15)}`;
const showcaseBed=path.join(musicDir,'showcase-bed.mp3');
const fadeOutAt=(bedDur-0.8).toFixed(3);
run('ffmpeg',['-y','-v','error','-i',path.join(musicDir,'bed.mp3'),'-af',`atrim=start=20:end=${20+bedDur},asetpts=PTS-STARTPTS,volume='${bedEnv}':eval=frame,afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOutAt}:d=0.8,alimiter=limit=0.89`,'-t',String(bedDur),'-c:a','libmp3lame','-b:a','192k',showcaseBed]);
const showcaseVol=0.28;
const cues={fps:30,total:L.total,voices,sfx,music:null,musicClips:[{file:rel(officeBed),start:office.start,duration:office.duration,volume:.03},{...intro,duration:6,start:L.scenes.find(s=>s.id==='intro').start},{...end,start:L.scenes.find(s=>s.id==='endcard').start},{file:rel(showcaseBed),start:showcaseStart,duration:bedDur,volume:showcaseVol}],timeline:L.timeline,scenes:L.scenes};
fs.writeFileSync(path.join(AUDIO,'cues.json'),JSON.stringify(cues,null,2));
console.log('Wrote cues.json',L.total);
