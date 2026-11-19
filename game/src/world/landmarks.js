// Port cranes and a turning seaside observation wheel anchor the city skyline.
import * as THREE from '../../vendor/three.module.min.js';
import { box, cylinder, beam, surface } from './geometry.js';
import { createSign } from './buildings.js';

export function createPort(parent, random, colliders) {
  box(parent, -5, 0.04, 233, 210, 0.2, 78, '#7f8e8b');
  createSign(parent, 'PORT SOLARA / CARGO', -70, 8, 199, 22, '#ffcd7a');
  for (let i = 0; i < 28; i += 1) {
    const x = -84 + (i % 7) * 20;
    const z = 214 + Math.floor(i / 7) * 13;
    const layers = random() > 0.45 ? 2 : 1;
    const color = ['#b65848', '#3b747a', '#be974f', '#627f6b'][i % 4];
    for (let level = 0; level < layers; level += 1) {
      box(parent, x, 1.7 + level * 3.2, z, 14, 3.1, 5.5, color);
      for (let rib = -6.5; rib < 7; rib += 0.9) {
        box(parent, x + rib, 1.7 + level * 3.2, z + 2.8, 0.12, 2.8, 0.1, color);
      }
    }
    colliders.push({ minX: x - 7, maxX: x + 7, minZ: z - 2.8, maxZ: z + 2.8, height: 6.4 });
  }
  for (const x of [-65, 10, 83]) {
    for (const side of [-1, 1]) {
      beam(parent, [x + side * 8, 0, 260], [x + side * 5, 31, 260], 0.65, '#cf8847');
      beam(parent, [x + side * 8, 0, 244], [x + side * 5, 31, 252], 0.65, '#cf8847');
    }
    box(parent, x, 31, 266, 13, 2, 40, '#ddaa5c');
    box(parent, x + 2, 28.5, 259, 4.5, 3, 4, '#759b9c');
    beam(parent, [x - 5, 32, 250], [x, 42, 256], 0.28, '#dbac69');
    beam(parent, [x, 42, 256], [x, 32, 285], 0.15, '#6e7c78');
    beam(parent, [x, 31, 280], [x, 12, 280], 0.055, '#334f57');
    box(parent, x, 11.8, 280, 6, 0.4, 3.5, '#c6a065');
  }
}

export function createPier(parent) {
  box(parent, 179, 1, -108, 132, 0.6, 16, '#a89472');
  for (let x = 120; x < 242; x += 8) {
    for (const z of [-115.5, -100.5]) {
      cylinder(parent, x, 0, z, 0.24, 6, '#7a7767');
      box(parent, x, 2, z, 0.12, 1.5, 0.12, '#e0d5bd');
    }
  }
  for (const z of [-115.5, -100.5]) box(parent, 180, 2.5, z, 130, 0.1, 0.12, '#e0d5bd');
  box(parent, 221, 1, -108, 38, 0.6, 37, '#a89472');
  createSign(parent, 'SOLARA PIER', 125, 6, -108, 14, '#ffcf82', Math.PI / 2);
  for (const x of [195, 211]) {
    box(parent, x, 3.1, -112, 9, 4, 6, '#e4b4a4');
    box(parent, x, 5.4, -112, 10, 0.4, 7, '#89c1b4');
  }
  for (const z of [-111, -105]) {
    beam(parent, [211, 1.4, z], [224, 17, z], 0.34, '#e0dbc8');
    beam(parent, [237, 1.4, z], [224, 17, z], 0.34, '#e0dbc8');
  }
  const wheel = new THREE.Group();
  wheel.position.set(224, 17, -108);
  wheel.userData.dynamic = true;
  parent.add(wheel);
  const rimMaterial = surface('#f0dcc1', 0.45, 0.4);
  const rim = new THREE.TorusGeometry(13, 0.17, 6, 64);
  for (const z of [-1.3, 1.3]) {
    const ring = new THREE.Mesh(rim, rimMaterial);
    ring.position.z = z;
    wheel.add(ring);
  }
  const cabins = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = i * Math.PI / 8;
    const x = Math.cos(angle) * 13;
    const y = Math.sin(angle) * 13;
    beam(wheel, [0, 0, -1.3], [x, y, -1.3], 0.06, '#e9caae');
    beam(wheel, [0, 0, 1.3], [x, y, 1.3], 0.06, '#e9caae');
    const cabin = new THREE.Group();
    cabin.position.set(x, y, 0);
    wheel.add(cabin);
    box(cabin, 0, -1.3, 0, 1.9, 1.2, 2.1, i % 2 ? '#ec9c87' : '#72c5be');
    box(cabin, 0, -0.3, 0, 2.1, 0.15, 2.3, '#eee0bc');
    cabins.push(cabin);
  }
  return { update(dt) {
    wheel.rotation.z += dt * 0.055;
    cabins.forEach(cabin => { cabin.rotation.z = -wheel.rotation.z; });
  } };
}
