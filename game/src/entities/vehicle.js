// Arcade acceleration, lateral grip, handbrake slip, collision damage and vehicle theft.
import * as THREE from '../../vendor/three.module.min.js';

import { moveWithCollisions, moveVehicleWithCollisions, overlaps } from './collision.js';

export function createVehicle(scene, model, type, x, z, yaw = 0, occupied = false) {
  model.root.position.set(x, 0.12, z);
  model.root.rotation.y = yaw;
  model.driverHead.visible = occupied;
  scene.add(model.root);
  return {
    ...model, type, position: model.root.position, yaw, speed: 0,
    velocity: new THREE.Vector3(), steering: 0, condition: 100,
    nitro: 100, drifting: false, driftTime: 0, driftChain: 0, nearMissCooldown: 0,
    occupied, controlled: false, traffic: occupied, stolen: false,
    brake: false, distance: 0, stopTimer: 0
  };
}

export function animateVehicle(vehicle, dt, time) {
  vehicle.root.rotation.y = vehicle.yaw;
  vehicle.distance += vehicle.speed * dt;
  vehicle.wheels.forEach(wheel => {
    wheel.rolling.rotation.x = vehicle.distance / 0.4;
    wheel.steering.rotation.y = wheel.front ? vehicle.steering * 0.42 : 0;
  });
  vehicle.flashMaterials.forEach((material, index) => {
    material.emissiveIntensity = Math.sin(time * 16 + index * Math.PI) > 0 ? 5 : 0.1;
  });
}

