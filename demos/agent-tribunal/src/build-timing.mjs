// Generator for The Tribunal (SPEC.md, Revision 2). Source of truth for index.html,
// compositions/*.html and src/timing.json; never hand-edit those generated files.
//
// Inputs: assets/audio/cues.json (timeline, voices with word timings, SFX, music; written by
// scripts/audio/generate.mjs), src/bubbles.json (booth speech-bubble copy), assets/icons/<id>.svg.
// Usage: node src/build-timing.mjs
import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '..');
const read = f => JSON.parse(fs.readFileSync(path.join(base, f), 'utf8'));
const cues = read('assets/audio/cues.json');
const bubbles = read('src/bubbles.json');
if (!Array.isArray(cues.order)) throw new Error('cues.json has no Revision 2 running order; run scripts/audio/generate.mjs first');

const FPS = 30, FRAME = 1 / FPS;
const W = 1920, H = 1080;
const INK = '#1A1410', CREAM = '#FFF6E5', AMBER = '#E8A33D', TEAL = '#0F2A33';
const colors = { Claude: '#D97757', Codex: '#10A37F', Cursor: '#8C8CFF', Antigravity: '#4F8BF5', OpenCode: '#111111', Conductor: '#E8A33D' };
const icons = { Claude: 'claude', Codex: 'codex', Cursor: 'cursor', Antigravity: 'antigravity', OpenCode: 'opencode', Conductor: 'ptah' };
const LIGHT = new Set(['Cursor']); // agent colour too light for cream text
const INV = new Set(['OpenCode']); // black-and-white brand: white type, white plate border, label-style key words
const PTAH_EMBLEM = 'assets/brand/ptah-emblem-gold.png';
const taglines = { Claude: 'Has a plan', Codex: 'Already merged it', Cursor: 'Finishes your sentences', Antigravity: 'Opened a browser', OpenCode: 'Objects' };

// Scenes in running order: [id, rows, agent].
const SCENES = [
  ['intro', ['intro']],
  ['punch-claude', ['P1'], 'Claude'], ['punch-cursor', ['P2'], 'Cursor'], ['punch-antigravity', ['P3'], 'Antigravity'],
  ['punch-opencode', ['P4'], 'OpenCode'], ['punch-codex', ['P5'], 'Codex'], ['punch-conductor', ['P6'], 'Conductor'],
  ['title', [2]],
  ['table-1', [3, 4, 5, 6]], ['booth-claude', [7], 'Claude'], ['table-2', [8, 9, 10]], ['booth-opencode', [11], 'OpenCode'],
  ['booth-codex', [1], 'Codex'], ['table-3', [12, 13, 14]], ['booth-cursor', [15], 'Cursor'], ['booth-antigravity', [16], 'Antigravity'],
  ['table-chaos', [17]], ['table-verdict', [18, 19, 20]], ['booth-codex-tag', [21], 'Codex'], ['endcard', [22]],
];
// Files this generator used to write and no longer does.
const RETIRED = ['booth-codex-open'];

// ---------- Timing ----------
const rows = Object.fromEntries(cues.timeline.map(x => [String(x.row), x]));
const row = k => { const r = rows[String(k)]; if (!r) throw new Error(`cues.json timeline has no row ${k}`); return r; };
const total = +Number(cues.total).toFixed(3);
const scenes = SCENES.map(([id, nums, agent], i) => ({ id, nums: nums.map(String), agent: agent || null, start: row(nums[0]).start }));
// Scenes are contiguous: each runs until the next one starts, so the 0.25 s gaps between lines hold the
// outgoing shot instead of flashing the empty root. The last scene runs to the end of the video.
scenes.forEach((s, i) => { s.end = i + 1 < scenes.length ? scenes[i + 1].start : total; s.duration = +(s.end - s.start).toFixed(3); });
const timingRows = Object.fromEntries(cues.timeline.map(x => [String(x.row), { start: x.start, duration: x.duration, speaker: x.speaker ?? null, ...(x.impact != null ? { impact: x.impact, word: x.word } : {}) }]));
const timing = { fps: FPS, total, order: cues.order.map(String), rows: timingRows, scenes: scenes.map(({ id, nums, agent, start, duration }) => ({ id, nums, agent, start, duration })), source: 'cues.json' };

const voiceByRow = {};
for (const [id, v] of Object.entries(cues.voices || {})) voiceByRow[String(v.row)] = { id, ...v };
const envelopeByRow = {};
for (const v of Object.values(cues.voices || {})) if (Array.isArray(v.envelope)) envelopeByRow[String(v.row)] = v.envelope;

// ---------- Helpers ----------
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const f = n => Number(n).toFixed(3);
const overlay = (id, html, at, dur, extra = '') => `<div id="${id}" class="clip overlay" data-start="${f(at)}" data-duration="${f(dur)}"${extra}><div class="inner">${html}</div></div>`;
const iconSrc = agent => agent === 'Conductor' ? PTAH_EMBLEM : `assets/icons/${icons[agent]}.svg`;
// The Conductor's Ptah mark is a thin gold ring: it sits on an ink disc so it reads (cream would wash it out).
const badge = (agent, cls = 'badge') => `<span class="${cls}${agent === 'Conductor' ? ' dark' : ''}"><img src="${iconSrc(agent)}" alt="${esc(agent)} logo"></span>`;

