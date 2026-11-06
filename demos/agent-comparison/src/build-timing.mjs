// Generator for "Agent Cribs" (The Tribunal, Episode 2; SPEC.md). Source of truth for index.html,
// compositions/*.html and src/timing.json; never hand-edit those generated files.
//
// Inputs: assets/audio/cues.json (running order, voices with word timings and envelopes, SFX, music; written
// by scripts/audio/generate.mjs), src/captions.json (caption copy: key words, emoji, group breaks),
// scripts/audio/script-data.mjs (scenes, lines). Without cues.json (or with --placeholder) it lays the film
// out from placeholder voice lengths (~0.35 s per word + 0.6 s) and writes no audio.
// Usage: node src/build-timing.mjs [--placeholder]
//
// 3D mount contract (the 3D agent owns src/scene.js): every 3D scene calls
//   window.__hf.buildReady[id] = window.TribunalReady.then(api => api.mount(config, canvasEl))
// config = { id, kind, absoluteStart, duration, clock: 'scene', host,
//   rows: [{ row, speaker, start, duration, localStart, words: [{ word, start, end }] }],
//   actions: { name: t }, sfx: [{ id, take, hit, volume }], cast: { Agent: { color, icon } } }
// All times inside config except absoluteStart / rows[].start are scene-local seconds (0 = the cut into
// this composition); rows[].words are scene-local too (not row-local). rows[].start is absolute.
import fs from 'node:fs';
import path from 'node:path';
import { layout, placeholderVoice, FPS } from '../scripts/audio/running-order.mjs';
import { LINES, SCENES, ALL_FIVE } from '../scripts/audio/script-data.mjs';

const base = path.resolve(import.meta.dirname, '..');
const read = f => JSON.parse(fs.readFileSync(path.join(base, f), 'utf8'));
const cuesPath = path.join(base, 'assets/audio/cues.json');
const PLACEHOLDER = process.argv.includes('--placeholder') || !fs.existsSync(cuesPath);
let cues;
if (PLACEHOLDER) {
  const L = layout(Object.fromEntries(LINES.map(l => [l.row, placeholderVoice(l)])));
  cues = { fps: FPS, total: L.total, timeline: L.timeline, scenes: L.scenes, voices: {}, sfx: {}, music: null, placeholder: true };
} else {
  cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
  if (!Array.isArray(cues.scenes)) throw new Error('cues.json has no Episode 2 scenes; run scripts/audio/generate.mjs first');
}
const captions = read('src/captions.json');

const FRAME = 1 / FPS;
const W = 1920, H = 1080;
const INK = '#1A1410', CREAM = '#FFF6E5', AMBER = '#E8A33D', TEAL = '#0F2A33';
const T3 = { black: '#000000', white: '#FFFFFF', blue: '#1B4ED8', blueDark: '#346BF1', zinc: '#18181B' };
const MAGENTA = '#C2126B', ORANGE = '#D9600B'; // title split: both keep cream type above 3:1
const colors = { Claude: '#D97757', Codex: '#10A37F', Cursor: '#8C8CFF', Antigravity: '#4F8BF5', OpenCode: '#111111', Conductor: '#E8A33D' };
const icons = { Claude: 'claude', Codex: 'codex', Cursor: 'cursor', Antigravity: 'antigravity', OpenCode: 'opencode', Conductor: 'ptah' };
const INV = new Set(['OpenCode']); // black-and-white brand: white type and a white highlighter
const PTAH_EMBLEM = 'assets/brand/ptah-emblem-gold.png';
const T3_LOGO = 'assets/icons/t3code.svg';

// ---------- Timing ----------
const total = +Number(cues.total).toFixed(3);
const rows = Object.fromEntries(cues.timeline.map(x => [String(x.row), x]));
const row = k => { const r = rows[String(k)]; if (!r) throw new Error(`cues.json timeline has no row ${k}`); return r; };
const scenes = cues.scenes.map(s => ({ ...s }));
const sceneOfRow = Object.fromEntries(scenes.flatMap(s => s.rows.map(r => [r, s])));
const voiceByRow = {};
for (const [id, v] of Object.entries(cues.voices || {})) voiceByRow[String(v.row)] = { id, ...v };
const envelopeByRow = {};
for (const v of Object.values(cues.voices || {})) if (Array.isArray(v.envelope)) envelopeByRow[String(v.row)] = v.envelope;
const isSpoken = k => Array.isArray(row(k).words) && row(k).words.length > 0;

// ---------- Helpers ----------
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const f = n => Number(n).toFixed(3);
const overlay = (id, html, at, dur, extra = '') => `<div id="${id}" class="clip overlay" data-start="${f(Math.max(0, at))}" data-duration="${f(dur)}"${extra}><div class="inner">${html}</div></div>`;
const iconSrc = agent => agent === 'Conductor' ? PTAH_EMBLEM : `assets/icons/${icons[agent]}.svg`;
const badge = (agent, cls = 'badge') => `<span class="${cls}${agent === 'Conductor' ? ' dark' : ''}"><img src="${iconSrc(agent)}" alt="${esc(agent)} logo"></span>`;
const house = id => id.startsWith('t3-') ? 't3' : id.startsWith('ptah-') ? 'ptah' : null;

const CSS = `
#root{position:absolute;inset:0;overflow:hidden}
#root canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#root .overlay{position:absolute;inset:0;z-index:3;pointer-events:none;color:${CREAM};font-family:'Archivo Black',sans-serif}
#root .inner{position:absolute;inset:0}
#root .badge{display:flex;align-items:center;justify-content:center;border-radius:50%;background:${CREAM};border:5px solid ${INK};box-sizing:border-box;box-shadow:6px 6px 0 ${INK}}
#root .badge img{width:62%;height:62%;object-fit:contain;display:block}
#root .badge.dark{background:${INK};border-color:${INK}}
#root .badge.dark img{width:86%;height:86%}
`;

