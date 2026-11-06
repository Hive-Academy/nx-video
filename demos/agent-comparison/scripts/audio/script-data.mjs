// Casting, script rows, scenes, SFX and music prompts for "Agent Cribs" (The Tribunal, Episode 2).
// Source: SPEC.md (rows C1, T0, H1-H8, P1-P10, S1-S2, N1-N2, E1-E4; S and N added 2026-11-06). Lines are verbatim; "(beat)" is a pause, not spoken.
//
// `text` is the caption copy (the SPEC line without "(beat)"). `tts` is what is sent to ElevenLabs: SSML
// breaks for the beats and respellings for acronyms. Every respelling keeps the token count of `text`, so
// the forced-alignment words (aligned against `tts` minus breaks) map onto the caption words by position.

export const MODEL = 'eleven_multilingual_v2';
export const OUTPUT_FORMAT = 'mp3_44100_128';

// Same premade voices and settings as Episode 1 (../agent-tribunal/assets/audio/voices.json).
export const CAST = {
  Claude: {
    voice_id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', why: 'British female, clear and articulate; style pushed up for over-eager warmth',
    settings: { stability: 0.4, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true, speed: 1.05 },
  },
  Codex: {
    voice_id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', why: 'low husky American male; very high stability and zero style for a flat deadpan',
    settings: { stability: 0.92, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true, speed: 0.9 },
  },
  Cursor: {
    voice_id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', why: 'young sassy American female; high style and fast speed for smug and bright',
    settings: { stability: 0.3, similarity_boost: 0.75, style: 0.8, use_speaker_boost: true, speed: 1.15 },
  },
  Antigravity: {
    voice_id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', why: 'relaxed neutral voice, slowed down with loose stability for a dreamy, spaced-out read',
    settings: { stability: 0.35, similarity_boost: 0.7, style: 0.5, use_speaker_boost: true, speed: 0.88 },
  },
  OpenCode: {
    voice_id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', why: 'formal British broadcaster, crisp and precise; the most pedantic-sounding premade (no nasal premade exists)',
    settings: { stability: 0.7, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true, speed: 1.0 },
  },
  Conductor: {
    voice_id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', why: 'deep resonant American male, slowed for judge-like gravitas',
    settings: { stability: 0.75, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true, speed: 0.85 },
  },
};
export const ALL_FIVE = ['Claude', 'Cursor', 'Antigravity', 'OpenCode', 'Codex'];

const B = s => `<break time="${s}s" />`;

