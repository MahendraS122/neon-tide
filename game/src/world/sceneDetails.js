// Original neon storefronts, fire particles and cinematic street effects.
import * as THREE from 'three';
import { createVehicle } from '../entities/vehicle.js';

function box(root, size, position, color, emissive = false) {
  const material = emissive
    ? new THREE.MeshBasicMaterial({ color, toneMapped: false })
    : new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .15 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  root.add(mesh);
  return mesh;
}

export function tracer(scene, from, to, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...from), new THREE.Vector3(...to)
  ]);
  scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
    color, transparent: true, opacity, toneMapped: false
  })));
}

export function muzzleFlash(scene, x, y, z) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8;
    const radius = i % 2 ? .035 : .14;
    const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
    if (i) shape.lineTo(px, py);
    else shape.moveTo(px, py);
  }
  shape.closePath();
  const flash = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({
    color: 0xffeb9d, side: THREE.DoubleSide, toneMapped: false
  }));
  flash.rotation.y = Math.PI / 2;
  flash.position.set(x, y, z);
  scene.add(flash);
  const light = new THREE.PointLight(0xffba64, 8, 5, 2);
  light.position.copy(flash.position);
  scene.add(light);
}

export function clearCamera(root, from, to) {
  // Furniture is baked by material. Remove only triangles in the camera corridor,
  // preserving every distant palm and building and leaving normal play untouched.
  const direction = to.clone().sub(from);
  const length = direction.length();
  direction.normalize();
  root.updateMatrixWorld(true);
  root.traverse(object => {
    if (!object.isMesh || object.parent !== root || !object.geometry.attributes.position) return;
    const source = object.geometry;
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    const points = geometry.attributes.position;
    const center = new THREE.Vector3();
    const point = new THREE.Vector3();
    const keep = [];
    for (let i = 0; i < points.count; i += 3) {
      center.set(0, 0, 0);
      for (let j = 0; j < 3; j++) {
        point.fromBufferAttribute(points, i + j);
        center.add(point);
      }
      center.multiplyScalar(1 / 3).applyMatrix4(object.matrixWorld);
      const relative = center.clone().sub(from);
      const along = relative.dot(direction);
      const distance = relative.addScaledVector(direction, -along).length();
      if (along > -1 && along < length && distance < 1.6 && center.y > .3) continue;
      keep.push(i, i + 1, i + 2);
    }
    geometry.setIndex(keep);
    object.geometry = geometry;
  });
}

