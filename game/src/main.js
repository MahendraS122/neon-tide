// Bootstrap Port Solara with gameplay first, a fixed simulation step and procedural art last.
import { createWanted } from './systems/wanted.js';
import { createPolice } from './entities/police.js';
import { createHelicopter } from './entities/helicopter.js';
import { createRoadblocks } from './world/roadblocks.js';
import { createHud } from './ui/hud.js';
import { createPlayer } from './entities/player.js';
import { createVehicleSystem } from './entities/vehicle.js';
import { createTraffic } from './entities/traffic.js';
import { createPedestrians } from './entities/pedestrians.js';
import { createInput } from './entities/input.js';
import { createCharacter } from './entities/character.js';
import { createVehicleModel } from './entities/vehicleModel.js';
import { createCity } from './world/cityGen.js';
import { createRenderer } from './render/renderer.js';
import { createSky } from './render/sky.js';
import { createTextures, seededRandom } from './render/textures.js';
import { createActorBatch } from './render/actorBatch.js';
import * as THREE from '../vendor/three.module.min.js';

const canvas = document.querySelector('#game');
const { renderer, scene, camera, adaptResolution } = createRenderer(canvas);
const sky = createSky(scene);
const textures = createTextures();
const environmentGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = environmentGenerator.fromEquirectangular(textures.environment).texture;
environmentGenerator.dispose();
const city = createCity(scene, textures);
const input = createInput(canvas);
const character = createCharacter({ player: true, shirt: '#387e81' });
const player = createPlayer(scene, character, input, city);
const wanted = createWanted(() => {
  if (player.vehicle) {
    const car = player.vehicle;
    car.controlled = car.occupied = car.driverHead.visible = false;
    car.speed = 0;
    car.velocity.set(0, 0, 0);
    player.vehicle = null;
  }
  player.position.set(109, 0.22, 15);
  player.character.root.position.copy(player.position);
  player.health = 100;
});
player.health = 100;
const pedestrians = createPedestrians(scene, city, seededRandom(43), createCharacter);
function crime(reason, amount) {
  wanted.report(reason, amount);
  police.note(player.position);
}
const vehicles = createVehicleSystem(scene, input, city, player, (position, yaw) => {
  pedestrians.eject(position, yaw);
  crime('Grand theft', 1);
}, createVehicleModel);
const hero = vehicles.add('sports', '#20d6bf', 104.6, 10, Math.PI);
vehicles.add('muscle', '#d36b46', 86.9, -9, Math.PI);
vehicles.add('suv', '#e1d1b9', 87.1, 65, 0);
vehicles.add('taxi', '#edbb42', 105, -55, Math.PI);
vehicles.add('police', '#192b35', 28.8, 71, Math.PI);
vehicles.add('van', '#72a9b0', -47.4, 158, 0);
const traffic = createTraffic(vehicles, city, seededRandom(980));
const helicopter = createHelicopter(scene, city);
const roadblocks = createRoadblocks(scene, city);
const police = createPolice(scene, city, vehicles, player, createCharacter, (origin, target, damage) => {
  player.health = Math.max(0, player.health - damage);
});
const hud = createHud(player, vehicles, city, wanted);
const actorBatch = createActorBatch(scene);
actorBatch.add(character.root);
vehicles.vehicles.forEach(vehicle => actorBatch.add(vehicle.root));
const registeredPeople = new Set();
const clock = new THREE.Clock();
let time = 0;
let accumulator = 0;
let frames = 0;
player.updateCamera(camera, 1 / 60, true);

function simulate(dt) {
  time += dt;
  if (wanted.ending) {
    wanted.update(dt);
    return;
  }
  if (input.take('KeyN')) sky.setNight(!sky.night);
  traffic.update(dt, time);
  vehicles.update(dt, time);
  player.update(dt);
  pedestrians.update(dt);
  const aerialSight = helicopter.update(dt, time, wanted.stars, player.position);
  roadblocks.update(wanted.stars, player, time);
  const response = police.update(dt, wanted.stars, aerialSight);
  wanted.update(dt, { ...response, health: player.health });
}

renderer.setAnimationLoop(() => {
  const elapsed = clock.getDelta();
  adaptResolution(elapsed);
  const dt = Math.min(elapsed, 0.1);
  accumulator += dt;
  while (accumulator >= 1 / 60) {
    simulate(1 / 60);
    accumulator -= 1 / 60;
  }
  for (const person of pedestrians.people) {
    if (registeredPeople.has(person)) continue;
    actorBatch.add(person.character.root);
    registeredPeople.add(person);
  }
  player.updateCamera(camera, dt);
  city.update(dt, time, sky.night);
  sky.update(player.position);
  actorBatch.update(player.position);
  hud.update(dt, sky.night);
  renderer.render(scene, camera);
  frames += 1;
  if (frames >= 3) window.__shotReady = true;
});

// This inspectable state also gives later story and police systems stable integration points.
window.__game = { scene, camera, renderer, city, sky, player, vehicles, traffic, pedestrians, hero,
  wanted, police, helicopter, roadblocks,
  get time() { return time; }, get frames() { return frames; } };
