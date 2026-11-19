// Sidewalk walkers follow block edges and flee nearby gunfire or stolen-car disturbances.
import * as THREE from '../../vendor/three.module.min.js';

import { moveWithCollisions, shortestAngle } from './collision.js';

export function createPedestrians(scene, city, random, buildCharacter) {
  const people = [];
  const shirts = ['#c78f72', '#e7d9ad', '#65a9a6', '#d49da8', '#748bba', '#bac2a0'];
  const skins = ['#b78360', '#d8ae86', '#805940', '#aa7757'];
  function add(position, yaw, ejected = false) {
    const index = people.length;
    const character = buildCharacter({ shirt: shirts[index % shirts.length], skin: skins[index % skins.length] });
    character.root.position.copy(position);
    character.root.position.y = 0.22;
    character.root.rotation.y = yaw;
    scene.add(character.root);
    const person = { character, position: character.root.position, yaw,
      speed: 0.8 + random() * 0.55, flee: ejected ? 7 : 0, route: null, targetIndex: 0, fallen: ejected ? 1 : 0 };
    people.push(person);
    return person;
  }
  for (let i = 0; i < 34; i += 1) {
    const column = i < 16 ? 3 : i % 4;
    const row = i % 5;
    const x1 = city.roadX[column] + 11;
    const x2 = city.roadX[column + 1] - 11;
    const z1 = city.roadZ[row] + 11;
    const z2 = city.roadZ[row + 1] - 11;
    const route = [[x1, z1], [x1, z2], [x2, z2], [x2, z1]];
    const index = i % 4;
    const next = route[(index + 1) % 4];
    const start = new THREE.Vector3(route[index][0], 0.22, route[index][1]);
    start.lerp(new THREE.Vector3(next[0], 0.22, next[1]), random());
    const person = add(start, 0);
    person.route = route;
    person.targetIndex = (index + 1) % 4;
  }
  function alert(position, radius = 32) {
    people.forEach(person => {
      if (person.position.distanceTo(position) > radius) return;
      person.flee = 6 + random() * 3;
      person.yaw = Math.atan2(person.position.x - position.x, person.position.z - position.z);
    });
  }
  function eject(position, yaw) {
    const person = add(position, yaw + Math.PI / 2, true);
    person.yaw = yaw - Math.PI / 2;
    alert(position, 14);
  }
  function update(dt) {
    for (const person of people) {
      person.flee = Math.max(0, person.flee - dt);
      person.fallen = Math.max(0, person.fallen - dt);
      if (person.fallen > 0) {
        person.character.root.rotation.z = -Math.PI / 3 * Math.min(1, person.fallen * 3);
        person.character.root.position.y = 0.22;
        continue;
      }
      person.character.root.rotation.z = 0;
      if (person.route && person.flee === 0) {
        const target = person.route[person.targetIndex];
        const dx = target[0] - person.position.x;
        const dz = target[1] - person.position.z;
        if (Math.hypot(dx, dz) < 1) person.targetIndex = (person.targetIndex + 1) % 4;
        person.yaw += shortestAngle(person.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4);
      }
      const speed = person.flee > 0 ? 4.7 : person.route ? person.speed : 0;
      const hit = moveWithCollisions(person.position, Math.sin(person.yaw) * speed * dt,
        Math.cos(person.yaw) * speed * dt, 0.3, city);
      if (hit) person.yaw += dt * 4;
      person.character.root.rotation.y = person.yaw;
      person.character.animate(dt, speed);
    }
  }
  return { people, update, alert, eject, onGunfire: alert };
}
