// Bootstrap Port Solara; gameplay imports stay ahead of world and render imports.
import { createCity } from './world/cityGen.js';
import { createRenderer } from './render/renderer.js';
import { createSky } from './render/sky.js';
import { createTextures } from './render/textures.js';
import * as THREE from '../vendor/three.module.min.js';

const { renderer, scene, camera } = createRenderer(document.querySelector('#game'));
const sky = createSky(scene);
const textures = createTextures();
const city = createCity(scene, textures);
camera.position.set(105, 3.8, 59);
camera.lookAt(90, 5, -25);
const clock = new THREE.Clock();
let time = 0;
addEventListener('keydown', event => {
  if (event.code === 'KeyN') sky.setNight(!sky.night);
});
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;
  city.update(dt, time, sky.night);
  sky.update(camera.position);
  renderer.render(scene, camera);
  window.__shotReady = true;
});