// Shared styles (kept in every scene so each file renders standalone).
const CSS = `
#root{position:absolute;inset:0;overflow:hidden}
#root canvas{width:100%;height:100%;display:block}
#root .overlay{position:absolute;inset:0;z-index:3;pointer-events:none;color:${CREAM};font-family:'Archivo Black',sans-serif}
#root .inner{position:absolute;inset:0}
#root .badge{display:flex;align-items:center;justify-content:center;border-radius:50%;background:${CREAM};border:5px solid ${INK};box-sizing:border-box;box-shadow:6px 6px 0 ${INK}}
#root .badge img{width:62%;height:62%;object-fit:contain;display:block}
#root .badge.dark{background:${INK};border-color:${INK}}
#root .badge.dark img{width:86%;height:86%}
`;
const CSS_STRAP = `
#root .strap{position:absolute;left:120px;bottom:134px;width:650px;height:64px;transform:skewX(-6deg);padding:4px 38px 4px 112px;box-sizing:border-box}
#root .strap b{font-size:44px;line-height:56px;display:block;transform:skewX(6deg);text-shadow:3px 3px 0 rgba(26,20,16,.55)}
#root .strap.light b{color:${INK};text-shadow:none}
#root .strap.inv b{color:#FFFFFF;text-shadow:none}
#root .tagline{position:absolute;left:236px;bottom:80px;font:600 26px Inter,sans-serif;background:${INK};color:${CREAM};padding:5px 14px 6px;line-height:1.1}
#root .strap-badge{position:absolute;left:104px;bottom:110px;width:112px;height:112px}
#root .strap-badge .badge{width:100%;height:100%}
`;
const CSS_BUBBLE = `
#root .bubble-zone{position:absolute;left:1000px;right:64px;top:96px;height:660px;display:flex;align-items:center}
#root .bubble{position:absolute;left:24px;width:max-content;transform-origin:-92px calc(50% + 68px)}
#root .bubble .body{position:relative;background:${CREAM};color:${INK};border:5px solid ${INK};border-radius:46px;box-shadow:8px 8px 0 ${INK};padding:30px 40px 32px;box-sizing:border-box}
#root .bubble .tail,#root .bubble .tail-shadow{position:absolute;left:-100px;top:calc(50% - 46px);width:118px;height:120px;overflow:visible}
#root .bubble .text{position:relative;display:flex;flex-direction:column;align-items:flex-start;row-gap:2px;font:700 var(--fs,48px)/1.16 Inter,sans-serif;letter-spacing:-.01em}
#root .bubble .ln{display:flex;align-items:baseline;column-gap:.26em;white-space:nowrap}
#root .bubble .wg{display:inline-flex;align-items:baseline;white-space:nowrap;gap:.16em}
#root .bubble .w{position:relative;display:inline-block;white-space:nowrap;transform-origin:50% 80%;isolation:isolate}
#root .bubble .w.key{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:var(--ks,54px);letter-spacing:-.015em;line-height:1.08}
#root .bubble .w .hl{position:absolute;left:-.12em;right:-.12em;bottom:.06em;height:.42em;transform-origin:0 50%;border-radius:3px}
#root .bubble .w b{position:relative;font-weight:inherit}
#root .bubble.inv .w .hl{top:.02em;bottom:-.02em;height:auto;left:-.14em;right:-.14em;border-radius:7px}
#root .bubble.inv .w.key b{color:#FFFFFF}
#root .bubble .emo{display:inline-flex;gap:2px;align-self:center}
#root .bubble .emo img{width:var(--es,66px);height:var(--es,66px);display:block;transform-origin:50% 100%}
`;

