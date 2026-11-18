// Pedestrians: figures that walk the pavement ring of a block on loop, in loose groups. They scatter
// from gunfire nearby, step aside from a car that is about to hit them, and dodge back the way they
// came when a building or a wall is in the way. Each one is a rig from character.js with its own
// colours, so a street reads as a crowd rather than a row of copies.
import * as THREE from 'three';
import { ROAD_HALF, CURB_HEIGHT, BLOCK_CENTERS, PITCH } from '../config.js';
import { createFigure, poseFigure } from './character.js';
import { createDice } from '../random.js';
import { turnTowards } from './player.js';

const SHIRTS = [0xd8a030, 0xd8d8de, 0x8f2f2f, 0x2f6f9c, 0x3f8f5f, 0xe8789a, 0x6f4f9c, 0x2a2a32, 0xf0e0c0, 0xc45a2f, 0x1f6f6f];
const TROUSERS = [0x323a44, 0x1d2532, 0x4a4a52, 0x2a3a52, 0x8f8570, 0x5a4636];
const SKINS = [0xe8b48c, 0xc98a5e, 0x8c5a3c, 0xf0c9a4, 0xb07a52];
const HAIRS = [0x2a1d14, 0x120f0c, 0x4a2c14, 0x6b3a1a, 0x8a8a8a, 0xd8c07a];

export function createPedestrians(scene, world, count = 44) {
  const dice = createDice(9001);
  const peds = [];
  const root = new THREE.Group();
  root.name = 'pedestrians';
  scene.add(root);
  const ring = PITCH - ROAD_HALF * 2;

  /** The four corners of a block's pavement ring, inset so a walker stays clear of the kerb. */
  function loopFor(bx, bz) {
    const half = ring / 2 - 2.2;
    return [
      { x: bx - half, z: bz - half },
      { x: bx + half, z: bz - half },
      { x: bx + half, z: bz + half },
      { x: bx - half, z: bz + half },
    ];
  }

  function spawn(near) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const bx = near ? near.x : dice.pick(BLOCK_CENTERS);
      const bz = near ? near.z : dice.pick(BLOCK_CENTERS);
      const loop = loopFor(bx, bz);
      const start = dice.int(0, 3);
      const figure = createFigure({
        shirt: dice.pick(SHIRTS),
        trousers: dice.pick(TROUSERS),
        skin: dice.pick(SKINS),
        hair: dice.pick(HAIRS),
      });
      const point = loop[start];
      const offsetX = dice.jitter(6);
      const offsetZ = dice.jitter(6);
      figure.root.position.set(point.x + offsetX, CURB_HEIGHT, point.z + offsetZ);
      root.add(figure.root);
      const ped = {
        figure,
        loop,
        waypoint: (start + 1) % 4,
        position: figure.root.position,
        heading: dice.range(0, 6.28),
        speed: dice.range(1.05, 1.7),
        phase: dice.range(0, 6.28),
        flee: 0,
        fleeDir: new THREE.Vector3(),
        dead: false,
      };
      figure.root.rotation.y = ped.heading;
      peds.push(ped);
      return ped;
    }
    return null;
  }

  for (let i = 0; i < count; i += 1) spawn(null);

  const target = new THREE.Vector3();
  const away = new THREE.Vector3();

  function update(dt, playerPos, shots) {
    for (const ped of peds) {
      if (ped.dead) continue;

      // Gunfire nearby sends them running.
      if (shots && shots.length) {
        for (const shot of shots) {
          if (Math.hypot(shot.x - ped.position.x, shot.z - ped.position.z) < 55) {
            if (ped.flee <= 0) {
              away.set(ped.position.x - shot.x, 0, ped.position.z - shot.z);
              if (away.lengthSq() < 0.01) away.set(Math.sin(ped.heading), 0, Math.cos(ped.heading));
              ped.fleeDir.copy(away.normalize());
            }
            ped.flee = Math.max(ped.flee, 5);
          }
        }
      }
      // A car right on top of them makes them bolt sideways.
      if (playerPos && !ped.flee) {
        const d = Math.hypot(ped.position.x - playerPos.x, ped.position.z - playerPos.z);
        if (d < 4.2) {
          ped.flee = Math.max(ped.flee, 1.6);
          away.set(ped.position.x - playerPos.x, 0, ped.position.z - playerPos.z);
          if (away.lengthSq() < 0.01) away.set(1, 0, 0);
          ped.fleeDir.copy(away.normalize());
        }
      }

      if (ped.flee > 0) {
        ped.flee -= dt;
        const speed = ped.speed * 2.6;
        const nx = ped.position.x + ped.fleeDir.x * speed * dt;
        const nz = ped.position.z + ped.fleeDir.z * speed * dt;
        if (!world.hitsBuilding(nx, nz, 0.55)) {
          ped.position.x = nx;
          ped.position.z = nz;
        } else {
          // Blocked: bounce the flee direction off the wall and keep going.
          ped.fleeDir.multiplyScalar(-1);
        }
        ped.heading = turnTowards(ped.heading, Math.atan2(ped.fleeDir.x, ped.fleeDir.z), dt * 8);
        ped.phase += speed * dt * 2.5;
        poseFigure(ped.figure, ped.phase, 2.2);
        ped.figure.root.rotation.y = ped.heading;
        ped.figure.root.position.y = CURB_HEIGHT;
        continue;
      }

      // The ordinary walk: head for the next corner of the ring.
      const next = ped.loop[ped.waypoint];
      target.set(next.x - ped.position.x, 0, next.z - ped.position.z);
      if (target.length() < 1.6) {
        ped.waypoint = (ped.waypoint + 1) % 4;
        continue;
      }
      target.normalize();
      ped.position.x += target.x * ped.speed * dt;
      ped.position.z += target.z * ped.speed * dt;
      ped.heading = turnTowards(ped.heading, Math.atan2(target.x, target.z), dt * 4);
      ped.phase += ped.speed * dt * 2.4;
      poseFigure(ped.figure, ped.phase, 1);
      ped.figure.root.rotation.y = ped.heading;
      ped.figure.root.position.y = CURB_HEIGHT;
    }
  }

  return { peds, root, update, spawn };
}

export { ROAD_HALF };
