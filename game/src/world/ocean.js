// The sea west of the beach: one large plane whose vertex shader rolls a few swells, shaded with
// a hand-written fragment shader so it can hold a sun glitter path that follows the light, a
// turquoise band near the shore and a hazy far edge that meets the sky.
import * as THREE from 'three';
import { CITY, SKY, SUN } from '../config.js';

const VERT = `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vHeight;
varying float vCrest;

float swell(vec2 p, vec2 dir, float freq, float speed, float amp) {
  return sin(dot(p, dir) * freq + uTime * speed) * amp;
}

void main() {
  vec3 p = position;
  vec2 w = p.xy;
  float h = 0.0;
  h += swell(w, normalize(vec2(1.0, 0.25)), 0.055, 0.55, 1.5);
  h += swell(w, normalize(vec2(0.7, -0.6)), 0.11, 0.85, 0.85);
  h += swell(w, normalize(vec2(0.25, 1.0)), 0.21, 1.25, 0.35);
  h += swell(w, normalize(vec2(-0.5, 0.4)), 0.42, 1.9, 0.15);
  p.z += h;

  // Analytic-ish normal from the same waves, nudged for a fine chop.
  float e = 0.6;
  float hx = swell(w + vec2(e, 0.0), normalize(vec2(1.0, 0.25)), 0.055, 0.55, 1.5)
           + swell(w + vec2(e, 0.0), normalize(vec2(0.7, -0.6)), 0.11, 0.85, 0.85)
           + swell(w + vec2(e, 0.0), normalize(vec2(0.25, 1.0)), 0.21, 1.25, 0.35);
  float hy = swell(w + vec2(0.0, e), normalize(vec2(1.0, 0.25)), 0.055, 0.55, 1.5)
           + swell(w + vec2(0.0, e), normalize(vec2(0.7, -0.6)), 0.11, 0.85, 0.85)
           + swell(w + vec2(0.0, e), normalize(vec2(0.25, 1.0)), 0.21, 1.25, 0.35);
  vec3 n = normalize(vec3((h - hx) / e, (h - hy) / e, 1.0));

  vHeight = h;
  vCrest = clamp(h * 0.34 + 0.5, 0.0, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * n);
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAG = `
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uNight;
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vHeight;
varying float vCrest;

void main() {
  vec3 n = normalize(vNormalW);
  vec3 viewDir = normalize(cameraPosition - vWorld);

  // Depth-ish colour: turquoise over the sand shelf, deep blue further out.
  float distOut = clamp((-vWorld.x - 420.0) / 260.0, 0.0, 1.0);
  vec3 base = mix(uShallow, uDeep, smoothstep(0.0, 0.72, distOut));
  base = mix(base, uDeep * 0.72, vCrest * 0.18);

  // Sky reflection off the facet, fresnel-weighted so grazing water is all sky.
  float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  vec3 col = mix(base, uSky, clamp(fres * 0.95 + 0.16, 0.0, 1.0));

  // Specular: a tight sun spike plus a broad sheen, both along the sun's direction.
  vec3 h = normalize(uSunDir + viewDir);
  float spec = pow(max(dot(n, h), 0.0), 220.0) * 3.2 + pow(max(dot(n, h), 0.0), 26.0) * 0.45;
  col += uSunColor * spec;

  // A glitter path: noise-broken sparkle where the sun's reflection runs toward the viewer.
  vec3 toSunFlat = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
  vec3 toViewFlat = normalize(vec3(viewDir.x, 0.0, viewDir.z));
  float path = pow(max(dot(toSunFlat, toViewFlat), 0.0), 12.0);
  float sparkle = smoothstep(0.72, 1.0, sin(vWorld.x * 2.7 + vWorld.z * 3.9 + vHeight * 9.0) * 0.5 + 0.5);
  col += uSunColor * path * sparkle * 0.35 * (1.0 - uNight);

  // Foam where crests break, and a bright wash at the shoreline.
  float shore = smoothstep(-404.0, -430.0, vWorld.x);
  col = mix(col, vec3(0.92, 0.95, 0.92), shore * 0.55);
  col += vec3(0.9, 0.95, 0.92) * smoothstep(0.86, 0.98, vCrest) * 0.16;

  // Distance fog to the sky's own horizon colour.
  float dist = length(cameraPosition - vWorld);
  float fog = smoothstep(uFogNear, uFogFar, dist);
  col = mix(col, uFogColor, fog);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createOcean(scene, sky) {
  const size = 2400;
  const geometry = new THREE.PlaneGeometry(size, size, 190, 190);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x123f5e) },
      uShallow: { value: new THREE.Color(0x2e93a4) },
      uSky: { value: new THREE.Color(SKY.horizon) },
      uSunColor: { value: new THREE.Color(SUN.color) },
      uSunDir: { value: new THREE.Vector3(-0.4, 0.2, -0.3).normalize() },
      uFogColor: { value: new THREE.Color(SUN.fogColor) },
      uFogNear: { value: 260 },
      uFogFar: { value: 1100 },
      uNight: { value: 0 },
    },
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  // Rotate so the plane lies flat and its local +Y runs along world -X (out to sea).
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(CITY.waterX - size / 2 + 30, -0.55, 0);
  mesh.receiveShadow = false;
  scene.add(mesh);

  const state = { time: 0 };

  function update(dt, camera) {
    state.time += dt;
    material.uniforms.uTime.value = state.time;
    // Keep the plane under the camera so it never ends.
    mesh.position.z = Math.round(camera.position.z / 40) * 40;
    const sun = sky.sunDirection();
    material.uniforms.uSunDir.value.copy(sun);
    material.uniforms.uNight.value = sky.state.time === 'night' ? 1 : 0;
    if (sky.state.time === 'night') {
      material.uniforms.uDeep.value.setHex(0x08182c);
      material.uniforms.uShallow.value.setHex(0x0f3148);
      material.uniforms.uSky.value.setHex(0x1a2340);
      material.uniforms.uSunColor.value.setHex(0x7d95c9);
      material.uniforms.uFogColor.value.setHex(0x151a2c);
    } else {
      material.uniforms.uDeep.value.setHex(0x123f5e);
      material.uniforms.uShallow.value.setHex(0x2e93a4);
      material.uniforms.uSky.value.setHex(SKY.horizon);
      material.uniforms.uSunColor.value.setHex(SUN.color);
      material.uniforms.uFogColor.value.setHex(SUN.fogColor);
    }
  }

  return { mesh, update, material };
}
