// Live, deterministic scenes. Capture code only arranges our own game objects.
import * as THREE from 'three';
import { createGang } from './combat/weapons.js';
import { poseShowcaseAim } from './entities/character.js';
import { dressNeonRow, fireWreck, muzzleFlash, tracer, clearCamera } from './world/sceneDetails.js';

function car(game, x, z, kind, color, heading = 0) {
  return game.parkCar({ x, z, kind, color, heading });
}

function camera(game, position, target, fov = 58) {
  const view = game.view;
  view.camera.fov = fov;
  view.camera.updateProjectionMatrix();
  view.camera.position.set(...position);
  view.camera.lookAt(...target);
  view.camera.updateMatrixWorld();
  clearCamera(game.world.root, view.camera.position, new THREE.Vector3(...target));
  view.focusShadows(target[0], target[2]);
  view.renderer.shadowMap.needsUpdate = true;
  game.sky.update(view.camera);
}

function fill(game, color, intensity, position) {
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(...position);
  game.view.scene.add(light);
}

function chaseShot(game) {
  const { hud, playerRig } = game;
  game.sky.setTime('day');
  const x = -282, z = 188;
  // Look back along the pursuit from a low front-quarter position, so all units read.
  const hero = car(game, x, z, 'muscle', 0xed287d, -.18);
  hero.speed = 41.7;
  playerRig.enterVehicle(hero);
  playerRig.syncToVehicle(hero);
  game.cameraState.yaw = Math.PI;
  const pursuers = [[-5, -8], [5, -13], [0, -21]].map(([dx, dz], i) => {
    const unit = car(game, x + dx, z + dz, 'police', 0xf0f2f6, i ? .08 : -.1);
    unit.lights.redPool.intensity = 18;
    unit.lights.bluePool.intensity = 18;
    unit.lights.red.intensity = 2.2;
    unit.lights.blue.intensity = 2.2;
    return unit;
  });
  game.helicopter.update(0, { x, z }, 4);
  game.helicopter.root.position.set(x, 11, z - 28);
  game.helicopter.root.scale.setScalar(1.35);
  camera(game, [x + 2, 3.25, z + 12], [x - 1.8, .55, z - 12], 42);
  fill(game, 0xffd4b5, 2, [x + 5, 8, z + 10]);
  const smoke = new THREE.MeshBasicMaterial({
    color: 0xe2c8d4, transparent: true, opacity: .23, depthWrite: false
  });
  for (let i = 0; i < 16; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(.22 + i * .025, 8, 6), smoke);
    puff.position.set(x + (i % 2 ? 1 : -1), .4 + i * .02, z - 2 - i * .23);
    game.view.scene.add(puff);
  }
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    tracer(game.view.scene, [x + side * (5 + i % 3), .08, z + 4 - i * 2],
      [x + side * (5 + i % 3), .08, z + 1 - i * 2], 0xffddac, .5);
  }
  hud.setStars(4, false);
  hud.setCash(12480);
  hud.setClock(3, 'THU', '18:42');
  hud.setMission({
    chapter: 'CHAPTER 3 · HOT WIRE', name: 'RUNNING THE BLOCK',
    objective: 'Lose the <span class="obj-mark">SPD</span> before the bridge on 5th.',
    timeLeft: 87, stages: 5, stageIndex: 2, cashLabel: '+$3,500'
  });
  hud.setPolice(pursuers.map((unit, i) => ({
    label: `UNIT ${21 + i}`, distance: 8 + i * 6, status: i ? 'PURSUIT' : 'RAMMING'
  })).concat({ label: 'AIR 1', distance: 29, status: 'HELI' }), { searching: false });
  hud.setWeapons(game.weapons.hudSlots(), 2);
  hud.setRadio('SUNSET FM 98.6', '“Chrome Palms”');
  hud.state.inCar = true;
  hud.setDriving(150, 'SOLARA V8 · G4 · 82%', .72);
  hud.showDialogue('MARA REYES', 'The bridge is sealed. Take the pier road. Lose them in the marina.');
  game.minimap.draw(hero.position, Math.PI, pursuers.map(unit => ({
    x: unit.position.x, z: unit.position.z, kind: 'police'
  })));
}