// Comic tail: the fill reaches 12 px into the bubble (covering its border where the tail joins); the
// two outer edges are stroked; the shadow copy sits behind the bubble, offset 8 px like the bubble's.
// Target line width (px, estimated from character counts) for bubble line breaks.
const LINE_MAX = 760;
const TAIL_FILL = 'M116 34 L102.5 36 C78 46 44 80 8 112 C50 98 80 90 102.5 84 L116 86 Z';
const TAIL_EDGE = 'M102.5 36 C78 46 44 80 8 112 C50 98 80 90 102.5 84';
const TAIL_SHADOW = `<svg class="tail-shadow" viewBox="0 0 118 120" aria-hidden="true"><path d="${TAIL_FILL}" transform="translate(8 8)" fill="${INK}"/></svg>`;
const TAIL = `<svg class="tail" viewBox="0 0 118 120" aria-hidden="true"><path d="${TAIL_FILL}" fill="${CREAM}"/><path d="${TAIL_EDGE}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

// ---------- Booth speech bubbles ----------
function bubbleFor(scene) {
  const line = Object.entries(bubbles.lines).find(([, l]) => l.scene === scene.id);
  if (!line) return { html: '', tweens: [] };
  const [rowKey, spec] = line;
  const r = row(rowKey), v = voiceByRow[rowKey];
  const local = t => t + (r.start - scene.start);
  const tokens = spec.copy.split(/\s+/).filter(Boolean).map(t => ({ key: /^\*.*\*$/.test(t), text: t.replace(/^\*|\*$/g, '') }));
  // Word timings by position; fall back to an even spread if the alignment does not match the copy.
  let words = Array.isArray(v?.words) ? v.words : [];
  if (words.length !== tokens.length) {
    console.warn(`bubble ${scene.id}: ${words.length} aligned words vs ${tokens.length} tokens; spreading evenly`);
    const d = (v?.duration || r.duration) / tokens.length;
    words = tokens.map((_, i) => ({ start: i * d + 0.05, end: (i + 1) * d }));
  }
  const style = { ...bubbles.style, ...(spec.style || {}) };
  const color = colors[scene.agent];
  const pages = spec.pages.map((startIdx, p) => ({ p, from: startIdx, to: (spec.pages[p + 1] ?? tokens.length) - 1 }));
  const lineEnd = local(v?.duration ?? r.duration);
  const sceneDur = scene.duration;
  const id = scene.id;
  const tw = [];
  let html = '';
  pages.forEach(pg => {
    const first = words[pg.from], last = words[pg.to];
    const tIn = Math.max(0.03, local(first.start) - (pg.p === 0 ? 0.2 : 0.12));
    const next = pages[pg.p + 1];
    const tOut = next ? Math.max(local(last.end) + 0.05, Math.max(0.03, local(words[next.from].start) - 0.12) - 0.13) : Math.min(sceneDur - 0.16, Math.max(lineEnd + 0.2, local(last.end) + 0.5));
    pg.tIn = tIn; pg.tOut = tOut;
    const tilt = [-2.2, 1.6, -1.2][pg.p % 3];
    // Lines are broken here (estimated widths) and the bubble is width:max-content, so every page is
    // sized to its own final text from its first frame and no word moves as later words appear.
    const lines = [[]]; let lineW = 0, breakNext = false;
    let words_html = '';
    for (let i = pg.from; i <= pg.to; i++) {
      const tok = tokens[i];
      const wid = `${id}-w${i}`;
      const emoN = (spec.emoji?.[String(i)] || []).length;
      const estW = tok.text.length * (tok.key ? 0.6 * style.keySize : 0.5 * style.fontSize) + (emoN ? emoN * (style.emojiSize + 2) + 0.16 * style.fontSize : 0);
      const gap = 0.26 * style.fontSize;
      if (lines.at(-1).length && (breakNext || lineW + gap + estW > LINE_MAX)) { lines.push([]); lineW = 0; }
      lineW += (lines.at(-1).length ? gap : 0) + estW;
      breakNext = /[.!?]$/.test(tok.text) && lineW > LINE_MAX * 0.45;
      words_html = '';
      words_html += '<span class="wg">' + (tok.key
        ? `<span id="${wid}" class="w key" data-layout-allow-overlap><i id="${id}-hl${i}" class="hl" style="background:${color}"></i><b data-layout-allow-overlap>${esc(tok.text)}</b></span>`
        : `<span id="${wid}" class="w" data-layout-allow-overlap>${esc(tok.text)}</span>`);
      const ws = local(words[i].start);
      tw.push(`tl.fromTo('#${wid}',{opacity:0,y:16,scale:.72},{opacity:1,y:0,scale:1,duration:.15,ease:'back.out(2.2)'},${f(ws)});`);
      if (tok.key && !INV.has(scene.agent)) tw.push(`tl.fromTo('#${id}-hl${i}',{scaleX:0,skewX:-8},{scaleX:1,skewX:-8,duration:.2,ease:'power2.out'},${f(ws + 0.06)});`);
      const emo = spec.emoji?.[String(i)];
      if (emo) {
        const at = local(words[i].start) + Math.min(0.22, Math.max(0.08, (words[i].end - words[i].start) * 0.6));
        words_html += `<span class="emo">${emo.map((cp, k) => `<img id="${id}-e${i}-${k}" src="assets/emoji/${cp}.svg" alt="">`).join('')}</span>`;
        emo.forEach((cp, k) => {
          const t = at + k * 0.09;
          const r0 = k % 2 ? 14 : -14;
          tw.push(`gsap.set('#${id}-e${i}-${k}',{opacity:0,scaleX:1.75,scaleY:.25,y:26,rotation:${r0}});`);
          tw.push(`tl.fromTo('#${id}-e${i}-${k}',{opacity:0},{opacity:1,duration:.04,ease:'none',immediateRender:false},${f(t)});`);
          tw.push(`tl.fromTo('#${id}-e${i}-${k}',{scaleX:1.75,scaleY:.25,y:26,rotation:${r0}},{scaleX:1,scaleY:1,y:0,rotation:${k % 2 ? 4 : -4},duration:.5,ease:'elastic.out(1,0.42)',immediateRender:false},${f(t)});`);
        });
      }
      words_html += '</span>';
      lines.at(-1).push(words_html);
    }
    const text = lines.map(l => `<div class="ln">${l.join('')}</div>`).join('');
    html += `<div id="${id}-bub${pg.p}" class="bubble${INV.has(scene.agent) ? ' inv' : ''}" data-layout-allow-overflow data-layout-allow-overlap>${TAIL_SHADOW}<div class="body"><div class="text">${text}</div></div>${TAIL}</div>`;
    tw.push(`gsap.set('#${id}-bub${pg.p}',{opacity:0,scale:.18,rotation:${tilt - 9}});`);
    tw.push(`tl.fromTo('#${id}-bub${pg.p}',{opacity:0},{opacity:1,duration:.05,ease:'none',immediateRender:false},${f(tIn)});`);
    tw.push(`tl.fromTo('#${id}-bub${pg.p}',{scale:.18,rotation:${tilt - 9}},{scale:1,rotation:${tilt},duration:.55,ease:'elastic.out(1,0.55)',immediateRender:false},${f(tIn)});`);
    tw.push(`tl.fromTo('#${id}-bub${pg.p}',{scale:1,opacity:1},{scale:.2,opacity:0,duration:.12,ease:'power3.in',immediateRender:false},${f(tOut)});`);
  });
  const styleVars = `--fs:${style.fontSize}px;--ks:${style.keySize}px;--es:${style.emojiSize}px`;
  return { html: overlay(`${id}-bubbles`, `<div class="bubble-zone" style="${styleVars}">${html}</div>`, 0, sceneDur), tweens: tw, pages, tokens, words: words.map(w => ({ ...w })) };
}

// Ptah's temple (cover crop centred on the throne) under a dark shade so type keeps >= 4.5:1. The image
// pushes in very slowly; the type sits in separate layers and never moves with it.
const CSS_TEMPLE = `
#root .temple{position:absolute;inset:0;overflow:hidden;z-index:0}
#root .temple-img{position:absolute;left:0;top:0;width:${W}px;height:${H}px;object-fit:cover;transform-origin:50% 48%}
#root .temple-shade{position:absolute;inset:0;background:radial-gradient(ellipse 70% 72% at 50% 50%,rgba(5,8,9,.64) 0%,rgba(5,8,9,.74) 58%,rgba(3,5,6,.9) 100%)}
`;
const temple = (id, dur) => ({
  html: `<div class="temple"><img id="${id}-temple" class="temple-img" src="assets/backgrounds/temple-16x9.jpg" alt=""><div class="temple-shade"></div></div>`,
  tl: `tl.fromTo('#${id}-temple',{scale:1},{scale:1.035,duration:${f(dur)},ease:'none'},0);`,
});

// ---------- Scene files ----------
function boothScene(s) {
  const { id, agent, duration } = s;
  const strap = overlay(`${id}-lower`, `<div class="strap${LIGHT.has(agent) ? ' light' : ''}${INV.has(agent) ? ' inv' : ''}" style="background:${colors[agent]}"><b>${agent}</b></div><div class="tagline">${taglines[agent]}</div><div id="${id}-badge" class="strap-badge">${badge(agent)}</div>`, 0.18, Math.max(0.2, duration - 0.18));
  const bub = bubbleFor(s);
  const tl = [
    `tl.fromTo('#${id}-lower .inner',{x:-950},{x:0,duration:8/30,ease:'expo.out'},.18);`,
    `tl.fromTo('#${id}-badge',{scale:.4,rotation:-40},{scale:1,rotation:-6,duration:.5,ease:'elastic.out(1,0.5)'},${f(0.18 + 6 / 30)});`,
    `tl.to('#${id}-lower .inner',{x:-950,duration:6/30,ease:'power2.in'},${f(duration - 0.2)});`,
    ...bub.tweens,
  ];
  return { css: CSS_STRAP + CSS_BUBBLE, body: strap + bub.html, tl, mount: true, kind: 'booth', bubble: bub };
}

function punchScene(s) {
  const { id, agent } = s;
  const r = row(s.nums[0]);
  const impact = r.impact - s.start;
  const word = r.word;
  // Archivo Black cap advances (em), measured roughly; sizes the word to the right 40 % of the frame.
  const adv = { A: .8, B: .78, C: .76, D: .8, E: .68, G: .8, I: .38, J: .62, L: .64, M: .98, N: .82, O: .82, P: .74, R: .78, S: .72, T: .7, U: .8, W: 1.1, '!': .36, '.': .32 };
  const lines = word === 'AUTOCOMPLETE!' ? ['AUTO-', 'COMPLETE!'] : [word];
  const em = Math.max(...lines.map(l => [...l].reduce((a, c) => a + (adv[c] ?? .75), 0)));
  const size = Math.min(190, Math.floor(700 / em));
  const html = `<div class="punch-zone"><div id="${id}-group" class="punch-group"><div id="${id}-plate" class="punch-plate${INV.has(agent) ? ' inv' : ''}" style="background:${colors[agent]}"><div class="punch-word" style="font-size:${size}px">${lines.map(l => `<span data-layout-allow-overlap>${esc(l)}</span>`).join('')}</div></div><div id="${id}-tag" class="punch-tag" data-layout-allow-overlap>${badge(agent)}<em data-layout-allow-overlap>${esc(agent.toUpperCase())}</em></div></div></div>`;
  const css = `
