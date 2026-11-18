// Street circuit uses visible checkpoints and road-following rival cars with real progress.
import { createObjectiveMarker } from '../missions/objectives.js';
export const CIRCUIT =[[- 282, - 188],[- 94, - 188],[- 94, 94],[- 282, 94],[- 282, - 94]];
export function createRaces(game) { const startPoint = { x: - 282, z: - 94 };
const state = { active: false, finished: false, won: false, checkpoint: 0, elapsed: 0, position:
1 };
const marker = createObjectiveMarker(game.view.scene, 0xc694ff);
const rivals =[];
let story = false;
function stop() {
  rivals.forEach(rival => {
    rival.car.group.removeFromParent();
    const index = game.parked.indexOf(rival.car);
    if (index >= 0) game.parked.splice(index, 1);
  });
  rivals.length = 0;
  state.active = false;
  state.finished = false;
  state.won = false;
  marker.visible = false;
}
function start(isStory = false) {
  stop();
  story = isStory;
  Object.assign(state, { active: true, finished: false, won: false, checkpoint: 0, elapsed: 0, position:
  1 });
  for (let i = 0; i < 2; i ++) {
    const car = game.parkCar({
      kind: i ? 'muscle': 'sport', color: i ? 0xffa543: 0x9c65db, x: - 282 +(i ? 4: - 4), z: - 104 - i * 5,
      heading: Math.PI
    });
    rivals.push({ car, checkpoint: 0, speed: 15.5 + i * 1.3 });
  }
  game.hud.float('SUNSET CIRCUIT · BEAT THE CREW', 'cash');
}
function finish(won) {
  state.active = false;
  state.finished = true;
  state.won = won;
  marker.visible = false;
  if (!story) {
    if (won) {
      game.cash += 1800;
      game.stats.respect += 100;
      game.hud.setCash(game.cash);
    }
    game.hud.banner(won ? 'RACE WON': 'RACE LOST', won ? '+$1,800 · Sunset Circuit': 'Meet Nina to retry',
    { pass: won });
    if (won) game.save.autosave();
  }
}
function update(dt, input) {
  if (!state.active) {
    const player = game.playerRig.player;
    if (input.pressed('Enter') && !game.missions.current() && player.inVehicle && Math.hypot(player.position.x - startPoint.x,
    player.position.z - startPoint.z) < 12) start();
    return;
  }
  state.elapsed += dt;
  for (const rival of rivals) {
    const target = CIRCUIT[rival.checkpoint];
    if (!target) continue;
    const p = rival.car.position;
    const dx = target[0] - p.x;
    const dz = target[1] - p.z;
    const distance = Math.hypot(dx, dz);
    if (distance < rival.speed * dt + 2) {
      p.set(target[0], game.world.groundHeight(...target), target[1]);
      rival.checkpoint ++;
    }
    else {
      p.x += dx / distance * rival.speed * dt;
      p.z += dz / distance * rival.speed * dt;
      rival.car.heading = Math.atan2(dx, dz);
      rival.car.wheelSpin += rival.speed * dt * 2;
    }
    rival.car.updateModel();
  }
  const target = CIRCUIT[state.checkpoint];
  const player = game.playerRig.player;
  marker.visible = true;
  marker.position.set(target[0], game.world.groundHeight(...target), target[1]);
  if (!player.inVehicle || player.inVehicle.health <= 0 || state.elapsed > 160) return finish(false);
  const distance = Math.hypot(player.position.x - target[0], player.position.z - target[1]);
  state.position = 1 + rivals.filter(r => r.checkpoint > state.checkpoint ||(r.checkpoint === state.checkpoint &&
  Math.hypot(r.car.position.x - target[0], r.car.position.z - target[1]) < distance)).length;
  if (rivals.some(r => r.checkpoint === CIRCUIT.length)) return finish(false);
  if (distance < 13) {
    state.checkpoint ++;
    game.hud.float(`CHECKPOINT ${state.checkpoint} / ${CIRCUIT.length}`, 'good');
    if (state.checkpoint === CIRCUIT.length) return finish(true);
  }
  if (!story) game.hud.setMission({
    chapter: 'NINA SOL · STREET RACE', name: 'Sunset Circuit', objective: `Checkpoint ${state.checkpoint + 1} / ${CIRCUIT.length} · Position ${state.position} / 3`,
    timeLeft: 160 - state.elapsed, stages: CIRCUIT.length, stageIndex: state.checkpoint, cashLabel:
    '+$1,800'
  });
}
function blips() {
  const point = state.active ? CIRCUIT[state.checkpoint]:[startPoint.x, startPoint.z];
  return point ?[{ x: point[0], z: point[1], kind: 'mission' }]:[];
}
return { state, startPoint, rivals, start, stop, update, blips };
}
