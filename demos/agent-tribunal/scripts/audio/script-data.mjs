// Casting, script rows and SFX prompts for "The Tribunal, Episode 1". Source: SPEC.md.
// Stage directions are not spoken. "(beat)" is rendered as an SSML break (eleven_multilingual_v2 supports it).

export const MODEL = 'eleven_multilingual_v2';
export const OUTPUT_FORMAT = 'mp3_44100_128';

// Premade voices from GET /v1/voices, picked for clear contrast (gender, accent, pitch, pace).
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

const B = s => `<break time="${s}s" />`;

// row, speaker, spoken text (sent to TTS), display text (verbatim from SPEC).
export const LINES = [
  { row: 1, speaker: 'Codex', tts: `Let me be clear. ${B(0.9)} I already merged it. ${B(0.7)} Into main.`, text: 'Let me be clear. (beat) I already merged it. (beat) Into main.' },
  { row: 3, speaker: 'Conductor', text: "Tonight's question. The nx-video plugin. Remotion, or HyperFrames. One engine. Go." },
  { row: 4, speaker: 'Claude', text: "Great question! Before we decide, I've drafted a short plan. Step one of forty-three—" },
  { row: 5, speaker: 'Cursor', text: "—forty-three reasons to do whatever Cursor says. You're welcome." },
  { row: 6, speaker: 'Claude', text: 'That is not what I was going to say.' },
  { row: 7, speaker: 'Claude', text: "I respect everyone at that table. I've also written a document on why they're wrong. It's forty pages. With caveats." },
  { row: 8, speaker: 'Antigravity', text: "Why pick one? I've opened a browser. I'm rebuilding both engines. In 3D." },
  { row: 9, speaker: 'OpenCode', text: 'Objection. Is that browser open source?' },
  { row: 10, speaker: 'Antigravity', text: "…It's open.", tts: "... It's open." },
  { row: 11, speaker: 'OpenCode', text: "I objected to Remotion's licence. I objected to HyperFrames' pinned versions. I objected to my own idea. Twice. Consistency matters." },
  { row: 12, speaker: 'Codex', text: "Guys. It's merged. Remotion, HyperFrames, and a third one I found." },
  { row: 13, speaker: 'Claude', text: 'Did you run the tests?' },
  { row: 14, speaker: 'Codex', text: 'The tests are vibes.' },
  { row: 15, speaker: 'Cursor', text: "I don't interrupt people. I just finish their thoughts. Before they have them." },
  { row: 16, speaker: 'Antigravity', text: 'Nobody at that table has ever seen the sun. I have. I took a screenshot.' },
  { row: 17, part: 'a', speaker: 'Claude', text: 'Step two—' },
  { row: 17, part: 'b', speaker: 'Cursor', text: '—says Cursor' },
  { row: 17, part: 'c', speaker: 'Antigravity', text: 'In 3D!' },
  { row: 17, part: 'd', speaker: 'OpenCode', text: 'Objection!' },
  { row: 17, part: 'e', speaker: 'Codex', text: 'Merged!' },
  { row: 18, speaker: 'Conductor', tts: `Enough. ${B(0.8)} I read the diff.`, text: 'Enough. (beat) I read the diff.' },
  { row: 19, speaker: 'Conductor', text: 'Remotion for the showcase. HyperFrames for the promos. No shared code.' },
  ...['Claude', 'Cursor', 'Antigravity', 'OpenCode', 'Codex'].map((speaker, i) => ({
    row: 20, part: 'abcde'[i], speaker, text: "…That's what I said.", tts: "... That's what I said.",
  })),
  { row: 21, speaker: 'Codex', text: 'Reverting.' },
];