#root .punch-zone{position:absolute;left:1010px;right:70px;top:150px;bottom:190px;display:flex;align-items:center;justify-content:center}
#root .punch-group{position:relative}
#root .punch-plate{position:relative;border:7px solid ${INK};box-shadow:14px 14px 0 ${INK};padding:26px 40px 30px;transform:rotate(-4deg)}
#root .punch-plate.inv{border-color:#FFFFFF}
#root .punch-plate.inv .punch-word{color:#FFFFFF}
#root .punch-word{display:flex;flex-direction:column;align-items:center;font-family:'Archivo Black',sans-serif;line-height:.92;letter-spacing:-.02em;color:${CREAM};-webkit-text-stroke:12px ${INK};paint-order:stroke fill;text-shadow:7px 8px 0 ${INK};white-space:nowrap}
#root .punch-tag{position:absolute;left:-46px;top:-108px;display:flex;align-items:center;gap:0}
#root .punch-tag .badge{width:118px;height:118px;position:relative;z-index:1}
#root .punch-tag em{background:${INK};font:900 30px Inter,sans-serif;font-style:normal;letter-spacing:.04em;color:${CREAM};padding:8px 18px 8px 26px;margin-left:-16px;border:4px solid ${INK};box-shadow:5px 5px 0 ${INK}}
`;
  const slamAt = Math.max(FRAME, impact - 3 * FRAME);
  const tl = [
    // Slam: 3 frames from huge to landed, accelerating into the impact frame, then a 2-frame shake.
    `gsap.set('#${id}-group',{opacity:0,scale:2.7,rotation:-14,x:120,y:-40});`,
    `tl.fromTo('#${id}-group',{opacity:0},{opacity:1,duration:${f(FRAME)},ease:'none',immediateRender:false},${f(slamAt)});`,
    `tl.fromTo('#${id}-group',{scale:2.7,rotation:-14,x:120,y:-40},{scale:1,rotation:0,x:0,y:0,duration:${f(impact - slamAt)},ease:'power3.in',immediateRender:false},${f(slamAt)});`,
    `tl.set('#${id}-group',{x:16,y:-9},${f(impact)});`,
    `tl.set('#${id}-group',{x:-12,y:7},${f(impact + FRAME)});`,
    `tl.set('#${id}-group',{x:0,y:0},${f(impact + 2 * FRAME)});`,
    `tl.fromTo('#${id}-tag',{scale:0,rotation:-30},{scale:1,rotation:-8,duration:.45,ease:'elastic.out(1,0.5)'},${f(impact + 2 * FRAME)});`,
  ];
  return { css, body: overlay(`${id}-word`, html, 0, s.duration), tl, mount: true, kind: 'punch' };
}

function introScene(s) {
  const r = row('intro');
  const [a, b] = r.cards;
  const id = s.id;
  const A1 = 'A DAY IN THE LIFE';
  const split = (text, cls, prefix) => [...text].map((c, i) => c === ' ' ? `<span class="sp"> </span>` : `<span id="${prefix}${i}" class="${cls}">${esc(c)}</span>`).join('');
  const html_a = `<div class="intro-a"><div id="intro-a1" class="ia-1">${split(A1, 'ch', 'intro-a1-')}</div><div class="ia-2"><span id="intro-a2-0">of</span> <span id="intro-a2-1">a</span> <span id="intro-a2-2">developer</span><span class="dots"><i id="intro-d0">.</i><i id="intro-d1">.</i><i id="intro-d2">.</i></span></div></div>`;
  const html_b = `<div class="intro-b"><div class="ib-1"><span id="intro-b1-0">…who</span> <span id="intro-b1-1">asked</span></div><div class="ib-2">${split('FIVE AI AGENTS', 'ch', 'intro-c')}</div><div class="ib-3"><span id="intro-b3-0">one</span> <span id="intro-b3-1">question.</span></div></div>`;
  const css = `
