// Canvas textures for Episode 2's worlds: oak planks, plaster, limewashed brick,
// the daylight sky with a city skyline, leaves, rugs, posters, clock faces, labels,
// paper files, stamps and signs. All seeded (hash), drawn once at mount.
import * as THREE from 'three';
import { hash } from './util.js';

const DISPLAY = '"Archivo Black", "Arial Black", "Helvetica Neue", Arial, sans-serif';
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function tex(c, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.needsUpdate = true;
  return t;
}

const shade = (hex, k) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return `#${c.getHexString()}`;
};

// ---------------------------------------------------------------- surfaces

// Light oak planks: 8 boards across 1024 px, staggered end joints, grain and knots.
export function oakPlanks({ base = '#C8A27A', boards = 8, seed = 'oak' } = {}) {
  const c = canvas(1024, 1024);
  const g = c.getContext('2d');
  const bw = 1024 / boards;
  for (let b = 0; b < boards; b++) {
    let y = -hash(seed, 'off', b) * 700;
    let k = 0;
    while (y < 1024) {
      const len = 520 + 420 * hash(seed, 'len', b, k);
      const tone = 0.86 + 0.24 * hash(seed, 'tone', b, k);
      g.fillStyle = shade(base, tone);
      g.fillRect(b * bw, y, bw, len);
      // grain: long gently wavy strokes
      for (let i = 0; i < 26; i++) {
        const x = b * bw + 4 + hash(seed, 'gx', b, k, i) * (bw - 8);
        const a = 0.05 + 0.1 * hash(seed, 'ga', b, k, i);
        g.strokeStyle = hash(seed, 'gd', b, k, i) < 0.6 ? `rgba(90,58,30,${a})` : `rgba(255,236,205,${a * 0.8})`;
        g.lineWidth = 0.8 + 1.6 * hash(seed, 'gw', b, k, i);
        g.beginPath();
        for (let yy = 0; yy <= len; yy += 24) {
          const xx = x + Math.sin((yy + i * 37) / (60 + 40 * hash(seed, 'gf', i))) * 3;
          if (yy === 0) g.moveTo(xx, y + yy); else g.lineTo(xx, y + yy);
        }
        g.stroke();
      }
      if (hash(seed, 'knot', b, k) < 0.25) {
        const kx = b * bw + bw * (0.3 + 0.4 * hash(seed, 'kx', b, k));
        const ky = y + len * hash(seed, 'ky', b, k);
        const grad = g.createRadialGradient(kx, ky, 0, kx, ky, 9);
        grad.addColorStop(0, 'rgba(80,48,22,0.55)');
        grad.addColorStop(1, 'rgba(80,48,22,0)');
        g.fillStyle = grad;
        g.beginPath(); g.ellipse(kx, ky, 7, 13, 0, 0, Math.PI * 2); g.fill();
      }
      // end joint
      g.fillStyle = 'rgba(60,38,18,0.55)';
      g.fillRect(b * bw, y + len - 2, bw, 2);
      y += len;
      k++;
    }
    // board seams
    g.fillStyle = 'rgba(55,34,16,0.6)';
    g.fillRect(b * bw, 0, 2, 1024);
    g.fillStyle = 'rgba(255,240,215,0.18)';
    g.fillRect(b * bw + 2, 0, 1, 1024);
  }
  return c;
}

export function plaster({ base = '#F1ECE4', seed = 'pl' } = {}) {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) {
    const x = hash(seed, 'x', i) * 512, y = hash(seed, 'y', i) * 512;
    const r = 6 + 40 * hash(seed, 'r', i);
    g.fillStyle = hash(seed, 'd', i) < 0.5 ? 'rgba(0,0,0,0.012)' : 'rgba(255,255,255,0.03)';
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  return c;
}