// Pacing pass (SPEC.md): rows above 3.2 words/s were re-taken slower with `settings` merged over the cast's
// (Cursor 1.0 as SPEC says, 0.88 where a 1.0 take still ran over 3.2; the Conductor was already at 0.85, so his
// re-takes go to 0.70-0.76 rather than SPEC's 0.9, which would have been faster).
// Spoken rows in script order. `layers` rows are several takes mixed into one file. The E2 takes say a plain
// "Both." (an ellipsis in the TTS text made some voices hum first, which broke the unison); the caption keeps "…Both.".
export const LINES = [
  { row: 'C1', speaker: 'Codex', text: 'Welcome to my crib. Both of them.', tts: `Welcome to my crib. ${B(0.8)} Both of them.` },
  { row: 'H1', speaker: 'Claude', text: 'This is T3 Code. Every one of us gets our own room!', settings: { speed: 0.86 } },
  { row: 'H2', speaker: 'Cursor', text: 'My own room. Nobody to interrupt. …Weird.', tts: `My own room. Nobody to interrupt. ${B(0.9)} Weird.` },
  { row: 'H3', speaker: 'Codex', text: 'Commit, push, PR. One button. I love it here.', tts: 'Commit, push, P.R. One button. I love it here.' },
  { row: 'H4', speaker: 'Antigravity', text: 'They installed me themselves. I feel so seen.' },
  { row: 'H5', speaker: 'OpenCode', text: 'Need another vendor? Slide a note under the door. They get the note. Not the gossip.', tts: `Need another vendor? Slide a note under the door. ${B(0.7)} They get the note. Not the gossip.` },
  { row: 'H6', speaker: 'Claude', text: 'Every turn gets a checkpoint. Mess up? Rewind!' },
  { row: 'H7', speaker: 'Cursor', text: 'And you can boss us around from your phone.', settings: { speed: 0.88 }, tts: `And you can boss us around ${B(0.25)} from your phone.` },
  { row: 'H8', speaker: 'Codex', text: 'The fridge? Event-sourced SQLite. Always fresh.', tts: 'The fridge? Event-sourced Sequel-lite. Always fresh.' },
  { row: 'P1', speaker: 'Conductor', text: 'Welcome to the temple. Here, one of us holds the gavel.', settings: { speed: 0.76 } },
  { row: 'P2', speaker: 'Conductor', text: 'I hand out the jobs.', settings: { speed: 0.7 } },
  { row: 'P3', speaker: 'Claude', text: "And if there's no file on disk… it didn't happen.", settings: { speed: 0.86 }, tts: "And if there's no file on disk... it didn't happen." },
  { row: 'P4', speaker: 'Codex', text: 'I tried to review my own code.', settings: { speed: 0.84 } },
  { row: 'P5', speaker: 'Conductor', text: 'Different family. Next.' },
  { row: 'P6', speaker: 'OpenCode', text: 'I ran out of free credits mid-job once.', settings: { speed: 0.9 } },
  { row: 'P7', speaker: 'Conductor', text: 'So the temple sent the work to someone else.', settings: { speed: 0.72 } },
  { row: 'S1', speaker: 'Conductor', text: "The temple keeps score. Who delivered, who didn't." },
  // S2's "(beat)" is the 0.6 s punchline-reply gap before the line (TIMING.gapBefore); its "…" is caption-only (an ellipsis in
  // the TTS text made voices hum first in E2).
  { row: 'S2', speaker: 'Codex', text: "…I'm working on my numbers.", tts: "I'm working on my numbers." },
  { row: 'P8', speaker: 'Claude', text: 'The fridge? BM25 plus vectors. Leftovers from every session!', tts: 'The fridge? B-M-25 plus vectors. Leftovers from every session!' },
  { row: 'N1', speaker: 'Claude', text: 'We even review your pull requests on a schedule. Four lenses, one verifier.' },
  { row: 'N2', speaker: 'Cursor', text: 'Dry-run by default. We have manners.', settings: { speed: 1.0 } },
  { row: 'P9', speaker: 'Cursor', text: 'And when we disagree…', settings: { speed: 0.88 }, tts: 'And when we disagree...' },
  { row: 'P10', speaker: 'Conductor', text: 'The Tribunal.' },
  { row: 'E2', speaker: 'All five', text: '…Both.', tts: 'Both.', layers: ALL_FIVE, offsets: [0, 0.02, 0.045, 0.01, 0.03] },
  { row: 'E3', speaker: 'Codex', text: "Rent's free. They're both MIT.", tts: "Rent's free. They're both M-I-T." },
];

// Silent rows (no voice): fixed lengths in seconds.
export const SILENT = {
  T0: { kind: 'title', duration: 2.5, text: 'AGENT CRIBS / Episode 2: same agents, two homes' },
  E1: { kind: 'card', duration: 2.0, text: 'So… which one do you live in?' },
  E4: { kind: 'endcard', duration: 3.5, text: 'Same agents. Two homes. / ptah.live / T3 Code — t3.codes' },
};

// Scenes in running order: [composition id, kind (the 3D agent's world), rows]. One sub-composition per
// contiguous scene; a kind may recur (t3-hall). `title` and `endcard` are HTML-only.
export const SCENES = [
  ['door-cold', 'door-cold', ['C1']],
  ['title', 'title', ['T0']],
  ['t3-door', 't3-door', ['H1']],
  ['t3-hall-a', 't3-hall', ['H2']],
  ['t3-codex-room', 't3-codex-room', ['H3']],
  ['t3-antigravity-room', 't3-antigravity-room', ['H4']],
  ['t3-hall-b', 't3-hall', ['H5']],
  ['t3-clock', 't3-clock', ['H6']],
  ['t3-phone', 't3-phone', ['H7']],
  ['t3-fridge', 't3-fridge', ['H8']],
  ['ptah-door', 'ptah-door', ['P1']],
  ['ptah-lanes', 'ptah-lanes', ['P2', 'P3']],
  ['ptah-review', 'ptah-review', ['P4', 'P5']],
  ['ptah-gate', 'ptah-gate', ['P6', 'P7']],
  ['ptah-scoreboard', 'ptah-scoreboard', ['S1', 'S2']],
  ['ptah-fridge', 'ptah-fridge', ['P8']],
  ['ptah-nightshift', 'ptah-nightshift', ['N1', 'N2']],
  ['ptah-tribunal', 'ptah-tribunal', ['P9', 'P10']],
  ['both', 'both', ['E1', 'E2', 'E3']],
  ['endcard', 'endcard', ['E4']],
];
export const ORDER = SCENES.flatMap(s => s[2]);

