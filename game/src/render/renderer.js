// The WebGL side: one renderer with ACES tone mapping and soft shadow maps, one scene, the
// chase camera, the window resize, and the day/night switch that the sunset and neon shots use.
import * as THREE from 'three';
import { CAMERA, SUN } from '../config.js';

export const TIME_DAY = 'day';
export const TIME_NIGHT = 'night';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    // Keep the colour buffer readable after a frame: a headless capture (and the entry's own
    // screenshots) reads the canvas long after the paint, when a browser would normally clear it.
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(SUN.fogColor, SUN.fogNear, SUN.fogFar);

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, CAMERA.near, CAMERA.far);
  camera.position.set(-300, 12, 60);

  // The sun: one directional light with a shadow box that follows the player, plus a soft sky
  // fill from above and a warm bounce from the ground.
  const sunLight = new THREE.DirectionalLight(SUN.color, SUN.intensity);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(SUN.shadowMap, SUN.shadowMap);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = SUN.distance * 2;
  sunLight.shadow.camera.left = -SUN.shadowSize;
  sunLight.shadow.camera.right = SUN.shadowSize;
  sunLight.shadow.camera.top = SUN.shadowSize;
  sunLight.shadow.camera.bottom = -SUN.shadowSize;
  sunLight.shadow.bias = -0.0006;
  sunLight.shadow.normalBias = 0.045;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const skyFill = new THREE.HemisphereLight(0xbfd6ff, 0xd8b48a, 0.55);
  scene.add(skyFill);

  const rim = new THREE.DirectionalLight(0xffd2a0, 0.45);
  rim.position.set(180, 60, -140);
  scene.add(rim);

  const state = { time: TIME_DAY, sunLight, skyFill, rim };

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /** Slide the shadow box to sit around whatever the player is looking at, along the real sun. */
  function focusShadows(x, z) {
    const dir = state.sunDir ?? { x: -0.9, y: 0.2, z: -0.3 };
    sunLight.position.set(x + dir.x * SUN.distance, Math.max(40, dir.y * SUN.distance), z + dir.z * SUN.distance);
    sunLight.target.position.set(x, 0, z);
    sunLight.target.updateMatrixWorld();
  }

  function draw() {
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, sunLight, state, resize, draw, focusShadows };
}