// Limewashed brick: warm brick showing through a soft white wash.
export function brick({ base = '#B9876A', mortar = '#E9E1D6', wash = 0.62, seed = 'br' } = {}) {
  const c = canvas(1024, 1024);
  const g = c.getContext('2d');
  g.fillStyle = mortar;
  g.fillRect(0, 0, 1024, 1024);
  const bw = 102, bh = 32, m = 6;
  for (let r = 0; r * bh < 1024; r++) {
    const off = r % 2 ? bw / 2 : 0;
    for (let x = -bw; x < 1024 + bw; x += bw) {
      const tone = 0.78 + 0.35 * hash(seed, r, x);
      g.fillStyle = shade(base, tone);
      g.fillRect(x + off + m / 2, r * bh + m / 2, bw - m, bh - m);
    }
  }
  // the wash: blotchy white over everything
  for (let i = 0; i < 900; i++) {
    const x = hash(seed, 'wx', i) * 1024, y = hash(seed, 'wy', i) * 1024;
    const rr = 20 + 70 * hash(seed, 'wr', i);
    g.fillStyle = `rgba(246,241,233,${wash * (0.06 + 0.1 * hash(seed, 'wa', i))})`;
    g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = `rgba(246,241,233,${wash * 0.55})`;
  g.fillRect(0, 0, 1024, 1024);
  return c;
}

export function concrete({ base = '#CFCBC4', seed = 'cc' } = {}) {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const v = hash(seed, 'v', i);
    g.fillStyle = v < 0.5 ? `rgba(70,66,60,${0.03 + 0.06 * v})` : `rgba(255,255,255,${0.04 * v})`;
    g.fillRect(hash(seed, 'x', i) * 512, hash(seed, 'y', i) * 512, 1 + 3 * hash(seed, 's', i), 1 + 3 * hash(seed, 't', i));
  }
  return c;
}

export function grass({ seed = 'gr' } = {}) {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  g.fillStyle = '#6E9A4A';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const v = hash(seed, 'v', i);
    g.strokeStyle = v < 0.5 ? `rgba(60,96,34,0.5)` : `rgba(150,190,90,0.45)`;
    const x = hash(seed, 'x', i) * 512, y = hash(seed, 'y', i) * 512;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(seed, 'd', i) - 0.5) * 4, y - 4 - 6 * v); g.stroke();
  }
  return c;
}

