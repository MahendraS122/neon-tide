// Boot and the one loop: the city is generated once, then every frame reads input, steps the
// world by fixed 1/60 s slices (several in a slow frame, none in a fast one) and paints the
// result. ?shot=<name> stages a deterministic scene instead and stops, which is how the entry's
// screenshots are taken. ?seed=N fixes the city.
import { CAMERA, MAX_FRAME, STEP } from './config.js';
import { createInput } from './input.js';
import { createRenderer } from './render/renderer.js';
import { createSky } from './render/sky.js';
import { generateCity } from './world/cityGen.js';
import { createOcean } from './world/ocean.js';
import { createPlayer, turnTowards } from './entities/player.js';
import { createVehicle, stepVehicle } from './entities/vehicle.js';
import { createTraffic } from './entities/traffic.js';
import { createPedestrians } from './entities/pedestrians.js';
import { createHud } from './ui/hud.js';
import { createMinimap } from './ui/minimap.js';
import { stageShot } from './shots.js';
import { createWanted } from './systems/wanted.js';
import { createPolice } from './entities/police.js';
import { createHelicopter } from './entities/helicopter.js';
import { createRoadblocks } from './world/roadblocks.js';
import { createWeapons, createGang } from './combat/weapons.js';
import { createMissions } from './missions/missions.js';
import { createDialogue } from './ui/dialogue.js';
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam: 1337;
const canvas = document.getElementById('gl');
const view = createRenderer(canvas);
const sky = createSky(view);
const world = generateCity(view.scene, seed);
const ocean = createOcean(view.scene, sky);
const hud = createHud();
const minimap = createMinimap(document.getElementById('minimap'));
const playerRig = createPlayer(view.scene, world);
const traffic = createTraffic(view.scene, world, 22);
const peds = createPedestrians(view.scene, world, 40);
const wanted = createWanted();
const police = createPolice(view.scene, world);
const helicopter = createHelicopter(view.scene);
const roadblocks = createRoadblocks(view.scene, world);
const weapons = createWeapons(view.scene, playerRig);
const gang = createGang(view.scene,[{ x: - 130, y: world.groundHeight(- 130, 94), z: 94 }, { x:
- 124, y: world.groundHeight(- 124, 101), z: 101 }, { x: - 120, y: world.groundHeight(- 120, 87),
z: 87 },]);
weapons.setTargets(gang.members);
/** Cars the player can get into that are not part of traffic: the mission's and the starter car. */
const parked =[];
function parkCar(opts) {
  const car = createVehicle(opts);
  world.root.add(car.group);
  parked.push(car);
  car.updateModel?.();
  return car;
}
const starter = parkCar({
  kind: 'muscle', color: 0x8a2f34, x: - 282, z: 286, heading: Math.PI * 0.5, plate: 'DEX 001'
});
const cameraState = {
  yaw: 0, pitch: 0.12,
  /** Smoothed camera position, so the chase lags a touch behind the target. */
  position: view.camera.position.clone(), look: view.camera.position.clone(),
};
const game = {
  view, sky, world, ocean, hud, minimap, playerRig, traffic, peds, parked, cameraState, wanted,
  police, helicopter, roadblocks, weapons, gang, time: { day: 1, dayName: 'MON', minutes: 18 * 60 + 20 },
  cash: 500, stars: 0, money: 0, lastVehicle: starter, shotName,
};
game.parkCar = parkCar;
game.stats = { respect: 0, carsStolen: 0, tokens:[], properties: 1 };
game.missions = createMissions(game);
game.mode = 'play';
game.dialogue = createDialogue(game);
const input = createInput(canvas);
/** Every car the player can drive right now: traffic, parked and police. */
function allVehicles() {
  return[...traffic.cars, ...parked];
}
/** Arrow keys / W and S on foot, in camera space. */
function footMove() {
  return { forward: input.forward(), strafe: input.strafe() };
}
/** Car controls from the same keys, plus space for the handbrake. */
function carControls() {
  const throttle =(input.down('KeyW') || input.down('ArrowUp') ? 1: 0) -(input.down('KeyS') || input.down('ArrowDown') ?
  1: 0);
  const steer =(input.down('KeyA') || input.down('ArrowLeft') ? 1: 0) -(input.down('KeyD') || input.down('ArrowRight') ?
  1: 0);
  return {
    throttle, brake: input.down('KeyS') || input.down('ArrowDown') ? 1: 0, steer: steer *(input.down('ShiftLeft') ?
    0.6: 1), handbrake: input.down('Space'),
  };
}
/** Place the chase camera behind whatever the player is controlling. */
function updateCamera(dt) {
  const { player } = playerRig;
  const car = player.inVehicle;
  const targetYaw = cameraState.yaw;
  const distance = car ? CAMERA.carDistance: CAMERA.footDistance;
  const height = car ? CAMERA.carHeight: CAMERA.footHeight;
  const lookHeight = car ? CAMERA.carLookHeight: CAMERA.footLookHeight;
  const anchor = car ? car.position: player.position;
  const desiredX = anchor.x - Math.sin(targetYaw) * Math.cos(cameraState.pitch) * distance;
  const desiredZ = anchor.z - Math.cos(targetYaw) * Math.cos(cameraState.pitch) * distance;
  const desiredY = anchor.y + height + Math.sin(cameraState.pitch) * distance;
  const k = 1 - Math.exp(- CAMERA.follow * dt);
  cameraState.position.x +=(desiredX - cameraState.position.x) * k;
  cameraState.position.y +=(desiredY - cameraState.position.y) * k;
  cameraState.position.z +=(desiredZ - cameraState.position.z) * k;
  cameraState.look.x +=(anchor.x - cameraState.look.x) * Math.min(1, k * 1.6);
  cameraState.look.y +=(anchor.y + lookHeight - cameraState.look.y) * Math.min(1, k * 1.6);
  cameraState.look.z +=(anchor.z - cameraState.look.z) * Math.min(1, k * 1.6);
  view.camera.position.copy(cameraState.position);
  view.camera.lookAt(cameraState.look);
}
function stepGame() {
  const dt = STEP;
  if (game.mode === 'dialogue') {
    game.dialogue.update(dt, input);
    input.endFrame();
    return;
  }
  game.missions.update(dt, input);
  const { player } = playerRig;
  // Mouse turns the view; while driving the camera swings back behind the car on its own.
  const look = input.mouseLook();
  cameraState.yaw -= look.x * CAMERA.sensitivity;
  cameraState.pitch = Math.max(CAMERA.pitchMin, Math.min(CAMERA.pitchMax, cameraState.pitch + look.y * CAMERA.sensitivity));
  if (input.pressed('KeyF')) {
    if (player.inVehicle) {
      const car = playerRig.exitVehicle();
      if (car) hud.float('EXITED', 'good');
    }
    else {
      const target = playerRig.vehicleInReach(allVehicles());
      if (target) {
        // A traffic car is pulled out of the pool when stolen.
        if (traffic.cars.includes(target)) traffic.take(target);
        playerRig.enterVehicle(target);
        game.lastVehicle = target;
        wanted.crime('vehicleTheft');
        hud.float(target.isPolice ? 'POLICE CRUISER STOLEN': 'VEHICLE STOLEN', 'cash');
      }
    }
  }
  if (player.inVehicle) {
    const car = player.inVehicle;
    stepVehicle(car, dt, carControls(), world);
    playerRig.syncToVehicle(car);
    // The camera eases behind the car's heading while driving.
    const carYaw = car.heading;
    const speed = Math.abs(car.speed);
    if (speed > 2) {
      cameraState.yaw = turnTowards(cameraState.yaw, carYaw, dt *(1.4 + speed * 0.06));
    }
  }
  else {
    playerRig.step(dt, footMove(), input.sprint(), input.jump(), cameraState.yaw);
  }
  if (input.down('Mouse2') && !player.inVehicle) player.aiming = true;
  if (input.pressed('Escape')) player.aiming = false;
  const fired = weapons.update(dt, performance.now() / 1000, input, view.camera, player);
  if (fired) wanted.crime('weapon');
  game.gang.update(dt, player, weapons);
  police.update(dt, player, wanted.state.level, weapons, wanted, hud);
  const airUnit = helicopter.update(dt, player.position, wanted.state.level);
  roadblocks.update(player.position, wanted.state.level);
  airUnit.occluded = Boolean(world.hitsBuilding(player.position.x, player.position.z, 1, player.position.y));
  wanted.update(dt, player.position,[...police.units, ...police.officers], wanted.state.level >= 3 ?
  airUnit: null);
  weapons.setTargets([...game.gang.members, ...police.officers]);
  if (player.health <= 0 && !player.dead) {
    player.dead = true;
    wanted.wasted(hud);
  }
  const firingPos = fired ?[{ x: player.position.x, z: player.position.z }]:[];
  traffic.update(dt, player.position);
  peds.update(dt, player.position, firingPos);
  world.update(dt);
  ocean.update(dt, view.camera);
  sky.update(view.camera);
  // HUD: vitals, district, speed and gear.
  const district = world.districtAt(player.position.x, player.position.z);
  hud.setVitals(player.health, player.armour, district?.name ?? 'Port Solara');
  hud.setStars(wanted.state.level, wanted.state.searching);
  const response = police.list(player.position, wanted.state.level >= 3 ? airUnit: null, roadblocks.blocks);
  hud.setPolice(response, { searching: wanted.state.searching });
  hud.setWeapons(weapons.hudSlots(), weapons.state.active);
  hud.state.inCar = Boolean(player.inVehicle);
  if (player.inVehicle) {
    const kmh = player.inVehicle.speed * 3.6;
    const gear = kmh < 1 ? 'P': `G${Math.min(5, 1 + Math.floor(Math.abs(kmh) / 40))}`;
    const name = player.inVehicle.isPolice ? 'SPD CRUISER':({
      muscle: 'SOLARA V8', sport: 'VANTA GT', taxi: 'CITY CAB', van: 'COURIER', hatch: 'COMET',
      sedan: 'PALM SEDAN'
    }
    [player.inVehicle.kind] ?? 'PALM SEDAN');
    hud.setDriving(kmh, `${name} · ${gear} · ${Math.round(player.inVehicle.health)}%`, 1);
  }
  else {
    hud.setDriving(0, 'P', 1);
  }
  const blips =[...game.missions.blips(), { x: world.landmarks.safehouse.x, z: world.landmarks.safehouse.z,
  kind: 'safehouse' }, { x: world.landmarks.garage.x, z: world.landmarks.garage.z, kind: 'garage' },
  ];
  for (const unit of police.units) blips.push({ x: unit.position.x, z: unit.position.z, kind: 'police' });
  for (const enemy of game.gang.members) if (!enemy.dead) blips.push({ x: enemy.position.x, z: enemy.position.z,
  kind: 'enemy' });
  minimap.draw(player.inVehicle ? player.inVehicle.position: player.position, cameraState.yaw, blips);
  view.focusShadows(player.position.x, player.position.z);
  updateCamera(1);
  hud.state.inCar = Boolean(player.inVehicle);
  input.endFrame();
}
/* ---------------------------------------------------------------- the loop */
let last = performance.now();
let accumulator = 0;
function frame(now) {
  requestAnimationFrame(frame);
  accumulator += Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  while (accumulator >= STEP) {
    stepGame();
    accumulator -= STEP;
  }
  sky.update(view.camera);
  view.draw();
}
/* ---------------------------------------------------------------- shots */
if (shotName) {
  stageShot(shotName, game);
}
else {
  hud.hideLoading();
  // Start looking north up Ocean Drive.
  cameraState.yaw = 0.4;
  updateCamera(1);
  requestAnimationFrame(frame);
}
export { game };
