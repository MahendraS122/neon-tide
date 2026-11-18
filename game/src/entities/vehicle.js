// One drivable car: an arcade physics body (forward thrust, lateral grip, handbrake slide, a
// little understeer at speed) plus its visual group and the wheels that steer and roll. The model
// is built once per car and reused, so a stolen car that respawns keeps its paint and plate.
import * as THREE from 'three';
import { VEHICLE, GROUND } from '../config.js';
import { buildCarVisual, CAR_SHAPES } from './vehicleModel.js';

let nextId = 1;

export function createVehicle({ kind = 'sedan', color = 0xd8d8de, x = 0, z = 0, heading = 0, plate, accent }) {
  const visual = buildCarVisual({ kind, color, plate: plate ?? `NT ${1000 + nextId * 37}`, accent });
  const shape = CAR_SHAPES[kind] ?? CAR_SHAPES.sedan;

  const car = {
    id: nextId += 1,
    kind,
    color,
    plate: plate ?? visual.group.name,
    group: visual.group,
    wheels: visual.wheels,
    lights: visual.lights,
    shape,
    /** Position is the car's centre on the ground; heading is a yaw in radians (+Z forward at 0). */
    position: new THREE.Vector3(x, 0, z),
    heading,
    /** World velocity, integrated from the forces below. */
    velocity: new THREE.Vector3(),
    /** Signed forward speed in m/s, the number the speedometer shows. */
    speed: 0,
    lateral: 0,
    wheelSpin: 0,
    steer: 0,
    throttle: 0,
    brake: 0,
    handbrake: false,
    /** Top speed for this kind, scaled from the base. */
    topSpeed: VEHICLE.topSpeed * (kind === 'sport' ? 1.16 : kind === 'muscle' ? 1.08 : kind === 'van' ? 0.8 : kind === 'suv' ? 0.86 : kind === 'hatch' ? 0.92 : 1),
    accel: VEHICLE.accel * (kind === 'sport' ? 1.28 : kind === 'muscle' ? 1.18 : kind === 'van' ? 0.78 : kind === 'suv' ? 0.9 : 1),
    health: 100,
    /** AI cars idle at traffic lights; the player's car never does. */
    driver: null,
    isPolice: kind === 'police',
    isTaxi: kind === 'taxi',
    wrecked: false,
    occupied: false,
  };

  car.updateModel = () => {
    car.group.position.set(car.position.x, car.position.y, car.position.z);
    car.group.rotation.y = car.heading;
    for (const wheel of car.wheels) {
      wheel.rotation.y = wheel.userData.steer ? car.steer * 0.5 : 0;
      wheel.userData.spin.rotation.x = car.wheelSpin;
    }
  };
  car.updateModel();

  return car;
}

const forward = new THREE.Vector3();
const right = new THREE.Vector3();

/**
 * Advance one car by dt. `controls` is { throttle -1..1, brake 0..1, steer -1..1, handbrake bool }.
 * `ground` gives the surface height at a point and `boxes` the building rectangles to slide off.
 */
