// Episode 6 script contract. Text is caption copy; TTS must preserve token count.
export const MODEL='eleven_multilingual_v2', OUTPUT_FORMAT='mp3_44100_128';
export const CAST={
 Claude:{voice_id:'Xb7hH8MSUJpSbSDYk0k2',name:'Alice',settings:{stability:.4,similarity_boost:.8,style:.45,use_speaker_boost:true,speed:1.05}},
 Codex:{voice_id:'N2lVS1w4EtoT3dr4eOWO',name:'Callum',settings:{stability:.92,similarity_boost:.8,style:0,use_speaker_boost:true,speed:.9}},
 Cursor:{voice_id:'FGY2WhTYpPnrIDTdsKH5',name:'Laura',settings:{stability:.3,similarity_boost:.75,style:.8,use_speaker_boost:true,speed:1.15}},
 Conductor:{voice_id:'nPczCjzI2devNBz1zQrb',name:'Brian',settings:{stability:.75,similarity_boost:.85,style:.2,use_speaker_boost:true,speed:.85}},
};
const line=(row,speaker,text,scene,tts=text,settings={})=>({row,speaker,text,scene,tts,settings});
export const LINES=[
 line('S2','Claude',"Hmm… Tah? The P's silent, right?",'office',`Hmm… <break time="0.4s" /> Taa? <break time="0.3s" /> The P's silent, right?`),
 line('O1','Codex','Has to be. Like pterodactyl.','office'),
 line('O3','Codex','Honestly? It sounds… old.','office'),
 line('O4','Conductor','Old.','office','Old.',{speed:.76}),
 line('D1','Conductor','I made the world by speaking its name. Say mine properly.','desert'),
 line('D2','Claude','Respectfully… why does the god of builders care about coding agents?','desert'),
 line('D3','Conductor',"Look around. Many crews. One plan. Nothing goes up until it's—",'desert'),
 line('D4','Cursor','—checked! Got it! Next block!','desert'),
 line('D5','Conductor','Same idea. Now it runs on your desktop.','desert'),
 line('D6','Codex',"…okay. That's actually cool.",'desert',"…okay. That's actually cool.",{speed:.8,style:.15}),
];
export const SCENES=[['office','office',['S2','O1','O3','O4']],['vortex','vortex',[]],['desert','desert',['D1','D2','D3','D4','D5','D6']],['intro','2d',[]],['endcard','2d',[]]];
export const SFX={
 'electric-crackle':{prompt:'Short electric crackle from a laptop, no speech',duration:2},
 'electric-spark':{prompt:'Brief electrical spark snap, no speech',duration:1},
 'lights-dip':{prompt:'Low electrical lights dimming hum, no speech',duration:2},
 'thunder-bolt':{prompt:'Single dramatic electrical thunder bolt, no speech',duration:2},
 'flash-boom':{prompt:'Deep cinematic thunder boom for white flash, no speech',duration:2},
 'sandstorm':{prompt:'Swirling sandstorm vortex whoosh, no speech',duration:3},
 'desert-wind':{prompt:'Soft steady ancient desert wind ambience, no speech',duration:15},
 'work-crew':{prompt:'Distant ancient stone building work crew, no speech',duration:15},
 'stone-stamp':{prompt:'Single solid stone stamp strike, no speech',duration:1},
 'choir-swell':{prompt:'Soft ethereal choir swell for magical doorway, no words',duration:4},
 'chisel':{prompt:'Sharp stone chisel carving hit, no speech',duration:1},
 'oud-pluck':{prompt:'Single short comedic oud string pluck with a tiny synth sparkle, no speech',duration:1},
};
export const SFX_REUSED=[];
export const MUSIC_PROMPT='Cheesy upbeat sitcom theme, oud plucks and playful analog synthesizer, 10 seconds, distinct rhythmic hits every 1.2 seconds from 0.6, no vocals';
export const END_MUSIC_PROMPT='Cheesy oud and analog synth sitcom end card sting, bright final chord, no vocals';
export const BEAT=.6;
