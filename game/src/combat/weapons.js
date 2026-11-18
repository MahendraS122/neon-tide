// Player weapons, ray-hit damage, tracers, reloads and Lavado/police combatants.
import * as THREE from 'three';
import { createFigure, poseFigure } from '../entities/character.js';
const SPECS =[{ name: 'FISTS', mag: Infinity, rate: .45, spread: .35, damage: 12, range: 2.4 },
{ name: 'PISTOL', mag: 12, rate: .3, spread: .035, damage: 26, range: 90 }, { name: 'SMG', mag:
30, rate: .095, spread: .09, damage: 12, range: 75 }, { name: 'SHOTGUN', mag: 6, rate: .72, spread:
.27, damage: 13, range: 36, pellets: 7 }, { name: 'RIFLE', mag: 24, rate: .19, spread: .018, damage:
36, range: 150 },];
export function createWeapons(scene, playerRig) { const ammo =[Infinity, 72, 180, 36, 120], magazines =
SPECS.map(s => s.mag), timers = SPECS.map(() => 0);
const state = { active: 2, reloading: 0, flash: 0, shots:[], targets:[], lastShot: 0 };
const effects = new THREE.Group();
effects.name = 'combat-effects';
scene.add(effects);
const gun = new THREE.Group();
const metal = new THREE.MeshStandardMaterial({ color: 0x252d38, metalness: .78, roughness: .24 });
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, .46, 8), metal);
barrel.rotation.x = Math.PI / 2;
barrel.position.z = .24;
gun.add(barrel);
const slide = new THREE.Mesh(new THREE.BoxGeometry(.12, .13, .28), metal);
slide.position.y = .03;
gun.add(slide);
const grip = new THREE.Mesh(new THREE.BoxGeometry(.09, .19, .1), metal);
grip.position.set(0, - .11, - .07);
grip.rotation.x = - .2;
gun.add(grip);
scene.add(gun);
function setTargets(targets) {
  state.targets = targets;
}
function fire(now, camera, player) {
  const spec = SPECS[state.active];
  if (timers[state.active] > 0 || state.reloading > 0 ||(state.active > 0 && magazines[state.active] <= 0)) return false;
  timers[state.active] = spec.rate;
  if (state.active > 0) magazines[state.active] --;
  const origin = player.position.clone().add(new THREE.Vector3(0, 1.12, 0));
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  if (state.active === 0) {
    dir.set(Math.sin(player.heading), 0, Math.cos(player.heading));
  }
  const pellets = spec.pellets ?? 1;
  for (let i = 0; i < pellets; i ++) {
    const d = dir.clone().add(new THREE.Vector3((Math.random() - .5) * spec.spread,(Math.random() - .5) * spec.spread,
    (Math.random() - .5) * spec.spread)).normalize();
    let victim = null, best = spec.range;
    for (const target of state.targets) {
      if (target.dead) continue;
      const delta = target.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
      const along = delta.dot(d);
      if (along < 0 || along > best) continue;
      const miss = delta.addScaledVector(d, - along).length();
      if (miss <(state.active === 0 ? .9: .72)) {
        best = along;
        victim = target;
      }
    }
    const end = origin.clone().addScaledVector(d, best);
    if (victim) {
      victim.health -= spec.damage;
      if (victim.health <= 0) {
        victim.dead = true;
        victim.figure.root.visible = false;
      }
    }
    if (victim) {
      const spark = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), new THREE.MeshBasicMaterial({ color:
      0x9ffcff, toneMapped: false }));
      spark.position.copy(end);
      effects.add(spark);
      state.shots.push({ object: spark, life: .16 });
    }
    const line = new THREE.BufferGeometry().setFromPoints([origin.clone(), end]);
    const beam = new THREE.Line(line, new THREE.LineBasicMaterial({ color: state.active === 0 ?
    0xffd166: 0xffe7a0, transparent: true, opacity: .92 }));
    effects.add(beam);
    state.shots.push({ object: beam, life: .075, geometry: line });
  }
  state.flash = .09;
  state.lastShot = now;
  player.aiming = true;
  const light = new THREE.PointLight(0xffb34a, 4, 8);
  light.position.copy(origin).addScaledVector(dir, .6);
  effects.add(light);
  state.shots.push({ object: light, life: .07 });
  return true;
}
function update(dt, now, input, camera, player) {
  let fired = false;
  for (let i = 0; i < timers.length; i ++) timers[i] = Math.max(0, timers[i] - dt);
  if (state.reloading > 0) {
    state.reloading -= dt;
    if (state.reloading <= 0) {
      const i = state.active;
      const need = magazines[i] === Infinity ? 0: SPECS[i].mag - magazines[i];
      const load = Math.min(need, ammo[i]);
      magazines[i] += load;
      ammo[i] -= load;
    }
  }
  if (input) {
    for (let i = 0; i < 5; i ++) if (input.pressed(`Digit${i+1}`)) {
      state.active = i;
      player.aiming = i > 0;
    }
    if (input.pressed('KeyR') && state.active > 0 && magazines[state.active] < SPECS[state.active].mag &&
    ammo[state.active] > 0) state.reloading = 1.15;
    if (input.down('Mouse0')) fired = fire(now, camera, player);
  }
  for (const effect of[...state.shots]) {
    effect.life -= dt;
    if (effect.life <= 0) {
      effects.remove(effect.object);
      effect.geometry?.dispose();
      state.shots.splice(state.shots.indexOf(effect), 1);
    }
  }
  if (player) gun.visible = !player.inVehicle && state.active > 0;
  if (gun.visible && player) {
    gun.position.copy(player.position).add(new THREE.Vector3(Math.sin(player.heading) * .2, 1.05,
    Math.cos(player.heading) * .2));
    gun.rotation.y = player.heading;
  }
  return fired;
}
function hudSlots() {
  return SPECS.map((s, i) =>({ key: String(i + 1), name: s.name, ammo: i === 0 ? null: `${magazines[i]} / ${ammo[i]}` }));
}
function reload() {
  const i = state.active;
  if (i && ammo[i] > 0 && magazines[i] < SPECS[i].mag) state.reloading = 1.15;
}
function addTracer(a, b, color = 0xffb36b) {
  const g = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .95 }));
  effects.add(l);
  state.shots.push({ object: l, life: .1, geometry: g });
}
return { state, update, fire, setTargets, hudSlots, reload, addTracer, effects, gun };
} export function createGang(scene, positions) { const root = new THREE.Group();
root.name = 'Lavado lookouts';
scene.add(root);
const members =[];
positions.forEach((p, i) => {
  const figure = createFigure({
    shirt:[0x8e263a, 0x9e2b40, 0x7f2036][i % 3], trousers: 0x151824, jacket: 0x9b2940, cap: i % 2 ?
    0x171824: null
  });
  figure.root.position.set(p.x, p.y ?? 0, p.z);
  root.add(figure.root);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(.08, .09, .62), new THREE.MeshStandardMaterial({ color:
  0x20242a, metalness: .65, roughness: .3 }));
  gun.position.set(.28, 1.22, .24);
  figure.root.add(gun);
  members.push({
    figure, gun, position: figure.root.position, health: 100, dead: false, cooldown: .7 + i * .65, phase:
    i * .7
  });
});
function update(dt, player, weaponSystem) {
  for (const e of members) {
    if (e.dead) continue;
    e.cooldown -= dt;
    e.phase += dt;
    poseFigure(e.figure, e.phase, 0, { aim: true });
    const d = player.position.distanceTo(e.position);
    if (d < 25 && e.cooldown <= 0) {
      e.cooldown = 1.25 + Math.random() * .65;
      const from = e.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const to = player.position.clone().add(new THREE.Vector3(0, 1, 0));
      weaponSystem.addTracer(from, to, 0xff583f);
      if (d < 16) {
        player.armour = Math.max(0, player.armour - 5);
        if (player.armour === 0) player.health = Math.max(0, player.health - 3);
        player.hurt = .7;
      }
    }
  }
}
return { root, members, update };
} export { SPECS };