// ---------- Room labels (top-left, title-safe; wipe in 6 frames; hold while in the room) ----------
const ROOMS = {
  't3-hall-a': [{ text: 'ONE AGENT PER THREAD' }],
  't3-codex-room': [{ text: 'THE SHIP ROOM' }],
  't3-antigravity-room': [{ text: 'SETUP INCLUDED' }],
  't3-hall-b': [{ text: 'THE NOTE SLOT', code: 'delegate_task' }],
  't3-clock': [{ text: 'THE TIME MACHINE' }],
  't3-phone': [{ text: 'THE REMOTE' }],
  't3-fridge': [{ text: 'THE FRIDGE' }],
  'ptah-lanes': [{ text: 'THE LANES' }, { row: 'P3', text: 'RECEIPTS' }],
  'ptah-review': [{ text: 'THE REVIEW DESK' }],
  'ptah-gate': [{ text: 'THE LIMIT GATE' }],
  'ptah-scoreboard': [{ text: 'THE SCOREBOARD' }],
  'ptah-nightshift': [{ text: 'THE NIGHT SHIFT' }],
  'ptah-fridge': [{ text: 'THE FRIDGE', sub: 'project memory' }],
  'ptah-tribunal': [{ row: 'P10', text: 'THE TRIBUNAL' }],
};
const CSS_ROOM = `
#root .room{position:absolute;left:192px;top:112px}
#root .room-tag{display:flex;align-items:center;gap:16px;padding:10px 26px 10px 10px;box-sizing:border-box;white-space:nowrap}
#root .room-tag b{font:400 34px/1 'Archivo Black',sans-serif;letter-spacing:.035em}
#root .room-tag em{font-style:normal}
#root .room-mark{display:flex;align-items:center;justify-content:center;width:54px;height:54px;flex:none}
#root .room-tag.t3 .room-mark{background:url('${T3_LOGO}') center/contain no-repeat}
#root .room-tag.ptah .room-mark{background:url('${PTAH_EMBLEM}') center/contain no-repeat}
#root .room-tag.t3{background:${T3.white};color:${T3.black};border-left:9px solid ${T3.blue};border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,.28)}
#root .room-tag.t3 em{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:28px;line-height:1;color:${T3.blue};background:#EEF2FF;border-radius:8px;padding:6px 12px}
#root .room-tag.ptah{background:rgba(20,14,8,.92);color:${CREAM};border-left:9px solid ${AMBER};border-radius:3px;box-shadow:8px 8px 0 rgba(0,0,0,.5)}
#root .room-tag.ptah .room-mark{width:58px;height:58px}
#root .room-tag.ptah em{font:600 28px/1 Inter,sans-serif;color:${AMBER}}
`;
function roomLabels(s) {
  const list = ROOMS[s.id];
  if (!list) return { html: '', tl: [] };
  const h = house(s.id);
  const mark = `<span class="room-mark" role="img" aria-label="${h === 't3' ? 'T3 Code logo' : 'Ptah emblem'}"></span>`;
  let html = ''; const tl = [];
  list.forEach((l, i) => {
    const at = l.row ? Math.max(0.1, row(l.row).start - s.start - 0.05) : 3 * FRAME;
    const next = list[i + 1];
    const until = next ? Math.max(at + 0.5, row(next.row).start - s.start - 0.05) : s.duration;
    const id = `${s.id}-room${i}`;
    const extra = l.code ? `<em>${esc(l.code)}</em>` : l.sub ? `<em>${esc(l.sub)}</em>` : '';
    html += overlay(id, `<div class="room"><div id="${id}-tag" class="room-tag ${h}">${mark}<b>${esc(l.text)}</b>${extra}</div></div>`, at, until - at);
    tl.push(`tl.fromTo('#${id}-tag',{clipPath:'inset(0% 100% 0% 0%)',x:-24},{clipPath:'inset(0% 0% 0% 0%)',x:0,duration:${f(6 * FRAME)},ease:'power3.out'},${f(at)});`);
    if (next) tl.push(`tl.to('#${id}-tag',{clipPath:'inset(0% 0% 0% 100%)',duration:${f(4 * FRAME)},ease:'power2.in'},${f(until - 4 * FRAME)});`);
  });
  return { html, tl };
}

