// Swept circle movement and camera rays share the city's conservative building bounds.
import * as THREE from '../../vendor/three.module.min.js';

export function overlaps(position, radius, colliders, height = 0) {
  return colliders.some(box => {
    if (height > box.height + 0.3) return false;
    const x = Math.max(box.minX, Math.min(position.x, box.maxX));
    const z = Math.max(box.minZ, Math.min(position.z, box.maxZ));
    return (position.x - x) ** 2 + (position.z - z) ** 2 < radius ** 2;
  });
}

export function moveWithCollisions(position, dx, dz, radius, city, height = 0) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.45));
  let hit = false;
  for (let i = 0; i < steps; i += 1) {
    const oldX = position.x;
    position.x += dx / steps;
    if (overlaps(position, radius, city.colliders, height)) {
      position.x = oldX;
      hit = true;
    }
    const oldZ = position.z;
    position.z += dz / steps;
    if (overlaps(position, radius, city.colliders, height)) {
      position.z = oldZ;
      hit = true;
    }
    const bounds = city.bounds;
    const x = THREE.MathUtils.clamp(position.x, bounds.minX + radius, bounds.maxX - radius);
    const z = THREE.MathUtils.clamp(position.z, bounds.minZ + radius, bounds.maxZ - radius);
    if (x !== position.x || z !== position.z) hit = true;
    position.x = x;
    position.z = z;
  }
  return hit;
}

export function cameraObstruction(target, desired, colliders) {
  const offset = desired.clone().sub(target);
  const distance = offset.length();
  const ray = new THREE.Ray(target, offset.normalize());
  let nearest = distance;
  const point = new THREE.Vector3();
  for (const box of colliders) {
    const bounds = new THREE.Box3(
      new THREE.Vector3(box.minX - 0.3, 0, box.minZ - 0.3),
      new THREE.Vector3(box.maxX + 0.3, box.height + 0.4, box.maxZ + 0.3)
    );
    if (ray.intersectBox(bounds, point)) nearest = Math.min(nearest, point.distanceTo(target) - 0.35);
  }
  return target.clone().addScaledVector(offset, Math.max(0.65, nearest));
}

export function moveVehicleWithCollisions(vehicle, dx, dz, city) {
  const radius = vehicle.spec.width * 0.48;
  const offset = vehicle.spec.length / 2 - radius;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.4));
  const sample = vehicle.position.clone();
  function blocked() {
    for (const along of [-offset, 0, offset]) {
      sample.copy(vehicle.position);
      sample.x += Math.sin(vehicle.yaw) * along;
      sample.z += Math.cos(vehicle.yaw) * along;
      if (overlaps(sample, radius, city.colliders)) return true;
      if (sample.x < city.bounds.minX + radius || sample.x > city.bounds.maxX - radius) return true;
      if (sample.z < city.bounds.minZ + radius || sample.z > city.bounds.maxZ - radius) return true;
    }
    return false;
  }
  let hit = false;
  for (let i = 0; i < steps; i += 1) {
    vehicle.position.x += dx / steps;
    if (blocked()) {
      vehicle.position.x -= dx / steps;
      hit = true;
    }
    vehicle.position.z += dz / steps;
    if (blocked()) {
      vehicle.position.z -= dz / steps;
      hit = true;
    }
  }
  return hit;
}

export function shortestAngle(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