export function dressNeonRow(game, x, z) {
  const root = new THREE.Group();
  root.name = 'Neon Row original storefronts';
  game.view.scene.add(root);
  const labels = ['CLUB SOLARA', 'TIDE BAR', '24/7 MART', 'LAVADO LOUNGE'];
  const palette = ['#ff459f', '#29edd4', '#ffc86d', '#a68cff'];
  labels.forEach((label, index) => {
    const side = index % 2 ? 1 : -1;
    const shop = new THREE.Group();
    shop.position.set(x + 10 + Math.floor(index / 2) * 17, 0, z + side * 10);
    // All shops face the road along X.
    shop.rotation.y = side < 0 ? 0 : Math.PI;
    root.add(shop);
    box(shop, [15, 8, 2], [0, 4, 0], index % 2 ? 0x34646c : 0x654661);
    box(shop, [14, .25, .5], [0, 7, -1.15], 0xe9bea3);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101a29';
    ctx.fillRect(0, 0, 1024, 192);
    ctx.strokeStyle = palette[index];
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, 1008, 176);
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = palette[index];
    ctx.shadowColor = palette[index];
    ctx.shadowBlur = 22;
    ctx.fillText(label, 512, 132, 970);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.45),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }));
    sign.position.set(0, 5.6, -1.06);
    shop.add(sign);
    for (const windowX of [-4.7, 4.7]) {
      box(shop, [4.1, 2.65, .1], [windowX, 2, -1.12], 0x294e63);
      for (const dx of [-2.12, 0, 2.12]) {
        box(shop, [.1, 2.9, .18], [windowX + dx, 2, -1.25], 0xf5cba6);
      }
      box(shop, [4.5, .12, .18], [windowX, .58, -1.25], 0xf5cba6);
      for (let j = 0; j < 4; j++) {
        box(shop, [.5, .6 + j % 2 * .3, .3],
          [windowX - 1.4 + j * .9, 1.2, -1.3], j % 2 ? 0xffbe71 : 0x41d4c8, true);
      }
      box(shop, [4.7, .15, 1.9], [windowX, 3.65, -1.9], index % 2 ? 0x2dafa5 : 0xda547e);
      box(shop, [4.7, .5, .12], [windowX, 3.4, -2.8], 0xe5cba9);
    }
    box(shop, [2, 3.3, .15], [0, 1.65, -1.2], 0x122f46);
    for (const doorX of [-1.1, 1.1]) box(shop, [.15, 3.4, .2], [doorX, 1.7, -1.35], 0xd5b99b);
    box(shop, [.12, .5, .14], [.7, 1.5, -1.42], 0xf9d086, true);
    const light = new THREE.PointLight(palette[index], 65, 24, 2);
    light.position.set(0, 4, -4);
    shop.add(light);
    const reflection = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshBasicMaterial({
      color: palette[index], transparent: true, opacity: .13, depthWrite: false
    }));
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.set(0, .025, -5);
    shop.add(reflection);
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), new THREE.MeshStandardMaterial({
    color: 0x17273b, roughness: .18, metalness: .65, transparent: true, opacity: .9
  }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(x + 20, .018, z);
  root.add(road);
  for (let i = 0; i < 4; i++) {
    const px = x + 6 + i * 11, pz = z + (i % 2 ? 8 : -8);
    box(root, [.14, 5.5, .14], [px, 2.75, pz], 0x293342);
    box(root, [1, .15, .5], [px, 5.5, pz], 0xffd6a1, true);
    const lamp = new THREE.PointLight(0xffd6a1, 40, 16, 2);
    lamp.position.set(px, 5, pz);
    root.add(lamp);
  }
}

export function fireWreck(game, x, z) {
  const wreck = createVehicle({ x, z, kind: 'sedan', color: 0x555969, heading: -.3 });
  wreck.health = 0;
  game.view.scene.add(wreck.group);
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 86, 2, 32, 69, 50);
  gradient.addColorStop(0, '#fff6bd');
  gradient.addColorStop(.3, '#ffd54b');
  gradient.addColorStop(.6, '#ff591dcc');
  gradient.addColorStop(1, '#ff251000');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(32, 2);
  ctx.bezierCurveTo(20, 48, 0, 65, 13, 113);
  ctx.quadraticCurveTo(32, 132, 52, 110);
  ctx.bezierCurveTo(64, 75, 37, 44, 32, 2);
  ctx.fill();
  const map = new THREE.CanvasTexture(canvas);
  for (let i = 0; i < 9; i++) {
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({
      map, transparent: true, depthWrite: false, toneMapped: false
    }));
    flame.scale.set(.6 + i % 3 * .16, 1.1 + i % 2 * .5, 1);
    flame.position.set(x + (i % 3 - 1) * .38, 1.1 + i % 2 * .25, z - 1.5 + i % 3 * .35);
    game.view.scene.add(flame);
  }
  for (let i = 0; i < 8; i++) {
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(.3 + i * .06, 9, 7),
      new THREE.MeshBasicMaterial({ color: 0x65718a, transparent: true, opacity: .24, depthWrite: false }));
    smoke.position.set(x + i * .13, 2 + i * .4, z - 1);
    game.view.scene.add(smoke);
  }
  for (let i = 0; i < 18; i++) {
    box(game.view.scene, [.025, .07, .025],
      [x + Math.sin(i * 8) * .8, 1.4 + i * .13, z - 1 + Math.cos(i * 5) * .6], 0xffc269, true);
  }
  const light = new THREE.PointLight(0xff7131, 32, 13, 2);
  light.position.set(x, 2, z - 1);
  game.view.scene.add(light);
}