// ---------- Address cards (house entry: slanted card, wipes in left to right, holds 2 s) ----------
const CSS_ADDRESS = `
#root .address{position:absolute;left:184px;top:120px}
#root .address-card{position:relative;display:flex;align-items:center;gap:28px;padding:22px 46px 24px 26px;transform:skewX(-8deg);box-sizing:border-box}
#root .address-card .ac-in{display:flex;align-items:center;gap:28px;transform:skewX(8deg)}
#root .address-card .ac-logo{width:128px;height:128px;flex:none;display:block;object-fit:contain}
#root .address-card .ac-text{display:flex;flex-direction:column;gap:6px}
#root .address-card strong{font:400 84px/.95 'Archivo Black',sans-serif;letter-spacing:-.01em;white-space:nowrap}
#root .address-card span{font:700 40px/1 Inter,sans-serif;white-space:nowrap;letter-spacing:.01em}
#root .address-card.t3{background:${T3.white};border:5px solid ${T3.black};box-shadow:12px 12px 0 ${T3.black}}
#root .address-card.t3 strong{color:${T3.black}}
#root .address-card.t3 span{color:${T3.blue}}
#root .address-card.ptah{background:#140E08;border:5px solid ${AMBER};box-shadow:12px 12px 0 #000}
#root .address-card.ptah .ac-logo{width:140px;height:140px;margin:-6px 0}
#root .address-card.ptah strong{color:${CREAM}}
#root .address-card.ptah span{color:${AMBER}}
`;
function addressCard(s, which) {
  const r = row(s.rows[0]);
  const at = Math.max(3 * FRAME, (r.actions?.addressCard ?? s.start + 0.1) - s.start);
  const hold = 2.0, wipe = 8 * FRAME, out = 6 * FRAME;
  const dur = Math.min(s.duration - at, wipe + hold + out);
  const id = `${s.id}-address`;
  const inner = which === 't3'
    ? `<img class="ac-logo" src="${T3_LOGO}" alt="T3 Code logo"><span class="ac-text"><strong>T3 Code</strong><span>t3.codes</span></span>`
    : `<img class="ac-logo" src="${PTAH_EMBLEM}" alt="Ptah emblem"><span class="ac-text"><strong>Ptah</strong><span>ptah.live</span></span>`;
  const html = overlay(id, `<div class="address"><div id="${id}-wipe"><div class="address-card ${which}"><div class="ac-in">${inner}</div></div></div></div>`, at, dur);
  const tl = [
    `tl.fromTo('#${id}-wipe',{clipPath:'inset(-30px 100% -30px -40px)',x:-40},{clipPath:'inset(-30px -40px -30px -40px)',x:0,duration:${f(wipe)},ease:'power3.out'},${f(at)});`,
    `tl.to('#${id}-wipe',{clipPath:'inset(-30px -40px -30px 100%)',x:30,duration:${f(out)},ease:'power2.in'},${f(at + dur - out)});`,
  ];
  return { html, tl };
}

// ---------- Scene files ----------
function threeScene(s) {
  let css = CSS_ROOM, body = '', tl = [];
  const room = roomLabels(s);
  body += room.html; tl.push(...room.tl);
  if (s.id === 't3-door' || s.id === 'ptah-door') {
    const card = addressCard(s, house(s.id));
    css += CSS_ADDRESS; body += card.html; tl.push(...card.tl);
  }
  if (s.id === 'both') {
    const e = e1Card(s);
    css += e.css; body += e.html; tl.push(...e.tl);
  }
  return { css, body, tl, mount: true };
}

function e1Card(s) {
  const r = row('E1');
  const at = r.start - s.start + FRAME; // lands with the record scratch
  const outAt = row('E2').start - s.start - 0.3; // gone before the E2 caption band slides in
  const id = 'both-e1';
  const html = overlay(id, `<div class="e1-zone"><div id="${id}-plate" class="e1-plate"><div class="e1-in" data-layout-allow-overlap><small>So…</small><strong>which one do you live in?</strong></div></div></div>`, at - FRAME, outAt - at + FRAME + 4 * FRAME);
  const css = `
#root .e1-zone{position:absolute;left:0;right:0;bottom:100px;display:flex;justify-content:center}
#root .e1-plate{position:relative;background:${INK};border:6px solid ${CREAM};box-shadow:14px 14px 0 ${MAGENTA};padding:20px 54px 30px}
#root .e1-in{display:flex;flex-direction:column;align-items:center;gap:12px}
#root .e1-in small{font:italic 700 42px/1 Inter,sans-serif;color:${AMBER}}
#root .e1-in strong{font:400 74px/1.04 'Archivo Black',sans-serif;color:${CREAM};letter-spacing:-.01em;white-space:nowrap}
`;
  const tl = [
    `gsap.set('#${id}-plate',{opacity:0,scale:1.9,rotation:-7});`,
    `tl.fromTo('#${id}-plate',{opacity:0},{opacity:1,duration:${f(FRAME)},ease:'none',immediateRender:false},${f(at)});`,
    `tl.fromTo('#${id}-plate',{scale:1.9,rotation:-7},{scale:1,rotation:-2,duration:${f(4 * FRAME)},ease:'power3.in',immediateRender:false},${f(at)});`,
    `tl.set('#${id}-plate',{x:12,y:-6},${f(at + 4 * FRAME)});tl.set('#${id}-plate',{x:-9,y:5},${f(at + 5 * FRAME)});tl.set('#${id}-plate',{x:0,y:0},${f(at + 6 * FRAME)});`,
    `tl.to('#${id}-plate',{scale:.6,opacity:0,duration:${f(4 * FRAME)},ease:'power2.in'},${f(outAt)});`,
  ];
  return { html, css, tl };
}

// Ptah's temple (16:9 crop of temple-bg.webp centred on the throne) under a dark shade so type keeps >= 4.5:1.
const CSS_TEMPLE = `
#root .temple{position:absolute;inset:0;overflow:hidden;z-index:0}
#root .temple-img{position:absolute;left:0;top:0;width:${W}px;height:${H}px;object-fit:cover;transform-origin:50% 48%}
#root .temple-shade{position:absolute;inset:0;background:radial-gradient(ellipse 70% 72% at 50% 50%,rgba(5,8,9,.66) 0%,rgba(5,8,9,.76) 58%,rgba(3,5,6,.9) 100%)}
`;
const temple = (id, dur) => ({
  html: `<div class="temple"><img id="${id}-temple" class="temple-img" src="assets/backgrounds/temple-16x9.jpg" alt=""><div class="temple-shade"></div></div>`,
  tl: `tl.fromTo('#${id}-temple',{scale:1},{scale:1.035,duration:${f(dur)},ease:'none'},0);`,
});

