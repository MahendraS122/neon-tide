// Buildings, one lot at a time. Each tower is a textured body whose UVs are scaled so windows keep
// a constant size on any wall, a roof cap with a parapet lip, a lit shopfront band at street level
// and rooftop clutter. Rather than one mesh per part, geometry is filed into buckets keyed by
// material and merged once at the end: the whole skyline then costs about a dozen draw calls.
import * as THREE from 'three';
import { LOT_HALF, PALETTE, CURB_HEIGHT, BLOCK_CENTERS } from '../config.js';
import { facadeTexture, glassTexture, signTexture, surfaceTexture } from '../render/textures.js';
import { createDice } from '../random.js';
import { mergeGeometries } from './mergeGeometry.js';
/** Shop names the city is signed with; original to Port Solara. */
export const SHOP_NAMES =['TIDE MART', 'SOLARA LIQUOR', 'PALM DELI', 'CASA VERDE', 'NEON NOODLE',
'SALT & VINYL', 'PIER 9 PAWN', 'LAGUNA CAFE', 'BRISA BAKERY', 'GOLD COAST TATTOO', 'VELVET ROOM',
'MARLIN BAIT', 'SUNSPOT LAUNDRY', 'CORAL MOTORS', 'COPPER KETTLE',];
const NEON_WORDS =['HOTEL', 'MOTEL', 'CLUB', 'ARCADE', 'DINER', 'PAWN', 'SURF', 'BAR', 'TATTOO',
'GYM', 'VINYL', 'CINEMA', 'LOBSTER', 'RADIO'];
/** Metres of facade one tile of the texture covers, so windows stay a human size. */
const TILE = 9;
/**
* A box whose side-face UVs are scaled to the wall's real size (so the facade texture repeats
* rather than stretches). The top and bottom faces get zero-area UVs, since a roof cap covers them.
*/
function facadeBox(w, h, d) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const uv = geometry.attributes.uv;
  // BoxGeometry groups: 0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z, four vertices each.
  for (let i = 0; i < uv.count; i += 1) {
    const face = Math.floor(i / 4);
    let u = uv.getX(i);
    let v = uv.getY(i);
    if (face === 0 || face === 1) u *= Math.max(1, Math.round(d / TILE));
    else if (face === 4 || face === 5) u *= Math.max(1, Math.round(w / TILE));
    else {
      u = 0;
      v = 0;
    }
    if (face < 2 || face > 3) v *= Math.max(1, Math.round(h / TILE));
    uv.setXY(i, u, v);
  }
  return geometry;
}
export function createBuildingKit() {
/** material → array of {geometry, matrix}. Merged into one mesh per material at bake time. */
const buckets = new Map();
const signMeshes =[];
function file(material, geometry, matrix) {
  let list = buckets.get(material);
  if (!list) {
    list =[];
    buckets.set(material, list);
  }
  list.push({ geometry, matrix });
}
const facadeCache = new Map();
function facadeMaterial(style, tint, variant) {
  const key = `${style}:${tint}:${variant}`;
  let material = facadeCache.get(key);
  if (!material) {
    const texture = style === 'glass' ? glassTexture(tint, 900 + variant): facadeTexture(style,
    tint, 900 + variant);
    material = new THREE.MeshStandardMaterial({
      map: texture, roughness: style === 'glass' ? 0.28: 0.82, metalness: style === 'glass' ? 0.34:
      0.03, envMapIntensity: 0.8,
    });
    facadeCache.set(key, material);
  }
  return material;
}
const roofMaterial = new THREE.MeshStandardMaterial({ map: surfaceTexture('#948b7d', 'roof', { seams:
true }), roughness: 0.94, });
const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf4ead6, roughness: 0.68 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: 0.5, metalness:
0.6 });
const shopMaterial = new THREE.MeshStandardMaterial({ map: surfaceTexture('#232733', 'shopband'),
roughness: 0.45, metalness: 0.25, });
const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffd8a2 });
/**
* Raise one tower. `variant` picks which facade texture out of the district's small pool it
* uses, so a street's buildings share a handful of materials and can be merged together.
*/
function addTower(opts, colliders) {
  const { x, z, w, d, height, style, tint, variant } = opts;
  const base = CURB_HEIGHT;
  const material = facadeMaterial(style, tint, variant);
  const bodyMatrix = new THREE.Matrix4().makeTranslation(x, base + height / 2, z);
  file(material, facadeBox(w, height, d), bodyMatrix);
  let crownTop = base + height;
  if (style === 'deco' && height > 20) {
    const cw = w * 0.64;
    const cd = d * 0.64;
    const crownH = Math.min(9, 2.5 + height * 0.09);
    const crownMatrix = new THREE.Matrix4().makeTranslation(x, base + height + crownH / 2, z);
    file(material, facadeBox(cw, crownH, cd), crownMatrix);
    crownTop = base + height + crownH;
    // A neon pinstripe under the crown: a thin emissive ring round the setback.
    const stripeMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.neon[variant % PALETTE.neon.length] });
    const stripe = new THREE.Matrix4().makeTranslation(x, base + height + 0.2, z);
    file(stripeMaterial, new THREE.BoxGeometry(w * 0.66 + 0.2, 0.22, d * 0.66 + 0.2), stripe);
  }
  // Roof: a cap slab plus a low parapet wall, filed separately from the facade.
  const cap = new THREE.Matrix4().makeTranslation(x, crownTop + 0.3, z);
  file(roofMaterial, new THREE.BoxGeometry(w + 0.5, 0.6, d + 0.5), cap);
  const parapet = new THREE.Matrix4().makeTranslation(x, crownTop + 0.85, z);
  file(trimMaterial, new THREE.BoxGeometry(w + 0.8, 0.5, d + 0.8), parapet);
  // Ground-floor retail band and its lit shopfront windows.
  const bandH = 3.6;
  const band = new THREE.Matrix4().makeTranslation(x, base + bandH / 2, z);
  file(shopMaterial, new THREE.BoxGeometry(w + 0.3, bandH, d + 0.3), band);
  // Which sides face a street: pick the two nearest lot edges and light those.
  const faces =[{ sx: 0, sz: -(d / 2), rx: 0 }, { sx: 0, sz: d / 2, rx: 0 }, { sx: -(w / 2), sz:
  0, rx: Math.PI / 2 }, { sx: w / 2, sz: 0, rx: Math.PI / 2 },];
  const rand = createDice(variant * 131 + Math.round(x + z));
  for (const face of faces.slice(0, 4)) {
    if (!rand.chance(0.55)) continue;
    const width = face.rx === 0 ? w * 0.8: d * 0.8;
    const matrix = new THREE.Matrix4().makeTranslation(x + face.sx * 1.02, base + 1.5, z + face.sz * 1.02);
    if (face.rx !== 0) matrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
    file(glowMaterial, new THREE.PlaneGeometry(width, 2.0), matrix);
  }
  // Rooftop clutter: plant boxes and an aerial.
  const clutter = rand.int(1, 3);
  for (let i = 0; i < clutter; i += 1) {
    const bw = rand.range(1.4, 3.0);
    const bd = rand.range(1.4, 3.0);
    const bh = rand.range(0.8, 2.0);
    const matrix = new THREE.Matrix4().makeTranslation(x + rand.jitter(Math.max(0, w / 2 - bw)),
    crownTop + 0.6 + bh / 2, z + rand.jitter(Math.max(0, d / 2 - bd)),);
    file(metalMaterial, new THREE.BoxGeometry(bw, bh, bd), matrix);
  }
  if (rand.chance(0.5)) {
    const mastH = rand.range(3.5, 7);
    const matrix = new THREE.Matrix4().makeTranslation(x + rand.jitter(w / 4), crownTop + 0.6 + mastH / 2,
    z + rand.jitter(d / 4));
    file(metalMaterial, new THREE.CylinderGeometry(0.07, 0.07, mastH, 5), matrix);
  }
  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, top: crownTop,
  });
  return crownTop;
}
/** A lit neon blade off a facade, facing along -Z (axis 'z') or -X (axis 'x'). */
function addSign({ x, y, z, axis, colour, text, sub, width = 7.4 }) {
  const texture = signTexture(text, colour, sub);
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.25), material);
  if (axis === 'x') mesh.rotation.y = Math.PI / 2;
  mesh.position.set(x, y, z);
  signMeshes.push(mesh);
}
/** Merge every bucket into one mesh per material and hang them under `parent`. */
function bake(parent) {
  let meshes = 0;
  for (const[material, parts] of buckets) {
    if (parts.length === 0) continue;
    const geometry = mergeGeometries(parts);
    const mesh = new THREE.Mesh(geometry, material);
    const unlit = material.isMeshBasicMaterial;
    mesh.castShadow = !unlit;
    mesh.receiveShadow = !unlit;
    parent.add(mesh);
    meshes += 1;
  }
  for (const sign of signMeshes) parent.add(sign);
  return meshes + signMeshes.length;
}
return { addTower, addSign, bake, facadeMaterial, roofMaterial, trimMaterial, metalMaterial, NEON_WORDS };
}
/**
* Fill one block: one to three footprints around a courtyard, each raised as a tower, plus one or
* two neon signs over the street. `style` comes from the district.
*/
export function fillBlock(kit, colliders, block, neonWords) { const { cx, cz, style, index, tintPool,
signChance } = block;
const rand = createDice(index * 7919 + 131);
const lots = style === 'glass' ? rand.int(1, 2): rand.int(1, 3);
const palette = tintPool.length ? tintPool: PALETTE.deco;
const facadeStyle = style === 'glass' ? 'glass': style === 'apartment' ? 'apartment': 'deco';
if (lots === 1) {
  const w = rand.range(LOT_HALF * 1.35, LOT_HALF * 1.85);
  const d = rand.range(LOT_HALF * 1.35, LOT_HALF * 1.85);
  kit.addTower({
    x: cx, z: cz, w, d, height: pickHeight(style, rand), style: facadeStyle, tint: rand.pick(palette),
    variant: rand.int(0, 7),
  }, colliders);
}
else {
  const span = LOT_HALF * 1.75;
  const along = rand.chance(0.5);
  for (let i = 0; i < lots; i += 1) {
    const t = i /(lots - 1);
    const offset =(t - 0.5) * span;
    const w = rand.range(LOT_HALF * 0.62, LOT_HALF * 0.92);
    const d = rand.range(LOT_HALF * 0.62, LOT_HALF * 0.92);
    kit.addTower({
      x: cx +(along ? offset: 0) + rand.jitter(1.5), z: cz +(along ? 0: offset) + rand.jitter(1.5),
      w, d, height: pickHeight(style, rand) * rand.range(0.65, 1.0), style: facadeStyle, tint: rand.pick(palette),
      variant: rand.int(0, 7),
    }, colliders);
  }
}
const signs = rand.int(0, signChance ?? 2);
for (let i = 0; i < signs; i += 1) {
  const colour = rand.pick(PALETTE.neon);
  const text = rand.pick(neonWords);
  const y = rand.range(7, 21);
  if (rand.chance(0.5)) {
    kit.addSign({
      x: cx + rand.jitter(LOT_HALF * 0.5), y, z: cz - LOT_HALF * 0.92, axis: 'z', colour, text,
      sub: 'PORT SOLARA'
    });
  }
  else {
    kit.addSign({
      x: cx - LOT_HALF * 0.92, y, z: cz + rand.jitter(LOT_HALF * 0.5), axis: 'x', colour, text,
      sub: 'PORT SOLARA'
    });
  }
}
} function pickHeight(style, rand) {
  if (style === 'glass') return rand.range(44, 108);
  if (style === 'apartment') return rand.range(15, 34);
  if (style === 'port') return rand.range(8, 16);
  return rand.range(11, 27);
}
