// Arcade muzzle flashes, luminous streaks and impact particles share timed cleanup.
import * as THREE from '../../vendor/three.module.min.js';

// Create the scene effects and their per-frame lifetime updater.
export function createCombatEffects(scene, random) {
  const active = [];
  const shape = new THREE.Shape();
  for (let i = 0; i < 12; i += 1) {
    const angle = i * Math.PI / 6;
    const radius = i % 2 ? 0.06 : 0.25;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const star = new THREE.ShapeGeometry(shape);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: '#ffdc89', side: THREE.DoubleSide, toneMapped: false
  });
  const sparkGeometry = new THREE.SphereGeometry(0.035, 5, 4);
  const sparkMaterial = new THREE.MeshBasicMaterial({ color: '#ffb358', toneMapped: false });
  const streak = new THREE.CylinderGeometry(0.016, 0.008, 1, 5);
  const streakColor = new THREE.MeshBasicMaterial({ color: '#ffbc60', toneMapped: false });
  const replyColor = new THREE.MeshBasicMaterial({ color: '#ff6d55', toneMapped: false });
  const up = new THREE.Vector3(0, 1, 0);

  function track(mesh, ttl, velocity = null) {
    scene.add(mesh);
    active.push({ mesh, ttl, velocity });
  }
  function shot(origin, end, hostile = false, duration = 0.08) {
    const direction = end.clone().sub(origin);
    const length = direction.length();
    if (length < 0.02) return;
    direction.normalize();
    const flash = new THREE.Group();
    flash.position.copy(origin);
    flash.lookAt(end);
    const front = new THREE.Mesh(star, flashMaterial);
    const side = front.clone();
    side.rotation.y = Math.PI / 2;
    flash.add(front, side, new THREE.PointLight('#ff9b45', 20, 6));
    track(flash, duration);
    const line = new THREE.Mesh(streak, hostile ? replyColor : streakColor);
    const visibleLength = Math.min(12, length);
    line.position.copy(end).addScaledVector(direction, -visibleLength / 2);
    line.quaternion.setFromUnitVectors(up, direction);
    line.scale.y = visibleLength;
    track(line, duration * 0.85);
  }
  function impact(point, count = 8) {
    for (let i = 0; i < count; i += 1) {
      const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
      spark.position.copy(point);
      const velocity = new THREE.Vector3((random() - 0.5) * 6, 1 + random() * 4, (random() - 0.5) * 6);
      track(spark, 0.12 + random() * 0.27, velocity);
    }
  }
  function update(dt) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      const effect = active[i];
      effect.ttl -= dt;
      if (effect.ttl <= 0) {
        scene.remove(effect.mesh);
        active.splice(i, 1);
      } else if (effect.velocity) {
        effect.velocity.y -= 12 * dt;
        effect.mesh.position.addScaledVector(effect.velocity, dt);
      }
    }
  }
  return { shot, impact, update };
}
