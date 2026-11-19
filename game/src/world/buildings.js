// Art-deco hotels, stepped towers and storefronts shape Solara's district skylines.
import * as THREE from '../../vendor/three.module.min.js';
import { box, cylinder, surface } from './geometry.js';
import { signTexture } from '../render/textures.js';

const palette = ['#eeb5a6', '#9cd6ca', '#e4d6ad', '#bbaed0', '#b6cccd'];
const names = ['THE MARIBEL', 'HOTEL CORAL', 'SOLSTICE', 'CASA LUNA', 'PALOMA', 'OCEAN ROYALE'];

export function createSign(parent, text, x, y, z, width, color = '#93ffe0', rotation = 0) {
  const material = new THREE.MeshStandardMaterial({
    map: signTexture(text, color), emissiveMap: signTexture(text, color),
    emissive: '#ffffff', emissiveIntensity: 0.65, roughness: 0.45
  });
  const sign = box(parent, x, y, z, width, width / 4, 0.12, material);
  sign.rotation.y = rotation;
  return sign;
}

export function createBuilding(parent, spec, textures, windowMaterials) {
  const { x, z, width: w, depth: d, height: h, style, index } = spec;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);
  const color = palette[index % palette.length];
  const plain = surface(style === 'tower' ? '#72979c' : color);
  const facadeMap = textures.facades[index % textures.facades.length].clone();
  facadeMap.repeat.set(Math.max(1, w / 12), Math.max(0.5, h / 22));
  const windowMap = textures.windows.clone();
  windowMap.repeat.copy(facadeMap.repeat);
  const facade = new THREE.MeshStandardMaterial({
    map: facadeMap, color: style === 'tower' ? '#729fb2' : '#ffffff',
    roughness: style === 'tower' ? 0.22 : 0.78,
    metalness: style === 'tower' ? 0.55 : 0.04,
    emissiveMap: windowMap, emissive: '#e6be75', emissiveIntensity: 0.08
  });
  windowMaterials.push({ material: facade, dayColor: style === 'tower' ? '#729fb2' : '#ffffff' });
  box(group, 0, h / 2 + 0.22, 0, w, h, d, facade);
  box(group, 0, h + 0.42, 0, w + 0.5, 0.42, d + 0.5, '#f7e7d0');
  box(group, 0, 0.4, 0, w + 0.4, 0.7, d + 0.4, '#e4d8c4');
  if (style === 'deco') {
    for (let y = 3.8; y < h; y += 3.4) {
      box(group, 0, y, 0, w + 0.6, 0.19, d + 0.6, '#fff0db');
    }
    box(group, w / 2 + 0.42, h / 2, 0, 0.85, h + 1.8, 3.4, '#fff0dc');
    box(group, w / 2 + 0.88, h / 2, 0, 0.12, h + 1.5, 0.3, '#63c9bc');
    for (let step = 0; step < 3; step += 1) {
      box(group, 0, h + 0.8 + step * 0.55, 0, w * (0.68 - step * 0.15), 0.55, d * 0.55, plain);
    }
    const sign = createSign(group, names[index % names.length], w / 2 + 0.92, h - 2.5, 0, w * 0.8);
    sign.rotation.y = Math.PI / 2;
    for (let localZ = -d / 2 + 2; localZ < d / 2; localZ += 3.3) {
      const awning = box(group, w / 2 + 1.1, 3.1, localZ, 2.4, 0.18, 2.9, '#517e7b');
      awning.rotation.z = -0.13;
      box(group, w / 2 + 0.13, 1.7, localZ, 0.08, 2.5, 2.5, surface('#244b55', 0.18, 0.4));
    }
    for (const localZ of [-d * 0.32, d * 0.32]) {
      cylinder(group, w / 2 + 1.6, 1.5, localZ, 0.16, 3, '#efdfc5');
    }
  } else if (style === 'tower') {
    for (let y = 5; y < h; y += 4.5) {
      box(group, 0, y, 0, w + 0.12, 0.15, d + 0.12, '#b6cbd0');
    }
    for (let localX = -w / 2; localX <= w / 2; localX += 4) {
      box(group, localX, h / 2, d / 2 + 0.06, 0.12, h, 0.12, '#bcd5d7');
    }
    box(group, 0, h + 1.7, 0, w * 0.65, 2.2, d * 0.65, plain);
    cylinder(group, 0, h + 5, 0, 0.15, 6, '#d3d9d4');
  } else {
    box(group, 0, 3, d / 2 + 0.8, w + 0.2, 0.4, 2, palette[(index + 2) % palette.length]);
    if (index % 3 === 0) createSign(group, 'SOLARA MARKET', 0, 3.8, d / 2 + 0.3, w * 0.8);
    for (const localX of [-w / 3, w / 3]) {
      box(group, localX, 1.6, d / 2 + 0.06, w / 4, 2.5, 0.12, surface('#345462', 0.2));
    }
  }
  box(group, -w * 0.18, h + 0.8, -d * 0.15, 2.8, 1.2, 2.1, '#829493');
  return { minX: x - w / 2 - 0.7, maxX: x + w / 2 + 0.7,
    minZ: z - d / 2 - 0.7, maxZ: z + d / 2 + 0.7, height: h };
}