// Light sandstone pavers for paths.
export function pavers({ base = '#D8CBB4', seed = 'pv' } = {}) {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  g.fillStyle = '#9C8F7A';
  g.fillRect(0, 0, 512, 512);
  const s = 128;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = shade(base, 0.9 + 0.16 * hash(seed, x, y));
    g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(110,90,60,${0.04 + 0.05 * hash(seed, 'm', x, y, i)})`;
      g.beginPath(); g.arc(x * s + hash(seed, 'mx', x, y, i) * s, y * s + hash(seed, 'my', x, y, i) * s, 2 + 9 * hash(seed, 'mr', x, y, i), 0, Math.PI * 2); g.fill();
    }
  }
  return c;
}

// Sandstone with carved relief bands for the temple façade.
export function sandstone({ base = '#D9B98A', seed = 'ss', glyphs = true } = {}) {
  const c = canvas(1024, 1024);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 1024);
  // coursed blocks
  for (let r = 0; r < 8; r++) {
    const off = r % 2 ? 90 : 0;
    for (let x = -180; x < 1200; x += 180) {
      g.fillStyle = shade(base, 0.9 + 0.14 * hash(seed, r, x));
      g.fillRect(x + off + 2, r * 128 + 2, 176, 124);
    }
  }
  for (let i = 0; i < 1500; i++) {
    g.fillStyle = `rgba(120,80,40,${0.03 + 0.05 * hash(seed, 'n', i)})`;
    g.fillRect(hash(seed, 'x', i) * 1024, hash(seed, 'y', i) * 1024, 2 + 5 * hash(seed, 'w', i), 2 + 5 * hash(seed, 'h', i));
  }
  if (glyphs) {
    g.strokeStyle = 'rgba(110,70,30,0.45)';
    g.lineWidth = 4;
    for (let col = 0; col < 6; col++) {
      const x0 = 60 + col * 170;
      for (let y = 60; y < 960; y += 90) {
        const k = Math.floor(hash(seed, 'g', col, y) * 5);
        g.beginPath();
        if (k === 0) { g.arc(x0 + 30, y + 25, 18, 0, Math.PI * 2); g.moveTo(x0 + 30, y + 43); g.lineTo(x0 + 30, y + 75); g.moveTo(x0 + 12, y + 55); g.lineTo(x0 + 48, y + 55); }
        else if (k === 1) { g.ellipse(x0 + 30, y + 40, 28, 14, 0, 0, Math.PI * 2); g.moveTo(x0 + 36, y + 40); g.arc(x0 + 30, y + 40, 6, 0, Math.PI * 2); }
        else if (k === 2) { for (let z = 0; z < 6; z++) g.lineTo(x0 + z * 12, y + 40 + (z % 2 ? -10 : 10)); }
        else if (k === 3) { g.moveTo(x0 + 10, y + 70); g.quadraticCurveTo(x0 + 30, y, x0 + 50, y + 70); }
        else { g.rect(x0 + 10, y + 10, 40, 60); }
        g.stroke();
      }
    }
  }
  return c;
}

// Daylight sky with soft clouds and a pale city skyline (window backdrops).
export function skyline({ seed = 'sky', city = true, w = 2048, h = 1024, horizon = 0.66 } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#7FB6EA');
  grad.addColorStop(0.55, '#BFDDF5');
  grad.addColorStop(horizon, '#EEF5FA');
  grad.addColorStop(1, '#F6F1E8');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.save();
  g.filter = 'blur(18px)';
  for (let i = 0; i < 22; i++) {
    const cx = hash(seed, 'cx', i) * w, cy = (0.08 + 0.4 * hash(seed, 'cy', i)) * h;
    g.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * hash(seed, 'ca', i)})`;
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      g.ellipse(cx + (k - 2) * 60 * hash(seed, 'kx', i, k), cy + (hash(seed, 'ky', i, k) - 0.5) * 30, 80 + 90 * hash(seed, 'kr', i, k), 30 + 26 * hash(seed, 'ks', i, k), 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
  if (city) {
    const base = horizon * h;
    for (let layer = 0; layer < 2; layer++) {
      const far = layer === 0;
      let x = -20;
      let i = 0;
      while (x < w) {
        const bw = (far ? 50 : 70) + (far ? 90 : 120) * hash(seed, 'bw', layer, i);
        const bh = (far ? 60 : 40) + (far ? 210 : 170) * hash(seed, 'bh', layer, i);
        g.fillStyle = far ? '#C7D3DE' : '#AEBCC9';
        g.fillRect(x, base - bh + (far ? 0 : 30), bw, bh + 400);
        // windows
        g.fillStyle = far ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.22)';
        for (let yy = base - bh + 14 + (far ? 0 : 30); yy < base + 20; yy += 16) {
          for (let xx = x + 8; xx < x + bw - 10; xx += 14) if (hash(seed, 'win', layer, i, xx, yy) < 0.7) g.fillRect(xx, yy, 7, 8);
        }
        // a water tower now and then (loft-district skyline)
        if (!far && hash(seed, 'wt', i) < 0.18) {
          const tx = x + bw * 0.5, ty = base - bh + 30;
          g.fillStyle = '#9AA8B5';
          g.fillRect(tx - 14, ty - 34, 28, 26);
          g.beginPath(); g.moveTo(tx - 17, ty - 34); g.lineTo(tx, ty - 50); g.lineTo(tx + 17, ty - 34); g.fill();
          g.fillRect(tx - 12, ty - 8, 3, 8); g.fillRect(tx + 9, ty - 8, 3, 8);
        }
        x += bw + (far ? 4 : 10) + 30 * hash(seed, 'gap', layer, i);
        i++;
      }
    }
    // trees along the bottom
    for (let i = 0; i < 70; i++) {
      const x = hash(seed, 'tx', i) * w;
      const r = 30 + 40 * hash(seed, 'tr', i);
      g.fillStyle = hash(seed, 'tc', i) < 0.5 ? '#7FA06A' : '#93B37A';
      g.beginPath(); g.arc(x, base + 70 + 30 * hash(seed, 'ty', i), r, 0, Math.PI * 2); g.fill();
    }
  }
  return c;
}

// ---------------------------------------------------------------- decor