// Timing grammar (seconds), SPEC.md "Pacing pass" (2026-11-06). Every gap is measured word to word: from the
// last spoken word of one line (or the cut) to the first spoken word of the next.
export const TIMING = {
  roomLead: 0.6,          // new room: the cut, then 0.6 s before the first word (the label wipes in at +0.1 s)
  houseLead: 1.0,         // new house (t3-door, ptah-door)
  houses: ['t3-door', 'ptah-door'],
  sameRoomGap: 0.35,      // next line, same room
  // Punchline replies get 0.6 s (H2's "…Weird" is a beat inside its own take, see BEAT). P7 answers the P6 punchline
  // after 0.6 s too (the gate buzzer after "once." is clipped to end before it); E3 follows "…Both." after 0.8 s.
  gapBefore: { P5: 0.6, S2: 0.6, N2: 0.6, P10: 0.6, P7: 0.6, E3: 0.8 },
  roomHold: 0.7,          // end of a room: reaction hold from the last word to the cut
  betweenHouses: 1.2,     // after H8: hold with the music up (then the Ptah door's 1.0 s lead-in)
  cardToReply: 0.6,       // finale: E1 card (2.0 s) -> 0.6 s silence -> "…Both."
};
// A scripted (beat) inside a take renders as at least this much silence and is never compressed.
export const BEAT = 0.6;

// Sound effects (ElevenLabs sound-generation). `seconds` is the requested length.
export const SFX = {
  'doorbell-1': { seconds: 1.6, prompt: 'classic two-tone ding-dong doorbell chime of a house front door, bright and clean, close, short natural tail' },
  'doorbell-2': { seconds: 1.6, prompt: 'modern apartment loft doorbell, soft bright three-note electronic chime, clean, short tail' },
  'door-open-1': { seconds: 1.5, prompt: 'modern front door latch click then the door swinging open smoothly on quiet hinges, airy bright room' },
  'door-open-2': { seconds: 2.5, prompt: 'huge heavy stone temple doors grinding open, deep rumble with a soft echo in a large stone hall' },
  'record-scratch-1': { seconds: 0.8, prompt: 'vinyl record scratch, DJ turntable scratch, comedic, short and punchy' },
  'record-scratch-2': { seconds: 0.8, prompt: 'single quick vinyl record scratch, needle drag that stops the music abruptly, comedic' },
  'note-slide': { seconds: 1.0, prompt: 'small paper note sliding across a wooden floor and under a door, soft paper swish' },
  'button-press': { seconds: 0.6, prompt: 'big chunky arcade push button pressed hard, heavy plastic clunk with a satisfying click' },
  'tape-rewind': { seconds: 1.6, prompt: 'cassette tape rewinding fast, high pitched squeaky rewind whir that speeds up, comedic' },
  'phone-buzz': { seconds: 1.0, prompt: 'smartphone vibrating on a hard surface, two short buzzes' },
  'fridge-open-1': { seconds: 1.8, prompt: 'modern refrigerator door opening, rubber seal pop, then a soft electric hum, clean kitchen' },
  'fridge-open-2': { seconds: 2.0, prompt: 'heavy stone refrigerator door opening, deep seal pop then a cold low mystical hum' },
  stamp: { seconds: 1.0, prompt: 'rubber stamp slammed hard onto paper on a wooden desk, single sharp thump' },
  'gate-buzzer': { seconds: 0.8, prompt: 'harsh wrong-answer buzzer, game show error buzz, short single blast' },
  'stone-ticks': { seconds: 1.4, prompt: 'four quick soft chisel ticks on stone, light tapping tally marks being carved, dry and close' },
  'night-ambience': { seconds: 12, prompt: 'quiet night ambience inside a large stone temple, distant crickets, soft low fire crackle from braziers, calm and still, no music' },
};
// Reused from Episode 1 (copied from ../agent-tribunal/assets/audio/sfx, already normalized).
export const SFX_REUSED = ['gavel-1', 'gavel-2'];

export const MUSIC_PROMPT = 'Light playful hip-hop boom-bap instrumental for a celebrity house-tour TV show: dusty swung drums at 92 bpm, warm bass line, mellow Rhodes chords, vinyl crackle, a few turntable scratch accents, feel-good and bouncy, no vocals, steady loopable groove under dialogue.';