function onfootShot(game) {
  const { hud, playerRig } = game;
  const x = -182, z = 94;
  const { scene, renderer, state } = game.view;
  game.sky.setTime('night');
  renderer.toneMappingExposure = 1.78;
  state.skyFill.color.setHex(0xa6baff);
  state.skyFill.groundColor.setHex(0x835a83);
  state.skyFill.intensity = 1.45;
  const heading = Math.PI / 2 + .26;
  playerRig.teleport(x, z, heading);
  playerRig.player.aiming = true;
  const gunPosition = poseShowcaseAim(playerRig.figure);
  game.cameraState.yaw = heading;
  game.weapons.state.active = 1;
  game.gang.root.visible = false;
  game.gang = createGang(scene, [[8.2, -2.4], [10, 1.8], [13, -5.2], [16, 4.5]].map(([dx, dz]) => ({
    x: x + dx, y: 0, z: z + dz
  })));
  const enemyMuzzles = [];
  for (const [i, enemy] of game.gang.members.entries()) {
    const yaw = Math.atan2(x - enemy.position.x, z - enemy.position.z);
    enemy.figure.root.rotation.y = yaw;
    const grip = poseShowcaseAim(enemy.figure);
    enemy.gun.position.copy(enemy.figure.root.worldToLocal(grip.clone()));
    enemy.gun.position.z += .1;
    enemyMuzzles.push(grip.add(new THREE.Vector3(Math.sin(yaw) * .43, .02, Math.cos(yaw) * .43)));
    const light = new THREE.PointLight(i % 2 ? 0xffc58e : 0xffa2c7, 9, 5);
    light.position.set(enemy.position.x - 1.1, 2.9, enemy.position.z + .5);
    scene.add(light);
  }
  game.weapons.setTargets(game.gang.members);
  dressNeonRow(game, x, z);
  fireWreck(game, x + 14.8, z + 8.0);
  const cover = car(game, x + 8.8, z + 6.9, 'sedan', 0x285966, -.09);
  camera(game, [x - 3.32, 1.9, z - 1.91], [x + 10, 2.85, z + .5], 89);
  fill(game, 0x9cd4ff, 1.55, [x - 9, 7, z + 2]);
  const rim = new THREE.PointLight(0x39eaff, 21, 7);
  rim.position.set(x + 1.3, 2.45, z - 1.2);
  scene.add(rim);
  game.weapons.update(0, 0, null, game.view.camera, playerRig.player);
  const gun = game.weapons.gun;
  gun.position.copy(gunPosition);
  gun.rotation.set(0, heading, 0);
  gun.scale.z = .67;
  const muzzle = gun.localToWorld(new THREE.Vector3(0, .017, .49));
  muzzleFlash(scene, ...muzzle, game.view.camera, .115);
  const returnFire = enemyMuzzles[1];
  muzzleFlash(scene, ...returnFire, game.view.camera, .22);
  tracer(scene, returnFire.toArray(), [x + 2.8, 1.19, z + 1.15], 0xffa458, .95, .022);
  tracer(scene, muzzle.toArray(), [x + 5.5, 1.52, z - 1.53], 0xffe4a3, .77, .012);
  const impact = cover.group.localToWorld(new THREE.Vector3(-cover.shape.width * .53, .8, .35)).toArray();
  muzzleFlash(scene, ...impact, game.view.camera, .12);
  for (let i = 0; i < 15; i++) {
    const angle = i * 2.4;
    tracer(scene, impact, [impact[0] - .17 - i * .037,
      impact[1] + .6 * Math.sin(angle), impact[2] + .67 * Math.cos(angle)], 0xffc478, .94, .018);
  }
  hud.state.inCar = false;
  hud.setDriving(0, '', 0);
  hud.setStars(2, true);
  hud.setCash(8730);
  hud.setClock(3, 'THU', '23:14');
  hud.setMission({
    chapter: 'CHAPTER 2 · CASH & CONCRETE', name: 'BAD BLOOD',
    objective: 'Take out the <span class="obj-mark">Lavado lookouts 2/5</span> on Neon Row.',
    timeLeft: null, stages: 4, stageIndex: 1, cashLabel: '+$1,200'
  });
  hud.setPolice([{ label: 'UNIT 07', distance: 41, status: 'PURSUIT' }], { searching: true });
  hud.setWeapons(game.weapons.hudSlots(), 1);
  hud.setRadio('K-WAVE 104.2', '“Night Bloom”');
  hud.setVitals(74, 42, 'Neon Row');
  game.minimap.draw(playerRig.player.position, Math.PI / 2, game.gang.members.map(enemy => ({
    x: enemy.position.x, z: enemy.position.z, kind: 'enemy'
  })));
  const reward = document.createElement('div');
  reward.className = 'shot-reward';
  reward.innerHTML = '<b>HEADSHOT</b><span>+$150</span>';
  const hit = game.gang.members[0].position.clone().add(new THREE.Vector3(0, 2.16, 0));
  hit.project(game.view.camera);
  reward.style.left = `${50 + 50 * hit.x}%`;
  reward.style.top = `${50 - 50 * hit.y}%`;
  document.body.append(reward);
}

export async function stageShot(name, game) {
  game.hud.hideLoading();
  game.hud.showHud(true);
  if (name === 'map' || name === 'title') {
    game.missions.restore({ completed: [0, 1, 2, 3] });
    game.cash = 12480;
    game.stats = { respect: 680, carsStolen: 12, tokens: [0, 2, 5, 7, 11], properties: 2 };
    game.time = { day: 3, dayName: 'THU', minutes: 1122 };
    if (name === 'map') {
      game.missions.start(4, false);
      game.playerRig.teleport(-282, -110);
      game.cityMap.show();
    } else {
      // Use the same versioned serialization and validation as a real continue slot.
      const shotName = game.shotName;
      const oldSlot = localStorage.getItem('neon-tide-port-solara-v2');
      game.shotName = null;
      game.save.autosave();
      game.shotName = shotName;
      game.title.show();
      if (oldSlot === null) localStorage.removeItem('neon-tide-port-solara-v2');
      else localStorage.setItem('neon-tide-port-solara-v2', oldSlot);
      game.title.update(0);

    }
  } else if (name === 'onfoot') onfootShot(game);
  else chaseShot(game);
  await new Promise(resolve => requestAnimationFrame(resolve));
  game.sky.update(game.view.camera);
  game.view.draw();
  await new Promise(resolve => requestAnimationFrame(resolve));
  game.view.draw();
  window.__shotReady = true;
}
