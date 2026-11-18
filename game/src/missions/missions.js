// Campaign progression, retries, rewards, start markers and objective presentation.
import { STORY, CHAPTERS } from './story.js';
import { createObjectiveMarker, prepareObjective, objectiveComplete } from './objectives.js';
export function createMissions(game) { const state = { completed:[], active: null, stage: 0, remaining:
null, cooldown: 0 };
const marker = createObjectiveMarker(game.view.scene);
let runtime = { };
let queued = null;
function current() {
  return state.active == null ? null: STORY[state.active];
}
function target() {
  const mission = current();
  if (mission) return mission.stages[state.stage]?.at;
  return STORY[state.completed.length]?.start;
}
function beginStage() {
  const stage = current()?.stages[state.stage];
  if (stage) prepareObjective(game, stage, runtime);
}
function start(index = state.completed.length, withDialogue = true) {
  if (index !== state.completed.length || !STORY[index]) return false;
  state.active = index;
  state.stage = 0;
  state.remaining = STORY[index].timer ?? null;
  runtime = { };
  if (withDialogue && game.dialogue) {
    queued = beginStage;
    game.dialogue.play(STORY[index].dialogue, function afterDialogue() {
      queued?.();
      queued = null;
    });
  }
  else beginStage();
  return true;
}
function fail(reason) {
  if (state.active == null) return;
  game.hud.banner('MISSION FAILED', `${reason} · Return to the contact to retry.`);
  game.races?.stop();
  state.active = null;
  state.cooldown = 4;
  queued = null;
}
function pass() {
  const mission = current();
  state.completed.push(state.active);
  state.active = null;
  state.cooldown = 5;
  game.cash += mission.reward;
  game.stats.respect += 150;
  game.hud.setCash(game.cash);
  game.hud.banner('MISSION PASSED', `+$${mission.reward.toLocaleString('en-US')} · ${mission.name}`,
  { pass: true, seconds: 4, });
  game.save?.autosave();
}
function update(dt, input) {
  state.cooldown = Math.max(0, state.cooldown - dt);
  const point = target();
  marker.visible = Boolean(point);
  if (point) {
    marker.position.set(point[0], game.world.groundHeight(...point), point[1]);
    marker.rotation.y += dt;
  }
  const mission = current();
  if (!mission) {
    if (!point) {
      game.hud.setMission({
        chapter: 'PORT SOLARA · FREE ROAM', name: 'The city is yours', objective: 'Find tide tokens, race Nina, and build your garage.'
      });
      return;
    }
    const next = STORY[state.completed.length];
    game.hud.setMission({
      chapter: `CHAPTER ${Math.floor(state.completed.length / 2) + 1}`, name: next.name, objective:
      'Meet your contact at the glowing marker. Press Enter to start.', cashLabel: `+$${next.reward.toLocaleString('en-US')}`
    });
    if (input.pressed('Enter') && state.cooldown === 0 && Math.hypot(game.playerRig.player.position.x - point[0],
    game.playerRig.player.position.z - point[1]) < 12) start();
    return;
  }
  if (game.dialogue?.active || queued) return;
  const player = game.playerRig.player;
  if (player.health <= 0 || player.busted) return fail('Dex was taken down');
  if (runtime.car && runtime.car.health <= 0) return fail('The job vehicle was destroyed');
  if (mission.stages[state.stage].type === 'race' && game.races?.state.finished && !game.races.state.won) return fail('Nina\'s crew won the race');
  if (state.remaining != null) {
    state.remaining -= dt;
    if (state.remaining <= 0) return fail('Out of time');
  }
  const stage = mission.stages[state.stage];
  game.hud.setMission({
    chapter: `CHAPTER ${Math.floor(state.active / 2) + 1} · ${CHAPTERS[Math.floor(state.active / 2)]}`,
    name: mission.name, objective: stage.text, timeLeft: state.remaining, stages: mission.stages.length,
    stageIndex: state.stage, next: mission.stages[state.stage + 1]?.text ?? 'Collect your reward.',
    cashLabel: `+$${mission.reward.toLocaleString('en-US')}`,
  });
  if (objectiveComplete(game, stage, runtime, dt)) {
    state.stage ++;
    if (state.stage === mission.stages.length) pass();
    else beginStage();
  }
}
function blips() {
  const point = target();
  return point ?[{ x: point[0], z: point[1], kind: 'mission' }]:[];
}
function restore(saved = { }) {
  state.completed = Array.isArray(saved.completed) ? saved.completed.slice(0, 8):[];
  state.active = null;
  state.stage = 0;
  state.remaining = null;
  queued = null;
}
return { state, update, start, fail, current, target, blips, restore };
}
