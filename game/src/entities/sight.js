// Low-cost visibility and shot occlusion against the same bounds used for movement.
import * as THREE from '../../vendor/three.module.min.js';

export function wallDistance(origin, direction, range, colliders) {
  const ray = new THREE.Ray(origin, direction);
  const bounds = new THREE.Box3();
  const hit = new THREE.Vector3();
  let nearest = range;
  for (const wall of colliders) {
    bounds.min.set(wall.minX, 0, wall.minZ);
    bounds.max.set(wall.maxX, wall.height, wall.maxZ);
    if (ray.intersectBox(bounds, hit)) nearest = Math.min(nearest, hit.distanceTo(origin));
  }
  return nearest;
}

export function canSee(origin, destination, colliders, range) {
  const direction = destination.clone().sub(origin);
  const length = direction.length();
  if (length > range) return false;
  return wallDistance(origin, direction.normalize(), length, colliders) >= length - 0.01;
}
