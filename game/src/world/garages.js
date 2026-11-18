// Corallo's roadside service bay provides a visible garage and interaction radius.
import * as THREE from 'three';
import { createObjectiveMarker } from '../missions/objectives.js';
export function createGarages(game) { const point = game.world.landmarks.garage;
point.x = - 188;
point.z = - 235;
const root = new THREE.Group();
root.position.set(point.x, game.world.groundHeight(point.x, point.z), point.z);
game.view.scene.add(root);
const metal = new THREE.MeshStandardMaterial({ color: 0x152d34, roughness: 0.55, metalness: 0.6 });
const glow = new THREE.MeshBasicMaterial({ color: 0x23e0c6, toneMapped: false });
for (const side of[- 1, 1]) {
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.8, 0.6), metal);
  post.position.set(side * 4, 2.4, 0);
  root.add(post);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.4, 0.08), glow);
  strip.position.set(side * 3.72, 2.4, 0.34);
  root.add(strip);
}
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 112;
const context = canvas.getContext('2d');
context.fillStyle = '#0a1b25';
context.fillRect(0, 0, 512, 112);
context.fillStyle = '#6fffe1';
context.textAlign = 'center';
context.font = 'bold 43px Arial';
context.fillText('CORALLO / CUSTOMS', 256, 69);
const texture = new THREE.CanvasTexture(canvas);
texture.colorSpace = THREE.SRGBColorSpace;
const sign = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.6, 0.35), new THREE.MeshBasicMaterial({ map:
texture, toneMapped: false }));
sign.position.y = 5.1;
root.add(sign);
const marker = createObjectiveMarker(root, 0xffb35e);
marker.scale.set(1.4, 0.12, 1.4);
function nearby() {
  const position = game.playerRig.player.position;
  return Math.hypot(position.x - point.x, position.z - point.z) < 13;
}
function update(input) {
  if (nearby() && input.pressed('KeyG')) {
    if (game.playerRig.player.inVehicle) game.garage.show();
    else game.hud.float('Bring a car to Corallo Customs', 'good');
  }
}
return { point, nearby, update };
}
