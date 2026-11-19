// Lane-following traffic obeys timed junctions and queues behind other vehicles.
import * as THREE from '../../vendor/three.module.min.js';
import { shortestAngle } from './collision.js';

/** Create ambient vehicles and advance their lane-following routes. */
export function createTraffic(vehicleSystem, city, random) {
  const fleet = [];
  const colors = ['#b94f4a', '#ded8c4', '#44718c', '#d4ad58', '#375557', '#9a91a2'];
  const types = ['sports', 'muscle', 'suv', 'taxi', 'van', 'suv', 'muscle'];
  for (let i = 0; i < 24; i += 1) {
    const left = i % 4;
    const top = Math.floor(i / 4) % 4;
    const x1 = city.roadX[left] + 3.3;
    const x2 = city.roadX[Math.min(4, left + 1 + i % 2)] - 3.3;
    const z1 = city.roadZ[top] - 3.3;
    const z2 = city.roadZ[top + 1] + 3.3;
    const path = [new THREE.Vector3(x1, 0.12, z1), new THREE.Vector3(x1, 0.12, z2),
      new THREE.Vector3(x2, 0.12, z2), new THREE.Vector3(x2, 0.12, z1)];
    const segment = i % 4;
    const start = path[segment].clone().lerp(path[(segment + 1) % 4], 0.2 + random() * 0.6);
    const next = path[(segment + 1) % 4];
    const yaw = Math.atan2(next.x - start.x, next.z - start.z);
    const vehicle = vehicleSystem.add(
      types[i % types.length], colors[i % colors.length], start.x, start.z, yaw, true
    );
    vehicle.route = path;
    vehicle.targetIndex = (segment + 1) % 4;
    vehicle.cruise = 7 + random() * 5;
    fleet.push(vehicle);
  }
  function update(dt, time) {
    for (const vehicle of fleet) {
      if (!vehicle.traffic || vehicle.controlled) continue;
      vehicle.stopTimer = Math.max(0, vehicle.stopTimer - dt);
      const target = vehicle.route[vehicle.targetIndex];
      const delta = target.clone().sub(vehicle.position);
      const distance = delta.length();
      if (distance < 2.5) {
        vehicle.targetIndex = (vehicle.targetIndex + 1) % 4;
        continue;
      }
      const desiredYaw = Math.atan2(delta.x, delta.z);
      const corner = Math.abs(shortestAngle(vehicle.yaw, desiredYaw));
      const forward = new THREE.Vector3(Math.sin(vehicle.yaw), 0, Math.cos(vehicle.yaw));
      let stopped = vehicle.stopTimer > 0;
      for (const other of vehicleSystem.vehicles) {
        if (vehicle === other) continue;
        const offset = other.position.clone().sub(vehicle.position);
        const ahead = offset.dot(forward);
        const lateral = Math.abs(offset.x * forward.z - offset.z * forward.x);
        if (ahead > 0 && ahead < 7 && lateral < 2.1) stopped = true;
      }
      const vertical = Math.abs(forward.z) > 0.7;
      const green = Math.floor(time / 12) % 2 === (vertical ? 0 : 1);
      if (!green) {
        for (const x of city.roadX) {
          for (const z of city.roadZ) {
            if (x < -150 || z < -180) continue;
            const offset = new THREE.Vector3(x - vehicle.position.x, 0, z - vehicle.position.z);
            const ahead = offset.dot(forward);
            const lateral = Math.abs(offset.x * forward.z - offset.z * forward.x);
            if (ahead > 10 && ahead < 20 && lateral < 5) stopped = true;
          }
        }
      }
      const speed = stopped ? 0 : corner > 0.3 || distance < 10 ? 4 : vehicle.cruise;
      vehicle.speed = THREE.MathUtils.damp(vehicle.speed, speed, stopped ? 4 : 1.5, dt);
      vehicle.yaw += shortestAngle(vehicle.yaw, desiredYaw) * Math.min(1, dt * 3.3);
      vehicle.steering = THREE.MathUtils.clamp(shortestAngle(vehicle.yaw, desiredYaw) * 2, -1, 1);
      vehicle.position.addScaledVector(new THREE.Vector3(Math.sin(vehicle.yaw), 0, Math.cos(vehicle.yaw)),
        vehicle.speed * dt);
    }
  }
  return { fleet, update };
}
