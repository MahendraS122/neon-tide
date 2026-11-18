// Canvas-painted surfaces, cached so buildings and vehicles can share textures.
import * as THREE from 'three';
import { PALETTE } from '../config.js';
import { createRandom } from '../random.js';
const cache = new Map();
function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return { element, ctx: element.getContext('2d', { willReadFrequently: true }) };
}
function finish(element, { repeat =[1, 1], aniso = 4 } = { }) {
  const texture = new THREE.CanvasTexture(element);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = aniso;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
function cached(key, make) {
  let value = cache.get(key);
  if (!value) {
    value = make();
    cache.set(key, value);
  }
  return value;
}
/** Sprinkle grain over a canvas region, so flat paint reads as a surface. */
function grain(ctx, width, height, amount = 0.06) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n =(Math.random() - 0.5) * 255 * amount;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(image, 0, 0);
}

/* ------------------------------------------------------------------ facades */
/**
* A pastel art-deco or apartment facade: horizontal bands per floor, punched windows with a little
* interior glow, a cornice line and (for apartments) balcony rails. One tile covers 9 m.
*/
export function facadeTexture(style, tint, seed = 1) { return cached(`facade:${style}:${tint}:${seed}`,
() => {
  const width = 256;
  const height = 256;
  const { element, ctx } = canvas(width, height);
  const rand = createRandom(seed);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, width, height);
  // Vertical wash: walls catch the low sun near the top.
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, 'rgba(255,240,220,.22)');
  wash.addColorStop(0.55, 'rgba(255,255,255,0)');
  wash.addColorStop(1, 'rgba(40,30,40,.20)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  const floors = style === 'deco' ? 4: 5;
  const floorH = height / floors;
  for (let f = 0; f < floors; f += 1) {
    const y = f * floorH;
    ctx.fillStyle = 'rgba(255,255,255,.24)';
    ctx.fillRect(0, y + floorH - 7, width, 4);
    ctx.fillStyle = 'rgba(30,26,34,.18)';
    ctx.fillRect(0, y + floorH - 3, width, 3);
    const cols = style === 'deco' ? 3: 4;
    const cell = width / cols;
    for (let c = 0; c < cols; c += 1) {
      const w = cell *(style === 'deco' ? 0.44: 0.52);
      const h = floorH * 0.5;
      const x = c * cell +(cell - w) / 2;
      const wy = y + floorH * 0.22;
      ctx.fillStyle = 'rgba(20,18,26,.36)';
      ctx.fillRect(x - 2, wy - 2, w + 4, h + 5);
      const lit = rand() < 0.28;
      const glass = ctx.createLinearGradient(x, wy, x, wy + h);
      if (lit) {
        glass.addColorStop(0, '#ffe8bb');
        glass.addColorStop(1, '#f0ae6e');
      }
      else {
        glass.addColorStop(0, '#5f7f97');
        glass.addColorStop(1, '#2c3f50');
      }
      ctx.fillStyle = glass;
      ctx.fillRect(x, wy, w, h);
      ctx.fillStyle = 'rgba(250,250,255,.38)';
      ctx.fillRect(x + w / 2 - 1, wy, 2, h);
      ctx.fillRect(x, wy + h * 0.46, w, 2);
      ctx.fillStyle = 'rgba(255,240,214,.24)';
      ctx.fillRect(x, wy, w, h * 0.24);
      if (style === 'apartment') {
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.fillRect(x - 7, wy + h + 3, w + 14, 2);
        ctx.fillStyle = 'rgba(30,30,40,.32)';
        for (let r = 0; r < 7; r += 1) ctx.fillRect(x - 6 +(r *(w + 12)) / 7, wy + h + 3, 1, 8);
      }
    }
  }
  grain(ctx, width, height, 0.05);
  return finish(element);
});
}
/** A glass tower: mullion grid, sky reflected in the panes, a few warm offices lit. */
export function glassTexture(tint, seed = 1) { return cached(`glass:${tint}:${seed}`,() => {
  const width = 256;
  const height = 512;
  const { element, ctx } = canvas(width, height);
  const rand = createRandom(seed);
  const base = ctx.createLinearGradient(0, 0, width * 0.4, height);
  base.addColorStop(0, tint);
  base.addColorStop(0.5, '#7ea6c8');
  base.addColorStop(1, '#3f6c8c');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  const cols = 6;
  const rows = 14;
  const cw = width / cols;
  const rh = height / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const roll = rand();
      if (roll < 0.16) ctx.fillStyle = 'rgba(255,228,172,.78)';
      else if (roll < 0.32) ctx.fillStyle = 'rgba(255,255,255,.22)';
      else if (roll < 0.48) ctx.fillStyle = 'rgba(18,38,58,.32)';
      else continue;
      ctx.fillRect(c * cw + 1, r * rh + 1, cw - 2, rh - 2);
    }
  }
  ctx.strokeStyle = 'rgba(228,238,248,.45)';
  ctx.lineWidth = 1.4;
  for (let c = 1; c < cols; c += 1) {
    ctx.beginPath();
    ctx.moveTo(c * cw, 0);
    ctx.lineTo(c * cw, height);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r += 1) {
    ctx.beginPath();
    ctx.moveTo(0, r * rh);
    ctx.lineTo(width, r * rh);
    ctx.stroke();
  }
  // Diagonal sheen from the low sun.
  const sheen = ctx.createLinearGradient(0, height, width, 0);
  sheen.addColorStop(0, 'rgba(255,214,170,0)');
  sheen.addColorStop(0.5, 'rgba(255,214,170,.3)');
  sheen.addColorStop(1, 'rgba(255,214,170,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);
  return finish(element);
});
}
/** A plain tiled surface for roofs and pavement: colour, optional seams, a little grain. */
export function surfaceTexture(color, key, { seams = false, grainAmount = 0.07 } = { }) {
  return cached(`surface:${key}`,() => {
    const size = 128;
    const { element, ctx } = canvas(size, size);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    if (seams) {
      ctx.strokeStyle = 'rgba(0,0,0,.16)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= size; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      for (let i = 1; i <= size; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i + 1, 0);
        ctx.lineTo(i + 1, size);
        ctx.moveTo(0, i + 1);
        ctx.lineTo(size, i + 1);
        ctx.stroke();
      }
    }
    grain(ctx, size, size, grainAmount);
    return finish(element);
  });
}
/** Mown park grass with mower stripes. */
export function grassTexture() { return cached('grass',() => {
  const size = 128;
  const { element, ctx } = canvas(size, size);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i += 16) {
    ctx.fillStyle = i % 32 === 0 ? 'rgba(255,255,255,.06)': 'rgba(0,0,0,.06)';
    ctx.fillRect(0, i, size, 16);
  }
  grain(ctx, size, size, 0.12);
  return finish(element, { repeat:[6, 6] });
});
}
/* ------------------------------------------------------------------ signage */
/** A lit shop sign or neon blade: glowing text over a dark field. */
export function signTexture(text, color, sub = '') { return cached(`sign:${text}:${color}:${sub}`,
() => {
  const width = 512;
  const height = 128;
  const { element, ctx } = canvas(width, height);
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(7, 7, width - 14, height - 14);
  ctx.shadowColor = color;
  ctx.shadowBlur = 26;
  ctx.fillStyle = color;
  ctx.font = 'bold 60px "Arial Narrow", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), width / 2, height / 2 +(sub ? - 12: 0));
  if (sub) {
    ctx.font = 'bold 20px "Arial Narrow", Impact, sans-serif';
    ctx.shadowBlur = 14;
    ctx.fillText(sub.toUpperCase(), width / 2, height / 2 + 32);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
  return finish(element);
});
}
/** A car's number plate. */
export function plateTexture(text) { return cached(`plate:${text}`,() => {
  const { element, ctx } = canvas(128, 48);
  ctx.fillStyle = '#f4f0e2';
  ctx.fillRect(0, 0, 128, 48);
  ctx.fillStyle = '#1c2a44';
  ctx.fillRect(0, 0, 128, 11);
  ctx.fillStyle = '#f7d774';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PORT SOLARA', 64, 8.5);
  ctx.fillStyle = '#182033';
  ctx.font = 'bold 24px "Consolas", monospace';
  ctx.fillText(text, 64, 38);
  return finish(element);
});
}
