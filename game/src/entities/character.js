// Rounded articulated people with distinct clothing, hair, faces and a grounded gait.
import * as THREE from '../../vendor/three.module.min.js';

const sphere = new THREE.SphereGeometry(1, 10, 8);
const capsule = new THREE.CapsuleGeometry(1, 1, 4, 8);
const materialCache = new Map();
function material(color) {
  if (!materialCache.has(color)) {
    materialCache.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  }
  return materialCache.get(color);
}

function rounded(parent, x, y, z, sx, sy, sz, color, geometry = sphere) {
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createCharacter(options = {}) {
  const { shirt = '#f1dfca', trousers = '#263f4a', skin = '#b98361', hair = '#241e22' } = options;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  rounded(body, 0, 1.16, 0, 0.28, 0.34, 0.17, shirt);
  rounded(body, 0, 0.89, 0, 0.24, 0.16, 0.16, trousers);
  rounded(body, 0, 1.47, 0, 0.09, 0.1, 0.09, skin);
  rounded(body, 0, 1.66, 0.02, 0.16, 0.21, 0.155, skin);
  rounded(body, 0, 1.79, -0.02, 0.168, 0.11, 0.156, hair);
  rounded(body, 0, 1.86, 0.035, 0.13, 0.055, 0.12, hair);
  rounded(body, 0, 1.63, 0.172, 0.036, 0.042, 0.037, skin);
  for (const side of [-1, 1]) {
    rounded(body, side * 0.16, 1.66, 0, 0.035, 0.06, 0.045, skin);
    rounded(body, side * 0.061, 1.7, 0.152, 0.021, 0.014, 0.012, '#211e23');
  }
  if (options.player) {
    rounded(body, 0, 1.19, 0.11, 0.17, 0.27, 0.09, '#f2e6d0');
    rounded(body, -0.2, 1.24, 0.1, 0.09, 0.28, 0.1, '#387e81');
    rounded(body, 0.2, 1.24, 0.1, 0.09, 0.28, 0.1, '#387e81');
  }
  const arms = [];
  const legs = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.3, 1.36, 0);
    body.add(arm);
    rounded(arm, 0, -0.1, 0, 0.09, 0.09, 0.09, shirt, capsule);
    rounded(arm, 0, -0.32, 0.015, 0.065, 0.075, 0.065, skin, capsule);
    rounded(arm, 0, -0.48, 0.025, 0.064, 0.085, 0.06, skin);
    arms.push(arm);
    const leg = new THREE.Group();
    leg.position.set(side * 0.135, 0.87, 0);
    body.add(leg);
    rounded(leg, 0, -0.17, 0, 0.105, 0.12, 0.11, trousers, capsule);
    rounded(leg, 0, -0.52, 0, 0.08, 0.12, 0.085, trousers, capsule);
    rounded(leg, 0, -0.78, 0.07, 0.1, 0.075, 0.19, '#242c31');
    legs.push(leg);
  }
  let phase = 0;
  function animate(dt, speed = 0, aim = false) {
    phase += dt * (speed > 4 ? 12 : 8);
    const strength = Math.min(1, speed / 3);
    legs.forEach((leg, index) => {
      leg.rotation.x = Math.sin(phase + index * Math.PI) * strength * 0.7;
    });
    arms.forEach((arm, index) => {
      arm.rotation.x = aim ? -1.25 : -Math.sin(phase + index * Math.PI) * strength * 0.6;
      arm.rotation.z = aim ? (index ? 0.35 : -0.35) : (index ? -0.06 : 0.06);
    });
    body.position.y = Math.abs(Math.sin(phase)) * strength * 0.045;
    body.rotation.x = speed > 4 ? 0.12 : 0;
  }
  return { root, body, arms, legs, animate };
}
