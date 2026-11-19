// Neon Row layers illuminated storefronts and soft reflections over wet asphalt.
import * as THREE from '../../vendor/three.module.min.js';

function mesh(parent, geometry, material, x, y, z) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(x, y, z);
  parent.add(result);
  return result;
}

function billboard(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#15132c';
  ctx.fillRect(0, 0, 640, 128);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 4;
  ctx.strokeRect(11, 11, 618, 106);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'italic 900 60px Arial';
  ctx.fillStyle = color;
  ctx.fillText(text, 320, 65, 582);
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#fff0f7';
  ctx.fillText(text, 320, 65, 582);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide });
}

function glowMaterial(tint, opacity) {
  return new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(tint) }, opacity: { value: opacity } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 pos;
      void main() {
        pos = uv * 2. - 1.;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: `uniform vec3 tint; uniform float opacity; varying vec2 pos;
      void main() {
        float falloff = pow(max(0., 1. - dot(pos, pos)), 2.1);
        gl_FragColor = vec4(tint, falloff * opacity);
      }`
  });
}

export function createNeonRow(scene, textures, random) {
  const group = new THREE.Group();
  scene.add(group);
  const streetMap = textures.asphalt.clone();
  streetMap.repeat.set(1, 1.65);
  const asphalt = new THREE.MeshPhysicalMaterial({
    color: '#697292', roughness: 0.32, metalness: 0.24, clearcoat: 0.92, clearcoatRoughness: 0.19,
    envMapIntensity: 0.34, map: streetMap
  });
  const street = mesh(group, new THREE.PlaneGeometry(15.6, 69), asphalt, 24, 0.072, -1.5);
  street.rotation.x = -Math.PI / 2;
  street.receiveShadow = true;
  const wall = new THREE.MeshStandardMaterial({ color: '#362e46', roughness: 0.77 });
  const trim = new THREE.MeshStandardMaterial({ color: '#263347', roughness: 0.38, metalness: 0.3 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#b18e77', roughness: 0.44 });
  const plane = new THREE.PlaneGeometry(1, 1);
  const storefronts = [
    [-1, 5.0, 'CLUB SOLARA', '#ff47c4', '#802360'],
    [1, -0.3, 'TIDE BAR', '#5af5ff', '#105a82'],
    [-1, -13.3, '24/7 MART', '#7afaeb', '#276865'],
    [1, -19.1, 'LAVADO LOUNGE', '#ff5baf', '#722956']
  ];
  for (const [side, z, name, tint, shade] of storefronts) {
    const store = new THREE.Group();
    store.position.set(24 + side * 11.7, 0, z);
    store.rotation.y = -side * Math.PI / 2;
    group.add(store);
    const box = (w, h, d, material, x, y, localZ) => {
      return mesh(store, new THREE.BoxGeometry(w, h, d), material, x, y, localZ);
    };
    box(14, 5.4, 2.7, wall, 0, 2.7, -0.58);
    box(14.6, 0.3, 3.3, trim, 0, 5.32, -0.37);
    box(14.2, 0.19, 2.9, bronze, 0, 4.16, -0.32);
    const window = new THREE.MeshStandardMaterial({
      color: shade, emissive: tint, emissiveIntensity: 0.48, roughness: 0.32
    });
    const strip = new THREE.MeshBasicMaterial({ color: tint, toneMapped: false });
    for (let i = -2; i <= 2; i += 1) {
      box(2.44, 2.35, 0.07, window, i * 2.63, 1.66, 0.82);
      box(2.48, 0.07, 0.15, trim, i * 2.63, 1.28, 0.87);
      box(0.07, 2.37, 0.18, bronze, i * 2.63, 1.66, 0.87);
      for (let j = 0; j < 4; j += 1) {
        const item = box(0.13 + random() * 0.14, 0.18 + random() * 0.31,
          0.04, trim,
          i * 2.63 - 0.76 + j * 0.48, 1.48, 0.89);
        item.rotation.z = (random() - 0.5) * 0.32;
      }
    }
    const fabric = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.86 });
    for (let i = 0; i < 14; i += 1) {
      const x = (i - 6.5) * 0.97;
      box(0.98, 0.11, 1.9, i % 2 ? fabric : bronze, x, 3.11, 1.23).rotation.x = 0.22;
      box(0.97, 0.16, 0.08, i % 2 ? fabric : bronze, x, 2.84, 2.14);
    }
    box(13.8, 0.075, 0.09, strip, 0, 3.42, 1.19);
    box(13.8, 0.046, 0.08, strip, 0, 4.95, 0.87);
    const sign = mesh(store, plane, billboard(name, tint), 0, 4.12, 1.0);
    sign.scale.set(9.3, 1.59, 1);
    const light = new THREE.PointLight(tint, 61, 20, 1.57);
    light.position.set(24 + side * 8.5, 3.2, z);
    group.add(light);
    const haze = mesh(store, plane, glowMaterial(tint, 0.20), 0, 4.12, 1.05);
    haze.scale.set(14.6, 3.9, 1);

    // Stagger tinted glow patches along the pavement beneath each sign.
    for (let i = 0; i < 6; i += 1) {
      const reflection = mesh(group, plane, glowMaterial(tint, 0.15 + random() * 0.14),
        24 + side * (6.8 - i * 0.9), 0.078, z + (random() - 0.5) * 4);
      reflection.rotation.x = -Math.PI / 2;
      reflection.rotation.z = Math.PI / 2;
      reflection.scale.set(0.8 + random() * 2.5, 5.6 + random() * 4.5, 1);
    }
  }
  for (const [x, z] of [[16, 10], [32, -3], [16, -14], [32, -26]]) {
    const lamp = new THREE.PointLight('#ffd7a0', 44, 16, 1.5);
    lamp.position.set(x, 5.3, z);
    group.add(lamp);
    mesh(group, new THREE.CylinderGeometry(0.065, 0.10, 5.45, 7), trim, x, 2.76, z);
    mesh(group, new THREE.BoxGeometry(0.6, 0.13, 0.35), bronze, x, 5.51, z);
    const bulb = new THREE.MeshBasicMaterial({ color: '#ffe2a7', toneMapped: false });
    mesh(group, new THREE.BoxGeometry(0.5, 0.06, 0.26), bulb, x, 5.42, z);
  }
}
