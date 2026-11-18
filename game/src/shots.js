// Deterministic staged captures of the game's live systems.
import * as THREE from 'three';
import { createVehicle, stepVehicle } from './entities/vehicle.js';
import { createDice } from './random.js';
import { createGang } from './combat/weapons.js';
import { poseFigure } from './entities/character.js';
const wait =(ms) => new Promise(resolve => setTimeout(resolve, ms));
function finish(game, frames = 3) {
  prepareActionFrame(game);
  let painted = 0;
  return new Promise(resolve => {
    function paint() {
      game.sky.update(game.view.camera);
      game.view.draw();
      if (++ painted === frames) {
        window.__shotReady = true;
        resolve();
      }
      requestAnimationFrame(paint);
    }
    requestAnimationFrame(paint);
  });
}
function prepareActionFrame(game) {
  const player = game.playerRig.player;
  game.weapons.update(0, 0, null, game.view.camera, player);
  if (player.inVehicle) {
    const hero = player.inVehicle;
    // A reverse three-quarter camera puts the interceptors and air unit in view.
    game.view.camera.position.set(hero.position.x + 10, 7.5, hero.position.z + 16);
    game.view.camera.lookAt(hero.position.x - 1, 4, hero.position.z - 8);
    game.helicopter.root.position.set(hero.position.x - 6, 13, hero.position.z - 20);
    game.helicopter.root.scale.setScalar(1.5);
    const fill = new THREE.DirectionalLight(0xffd6c0, 2.1);
    fill.position.copy(game.view.camera.position);
    game.view.scene.add(fill);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xd5c2d0, transparent: true, opacity:
    .24, depthWrite: false });
    for (let i = 0; i < 8; i ++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(.28 + i * .04, 8, 6), smokeMat);
      puff.position.set(hero.position.x +(i % 2 ? 1: - 1), .3, hero.position.z - 2.3 - i * .4);
      game.view.scene.add(puff);
    }
    game.police.units.forEach((u, i) => {
      u.car.lights.redPool.intensity = 7;
      u.car.lights.bluePool.intensity = 7;
    });
    game.hud.setPolice(game.police.list(hero.position, game.helicopter.unit, game.roadblocks.blocks),
    { searching: false });
    game.minimap.draw(hero.position, Math.PI,[...blipsFor(game.world, hero), ...game.police.units.map(u =>({ x:
    u.position.x, z: u.position.z, kind: 'police' }))]);
  }
  else {
    game.hud.state.inCar = false;
    game.hud.setDriving(0, '', 0);
    game.gang.members.forEach(e => poseFigure(e.figure, 0, 0, { aim: true }));
    game.weapons.gun.position.copy(player.position).add(new THREE.Vector3(.65, 1.4, - .24));
    addMuzzleFlash(game, player.position.x + .95, player.position.z - .24);
    const fill = new THREE.DirectionalLight(0x85d5ff, 1.5);
    fill.position.set(player.position.x - 8, 8, player.position.z - 5);
    game.view.scene.add(fill);
    game.police.spawn({ x: player.position.x - 32, z: player.position.z }, 1);
    game.hud.setPolice(game.police.list(player.position, null), { searching: true });
  }
}
function rollingCar(game, { x, z, heading, speed, kind, color, police = false }) {
  const car = createVehicle({
    kind: kind ??(police ? 'police': 'sedan'), color: color ??(police ? 0xf0f2f6: 0x2b3a52), x,
    z, heading
  });
  car.position.y = game.world.groundHeight(x, z);
  car.velocity.set(Math.sin(heading) * speed, 0, Math.cos(heading) * speed);
  car.speed = speed;
  game.world.root.add(car.group);
  game.parked.push(car);
  return car;
}
export async function chaseShot(game) { const { world, hud, playerRig } = game;
game.sky.setTime('day');
hud.showHud(true);
hud.hideLoading();
game.wanted.state.level = 4;
game.wanted.state.heat = 78;
const heroX = - 276.8, heroZ = 188;
const hero = rollingCar(game, { x: heroX, z: heroZ, heading: 0, speed: 41.7, kind: 'muscle', color:
0xed287d });
playerRig.enterVehicle(hero);
playerRig.syncToVehicle(hero);
game.cameraState.yaw = - .5;
game.cameraState.pitch = .13;
const pursuers =[];
for (let i = 0; i < 3; i ++) {
  const car = rollingCar(game, {
    x: heroX +(i === 0 ? - 2.8: i === 1 ? 2.9: 0), z: heroZ - 8 - i * 5, heading: 0, speed: 24 + i * 2,
    police: true
  });
  pursuers.push(car);
}
const dice = createDice(31);
for (let i = 0; i < 5; i ++) rollingCar(game, {
  x: heroX +(i % 2 ? 4.9: - 4.9), z: heroZ + 28 + i * 22, heading: i % 2 ? Math.PI: 0, speed: 10,
  kind: dice.pick(['sedan', 'hatch', 'taxi', 'van']), color: dice.pick([0xd8d8de, 0x25544a, 0xf0c220,
  0x3f4f6f])
});
game.helicopter.update(0, { x: heroX, z: heroZ }, 4);
game.police.units.length = 0;
pursuers.forEach((car, i) => game.police.units.push({
  id: `UNIT ${21+i}`, kind: 'cruiser', status: i === 0 ? 'RAMMING': 'PURSUIT', car, position: car.position,
  sightRange: 90, occluded: false
}));
game.roadblocks.update({ x: heroX, z: heroZ }, 4);
for (let i = 0; i < 3; i ++) {
  stepVehicle(hero, 1 / 60, { throttle: 0, brake: 0, steer: 0, handbrake: false }, world);
  for (const car of pursuers) stepVehicle(car, 1 / 60, { throttle: 0, brake: 0, steer: 0, handbrake:
  false }, world);
  playerRig.syncToVehicle(hero);
}
[hero, ...pursuers].forEach((car, i) => addContactShadow(game, car, i ? 1.15: 1.3));
hud.setStars(4, false);
hud.setCash(12480);
hud.setClock(3, 'THU', '18:42');
hud.setMission({
  chapter: 'CHAPTER 3 · HOT WIRE', name: 'RUNNING THE BLOCK', objective: 'Lose the <span class="obj-mark">SPD</span> before the bridge on 5th.',
  timeLeft: 87, stages: 5, stageIndex: 2, cashLabel: '+$3,500'
});
hud.setPolice([{ label: 'UNIT 21', distance: 10, status: 'RAMMING' }, { label: 'UNIT 34', distance:
17, status: 'PURSUIT' }, { label: 'UNIT 39', distance: 23, status: 'PURSUIT' }, { label: 'AIR 1',
distance: 29, status: 'HELI' }], { searching: false });
hud.setWeapons([{ key: '1', name: 'FISTS', ammo: null }, { key: '2', name: 'PISTOL', ammo: 34 },
{ key: '3', name: 'SMG', ammo: 120 }, { key: '4', name: 'SHOTGUN', ammo: 18 }, { key: '5', name:
'RIFLE', ammo: 45 }], 2);
hud.setRadio('SUNSET FM 98.6', '“Chrome Palms”');
hud.state.inCar = true;
hud.setDriving(150, 'SOLARA V8 · G4 · 82%', .72);
hud.showDialogue('MARA REYES', 'Hollis has the bridge sealed. Take the slip road past the pier and lose them in the marina.');
hud.float('DRIFT x3  +$150', 'good');
game.minimap.draw(hero.position, game.cameraState.yaw, blipsFor(world, hero));
placeCamera(game, hero.position, game.cameraState.yaw, game.cameraState.pitch, 9.4, 3.6, 1.2);
await wait(70);
await finish(game);
} export async function onfootShot(game) { const { world, hud, playerRig } = game;
game.sky.setTime('night');
hud.showHud(true);
hud.hideLoading();
const x = - 182, z = 94;
playerRig.teleport(x, z, Math.PI / 2);
playerRig.player.health = 74;
playerRig.player.armour = 42;
playerRig.player.aiming = true;
poseFigure(playerRig.figure, 0, 0, { aim: true });
game.cameraState.yaw = Math.PI / 2;
game.cameraState.pitch = .07;
game.weapons.state.active = 2;
const gang = createGang(game.view.scene,[{ x: x + 9, y: world.groundHeight(x + 9, z + 5), z: z + 5 },
{ x: x + 13, y: world.groundHeight(x + 13, z + 10), z: z + 10 }, { x: x + 18, y: world.groundHeight(x + 18,
z + 3), z: z + 3 }]);
gang.members.forEach(e => {
  e.figure.root.rotation.y = - Math.PI / 2;
});
game.gang = gang;
game.weapons.setTargets(gang.members);
game.wanted.state.level = 2;
game.wanted.state.heat = 42;
addNeonAlley(game, x, z);
addFireWreck(game, x - 3, z + 4);
addMuzzleFlash(game, x + 9, z + 5);
hud.setStars(2, true);
hud.setCash(8730);
hud.setClock(3, 'THU', '23:14');
hud.setMission({
  chapter: 'CHAPTER 2 · CASH & CONCRETE', name: 'BAD BLOOD', objective: 'Take out the <span class="obj-mark">Lavado lookouts 2/5</span> on Neon Row.',
  timeLeft: null, stages: 4, stageIndex: 1, cashLabel: '+$1,200'
});
hud.setPolice([{ label: 'UNIT 07', distance: 41, status: 'PURSUIT' }], { searching: true });
hud.setWeapons(game.weapons.hudSlots(), 2);
hud.setRadio('K-WAVE 104.2', '“Night Bloom”');
hud.hideDialogue();
hud.float('RETURN FIRE  +$75', 'cash');
hud.setVitals(74, 42, 'Neon Row');
game.minimap.draw(playerRig.player.position, game.cameraState.yaw,[...blipsFor(world, playerRig.player),
...gang.members.map(e =>({ x: e.position.x, z: e.position.z, kind: 'enemy' }))]);
placeCamera(game, playerRig.player.position, game.cameraState.yaw, game.cameraState.pitch, 7.4,
2.8, 1.35);
await wait(70);
await finish(game);
} function addContactShadow(game, car, opacity = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(car.shape.width * 1.35, car.shape.length * 1.15),
  new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .34 * opacity, depthWrite:
  false }));
  m.rotation.x = - Math.PI / 2;
  m.position.set(car.position.x, car.position.y + .04, car.position.z);
  m.rotation.z = - car.heading;
  m.renderOrder = 2;
  game.view.scene.add(m);
  return m;
}
function placeCamera(game, a, yaw, pitch, distance, height, lookHeight) {
  const c = game.view.camera;
  c.position.set(a.x - Math.sin(yaw) * Math.cos(pitch) * distance, a.y + height + Math.sin(pitch) * distance,
  a.z - Math.cos(yaw) * Math.cos(pitch) * distance);
  c.lookAt(a.x, a.y + lookHeight, a.z);
  game.cameraState.position.copy(c.position);
  game.cameraState.look.set(a.x, a.y + lookHeight, a.z);
  game.sky.update(c);
  game.view.focusShadows(a.x, a.z);
  game.view.renderer.shadowMap.needsUpdate = true;
}
function blipsFor(world, player) {
  return[{ x: world.landmarks.safehouse.x, z: world.landmarks.safehouse.z, kind: 'safehouse' },
  { x: world.landmarks.garage.x, z: world.landmarks.garage.z, kind: 'garage' }, { x: player.position.x,
  z: player.position.z, kind: 'mission' }];
}
function addNeonAlley(game, x, z) {
  const root = new THREE.Group();
  root.name = 'Neon Row night dressing';
  game.view.scene.add(root);
  const sign =(label, color, px, py, pz, angle = 0) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#07111c';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 144);
    ctx.font = 'italic 900 82px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
    ctx.fillText(label, 256, 108);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 2.45), new THREE.MeshBasicMaterial({ map:
    t, side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(px, py, pz);
    m.rotation.y = angle;
    root.add(m);
  };
  const shop =(px, pz, color) => {
    const shell = new THREE.Mesh(new THREE.BoxGeometry(1.5, 7.2, 16), new THREE.MeshStandardMaterial({ color:
    0x183142, roughness: .87 }));
    shell.position.set(px, 3.5, pz);
    root.add(shell);
    for (let i = - 1; i <= 1; i ++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.8), new THREE.MeshBasicMaterial({ color,
      toneMapped: false }));
      w.position.set(px - .77, 2.8, pz + i * 4.4);
      w.rotation.y = - Math.PI / 2;
      root.add(w);
    }
    const l = new THREE.PointLight(color, 20, 33, 2);
    l.position.set(px - 2, 4, pz);
    root.add(l);
  };
  shop(x + 20, z + 8, 0xff3f9c);
  shop(x + 20, z + 24, 0x25e6d0);
  shop(x - 20, z + 16, 0xff9d30);
  sign('PALM / CLUB', '#ff42a5', x + 18, 7, z + 2, - Math.PI / 2);
  sign('NEON ROW', '#2debd7', x + 19, 8, z + 18, - Math.PI / 2);
  sign('LUNA MOTEL', '#ffa52e', x - 18, 6, z + 15, Math.PI / 2);
  for (const[dx, dz, color] of[[- 12, - 1, 0x27dbff],[12, 11, 0xff2c91],[- 10, 23, 0x28e5d2],[12,
  30, 0xffb34b]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.13, .19, 6, 8), new THREE.MeshStandardMaterial({ color:
    0x28313c, metalness: .6, roughness: .35 }));
    pole.position.set(x + dx, 3, z + dz);
    root.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color,
    toneMapped: false }));
    bulb.position.set(x + dx, 6, z + dz);
    root.add(bulb);
    const l = new THREE.PointLight(color, 30, 25, 2);
    l.position.copy(bulb.position);
    root.add(l);
  }
  for (let i = 0; i < 11; i ++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2 + i % 3, .45 + i % 2 * .4), new THREE.MeshBasicMaterial({ color:
    i % 2 ? 0x24c9cb: 0xf23191, transparent: true, opacity: .2, depthWrite: false }));
    p.rotation.x = - Math.PI / 2;
    p.position.set(x - 10 + i * 7 % 20, .035, z - 7 + i * 3.7);
    root.add(p);
  }
  return root;
}
function addFireWreck(game, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = - .5;
  game.view.scene.add(g);
  for (const[geo, mat, y] of[[new THREE.BoxGeometry(2.2, .62, 4.4), new THREE.MeshStandardMaterial({ color:
  0x25232c, metalness: .62, roughness: .32 }), .68],[new THREE.BoxGeometry(1.65, .72, 2.1), new THREE.MeshStandardMaterial({ color:
  0x101a22, metalness: .35, roughness: .2 }), 1.24]]) {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y;
    g.add(m);
  }
  const fm = new THREE.MeshBasicMaterial({ color: 0xff4b11, toneMapped: false });
  for (let i = 0; i < 7; i ++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(.3 + i % 3 * .1, 1.2 + i % 2 * .8, 7), fm);
    f.position.set((i - 3) * .27, 1.5 + i % 3 * .25, i % 2 ? - .5: .65);
    g.add(f);
  }
  const fire = new THREE.PointLight(0xff4c12, 55, 28, 1.7);
  fire.position.set(0, 2, 0);
  g.add(fire);
  for (let i = 0; i < 4; i ++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(.45 + i * .17, 8, 7), new THREE.MeshBasicMaterial({ color:
    0x252a32, transparent: true, opacity: .48, depthWrite: false }));
    s.position.set((i % 2 - .5) * .4, 2.6 + i * .55,(i % 2) * .3);
    g.add(s);
  }
  return g;
}
function addMuzzleFlash(game, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 1.55, z);
  game.view.scene.add(g);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), new THREE.MeshBasicMaterial({ color:
  0xffce45, toneMapped: false })));
  const l = new THREE.PointLight(0xff8b32, 48, 23, 2);
  l.position.set(x, 2, z);
  game.view.scene.add(l);
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 1.45, z), new THREE.Vector3(x - 6,
  .95, z - 4)]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffbd5d, transparent: true,
  opacity: .95 }));
  game.view.scene.add(line);
  return { group: g, light: l, line };
}
export async function stageShot(name, game) { try {
  if (name === 'onfoot') await onfootShot(game);
  else await chaseShot(game);
}
catch (error) {
  console.error('shot failed', error);
  game.sky.update(game.view.camera);
  game.view.draw();
  window.__shotReady = true;
}
}
