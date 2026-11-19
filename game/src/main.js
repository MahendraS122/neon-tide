// Bootstrap Port Solara with gameplay first, a fixed simulation step and procedural art last.
import { createWanted } from './systems/wanted.js';
import { createPolice } from './entities/police.js';
import { createHelicopter } from './entities/helicopter.js';
import { createRoadblocks } from './world/roadblocks.js';
import { createMissions } from './missions/missions.js';
import { createWeapons, createVitals } from './combat/weapons.js';
import { createDialogue } from './ui/dialogue.js';
import { createTitleScreen } from './ui/titleScreen.js';
import { createCityMap } from './ui/cityMap.js';
import { createGarageMenu } from './ui/garage.js';
import { createSave } from './systems/save.js';
import { createRaces } from './systems/races.js';
import { createCollectibles } from './systems/collectibles.js';
import { createClock } from './systems/clock.js';
import { createPauseMenu } from './ui/pauseMenu.js';
import { createGarage } from './world/garages.js';
import { safehouse } from './world/locations.js';
import { createRadio } from './systems/radio.js';
import { createHud } from './ui/hud.js';
import { createCombatEffects } from './combat/effects.js';
import { createCombatAudio } from './combat/audio.js';
import { createGangs } from './entities/gangs.js';
import { createPlayer } from './entities/player.js';
import { createVehicleSystem } from './entities/vehicle.js';
import { createTraffic } from './entities/traffic.js';
import { createPedestrians } from './entities/pedestrians.js';
import { createInput } from './entities/input.js';
import { createCharacter } from './entities/character.js';
import { createVehicleModel } from './entities/vehicleModel.js';
import { createCity } from './world/cityGen.js';
import { setupShot } from './shots.js';
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
const vitals = createVitals();
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
  vitals.reset();
});
const pedestrians = createPedestrians(scene, city, seededRandom(43), createCharacter);
function crime(reason, amount) {
  wanted.report(reason, amount);
  police.note(player.position);
}
const vehicles = createVehicleSystem(scene, input, city, player, (position, yaw) => {
  pedestrians.eject(position, yaw);
  progress.stolen += 1;
  crime('Grand theft', 1);
}, createVehicleModel, reward);
const hero = vehicles.add('sports', '#20d6bf', 104.6, 10, Math.PI);
vehicles.add('muscle', '#d36b46', 86.9, -9, Math.PI);
vehicles.add('suv', '#e1d1b9', 87.1, 65, 0);
vehicles.add('taxi', '#edbb42', 105, -55, Math.PI);
vehicles.add('police', '#192b35', 28.8, 71, Math.PI);
vehicles.add('van', '#72a9b0', -47.4, 158, 0);
const traffic = createTraffic(vehicles, city, seededRandom(980));
const helicopter = createHelicopter(scene, city);
const roadblocks = createRoadblocks(scene, city);
const effects = createCombatEffects(scene, seededRandom(517));
const audio = createCombatAudio();
function enemyFire(origin, target, damage) {
  effects.shot(origin, target, true);
  audio.play(0.42, 0.09);
  vitals.hurt(player.vehicle ? damage * 0.55 : damage);
}
const police = createPolice(scene, city, vehicles, player, createCharacter, enemyFire);
const gangs = createGangs(scene, city, player, createCharacter, enemyFire, seededRandom(380));
for (const [x, z] of [[29, -31], [18, -22], [29, -18], [21, -12], [27, -8]]) gangs.add(x, z);
const personZones = [[1.03, 0.39], [1.67, 0.22, true]];
const progress = { cash: 2450, respect: 12, stolen: 0, tokens: [], races: 0, callout: '', flash: 0 };
function reward(label, value) {
  progress.cash += value;
  progress.respect = Math.min(100, progress.respect + 2);
  progress.callout = `${label} +$${value}`;
  progress.flash = 2.5;
}
function combatTargets(ranged) {
  const targets = gangs.members.filter(member => member.health).map(member => ({
    position: member.position, zones: personZones,
    hit(damage, headshot) {
      member.hit(damage);
      if (!member.health) reward(headshot ? 'HEADSHOT' : 'LOOKOUT DOWN', headshot ? 150 : 75);
    }
  }));
  for (const unit of police.units) {
    if (!unit.onFoot) continue;
    targets.push({ position: unit.position, zones: personZones, hit(damage) {
      unit.integrity -= damage;
      crime('Assault on SPD', 0.65);
    } });
  }
  if (!ranged) return targets;
  for (const car of vehicles.vehicles) {
    if (car === player.vehicle) continue;
    for (const offset of [-1.15, 0, 1.15]) {
      const position = car.position.clone().add(new THREE.Vector3(
        Math.sin(car.yaw) * offset, 0, Math.cos(car.yaw) * offset));
      targets.push({ position, zones: [[0.57, 0.82]], hit(damage) {
        car.condition = Math.max(0, car.condition - damage * 0.32);
      } });
    }
  }
  return targets;
}
const weapons = createWeapons(player, input, city, effects, audio, seededRandom(32), {
  targets: combatTargets,
  onShot(origin) {
    pedestrians.onGunfire(origin);
    gangs.alert(origin);
    crime('Shots fired', 0.32);
  }
});
const radio = createRadio();
function responseUnits() {
  return [...police.units, ...(roadblocks.active ? [roadblocks.unit] : []),
    ...(helicopter.active ? [helicopter.unit] : [])];
}
const hud = createHud(player, vehicles, city, {
  wanted, vitals, weapons, gangs, radio, progress, units: responseUnits
});
const actorBatch = createActorBatch(scene);
const game = { scene, camera, renderer, city, sky, player, vehicles, traffic, pedestrians, hero,
  wanted, police, helicopter, roadblocks, weapons, vitals, effects, gangs, progress, radio, textures,
  get time() { return time; }, get frames() { return frames; } };
