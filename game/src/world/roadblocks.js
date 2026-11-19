// At high heat, place an in-game cordon ahead on the nearest through street.
import * as THREE from '../../vendor/three.module.min.js';

export function createRoadblocks(scene, city) {
  const group = new THREE.Group();
  scene.add(group);
  const foot = new THREE.MeshStandardMaterial({ color: '#233542' });
  const stripe = new THREE.MeshStandardMaterial({
    color: '#ffd76c', emissive: '#dd670e', emissiveIntensity: 0.4
  });
  const beam = new THREE.BoxGeometry(0.5, 0.18, 0.15);
  const base = new THREE.BoxGeometry(0.14, 0.95, 0.58);
  for (const x of [-5, -3.2, 1.8, 3.6, 5.4]) {
    const frame = new THREE.Mesh(base, foot);
    frame.position.set(x, 0.48, 0);
    group.add(frame);
    for (let i = -2; i <= 2; i += 1) {
      const piece = new THREE.Mesh(beam, i % 2 ? foot : stripe);
      piece.position.set(x + i * 0.49, 0.85, 0);
      group.add(piece);
    }
  }
  const unit = { name: 'CORDON', status: 'ROADBLOCK', position: group.position };
  const barrierColliders = [];
  let axis = 0;
  function clear() {
    for (const wall of barrierColliders) city.colliders.splice(city.colliders.indexOf(wall), 1);
    barrierColliders.length = 0;
    group.visible = false;
  }
  function deploy(x, z, horizontal) {
    clear();
    axis = horizontal;
    group.visible = true;
    group.position.set(x, 0.04, z);
    group.rotation.y = horizontal ? Math.PI / 2 : 0;
    for (const [low, high] of [[-6.3, -1.9], [0.55, 6.75]]) {
      const wall = horizontal
        ? { minX: x - 0.38, maxX: x + 0.38, minZ: z - high, maxZ: z - low }
        : { minX: x + low, maxX: x + high, minZ: z - 0.38, maxZ: z + 0.38 };
      wall.height = 0.95;
      city.colliders.push(wall);
      barrierColliders.push(wall);
    }
  }
  function update(stars, player, time) {
    if (stars < 4) {
      if (group.visible) clear();
      return;
    }
    if (!group.visible || player.position.distanceTo(group.position) > 106) {
      const position = player.position;
      const yaw = player.vehicle?.yaw ?? player.character.root.rotation.y;
      const horizontal = Math.abs(Math.sin(yaw)) > 0.7;
      const lines = horizontal ? city.roadZ : city.roadX;
      const along = horizontal ? position.x : position.z;
      const lateral = horizontal ? position.z : position.x;
      const line = lines.reduce((a, b) => Math.abs(a - lateral) < Math.abs(b - lateral) ? a : b);
      const direction = Math.sign(horizontal ? Math.sin(yaw) : Math.cos(yaw)) || 1;
      const min = horizontal ? city.roadX[0] : city.roadZ[0];
      const max = horizontal ? city.roadX.at(-1) : city.roadZ.at(-1);
      const ahead = THREE.MathUtils.clamp(along + direction * 45, min + 14, max - 14);
      deploy(horizontal ? ahead : line, horizontal ? line : ahead, horizontal);
    }
    stripe.emissiveIntensity = 0.65 + Math.sin(time * 8 + Number(axis)) * 0.45;
  }
  clear();
  return { update, deploy, unit, get active() { return group.visible; } };
}
