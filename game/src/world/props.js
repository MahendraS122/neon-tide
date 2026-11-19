// Sculpted palms, boulevard lighting and street furniture are generated from shared geometry.
import * as THREE from '../../vendor/three.module.min.js';
import { box, cylinder, beam, surface } from './geometry.js';

const leafMaterial = surface('#3d7650');
const leafGeometry = new THREE.BufferGeometry();
const vertices = [];
const indices = [];
for (let i = 0; i <= 8; i += 1) {
  const t = i / 8;
  const width = Math.sin(t * Math.PI) * 0.46;
  const y = Math.sin(t * Math.PI) * 0.8 - t * t * 1.1;
  vertices.push(-width, y, t * 4.4, width, y, t * 4.4);
  if (i < 8) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
}
leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
leafGeometry.setIndex(indices);
leafGeometry.computeVertexNormals();
leafMaterial.side = THREE.DoubleSide;
const lampMaterial = new THREE.MeshStandardMaterial({ color: '#ffdda0', emissive: '#ffbc66', emissiveIntensity: 2 });

export function createPalm(parent, x, z, scale = 1, angle = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = angle;
  group.scale.setScalar(scale);
  parent.add(group);
  beam(group, [0, 0, 0], [0.45, 6.8, 0.2], 0.22, '#8a7660');
  for (let y = 0.5; y < 6.6; y += 0.5) {
    cylinder(group, y * 0.066, y, y * 0.03, 0.235, 0.06, '#a59373');
  }
  for (let i = 0; i < 9; i += 1) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.set(0.45, 6.7 + (i % 2) * 0.15, 0.2);
    leaf.rotation.y = i * Math.PI * 2 / 9;
    leaf.rotation.x = i % 2 ? 0.15 : -0.16;
    leaf.castShadow = true;
    group.add(leaf);
  }
  cylinder(group, 0.45, 6.6, 0.2, 0.38, 0.6, '#66814c');
}

export function createStreetLamp(parent, x, z, face = 1, withLight = false) {
  cylinder(parent, x, 3.8, z, 0.09, 7.6, '#374e52');
  cylinder(parent, x, 0.2, z, 0.22, 0.4, '#496061');
  beam(parent, [x, 7.6, z], [x + face * 1.8, 7.9, z], 0.09, '#374e52');
  box(parent, x + face * 1.8, 7.8, z, 0.85, 0.18, 0.5, '#394e53');
  box(parent, x + face * 1.8, 7.69, z, 0.65, 0.04, 0.38, lampMaterial);
  if (!withLight) return null;
  const light = new THREE.PointLight('#ffd295', 0, 22, 2);
  light.position.set(x + face * 1.8, 6.8, z);
  parent.add(light);
  return light;
}

export function createBench(parent, x, z, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  parent.add(group);
  for (let i = 0; i < 4; i += 1) {
    box(group, 0, 0.55, i * 0.16 - 0.24, 1.9, 0.09, 0.12, '#a17e58');
    box(group, 0, 0.8 + i * 0.13, -0.35, 1.9, 0.09, 0.09, '#a17e58');
  }
  for (const side of [-0.7, 0.7]) box(group, side, 0.28, 0, 0.09, 0.5, 0.65, '#354d50');
}

export function createTrafficLight(parent, x, z, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  parent.add(group);
  cylinder(group, 0, 2.7, 0, 0.09, 5.4, '#43575a');
  box(group, 0, 5.35, 1.8, 0.12, 0.12, 3.6, '#43575a');
  box(group, 0, 4.95, 3.5, 0.45, 1.15, 0.4, '#25373a');
  const lights = [];
  ['#ff4d51', '#ffbf59', '#80e5ad'].forEach((color, index) => {
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: index === 2 ? 2 : 0 });
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), material);
    lens.position.set(0, 5.3 - index * 0.34, 3.72);
    group.add(lens);
    lights.push(material);
  });
  return lights;
}