// A monstera-style leaf with an alpha edge.
export function leaf({ hue = '#3F7A3A', seed = 'lf', split = true } = {}) {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, shade(hue, 1.25));
  grad.addColorStop(1, shade(hue, 0.8));
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(128, 250);
  g.bezierCurveTo(10, 200, 0, 60, 128, 8);
  g.bezierCurveTo(256, 60, 246, 200, 128, 250);
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  if (split) {
    for (let i = 0; i < 5; i++) {
      for (const s of [-1, 1]) {
        const y = 60 + i * 34 + 10 * hash(seed, i, s);
        g.beginPath();
        g.moveTo(128 + s * 120, y - 6);
        g.lineTo(128 + s * 40, y + 8);
        g.lineTo(128 + s * 120, y + 10);
        g.fill();
      }
    }
  }
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(220,240,190,0.55)';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(128, 248); g.quadraticCurveTo(122, 120, 128, 14); g.stroke();
  g.lineWidth = 1.5;
  g.strokeStyle = 'rgba(220,240,190,0.3)';
  for (let i = 0; i < 7; i++) {
    for (const s of [-1, 1]) {
      const y = 50 + i * 28;
      g.beginPath(); g.moveTo(127, y + 20); g.quadraticCurveTo(128 + s * 50, y + 6, 128 + s * 95, y); g.stroke();
    }
  }
  return c;
}

// Flat-weave rug: cream ground, a border and a soft geometric band in the accent.
export function rug({ accent = '#C96F4A', ground = '#EDE3D2', seed = 'rug' } = {}) {
  const c = canvas(1024, 640);
  const g = c.getContext('2d');
  g.fillStyle = ground;
  g.fillRect(0, 0, 1024, 640);
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(120,100,80,${0.03 + 0.04 * hash(seed, 'f', i)})`;
    g.fillRect(hash(seed, 'x', i) * 1024, hash(seed, 'y', i) * 640, 2, 1);
  }
  g.strokeStyle = shade(accent, 0.8);
  g.lineWidth = 18;
  g.strokeRect(40, 40, 944, 560);
  g.lineWidth = 5;
  g.strokeStyle = '#3A3430';
  g.strokeRect(74, 74, 876, 492);
  g.fillStyle = accent;
  for (let i = 0; i < 9; i++) {
    const x = 150 + i * 92;
    g.beginPath(); g.moveTo(x, 320); g.lineTo(x + 40, 260); g.lineTo(x + 80, 320); g.lineTo(x + 40, 380); g.closePath(); g.fill();
  }
  g.fillStyle = '#3A3430';
  for (let i = 0; i < 9; i++) { const x = 190 + i * 92; g.beginPath(); g.arc(x, 320, 7, 0, Math.PI * 2); g.fill(); }
  return c;
}

// Abstract framed art prints (Bauhaus-ish shapes) for loft walls.
export function poster({ palette = ['#E07A4F', '#2F5D62', '#F2C14E', '#1E1E1E'], ground = '#F4EFE6', seed = 'po' } = {}) {
  const c = canvas(512, 680);
  const g = c.getContext('2d');
  g.fillStyle = ground;
  g.fillRect(0, 0, 512, 680);
  const k = Math.floor(hash(seed, 'k') * 3);
  const P = (i) => palette[Math.floor(hash(seed, 'p', i) * palette.length)];
  if (k === 0) {
    g.fillStyle = P(0); g.beginPath(); g.arc(256, 300, 150, 0, Math.PI * 2); g.fill();
    g.fillStyle = P(1); g.fillRect(80, 420, 352, 120);
    g.fillStyle = P(2); g.beginPath(); g.arc(256, 300, 70, Math.PI, 0); g.fill();
  } else if (k === 1) {
    for (let i = 0; i < 5; i++) { g.fillStyle = P(i + 3); g.fillRect(70 + i * 76, 120 + (i % 2) * 60, 60, 420 - (i % 2) * 60); }
  } else {
    g.fillStyle = P(5); g.beginPath(); g.moveTo(80, 560); g.lineTo(256, 120); g.lineTo(432, 560); g.fill();
    g.fillStyle = P(6); g.beginPath(); g.arc(340, 200, 70, 0, Math.PI * 2); g.fill();
  }
  return c;
}

export function clockFace({ style = 0, seed = 'cl' } = {}) {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const dark = style === 2;
  g.fillStyle = dark ? '#1F2326' : style === 1 ? '#F3EBDD' : '#FFFFFF';
  g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  g.strokeStyle = dark ? '#EDE6DA' : '#222';
  g.fillStyle = dark ? '#EDE6DA' : '#222';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const r0 = major ? 98 : 108, r1 = 118;
    g.lineWidth = major ? 6 : 2;
    g.beginPath(); g.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0); g.lineTo(128 + Math.sin(a) * r1, 128 - Math.cos(a) * r1); g.stroke();
  }
  if (style === 1) {
    g.font = `bold 30px Georgia, serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillText(String(i), 128 + Math.sin(a) * 78, 128 - Math.cos(a) * 78);
    }
  }
  return c;
}

