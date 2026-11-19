// Original tapered car bodies use bevelled arch-cut profiles, raked glass and detailed alloy wheels.
import * as THREE from '../../vendor/three.module.min.js';

export const VEHICLE_TYPES = {
  sports: { name: 'Solstice GT', length: 4.65, width: 1.96, roof: 1.46, power: 19, max: 62, grip: 8.3 },
  muscle: { name: 'Riptide V8', length: 5.05, width: 2.02, roof: 1.55, power: 18, max: 56, grip: 6.5 },
  suv: { name: 'Paloma Mesa', length: 4.95, width: 2.12, roof: 1.94, power: 12, max: 46, grip: 7.6 },
  taxi: { name: 'Solara Cab', length: 4.9, width: 1.96, roof: 1.65, power: 13, max: 49, grip: 8 },
  police: { name: 'SPD Interceptor', length: 5.05, width: 2, roof: 1.62, power: 18, max: 59, grip: 9 },
  van: { name: 'Harbor Courier', length: 5.5, width: 2.08, roof: 2.35, power: 10, max: 40, grip: 7 }
};

const tireGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 18);
const hubGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.262, 12);
const tireMaterial = new THREE.MeshStandardMaterial({ color: '#161e23', roughness: 0.94 });
const chromeMaterial = new THREE.MeshStandardMaterial({ color: '#cadbde', roughness: 0.2, metalness: 0.85 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: '#172833', roughness: 0.35, metalness: 0.3 });
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#457886', roughness: 0.14, metalness: 0.55, transparent: true, opacity: 0.83, side: THREE.DoubleSide
});
const tailMaterial = new THREE.MeshStandardMaterial({
  color: '#c52743', emissive: '#ff173e', emissiveIntensity: 2.4
});
const headMaterial = new THREE.MeshStandardMaterial({
  color: '#e8ffff', emissive: '#dcffff', emissiveIntensity: 3
});
const cube = new THREE.BoxGeometry(1, 1, 1);

