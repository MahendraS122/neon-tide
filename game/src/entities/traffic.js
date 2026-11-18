// Traffic: a pool of cars that drive the road grid. Each car keeps to one lane, eases back to it
// when it drifts, brakes for whatever is in front (another car, the player, Dex on foot) and waits
// at a junction while the lights are against it. A car the player steals leaves the pool and a
// fresh one appears far away, so the street never empties.
import * as THREE from 'three';
import { ROADS, ROAD_HALF, BLOCK_CENTERS } from '../config.js';
import { createVehicle, stepVehicle } from './vehicle.js';
import { createDice } from '../random.js';

const LANE = ROAD_HALF * 0.48;
const TRAFFIC_COLOURS = [
  0xd8d8de, 0x2b3a52, 0x8f2f2f, 0x25544a, 0xd8c27a, 0x1c1c22, 0x6f8fae,
  0xc45a2f, 0xe8e2d2, 0x3f4f6f, 0x7a3f5f, 0x2f6f4f,
];
const CAR_KINDS = ['sedan', 'sedan', 'sedan', 'hatch', 'hatch', 'muscle', 'van', 'suv', 'sport', 'taxi', 'taxi'];

export function createTraffic(scene, world, count = 24) {
  const dice = createDice(4242);
  const cars = [];
  const root = new THREE.Group();
  root.name = 'traffic';
  scene.add(root);

  /**
   * Spawn a car somewhere on the grid, travelling along a road in the right-hand lane. `avoid`
   * keeps new cars out of the player's view.
   */
  function spawn(avoid) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const alongX = dice.chance(0.5);
      const road = dice.pick(ROADS);
      const travel = dice.chance(0.5) ? 1 : -1;
      const t = dice.range(-250, 250);
      // Right-hand traffic: heading +axis, the lane sits on the -side; heading -axis, the +side.
      const lateral = -travel * LANE;
      const x = alongX ? t : road + lateral;
      const z = alongX ? road + lateral : t;
      if (avoid && Math.hypot(x - avoid.x, z - avoid.z) < 60) continue;
      if (world.hitsBuilding(x, z, 2.2)) continue;
      const kind = dice.pick(CAR_KINDS);
      const car = createVehicle({
        kind,
        color: kind === 'taxi' ? 0xf0c220 : dice.pick(TRAFFIC_COLOURS),
        x,
        z,
        heading: alongX ? (travel > 0 ? Math.PI / 2 : -Math.PI / 2) : (travel > 0 ? 0 : Math.PI),
      });
      car.position.y = world.groundHeight(x, z);
      car.traffic = { alongX, road, travel, lane: lateral, phase: dice.range(0, 6.28) };
      car.updateModel();
      root.add(car.group);
      cars.push(car);
      return car;
    }
    return null;
  }

  for (let i = 0; i < count; i += 1) spawn(null);

  const forward = new THREE.Vector3();

  /** One traffic car: hold the lane, mind the gap, stop for the light. */
  function drive(car, dt, playerPos, playerCar) {
    const t = car.traffic;
    forward.set(Math.sin(car.heading), 0, Math.cos(car.heading));
    const speed = car.velocity.dot(forward);

    // Distance to whatever is ahead in this lane.
    let gap = 22;
    const probeX = car.position.x + forward.x * 6;
    const probeZ = car.position.z + forward.z * 6;
    for (const other of cars) {
      if (other === car) continue;
      const dx = other.position.x - probeX;
      const dz = other.position.z - probeZ;
      const along = dx * forward.x + dz * forward.z;
      if (along < -2 || along > 18) continue;
      const side = Math.abs(dx * -forward.z + dz * forward.x);
      if (side < 2.6) gap = Math.min(gap, Math.max(0, along));
    }
    if (playerPos) {
      const dx = playerPos.x - probeX;
      const dz = playerPos.z - probeZ;
      const along = dx * forward.x + dz * forward.z;
      const side = Math.abs(dx * -forward.z + dz * forward.x);
      if (along > -2 && along < 18 && side < 2.4) gap = Math.min(gap, Math.max(0, along));
    }

    // A red light just ahead stops the car at the junction.
    let stopForLight = false;
    const redNow = Math.floor(world.state.time * 0.16) % 2 === 0;
    if (!redNow) {
      const ahead = 7 + Math.max(0, speed) * 0.55;
      const ax = car.position.x + forward.x * ahead;
      const az = car.position.z + forward.z * ahead;
      for (const road of ROADS) {
        const nearCross = t.alongX ? Math.abs(az - road) < ROAD_HALF + 2 : Math.abs(ax - road) < ROAD_HALF + 2;
        if (nearCross && speed < 12) stopForLight = true;
      }
    }

    let throttle = 0;
    let brake = 0;
    const wanted = Math.min(12.5, gap * 1.1);
    if (stopForLight || gap < 4) {
      throttle = 0;
      brake = 1;
    } else if (speed < wanted) {
      throttle = 0.5;
    } else if (speed > wanted + 1.2) {
      brake = 0.8;
    }

    // Steer back to the lane centre, measured across the road.
    const across = t.alongX ? car.position.z - t.road : car.position.x - t.road;
    const error = t.lane - across;
    let steer = THREE.MathUtils.clamp(error * 0.5, -0.7, 0.7);
    // Steering sign flips with the direction of travel and with the car's own orientation.
    if (t.alongX) steer *= t.travel > 0 ? forward.x > 0 ? -1 : 1 : forward.x > 0 ? 1 : -1;
    else steer *= t.travel > 0 ? forward.z > 0 ? 1 : -1 : forward.z > 0 ? -1 : 1;
    steer *= 0.6;

    // Keep the heading roughly along the road (a little wobble keeps it alive).
    const wantedHeading = t.alongX
      ? (t.travel > 0 ? Math.PI / 2 : -Math.PI / 2)
      : (t.travel > 0 ? 0 : Math.PI);
    let headingError = wantedHeading - car.heading;
    while (headingError > Math.PI) headingError -= Math.PI * 2;
    while (headingError < -Math.PI) headingError += Math.PI * 2;
    steer += THREE.MathUtils.clamp(headingError * 1.4, -0.5, 0.5);

    stepVehicle(car, dt, { throttle, brake, steer, handbrake: false }, world);
    void playerCar;
  }

  function update(dt, playerPos, playerCar) {
    for (const car of cars) drive(car, dt, playerPos, playerCar);
  }

  /** Take a car out of the traffic pool (the player stole it) and spawn a replacement elsewhere. */
  function take(car, avoid) {
    const index = cars.indexOf(car);
    if (index !== -1) cars.splice(index, 1);
    root.remove(car.group);
    spawn(avoid, null);
  }

  /** Traffic keeps clear of the block centres, which is where cars park. */
  function freeBlockCentre() {
    return dice.pick(BLOCK_CENTERS);
  }

  return { cars, root, update, spawn, take, freeBlockCentre };
}