// ---------------------------------------------------------------- text

/**
 * Generic text plate. lines: [{text, size, color, font, weight}], laid out centred,
 * each line shrunk to fit. Optional icon (image) at the left.
 */
export function textPlate({ w = 1024, h = 256, bg = '#111', border = null, radius = 24, lines = [], icon = null, iconBg = null, align = 'center', pad = 40 } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    roundRect(g, 0, 0, w, h, radius);
    g.fill();
  }
  if (border) {
    g.strokeStyle = border.color;
    g.lineWidth = border.width;
    roundRect(g, border.width / 2 + (border.inset || 0), border.width / 2 + (border.inset || 0), w - border.width - 2 * (border.inset || 0), h - border.width - 2 * (border.inset || 0), Math.max(0, radius - (border.inset || 0)));
    g.stroke();
  }
  let x0 = pad;
  if (icon !== undefined && icon !== null && icon !== false) {
    const s = h - pad * 1.4;
    if (iconBg) { g.fillStyle = iconBg; g.beginPath(); g.arc(pad + s / 2, h / 2, s / 2 + 6, 0, Math.PI * 2); g.fill(); }
    if (icon && icon.width) g.drawImage(icon, pad + s * 0.12, h / 2 - s * 0.38, s * 0.76, s * 0.76);
    x0 = pad + s + pad * 0.6;
  }
  const avail = w - x0 - pad;
  const total = lines.reduce((a, l) => a + l.size * 1.12, 0);
  let y = h / 2 - total / 2;
  for (const l of lines) {
    let size = l.size;
    const fam = l.font || DISPLAY;
    g.font = `${l.weight || ''} ${size}px ${fam}`;
    while (size > 10 && g.measureText(l.text).width > avail) { size -= 2; g.font = `${l.weight || ''} ${size}px ${fam}`; }
    g.fillStyle = l.color || '#FFF';
    g.textBaseline = 'middle';
    g.textAlign = align === 'left' ? 'left' : 'center';
    const tx = align === 'left' ? x0 : x0 + avail / 2;
    if (l.letter) g.letterSpacing = `${l.letter}px`;
    g.fillText(l.text, tx, y + (l.size * 1.12) / 2);
    g.letterSpacing = '0px';
    y += l.size * 1.12;
  }
  return c;
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Kraft cardboard with print (the install box).
export function cardboard({ lines = [], seed = 'cb', w = 512, h = 512, arrows = false, top = 0.36 } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#C79A64';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(${hash(seed, 'd', i) < 0.5 ? '120,80,40' : '235,200,150'},${0.05 + 0.06 * hash(seed, 'a', i)})`;
    g.fillRect(hash(seed, 'x', i) * w, hash(seed, 'y', i) * h, 1 + 6 * hash(seed, 'w', i), 1);
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let y = h * top;
  for (const l of lines) {
    g.fillStyle = l.color || '#3A2A1A';
    g.font = `${l.weight || ''} ${l.size}px ${l.font || DISPLAY}`;
    let size = l.size;
    while (size > 10 && g.measureText(l.text).width > w * 0.84) { size -= 2; g.font = `${l.weight || ''} ${size}px ${l.font || DISPLAY}`; }
    g.fillText(l.text, w / 2, y);
    y += size * 1.3;
  }
  if (arrows) {
    g.strokeStyle = '#3A2A1A';
    g.lineWidth = 8;
    for (const x of [w * 0.12, w * 0.88]) {
      g.beginPath(); g.moveTo(x, h * 0.9); g.lineTo(x, h * 0.72); g.moveTo(x - 18, h * 0.77); g.lineTo(x, h * 0.72); g.lineTo(x + 18, h * 0.77); g.stroke();
    }
  }
  return c;
}

