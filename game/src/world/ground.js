// The ground under the city, built as three crisp layers rather than one giant painted image:
// a tiled asphalt texture that repeats every few metres (so it stays sharp under the camera), a
// raised promenade slab and a sand shelf, and then all the road markings as their own thin
// geometry merged into one mesh: centre dashes, kerb-edge lines and crosswalk bars. Separating the
// paint from the asphalt is what keeps the lane lines crisp at any distance.
import * as THREE from 'three';
import { CITY, ROADS, ROAD_HALF, CURB_HEIGHT, BLOCK_CENTERS, PITCH, PALETTE } from '../config.js';
import { surfaceTexture } from '../render/textures.js';
import { mergeGeometries } from './mergeGeometry.js';
/** Asphalt that tiles cleanly: mottled stone with a faint aggregate speckle. */
export function asphaltTexture() { return surfaceTexture('#43434a', 'asphalt', { grainAmount: 0.14 });
}
/**
* Build the ground group. Returns the group plus the pavement size, and leaves everything merged
* so the whole city floor is four or five draw calls.
*/
export function buildGround(root) { const span =(CITY.extent + 60) * 2;
const group = new THREE.Group();
group.name = 'ground';
root.add(group);
/* ---- asphalt base ---- */
const asphalt = asphaltTexture();
asphalt.repeat.set(span / 9, span / 9);
const road = new THREE.Mesh(new THREE.PlaneGeometry(span, span), new THREE.MeshStandardMaterial({ map:
asphalt, roughness: 0.97, metalness: 0 }),);
road.rotation.x = - Math.PI / 2;
road.receiveShadow = true;
group.add(road);
/* ---- promenade slab: pale paving, a step above the road, down the oceanfront ---- */
const paving = surfaceTexture('#c9bda9', 'walk', { seams: true });
paving.repeat.set(9, 40);
const promenade = new THREE.Mesh(new THREE.BoxGeometry(CITY.promenadeHalf * 2, CURB_HEIGHT, CITY.extent * 2 + 80),
new THREE.MeshStandardMaterial({ map: paving, roughness: 0.93 }),);
promenade.position.set(CITY.promenadeX, CURB_HEIGHT / 2, 0);
promenade.receiveShadow = true;
promenade.castShadow = true;
group.add(promenade);
/* ---- sand: a shelf from the promenade out to the water, with a wet strip ---- */
const sandTexture = surfaceTexture(PALETTE.sand, 'sand', { grainAmount: 0.16 });
sandTexture.repeat.set(14, 90);
const sandWidth = Math.abs(CITY.beachX - CITY.promenadeX + CITY.promenadeHalf);
const sand = new THREE.Mesh(new THREE.BoxGeometry(sandWidth, 0.4, CITY.extent * 2 + 80), new THREE.MeshStandardMaterial({ map:
sandTexture, roughness: 0.99 }),);
sand.position.set(CITY.promenadeX - CITY.promenadeHalf - sandWidth / 2, 0.05, 0);
sand.receiveShadow = true;
group.add(sand);
// Wet sand at the waterline, a slightly darker and glossier band.
const wet = new THREE.Mesh(new THREE.PlaneGeometry(14, CITY.extent * 2 + 80), new THREE.MeshStandardMaterial({ color:
0xb79a6e, roughness: 0.35, metalness: 0.15 }),);
wet.rotation.x = - Math.PI / 2;
wet.position.set(CITY.promenadeX - CITY.promenadeHalf - sandWidth + 7, 0.27, 0);
group.add(wet);
/* ---- road markings, as real geometry just above the asphalt ---- */
const paint = new THREE.MeshStandardMaterial({ color: 0xf2ead2, roughness: 0.72, emissive: 0x2a2823,
emissiveIntensity: 0.35, });
const parts =[];
const markY = 0.015;
const plane = new THREE.PlaneGeometry(1, 1);
const flat =(x, z, w, d) => new THREE.Matrix4().makeTranslation(x, markY, z).multiply(new THREE.Matrix4().makeRotationX(- Math.PI / 2)).multiply(new THREE.Matrix4().makeScale(w,
d, 1));
for (const road of ROADS) {
  // Centre dashes, 4.5 m of paint every 9 m, in both directions.
  for (let t = - CITY.extent; t < CITY.extent; t += 9) {
    parts.push({ geometry: plane, matrix: flat(road, t + 2.25, 0.3, 4.5) });
    parts.push({ geometry: plane, matrix: flat(t + 2.25, road, 4.5, 0.3) });
  }
  // Kerb-edge lines along both sides.
  for (const side of[- 1, 1]) {
    const offset = road + side *(ROAD_HALF - 0.8);
    parts.push({ geometry: plane, matrix: flat(offset, 0, 0.24, CITY.extent * 2) });
    parts.push({ geometry: plane, matrix: flat(0, offset, CITY.extent * 2, 0.24) });
  }
}
// Crosswalk bars on every approach to a junction.
for (const rx of ROADS) {
  for (const rz of ROADS) {
    for (const dir of[- 1, 1]) {
      for (let b = - ROAD_HALF + 1.4; b < ROAD_HALF - 1.2; b += 2.0) {
        parts.push({ geometry: plane, matrix: flat(rx + b, rz + dir *(ROAD_HALF + 1.6), 0.9, 3.0) });
        parts.push({ geometry: plane, matrix: flat(rx + dir *(ROAD_HALF + 1.6), rz + b, 3.0, 0.9) });
      }
    }
  }
}
const markings = new THREE.Mesh(mergeGeometries(parts), paint);
markings.receiveShadow = true;
markings.renderOrder = 1;
group.add(markings);
/* ---- the pavement slabs on every block are built by the city; here is their geometry ---- */
const walkWidth = PITCH - ROAD_HALF * 2;
const walkTexture = surfaceTexture('#cdc2ae', 'walk', { seams: true });
walkTexture.repeat.set(5, 5);
const walkMaterial = new THREE.MeshStandardMaterial({ map: walkTexture, roughness: 0.93 });
const kerbMaterial = new THREE.MeshStandardMaterial({ color: 0xb6aa95, roughness: 0.9 });
const walkParts =[];
const kerbParts =[];
for (const bx of BLOCK_CENTERS) {
  for (const bz of BLOCK_CENTERS) {
    walkParts.push({
      geometry: new THREE.BoxGeometry(walkWidth, CURB_HEIGHT, walkWidth), matrix: new THREE.Matrix4().makeTranslation(bx,
      CURB_HEIGHT / 2, bz),
    });
    // A slightly proud, darker kerb ring, so the step reads from a car.
    kerbParts.push({
      geometry: new THREE.BoxGeometry(walkWidth + 1.4, CURB_HEIGHT * 0.55, walkWidth + 1.4), matrix:
      new THREE.Matrix4().makeTranslation(bx, CURB_HEIGHT * 0.27, bz),
    });
  }
}
const kerbs = new THREE.Mesh(mergeGeometries(kerbParts), kerbMaterial);
kerbs.receiveShadow = true;
group.add(kerbs);
const walks = new THREE.Mesh(mergeGeometries(walkParts), walkMaterial);
walks.receiveShadow = true;
group.add(walks);
return { group, walkWidth, markings };
}
