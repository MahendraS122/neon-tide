// A rippling coastal sheet uses a compact shader and rolling surf ribbons.
import * as THREE from '../../vendor/three.module.min.js';

export function createOcean(parent) {
  const uniforms = { time: { value: 0 }, night: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: `
      uniform float time;
      varying vec3 world;
      void main() {
        vec3 p = position;
        p.z += sin(p.x * 0.09 + time) * 0.16 + cos(p.y * 0.07 + time * 0.8) * 0.18;
        world = (modelMatrix * vec4(p, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float night;
      varying vec3 world;
      void main() {
        float ripple = sin(world.x * 0.4 + world.z * 0.17 + time * 1.8);
        float fine = sin(world.z * 1.9 - time * 2.0 + sin(world.x * 0.8));
        float foam = smoothstep(0.83, 1.0, sin(world.x * 0.9 + time * 1.4));
        foam *= 1.0 - smoothstep(145.0, 160.0, world.x);
        vec3 color = mix(vec3(0.06, 0.4, 0.47), vec3(0.25, 0.66, 0.66), ripple * 0.3 + 0.4);
        color += vec3(0.8, 0.65, 0.36) * pow(max(fine * ripple, 0.0), 12.0) * 0.55;
        color = mix(color, vec3(0.85, 0.89, 0.78), foam * 0.7);
        vec3 view = normalize(world - cameraPosition);
        float facing = max(0.0, dot(view.xz, vec2(0.56, -0.83)) + ripple * 0.018);
        float glare = pow(min(facing, 1.0), 32.0) * (1.0 - night);
        glare *= 0.35 + smoothstep(0.35, 0.9, fine) * 0.65;
        color += glare * vec3(0.88, 0.37, 0.16);
        color *= 1.0 - night * 0.7;
        gl_FragColor = vec4(color, 0.96);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1800, 90, 90), material);
  water.rotation.x = -Math.PI / 2;
  water.position.set(695, -0.12, 0);
  parent.add(water);
  const harbor = new THREE.Mesh(new THREE.PlaneGeometry(520, 500, 36, 36), material);
  harbor.rotation.x = -Math.PI / 2;
  harbor.position.set(-116, -0.12, 525);
  parent.add(harbor);
  return { update(time, night) {
    uniforms.time.value = time;
    uniforms.night.value = night ? 1 : 0;
  } };
}