const shotName = new URLSearchParams(location.search).get('shot');
const shot = setupShot(shotName, game, seededRandom(shotName === 'chase' ? 209 : 749));
const missions = createMissions(game, input);
game.missions = missions;
const cityClock = createClock();
const garage = createGarage(game);
const garageMenu = createGarageMenu(garage, progress);
const save = createSave({ progress, missions, cityClock, garage });
const races = createRaces(game, reward);
const collectibles = createCollectibles(game, reward);
const cityMap = createCityMap(game);
if (shotName === 'map') cityMap.open(true);
const canSave = () => !player.vehicle && !wanted.stars && !wanted.ending
  && Math.hypot(player.position.x - safehouse.x, player.position.z - safehouse.z) < 9;
const pause = createPauseMenu({ canSave, save: save.write, openMap: cityMap.open });
let nightOverride = null;
if (shot) missions.destination.set(100, 0.2, -34);
const dialogue = createDialogue();
missions.setDialogue(lines => dialogue.enqueue(lines));
game.dialogue = dialogue;
function beginStory(continuing = false) {
  document.body.classList.remove('title-active');
  input.held.clear();
  input.clearPresses();
  player.position.set(safehouse.x, 0.22, safehouse.z);
  player.character.root.position.copy(player.position);
  player.updateCamera(camera, 1 / 60, true);
  const restored = continuing && save.load();
  sky.setNight(cityClock.night);
  if (!restored || missions.index === 0) missions.start();
}
const title = !shotName || shotName === 'title' ? createTitleScreen({
  player, camera, hero, shot: shotName === 'title', saveDetail: save.detail(),
  onNewGame: () => beginStory(), onContinue: () => beginStory(true)
}) : null;
game.title = title;
document.body.classList.toggle('title-active', Boolean(title));
actorBatch.add(character.root);
vehicles.vehicles.forEach(vehicle => actorBatch.add(vehicle.root));
const registeredPeople = new Set();
const clock = new THREE.Clock();
let time = 0;
let accumulator = 0;
let frames = 0;
if (!shot) player.updateCamera(camera, 1 / 60, true);

