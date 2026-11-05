// Loads everything the 3D layer needs exactly once per page:
// the robot GLB, provider icons (optional), voice cues and the sign font.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// Resolve every asset against the project root (this file lives in src/),
// so it works no matter which page imports the module.
const ROOT = new URL('../', import.meta.url);
export const assetUrl = (path) => new URL(path, ROOT).href;

// `color` is the agent accent. Optional overrides: `screen`, `eyes`, `glow` (robot
// materials), `wall` (booth/punch pleat, used as-is) and `badge` ({ring, face}).
// OpenCode is black and white, its real brand.
export const AGENTS = {
  Claude: { color: '#D97757', icon: 'claude' },
  Codex: { color: '#10A37F', icon: 'codex' },
  Cursor: { color: '#8C8CFF', icon: 'cursor' },
  Antigravity: { color: '#4F8BF5', icon: 'antigravity' },
  OpenCode: {
    color: '#FFFFFF', icon: 'opencode',
    screen: '#111111', eyes: '#FFFFFF', glow: '#FFFFFF', wall: '#1C1C1C',
    badge: { ring: '#111111', face: '#FFFFFF' },
  },
  Conductor: { color: '#E8A33D', icon: 'ptah', emblem: true },
};

// The real Ptah emblem (engraved ankh, black on white). The transparent gold version is
// used for the Conductor's badge (a cream disc with the webp is the fallback).
export const BRAND = {
  emblem: 'assets/brand/ptah-emblem.webp',
  emblemGold: 'assets/brand/ptah-emblem-gold.png',
};

// Seat order around the far side of the table, camera-left to camera-right.
export const PANEL = ['Claude', 'Cursor', 'Antigravity', 'Codex', 'OpenCode'];

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolve(null); // a missing icon must never fail the build
    img.src = url;
  });
}

async function loadJson(url, fallback) {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : fallback;
  } catch {
    return fallback;
  }
}

async function loadFont(url) {
  try {
    return await new FontLoader().loadAsync(url);
  } catch {
    return null;
  }
}

let cache = null;

export function loadAssets() {
  if (cache) return cache;
  cache = (async () => {
    const iconIds = Object.values(AGENTS).map((a) => a.icon);
    const [gltf, cues, font, temple, emblem, ...icons] = await Promise.all([
      new GLTFLoader().loadAsync(assetUrl('assets/models/cute_robot.glb')),
      loadJson(assetUrl('assets/audio/cues.json'), {}),
      loadFont(assetUrl('node_modules/three/examples/fonts/helvetiker_bold.typeface.json')),
      loadImage(assetUrl('assets/backgrounds/temple-bg.webp')),
      loadImage(assetUrl(BRAND.emblem)),
      ...iconIds.map((id) => loadImage(assetUrl(`assets/icons/${id}.png`))),
    ]);
    // the gold emblem is optional and only requested once it is listed in BRAND
    const emblemGold = BRAND.emblemGold ? await loadImage(assetUrl(BRAND.emblemGold)) : null;
    // Canvas text uses the bundled display face when the page has it.
    try {
      if (document.fonts?.load) await document.fonts.load('64px "Archivo Black"');
    } catch { /* fall back to system sans */ }
    const iconById = Object.fromEntries(iconIds.map((id, i) => [id, icons[i]]));
    return { gltf, cues: cues || {}, font, icons: iconById, temple, emblem, emblemGold, THREE };
  })();
  return cache;
}
