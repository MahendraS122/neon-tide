// Canvas portraits shared by dialogue, title cards and the city atlas.
/** Character-specific look: hair shape, skin, clothing, and a prop or feature that reads at size. */
export const PORTRAITS = { mara: {
  skin: '#8c5a3c', hair: '#1a1210', shirt: '#8b2f52', accent: '#ff4d9d', style: 'long', name: 'MARA REYES',
  role: 'FIXER',
}, tavo: {
  skin: '#c98a5e', hair: '#0e0c0a', shirt: '#3a5f7a', accent: '#25e6d0', style: 'slick', name: 'TAVO LAVADO',
  role: 'RIVAL BOSS',
}, nina: {
  skin: '#f0c9a4', hair: '#6b3a1a', shirt: '#2fd6b6', accent: '#ffb03a', style: 'pony', name: 'NINA SOL',
  role: 'RACER',
}, garza: {
  skin: '#c98a5e', hair: '#3a2a1a', shirt: '#b2874a', accent: '#ffb03a', style: 'beard', name: 'VICTOR GARZA',
  role: 'FENCE',
}, hollis: {
  skin: '#e8b48c', hair: '#5a5a5a', shirt: '#2a3a5a', accent: '#5aa9ff', style: 'cap', name: 'CAPT. HOLLIS',
  role: 'SPD',
}, dex: {
  skin: '#e8b48c', hair: '#2a1d14', shirt: '#d9dde3', accent: '#ff7a2f', style: 'short', name: 'DEX CALLOWAY',
  role: 'EX-CON',
}, };
/**
* Paint one bust into a canvas. `size` is the square's edge in CSS pixels; the drawing is done at
* 2x for the portrait so it stays sharp on a high-density screen.
*/
export function drawPortrait(canvas, key, { size = 78 } = { }) {
  const look = PORTRAITS[key] ?? PORTRAITS.dex;
  const dpr = 2;
  const pixels = Math.round(size * dpr);
  canvas.width = pixels;
  canvas.height = pixels;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const s = size;
  // Backdrop: a warm-to-cool wash with a soft rim light, so every bust pops off the HUD panel.
  const bg = ctx.createLinearGradient(0, 0, s, s);
  bg.addColorStop(0, '#1a2233');
  bg.addColorStop(1, '#0a0d15');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);
  const glow = ctx.createRadialGradient(s * 0.72, s * 0.22, 0, s * 0.72, s * 0.22, s * 0.9);
  glow.addColorStop(0, hexAlpha(look.accent, 0.34));
  glow.addColorStop(1, hexAlpha(look.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, s, s);
  // Shoulders and collar.
  ctx.fillStyle = look.shirt;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 1.16, s * 0.46, s * 0.4, 0, Math.PI, 0);
  ctx.fill();
  // A darker lapel line down each side of the chest.
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.moveTo(s * 0.36, s * 0.92);
  ctx.lineTo(s * 0.5, s * 1.02);
  ctx.lineTo(s * 0.64, s * 0.92);
  ctx.lineTo(s * 0.6, s * 1.2);
  ctx.lineTo(s * 0.4, s * 1.2);
  ctx.closePath();
  ctx.fill();
  // Neck.
  ctx.fillStyle = shade(look.skin, - 0.16);
  ctx.fillRect(s * 0.43, s * 0.62, s * 0.14, s * 0.22);
  // Head: a rounded jaw, wide at the temples.
  const headX = s * 0.5;
  const headY = s * 0.44;
  const headW = s * 0.2;
  const headH = s * 0.245;
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.ellipse(headX, headY, headW, headH, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jaw shadow on the far side.
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.beginPath();
  ctx.ellipse(headX + headW * 0.35, headY + headH * 0.1, headW * 0.62, headH * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cheekbone highlight.
  ctx.fillStyle = hexAlpha('#ffffff', 0.16);
  ctx.beginPath();
  ctx.ellipse(headX - headW * 0.4, headY + headH * 0.1, headW * 0.3, headH * 0.34, - 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Hair by style.
  ctx.fillStyle = look.hair;
  if (look.style === 'long') {
    ctx.beginPath();
    ctx.ellipse(headX, headY - headH * 0.42, headW * 1.06, headH * 0.72, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(headX - headW * 1.04, headY - headH * 0.4, headW * 0.34, headH * 1.9);
    ctx.fillRect(headX + headW * 0.7, headY - headH * 0.4, headW * 0.34, headH * 1.9);
  }
  else if (look.style === 'slick') {
    ctx.beginPath();
    ctx.ellipse(headX, headY - headH * 0.46, headW * 1.02, headH * 0.62, 0, Math.PI, 0);
    ctx.fill();
    // Slicked-back peak.
    ctx.beginPath();
    ctx.moveTo(headX - headW * 0.9, headY - headH * 0.5);
    ctx.lineTo(headX + headW * 0.2, headY - headH * 0.86);
    ctx.lineTo(headX + headW * 0.95, headY - headH * 0.44);
    ctx.closePath();
    ctx.fill();
  }
  else if (look.style === 'pony') {
    ctx.beginPath();
    ctx.ellipse(headX, headY - headH * 0.44, headW * 1.06, headH * 0.68, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX + headW * 1.16, headY + headH * 0.18, headW * 0.3, headH * 0.8, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  else if (look.style === 'beard') {
    ctx.beginPath();
    ctx.ellipse(headX, headY - headH * 0.46, headW * 1.04, headH * 0.6, 0, Math.PI, 0);
    ctx.fill();
    // A full beard round the jaw.
    ctx.fillStyle = shade(look.hair, 0.1);
    ctx.beginPath();
    ctx.ellipse(headX, headY + headH * 0.52, headW * 0.94, headH * 0.56, 0, 0, Math.PI);
    ctx.fill();
  }
  else if (look.style === 'cap') {
    // A peaked police cap, badge and all.
    ctx.fillStyle = '#16243c';
    ctx.beginPath();
    ctx.ellipse(headX, headY - headH * 0.52, headW * 1.12, headH * 0.5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#0f1a2c';
    ctx.fillRect(headX - headW * 1.2, headY - headH * 0.62, headW * 2.4, headH * 0.22);
    ctx.fillStyle = look.accent;
    ctx.beginPath();
    ctx.arc(headX, headY - headH * 0.62, s * 0.022, 0, Math.PI * 2);
    ctx.fill();
    // Grey at the temples.
    ctx.fillStyle = 'rgba(210,214,222,.6)';
    ctx.fillRect(headX - headW * 0.98, headY - headH * 0.3, headW * 0.2, headH * 0.5);
    ctx.fillRect(headX + headW * 0.78, headY - headH * 0.3, headW * 0.2, headH * 0.5);
  }
  else {
    ctx.beginPath();
    ctx.ellipse(headX, headY - headH * 0.48, headW * 1.05, headH * 0.58, 0, Math.PI, 0);
    ctx.fill();
    // A messy fringe.
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(headX - headW +(i * headW * 2) / 5, headY - headH * 0.5);
      ctx.lineTo(headX - headW * 0.6 +(i * headW * 2) / 5, headY - headH * 0.14);
      ctx.lineTo(headX - headW * 0.4 +(i * headW * 2) / 5, headY - headH * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Eyes: a dark lash line, an iris, a catchlight.
  const eyeY = headY + headH * 0.02;
  for (const side of[- 1, 1]) {
    const ex = headX + side * headW * 0.42;
    ctx.fillStyle = 'rgba(20,16,18,.85)';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, headW * 0.2, headH * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a20';
    ctx.beginPath();
    ctx.arc(ex, eyeY, headW * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(ex - headW * 0.04, eyeY - headH * 0.03, headW * 0.035, 0, Math.PI * 2);
    ctx.fill();
    // Brow.
    ctx.strokeStyle = shade(look.hair, 0.06);
    ctx.lineWidth = Math.max(1, s * 0.018);
    ctx.beginPath();
    ctx.moveTo(ex - headW * 0.26, eyeY - headH * 0.26);
    ctx.lineTo(ex + headW * 0.24, eyeY - headH * 0.3);
    ctx.stroke();
  }
  // Nose and mouth.
  ctx.strokeStyle = 'rgba(0,0,0,.2)';
  ctx.lineWidth = Math.max(1, s * 0.014);
  ctx.beginPath();
  ctx.moveTo(headX + headW * 0.04, eyeY + headH * 0.05);
  ctx.lineTo(headX - headW * 0.02, eyeY + headH * 0.34);
  ctx.lineTo(headX + headW * 0.14, eyeY + headH * 0.36);
  ctx.stroke();
  ctx.strokeStyle = shade(look.skin, - 0.34);
  ctx.lineWidth = Math.max(1.4, s * 0.022);
  ctx.beginPath();
  ctx.moveTo(headX - headW * 0.26, headY + headH * 0.62);
  ctx.quadraticCurveTo(headX, headY + headH * 0.7, headX + headW * 0.26, headY + headH * 0.62);
  ctx.stroke();
  // Rim light along the lit side: a thin bright arc, the same trick as the 3D figures.
  ctx.strokeStyle = hexAlpha(look.accent, 0.5);
  ctx.lineWidth = Math.max(1.2, s * 0.016);
  ctx.beginPath();
  ctx.arc(headX - headW * 0.1, headY, headW * 1.02, Math.PI * 0.75, Math.PI * 1.4);
  ctx.stroke();
  // Vignette and a hairline frame, so the bust sits in the panel.
  const vign = ctx.createRadialGradient(s * 0.5, s * 0.5, s * 0.28, s * 0.5, s * 0.5, s * 0.78);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = hexAlpha(look.accent, 0.55);
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
  return look;
}
function hexAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
/** Lighten (positive) or darken (negative) a hex colour by a fraction. */
function shade(hex, amount) {
  const value = hex.replace('#', '');
  const parts =[0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16));
  const shifted = parts.map((c) => {
    const target = amount >= 0 ? 255: 0;
    return Math.round(c +(target - c) * Math.abs(amount));
  });
  return `rgb(${shifted[0]},${shifted[1]},${shifted[2]})`;
}
