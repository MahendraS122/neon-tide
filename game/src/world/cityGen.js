// The city layout is the single source of roads, districts, collision boxes and sidewalks.
import * as THREE from '../../vendor/three.module.min.js';
import { seededRandom } from '../render/textures.js';
import { box, surface, batchStatic } from './geometry.js';
import { createBuilding, createSign } from './buildings.js';
import { createPalm, createStreetLamp, createBench, createTrafficLight } from './props.js';
import { createOcean } from './ocean.js';
import { createPort, createPier } from './landmarks.js';

export const ROAD_X = [-204, -128, -52, 24, 100];
export const ROAD_Z = [-188, -112, -36, 40, 116, 192];
export const ROAD_WIDTH = 16;
export const CITY_BOUNDS = { minX: -240, maxX: 139, minZ: -220, maxZ: 273 };
export const STREET_NAMES = ['Marina Way', 'Paloma Avenue', 'Solstice Street', 'Reyes Boulevard', 'Ocean Drive'];

export function districtAt(x, z) {
  if (z > 197) return 'Solara Container Port';
  if (x > 112) return z < -80 ? 'Solara Pier' : 'Sunbreak Beach';
  if (x > 48) return 'Ocean Drive';
  if (z < 10 && x > -155) return 'Glasswater Downtown';
  if (x < -155) return 'Las Palmas';
  return z > 110 ? 'Little Sol' : 'Reyes Park';
}

function groundPlane(parent, x, z, width, depth, material, y = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createCity(scene, textures) {
  const root = new THREE.Group();
  scene.add(root);
  const random = seededRandom(7701);
  const colliders = [];
  const windowMaterials = [];
  const lampLights = [];
  const signals = [];
  groundPlane(root, -64, 25, 368, 500, surface('#9baf8b'), -0.08);
  const sand = textures.sand.clone();
  sand.repeat.set(7, 80);
  groundPlane(root, 129, 25, 38, 500, new THREE.MeshStandardMaterial({ map: sand }), -0.02);
  for (const x of ROAD_X) {
    const map = textures.asphalt.clone();
    map.repeat.set(1, 8);
    groundPlane(root, x, 2, ROAD_WIDTH, 396, new THREE.MeshStandardMaterial({ map, roughness: 0.94 }), 0.02);
  }
  for (const z of ROAD_Z) {
    const map = textures.asphalt.clone();
    map.repeat.set(1, 6.5);
    const road = groundPlane(root, -52, z, ROAD_WIDTH, 320,
      new THREE.MeshStandardMaterial({ map, roughness: 0.94 }), 0.025);
    road.rotation.z = Math.PI / 2;
  }
  for (const x of ROAD_X) {
    for (const z of ROAD_Z) {
      box(root, x, 0.035, z, 16.2, 0.025, 16.2, '#3c464b');
      for (const sign of [-1, 1]) {
        for (let stripe = -5; stripe < 6; stripe += 2) {
          box(root, x + stripe, 0.06, z + sign * 9.8, 1.2, 0.02, 2.6, '#e5dfc7');
          box(root, x + sign * 9.8, 0.06, z + stripe, 2.6, 0.02, 1.2, '#e5dfc7');
        }
      }
      if (x > -150 && z > -180) {
        signals.push({ x, z, lenses: createTrafficLight(root, x - 10, z - 10), axis: 0 });
        signals.push({ x, z, lenses: createTrafficLight(root, x + 10, z + 10, Math.PI), axis: 1 });
      }
    }
  }
  let index = 0;
  for (let column = 0; column < ROAD_X.length - 1; column += 1) {
    for (let row = 0; row < ROAD_Z.length - 1; row += 1) {
      const x = (ROAD_X[column] + ROAD_X[column + 1]) / 2;
      const z = (ROAD_Z[row] + ROAD_Z[row + 1]) / 2;
      const map = textures.sidewalk.clone();
      map.repeat.set(8, 8);
      box(root, x, 0.1, z, 59.5, 0.24, 59.5, new THREE.MeshStandardMaterial({ map, roughness: 0.9 }));
      if (column === 1 && row === 3) {
        box(root, x, 0.24, z, 46, 0.1, 46, '#779c70');
        box(root, x, 0.3, z, 4, 0.1, 48, '#e0d3ad');
        box(root, x, 0.31, z, 48, 0.1, 4, '#e0d3ad');
        const fountain = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 0.6, 24), surface('#c3c9bb'));
        fountain.position.set(x, 0.6, z);
        root.add(fountain);
        const pool = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.05, 24), surface('#65b9bd', 0.12));
        pool.position.set(x, 0.93, z);
        root.add(pool);
        for (const dx of [-17, 17]) {
          for (const dz of [-17, 17]) createPalm(root, x + dx, z + dz, 1.1, random() * 6);
          createBench(root, x + dx, z + 4);
        }
        continue;
      }
      const beachfront = column === 3;
      const tower = !beachfront && column > 0 && row < 3;
      const offsets = beachfront ? [[7, -14], [7, 15]] : [[-14, -14], [14, 14], [-14, 14], [14, -14]];
      for (const [dx, dz] of offsets) {
        const height = beachfront ? 10 + random() * 8 : tower ? 25 + random() * 57 : 5 + random() * 8;
        const spec = {
          x: x + dx, z: z + dz,
          width: beachfront ? 29 : 17 + random() * 5,
          depth: beachfront ? 23 : 17 + random() * 5,
          height, style: beachfront ? 'deco' : tower ? 'tower' : 'home', index: index++
        };
        colliders.push(createBuilding(root, spec, textures, windowMaterials));
      }
    }
  }
  for (let z = -208; z < 193; z += 18) {
    createPalm(root, 111, z, 0.9 + random() * 0.3, random() * 6);
    createPalm(root, 87.5, z + 7, 0.85 + random() * 0.25, random() * 6);
    if (z % 36 === -28 || Math.round(z) % 3 === 0) createBench(root, 115, z + 5, Math.PI / 2);
  }
  for (const x of ROAD_X) {
    for (let z = -175; z < 192; z += 38) {
      const nearSpawn = x === 100 && z > -30 && z < 70;
      const light = createStreetLamp(root, x + 10.2, z, -1, nearSpawn);
      if (light) lampLights.push(light);
      if (x < 90 && Math.abs(z % 76) > 10) createPalm(root, x + 12, z + 12, 0.85, random() * 6);
    }
  }
  createSign(root, 'PORT SOLARA', 117, 3, 40, 12, '#ffcd86', -Math.PI / 2);
  createSign(root, 'CLUB SOLARA', 52, 6, -24, 16, '#ff71cf');
  createSign(root, 'TIDE BAR', 79, 4.4, 65, 10, '#6bffec', Math.PI / 2);
  createPort(root, random, colliders);
  const pier = createPier(root);
  const ocean = createOcean(root);
  batchStatic(root);
  let night = false;
  function update(dt, time, isNight) {
    pier.update(dt);
    ocean.update(time, isNight);
    signals.forEach(signal => {
      const green = Math.floor(time / 12) % 2 === signal.axis;
      signal.lenses.forEach((lens, i) => {
        lens.emissiveIntensity = (green && i === 2) || (!green && i === 0) ? 2 : 0;
      });
    });
    if (night === isNight) return;
    night = isNight;
    windowMaterials.forEach(material => { material.emissiveIntensity = night ? 0.65 : 0.08; });
    lampLights.forEach(light => { light.intensity = night ? 150 : 0; });
  }
  return { root, colliders, signals, update, districtAt, bounds: CITY_BOUNDS, roadX: ROAD_X, roadZ: ROAD_Z };
}
