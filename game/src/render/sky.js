// A procedural atmospheric dome and a moving local shadow volume.
import * as THREE from '../../vendor/three.module.min.js';

export function createSky(scene) {
  const uniforms = {
    topColor: { value: new THREE.Color('#655774') },
    horizonColor: { value: new THREE.Color('#f39a7f') },
    sunDirection: { value: new THREE.Vector3(-0.22, 0.055, -0.974).normalize() },
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
        color += vec3(3.0, 2.0, 0.9) * smoothstep(0.9982, 0.9985, facing) * (1.0 - night);
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
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(12, 24, 16), new THREE.MeshBasicMaterial({
    color: '#ffbd87', toneMapped: false
  }));
  const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(19, 24, 16), new THREE.MeshBasicMaterial({
    color: '#ff8d72', transparent: true, opacity: 0.19, toneMapped: false
  }));
  scene.add(sunDisc, sunGlow);
  const ambient = new THREE.HemisphereLight('#c9d7e8', '#a06452', 1.35);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffbc8d', 2.7);
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
    uniforms.topColor.value.set(value ? '#070d27' : '#655774');
    uniforms.horizonColor.value.set(value ? '#242449' : '#f39a7f');
    ambient.intensity = value ? 1.03 : 1.35;
    sun.intensity = value ? 0.77 : 2.7;
    sun.color.set(value ? '#829acb' : '#ffbc8d');
    scene.fog = new THREE.FogExp2(value ? '#172039' : '#e6bca0', value ? 0.0037 : 0.0022);
  }
  function update(position, coastal = false) {
    const direction = uniforms.sunDirection.value;
    if (coastal) direction.set(0.56, 0.035, -0.83).normalize();
    else direction.set(-0.22, 0.055, -0.974).normalize();
    dome.position.copy(position);
    const discPosition = position.clone().addScaledVector(direction, 560);
    sunDisc.position.copy(discPosition);
    sunGlow.position.copy(discPosition);
    sunDisc.visible = sunGlow.visible = !isNight && !coastal;
    sun.target.position.copy(position);
    if (coastal) sun.position.set(position.x - 95, position.y + 115, position.z + 85);
    else sun.position.copy(position).addScaledVector(direction, 180);
  }
  setNight(false);
  return { update, setNight, get night() { return isNight; } };
}
