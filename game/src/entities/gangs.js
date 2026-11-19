// Lavado lookouts defend their block and share awareness when a nearby member is attacked.
import * as THREE from '../../vendor/three.module.min.js';
import { moveWithCollisions } from './collision.js';
import { canSee } from './sight.js';

export function createGangs(scene, city, player, makePerson, fire, random) {
  const members = [];
  function add(x, z) {
    const character = makePerson({ shirt: '#ce3852', trousers: '#302633', skin: '#a87256' });
    character.root.position.set(x, 0.22, z);
    scene.add(character.root);
    const member = {
      character, position: character.root.position, health: 100, hostile: false,
      cooldown: 0.6 + random(), status: 'LOOKOUT'
    };
    member.hit = damage => {
      member.health = Math.max(0, member.health - damage);
      alert(member.position);
      if (!member.health) {
        member.status = 'DOWN';
        character.root.rotation.z = Math.PI / 2;
        character.animate(0);
      }
    };
    members.push(member);
    return member;
  }
  function alert(position, radius = 27) {
    for (const member of members) {
      if (member.position.distanceTo(position) < radius) member.hostile = true;
    }
  }
  function update(dt) {
    for (const member of members) {
      if (!member.health) continue;
      const offset = player.position.clone().sub(member.position).setY(0);
      const distance = offset.length();
      if (distance < 7) member.hostile = true;
      if (!member.hostile || distance > 55) continue;
      offset.normalize();
      const origin = member.position.clone().add(new THREE.Vector3(offset.x * 0.55, 1.35, offset.z * 0.55));
      const target = player.position.clone().add(new THREE.Vector3(0, 1.15, 0));
      const sight = canSee(origin, target, city.colliders, 32);
      const speed = distance > 13 ? 2.85 : 0;
      member.character.root.rotation.y = Math.atan2(offset.x, offset.z);
      moveWithCollisions(member.position, offset.x * speed * dt, offset.z * speed * dt, 0.34, city);
      member.character.animate(dt, speed, sight);
      member.cooldown -= dt;
      if (sight && member.cooldown <= 0) {
        fire(origin, target, distance < 15 ? 8 : 5, member.character);
        member.cooldown = 1.2 + random() * 0.9;
      }
    }
  }
  return { members, add, alert, update };
}
