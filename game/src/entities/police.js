// In-game SPD units search the street grid and can switch from driving to foot pursuit.
import * as THREE from '../../vendor/three.module.min.js';
import { moveVehicleWithCollisions, moveWithCollisions, shortestAngle } from './collision.js';
import { canSee } from './sight.js';

const nearestRoadLine = (lines, value) => lines.reduce((a, b) => Math.abs(a - value) < Math.abs(b - value) ? a : b);

export function createPolice(scene, city, vehicles, player, makePerson, fire) {
  const units = [];
  const lastSeen = player.position.clone();
  const eye = new THREE.Vector3();
  const target = new THREE.Vector3();
  let dispatchTimer = 0;
  let serial = 0;

  function spawn(x, z, yaw) {
    const car = vehicles.add('police', '#162735', x, z, yaw, true);
    car.traffic = false;
    car.service = true;
    const officer = makePerson({ shirt: '#263c55', trousers: '#202a39' });
    officer.root.visible = false;
    scene.add(officer.root);
    const unit = {
      name: `SPD ${String(++serial).padStart(2, '0')}`, status: 'PURSUIT', car, officer,
      position: car.position, onFoot: false, cooldown: 0, stuck: 0, integrity: 100
    };
    units.push(unit);
    return unit;
  }

  function retire(unit) {
    const index = vehicles.vehicles.indexOf(unit.car);
    if (index >= 0) vehicles.vehicles.splice(index, 1);
    scene.remove(unit.car.root, unit.officer.root);
    units.splice(units.indexOf(unit), 1);
  }

  function dispatchCar() {
    const p = player.position;
    const candidates = [];
    for (const x of city.roadX) {
      for (const z of city.roadZ) {
        const distance = Math.hypot(x - p.x, z - p.z);
        if (distance > 48 && distance < 112 && units.every(unit => unit.position.distanceToSquared(
          new THREE.Vector3(x, 0.12, z)) > 14 ** 2)) candidates.push({ x, z, distance });
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    const point = candidates[0];
    if (!point) return;
    spawn(point.x, point.z, Math.atan2(p.x - point.x, p.z - point.z));
  }

  function steer(unit, goal, direct, dt) {
    const car = unit.car;
    const p = car.position;
    let dx = goal.x - p.x;
    let dz = goal.z - p.z;
    if (!direct && !canSee(p.clone().setY(1), goal.clone().setY(1), city.colliders, 110)) {
      const x = nearestRoadLine(city.roadX, p.x);
      const z = nearestRoadLine(city.roadZ, p.z);
      const endX = nearestRoadLine(city.roadX, goal.x);
      const endZ = nearestRoadLine(city.roadZ, goal.z);
      if (Math.abs(p.x - x) < Math.abs(p.z - z) && Math.abs(p.z - z) > 4 && endX !== x) {
        dx = x - p.x;
        dz = z - p.z;
      } else if (Math.abs(p.z - z) < Math.abs(p.x - x) && Math.abs(p.x - x) > 4 && endZ !== z) {
        dx = x - p.x;
        dz = z - p.z;
      } else if (Math.abs(p.x - x) < 6 && endZ !== z) {
        dx = x - p.x;
        dz = endZ - p.z;
      } else if (Math.abs(p.z - z) < 6 && endX !== x) {
        dx = endX - p.x;
        dz = z - p.z;
      } else {
        dx = x - p.x;
        dz = z - p.z;
      }
    }
    const angle = shortestAngle(car.yaw, Math.atan2(dx, dz));
    car.steering = THREE.MathUtils.clamp(angle, -1, 1);
    car.yaw += car.steering * dt * 2.5;
    const speed = Math.min(42, Math.hypot(dx, dz) * 1.8) * (Math.abs(angle) > 0.75 ? 0.48 : 1);
    car.speed = THREE.MathUtils.damp(car.speed, unit.stuck > 0 ? -6 : speed, 2.8, dt);
    unit.stuck = Math.max(0, unit.stuck - dt);
    const blocked = moveVehicleWithCollisions(car, Math.sin(car.yaw) * car.speed * dt,
      Math.cos(car.yaw) * car.speed * dt, city);
    if (blocked && !unit.stuck) unit.stuck = 0.65;
  }

  function update(dt, stars, aerialSight) {
    if (!stars) {
      while (units.length) retire(units[0]);
      dispatchTimer = 0;
      return { seen: false, detained: false };
    }
    target.copy(player.position).y += 1.05;
    let seen = aerialSight;
    let detained = false;
    if (seen) lastSeen.copy(player.position);
    dispatchTimer -= dt;
    if (dispatchTimer <= 0 && units.length < Math.min(5, stars + 1)) {
      dispatchCar();
      dispatchTimer = 3.8;
    }
    for (const unit of [...units]) {
      const distance = unit.position.distanceTo(player.position);
      if (distance > 155 || unit.integrity <= 0) {
        retire(unit);
        continue;
      }
      eye.copy(unit.position).y += 1.45;
      const sight = canSee(eye, target, city.colliders, unit.onFoot ? 46 : 58);
      seen ||= sight;
      if (sight) lastSeen.copy(player.position);
      if (!unit.onFoot) {
        const ram = sight && player.vehicle && distance < 20;
        unit.status = ram ? 'RAMMING' : sight ? 'PURSUIT' : 'SWEEP';
        if (ram && distance < 2.65) {
          player.vehicle.condition = Math.max(0, player.vehicle.condition - dt * 15);
          player.vehicle.velocity.multiplyScalar(Math.exp(-dt * 2));
        }
        if (sight && distance < 13 && (!player.vehicle || Math.abs(player.vehicle.speed) < 3)) {
          unit.onFoot = true;
          unit.car.speed = 0;
          unit.car.occupied = false;
          unit.car.driverHead.visible = false;
          unit.officer.root.position.copy(unit.car.position).y = 0.22;
          unit.officer.root.visible = true;
          unit.position = unit.officer.root.position;
        } else {
          steer(unit, lastSeen, ram, dt);
          continue;
        }
      }
      const goal = sight ? player.position : lastSeen;
      const offset = goal.clone().sub(unit.position).setY(0);
      const speed = offset.length() > (sight ? 1.45 : 0.7) ? 4.35 : 0;
      offset.normalize();
      unit.officer.root.rotation.y = Math.atan2(offset.x, offset.z);
      moveWithCollisions(unit.position, offset.x * speed * dt, offset.z * speed * dt, 0.32, city);
      unit.officer.animate(dt, speed, sight && stars >= 2);
      unit.status = sight ? 'PURSUIT' : 'SWEEP';
      unit.cooldown -= dt;
      if (sight && stars >= 2 && distance > 3 && unit.cooldown <= 0) {
        fire(eye, target, 7, unit.officer);
        unit.cooldown = 1.3;
      }
      detained ||= sight && distance < 2.4 && (player.vehicle ? Math.abs(player.vehicle.speed) < 2
        : player.walkingSpeed < 1);
    }
    return { seen, detained };
  }
  return { units, spawn, update, note(position) { lastSeen.copy(position); } };
}
