// Bootstrap Port Solara; gameplay imports stay ahead of world and render imports.
import { createRenderer } from './render/renderer.js';
import { createSky } from './render/sky.js';
import { createTextures } from './render/textures.js';
import * as THREE from '../vendor/three.module.min.js';

const { renderer, scene, camera } = createRenderer(document.querySelector('#game'));
const sky = createSky(scene);
const textures = createTextures();
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
camera.lookAt(0, 0, 0);
addEventListener('keydown', event => {
  if (event.code === 'KeyN') sky.setNight(!sky.night);
});
renderer.setAnimationLoop(() => {
  sky.update(camera.position);
  renderer.render(scene, camera);
  window.__shotReady = true;
});
