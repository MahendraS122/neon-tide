// Deterministic browser tableaux use actual game actors, cameras, props and gameplay HUD.
import * as THREE from '../vendor/three.module.min.js';
import { createNeonRow } from './world/neonRow.js';
import { createGarage } from './world/garages.js';
import { createShotEffects } from './render/shotEffects.js';
import { createGarageMenu } from './ui/garage.js';

const SHOT_NAMES = ['chase', 'onfoot', 'start', 'title', 'map', 'garage'];

export function setupShot(name, game, random) {
  if (!SHOT_NAMES.includes(name)) return null;
  if (name === 'map') {
    game.player.position.set(-52, 0.22, 83);
    return { static: true, hideReticle: true };
  }
  const { scene, camera, player, vehicles, traffic, pedestrians, gangs, hero, weapons, vitals,
    wanted, police, helicopter, roadblocks, sky, progress, effects, textures } = game;
  const shotFX = createShotEffects(game, random);
  for (const car of vehicles.vehicles) car.root.visible = false;
  for (const car of traffic.fleet) car.root.visible = false;
  for (const pedestrian of pedestrians.people) pedestrian.character.root.visible = false;
  for (const member of gangs.members) member.character.root.visible = false;
  camera.fov = name === 'chase' ? 60 : name === 'onfoot' ? 64 : 55;
  camera.updateProjectionMatrix();
  progress.cash = name === 'chase' ? 8450 : name === 'garage' ? 12650 : 5825;
  progress.respect = name === 'chase' ? 58 : name === 'garage' ? 58 : 34;
  const hud = { static: true, hideReticle: true };

  if (name === 'title') {
    sky.setNight(false);
    return hud;
  }

  if (name === 'garage') {
    sky.setNight(false);
    hero.root.visible = true;
    hero.position.set(104, 0.12, 12);
    hero.yaw = 0;
    hero.root.rotation.set(0, 0, 0);
    hero.speed = 0;
    hero.nitro = 100;
    hero.condition = 100;
    hero.driverHead.visible = true;
    hero.upgrades = { engine: true, nitro: true };
    player.vehicle = hero;
    player.position.copy(hero.position);
    const garage = createGarage(game);
    createGarageMenu(garage, progress, game).open();
    camera.fov = 52;
    camera.position.set(99.4, 3.35, 26.5);
    camera.lookAt(104, 1.1, 11.8);
    camera.updateProjectionMatrix();
    return hud;
  }

  if (name === 'start') {
    sky.setNight(true);
    createNeonRow(scene, textures, random);
    player.position.set(23.35, 0.22, 15.6);
    player.character.root.position.copy(player.position);
    player.character.root.rotation.y = Math.PI - 0.05;
    player.character.animate(0, 0, true);
    weapons.select(1);
    weapons.gun.visible = true;
    weapons.slots[1].ammo = 8;
    const looks = [[19.85, 4.1], [25.05, -0.4], [29.15, 1.1]];
    looks.forEach(([x, z]) => {
      const person = gangs.add(x, z);
      person.character.root.rotation.y = Math.atan2(player.position.x - x, player.position.z - z);
      person.character.animate(0, 0, true);
    });
    const car = vehicles.add('suv', '#648093', 28.4, 7, 3.2);
    car.driverHead.visible = true;
    vitals.health = 100;
    vitals.armour = 38;
    camera.position.set(25.8, 2.85, 20.4);
    camera.lookAt(25, 2.1, -3.4);
    Object.assign(hud, {
      district: 'Neon Row · Glasswater',
      mission: { chapter: 'WELCOME TO PORT SOLARA', name: 'A city on the water', stage: 12,
        objective: 'Take a look around. Every block has a story.', next: 'Find a ride on Ocean Drive' },
      hint: 'CLICK TO LOOK   /   WASD MOVE   /   SHIFT SPRINT   /   F ENTER A CAR'
    });
  } else if (name === 'chase') {
    hero.root.visible = true;
    hero.position.set(104, 0.12, 10.2);
    hero.yaw = Math.PI - 0.46;
    hero.root.rotation.y = hero.yaw;
    hero.root.rotation.z = -0.035;
    hero.condition = 86;
    hero.nitro = 64;
    hero.speed = 41.9;
    hero.driverHead.visible = true;
    player.vehicle = hero;
    weapons.select(2);
    weapons.slots[2].ammo = 30;
    weapons.slots[2].reserve = 120;
    vitals.health = 91;
    vitals.armour = 58;
    const cruisers = [[100.4, 7.1, 2.94], [107.5, 7.3, 3.34], [96, 0.5, 3.08]];
    const units = cruisers.map(([x, z, yaw], index) => {
      const unit = police.spawn(x, z, yaw);
      unit.status = index === 0 ? 'RAMMING' : 'PURSUIT';
      shotFX.flash(unit.car, index);
      return unit;
    });
    wanted.report('Grand theft', 4);
    wanted.update(0, { seen: true });
    helicopter.setActive(true);
    helicopter.pose(new THREE.Vector3(101.5, 9.5, -4.2), new THREE.Vector3(104, 0, 9.5), 0.85, 4.2);
    helicopter.showcaseLight(0.58);
    roadblocks.deploy(100, -34, false);
    const taxi = vehicles.add('taxi', '#eebb47', 95.0, -16, 0);
    taxi.driverHead.visible = true;
    vehicles.add('suv', '#d6ddd6', 94, -46, 0);
    vehicles.add('muscle', '#e29473', 104, -58, Math.PI);
    const walkers = [[110, 6], [112.5, 2], [110.5, -4], [113, -10],
      [90.5, 1], [90, -6], [90.5, -13], [90, -19],
      [111, -18], [115, -25], [89, -27], [92, -32],
      [110, -35], [113, -42], [88, -42], [91, -48],
      [110, -52], [114, -59], [89, -57], [92, -64],
      [110, -68], [115, -74], [88, -72], [91, -79]];
    walkers.forEach(([x, z], index) => {
      const person = pedestrians.people[index];
      person.position.set(x, 0.22, z);
      person.yaw = index % 2 ? 0.3 : 2.8;
      if (index < 8) person.flee = 4.5 + (index % 3) * 0.45;
      person.character.root.rotation.y = person.yaw;
      person.character.root.visible = true;
      person.character.animate(0.12 + index * 0.04, index < 8 ? 4.7 : 1.2);
    });
    units.slice(0, 2).forEach((unit, index) => {
      const muzzle = unit.position.clone().add(new THREE.Vector3(
        Math.sin(unit.car.yaw) * 2.35, 1.2, Math.cos(unit.car.yaw) * 2.35));
      const target = hero.position.clone().add(new THREE.Vector3(index ? 0.4 : -0.4, 0.85, 0));
      effects.shot(muzzle, target, true, 2);
    });
    const burningWreck = vehicles.add('muscle', '#33252d', 100, -91, Math.PI);
    burningWreck.condition = 0;
    shotFX.wreck(burningWreck.position);
    camera.fov = 48;
    camera.position.set(103.4, 5.3, 22.4);
    camera.lookAt(103.7, 3.55, 8.7);
    camera.updateProjectionMatrix();
    shotFX.drift(hero);
    shotFX.speedLines(camera);
    progress.callout = 'DRIFT x3 +$60';
    progress.flash = 3;
    Object.assign(hud, {
      district: 'Ocean Drive',
      mission: { chapter: 'CHAPTER 03 · HOT WIRE', name: 'Long Way Home', timer: '01:24', stage: 62,
        objective: 'Lose the SPD tail on Ocean Drive', next: 'Meet Mara at the south marina' },
      dialogue: { speaker: 'MARA REYES · COMMS', line: 'Three cruisers? Keep moving. I’m at the south marina.' },
      hint: 'WASD DRIVE   /   SPACE HANDBRAKE   /   SHIFT NITRO   /   Q / E RADIO'
    });
  } else {
    sky.setNight(false);
    createNeonRow(scene, textures, random);
    player.position.set(23.35, 0.22, 14.6);
    player.character.root.position.copy(player.position);
    player.character.root.rotation.y = Math.PI - 0.05;
    player.character.animate(0, 0, true);
    weapons.select(1);
    weapons.gun.visible = true;
    weapons.slots[1].ammo = 8;
    weapons.slots[1].reserve = 52;
    vitals.health = 74;
    vitals.armour = 52;
    const rivals = [[19.85, 4.1], [25.05, -0.4], [29.15, 1.1]];
    const visible = rivals.map(([x, z]) => {
      const member = gangs.add(x, z);
      member.hostile = true;
      member.character.root.rotation.y = Math.atan2(player.position.x - x, player.position.z - z);
      member.character.animate(0, 0, true);
      return member;
    });
    const down = gangs.add(19.15, 0.5);
    down.hit(100);
    gangs.add(25.1, -4.4).hit(100);
    const wreck = vehicles.add('muscle', '#321d31', 20.75, -6.1, 0.55);
    wreck.condition = 0;
    wreck.root.rotation.z = -0.13;
    shotFX.wreck(wreck.position);
    vehicles.add('suv', '#6f859b', 29.65, 7.25, 3.35);
    vehicles.add('van', '#966585', 19.0, -27, 0);
    [[27.3, -18, Math.PI], [20.7, -34, 0]].forEach(([x, z, yaw], index) => {
      const car = vehicles.add(index ? 'taxi' : 'muscle', index ? '#eebb47' : '#e2d9bf', x, z, yaw, true);
      car.driverHead.visible = true;
      car.speed = 7;
      traffic.fleet.push(car);
    });
    const bystanders = [[15, -9], [15.4, -16], [33, -11], [32.7, -18], [33.2, -27]];
    bystanders.forEach(([x, z], index) => {
      const person = pedestrians.people[index];
      person.position.set(x, 0.22, z);
      person.yaw = Math.PI + (index % 2 ? 0.2 : -0.2);
      person.flee = 8;
      person.character.root.rotation.y = person.yaw;
      person.character.root.visible = true;
      person.character.animate(0.1 + index * 0.07, 4.7);
    });
    const hit = new THREE.Vector3(28.75, 1.15, 8.85);
    effects.impact(hit, 21);
    effects.shot(new THREE.Vector3(23.44, 1.58, 13.75), hit, false, 2);
    const firing = visible[1].position.clone().add(new THREE.Vector3(-0.06, 1.37, 0.61));
    effects.shot(firing, new THREE.Vector3(25.95, 1.66, 14.15), true, 2);
    wanted.report('Shots fired', 2);
    wanted.update(0, { seen: false });
    camera.position.set(24.64, 2.53, 18.05);
    camera.lookAt(25, 2.45, -3.5);
    progress.callout = 'HEADSHOT +$150';
    progress.flash = 3;
    Object.assign(hud, {
      district: 'Neon Row · Glasswater',
      mission: { chapter: 'CHAPTER 03 · AFTER DARK', name: 'No Safe Corners', stage: 40,
        objective: 'Take out the Lavado lookouts 2/5', next: 'Reach the lounge’s back entrance' },
      dialogue: {
        speaker: 'MARA REYES · COMMS', line: 'The lounge is their front. You want the door in back.'
      },
      hint: 'WASD MOVE   /   LMB FIRE   /   R RELOAD   /   1–5 WEAPON SLOTS'
    });
  }
  return hud;
}
