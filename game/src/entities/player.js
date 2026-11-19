// Dex's on-foot movement and collision-aware camera, shared with driving mode.
import * as THREE from '../../vendor/three.module.min.js';
import { moveWithCollisions, cameraObstruction, shortestAngle } from './collision.js';

const FOOT_HEIGHT = 0.22;

export function createPlayer(scene, character, input, city) {
  const position = new THREE.Vector3(109, FOOT_HEIGHT, 15);
  scene.add(character.root);
  character.root.position.copy(position);
  let yaw = 0;
  let pitch = 0.15;
  let verticalSpeed = 0;
  let grounded = true;
  let vehicle = null;
  let walkingSpeed = 0;
  let aiming = false;
  const cameraTarget = position.clone().add(new THREE.Vector3(0, 1.25, 0));
  function update(dt) {
    const mouse = input.mouse();
    yaw -= mouse.x * 0.0024;
    pitch = THREE.MathUtils.clamp(pitch + mouse.y * 0.0017, -0.3, 0.85);
    if (vehicle) {
      position.copy(vehicle.position);
      character.root.visible = false;
      return;
    }
    character.root.visible = true;
    const forward = Number(input.down('KeyW') || input.down('ArrowUp'))
      - Number(input.down('KeyS') || input.down('ArrowDown'));
    const sideways = Number(input.down('KeyD') || input.down('ArrowRight'))
      - Number(input.down('KeyA') || input.down('ArrowLeft'));
    const speed = input.down('ShiftLeft') || input.down('ShiftRight') ? 7.7 : 3.5;
    const movement = new THREE.Vector3(
      -Math.sin(yaw) * forward + Math.cos(yaw) * sideways, 0,
      -Math.cos(yaw) * forward - Math.sin(yaw) * sideways
    );
    if (movement.lengthSq() > 0) movement.normalize().multiplyScalar(speed);
    walkingSpeed = movement.length();
    if (walkingSpeed > 0 || aiming) {
      const facing = aiming ? yaw + Math.PI : Math.atan2(movement.x, movement.z);
      character.root.rotation.y += shortestAngle(character.root.rotation.y, facing) * Math.min(1, dt * 14);
    }
    moveWithCollisions(position, movement.x * dt, movement.z * dt, 0.34, city, position.y);
    if (input.take('Space') && grounded) {
      verticalSpeed = 6.7;
      grounded = false;
    }
    verticalSpeed -= 19 * dt;
    position.y += verticalSpeed * dt;
    if (position.y <= FOOT_HEIGHT) {
      position.y = FOOT_HEIGHT;
      verticalSpeed = 0;
      grounded = true;
    }
    character.root.position.copy(position);
    character.animate(dt, grounded ? walkingSpeed : 0, aiming);
  }
  function aimDirection() {
    return new THREE.Vector3(-Math.sin(yaw), -Math.sin(pitch - 0.15), -Math.cos(yaw)).normalize();
  }
  function updateCamera(camera, dt, snap = false) {
    const speed = Math.abs(vehicle?.speed ?? 0);
    if (speed > 2) yaw += shortestAngle(yaw, vehicle.yaw + Math.PI) * (1 - Math.exp(-dt * 3));
    const target = position.clone().add(new THREE.Vector3(0, vehicle ? 1.1 : 1.3, 0));
    const distance = vehicle ? 6.8 + Math.min(2.5, speed * 0.05) : 4.7;
    const height = vehicle ? 2.35 : 1.25;
    const desired = target.clone().add(new THREE.Vector3(
      Math.sin(yaw) * distance, height + Math.sin(pitch) * distance,
      Math.cos(yaw) * distance
    ));
    if (!vehicle) desired.add(new THREE.Vector3(Math.cos(yaw) * 0.6, 0, -Math.sin(yaw) * 0.6));
    const safePosition = cameraObstruction(target, desired, city.colliders);
    const blocked = safePosition.distanceToSquared(desired) > 0.01;
    const blend = snap ? 1 : 1 - Math.exp(-dt * (blocked ? 24 : vehicle ? 9 : 14));
    camera.position.lerp(safePosition, blend);
    if (vehicle) {
      const lead = THREE.MathUtils.clamp(vehicle.speed * 0.057, -1, 2.8);
      target.x += Math.sin(vehicle.yaw) * lead;
      target.z += Math.cos(vehicle.yaw) * lead;
    }
    cameraTarget.lerp(target, snap ? 1 : 1 - Math.exp(-dt * 14));
    camera.lookAt(cameraTarget);
    if (aiming && !vehicle) {
      const aim = position.clone().add(new THREE.Vector3(0, 1.35, 0)).addScaledVector(aimDirection(), 14);
      camera.lookAt(aim);
    }
    const fov = vehicle ? 55 + Math.min(10, speed * 0.18) : 58;
    camera.fov += (fov - camera.fov) * blend;
    camera.updateProjectionMatrix();
  }
  return {
    position, character, update, updateCamera, aimDirection,
    set aiming(value) { aiming = value; },
    get heading() { return vehicle?.yaw ?? yaw + Math.PI; },
    get vehicle() { return vehicle; },
    set vehicle(value) {
      vehicle = value;
      if (value) {
        yaw = value.yaw + Math.PI;
        pitch = 0.05;
        position.copy(value.position);
      } else {
        pitch = 0.15;
      }
      character.root.visible = !value;
    },
    get walkingSpeed() { return walkingSpeed; },
    get grounded() { return grounded; }
  };
}
