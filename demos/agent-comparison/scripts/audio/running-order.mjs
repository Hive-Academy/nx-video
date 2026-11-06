// Running order for "Agent Cribs": places every row on the clock from the voice durations and word timings,
// derives the scene cuts, the named action cues (door opens, button press, gavel hits...) and the SFX hits.
// Shared by scripts/audio/generate.mjs (real voices) and src/build-timing.mjs (placeholder timing before the
// audio exists). Pure: no I/O.
import { LINES, SILENT, SCENES, TIMING, ORDER } from './script-data.mjs';

export const FPS = 30;
const FRAME = 1 / FPS;
const snap = t => Math.round(t * FPS) / FPS;
const r3 = t => +Number(t).toFixed(3);
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

/** Placeholder voice for a line: ~0.35 s per word + 0.6 s, plus its SSML breaks; words spread evenly. */
export function placeholderVoice(line) {
  const tokens = line.text.split(/\s+/).filter(Boolean);
  const breaks = [...(line.tts || '').matchAll(/<break time="([\d.]+)s"/g)].reduce((a, m) => a + Number(m[1]), 0);
  const duration = r3(0.35 * tokens.length + 0.6 + breaks);
  const step = (duration - 0.13) / tokens.length;
  return { duration, placeholder: true, words: tokens.map((word, i) => ({ word, start: r3(0.05 + i * step), end: r3(0.05 + (i + 0.9) * step) })) };
}

/**
 * @param voices { [row]: { duration, words: [{word,start,end}] (seconds from the voice file start) } }
 * @returns { total, rows: {[row]: rowInfo}, timeline: rowInfo[], scenes, sfxHits }
 */
