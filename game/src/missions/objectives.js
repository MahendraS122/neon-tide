// Objective actors and completion rules, shared by every campaign mission.
import * as THREE from 'three';
import { createGang } from '../combat/weapons.js';
export function createObjectiveMarker(scene, color = 0x25e6d0) { const root = new THREE.Group();
const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24, depthWrite:
false, });
const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5, 24, 1, true), material);
beam.position.y = 2.5;
root.add(beam);
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.12, 6, 32), material.clone());
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.16;
ring.material.opacity = 0.9;
root.add(ring);
scene.add(root);
return root;
} export function prepareObjective(game, stage, runtime) { const[x, z] = stage.at;
if (stage.type === 'steal') {
  runtime.car = game.parkCar({
    kind: stage.car, x, z, heading: 0, color: stage.car === 'muscle' ? 0x25d4bc: 0xef4165, plate:
    'STORY 01',
  });
  runtime.car.position.y = game.world.groundHeight(x, z);
  runtime.car.updateModel();
}
if (stage.type === 'combat') {
  game.gang.root.removeFromParent();
  const positions = Array.from({ length: stage.enemies },(_, i) =>({ x: x +(i % 2 ? 5: - 5), z:
  z + Math.floor(i / 2) * 5 - 5, y: game.world.groundHeight(x, z), }));
  game.gang = createGang(game.view.scene, positions);
  game.weapons.setTargets(game.gang.members);
  game.weapons.state.active = 1;
  game.playerRig.player.armour = Math.max(65, game.playerRig.player.armour);
}
if (stage.type === 'race') game.races?.start(true);
if (stage.type === 'escape') game.wanted.crime('carjacking', 1.7);
} export function objectiveComplete(game, stage, runtime, dt) { const player = game.playerRig.player;
const distance = Math.hypot(player.position.x - stage.at[0], player.position.z - stage.at[1]);
switch (stage.type) {
  case 'steal': return player.inVehicle === runtime.car;
  case 'drive': return distance < 11 && Boolean(player.inVehicle) &&(!runtime.car || player.inVehicle === runtime.car);
  case 'drop': return distance < 7;
  case 'reach': return distance < 9;
  case 'combat': return game.gang.members.every(member => member.dead);
  case 'escape': return game.wanted.state.level === 0;
  case 'race': if (game.races) return game.races.state.finished && game.races.state.won;
  runtime.raceTime =(runtime.raceTime ?? 0) + dt;
  return distance < 8 && runtime.raceTime > 20;
  default: return false;
}
}
