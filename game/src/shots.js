// Deterministic browser tableaux use actual game actors, cameras, props and gameplay HUD.
import * as THREE from '../vendor/three.module.min.js';
import { createNeonRow } from './world/neonRow.js';
import { createShotEffects } from './render/shotEffects.js';

export function setupShot(name, game, random) {
  if (!['chase', 'onfoot', 'start', 'title', 'map'].includes(name)) return null;
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
  progress.cash = name === 'chase' ? 8450 : 5825;
  progress.respect = name === 'chase' ? 58 : 34;
  const hud = { static: true, hideReticle: true };

  if (name === 'title') {
    sky.setNight(false);
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
    vitals.health = 91;
    vitals.armour = 58;
    const cruisers = [[100.4, 7.1, 2.94], [107.5, 7.3, 3.34], [96, 0.5, 3.08]];
    cruisers.forEach(([x, z, yaw], index) => {
      const unit = police.spawn(x, z, yaw);
      unit.status = index === 0 ? 'RAMMING' : 'PURSUIT';
      shotFX.flash(unit.car, index);
    });
    wanted.report('Grand theft', 4);
    wanted.update(0, { seen: true });
    helicopter.setActive(true);
    helicopter.pose(new THREE.Vector3(101.5, 9.5, -4.2), new THREE.Vector3(104, 0, 9.5), 0.85, 4.2);
    roadblocks.deploy(100, -34, false);
    const taxi = vehicles.add('taxi', '#eebb47', 95.0, -16, 0);
    taxi.driverHead.visible = true;
    vehicles.add('suv', '#d6ddd6', 94, -46, 0);
    vehicles.add('muscle', '#e29473', 104, -58, Math.PI);
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
      compactWeapons: true,
      mission: { chapter: 'CHAPTER 03 · HOT WIRE', name: 'Long Way Home', timer: '01:24', stage: 62,
        objective: 'Lose the SPD tail on Ocean Drive', next: 'Meet Mara at the south marina' },
      hint: 'WASD DRIVE   /   SPACE HANDBRAKE   /   SHIFT NITRO   /   Q / E RADIO'
    });
  } else {
    sky.setNight(true);
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
