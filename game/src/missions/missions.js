// Sequential story contracts own their targets, checkpoints, failure recovery and cash payouts.
import { storyMissions, chapterForMission, storyDialogue } from './story.js';
import { objectivePlans, stageLabels } from './objectives.js';
import * as THREE from '../../vendor/three.module.min.js';

export function createMissions(game, input) {
  const { scene, player, vehicles, gangs, wanted, progress, vitals } = game;
  const completed = [];
  let index = 0;
  let active = false;
  let stage = 0;
  let remaining = 0;
  let targets = [];
  let targetCar = null;
  let dialogue = null;
  let bannerTime = 0;
  let elapsed = 0;
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#63ffe0', transparent: true, opacity: 0.28,
      side: THREE.DoubleSide, depthWrite: false }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.11, 6, 40),
    new THREE.MeshBasicMaterial({ color: '#a4ffe5', toneMapped: false }));
  ring.rotation.x = Math.PI / 2;
  marker.add(ring);
  scene.add(marker);
  const destination = new THREE.Vector3();
  const banner = document.createElement('section');
  banner.id = 'mission-result';
  banner.hidden = true;
  document.body.append(banner);

  function near(point, radius = 7) {
    return Math.hypot(player.position.x - point[0], player.position.z - point[1]) < radius;
  }

  function setDestination(point) {
    destination.set(point[0], 0.2, point[1]);
    marker.position.copy(destination).y = 1.7;
    marker.visible = index < storyMissions.length;
  }

  function cleanTargets() {
    for (const target of targets) {
      scene.remove(target.character.root);
      const slot = gangs.members.indexOf(target);
      if (slot >= 0) gangs.members.splice(slot, 1);
    }
    targets = [];
  }

  function showResult(text, failed = false) {
    banner.textContent = text;
    banner.classList.toggle('failed', failed);
    banner.hidden = false;
    bannerTime = 4;
  }

  function fail(reason) {
    if (!active) return;
    active = false;
    cleanTargets();
    showResult(`MISSION FAILED · ${reason} · Return to the marker to retry`, true);
    setDestination(objectivePlans[index].position);
  }

  function start() {
    if (index >= storyMissions.length || active) return false;
    cleanTargets();
    const plan = objectivePlans[index];
    stage = 0;
    remaining = plan.timer ?? 0;
    elapsed = 0;
    active = true;
    vitals.reset();
    if (plan.kind === 'vehicle' || plan.kind === 'heist') {
      if (!targetCar || targetCar.type !== (plan.kind === 'vehicle' ? 'sports' : 'police')) {
        targetCar = vehicles.add(plan.kind === 'vehicle' ? 'sports' : 'police',
          plan.kind === 'vehicle' ? '#ffb65e' : '#193246', plan.position[0], plan.position[1], Math.PI);
      }
      targetCar.condition = 100;
      targetCar.missionTarget = true;
    }
    if (['shootout', 'ambush', 'showdown'].includes(plan.kind)) {
      const [x, z] = plan.position;
      const count = plan.kind === 'showdown' ? 6 : plan.kind === 'ambush' ? 5 : 4;
      for (let n = 0; n < count; n += 1) {
        const member = gangs.add(x + (n % 2) * 5, z + Math.floor(n / 2) * 5);
        member.hostile = true;
        targets.push(member);
      }
    }
    if (plan.kind === 'chase') wanted.report('Courier intercepted', 3);
    dialogue?.(storyDialogue[index]);
    refreshDestination();
    return true;
  }

  function pass() {
    const mission = storyMissions[index];
    progress.cash += mission.reward;
    progress.respect = Math.min(100, progress.respect + 8);
    completed.push(mission.id);
    showResult(`MISSION PASSED +$${mission.reward.toLocaleString('en-US')}`);
    active = false;
    cleanTargets();
    targetCar = null;
    index += 1;
    if (index < storyMissions.length) setDestination(objectivePlans[index].position);
    else marker.visible = false;
  }

  function refreshDestination() {
    const plan = objectivePlans[index];
    if (!plan) return;
    let point = plan.position;
    if (plan.kind === 'drops') point = plan.drops[stage];
    if (plan.kind === 'race') point = plan.checkpoints[stage];
    if (['vehicle', 'heist', 'chase'].includes(plan.kind) && stage === 1) point = [100, 158];
    if (plan.kind === 'ambush' && stage === 1) point = [-100, 192];
    setDestination(point);
  }

  function update(dt) {
    bannerTime = Math.max(0, bannerTime - dt);
    banner.hidden = !bannerTime;
    marker.rotation.y += dt * 0.7;
    if (index >= storyMissions.length) return;
    if (!active) {
      if (near(objectivePlans[index].position) && input.take('KeyJ')) start();
      return;
    }
    const plan = objectivePlans[index];
    elapsed += dt;
    if (plan.timer) remaining -= dt;
    if (wanted.ending || vitals.health <= 0) return fail(wanted.ending || 'Dex is down');
    if (plan.timer && remaining <= 0) return fail('Out of time');
    if (targetCar && targetCar.condition <= 0) return fail('Target car destroyed');
    if (plan.kind === 'vehicle' || plan.kind === 'heist') {
      if (stage === 0 && player.vehicle === targetCar) {
        stage = 1;
        if (plan.kind === 'heist') wanted.report('Interceptor stolen', 2);
      }
      if (stage === 1 && player.vehicle === targetCar && near([100, 158]) && wanted.stars === 0) pass();
    } else if (plan.kind === 'drops' || plan.kind === 'race') {
      const route = plan.drops ?? plan.checkpoints;
      if (near(route[stage]) && (plan.kind !== 'race' || player.vehicle)) {
        stage += 1;
        if (stage === route.length) return pass();
      }
    } else if (plan.kind === 'chase') {
      if (stage === 0 && wanted.stars === 0 && elapsed > 2) stage = 1;
      if (stage === 1 && near([100, 158])) return pass();
    } else if (targets.length && targets.every(member => member.health <= 0)) {
      if (plan.kind !== 'ambush') return pass();
      stage = 1;
      if (near([-100, 192])) return pass();
    }
    if (active) refreshDestination();
  }

  function presentation() {
    const mission = storyMissions[index];
    if (!mission) return { chapter: 'PORT SOLARA · STORY COMPLETE', name: 'The tide is yours',
      objective: 'Explore the city. You earned it.', stage: 100, next: 'Free roam' };
    const chapter = chapterForMission(index);
    const plan = objectivePlans[index];
    const labels = stageLabels[plan.kind];
    let objective = active ? labels[stage] : 'Reach the glowing marker · J START / RETRY';
    if (active && targets.length && stage === 0) {
      objective += ` ${targets.filter(member => !member.health).length}/${targets.length}`;
    }
    if (active && stage === 1 && ['vehicle', 'heist'].includes(plan.kind) && wanted.stars) {
      objective = 'Lose the SPD, then deliver the marked car';
    }
    return { chapter: `CHAPTER ${chapter.number} · ${chapter.name.toUpperCase()}`, name: mission.title,
      objective, timer: active && plan.timer ? `${Math.floor(Math.max(0, remaining) / 60)}:${String(
        Math.ceil(Math.max(0, remaining) % 60)).padStart(2, '0')}` : '',
      stage: active ? (stage + 0.2) / labels.length * 100 : 0,
      next: storyMissions[index + 1]?.title ?? 'Port Solara is yours' };
  }

  setDestination(objectivePlans[0].position);
  return { start, update, fail, presentation, completed, destination,
    setDialogue(handler) { dialogue = handler; },
    get active() { return active; }, get index() { return index; }, get stage() { return stage; },
    get blips() { return index < storyMissions.length ? [{ position: destination }] : []; } };
}
