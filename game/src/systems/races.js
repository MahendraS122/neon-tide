// Optional street sprints pit the player against two independently paced rivals.
import * as THREE from '../../vendor/three.module.min.js';
import { raceSite } from '../world/locations.js';

const route = [[24, -112], [24, -36], [100, -36], [100, 40], [24, 40]];

export function createRaces({ scene, player, vehicles, progress }, reward) {
  let stage = 0;
  let time = 0;
  let rivals = [];
  const marker = new THREE.Mesh(new THREE.TorusGeometry(4.3, .17, 8, 40),
    new THREE.MeshBasicMaterial({ color: '#ff89bd', toneMapped: false }));
  scene.add(marker);
  const nearby = () => player.position.distanceTo(marker.position) < 12;
  const active = () => rivals.length > 0;

  function setGate(x, z) {
    marker.rotation.x = active() ? 0 : -Math.PI / 2;
    marker.position.set(x, active() ? 3 : .17, z);
    if (active()) marker.rotation.y = route[stage][0] === route[stage - 1][0] ? 0 : Math.PI / 2;
  }
  setGate(raceSite.x, raceSite.z);

  function start() {
    if (!player.vehicle || !nearby() || active()) return false;
    rivals = ['#ed8eb5', '#9d8def'].map((color, index) => {
      const car = vehicles.add('sports', color, raceSite.x - 4 + index * 7, raceSite.z - 8, 0, true);
      car.service = true;
      return { car, gate: 1, speed: 15 + index * 2, lane: index ? 3 : -4 };
    });
    time = 0;
    stage = 1;
    setGate(...route[stage]);
    return true;
  }

  function finish(win) {
    for (const { car } of rivals) {
      scene.remove(car.root);
      vehicles.vehicles.splice(vehicles.vehicles.indexOf(car), 1);
    }
    rivals = [];
    setGate(raceSite.x, raceSite.z);
    if (win) {
      progress.races += 1;
      reward('GLASSWATER SPRINT WON', 950);
    } else reward('SPRINT LOST', 0);
  }

  function update(dt) {
    if (!active()) return;
    time += dt;
    if (!player.vehicle || time > 90) return finish(false);
    if (nearby()) {
      stage += 1;
      if (stage === route.length) return finish(true);
      setGate(...route[stage]);
    }
    for (const rival of rivals) {
      const { car, gate, speed, lane } = rival;
      const [x, z] = route[gate];
      const vertical = x === route[gate - 1][0];
      const dx = x + (vertical ? lane : 0) - car.position.x;
      const dz = z + (vertical ? 0 : lane) - car.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 2) {
        rival.gate += 1;
        if (rival.gate === route.length) return finish(false);
        continue;
      }
      car.yaw = Math.atan2(dx, dz);
      car.speed = Math.min(speed, time * 6);
      car.position.x += dx / distance * car.speed * dt;
      car.position.z += dz / distance * car.speed * dt;
    }
  }
  return { start, update, nearby, get active() { return active(); },
    get destination() { return active() ? marker.position : null; },
    get hint() { return active() ? `GLASSWATER SPRINT · GATE ${stage} / ${route.length - 1}` : ''; } };
}