function titleScene(s) {
  const cast = ['Claude', 'Codex', 'Cursor', 'Antigravity', 'OpenCode', 'Conductor'];
  const land = (row('T0').actions?.titleLand ?? s.start + 5 * FRAME) - s.start;
  const html = `<div class="title-bg"><div id="title-split" class="title-split" data-layout-allow-overflow></div><div class="title-stripes"></div></div><div class="title-stack"><div id="title-shake"><strong id="title-word" data-var-text="title">AGENT CRIBS</strong></div><div id="title-sub-wrap"><small id="title-sub">Episode 2: same agents, two homes</small></div><div class="title-cast">${cast.map((a, i) => `<span id="title-cast-${i}" class="title-cast-item">${badge(a)}</span>`).join('')}</div></div>`;
  const css = `
#root .title-bg{position:absolute;inset:0;overflow:hidden}
#root .title-split{position:absolute;left:-200px;right:-200px;top:0;bottom:0;background:linear-gradient(104deg,${MAGENTA} 0%,${MAGENTA} 49.4%,${CREAM} 49.4%,${CREAM} 50.6%,${ORANGE} 50.6%,${ORANGE} 100%)}
#root .title-stripes{position:absolute;inset:0;background:repeating-linear-gradient(104deg,rgba(255,255,255,.07) 0 3px,transparent 3px 26px)}
#root .title-stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center}
#root #title-word{display:block;font:400 180px/.92 'Archivo Black',sans-serif;letter-spacing:-.015em;color:${CREAM};text-shadow:12px 12px 0 ${INK};white-space:nowrap}
#root #title-sub-wrap{display:block}
#root #title-sub{display:inline-block;font:600 50px/1 Inter,sans-serif;color:${CREAM};background:${INK};padding:14px 30px 16px;white-space:nowrap}
#root .title-cast{display:flex;gap:22px;margin-top:10px}
#root .title-cast-item{display:block}
#root .title-cast .badge{width:96px;height:96px;border-width:4px;box-shadow:6px 6px 0 ${INK}}
`;
  const tl = [
    `tl.fromTo('#title-split',{x:-60},{x:0,duration:${f(s.duration)},ease:'none'},0);`,
    `gsap.set('#title-word',{opacity:0,scale:2.4,y:-30});`,
    `tl.fromTo('#title-word',{opacity:0},{opacity:1,duration:${f(FRAME)},ease:'none',immediateRender:false},0);`,
    `tl.fromTo('#title-word',{scale:2.4,y:-30},{scale:1,y:0,duration:${f(land)},ease:'power3.in',immediateRender:false},0);`,
    `tl.set('#title-shake',{x:14,y:-7},${f(land)});tl.set('#title-shake',{x:-10,y:6},${f(land + FRAME)});tl.set('#title-shake',{x:0,y:0},${f(land + 2 * FRAME)});`,
    `tl.fromTo('#title-sub-wrap',{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:${f(7 * FRAME)},ease:'power3.out'},${f(land + 6 * FRAME)});`,
    ...cast.map((_, i) => `tl.fromTo('#title-cast-${i}',{opacity:0,scale:.3,y:24},{opacity:1,scale:1,y:0,duration:.45,ease:'back.out(2.2)'},${f(land + 0.42 + i * 0.07)});`),
  ];
  return { css, body: overlay('title-main', html, 0, s.duration), tl, mount: false, bg: MAGENTA };
}

function endScene(s) {
  const html = `<div id="end-shake" class="end-stack"><img id="end-emblem" class="end-emblem" src="${PTAH_EMBLEM}" alt="Ptah emblem"><strong id="end-title">Same agents. Two homes.</strong><span id="end-ptah" class="end-ptah">ptah.live</span><span id="end-t3" class="end-t3"><img src="${T3_LOGO}" alt="T3 Code logo"><em>T3 Code — t3.codes</em></span></div><small class="end-credit">Robot model: “cute robot” by victory_mirosya, CC BY 4.0 · Product logos belong to their owners</small>`;
  const css = `
#root .end-stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding-bottom:56px}
#root .end-emblem{width:250px;height:250px;object-fit:contain;display:block;margin-bottom:4px}
#root .end-stack strong{font:400 96px/1 'Archivo Black',sans-serif;letter-spacing:-.015em;color:${CREAM};text-shadow:6px 6px 0 #000;white-space:nowrap}
#root .end-ptah{font:800 64px/1 Inter,sans-serif;color:${AMBER};letter-spacing:.01em;margin-top:6px}
#root .end-t3{display:flex;align-items:center;gap:16px;font:600 40px/1 Inter,sans-serif;color:${CREAM};margin-top:8px}
#root .end-t3 img{width:48px;height:48px;display:block;border-radius:8px;box-shadow:0 0 0 2px rgba(255,246,229,.55)}
#root .end-t3 em{font-style:normal}
#root .end-credit{position:absolute;left:0;right:0;bottom:66px;text-align:center;font:500 28px Inter,sans-serif;color:#D8DDD9}
`;
  const land = 8 * FRAME;
  const bg = temple('endcard', s.duration);
  const tl = [
    bg.tl,
    `gsap.set('#end-emblem',{opacity:0,y:-220,scale:1.22});`,
    `tl.fromTo('#end-emblem',{opacity:0},{opacity:1,duration:${f(2 * FRAME)},ease:'none',immediateRender:false},0);`,
    `tl.fromTo('#end-emblem',{y:-220,scale:1.22},{y:0,scale:1,duration:${f(land)},ease:'power3.in',immediateRender:false},0);`,
    `tl.set('#end-shake',{x:0,y:9},${f(land)});tl.set('#end-shake',{x:0,y:-5},${f(land + FRAME)});tl.set('#end-shake',{x:0,y:0},${f(land + 2 * FRAME)});`,
    `tl.fromTo('#end-title',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.18,ease:'power2.out'},${f(land + 3 * FRAME)});`,
    `tl.fromTo('#end-ptah',{opacity:0,y:16},{opacity:1,y:0,duration:.2,ease:'power2.out'},${f(land + 9 * FRAME)});`,
    `tl.fromTo('#end-t3',{opacity:0,y:16},{opacity:1,y:0,duration:.2,ease:'power2.out'},${f(land + 13 * FRAME)});`,
  ];
  return { css: CSS_TEMPLE + css, body: bg.html + overlay('end-main', html, 0, s.duration), tl, mount: false, bg: TEAL };
}