export function layout(voices) {
  const sceneOfRow = {};
  SCENES.forEach(([id, kind, rows], i) => rows.forEach(r => { sceneOfRow[r] = i; }));
  const rows = {};
  const sceneStart = {};
  let prev = null;
  // Word-to-word clock (SPEC "Pacing pass"): `firstWord`/`lastWord` are offsets inside a take; a silent row (title,
  // E1 card, end card) "speaks" for its whole length.
  const firstWord = v => v?.words?.[0]?.start ?? 0;
  const lastWordAt = r => r.words?.length ? r.start + r.words.at(-1).end : r.start + r.duration;
  for (const key of ORDER) {
    const si = sceneOfRow[key];
    const [sceneId] = SCENES[si];
    const silent = SILENT[key];
    const v = silent ? null : voices[key];
    if (!silent && !v) throw new Error(`no voice for row ${key}`);
    const dur = silent ? silent.duration : v.duration;
    const lead = TIMING.houses.includes(sceneId) ? TIMING.houseLead : TIMING.roomLead;
    let start;
    if (!prev) { // C1: the cold open starts on frame 0; the first word lands after the room lead-in
      sceneStart[si] = 0;
      start = lead - firstWord(v);
    } else if (sceneOfRow[prev.row] !== si) { // hard cut into a new scene
      let cut;
      if (SILENT[prev.row]) cut = prev.start + prev.duration;          // the title / card runs its fixed length
      else cut = lastWordAt(prev) + (prev.row === 'H8' ? TIMING.betweenHouses : TIMING.roomHold);
      cut = snap(cut);
      sceneStart[si] = cut;
      start = silent ? cut : cut + lead - firstWord(v);
    } else if (SILENT[prev.row]) {               // E1 card -> 0.6 s of silence -> E2
      start = prev.start + prev.duration + TIMING.cardToReply - firstWord(v);
    } else {
      start = lastWordAt(prev) + (TIMING.gapBefore[key] ?? TIMING.sameRoomGap) - firstWord(v);
    }
    // Gaps are word to word, so only a take's trimmed silent tail can run under the next take's lead.
    if (prev && !silent && !SILENT[prev.row] && start < prev.start + prev.duration - 0.12) console.warn(`row ${key} starts ${(prev.start + prev.duration - start).toFixed(2)} s before ${prev.row}'s file ends`);
    const line = LINES.find(l => l.row === key);
    rows[key] = {
      row: key, start: r3(start), duration: r3(dur), speaker: line?.speaker ?? null, text: line?.text ?? silent?.text ?? null,
      kind: silent?.kind ?? 'line', scene: sceneId, sceneKind: SCENES[si][1],
      ...(v ? { words: v.words.map(w => ({ word: w.word, start: r3(w.start), end: r3(w.end) })) } : {}),
    };
    prev = rows[key];
  }
  const last = rows[ORDER.at(-1)];
  const total = r3(last.start + last.duration);
  const scenes = SCENES.map(([id, kind, rs], i) => ({ id, kind, rows: rs, start: r3(sceneStart[i]) }));
  scenes.forEach((s, i) => { s.end = i + 1 < scenes.length ? scenes[i + 1].start : total; s.duration = r3(s.end - s.start); });

  // ---------- Named action cues (absolute seconds). The 3D scenes and the SFX use the same times. ----------
  const R = rows;
  const end = k => R[k].start + R[k].duration;
  const sc = id => scenes.find(s => s.id === id);
  // Absolute time of a word in a row, by normalized text; `which` picks the n-th occurrence.
  const word = (k, text, edge = 'start', which = 0) => {
    const ws = R[k].words || [];
    const hits = ws.filter(w => norm(w.word) === norm(text));
    const w = hits[which] ?? null;
    if (!w) throw new Error(`row ${k}: word "${text}" not found in [${ws.map(x => x.word).join(' ')}]`);
    return R[k].start + w[edge];
  };
  const first = k => R[k].start + (R[k].words?.[0]?.start ?? 0);
  const act = (k, name, t, note) => { (R[k].actions ||= {})[name] = r3(t); (R[k].actionNotes ||= {})[name] = note; };

  act('C1', 'doorbell', first('C1'), 'doorbell chime under the first word');
  act('C1', 'bothOfThem', word('C1', 'Both'), '"Both of them." (beat before it)');
  act('T0', 'titleLand', R.T0.start + 5 * FRAME, 'title slam lands (5 frames after the cut) on the record scratch');
  act('H1', 'doorbell', sc('t3-door').start + 0.08, 'doorbell as the shot opens');
  act('H1', 'addressCard', sc('t3-door').start + 0.1, 'address card wipes in (holds 2 s)');
  act('H1', 'doorOpen', word('H1', 'Code.', 'end') + 0.05, 'door swings open onto the loft after "T3 Code."');
  act('H2', 'beat', word('H2', 'interrupt.', 'end'), 'the beat before "…Weird."');
  act('H2', 'weird', word('H2', '…Weird.'), '"…Weird."');
  act('H3', 'press', word('H3', 'button.') + 0.08, 'Codex presses the big button on "button."');
  act('H4', 'seen', word('H4', 'seen.'), '"seen."');
  act('H5', 'noteSlide', word('H5', 'Slide'), 'the note starts sliding');
  act('H5', 'noteUnder', word('H5', 'under'), 'the note passes under the door');
  act('H5', 'noteArrives', word('H5', 'They') - 0.05, 'the other robot picks up the note (after the beat)');
  act('H6', 'rewind', word('H6', 'Rewind!'), 'clocks spin backwards; tape rewind');
  act('H7', 'phoneLight', word('H7', 'boss'), 'the wall phone lights up with the loft inside');
  act('H7', 'phoneBuzz', word('H7', 'phone.', 'end') + 0.02, 'the phone buzzes after "phone."');
  act('H8', 'fridgeOpen', word('H8', 'fridge?', 'end') + 0.02, 'fridge door opens: seal pop, light spill');
  act('P1', 'doorOpen', sc('ptah-door').start + 0.12, 'temple doors open (music up between houses)');
  act('P1', 'addressCard', sc('ptah-door').start + 0.1, 'address card wipes in (holds 2 s)');
  act('P1', 'gavel', word('P1', 'gavel.') + 0.1, 'gavel tap on "gavel"');
  act('P2', 'lanes', word('P2', 'hand'), 'robots peel off to their lanes');
  act('P3', 'fileLands', word('P3', 'file'), 'the deliverable file lands in the tray');
  // Mid-line (the word nearest P3's middle) so the 3D stamp can lift off and DELIVERED reads for >= 1.2 s before the cut.
  act('P3', 'stamp', word('P3', 'disk…') + 0.05, 'DELIVERED stamp lands on "disk…"; lifted off, it reads through the cut');
  act('P4', 'reach', word('P4', 'review'), 'Codex reaches for its own file');
  act('P5', 'gavel', word('P5', 'family.', 'end') + 0.06, 'gavel between "Different family." and "Next."');
  act('P5', 'handoff', word('P5', 'Next.'), 'another-colour robot takes the file');
  act('P6', 'buzzer', word('P6', 'once.', 'end') + 0.05, 'AT LIMIT sign flashes with the gate buzzer after "once."');
  act('P7', 'reroute', word('P7', 'sent'), 'the job slides past OpenCode to another robot');
  act('S1', 'score', word('S1', 'score.'), 'the carved scoreboard comes into view / lights up');
  act('S1', 'tallyDelivered', word('S1', 'delivered,'), 'gold tally marks light up in the delivered rows');
  act('S1', 'tallyFailed', word('S1', "didn't."), 'the failed tallies light up');
  act('S2', 'lookUp', word('S2', "…I'm") - 0.5, 'Codex looks up at its own column (the beat before S2)');
  act('S2', 'sheepish', word('S2', 'numbers.'), 'Codex looks away; tiny sheepish hop');
  act('N1', 'unroll', word('N1', 'review'), 'the PR scroll unrolls across the table');
  act('N1', 'lenses', word('N1', 'Four'), 'four robots raise their coloured lenses');
  act('N1', 'verifier', word('N1', 'verifier.'), 'the fifth robot stamps / checks their notes');
  act('N2', 'drySign', word('N2', 'Dry-run'), 'Cursor lifts the DRY RUN sign');
  act('N2', 'manners', word('N2', 'manners.'), '"We have manners."');
  act('P8', 'fridgeOpen', word('P8', 'fridge?', 'end') + 0.02, 'stone fridge opens onto glowing scrolls');
  act('P9', 'disagree', word('P9', 'disagree…'), '"disagree…"');
  act('P10', 'gavel', word('P10', 'Tribunal.', 'end') + 0.1, 'gavel after "The Tribunal."');
  act('E1', 'scratch', R.E1.start + FRAME, 'record scratch; the music stops; card in');
  act('E2', 'turn', word('E2', '…Both.') - 0.4, 'all five turn to camera (in the 0.6 s of silence)');
  act('E3', 'sunglasses', word('E3', 'MIT.'), 'Codex puts the sunglasses back on');

  // ---------- SFX hits: [cue id, take, time, volume, align] ----------
  // align 'peak': the file's loudest sample lands one frame after `time` (light before sound);
  // align 'start': the file starts at `time` (sweeps and rumbles whose peak is late).
  const A = (k, n) => R[k].actions[n];
  const sfxHits = [
    ['doorbell-c1', 'doorbell-1', A('C1', 'doorbell'), 0.4, 'peak', 'C1'],
    ['scratch-title', 'record-scratch-1', A('T0', 'titleLand'), 0.85, 'peak', 'T0'],
    ['doorbell-t3', 'doorbell-2', A('H1', 'doorbell'), 0.55, 'peak', 'H1'],
    ['door-open-t3', 'door-open-1', A('H1', 'doorOpen'), 0.6, 'start', 'H1'],
    ['button-h3', 'button-press', A('H3', 'press'), 0.8, 'peak', 'H3'],
    ['note-h5', 'note-slide', A('H5', 'noteSlide'), 0.8, 'start', 'H5'],
    ['rewind-h6', 'tape-rewind', A('H6', 'rewind'), 0.5, 'start', 'H6'],
    ['phone-h7', 'phone-buzz', A('H7', 'phoneBuzz'), 0.65, 'start', 'H7'],
    ['fridge-t3', 'fridge-open-1', A('H8', 'fridgeOpen'), 0.7, 'peak', 'H8'],
    ['door-open-ptah', 'door-open-2', A('P1', 'doorOpen'), 0.75, 'start', 'P1'],
    ['gavel-p1', 'gavel-1', A('P1', 'gavel'), 0.6, 'peak', 'P1'],
    ['stamp-p3', 'stamp', A('P3', 'stamp'), 0.8, 'peak', 'P3'],
    ['gavel-p5', 'gavel-1', A('P5', 'gavel'), 0.75, 'peak', 'P5'],
    ['buzzer-p6', 'gate-buzzer', A('P6', 'buzzer'), 0.55, 'start', 'P6', R.P7.start + R.P7.words[0].start - 0.05, 0],
    ['ticks-s1', 'stone-ticks', A('S1', 'tallyDelivered'), 0.55, 'start', 'S1'],
    ['fridge-ptah', 'fridge-open-2', A('P8', 'fridgeOpen'), 0.7, 'peak', 'P8'],
    ['night-n1', 'night-ambience', sc('ptah-nightshift').start, 0.5, 'start', 'N1', sc('ptah-nightshift').end, 0.4],
    ['gavel-p10', 'gavel-2', A('P10', 'gavel'), 0.9, 'peak', 'P10'],
    ['scratch-e1', 'record-scratch-2', A('E1', 'scratch'), 0.9, 'peak', 'E1'],
  ].map(([id, take, at, volume, align, row, until, fadeIn]) => ({
    id, take, at: r3(at), volume, align, row, ...(until != null ? { until: r3(until), fadeIn } : {}),
    note: R[row].actionNotes[Object.keys(R[row].actions).find(n => Math.abs(R[row].actions[n] - at) < 1e-6)] ?? 'bed under the whole scene',
  }));

  const timeline = ORDER.map(k => R[k]);
  return { total, rows: R, timeline, scenes, sfxHits };
}
