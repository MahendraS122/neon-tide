// All surface art is drawn locally on canvases with a deterministic random stream.
import * as THREE from '../../vendor/three.module.min.js';

export function seededRandom(seed = 27) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createTextures() {
  const random = seededRandom(610);
  function grain(ctx, width, height, amount) {
    for (let i = 0; i < amount; i += 1) {
      ctx.fillStyle = random() > 0.5 ? '#ffffff12' : '#00000015';
      ctx.fillRect(random() * width, random() * height, 2, 2);
    }
  }
  const asphalt = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#363f47';
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 14000);
    ctx.fillStyle = '#e6cc7d';
    ctx.fillRect(125, 0, 2, h);
    ctx.fillRect(130, 0, 2, h);
    ctx.fillStyle = '#ddd9bf';
    for (const x of [18, 236]) ctx.fillRect(x, 0, 2, h);
    for (const x of [67, 190]) {
      for (let y = 0; y < h; y += 128) ctx.fillRect(x, y, 2, 55);
    }
  });
  const sidewalk = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c7c1b0';
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 6000);
    ctx.strokeStyle = '#a5a293';
    ctx.lineWidth = 2;
    for (let p = 0; p <= 256; p += 64) {
      ctx.strokeRect(p, 0, 64, 256);
      ctx.strokeRect(0, p, 256, 64);
    }
  });
  const sand = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e5c394';
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 19000);
  });
  const facades = ['#f6c1b0', '#97c9c6', '#ead8ac', '#c6b2d8', '#7294a7'].map(color => {
    return canvasTexture(256, 512, (ctx, w, h) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, 5000);
      for (let y = 24; y < h; y += 64) {
        ctx.fillStyle = '#ffffff38';
        ctx.fillRect(0, y + 43, w, 5);
        for (let x = 17; x < w; x += 56) {
          ctx.fillStyle = '#f4f1cf';
          ctx.fillRect(x - 3, y - 3, 37, 43);
          ctx.fillStyle = random() > 0.65 ? '#efb865' : '#264a5c';
          ctx.fillRect(x, y, 31, 37);
          ctx.fillStyle = '#ffffff38';
          ctx.fillRect(x + 4, y + 3, 4, 30);
          ctx.fillStyle = '#182f3b';
          ctx.fillRect(x, y + 19, 31, 2);
        }
      }
    });
  });
  return { asphalt, sidewalk, sand, facades };
}

export function signTexture(text, color = '#7cffe0', background = '#142a35') {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.font = `bold ${text.length > 13 ? 30 : 41}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2);
  });
}