export function createVehicleSystem(scene, input, city, player, onEject, buildModel, onReward = () => {}) {
  const vehicles = [];
  const skidMaterial = new THREE.MeshBasicMaterial({ color: '#182126', transparent: true, opacity: 0.44 });
  const skidGeometry = new THREE.PlaneGeometry(0.2, 1.2);
  const skidMarks = new THREE.InstancedMesh(skidGeometry, skidMaterial, 360);
  skidMarks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  skidMarks.frustumCulled = false;
  scene.add(skidMarks);
  const dummy = new THREE.Object3D();
  dummy.scale.setScalar(0);
  for (let i = 0; i < 360; i += 1) {
    dummy.updateMatrix();
    skidMarks.setMatrixAt(i, dummy.matrix);
  }
  dummy.scale.setScalar(1);
  let skidIndex = 0;
  let skidTime = 0;
  let notice = '';
  let noticeTimer = 0;
  function add(type, color, x, z, yaw = 0, occupied = false) {
    const model = buildModel(type, color);
    const vehicle = createVehicle(scene, model, type, x, z, yaw, occupied);
    vehicles.push(vehicle);
    return vehicle;
  }
  function announce(text) {
    notice = text;
    noticeTimer = 3.2;
    document.querySelector('#status').textContent = text;
  }
  function enterOrExit() {
    if (player.vehicle) {
      const vehicle = player.vehicle;
      if (Math.abs(vehicle.speed) > 7) {
        announce('Slow down to exit.');
        return;
      }
      const right = new THREE.Vector3(Math.cos(vehicle.yaw), 0, -Math.sin(vehicle.yaw));
      let exit = null;
      for (const side of [-1, 1]) {
        const point = vehicle.position.clone().addScaledVector(right, side * 2);
        if (!overlaps(point, 0.4, city.colliders)) {
          exit = point;
          break;
        }
      }
      if (!exit) {
        announce('The doors are blocked.');
        return;
      }
      vehicle.controlled = false;
      vehicle.occupied = false;
      vehicle.driverHead.visible = false;
      vehicle.speed = 0;
      vehicle.velocity.set(0, 0, 0);
      player.vehicle = null;
      player.position.copy(exit);
      player.position.y = 0.22;
      player.character.root.position.copy(player.position);
      return;
    }
    let nearest = null;
    let distance = 4.2;
    for (const vehicle of vehicles) {
      if (vehicle.service) continue;
      const candidate = vehicle.position.distanceTo(player.position);
      if (candidate < distance && Math.abs(vehicle.speed) < 13) {
        nearest = vehicle;
        distance = candidate;
      }
    }
    if (!nearest) {
      announce('Get closer to a car to enter.');
      return;
    }
    if (nearest.occupied) {
      const side = new THREE.Vector3(-Math.cos(nearest.yaw), 0, Math.sin(nearest.yaw));
      const ejectPosition = nearest.position.clone().addScaledVector(side, 1.7);
      onEject(ejectPosition, nearest.yaw);
      nearest.stolen = true;
      announce(`Driver pulled out. ${nearest.spec.name} stolen.`);
    } else {
      announce(nearest.spec.name);
    }
    nearest.controlled = true;
    nearest.traffic = false;
    nearest.occupied = true;
    nearest.driverHead.visible = true;
    player.vehicle = nearest;
  }
  function drive(vehicle, dt) {
    const throttle = Number(input.down('KeyW') || input.down('ArrowUp'));
    const reverse = Number(input.down('KeyS') || input.down('ArrowDown'));
    const turn = Number(input.down('KeyA') || input.down('ArrowLeft'))
      - Number(input.down('KeyD') || input.down('ArrowRight'));
    const handbrake = input.down('Space');
    vehicle.brake = Boolean(reverse || handbrake);
    vehicle.steering = THREE.MathUtils.damp(vehicle.steering, turn, 8, dt);
    const spec = vehicle.spec;
    let acceleration = throttle * spec.power - reverse * (vehicle.speed > 1 ? 33 : 10);
    const boost = throttle && vehicle.nitro > 0 && (input.down('ShiftLeft') || input.down('ShiftRight'));
    if (boost) acceleration += 19;
    vehicle.nitro = THREE.MathUtils.clamp(vehicle.nitro + dt * (boost ? -27 : 6), 0, 100);
    if (vehicle.speed < -1 && throttle) acceleration = 27;
    vehicle.speed += acceleration * dt;
    vehicle.speed *= Math.exp(-dt * (handbrake ? 1.05 : throttle || reverse ? 0.13 : 0.42));
    vehicle.speed = THREE.MathUtils.clamp(vehicle.speed, -12, spec.max + (boost ? 9 : 0));
    const turnStrength = Math.min(1, Math.abs(vehicle.speed) / 7);
    vehicle.yaw += vehicle.steering * turnStrength * Math.sign(vehicle.speed)
      * (handbrake ? 2.1 : 1.13) * dt / (1 + Math.abs(vehicle.speed) * 0.018);
    const forward = new THREE.Vector3(Math.sin(vehicle.yaw), 0, Math.cos(vehicle.yaw));
    const desiredVelocity = forward.multiplyScalar(vehicle.speed);
    vehicle.velocity.lerp(desiredVelocity, 1 - Math.exp(-dt * (handbrake ? 1.35 : spec.grip)));
    const hit = moveVehicleWithCollisions(vehicle, vehicle.velocity.x * dt, vehicle.velocity.z * dt, city);
    if (hit) {
      vehicle.condition = Math.max(0, vehicle.condition - Math.abs(vehicle.speed) * dt * 4);
      vehicle.speed *= -0.18;
      vehicle.velocity.multiplyScalar(-0.15);
    }
    if (vehicle.condition <= 0) vehicle.speed *= Math.exp(-dt * 4);
    const slipping = handbrake || vehicle.velocity.clone().sub(desiredVelocity).length() > 6;
    vehicle.drifting = slipping && Math.abs(vehicle.speed) > 9 && Math.abs(vehicle.steering) > 0.28;
    if (vehicle.drifting) {
      vehicle.driftTime += dt;
      if (vehicle.driftTime >= 1.15) {
        vehicle.driftTime -= 1.15;
        vehicle.driftChain += 1;
        onReward(`DRIFT x${vehicle.driftChain}`, 20 * vehicle.driftChain);
      }
    } else {
      vehicle.driftTime = Math.max(0, vehicle.driftTime - dt * 2);
      if (!vehicle.driftTime) vehicle.driftChain = 0;
    }
    vehicle.nearMissCooldown = Math.max(0, vehicle.nearMissCooldown - dt);
    skidTime += dt;
    if (slipping && Math.abs(vehicle.speed) > 7 && skidTime > 0.045) {
      skidTime = 0;
      for (const side of [-1, 1]) {
        dummy.position.copy(vehicle.position);
        dummy.position.x += Math.cos(vehicle.yaw) * side * 0.8 - Math.sin(vehicle.yaw) * 1.3;
        dummy.position.z -= Math.sin(vehicle.yaw) * side * 0.8 + Math.cos(vehicle.yaw) * 1.3;
        dummy.position.y = 0.075;
        dummy.rotation.set(-Math.PI / 2, 0, -vehicle.yaw);
        dummy.updateMatrix();
        skidMarks.setMatrixAt(skidIndex++ % 360, dummy.matrix);
      }
      skidMarks.instanceMatrix.needsUpdate = true;
    }
  }
  function vehicleContacts() {
    const controlled = player.vehicle;
    if (!controlled) return;
    for (const other of vehicles) {
      if (other === controlled) continue;
      const distance = other.position.distanceTo(controlled.position);
      if (distance > 2.4 && distance < 3.55 && controlled.speed > 16 && other.traffic
        && !controlled.nearMissCooldown) {
        controlled.nearMissCooldown = 2.5;
        onReward('NEAR MISS', 50);
      }
      if (distance > 2.1 || distance < 0.01) continue;
      const direction = controlled.position.clone().sub(other.position).normalize();
      moveWithCollisions(controlled.position, direction.x * 0.2, direction.z * 0.2, 1.1, city);
      other.stopTimer = 2;
      const impact = Math.abs(controlled.speed - other.speed);
      if (impact > 5) controlled.condition = Math.max(0, controlled.condition - impact * 0.08);
      controlled.speed *= 0.55;
      controlled.velocity.multiplyScalar(0.55);
    }
  }
  function update(dt, time) {
    if (input.take('KeyF')) enterOrExit();
    if (noticeTimer > 0) noticeTimer -= dt;
    if (player.vehicle) drive(player.vehicle, dt);
    vehicleContacts();
    vehicles.forEach(vehicle => animateVehicle(vehicle, dt, time));
  }
  function nearestHint() {
    if (noticeTimer > 0) return notice;
    if (player.vehicle) return 'WASD DRIVE · SPACE HANDBRAKE · F EXIT · N NIGHT';
    const nearest = vehicles.find(vehicle => !vehicle.service && vehicle.position.distanceTo(player.position) < 4.2);
    return nearest ? `F ${nearest.occupied ? 'STEAL' : 'ENTER'} ${nearest.spec.name.toUpperCase()}` : null;
  }
  return { add, vehicles, update, nearestHint, enterOrExit };
}