// A document page: title, filename, ruled text lines, optional stamp mark.
export function documentPage({ title = 'DELIVERABLE', file = 'report.md', stamp = null, accent = '#2F5D62', seed = 'doc', w = 512, h = 680 } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#FBF6EC';
  g.fillRect(0, 0, w, h);
  g.fillStyle = accent;
  g.fillRect(0, 0, w, 18);
  g.fillStyle = '#1F1B16';
  g.font = `44px ${DISPLAY}`;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillText(title, 40, 92);
  g.font = `600 30px ${SANS}`;
  g.fillStyle = '#5A5148';
  g.fillText(file, 40, 136);
  g.fillStyle = 'rgba(40,36,30,0.35)';
  for (let i = 0; i < 14; i++) g.fillRect(40, 180 + i * 30, 300 + 120 * hash(seed, i), 9);
  if (stamp) drawStamp(g, w / 2, h * 0.6, stamp, { size: 66, angle: -0.18 });
  return c;
}

export function drawStamp(g, cx, cy, text, { size = 90, angle = -0.15, color = '#C8342B' } = {}) {
  g.save();
  g.translate(cx, cy);
  g.rotate(angle);
  g.font = `${size}px ${DISPLAY}`;
  const tw = g.measureText(text).width;
  g.strokeStyle = color;
  g.lineWidth = 10;
  roundRect(g, -tw / 2 - 28, -size * 0.72, tw + 56, size * 1.44, 14);
  g.stroke();
  g.lineWidth = 3;
  roundRect(g, -tw / 2 - 16, -size * 0.6, tw + 32, size * 1.2, 8);
  g.stroke();
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 0, size * 0.04);
  // ink texture: knock out speckles
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(0,0,0,${0.3 + 0.5 * hash('ink', i)})`;
    g.fillRect((hash('sx', i) - 0.5) * (tw + 60), (hash('sy', i) - 0.5) * size * 1.5, 2 + 4 * hash('sw', i), 2);
  }
  g.restore();
}

// Rubber stamp face (the underside, mirrored text is never seen; we draw the handle side).
export function lightBox({ text = 'AT LIMIT', bg = '#B3201B', fg = '#FFF4F0', w = 1024, h = 300 } = {}) {
  return textPlate({ w, h, bg, radius: 20, border: { color: 'rgba(255,255,255,0.65)', width: 10, inset: 16 }, lines: [{ text, size: 170, color: fg, letter: 6 }] });
}

export function phoneStatus({ w = 512, h = 1024, accent = '#FFFFFF', name = 'T3 Code' } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  // status bar
  g.fillStyle = 'rgba(0,0,0,0.38)';
  g.fillRect(0, 0, w, 64);
  g.fillStyle = '#FFFFFF';
  g.font = `600 30px ${SANS}`;
  g.textBaseline = 'middle';
  g.fillText('9:41', 34, 34);
  g.fillRect(w - 86, 22, 46, 22);
  g.fillRect(w - 40, 28, 5, 10);
  for (let i = 0; i < 4; i++) g.fillRect(w - 160 + i * 12, 40 - i * 6, 8, 6 + i * 6);
  // a slim bottom bar with a home indicator
  g.fillStyle = 'rgba(0,0,0,0.38)';
  g.fillRect(0, h - 120, w, 120);
  g.fillStyle = accent;
  g.font = `600 30px ${SANS}`;
  g.textAlign = 'center';
  g.fillText(name, w / 2, h - 74);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  roundRect(g, w / 2 - 80, h - 30, 160, 9, 4);
  g.fill();
  // live badge
  g.fillStyle = '#E5484D';
  roundRect(g, 26, 86, 108, 40, 20);
  g.fill();
  g.fillStyle = '#FFF';
  g.font = `700 24px ${SANS}`;
  g.fillText('LIVE', 80, 107);
  return c;
}