function piece(parent, x, y, z, width, height, depth, material) {
  const mesh = new THREE.Mesh(cube, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function panel(parent, points, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function labelMaterial(text, color, background) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = color;
  ctx.font = 'italic bold 70px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 88);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.45 });
}

export function createVehicleModel(type = 'sports', color = '#13baaf') {
  const spec = VEHICLE_TYPES[type];
  const root = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.24, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.12,
    side: THREE.DoubleSide
  });
  const white = new THREE.MeshPhysicalMaterial({
    color: '#e6ebe4', roughness: 0.28, metalness: 0.4, clearcoat: 1
  });
  const half = spec.length / 2;
  const width = spec.width / 2;
  const axle = spec.length * 0.29;
  const bodyTop = type === 'suv' || type === 'van' ? 1.18 : 0.98;
  const profile = new THREE.Shape();
  profile.moveTo(-half, 0.5);
  profile.lineTo(-half + 0.04, bodyTop - 0.05);
  profile.lineTo(-half + 0.35, bodyTop + 0.07);
  profile.lineTo(-0.8, bodyTop + 0.08);
  profile.lineTo(0.8, bodyTop + 0.02);
  profile.lineTo(half - 0.16, bodyTop - 0.1);
  profile.lineTo(half, bodyTop - 0.25);
  profile.lineTo(half, 0.46);
  for (const center of [axle, -axle]) {
    profile.lineTo(center + 0.49, 0.44);
    for (let i = 0; i <= 12; i += 1) {
      const angle = i / 12 * Math.PI;
      profile.lineTo(center + Math.cos(angle) * 0.49, 0.44 + Math.sin(angle) * 0.49);
    }
  }
  profile.lineTo(-half, 0.5);
  const bodyGeometry = new THREE.ExtrudeGeometry(profile, {
    depth: spec.width - 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1,
    bevelSize: 0.045, bevelThickness: 0.045, curveSegments: 8
  });
  bodyGeometry.rotateY(-Math.PI / 2);
  bodyGeometry.translate(width - 0.05, 0, 0);
  const body = new THREE.Mesh(bodyGeometry, paint);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);
  piece(root, 0, 0.45, 0, spec.width * 0.84, 0.18, spec.length * 0.82, darkMaterial);
  const rearBase = type === 'van' ? -half + 0.18 : -1.15;
  const rearRoof = type === 'van' ? -half + 0.25 : -0.65;
  const frontRoof = type === 'van' ? 0.65 : 0.42;
  const frontBase = type === 'van' ? 1.25 : 1.08;
  const baseY = bodyTop + 0.035;
  const roofY = spec.roof;
  const roofWidth = width * (type === 'sports' ? 0.72 : 0.83);
  const baseWidth = width * 0.9;
  panel(root, [[-roofWidth, roofY, rearRoof], [roofWidth, roofY, rearRoof],
    [roofWidth, roofY, frontRoof], [-roofWidth, roofY, frontRoof]], paint);
  panel(root, [[-baseWidth, baseY, frontBase], [-roofWidth, roofY, frontRoof],
    [roofWidth, roofY, frontRoof], [baseWidth, baseY, frontBase]], glassMaterial);
  panel(root, [[baseWidth, baseY, rearBase], [roofWidth, roofY, rearRoof],
    [-roofWidth, roofY, rearRoof], [-baseWidth, baseY, rearBase]], glassMaterial);
  for (const side of [-1, 1]) {
    panel(root, [[side * baseWidth, baseY, rearBase], [side * roofWidth, roofY, rearRoof],
      [side * roofWidth, roofY, frontRoof], [side * baseWidth, baseY, frontBase]], glassMaterial);
    const pillar = piece(root, side * (baseWidth + roofWidth) / 2, (roofY + baseY) / 2,
      -0.1, 0.07, roofY - baseY, 0.075, type === 'police' ? white : paint);
    pillar.rotation.z = side * 0.17;
    piece(root, side * baseWidth, baseY, 0, 0.055, 0.055, frontBase - rearBase, chromeMaterial);
    piece(root, side * (width + 0.06), baseY + 0.11, 0.8, 0.24, 0.14, 0.3, paint);
    piece(root, side * (width + 0.025), bodyTop - 0.18, -0.08, 0.035, 0.045, 0.24, chromeMaterial);
    piece(root, side * 0.63, bodyTop - 0.27, half - 0.015, 0.52, 0.13, 0.075, headMaterial);
    piece(root, side * 0.67, bodyTop - 0.15, -half - 0.02, 0.48, 0.14, 0.06, tailMaterial);
  }
  piece(root, 0, 0.5, half + 0.04, spec.width * 0.87, 0.08, 0.12, chromeMaterial);
  piece(root, 0, 0.52, -half - 0.04, spec.width * 0.86, 0.07, 0.12, chromeMaterial);
  piece(root, 0, bodyTop - 0.28, half + 0.02, 0.63, 0.16, 0.06, darkMaterial);
  const plate = labelMaterial('SOLARA', '#203847', '#e7ddbe');
  piece(root, 0, 0.72, -half - 0.07, 0.47, 0.17, 0.02, plate);
  const wheels = [];
  for (const z of [-axle, axle]) {
    for (const side of [-1, 1]) {
      const steering = new THREE.Group();
      steering.position.set(side * (width - 0.08), 0.43, z);
      root.add(steering);
      const rolling = new THREE.Group();
      steering.add(rolling);
      const tire = new THREE.Mesh(tireGeometry, tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      rolling.add(tire);
      const hub = new THREE.Mesh(hubGeometry, chromeMaterial);
      hub.rotation.z = Math.PI / 2;
      rolling.add(hub);
      for (let i = 0; i < 5; i += 1) {
        const spoke = piece(rolling, side * 0.137, 0, 0, 0.025, 0.42, 0.045, darkMaterial);
        spoke.rotation.x = i * Math.PI / 5;
      }
      wheels.push({ steering, rolling, front: z > 0 });
    }
  }
  if (type === 'sports') {
    for (const side of [-1, 1]) {
      piece(root, side * 0.57, 1.04, -half + 0.3, 0.1, 0.27, 0.1, darkMaterial);
    }
    piece(root, 0, 1.19, -half + 0.3, spec.width, 0.08, 0.36, paint);
  }
  if (type === 'muscle') {
    for (const side of [-0.21, 0.21]) piece(root, side, bodyTop + 0.03, 1.4, 0.2, 0.035, 1.2, darkMaterial);
    piece(root, 0, bodyTop + 0.12, 1.0, 0.57, 0.15, 0.65, darkMaterial);
  }
  const flashMaterials = [];
  if (type === 'police') {
    const decal = labelMaterial('SPD', '#1c3340', '#e6ebe4');
    for (const side of [-1, 1]) {
      piece(root, side * (width + 0.015), 0.84, -0.05, 0.03, 0.3, 1.3, white);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.32), decal);
      sign.position.set(side * (width + 0.035), 0.85, -0.05);
      sign.rotation.y = side * Math.PI / 2;
      root.add(sign);
    }
    piece(root, 0, roofY + 0.06, 0, 1.4, 0.08, 0.4, darkMaterial);
    for (const side of [-1, 1]) {
      const color = side < 0 ? '#f52249' : '#327aff';
      const light = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1 });
      piece(root, side * 0.42, roofY + 0.19, 0, 0.54, 0.2, 0.32, light);
      flashMaterials.push(light);
    }
  }
  if (type === 'taxi') {
    piece(root, 0, roofY + 0.17, 0, 0.64, 0.27, 0.32, labelMaterial('CAB', '#182830', '#ffe178'));
  }
  if (type === 'van') {
    piece(root, 0, (baseY + roofY) / 2, -1.25, spec.width * 0.85, roofY - baseY, 1.6, paint);
  }
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6),
    new THREE.MeshStandardMaterial({ color: '#b78e70' }));
  driverHead.position.set(0.39, bodyTop + 0.3, 0.05);
  root.add(driverHead);
  return { root, wheels, flashMaterials, driverHead, spec, paint };
}