const cast = Object.fromEntries(Object.keys(colors).map(a => [a, { color: colors[a], icon: a === 'Conductor' ? PTAH_EMBLEM : `assets/icons/${icons[a]}.png` }]));
function mountConfig(s) {
  const local = t => +(t - s.start).toFixed(3);
  const cfgRows = s.rows.map(k => {
    const r = row(k);
    const out = { row: k, speaker: r.speaker ?? null, start: r.start, duration: r.duration, localStart: local(r.start), kind: r.kind };
    if (r.speaker === 'All five') out.speakers = ALL_FIVE;
    out.words = (r.words || []).map(w => ({ word: w.word, start: local(r.start + w.start), end: local(r.start + w.end) }));
    return out;
  });
  const actions = {};
  for (const k of s.rows) for (const [n, t] of Object.entries(row(k).actions || {})) actions[actions[n] == null ? n : `${n}-${k}`] = local(t);
  const sfx = Object.entries(cues.sfx || {}).filter(([, v]) => s.rows.includes(String(v.row))).map(([id, v]) => ({ id, take: v.take, hit: local(v.hit), volume: v.volume }));
  const host = cfgRows.find(r => r.speaker && r.speaker !== 'All five')?.speaker ?? null;
  return { id: s.id, kind: s.kind, absoluteStart: s.start, duration: s.duration, clock: 'scene', host, rows: cfgRows, actions, sfx, cast };
}

function sceneFile(s) {
  const built = s.id === 'title' ? titleScene(s) : s.id === 'endcard' ? endScene(s) : threeScene(s);
  const { id, duration } = s;
  const h = house(id);
  const bg = built.bg || (h === 't3' ? '#E9ECF2' : h === 'ptah' ? '#163B47' : '#2A2F3A');
  const config = built.mount ? mountConfig(s) : null;
  s.config = config;
  return `<template>
<style>
#root{background:${bg}}${CSS}${built.css}</style>
<div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}" data-duration="${f(duration)}">${built.mount ? `<canvas id="${id}-canvas" width="${W}" height="${H}"></canvas>` : ''}${built.body}</div>
<script>
{ const tl=gsap.timeline({paused:true});
${built.tl.join('\n')}
window.__timelines=window.__timelines||{};
window.__timelines['${id}']=tl;
${built.mount ? `window.__hf=window.__hf||{};window.__hf.buildReady=window.__hf.buildReady||{};
window.__hf.buildReady['${id}']=window.TribunalReady.then(api=>api.mount(${JSON.stringify(config)},document.getElementById('${id}-canvas')));` : ''}
}
</script>
</template>
`;
}