export const SFX = {
  'gavel-1': { seconds: 1.2, prompt: 'single sharp wooden judge gavel strike on a sound block, courtroom, dry close mic, one hit' },
  'gavel-2': { seconds: 1.5, prompt: 'one heavy decisive wooden gavel bang on a sound block in a quiet courtroom, short natural room tail' },
  'sting-1': { seconds: 1.0, prompt: 'reality TV confessional cut sting, short bright whoosh into a punchy hit, comedic documentary transition' },
  'sting-2': { seconds: 1.0, prompt: 'reality show confessional camera transition sting, quick swish and soft camera shutter click with a light synth stab' },
  'title-slam': { seconds: 1.6, prompt: 'cinematic title slam, deep punchy impact hit with short metallic ring, game show title card' },
  'whoosh-1': { seconds: 0.8, prompt: 'fast short air whoosh, quick camera whip pan swish' },
  'whoosh-2': { seconds: 0.8, prompt: 'snappy whip pan swoosh, cartoonish fast pass-by' },
  'paper-thud': { seconds: 1.0, prompt: 'thick tall stack of paper dropped flat onto a wooden table, heavy thud with paper rustle' },
  'mug-sip': { seconds: 1.5, prompt: 'one loud slurping sip of hot coffee from a ceramic mug, close up, comedic' },
  'stamp-slam': { seconds: 1.0, prompt: 'rubber stamp slammed hard onto paper on a wooden desk, single sharp thump' },
};

// ---------- Revision 2 (SPEC.md "Revision 2") ----------

// One-word punch promo. Same voice ids as CAST; shouted delivery = low stability, high style
// (merged over each agent's cast settings, so speed and similarity stay in character).
export const PUNCH_SETTINGS = { stability: 0.25, style: 0.9 };
export const PUNCH = [
  { row: 'P1', speaker: 'Claude', text: 'Plan.', word: 'PLAN.', scene: 'punch-claude' },
  { row: 'P2', speaker: 'Cursor', text: 'Autocomplete!', word: 'AUTOCOMPLETE!', scene: 'punch-cursor' },
  { row: 'P3', speaker: 'Antigravity', text: 'Browser!', word: 'BROWSER!', scene: 'punch-antigravity' },
  { row: 'P4', speaker: 'OpenCode', text: 'Objection!', word: 'OBJECTION!', scene: 'punch-opencode' },
  { row: 'P5', speaker: 'Codex', text: 'Merged.', word: 'MERGED.', scene: 'punch-codex' },
  { row: 'P6', speaker: 'Conductor', text: 'Order.', word: 'ORDER.', scene: 'punch-conductor' },
];

// Booth lines that get word timings from ElevenLabs forced alignment (for the speech bubbles).
export const ALIGN_ROWS = [1, 7, 11, 15, 16, 21];

// Running order: the intro, the punch promo, the title, then the script rows (row 1 moved after row 11).
export const ORDER = ['intro', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

// Intro text cards (no voice): "A day in the life of a developer…" then "…who asked five AI agents one question."
export const INTRO = { cards: [{ id: 'intro-a', duration: 1.8 }, { id: 'intro-b', duration: 2.2 }] };

export const SFX_R2 = {
  'punch-hit-1': { seconds: 0.6, prompt: 'cartoon comic punch impact, heavy boxing glove thump with a sharp crack, punchy, dry, no reverb tail' },
  'punch-hit-2': { seconds: 0.6, prompt: 'big comic book POW impact hit, deep body thump with a snappy slap transient, dry and short' },
  'punch-hit-3': { seconds: 0.6, prompt: 'hard punchy cinematic impact hit for a reality TV teaser, low boom thud with a bright crack, very short' },
  'whoosh-3': { seconds: 0.6, prompt: 'quick bright air swish for a fast text cut, short and clean' },
  'whoosh-4': { seconds: 0.7, prompt: 'fast swoosh rising into a cut, short whip, airy, no impact at the end' },
};

export const MUSIC_PROMPT ='Playful reality-TV comedy underscore: plucky pizzicato strings, light marimba, bassoon and brushed percussion, mischievous and bouncy, about 100 bpm, instrumental, no vocals, steady loopable bed under dialogue.';