#root .intro-a{position:absolute;left:150px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:26px}
#root .ia-1{font:400 124px/1 'Archivo Black',sans-serif;color:${CREAM};letter-spacing:-.01em;white-space:nowrap}
#root .ia-1 .ch{display:inline-block}
#root .ia-1 .sp{display:inline-block;width:.26em}
#root .ia-2{font:700 84px/1.05 Inter,sans-serif;color:${CREAM};white-space:nowrap}
#root .ia-2 span{display:inline-block;transform-origin:50% 100%}
#root .ia-2 .dots i{display:inline-block;font-style:normal;color:${AMBER}}
#root .intro-b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center}
#root .ib-1,#root .ib-3{font:700 78px/1.05 Inter,sans-serif;color:${CREAM};white-space:nowrap}
#root .ib-1 span,#root .ib-3 span{display:inline-block}
#root .ib-2{font:400 176px/1 'Archivo Black',sans-serif;color:${AMBER};letter-spacing:-.02em;text-shadow:8px 8px 0 #07181E;white-space:nowrap}
#root .ib-2 .ch{display:inline-block;transform-origin:50% 90%}
#root .ib-2 .sp{display:inline-block;width:.28em}
`;
  const at = b.start; // card B starts at its cut
  const tl = [
    // Card A: the headline is readable on frame 0 and tracks in; "of a developer" drops in word by word;
    // the ellipsis ticks in amber.
    ...[...A1].map((c, i) => c === ' ' ? '' : `tl.to('#intro-a1-${i}',{keyframes:[{color:'${AMBER}',duration:.05,ease:'none'},{color:'${CREAM}',duration:.18,ease:'none'}]},${f(0.12 + i * FRAME)});`).filter(Boolean),
    ...[0, 1, 2].map(i => `gsap.set('#intro-a2-${i}',{opacity:0,y:-70,scaleX:1,scaleY:1.25});tl.fromTo('#intro-a2-${i}',{opacity:0,y:-70,scaleX:1,scaleY:1.25},{opacity:1,y:0,scaleY:.78,scaleX:1.18,duration:.22,ease:'power3.in',immediateRender:false},${f(0.28 + i * 0.12)});tl.fromTo('#intro-a2-${i}',{scaleX:1.18,scaleY:.78},{scaleX:1,scaleY:1,duration:.3,ease:'elastic.out(1,0.5)',immediateRender:false},${f(0.5 + i * 0.12)});`),
    ...[0, 1, 2].map(i => `tl.fromTo('#intro-d${i}',{opacity:0,y:-18},{opacity:1,y:0,duration:.12,ease:'back.out(3)'},${f(0.98 + i * 0.13)});`),
    // Card B (hard cut): "...who asked" is there on the cut; FIVE AI AGENTS stamps in letter by letter,
    // one frame apart; "one question." lands word by word.
    `tl.fromTo('#intro-b1-1',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.13,ease:'power2.out'},${f(at + 0.08)});`,
    ...[...'FIVE AI AGENTS'].map((c, i) => c === ' ' ? '' : `tl.fromTo('#intro-c${i}',{opacity:0,scale:2.6,y:-40,rotation:${((i % 3) - 1) * 9}},{opacity:1,scale:1,y:0,rotation:0,duration:${f(4 * FRAME)},ease:'power3.in'},${f(at + 0.2 + i * FRAME)});`).filter(Boolean),
    `tl.fromTo('#intro-b3-0',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.13,ease:'power2.out'},${f(at + 0.86)});`,
    `tl.fromTo('#intro-b3-1',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.13,ease:'power2.out'},${f(at + 0.95)});`,
  ];
  // A two-frame shake when the last letter of AGENTS lands.
  const land = at + 0.2 + 13 * FRAME + 4 * FRAME;
  tl.push(`tl.set('#intro-b-shake',{x:10,y:-6},${f(land)});tl.set('#intro-b-shake',{x:-8,y:4},${f(land + FRAME)});tl.set('#intro-b-shake',{x:0,y:0},${f(land + 2 * FRAME)});`);
  const bg = temple('intro', s.duration);
  tl.unshift(bg.tl);
  const body = bg.html + overlay('intro-card-a', html_a, a.start, a.duration)
    + overlay('intro-card-b', `<div id="intro-b-shake" class="inner">${html_b}</div>`, b.start, s.duration - b.start);
  return { css: CSS_TEMPLE + css, body, tl, mount: false, bg: TEAL };
}

function titleScene(s) {
  const cast = ['Claude', 'Codex', 'Cursor', 'Antigravity', 'OpenCode', 'Conductor'];
  const html = `<div class="title-stack"><div id="title-shake"><strong id="title-word" data-var-text="title">THE TRIBUNAL</strong></div><small id="title-sub">Episode 1: Remotion or HyperFrames?</small><div class="title-cast">${cast.map((a, i) => `<span id="title-cast-${i}" class="title-cast-item">${badge(a)}</span>`).join('')}</div></div>`;
  const css = `
