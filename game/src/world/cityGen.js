// The city, assembled once at boot from the module's parts. Streets run along ROADS on both axes;
// the six-by-six blocks between them carry a raised pavement, a ring of street furniture and one
// to three buildings. West of Ocean Drive are the promenade, the sand and the sea; the pier runs
// out over the water. Everything the rest of the game asks about the world (surface height, what
// is solid, which district a point is in) lives here.
import * as THREE from 'three';
import { CITY, LOT_HALF, PALETTE, ROADS, ROAD_HALF, CURB_HEIGHT, BLOCK_HALF, BLOCK_CENTERS, PITCH,
} from '../config.js';
import { surfaceTexture, grassTexture } from '../render/textures.js';
import { buildGround } from './ground.js';
import { createDice } from '../random.js';
import { createBuildingKit, fillBlock } from './buildings.js';
import { createPropsKit, buildPier } from './props.js';
import { mergeGeometries } from './mergeGeometry.js';
/**
* Districts by block grid index: column 0 is the beach side, row 0 the south end. Each carries the
* look of its buildings, how many signs it gets, and the name the HUD shows there.
*/
export const DISTRICTS =[{ id: 'shore', name: 'Shoreline', cols:[0], rows:[0, 1, 2], style: 'deco',
neon: 2, palms: true }, { id: 'ocean', name: 'Ocean Drive', cols:[0], rows:[3, 4, 5], style: 'deco',
neon: 3, palms: true }, { id: 'neon', name: 'Neon Row', cols:[1], rows:[1, 2, 3], style: 'deco',
neon: 4, palms: true }, { id: 'downtown', name: 'Solara Heights', cols:[2, 3], rows:[2, 3, 4], style:
'glass', neon: 1 }, {
  id: 'lagoon', name: 'Lagoon Quarter', cols:[1, 2], rows:[0], style: 'apartment', neon: 2, palms:
  true
}, {
  id: 'palms', name: 'Palm Grove', cols:[4, 5], rows:[3, 4, 5], style: 'apartment', neon: 1, palms:
  true
}, {
  id: 'mills', name: 'Sunset Mills', cols:[3, 4], rows:[0, 1], style: 'apartment', neon: 1, palms:
  true
}, { id: 'port', name: 'Crane Port', cols:[5], rows:[0, 1, 2], style: 'port', neon: 0 }, { id: 'yards',
name: 'Container Yards', cols:[5], rows:[3, 4, 5], style: 'port', neon: 0 },];
/** Which district a world position falls in, for the HUD's location line. */
export function districtAt(x, z) { if (x < CITY.promenadeX + 26) return { id: 'beach', name: x < CITY.beachX ?
'Solara Beach': 'The Promenade' };
if (x > 300) return { id: 'port', name: 'Crane Port' };
const col = nearestIndex(x, BLOCK_CENTERS);
const row = nearestIndex(z, BLOCK_CENTERS);
for (const district of DISTRICTS) {
  if (district.cols.includes(col) && district.rows.includes(row)) return district;
}
return { id: 'city', name: 'Port Solara' };
} function nearestIndex(value, list) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < list.length; i += 1) {
    const d = Math.abs(value - list[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
/** Which road centre is nearest a coordinate: -1 outside the grid. */
export function nearestRoadIndex(value) { let best = - 1;
let bestDist = ROAD_HALF + 0.5;
for (let i = 0; i < ROADS.length; i += 1) {
  const d = Math.abs(value - ROADS[i]);
  if (d < bestDist) {
    bestDist = d;
    best = i;
  }
}
return best;
}
/**
* Build the world. Returns collision boxes, the surface sampler, the pier, the landmark positions
* the missions and map use, and an update hook for the animated bits.
*/
export function generateCity(scene, seed = 1337) { const root = new THREE.Group();
root.name = 'city';
scene.add(root);
const colliders =[];
const kit = createBuildingKit();
const props = createPropsKit();
const dice = createDice(seed);
/* ---- the ground: asphalt, promenade, sand, markings and pavement slabs ---- */
const groundKit = buildGround(root);
const walkWidth = groundKit.walkWidth;
/* ---- a ring of earth beyond the city, so the asphalt's edge never shows ---- */
const outer = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ color:
0x6d6656, roughness: 1 }),);
outer.rotation.x = - Math.PI / 2;
outer.position.y = - 0.12;
outer.receiveShadow = true;
root.add(outer);
/* ---- blocks: buildings, then parks ---- */
const blocks =[];
let index = 0;
BLOCK_CENTERS.forEach((cx, col) => {
  BLOCK_CENTERS.forEach((cz, row) => {
    index += 1;
    const district = DISTRICTS.find((d) => d.cols.includes(col) && d.rows.includes(row)) ?? DISTRICTS[0];
    blocks.push({ cx, cz, col, row, style: district.style, index });
  });
});
const parkBlocks = blocks.filter((b) => PARKS.has(`${b.col},${b.row}`));
const portBlocks = blocks.filter((b) => b.style === 'port');
for (const block of blocks) {
  if (PARKS.has(`${block.col},${block.row}`)) continue;
  if (block.style === 'port') continue;
  fillBlock(kit, colliders, {
    ...block, tintPool: block.style === 'glass' ? PALETTE.glass: PALETTE.deco, signChance: block.style === 'glass' ?
    0: 2,
  }, kit.NEON_WORDS);
}
kit.bake(root);
/* ---- parks: lawn, fountain, benches ---- */
const grass = grassTexture();
for (const block of parkBlocks) {
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(LOT_HALF * 2 + 4, LOT_HALF * 2 + 4), new THREE.MeshStandardMaterial({ map:
  grass, roughness: 0.96 }),);
  lawn.rotation.x = - Math.PI / 2;
  lawn.position.set(block.cx, CURB_HEIGHT + 0.03, block.cz);
  lawn.receiveShadow = true;
  root.add(lawn);
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.6, 0.9, 20), new THREE.MeshStandardMaterial({ color:
  0xece4d2, roughness: 0.72 }),);
  basin.position.set(block.cx, CURB_HEIGHT + 0.45, block.cz);
  basin.castShadow = true;
  basin.receiveShadow = true;
  root.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(5.4, 20), new THREE.MeshStandardMaterial({ color:
  0x3f9fb0, roughness: 0.08, metalness: 0.35 }),);
  water.rotation.x = - Math.PI / 2;
  water.position.set(block.cx, CURB_HEIGHT + 0.88, block.cz);
  root.add(water);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 3.6, 12), new THREE.MeshStandardMaterial({ color:
  0xf2ead8, roughness: 0.62 }),);
  column.position.set(block.cx, CURB_HEIGHT + 2.5, block.cz);
  column.castShadow = true;
  root.add(column);
  colliders.push({
    minX: block.cx - 6.6, maxX: block.cx + 6.6, minZ: block.cz - 6.6, maxZ: block.cz + 6.6, top:
    CURB_HEIGHT + 0.95
  });
}
/* ---- street furniture, merged to a handful of meshes ---- */
const palmProtos =[props.palm(3), props.palm(8), props.palm(12), props.palm(29), props.palm(41)];
const lampProto = props.streetLamp();
const benchProto = props.bench();
const hydrantProto = props.hydrant();
const bollardProto = props.bollard();
const lightProto = props.trafficLight();
/** Bake a prototype into a per-material matrix list at a world transform. */
function stamp(proto, map, x, y, z, rotY, scale = 1) {
  proto.updateMatrixWorld(true);
  const base = new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(rotY)).multiply(new THREE.Matrix4().makeScale(scale,
  scale, scale));
  proto.traverse((child) => {
    if (!child.isMesh) return;
    let list = map.get(child.material);
    if (!list) {
      list =[];
      map.set(child.material, list);
    }
    list.push({ geometry: child.geometry, matrix: base.clone().multiply(child.matrixWorld) });
  });
}
function bakeParts(parts, parent, cast = true) {
  for (const[material, list] of parts) {
    const mesh = new THREE.Mesh(mergeGeometries(list), material);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }
}
const palmMap = new Map();
const lampMap = new Map();
const benchMap = new Map();
const poleMap = new Map();
const redMap = new Map();
const edge = walkWidth / 2 - 2.0;
for (const bx of BLOCK_CENTERS) {
  for (const bz of BLOCK_CENTERS) {
    const col = nearestIndex(bx, BLOCK_CENTERS);
    const row = nearestIndex(bz, BLOCK_CENTERS);
    const district = DISTRICTS.find((d) => d.cols.includes(col) && d.rows.includes(row));
    const isPark = PARKS.has(`${col},${row}`);
    if (district?.style === 'port') continue;
    // Palms down the block edges: always on the beach side and in the leafy districts.
    if (col === 0 || district?.palms || isPark) {
      for (let t = - BLOCK_HALF + 5; t < BLOCK_HALF - 2; t += 12) {
        if (dice.chance(0.35)) continue;
        stamp(dice.pick(palmProtos), palmMap, bx - edge, CURB_HEIGHT, bz + t, dice.range(0, 6.28));
        if (dice.chance(0.6)) stamp(dice.pick(palmProtos), palmMap, bx + edge, CURB_HEIGHT, bz + t + 6,
        dice.range(0, 6.28));
      }
    }
    // Lamps on both pavement edges, staggered so they read as a line down the street.
    for (let t = - BLOCK_HALF + 9; t < BLOCK_HALF - 2; t += 26) {
      stamp(lampProto, lampMap, bx - edge + 0.6, CURB_HEIGHT, bz + t, 0);
      stamp(lampProto, lampMap, bx + edge - 0.6, CURB_HEIGHT, bz + t + 13, Math.PI);
    }
    // Benches, bollards, hydrants.
    for (let i = 0; i < 2; i += 1) {
      stamp(benchProto, benchMap, bx + dice.jitter(BLOCK_HALF * 0.45), CURB_HEIGHT, bz +(i ? 1:
      - 1) * edge, dice.range(0, 6.28));
    }
    for (let i = 0; i < 5; i += 1) {
      stamp(bollardProto, poleMap, bx + dice.jitter(BLOCK_HALF * 0.9), CURB_HEIGHT, bz + dice.jitter(BLOCK_HALF * 0.9),
      0);
    }
    stamp(hydrantProto, redMap, bx + dice.jitter(BLOCK_HALF * 0.85), CURB_HEIGHT, bz + dice.jitter(BLOCK_HALF * 0.85),
    0);
    // Traffic lights at the block's corners.
    for (const[sx, sz] of[[- 1, - 1],[1, 1]]) {
      stamp(lightProto, poleMap, bx + sx * edge, CURB_HEIGHT, bz + sz * edge, sx * sz > 0 ? Math.PI * 0.75:
      Math.PI * 0.25);
    }
  }
}
// The promenade: a double row of palms and a line of lamps down Ocean Drive's seaside.
for (let z = - CITY.extent + 10; z < CITY.extent; z += 10.5) {
  stamp(dice.pick(palmProtos), palmMap, CITY.promenadeX - 8 + dice.jitter(1.5), CURB_HEIGHT, z,
  dice.range(0, 6.28));
  stamp(dice.pick(palmProtos), palmMap, CITY.promenadeX + 9 + dice.jitter(1.5), CURB_HEIGHT, z + 5.2,
  dice.range(0, 6.28));
  if (Math.round(z) % 31 < 10) stamp(lampProto, lampMap, CITY.promenadeX + 20, CURB_HEIGHT, z, Math.PI * 0.5);
}
bakeParts(palmMap, root);
bakeParts(lampMap, root);
bakeParts(benchMap, root);
bakeParts(poleMap, root);
bakeParts(redMap, root);
/* ---- the beach ---- */
const beachMaterial = new THREE.MeshStandardMaterial({ map: surfaceTexture(PALETTE.sand, 'sand',
{ grainAmount: 0.16 }), roughness: 0.99, });
const beach = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(CITY.beachX - CITY.promenadeX) + 40,
0.5, CITY.extent * 2), beachMaterial);
beach.position.set((CITY.beachX + CITY.promenadeX) / 2 - 12, 0.06, 0);
beach.receiveShadow = true;
root.add(beach);
/* ---- the pier, out over the water, and the Ferris wheel on it ---- */
const pierStartX = CITY.promenadeX + 10;
const pier = buildPier(root, props, {
  x: pierStartX - CITY.pierLength / 2, z: CITY.pierZ, length: CITY.pierLength, width: CITY.pierWidth,
  deckY: 1.4,
});
const pierDeck = {
  minX: pierStartX - CITY.pierLength, maxX: pierStartX, minZ: CITY.pierZ - CITY.pierWidth / 2 + 1,
  maxZ: CITY.pierZ + CITY.pierWidth / 2 - 1, top: 1.4,
};
/* ---- the port: container stacks and cranes on the east blocks ---- */
const containerColours =[0xc8452f, 0x2f6fc8, 0x2f9c62, 0xd8a72f, 0xa8a8b0, 0x8f4fc8, 0x3a3f48];
const containerList = new Map();
const rand = createDice(77);
for (const block of portBlocks) {
  for (let i = 0; i < 9; i += 1) {
    const x = block.cx + rand.jitter(LOT_HALF * 0.8);
    const z = block.cz + rand.jitter(LOT_HALF * 0.8);
    const stacks = rand.int(1, 3);
    for (let s = 0; s < stacks; s += 1) {
      const colour = rand.pick(containerColours);
      let list = containerList.get(colour);
      if (!list) {
        list =[];
        containerList.set(colour, list);
      }
      list.push({
        geometry: new THREE.BoxGeometry(2.6, 2.6, 12.2), matrix: new THREE.Matrix4().makeTranslation(x,
        1.3 + s * 2.62, z).multiply(new THREE.Matrix4().makeRotationY(rand.chance(0.5) ? 0: Math.PI / 2)),
      });
    }
    colliders.push({ minX: x - 6.4, maxX: x + 6.4, minZ: z - 6.4, maxZ: z + 6.4, top: 2.7 });
  }
  // A warehouse shell on the block, so the port has mass.
  kit.addTower({
    x: block.cx + LOT_HALF * 0.55, z: block.cz - LOT_HALF * 0.55, w: 14, d: 22, height: 11, style:
    'deco', tint: '#a89e8e', variant: 3,
  }, colliders);
}
for (const[colour, list] of containerList) {
  const mesh = new THREE.Mesh(mergeGeometries(list), new THREE.MeshStandardMaterial({ color: colour,
  roughness: 0.72, metalness: 0.3 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
}
for (let i = 0; i < 5; i += 1) {
  const crane = props.crane(100 + i);
  crane.position.set(300 - i * 3, 0, - 230 + i * 115);
  root.add(crane);
}
kit.bake(root);
/* ---- limits and landmarks ---- */
const bounds = { minX: CITY.waterX + 60, maxX: 330, minZ: - CITY.extent - 20, maxZ: CITY.extent + 20 };
const landmarks = {
  safehouse: { x: - 235, z: 249, name: 'Dex\'s Safehouse' }, garage: { x: - 141, z: - 235, name:
  'Corallo Garage' }, raceStart: { x: 47, z: 141, name: 'Ocean Strip' }, boatYard: { x: 250, z:
  235, name: 'Crane Port Yard' }, pier: { x: pierStartX - 40, z: CITY.pierZ, name: 'Solara Pier' },
  downtown: { x: 141, z: 141, name: 'Solara Heights' }, neonRow: { x: - 141, z: 94, name: 'Neon Row' },
};
/** Height of the walkable surface: pier deck, beach, pavement slab, or road. */
function groundHeight(x, z) {
  if (x >= pierDeck.minX && x <= pierDeck.maxX + 4 && z >= pierDeck.minZ && z <= pierDeck.maxZ) {
    const ramp = Math.min(1,(pierDeck.maxX + 4 - x) / 8 + 0.55);
    return pierDeck.top * Math.min(1, ramp);
  }
  if (x < CITY.promenadeX + CITY.promenadeHalf + 4) return 0.06;
  for (const bx of BLOCK_CENTERS) {
    if (Math.abs(x - bx) > walkWidth / 2) continue;
    for (const bz of BLOCK_CENTERS) {
      if (Math.abs(z - bz) > walkWidth / 2) continue;
      return CURB_HEIGHT;
    }
  }
  return 0;
}
/** The building box a position overlaps, or null; walls only count if they are above the feet. */
function hitsBuilding(x, z, radius = 0.4, feetY = 0) {
  for (const box of colliders) {
    if (box.top < feetY + 0.3) continue;
    if (x + radius > box.minX && x - radius < box.maxX && z + radius > box.minZ && z - radius < box.maxZ) return box;
  }
  return null;
}
const state = { time: 0 };
function update(dt) {
  state.time += dt;
  pier.wheel.rotation.z += dt * 0.22;
}
return {
  root, colliders, bounds, landmarks, groundHeight, hitsBuilding, districtAt, update, pier, state,
  walkWidth, blocks, pierDeck, pierStartX,
};
}
/** Two blocks are kept as parks rather than built on (col,row). */
const PARKS = new Set(['1,5', '3,4']);
