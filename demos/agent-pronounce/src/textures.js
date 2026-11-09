// Canvas-drawn textures: badges, nameplates, paper, screens, soft shadows.
// Drawn once at mount; nothing here runs per frame.
import * as THREE from 'three';

const DISPLAY_FONT = '"Archivo Black", "Arial Black", "Helvetica Neue", Arial, sans-serif';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c, { srgb = true, repeat = false } = {}) {
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function brassGradient(g, x0, y0, x1, y1) {
  const grad = g.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, '#F3D58A');
  grad.addColorStop(0.35, '#C99A42');
  grad.addColorStop(0.62, '#E8C46E');
  grad.addColorStop(1, '#9C6E26');
  return grad;
}

// Draw a provider icon into a circle, or a coloured disc with the agent's initial.
function drawIcon(g, icon, cx, cy, r, color, letter, { emblem = false } = {}) {
  if (icon) {
    g.save();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.clip();
    // a full emblem (square art with its own lettering) must fit inside the circle
    const s = r * (emblem ? 1.42 : 1.5);
    g.drawImage(icon, cx - s / 2, cy - s / 2, s, s);
    g.restore();
    return;
  }
  g.fillStyle = color;
  g.beginPath();
  g.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#FFF6E5';
  g.font = `${Math.round(r * 1.1)}px ${DISPLAY_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(letter, cx, cy + r * 0.06);
}

export function badgeTexture(icon, color, letter, { ring = null, face = '#F7EEDC', emblem = false } = {}) {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = ring || brassGradient(g, 0, 0, 256, 256);
  g.beginPath();
  g.arc(128, 128, 126, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = ring ? '#000000' : '#7A5418';
  g.beginPath();
  g.arc(128, 128, 106, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = face;
  g.beginPath();
  g.arc(128, 128, 100, 0, Math.PI * 2);
  g.fill();
  drawIcon(g, icon, 128, 128, emblem ? 96 : 76, color, letter, { emblem });
  return toTexture(c);
}

export function nameplateTexture(name, icon, color, { emblem = false } = {}) {
  const c = canvas(1024, 256);
  const g = c.getContext('2d');
  g.fillStyle = brassGradient(g, 0, 0, 0, 256);
  g.fillRect(0, 0, 1024, 256);
  // bevel
  g.strokeStyle = 'rgba(90,60,15,0.85)';
  g.lineWidth = 14;
  g.strokeRect(7, 7, 1010, 242);
  g.strokeStyle = 'rgba(255,240,200,0.55)';
  g.lineWidth = 4;
  g.strokeRect(20, 20, 984, 216);
  // icon medallion
  g.fillStyle = '#F7EEDC';
  g.beginPath();
  g.arc(140, 128, 88, 0, Math.PI * 2);
  g.fill();
  drawIcon(g, icon, 140, 128, emblem ? 86 : 70, color, name[0], { emblem });
  // engraved name: dark fill with a light lower-right edge, sized to fit the plate
  const label = name.toUpperCase();
  const maxWidth = 1024 - 262 - 46;
  let size = 118;
  g.font = `${size}px ${DISPLAY_FONT}`;
  while (size > 40 && g.measureText(label).width > maxWidth) {
    size -= 4;
    g.font = `${size}px ${DISPLAY_FONT}`;
  }
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,236,180,0.7)';
  g.fillText(label, 262, 140);
  g.fillStyle = '#2A1A0E';
  g.fillText(label, 258, 136);
  return toTexture(c);
}

export function paperTexture(seed = 0) {
  const c = canvas(256, 360);
  const g = c.getContext('2d');
  g.fillStyle = '#F4ECDC';
  g.fillRect(0, 0, 256, 360);
  g.fillStyle = '#2A2A2A';
  g.font = 'bold 22px Arial, sans-serif';
  g.fillText(seed % 2 ? 'PLAN v43' : 'STEP 1/43', 24, 44);
  g.fillStyle = 'rgba(60,60,70,0.45)';
  for (let i = 0; i < 16; i++) {
    const w = 120 + ((i * 37 + seed * 13) % 90);
    g.fillRect(24, 72 + i * 17, w, 5);
  }
  return toTexture(c);
}

export function laptopScreenTexture(color) {
  const c = canvas(512, 320);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, '#1B2A4A');
  grad.addColorStop(1, color);
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#E9E4DA';
  g.fillRect(0, 0, 512, 44);
  ['#E36A5A', '#F2C14E', '#5BC27A'].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(26 + i * 26, 22, 8, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = '#FFFFFF';
  g.fillRect(110, 11, 370, 22);
  g.fillStyle = '#FFF6E5';
  g.font = 'bold 64px Arial Black, Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('3D', 256, 210);
  return toTexture(c);
}

export function paddleTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#F4E9D3';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#C8342B';
  g.lineWidth = 14;
  g.strokeRect(12, 12, 232, 232);
  g.fillStyle = '#C8342B';
  g.font = `150px ${DISPLAY_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('!', 128, 118);
  g.font = `30px ${DISPLAY_FONT}`;
  g.fillText('OBJECTION', 128, 214);
  return toTexture(c);
}

// Soft radial blob used as a contact shadow under feet, props and furniture.
export function contactShadowTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.75)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return toTexture(c, { srgb: false });
}

// Wood grain for the walnut table, drawn procedurally with a seeded pattern.
export function woodTexture() {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  g.fillStyle = '#3B2416';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const y = (i * 5.7) % 512;
    const a = 0.05 + ((i * 7919) % 13) / 160;
    g.strokeStyle = i % 3 ? `rgba(20,10,4,${a})` : `rgba(120,78,44,${a})`;
    g.lineWidth = 1 + (i % 4);
    g.beginPath();
    for (let x = 0; x <= 512; x += 16) {
      const yy = y + Math.sin(x / 61 + i) * 4 + Math.sin(x / 23 + i * 0.7) * 1.5;
      if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
    g.stroke();
  }
  return toTexture(c, { repeat: true });
}