#root .title-stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;text-align:center}
#root #title-word{display:block;font-size:168px;line-height:.94;letter-spacing:-.02em;text-shadow:6px 6px 0 ${AMBER}}
#root #title-sub{font:600 46px Inter,sans-serif}
#root .title-cast{display:flex;gap:22px;margin-top:18px}
#root .title-cast-item{display:block}
#root .title-cast .badge{width:100px;height:100px;border-width:4px;box-shadow:5px 5px 0 #07181E}
`;
  const tl = [
    `gsap.set('#title-word',{opacity:0,scale:2.3,y:-30});`,
    `tl.fromTo('#title-word',{opacity:0},{opacity:1,duration:${f(FRAME)},ease:'none',immediateRender:false},0);`,
    `tl.fromTo('#title-word',{scale:2.3,y:-30},{scale:1,y:0,duration:${f(5 * FRAME)},ease:'power3.in',immediateRender:false},0);`,
    `tl.set('#title-shake',{x:12,y:-6},${f(5 * FRAME)});tl.set('#title-shake',{x:-9,y:5},${f(6 * FRAME)});tl.set('#title-shake',{x:0,y:0},${f(7 * FRAME)});`,
    `tl.fromTo('#title-sub',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.18,ease:'power2.out'},.32);`,
    ...cast.map((_, i) => `tl.fromTo('#title-cast-${i}',{opacity:0,scale:.3,y:24},{opacity:1,scale:1,y:0,duration:.45,ease:'back.out(2.2)'},${f(0.62 + i * 0.07)});`),
  ];
  const bg = temple('title', s.duration);
  return { css: CSS_TEMPLE + css, body: bg.html + overlay('title-main', html, 0, s.duration), tl: [bg.tl, ...tl], mount: false, bg: TEAL };
}

function endScene(s) {
  const html = `<div id="end-shake" class="end-stack"><img id="end-emblem" class="end-emblem" src="${PTAH_EMBLEM}" alt="Ptah emblem"><strong id="end-title">The Tribunal</strong><span id="end-tag">Five agents. One verdict.</span></div><small class="robot-credit">Robot model: “cute robot” by victory_mirosya, CC BY 4.0 · Product logos belong to their owners</small>`;
  const css = `