// ---------- Captions (one composition on the captions track, 0 -> total) ----------
const capStyle = captions.style;
// Width estimate (px) for grouping only; the band is width:max-content, so the real text always fits.
const advance = (text, key) => {
  const size = key ? capStyle.keySize : capStyle.fontSize;
  let em = 0;
  for (const c of text) em += /[A-Z0-9]/.test(c) ? (key ? 0.8 : 0.7) : /[a-z]/.test(c) ? (key ? 0.66 : 0.57) : /[ilj'.,!?:;…]/.test(c) ? 0.3 : 0.6;
  return em * size;
};
const lineTokens = k => LINES.find(l => l.row === k).text.split(/\s+/).filter(Boolean);
function captionGroups() {
  const groups = [];
  for (const k of cues.timeline.map(x => String(x.row))) {
    if (!isSpoken(k)) continue;
    const spec = captions.lines[k];
    if (!spec) throw new Error(`src/captions.json has no line ${k}`);
    const r = row(k);
    const parts = spec.copy.split(/\s+/).filter(Boolean);
    const toks = []; let gi = 0;
    for (const p of parts) { if (p === '/') { gi++; continue; } toks.push({ group: gi, key: /^\*.*\*$/.test(p), text: p.replace(/^\*|\*$/g, '') }); }
    const verbatim = lineTokens(k);
    if (toks.map(t => t.text).join(' ') !== verbatim.join(' ')) throw new Error(`captions ${k}: copy "${toks.map(t => t.text).join(' ')}" is not the SPEC line "${verbatim.join(' ')}"`);
    let words = r.words;
    if (words.length !== toks.length) {
      console.warn(`captions ${k}: ${words.length} aligned words vs ${toks.length} tokens; spreading evenly`);
      const d = r.duration / toks.length;
      words = toks.map((_, i) => ({ start: i * d + 0.05, end: (i + 1) * d }));
    }
    for (const k2 of Object.keys(spec.emoji || {})) if (!toks[Number(k2)]) throw new Error(`captions ${k}: emoji index ${k2} is past the last word (${toks.length - 1})`);
    toks.forEach((t, i) => { t.i = i; t.t0 = r.start + words[i].start; t.t1 = r.start + words[i].end; t.emoji = spec.emoji?.[String(i)] || []; });
    // Split any group whose estimated text width runs past maxTextWidth (at the widest gap after punctuation).
    const byGroup = [];
    for (const t of toks) (byGroup[t.group] ||= []).push(t);
    for (const g of byGroup) {
      const queue = [g];
      while (queue.length) {
        const cur = queue.shift();
        const width = cur.reduce((a, t) => a + advance(t.text, t.key) + 0.26 * capStyle.fontSize + t.emoji.length * (capStyle.emojiSize + 4), 0);
        if (width <= capStyle.maxTextWidth || cur.length < 2) { groups.push({ row: k, speaker: r.speaker, toks: cur }); continue; }
        let best = 1, score = -1;
        for (let i = 1; i < cur.length; i++) {
          const s = (/[.,!?…]$/.test(cur[i - 1].text) ? 2 : 0) + (cur[i].t0 - cur[i - 1].t1) - Math.abs(i - cur.length / 2) * 0.05;
          if (s > score) { score = s; best = i; }
        }
        queue.unshift(cur.slice(0, best), cur.slice(best));
        console.warn(`captions ${k}: split a long group at "${cur[best].text}"`);
      }
    }
  }
  // Times: a row's first group slides in 0.15 s before its first word (never before its cut); later groups
  // swap in 0.08 s before their first word. Each group holds until the next starts, or 0.8 s after its last
  // word, never past the row's own shot.
  groups.forEach((g, n) => {
    const firstOfRow = n === 0 || groups[n - 1].row !== g.row;
    const scene = sceneOfRow[g.row];
    g.firstOfRow = firstOfRow;
    const t0 = g.toks[0].t0;
    g.start = firstOfRow ? Math.max(scene.start + 0.04, t0 - 0.15) : Math.min(t0, Math.max(t0 - 0.08, groups[n - 1].toks.at(-1).t1 + 0.02));
  });
  groups.forEach((g, n) => {
    const next = groups[n + 1];
    const scene = sceneOfRow[g.row];
    const lastEnd = g.toks.at(-1).t1;
    if (next && next.row === g.row) { g.end = next.start; g.continues = true; return; } // swap in place
    g.end = Math.max(Math.min(lastEnd + 0.8, scene.end - 0.02), lastEnd + 0.12);
    if (next) g.end = Math.min(g.end, next.start - 0.04);
    g.continues = false;
  });
  return groups;
}

// Icons and emoji in the captions are CSS backgrounds (one class per file), so the same file can recur
// across caption groups without tripping duplicate-media discovery.
const bgClass = src => 'bg-' + src.replace(/^assets\//, '').replace(/\.[a-z]+$/, '').replace(/[^a-z0-9]+/gi, '-');
function captionsFile() {
  const groups = captionGroups();
  const used = new Set();
  const bgi = src => { used.add(src); return bgClass(src); };
  const data = []; let html = '';
  groups.forEach((g, n) => {
    const gid = `cap-g${n}`;
    const sp = g.speaker;
    const all = sp === 'All five';
    const color = all ? CREAM : colors[sp];
    const chipName = all ? 'ALL FIVE' : sp.toUpperCase();
    const ico = a => `<i class="cap-ico${a === 'Conductor' ? ' dark' : ''}"><i class="${bgi(iconSrc(a))}"></i></i>`;
    const chipIcon = all ? `<span class="cap-stack">${ALL_FIVE.map(a => ico(a)).join('')}</span>` : ico(sp);
    const chip = `<span class="cap-chip${INV.has(sp) ? ' inv' : ''}" style="background:${color}">${chipIcon}<b>${chipName}</b></span>`;
    let words = '';
    const wd = [];
    for (const t of g.toks) {
      const wid = `${gid}-w${t.i}`;
      const inner = t.key
        ? `<span id="${wid}" class="cw key" data-layout-allow-overlap><i class="hl" style="background:${INV.has(sp) ? '#FFFFFF' : color}"></i><b>${esc(t.text)}</b></span>`
        : `<span id="${wid}" class="cw" data-layout-allow-overlap>${esc(t.text)}</span>`;
      const emo = t.emoji.length ? `<span class="cap-emo">${t.emoji.map((cp, e) => `<i id="${wid}-e${e}" class="${bgi(`assets/emoji/${cp}.svg`)}"></i>`).join('')}</span>` : '';
      words += `<span class="cwg">${inner}${emo}</span>`;
      const pop = t.t0 + Math.min(0.22, Math.max(0.08, (t.t1 - t.t0) * 0.6));
      wd.push([wid, +t.t0.toFixed(3), t.key ? 1 : 0, t.emoji.map((_, e) => +(pop + e * 0.09).toFixed(3))]);
    }
    html += `<div id="${gid}" class="cap-group" data-row="${g.row}"><div class="cap-band" data-layout-allow-overflow>${chip}<span class="cap-text">${words}</span></div></div>\n`;
    data.push([gid, +g.start.toFixed(3), +g.end.toFixed(3), g.firstOfRow ? 1 : 0, g.continues ? 1 : 0, INV.has(sp) ? '#111111' : INK, wd]);
  });
  const bgCss = [...used].map(src => `#root .${bgClass(src)}{background-image:url('${src}')}`).join('\n');
  const css = `
#root{background:transparent}
#root .cap-zone{position:absolute;inset:0;pointer-events:none}
#root .cap-group{position:absolute;left:0;right:0;bottom:112px;display:flex;justify-content:center;overflow:visible}
#root .cap-band{display:inline-flex;align-items:center;gap:22px;padding:12px 30px 13px 12px;background:rgba(14,11,9,.8);border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:1536px;box-sizing:border-box}
#root .cap-chip{display:inline-flex;align-items:center;gap:10px;padding:6px 18px 6px 6px;border-radius:999px;flex:none}
#root .cap-chip b{font:800 28px/1 Inter,sans-serif;letter-spacing:.06em;color:${INK}}
#root .cap-chip.inv{box-shadow:inset 0 0 0 3px #FFFFFF}
#root .cap-chip.inv b{color:#FFFFFF}
#root .cap-ico{display:block;position:relative;width:46px;height:46px;border-radius:50%;background:${CREAM};box-sizing:border-box;border:3px solid ${INK};flex:none}
#root .cap-ico > i{position:absolute;inset:16%;background-position:center;background-size:contain;background-repeat:no-repeat}
#root .cap-ico.dark{background:${INK}}
#root .cap-ico.dark > i{inset:3%}
#root .cap-stack{display:flex}
#root .cap-stack .cap-ico{margin-left:-14px}
#root .cap-stack .cap-ico:first-child{margin-left:0}
#root .cap-text{display:inline-flex;align-items:baseline;flex-wrap:nowrap;column-gap:.26em;font:700 ${capStyle.fontSize}px/1.2 Inter,sans-serif;color:${CREAM};white-space:nowrap}
#root .cwg{display:inline-flex;align-items:baseline;gap:.14em;white-space:nowrap}
#root .cw{position:relative;display:inline-block;white-space:nowrap;isolation:isolate}
#root .cw.key{font:400 ${capStyle.keySize}px/1.1 'Archivo Black',sans-serif;letter-spacing:-.005em;padding:0 .08em}
#root .cw .hl{position:absolute;left:-.06em;right:-.06em;top:.02em;bottom:-.04em;transform-origin:0 50%;border-radius:8px}
#root .cw b{position:relative;font-weight:inherit;color:${CREAM}}
#root .cap-emo{display:inline-flex;gap:2px;align-self:center}
#root .cap-emo > i{display:block;width:${capStyle.emojiSize}px;height:${capStyle.emojiSize}px;background-position:center;background-size:contain;background-repeat:no-repeat;transform-origin:50% 100%}
${bgCss}
`;
  // Tweens are built from data, one entry per caption group: [id, start, end, firstOfRow, continues, inkColour,
  // words: [id, onset, isKey, emojiPopTimes[]]]. Every word, highlighter and emoji element is in the HTML above.
  const script = `{ const tl=gsap.timeline({paused:true});
const G=${JSON.stringify(data)};
for (const [g,start,end,first,cont,ink,words] of G) {
  const el='#'+g;
  gsap.set(el,{opacity:0});
  if (first) tl.fromTo(el,{opacity:0,y:16},{opacity:1,y:0,duration:.14,ease:'power2.out',immediateRender:false},start);
  else tl.set(el,{opacity:1,y:0},start);
  for (const [w,t,key,emo] of words) {
    tl.fromTo('#'+w,{opacity:0,y:12},{opacity:1,y:0,duration:.12,ease:'power2.out'},t);
    if (key) {
      // A 3-frame swipe; the type flips to ink at its midpoint, so cream never sits on a filled swipe for more than
      // about one frame (cream on the swipe colours is under 3:1).
      tl.fromTo('#'+w+' .hl',{scaleX:0,skewX:-8},{scaleX:1,skewX:-8,duration:.1,ease:'power1.out'},t+.03);
      tl.fromTo('#'+w+' b',{color:'${CREAM}'},{color:ink,duration:.02,ease:'none'},t+.07);
    }
    emo.forEach((at,e)=>{
      const id='#'+w+'-e'+e, r0=e%2?14:-14;
      gsap.set(id,{opacity:0,scaleX:1.75,scaleY:.25,y:22,rotation:r0});
      tl.fromTo(id,{opacity:0},{opacity:1,duration:.04,ease:'none',immediateRender:false},at);
      tl.fromTo(id,{scaleX:1.75,scaleY:.25,y:22,rotation:r0},{scaleX:1,scaleY:1,y:0,rotation:e%2?4:-4,duration:.5,ease:'elastic.out(1,0.42)',immediateRender:false},at);
    });
  }
  if (!cont) tl.to(el,{opacity:0,duration:.12,ease:'power2.in'},end-.12);
  tl.set(el,{opacity:0,visibility:'hidden'},end);
}
window.__timelines=window.__timelines||{};
window.__timelines['captions']=tl;
}`;
  const file = `<template>
<style>${CSS}${css}</style>
<div id="root" data-composition-id="captions" data-width="${W}" data-height="${H}" data-duration="${f(total)}"><div class="cap-zone">
${html}</div></div>
<script>
${script}
</script>
</template>
`;
  return { file, groups };
}

// ---------- Audio ----------
const audioSrc = file => `assets/audio/${esc(String(file || '').replaceAll('\\', '/').replace(/^assets\/audio\//, ''))}`;
// One master bus: +0.8 dB of make-up (the measured mix sits at -16.4 LUFS without it; scripts/audio/measure-mix.mjs)
// into a true-peak ceiling (SFX that land on words can sum past 0 dBFS).
const MASTER_GAIN_DB = 0.8;
const MASTER_CHAIN = JSON.stringify({ version: 1, nodes: [{ type: 'gain', id: 'n0', label: 'Make-up', params: { gain: MASTER_GAIN_DB } }, { type: 'limiter', id: 'n1', label: 'Ceiling', params: { limit: -1.5, attack: 2, release: 80, level_out: 0 } }] });
let audios = '';
if (!PLACEHOLDER) {
  audios += `<hf-audio-group id="master" data-label="Master" data-volume="1" data-fx-chain="${MASTER_CHAIN.replaceAll('"', '&quot;')}"></hf-audio-group>\n`;
  const lanes = {};
  const lane = (group, first, start, dur) => {
    const ends = lanes[group] ||= [];
    let i = ends.findIndex(e => e <= start + 1e-6);
    if (i < 0) { i = ends.length; ends.push(0); }
    ends[i] = start + dur;
    return first + i;
  };
  const voiceClips = Object.entries(cues.voices).map(([id, v]) => ({ id, v, start: row(v.row).start, dur: v.duration })).sort((a, b) => a.start - b.start);
  for (const { id, v, start, dur } of voiceClips) {
    audios += `<audio id="${esc(id)}" class="clip" src="${audioSrc(v.file)}" data-start="${f(start)}" data-duration="${f(dur)}" data-track-index="${lane('vo', 31, start, dur)}" data-volume="1" data-audio-group="master"></audio>\n`;
  }
  const sfxClips = Object.entries(cues.sfx).map(([id, v]) => ({ id, v, start: v.start, dur: v.duration })).sort((a, b) => a.start - b.start);
  for (const { id, v, start, dur } of sfxClips) {
    audios += `<audio id="${esc(id)}" class="clip" src="${audioSrc(v.file)}" data-start="${f(start)}" data-duration="${f(dur)}" data-track-index="${lane('sfx', 34, start, dur)}" data-volume="${v.volume}" data-audio-group="master"></audio>\n`;
  }
  const music = cues.music;
  if (music?.file) audios += `<audio id="music-bed" class="clip" src="${audioSrc(music.file)}" data-start="0" data-duration="${f(Math.min(total, music.duration))}" data-track-index="30" data-volume="${music.volume}" data-audio-group="master"></audio>\n`;
}

// ---------- Write (temp files first, then rename) ----------
const outputs = [];
for (const s of scenes) outputs.push([path.join(base, 'compositions', `${s.id}.html`), sceneFile(s)]);
const cap = captionsFile();
outputs.push([path.join(base, 'compositions', 'captions.html'), cap.file]);
const hosts = scenes.map((s, i) => `<div id="${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${f(s.start)}" data-duration="${f(s.duration)}" data-track-index="${i + 1}" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`).join('\n');
const capHost = `<div id="captions" class="clip" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${f(total)}" data-track-index="${scenes.length + 1}" data-track-kind="captions" data-width="${W}" data-height="${H}" style="z-index:10"></div>`;
const rootHtml = `<!doctype html><html lang="en" data-composition-variables='[{"id":"title","type":"string","label":"Title","default":"AGENT CRIBS"}]'><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Agent Cribs</title><script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script><script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script><script>window.__tribunalEnvelopes=${JSON.stringify(envelopeByRow)};window.TribunalReady=new Promise(resolve=>window.__tribunalResolve=resolve);window.__hf=window.__hf||{};window.__hf.buildReady=window.__hf.buildReady||{};</script><script type="module" src="src/scene.js"></script></head><body style="margin:0;background:${INK}"><div id="root" data-composition-id="main" data-start="0" data-duration="${f(total)}" data-width="${W}" data-height="${H}">\n${hosts}\n${capHost}\n${audios}</div><script>window.__timelines=window.__timelines||{};window.__timelines['main']=gsap.timeline({paused:true});</script></body></html>`;
outputs.push([path.join(base, 'index.html'), rootHtml]);
const timing = {
  fps: FPS, total, placeholder: !!cues.placeholder, source: PLACEHOLDER ? 'placeholder (0.35 s/word + 0.6 s)' : 'cues.json',
  rows: Object.fromEntries(cues.timeline.map(x => [x.row, { start: x.start, duration: x.duration, speaker: x.speaker ?? null, scene: x.scene, actions: x.actions || {} }])),
  scenes: scenes.map(s => ({ id: s.id, kind: s.kind, rows: s.rows, start: s.start, duration: s.duration })),
  captions: cap.groups.map(g => ({ row: g.row, start: +g.start.toFixed(3), end: +g.end.toFixed(3), text: g.toks.map(t => t.text).join(' ') })),
};
outputs.push([path.join(base, 'src/timing.json'), JSON.stringify(timing, null, 2)]);
fs.mkdirSync(path.join(base, 'compositions'), { recursive: true });
for (const [file, text] of outputs) fs.writeFileSync(`${file}.tmp`, text);
for (const [file] of outputs) fs.renameSync(`${file}.tmp`, file);
// Remove Episode 1 compositions this generator does not own.
const keep = new Set([...scenes.map(s => `${s.id}.html`), 'captions.html']);
for (const file of fs.readdirSync(path.join(base, 'compositions'))) if (file.endsWith('.html') && !keep.has(file)) fs.unlinkSync(path.join(base, 'compositions', file));

console.log(`Timing: ${timing.source}; ${total}s; ${scenes.length} scenes; ${cap.groups.length} caption groups`);
for (const s of scenes) console.log(`  ${s.id.padEnd(20)} ${s.kind.padEnd(20)} ${f(s.start)} +${f(s.duration)}  ${s.rows.join(',')}`);