export function stepVehicle(car, dt, controls, world) {
  const ctl = controls ?? { throttle: 0, brake: 0, steer: 0, handbrake: false };
  forward.set(Math.sin(car.heading), 0, Math.cos(car.heading));
  right.set(Math.cos(car.heading), 0, -Math.sin(car.heading));

  const speed = car.velocity.dot(forward);
  const lateral = car.velocity.dot(right);
  car.speed = speed;
  car.lateral = lateral;

  const throttle = Math.max(-1, Math.min(1, ctl.throttle));
  const top = car.topSpeed;

  // Thrust: strong off the line, tapering toward the top speed. Reverse is slower and capped.
  if (throttle > 0.01) {
    const fade = 1 - Math.min(1, Math.max(0, speed) / top) * 0.55;
    car.velocity.addScaledVector(forward, car.accel * throttle * fade * dt);
  } else if (throttle < -0.01) {
    if (speed > 0.6) {
      car.velocity.addScaledVector(forward, -VEHICLE.brake * 0.55 * dt);
    } else {
      const fade = 1 - Math.min(1, Math.max(0, -speed) / VEHICLE.reverseMax) * 0.5;
      car.velocity.addScaledVector(forward, car.accel * 0.55 * throttle * fade * dt);
    }
  }

  // Brakes.
  if (ctl.brake > 0.01) {
    const brakeForce = Math.min(VEHICLE.brake * ctl.brake * dt, Math.abs(speed) + 0.01);
    car.velocity.addScaledVector(forward, -Math.sign(speed) * brakeForce);
  }

  // Rolling resistance and aerodynamic drag.
  const damp = Math.max(0, 1 - (car.handbrake ? 1.5 : 0.34) * dt);
  car.velocity.multiplyScalar(damp);
  const vSq = car.velocity.lengthSq();
  if (vSq > 0.0001) car.velocity.addScaledVector(car.velocity, -VEHICLE.drag * 0.004 * vSq * dt);

  // Steering: rate falls with speed so the car does not snap at 200 km/h; the handbrake sharpens it.
  const speedAbs = Math.abs(speed);
  const speedFactor = 1 / (1 + speedAbs * 0.055);
  const grip = car.handbrake ? VEHICLE.handbrakeGrip : VEHICLE.grip;
  const steerAuthority = VEHICLE.steer * speedFactor * (car.handbrake ? 1.35 : 1);
  const desiredSteer = Math.max(-1, Math.min(1, ctl.steer));
  car.steer += (desiredSteer - car.steer) * Math.min(1, dt * 9);

  // Turn only while moving, and turn the way a car actually turns in reverse.
  const turn = car.steer * steerAuthority * dt * (speed > 0.4 ? 1 : speed < -0.4 ? -1 : 0);
  if (speedAbs > 0.25) {
    car.heading += turn * Math.min(1, speedAbs / 6);
    car.velocity.applyAxisAngle(THREE.Object3D.DEFAULT_UP, turn * Math.min(1, speedAbs / 6));
  }

  // Lateral grip: kill the sideways slide, less of it while the handbrake is down (that is drift).
  const lateralNow = car.velocity.dot(right);
  const kill = Math.min(1, grip * 9 * dt);
  car.velocity.addScaledVector(right, -lateralNow * kill);
  // Handbrake also scrubs a little forward speed, so a drift bleeds momentum.
  if (car.handbrake) car.velocity.multiplyScalar(Math.max(0, 1 - 0.55 * dt));

  // Top speed clamp along the forward axis.
  const along = car.velocity.dot(forward);
  if (along > car.topSpeed) car.velocity.addScaledVector(forward, car.topSpeed - along);
  if (along < -VEHICLE.reverseMax) car.velocity.addScaledVector(forward, -VEHICLE.reverseMax - along);

  // Integrate.
  car.position.addScaledVector(car.velocity, dt);

  // Collide with buildings: push out along the shallowest axis, and kill the velocity into it.
  resolveBoxes(car, world);

  // Stay inside the map.
  const b = world.bounds;
  car.position.x = Math.max(b.minX, Math.min(b.maxX, car.position.x));
  car.position.z = Math.max(b.minZ, Math.min(b.maxZ, car.position.z));

  // Ride the surface: the pavement is a step, so the body rises where it parks on the kerb.
  const groundY = world.groundHeight(car.position.x, car.position.z);
  car.position.y += (groundY - car.position.y) * Math.min(1, dt * 12);

  // The wheels roll with forward speed.
  car.wheelSpin += (car.velocity.dot(forward) / VEHICLE.wheelRadius) * dt;
  car.updateModel();
  return car;
}

/** Keep a car out of the building rectangles it overlaps, stopping the velocity into each wall. */
export function resolveBoxes(car, world) {
  const r = Math.max(VEHICLE.halfWidth, VEHICLE.halfLength) * 0.72;
  for (const box of world.colliders) {
    const px = car.position.x;
    const pz = car.position.z;
    if (px + r < box.minX || px - r > box.maxX || pz + r < box.minZ || pz - r > box.maxZ) continue;
    const overlapX = Math.min(px + r - box.minX, box.maxX - (px - r));
    const overlapZ = Math.min(pz + r - box.minZ, box.maxZ - (pz - r));
    if (overlapX < overlapZ) {
      const dir = px < (box.minX + box.maxX) / 2 ? -1 : 1;
      car.position.x += dir * (overlapX + 0.01);
      car.velocity.x *= -0.15;
    } else {
      const dir = pz < (box.minZ + box.maxZ) / 2 ? -1 : 1;
      car.position.z += dir * (overlapZ + 0.01);
      car.velocity.z *= -0.15;
    }
    car.health = Math.max(0, car.health - 1);
  }
}

/** Where a passenger sits in the car's local frame. */
export const DRIVER_SEAT = new THREE.Vector3(-0.34, 0.9, -0.1);

export { GROUND };