#root .end-stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center;padding-bottom:40px}
#root .end-emblem{width:340px;height:340px;object-fit:contain;display:block;margin-bottom:6px}
#root .end-stack strong{font-size:150px;line-height:.94;letter-spacing:-.02em;text-shadow:6px 6px 0 ${AMBER}}
#root .end-stack span{font:600 46px Inter,sans-serif}
#root .robot-credit{position:absolute;left:0;right:0;bottom:70px;text-align:center;font:400 22px Inter,sans-serif;color:#C9D3CF}
`;
  const land = 8 * FRAME;
  const bg = temple('endcard', s.duration);
  const tl = [
    bg.tl,
    // The emblem is carried down into place (accelerating, 8 frames), lands with a 2-frame shake, then holds.
    `gsap.set('#end-emblem',{opacity:0,y:-220,scale:1.22});`,
    `tl.fromTo('#end-emblem',{opacity:0},{opacity:1,duration:${f(2 * FRAME)},ease:'none',immediateRender:false},0);`,
    `tl.fromTo('#end-emblem',{y:-220,scale:1.22},{y:0,scale:1,duration:${f(land)},ease:'power3.in',immediateRender:false},0);`,
    `tl.set('#end-shake',{x:0,y:9},${f(land)});tl.set('#end-shake',{x:0,y:-5},${f(land + FRAME)});tl.set('#end-shake',{x:0,y:0},${f(land + 2 * FRAME)});`,
    `tl.fromTo('#end-title',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.18,ease:'power2.out'},${f(land + 3 * FRAME)});`,
    `tl.fromTo('#end-tag',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.16,ease:'power2.out'},${f(land + 9 * FRAME)});`,
  ];
  return { css: CSS_TEMPLE + css, body: bg.html + overlay('end-main', html, 0, s.duration), tl, mount: false, bg: TEAL };
}

function tableScene(s) {
  const { id, start } = s;
  let body = '', tl = [], css = '';
  if (id === 'table-verdict') {
    const t = row(19).start - start;
    body += overlay('verdict-card', '<div class="verdict-paper"><div>REMOTION FOR<br>THE SHOWCASE.</div><div>HYPERFRAMES FOR<br>THE PROMOS.</div><div>NO SHARED CODE.</div><mark>VERDICT</mark></div>', t, Math.max(2.5, Math.min(s.duration - t, 4.1)));
    tl.push(`tl.fromTo('#verdict-card .verdict-paper',{scale:1.6,rotation:-12},{scale:1,rotation:0,duration:5/30,ease:'expo.out'},${f(t)});`);
    css = `
#root #verdict-card .inner{background:rgba(3,15,19,.68);display:flex;align-items:center;justify-content:center}
#root .verdict-paper{position:relative;background:#F4E9D3;color:${INK};width:900px;height:520px;padding:54px 66px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;font-size:52px;line-height:1.05;box-shadow:20px 24px 0 #091419}
#root .verdict-paper mark{position:absolute;right:30px;bottom:18px;padding:4px 15px;border:6px solid #C8342B;background:#F4E9D3;color:#C8342B;font-size:36px;transform:rotate(-9deg)}
`;
  }
  return { css, body, tl, mount: true, kind: id === 'table-chaos' ? 'chaos' : id === 'table-verdict' ? 'verdict' : 'table' };
}

function sceneFile(s) {
  const built = s.id === 'intro' ? introScene(s) : s.id === 'title' ? titleScene(s) : s.id === 'endcard' ? endScene(s)
    : s.id.startsWith('punch-') ? punchScene(s) : s.id.startsWith('booth-') ? boothScene(s) : tableScene(s);
  const { id, agent, duration, start } = s;
  const bg = built.bg || (agent ? colors[agent] : '#163B47');
  const config = built.mount ? {
    id, kind: built.kind, agent, absoluteStart: start, color: agent ? colors[agent] : null, icon: agent ? (agent === 'Conductor' ? PTAH_EMBLEM : `assets/icons/${icons[agent]}.png`) : null,
    rows: s.nums.map(n => { const r = row(n); return { start: r.start, duration: r.duration, speaker: r.speaker ?? null, row: /^\d+$/.test(n) ? Number(n) : n, localStart: +(r.start - start).toFixed(3), ...(r.impact != null ? { impact: r.impact, localImpact: +(r.impact - start).toFixed(3), word: r.word } : {}) }; }),
  } : null;
  s.built = built;
  return `<template>
