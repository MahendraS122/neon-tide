// Dex on foot: movement relative to the camera's yaw, walking and sprinting, a jump with gravity,
// sliding along buildings instead of sticking to them, and the pose/animation that drives his rig.
// He also knows which car is close enough to climb into and where he sits once he is in it.
import * as THREE from 'three';
import {
  PLAYER, VEHICLE
}
from '../config.js';
import {
  createFigure, poseFigure, CAST
}
from './character.js';
export function createPlayer (scene, world) {
  const figure = createFigure (CAST.dex);
  figure.root.position.set (world.landmarks.safehouse.x, 0, world.landmarks.safehouse.z);
  scene.add (figure.root);
  const player = {
    figure, position : figure.root.position,
    /** Facing yaw; the camera's yaw while moving, the mouse's when aiming. */
    heading : 0, velocity : new THREE.Vector3 (),
    /** Vertical speed, for jumping and falling. */
    vertical : 0, grounded : true, health : PLAYER.health, armour : PLAYER.armour, phase : 0, speed :
    0,
    /** 0..1: how far a gunshot has doubled him over, decays each frame. */
    hurt : 0, inVehicle : null,
    /** Aiming (right mouse) tucks the arms and slows the walk. */
    aiming : false, dead : false, busted : false,
  }
  ;
  const forward = new THREE.Vector3 ();
  const right = new THREE.Vector3 ();
  const desired = new THREE.Vector3 ();
  /**
  * Advance on foot. `move` is { forward, strafe } in -1..1, `sprint` a bool, `jump` a bool, and
  * `cameraYaw` the direction the camera looks, so "forward" is always away from the camera.
  */
  function step (dt, move, sprint, jump, cameraYaw) {
    if (player.inVehicle) {
      // Riding: sit in the seat and do not simulate walking.
      poseFigure (figure, 0, 0, {
        sit : true
      }
      );
      return;
    }
    forward.set (Math.sin (cameraYaw), 0, Math.cos (cameraYaw));
    right.set (Math.cos (cameraYaw), 0, - Math.sin (cameraYaw));
    desired.set (0, 0, 0).addScaledVector (forward, move.forward).addScaledVector (right, move.strafe);
    const mag = desired.length ();
    if (mag > 0.001) desired.normalize ();
    const target = (sprint ? PLAYER.run : PLAYER.walk) * (player.aiming ? 0.55 : 1);
    const wish = desired.clone ().multiplyScalar (mag > 0.001 ? target : 0);
    // Accelerate toward the wish velocity, on the ground only.
    const accel = PLAYER.accel * (player.grounded ? 1 : 0.35);
    player.velocity.x += THREE.MathUtils.clamp (wish.x - player.velocity.x, - accel * dt, accel * dt);
    player.velocity.z += THREE.MathUtils.clamp (wish.z - player.velocity.z, - accel * dt, accel * dt);
    if (mag < 0.001 && player.grounded) {
      const damp = Math.max (0, 1 - 14 * dt);
      player.velocity.x *= damp;
      player.velocity.z *= damp;
    }
    // Jump and gravity.
    const groundY = world.groundHeight (player.position.x, player.position.z);
    if (jump && player.grounded) {
      player.vertical = PLAYER.jump;
      player.grounded = false;
    }
    player.vertical -= PLAYER.gravity * dt;
    player.position.y += player.vertical * dt;
    if (player.position.y <= groundY) {
      player.position.y = groundY;
      player.vertical = 0;
      player.grounded = true;
    }
    // Walk, one axis at a time, so a wall stops the slide but not the walk along it.
    const nx = player.position.x + player.velocity.x * dt;
    if (!blocked (nx, player.position.z)) player.position.x = nx;
    else player.velocity.x = 0;
    const nz = player.position.z + player.velocity.z * dt;
    if (!blocked (player.position.x, nz)) player.position.z = nz;
    else player.velocity.z = 0;
    // City limits.
    const b = world.bounds;
    player.position.x = Math.max (b.minX, Math.min (b.maxX, player.position.x));
    player.position.z = Math.max (b.minZ, Math.min (b.maxZ, player.position.z));
    // Facing: turn toward the movement direction, unless aiming (then the camera's yaw wins).
    player.speed = Math.hypot (player.velocity.x, player.velocity.z);
    if (player.aiming) player.heading = cameraYaw;
    else if (player.speed > 0.4) {
      const targetYaw = Math.atan2 (player.velocity.x, player.velocity.z);
      player.heading = turnTowards (player.heading, targetYaw, dt * 11);
    }
    figure.root.rotation.y = player.heading;
    // Animation: the walk phase advances with distance covered.
    player.phase += player.speed * dt * 2.6;
    const normalised = player.speed / PLAYER.walk;
    poseFigure (figure, player.phase, player.grounded ? normalised : 0.3, {
      aim : player.aiming, hurt : player.hurt,
    }
    );
    player.hurt = Math.max (0, player.hurt - dt * 1.6);
  }
  function blocked (x, z) {
    const box = world.hitsBuilding (x, z, PLAYER.radius);
    return box !== null && box.top > player.position.y + 0.4;
  }
  /** Put Dex at a point, facing a yaw, with no momentum. */
  function teleport (x, z, heading = 0) {
    player.position.set (x, world.groundHeight (x, z), z);
    player.velocity.set (0, 0, 0);
    player.vertical = 0;
    player.heading = heading;
    figure.root.rotation.y = heading;
  }
  /** Enter a car: hide the standing figure and put it in the driver's seat. */
  function enterVehicle (car) {
    player.inVehicle = car;
    car.occupied = true;
    figure.root.position.copy (car.position);
    figure.root.rotation.y = car.heading;
    poseFigure (figure, 0, 0, {
      sit : true
    }
    );
  }
  /** Leave the car, stepping out on the driver's side (or the other side if that is blocked). */
  function exitVehicle () {
    const car = player.inVehicle;
    if (!car) return null;
    player.inVehicle = null;
    car.occupied = false;
    const side = new THREE.Vector3 (Math.cos (car.heading), 0, - Math.sin (car.heading));
    let spot = new THREE.Vector3 ().copy (car.position).addScaledVector (side, - 1.9);
    if (world.hitsBuilding (spot.x, spot.z, PLAYER.radius)) spot = new THREE.Vector3 ().copy (car.position).addScaledVector (side,
    1.9);
    if (world.hitsBuilding (spot.x, spot.z, PLAYER.radius)) spot = new THREE.Vector3 ().copy (car.position).addScaledVector (new THREE.Vector3 (Math.sin (car.heading),
    0, Math.cos (car.heading)), - 3.4,);
    player.position.set (spot.x, world.groundHeight (spot.x, spot.z), spot.z);
    player.velocity.set (0, 0, 0);
    player.heading = car.heading;
    figure.root.rotation.y = car.heading;
    return car;
  }
  /**
  * While riding, the figure sits in the driver's seat: offset to the left of the car's centre,
  * sunk so only the head and shoulders clear the roof line, and turned with the car.
  */
  function syncToVehicle (car) {
    const forwardX = Math.sin (car.heading);
    const forwardZ = Math.cos (car.heading);
    const rightX = Math.cos (car.heading);
    const rightZ = - Math.sin (car.heading);
    // The seat is a hand's width left of centre and low in the cabin: hips at roof height, so the
    // head clears the glass and the legs are hidden inside the bodywork, as a driver really sits.
    figure.root.position.set (car.position.x + rightX * 0.34 + forwardX * 0.12, car.position.y - 0.12,
    car.position.z + rightZ * 0.34 + forwardZ * 0.12,);
    figure.root.rotation.y = car.heading;
    figure.root.scale.setScalar (0.82);
  }
  /** The nearest car within reach, or null. */
  function vehicleInReach (vehicles) {
    if (player.inVehicle) return null;
    let best = null;
    let bestDist = PLAYER.reach + 2.4;
    for (const car of vehicles) {
      const dx = car.position.x - player.position.x;
      const dz = car.position.z - player.position.z;
      const dist = Math.hypot (dx, dz) - VEHICLE.halfLength;
      if (dist < bestDist) {
        bestDist = dist;
        best = car;
      }
    }
    return best;
  }
  return {
    player, figure, step, teleport, enterVehicle, exitVehicle, syncToVehicle, vehicleInReach
  }
  ;
}
/** Shortest-way rotation from a to b, moved at most `max` radians. */
export function turnTowards (a, b, max) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < - Math.PI) diff += Math.PI * 2;
  return a + THREE.MathUtils.clamp (diff, - max, max);
}
