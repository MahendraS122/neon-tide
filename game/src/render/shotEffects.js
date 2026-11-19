// Procedural shot-only smoke, flame, streaks and cruiser light pools.
import * as THREE from '../../vendor/three.module.min.js';

function particleTexture(flame, random) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 22; i += 1) {
    const x = 48 + (random() - 0.5) * 45;
    const y = 48 + (random() - 0.5) * 45;
    const radius = 11 + random() * 19;
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
    gradient.addColorStop(0, flame ? '#fffbc3e6' : '#ffffff62');
    gradient.addColorStop(0.38, flame ? '#ffba46ce' : '#ffffff29');
    gradient.addColorStop(0.72, flame ? '#fa4c1880' : '#ffffff16');
    gradient.addColorStop(1, '#ffffff00');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Prepare reusable particle textures and return the shot-only visual helpers.
export function createShotEffects(game, random) {
  const { scene } = game;
  const smoke = particleTexture(false, random);
  const flame = particleTexture(true, random);
  function puff(map, color, x, y, z, width, height, opacity) {
    const material = new THREE.SpriteMaterial({ map, color, opacity, transparent: true,
      depthWrite: false, toneMapped: false, rotation: (random() - 0.5) * 1.3 });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(width, height, 1);
    scene.add(sprite);
  }
  function wreck(position) {
    const { x, z } = position;
    const fireLight = new THREE.PointLight('#ff7128', 112, 17, 1.5);
    fireLight.position.set(x, 1.55, z);
    scene.add(fireLight);
    for (let i = 0; i < 22; i += 1) {
      const y = 1.2 + random() * 7.3;
      puff(smoke, i % 3 ? '#3f344f' : '#7b5066', x - y * 0.43 + random() * 2.4,
        y, z - y * 0.29, 1.9 + y * 0.72, 1.3 + y * 0.63, 0.32 + random() * 0.28);
    }
    for (let i = 0; i < 17; i += 1) {
      puff(flame, i % 3 ? '#ff9d55' : '#fff1b1', x + (random() - 0.5) * 2.5,
        0.95 + random() * 1.35, z + (random() - 0.5) * 2.35, 0.65 + random() * 0.8,
        1.4 + random() * 1.6, 0.68 + random() * 0.32);
    }
    for (let i = 0; i < 13; i += 1) {
      puff(flame, '#ff9360', x - random() * 2.8, 2.1 + random() * 3.3, z + random(), 0.26, 0.42, 0.62);
    }
  }
  function drift(car) {
    for (let i = 0; i < 22; i += 1) {
      const trail = i / 22;
      puff(smoke, i % 2 ? '#d1d6df' : '#e8beb4', car.position.x + (random() - 0.5) * (2 + trail * 3),
        0.29 + trail * 0.54, car.position.z + 1.4 + trail * 6.2, 1.2 + trail * 2.4,
        0.53 + trail * 1.2, 0.34 * (1 - trail) + 0.08);
    }
  }
  function flash(car, index) {
    car.flashMaterials.forEach((material, i) => {
      material.emissiveIntensity = (i + index) % 2 ? 7 : 3.7;
    });
    for (const [side, color] of [[-1, '#ff1446'], [1, '#226cff']]) {
      const x = car.position.x + side * 0.78;
      const z = car.position.z;
      const light = new THREE.PointLight(color, 98, 11, 1.48);
      light.position.set(x, 1.64, z);
      scene.add(light);
      const material = new THREE.MeshBasicMaterial({
        map: smoke, color, opacity: 0.59, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending
      });
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 8.5), material);
      pool.position.set(x, 0.091, z + 0.4);
      pool.rotation.x = -Math.PI / 2;
      scene.add(pool);
      puff(smoke, color, x, 1.63, z, 0.86, 0.52, 0.62);
    }
  }
  function speedLines(camera) {
    const depth = 4;
    const height = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth;
    const width = height * camera.aspect;
    const lines = [];
    for (let i = 0; i < 26; i += 1) {
      const side = i % 2 ? -1 : 1;
      const x = (0.54 + random() * 0.47) * side;
      const y = -0.34 - random() * 0.7;
      const stretch = 0.055 + random() * 0.24;
      lines.push(x * width, y * height, -depth,
        x * width * (1 + stretch), y * height * (1 + stretch), -depth);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    const material = new THREE.LineBasicMaterial({
      color: '#fff1dc', transparent: true, opacity: 0.27, depthTest: false, depthWrite: false
    });
    const streaks = new THREE.LineSegments(geometry, material);
    streaks.frustumCulled = false;
    streaks.renderOrder = 4;
    camera.add(streaks);
    scene.add(camera);
  }
  return { wreck, drift, flash, speedLines };
}
