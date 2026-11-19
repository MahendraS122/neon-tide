// A procedural atmospheric dome and a moving local shadow volume.
import * as THREE from '../../vendor/three.module.min.js';

export function createSky(scene) {
  const uniforms = {
    topColor: { value: new THREE.Color('#548cb1') },
    horizonColor: { value: new THREE.Color('#ffcba0') },
    sunDirection: { value: new THREE.Vector3(-0.7, 0.18, -0.5).normalize() },
    night: { value: 0 }
  };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 direction;
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 sunDirection;
      uniform float night;
      void main() {
        vec3 ray = normalize(direction);
        float altitude = pow(max(ray.y, 0.0), 0.55);
        vec3 color = mix(horizonColor, topColor, altitude);
        float facing = dot(ray, sunDirection);
        color += vec3(1.0, 0.48, 0.16) * pow(max(facing, 0.0), 20.0) * (1.0 - night);
        color += vec3(3.0, 2.0, 0.9) * smoothstep(0.9992, 0.9996, facing) * (1.0 - night);
        float stars = step(0.998, fract(sin(dot(floor(ray * 700.0), vec3(13.1, 71.7, 32.2)))
          * 43758.5)) * night * smoothstep(0.0, 0.4, ray.y);
        gl_FragColor = vec4(color + stars * 0.55, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), material);
  scene.add(dome);
  const ambient = new THREE.HemisphereLight('#c9edff', '#b37a56', 2.1);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffd4a0', 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  scene.add(sun, sun.target);
  let isNight = false;
  function setNight(value) {
    isNight = value;
    uniforms.night.value = value ? 1 : 0;
    uniforms.topColor.value.set(value ? '#070d27' : '#548cb1');
    uniforms.horizonColor.value.set(value ? '#242449' : '#ffcba0');
    ambient.intensity = value ? 0.55 : 2.1;
    sun.intensity = value ? 0.6 : 3.5;
    sun.color.set(value ? '#829acb' : '#ffd4a0');
    scene.fog = new THREE.FogExp2(value ? '#172039' : '#e6bca0', value ? 0.0037 : 0.0022);
  }
  function update(position) {
    dome.position.copy(position);
    sun.target.position.copy(position);
    sun.position.copy(position).addScaledVector(uniforms.sunDirection.value, 180);
  }
  setNight(false);
  return { update, setNight, get night() { return isNight; } };
}
