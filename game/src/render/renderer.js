// Configure the renderer and keep the viewport independent of simulation state.
import * as THREE from '../../vendor/three.module.min.js';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.15, 1200);
  camera.position.set(8, 5, 12);
  const scene = new THREE.Scene();
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();
  let slowFrames = 0;
  let renderScale = Math.min(devicePixelRatio, 1.5);
  function adaptResolution(dt) {
    slowFrames = dt > 0.045 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames < 24 || renderScale <= 0.75) return;
    renderScale = Math.max(0.75, renderScale - 0.25);
    renderer.setPixelRatio(renderScale);
    slowFrames = 0;
  }
  return { renderer, camera, scene, adaptResolution };
}