<style>
#root{background:${bg}}${CSS}${built.css}</style>
<div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}" data-duration="${f(duration)}">${built.mount ? `<canvas id="${id}-canvas" width="${W}" height="${H}"></canvas>` : ''}${built.body}</div>
<script>
{ const tl=gsap.timeline({paused:true});
${built.tl.join('\n')}
window.__timelines=window.__timelines||{};
window.__timelines['${id}']=tl;
${built.mount ? `window.__hf.buildReady['${id}']=window.TribunalReady.then(api=>api.mount(${JSON.stringify(config)},document.getElementById('${id}-canvas')));` : ''}
}
</script>
</template>
`;
}

// ---------- Audio ----------
const audioSrc = file => `assets/audio/${esc(String(file || '').replaceAll('\\', '/').replace(/^assets\/audio\//, ''))}`;
// One master bus with a true-peak ceiling: voices sit at -1.7 dBTP, so a hit or sting landing on a word
// can sum past 0 dBFS; the limiter catches those overs (it never shapes the mix below -1.5 dB).
const MASTER_CHAIN = JSON.stringify({ version: 1, nodes: [{ type: 'limiter', id: 'n1', label: 'Ceiling', params: { limit: -1.5, attack: 2, release: 80, level_out: 0 } }] });
let audios = `<hf-audio-group id="master" data-label="Master" data-volume="1" data-fx-chain="${MASTER_CHAIN.replaceAll('"', '&quot;')}"></hf-audio-group>
`;
// Overlaps are intentional (row 5 cuts into row 4; whooshes run into hits; the P6 gavel rings under the
// title slam), so each overlapping clip gets its own Studio lane instead of sharing one.
const lanes = {};
const lane = (group, first, start, dur) => {
  const ends = lanes[group] ||= [];
  let i = ends.findIndex(e => e <= start + 1e-6);
  if (i < 0) { i = ends.length; ends.push(0); }
  ends[i] = start + dur;
  return first + i;
};
const voiceClips = Object.entries(cues.voices || {}).map(([id, v]) => { const item = rows[String(v.row)]; return item && { id, v, start: item.voiceStart ?? item.start, dur: v.duration || item.duration }; }).filter(Boolean).sort((a, b) => a.start - b.start);
for (const { id, v, start, dur } of voiceClips) {
  const ti = lane('vo', 0, start, dur) === 0 ? 31 : 32;
  audios += `<audio id="${esc(id)}" class="clip" src="${audioSrc(v.file)}" data-start="${f(start)}" data-duration="${f(dur)}" data-track-index="${ti}" data-volume="1" data-audio-group="master"></audio>\n`;
}
const sfxClips = Object.entries(cues.sfx || {}).map(([id, v]) => ({ id, v, start: v.start ?? 0, dur: v.duration || 1 })).sort((a, b) => a.start - b.start);
for (const { id, v, start, dur } of sfxClips) {
  audios += `<audio id="${esc(id)}" class="clip" src="${audioSrc(v.file)}" data-start="${f(start)}" data-duration="${f(dur)}" data-track-index="${lane('sfx', 33, start, dur)}" data-volume="${v.volume || 1}" data-audio-group="master"></audio>\n`;
}
const music = cues.music;
if (music?.file) audios += `<audio id="music-bed" class="clip" src="${audioSrc(music.file)}" data-start="0" data-duration="${f(Math.min(total, music.duration || total))}" data-track-index="30" data-volume="${music.volume ?? 0.14}" data-audio-group="master"></audio>\n`;

// ---------- Write (temp files first, then rename, so a reader never sees a half-written project) ----------
const outputs = [];
for (const s of scenes) outputs.push([path.join(base, 'compositions', `${s.id}.html`), sceneFile(s)]);
const hosts = scenes.map((s, i) => `<div id="${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${f(s.start)}" data-duration="${f(s.duration)}" data-track-index="${i + 1}" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`).join('\n');
const root = `<!doctype html><html lang="en" data-composition-variables='[{"id":"title","type":"string","label":"Title","default":"THE TRIBUNAL"}]'><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The Tribunal</title><script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script><script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script><script>window.__tribunalEnvelopes=${JSON.stringify(envelopeByRow)};window.TribunalReady=new Promise(resolve=>window.__tribunalResolve=resolve);window.__hf=window.__hf||{};window.__hf.buildReady=window.__hf.buildReady||{};</script><script type="module" src="src/scene.js"></script></head><body style="margin:0;background:${TEAL}"><div id="root" data-composition-id="main" data-start="0" data-duration="${f(total)}" data-width="${W}" data-height="${H}">\n${hosts}\n${audios}</div><script>window.__timelines=window.__timelines||{};window.__timelines['main']=gsap.timeline({paused:true});</script></body></html>`;
outputs.push([path.join(base, 'index.html'), root]);
outputs.push([path.join(base, 'src/timing.json'), JSON.stringify(timing, null, 2)]);
for (const [file, text] of outputs) fs.writeFileSync(`${file}.tmp`, text);
for (const [file] of outputs) fs.renameSync(`${file}.tmp`, file);
for (const old of RETIRED) { const p = path.join(base, 'compositions', `${old}.html`); if (fs.existsSync(p)) fs.unlinkSync(p); }

console.log(`Timing: ${timing.source}; ${total}s; ${scenes.length} scenes`);
for (const s of scenes) console.log(`  ${s.id.padEnd(18)} ${f(s.start)} +${f(s.duration)}`);
