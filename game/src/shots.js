// Live, deterministic scenes. Capture code only arranges our own game objects.
import * as THREE from 'three';
import { createVehicle } from './entities/vehicle.js';
import { createGang } from './combat/weapons.js';
import { poseFigure } from './entities/character.js';
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
  camera(game, [x + 3.4, 4.2, z + 7.5], [x - 1, 1.15, z - 12], 42);
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
  game.sky.setTime('night');
  playerRig.teleport(x, z, Math.PI / 2);
  playerRig.player.aiming = true;
  poseFigure(playerRig.figure, 0, 0, { aim: true });
  game.cameraState.yaw = Math.PI / 2;
  game.weapons.state.active = 2;
  game.gang.root.visible = false;
  game.gang = createGang(game.view.scene, [[9, -2], [15, 4], [22, -4], [29, 2]].map(([dx, dz]) => ({
    x: x + dx, y: 0, z: z + dz
  })));
  for (const enemy of game.gang.members) {
    enemy.figure.root.rotation.y = -Math.PI / 2;
    poseFigure(enemy.figure, 0, 0, { aim: true });
  }
  game.weapons.setTargets(game.gang.members);
  dressNeonRow(game, x, z);
  fireWreck(game, x + 12, z + 6);
  const cover = car(game, x + 22, z - 5, 'sedan', 0x477d91, .2);
  camera(game, [x - 2.8, 2.15, z + 1.45], [x + 12, 1.35, z], 68);
  fill(game, 0x8bcfff, 2.5, [x - 4, 7, z + 2]);
  game.weapons.update(0, 0, null, game.view.camera, playerRig.player);
  game.weapons.gun.position.set(x + .67, 1.4, z - .2);
  game.weapons.gun.rotation.set(0, Math.PI / 2, 0);
  muzzleFlash(game.view.scene, x + 1, 1.4, z - .2);
  muzzleFlash(game.view.scene, x + 8.3, 1.4, z - 2);
  tracer(game.view.scene, [x + 8.3, 1.4, z - 2], [x + 1.5, 1.1, z], 0xffbe63);
  for (let i = 0; i < 9; i++) {
    const p = cover.position;
    tracer(game.view.scene, [p.x - 1, 1.1, p.z + .5],
      [p.x - 1.4 - i * .09, 1.2 + (i % 3) * .18, p.z + .2 + i * .1], 0xffd783);
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
  hud.setWeapons(game.weapons.hudSlots(), 2);
  hud.setRadio('K-WAVE 104.2', '“Night Bloom”');
  hud.setVitals(74, 42, 'Neon Row');
  game.minimap.draw(playerRig.player.position, Math.PI / 2, game.gang.members.map(enemy => ({
    x: enemy.position.x, z: enemy.position.z, kind: 'enemy'
  })));
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
