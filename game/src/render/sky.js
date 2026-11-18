// The sky is a large inverted sphere painted with a vertical gradient shader, a bright sun disc
// with a bloom halo placed where the directional light is, and a thin haze band at the horizon.
// setTime swaps the whole palette (and the fog and the lights) between golden hour and night.
import * as THREE from 'three';
import { SKY, SUN, CAMERA } from '../config.js';

const VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
varying vec3 vDir;
uniform vec3 zenith;
uniform vec3 upper;
uniform vec3 horizon;
uniform vec3 glow;
uniform vec3 sunColor;
uniform vec3 sunDir;
uniform float discSize;

void main() {
  vec3 dir = normalize(vDir);
  float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

  // Three-stop vertical gradient: warm at the horizon, deep blue overhead.
  vec3 col = mix(horizon, upper, smoothstep(0.48, 0.70, h));
  col = mix(col, zenith, smoothstep(0.66, 1.0, h));

  // Broad warm glow around the sun, strongest along the horizon it sits on.
  float sunDot = max(dot(dir, normalize(sunDir)), 0.0);
  float glowAmount = pow(sunDot, 5.0) * 0.85 + pow(sunDot, 32.0) * 0.9;
  col += glow * glowAmount * 0.75;

  // The disc itself: a hard bright circle with a soft rim.
  float disc = smoothstep(discSize, discSize + 0.0016, sunDot);
  col = mix(col, sunColor * 2.4, disc);
  col += sunColor * pow(sunDot, 900.0) * 1.5;

  // Haze: the last few degrees above the horizon wash out toward the fog colour.
  col = mix(col, horizon, smoothstep(0.5, 0.44, h) * 0.85);

  gl_FragColor = vec4(col, 1.0);
}
`;

const DAY = {
  zenith: new THREE.Color(SKY.zenith),
  upper: new THREE.Color(SKY.upper),
  horizon: new THREE.Color(SKY.horizon),
  glow: new THREE.Color(SKY.glow),
  sun: new THREE.Color(SKY.sunDisc),
  fog: new THREE.Color(SUN.fogColor),
  fogNear: SUN.fogNear,
  fogFar: SUN.fogFar,
  sunColor: new THREE.Color(SUN.color),
  sunIntensity: SUN.intensity,
  hemiSky: new THREE.Color(0xcfe0ff),
  hemiGround: new THREE.Color(0xd9b489),
  hemiIntensity: 0.6,
  rimColor: new THREE.Color(0xffd2a0),
  rimIntensity: 0.5,
  exposure: 1.05,
  discSize: 0.99895,
  sunElevation: SUN.elevation,
};

/** Night: a purple sky over a city that is lit by its own sodium and neon. */
const NIGHT = {
  zenith: new THREE.Color(0x050a1c),
  upper: new THREE.Color(0x101a3a),
  horizon: new THREE.Color(0x3c2a54),
  glow: new THREE.Color(0x8a5a9a),
  sun: new THREE.Color(0xbcd0ff),
  fog: new THREE.Color(0x151a2c),
  fogNear: 90,
  fogFar: 480,
  sunColor: new THREE.Color(0x93a9e0),
  sunIntensity: 0.55,
  hemiSky: new THREE.Color(0x2a3a66),
  hemiGround: new THREE.Color(0x2a1e2e),
  hemiIntensity: 0.72,
  rimColor: new THREE.Color(0x5f7fd0),
  rimIntensity: 0.35,
  exposure: 1.42,
  discSize: 0.9985,
  sunElevation: -14,
};

function sunVector(elevationDeg, azimuthDeg, distance) {
  const el = (elevationDeg * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(el) * Math.cos(az) * distance,
    Math.sin(el) * distance,
    Math.cos(el) * Math.sin(az) * distance,
  );
}

export function createSky(view) {
  const sunDir = sunVector(DAY.sunElevation, SUN.azimuth, 1).normalize();

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      zenith: { value: DAY.zenith.clone() },
      upper: { value: DAY.upper.clone() },
      horizon: { value: DAY.horizon.clone() },
      glow: { value: DAY.glow.clone() },
      sunColor: { value: DAY.sun.clone() },
      sunDir: { value: sunDir.clone() },
      discSize: { value: DAY.discSize },
    },
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: true,
  });

  const dome = new THREE.Mesh(new THREE.SphereGeometry(CAMERA.far * 0.9, 40, 24), material);
  dome.frustumCulled = false;
  dome.renderOrder = -10;
  view.scene.add(dome);

  // Distant sea haze: a big flat quad low on the horizon behind the water, so the ocean fades
  // into the sky rather than ending on a hard line.
  const hazeMaterial = new THREE.MeshBasicMaterial({
    color: DAY.fog, transparent: true, opacity: 0.55, depthWrite: false, fog: false,
  });
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(4000, 260), hazeMaterial);
  haze.position.set(-900, 60, 0);
  haze.rotation.y = Math.PI / 2;
  haze.renderOrder = -5;
  view.scene.add(haze);

  const state = { time: 'day', sunDir: sunDir.clone() };

  function apply(preset, elevation) {
    const u = material.uniforms;
    u.zenith.value.copy(preset.zenith);
    u.upper.value.copy(preset.upper);
    u.horizon.value.copy(preset.horizon);
    u.glow.value.copy(preset.glow);
    u.sunColor.value.copy(preset.sun);
    u.discSize.value = preset.discSize;
    state.sunDir.copy(sunVector(elevation, SUN.azimuth, 1).normalize());
    u.sunDir.value.copy(state.sunDir);
    hazeMaterial.color.copy(preset.fog);

    view.scene.fog.color.copy(preset.fog);
    view.scene.fog.near = preset.fogNear;
    view.scene.fog.far = preset.fogFar;
    view.renderer.toneMappingExposure = preset.exposure;

    view.sunLight.color.copy(preset.sunColor);
    view.sunLight.intensity = preset.sunIntensity;
    view.state.skyFill.color.copy(preset.hemiSky);
    view.state.skyFill.groundColor.copy(preset.hemiGround);
    view.state.skyFill.intensity = preset.hemiIntensity;
    view.state.rim.color.copy(preset.rimColor);
    view.state.rim.intensity = preset.rimIntensity;
    view.renderer.shadowMap.needsUpdate = true;
  }

  /** Keeps the dome (and the haze) centred on the camera, so they never run out. */
  function update(camera) {
    dome.position.copy(camera.position);
    view.state.sunDir = state.sunDir;
    haze.position.set(camera.position.x - 900, camera.position.y + 40, camera.position.z);
  }

  function setTime(time) {
    state.time = time === 'night' ? 'night' : 'day';
    if (state.time === 'night') apply(NIGHT, NIGHT.sunElevation);
    else apply(DAY, DAY.sunElevation);
  }

  /** Where the sun is, for the directional light and for glints on the water. */
  function sunDirection() {
    return state.sunDir;
  }

  setTime('day');

  return { dome, setTime, update, sunDirection, state };
}