function simulate(dt) {
  if (title?.active) return;
  if (input.take('KeyM') && !pause.active && !garageMenu.active) {
    if (cityMap.active) cityMap.close();
    else cityMap.open();
  }
  if (cityMap.active) {
    if (input.take('Escape')) cityMap.close();
    input.clearPresses();
    return;
  }
  if (input.take('Escape')) {
    if (garageMenu.active) garageMenu.close();
    else if (pause.active) pause.close();
    else pause.open();
    return;
  }
  if (!pause.active && input.take('KeyG') && player.vehicle && garage.nearby() && Math.abs(player.vehicle.speed) <= 3) {
    if (garageMenu.active) garageMenu.close();
    else garageMenu.open();
    return;
  }
  if (pause.active || garageMenu.active) {
    input.clearPresses();
    return;
  }
  const speaking = dialogue.active;
  dialogue.update(dt);
  if (speaking) {
    input.clearPresses();
    return;
  }
  time += dt;
  cityClock.update(dt);
  if (input.take('KeyK')) {
    const message = canSave() ? (save.write() ? 'SAFEHOUSE · GAME SAVED' : 'SAVE UNAVAILABLE')
      : collectibles.useService();
    if (message) {
      progress.callout = message;
      progress.flash = 3;
    }
  }
  if (input.take('KeyT') && !missions.active) races.start();
  effects.update(dt);
  progress.flash = Math.max(0, progress.flash - dt);
  if (wanted.ending) {
    if (missions.active) missions.fail(wanted.ending);
    wanted.update(dt);
    return;
  }
  if (input.take('KeyN')) nightOverride = !sky.night;
  const nextNight = nightOverride ?? cityClock.night;
  if (nextNight !== sky.night) sky.setNight(nextNight);
  if (input.take('KeyE') || input.take('KeyV')) radio.cycle();
  if (input.take('KeyQ')) radio.cycle(-1);
  traffic.update(dt, time);
  vehicles.update(dt, time);
  radio.update(dt, Boolean(player.vehicle));
  player.aiming = weapons.selected > 0 || input.down('Mouse0') || input.down('KeyX');
  player.update(dt);
  pedestrians.update(dt);
  weapons.update(dt);
  gangs.update(dt);
  const aerialSight = helicopter.update(dt, time, wanted.stars, player.position);
  roadblocks.update(wanted.stars, player, time);
  const response = police.update(dt, wanted.stars, aerialSight);
  wanted.update(dt, { ...response, health: vitals.health });
  missions.update(dt);
  races.update(dt);
  collectibles.update(dt, time);
}

renderer.setAnimationLoop(() => {
  if (shot) {
    title?.update(0);
    city.update(0, 5.4, sky.night);
    sky.update(player.position);
    actorBatch.update(player.position);
    hud.update(0, sky.night, shot);
    renderer.render(scene, camera);
    frames += 1;
    window.__shotReady = true;
    renderer.setAnimationLoop(null);
    return;
  }
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
  if (title?.active) title.update(dt);
  else if (!pause.active && !garageMenu.active && !cityMap.active) player.updateCamera(camera, dt);
  city.update(dt, time, sky.night);
  sky.update(player.position);
  actorBatch.update(player.position);
  const hint = races.hint || (player.vehicle && garage.nearby() ? 'STOP · G WORKSHOP'
    : canSave() ? 'K SAVE AT SAFEHOUSE · M ATLAS' : collectibles.hint()
    || (races.nearby() && player.vehicle && !missions.active ? 'T ENTER GLASSWATER SPRINT' : ''));
  hud.update(dt, sky.night, { mission: missions.presentation(), clock: cityClock.label,
    hint: hint || undefined, route: races.active ? [races.destination] : missions.blips.map(blip => blip.position) });
  renderer.render(scene, camera);
  frames += 1;
  if (frames >= 3) window.__shotReady = true;
});

// This inspectable state also gives later story and police systems stable integration points.
window.__game = game;
