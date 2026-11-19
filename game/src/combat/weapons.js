// Loadout, aim, hits and ammunition for the arcade combat loop.
import * as THREE from '../../vendor/three.module.min.js';
import { wallDistance } from '../entities/sight.js';

export const LOADOUT = [
  { name: 'Fists', damage: 28, range: 2.1, cadence: 0.48 },
  { name: 'Pistol', magazine: 12, reserve: 60, damage: 36, range: 70,
    cadence: 0.25, spread: 0.008, reload: 1.05 },
  { name: 'SMG', magazine: 30, reserve: 120, damage: 19, range: 55,
    cadence: 0.095, spread: 0.026, reload: 1.35 },
  { name: 'Shotgun', magazine: 6, reserve: 30, damage: 16, range: 38,
    cadence: 0.68, spread: 0.075, reload: 1.65 },
  { name: 'Rifle', magazine: 24, reserve: 96, damage: 31, range: 100,
    cadence: 0.14, spread: 0.014, reload: 1.45 }
];

export function createWeapons(player, input, city, effects, audio, random, callbacks) {
  const slots = LOADOUT.map(spec => ({ ...spec, ammo: spec.magazine }));
  const spread = new THREE.Vector3();
  const gun = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: '#27343f', roughness: 0.42, metalness: 0.55 });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.10, 0.29), dark);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.17, 0.09), dark);
  grip.rotation.x = -0.21;
  grip.position.set(0, -0.07, -0.076);
  gun.add(slide, grip);
  gun.position.set(0.12, 1.33, 0.61);
  player.character.body.add(gun);
  let selected = 0;
  let cooldown = 0;
  let reloadTime = 0;

  function select(index) {
    if (index === selected) return;
    selected = index;
    reloadTime = 0;
    gun.scale.z = [1, 1, 1.55, 2.95, 2.7][index];
  }
  function reload(slot) {
    if (!slot.magazine || slot.ammo === slot.magazine || !slot.reserve || reloadTime > 0) return;
    reloadTime = slot.reload;
    audio.play(0.05, 0.07);
  }
  function trace(origin, direction, slot, hitTargets) {
    const ray = new THREE.Ray(origin, direction);
    const point = new THREE.Vector3();
    let distance = wallDistance(origin, direction, slot.range, city.colliders);
    let target = null;
    let headshot = false;
    for (const actor of hitTargets) {
      for (const [height, radius, head] of actor.zones) {
        const center = actor.position.clone().add(new THREE.Vector3(0, height, 0));
        if (!ray.intersectSphere(new THREE.Sphere(center, radius), point)) continue;
        const hitDistance = point.distanceTo(origin);
        if (hitDistance < distance) {
          distance = hitDistance;
          target = actor;
          headshot = head;
        }
      }
    }
    return { point: ray.at(distance, point), target, headshot, hit: distance < slot.range };
  }
  function attack(slot) {
    const origin = player.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    const direction = player.aimDirection();
    const muzzle = origin.clone().addScaledVector(direction, 0.69);
    const wielded = Boolean(slot.magazine);
    if (wielded) {
      slot.ammo -= 1;
      callbacks.onShot(origin);
      audio.play(selected === 3 ? 1 : selected === 1 ? 0.46 : 0.72);
    }
    const targets = callbacks.targets(wielded);
    const pellets = selected === 3 ? 7 : 1;
    const hits = new Map();
    for (let i = 0; i < pellets; i += 1) {
      const width = slot.spread || 0;
      spread.set((random() - 0.5) * width, (random() - 0.5) * width, (random() - 0.5) * width);
      const result = trace(origin, direction.clone().add(spread).normalize(), slot, targets);
      if (i === 0 && wielded) effects.shot(muzzle, result.point);
      if (result.hit && wielded && i < 2) effects.impact(result.point, 6);
      if (result.target) {
        const hit = hits.get(result.target) || { damage: 0, headshot: false };
        hit.damage += slot.damage * (result.headshot && wielded ? 2.15 : 1);
        hit.headshot ||= result.headshot && wielded;
        hits.set(result.target, hit);
      }
    }
    for (const [target, hit] of hits) target.hit(hit.damage, hit.headshot);
    cooldown = slot.cadence;
  }
  function update(dt) {
    for (let i = 0; i < slots.length; i += 1) {
      if (input.take(`Digit${i + 1}`)) select(i);
    }
    cooldown = Math.max(0, cooldown - dt);
    gun.visible = selected > 0;
    slide.position.z = cooldown > 0.07 ? -0.035 : 0;
    if (player.vehicle) return;
    const slot = slots[selected];
    if (reloadTime > 0) {
      reloadTime -= dt;
      if (reloadTime <= 0) {
        const amount = Math.min(slot.reserve, slot.magazine - slot.ammo);
        slot.ammo += amount;
        slot.reserve -= amount;
      }
    }
    if (input.take('KeyR')) reload(slot);
    const held = input.down('Mouse0') || input.down('KeyX');
    if (!held || cooldown || reloadTime > 0) return;
    if (slot.ammo === 0) reload(slot);
    else attack(slot);
  }
  gun.visible = false;
  return {
    slots, select, update, gun,
    get selected() { return selected; },
    get reloading() { return reloadTime > 0; }
  };
}

export function createVitals() {
  const vitals = { health: 100, armour: 40 };
  vitals.hurt = damage => {
    const blocked = Math.min(vitals.armour, damage * 0.75);
    vitals.armour -= blocked;
    vitals.health = Math.max(0, vitals.health - damage + blocked);
  };
  vitals.reset = () => {
    vitals.health = 100;
    vitals.armour = 40;
  };
  return vitals;
}
