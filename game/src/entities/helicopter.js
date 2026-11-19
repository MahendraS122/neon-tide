// At high heat, an SPD helicopter circles the target and tracks it with a searchlight.
import * as THREE from '../../vendor/three.module.min.js';
import { canSee } from './sight.js';

export function createHelicopter(scene, city) {
  const root = new THREE.Group();
  const olive = new THREE.MeshStandardMaterial({ color: '#233849', metalness: 0.55, roughness: 0.32 });
  const pale = new THREE.MeshStandardMaterial({ color: '#ebe6ce', roughness: 0.52 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#36647a', roughness: 0.16, metalness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: '#172330' });
  function part(parent, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  const sphere = new THREE.SphereGeometry(1, 20, 12);
  part(root, sphere, olive, 0, 0, 0).scale.set(1.25, 1.02, 2.36);
  part(root, sphere, glass, 0, 0.18, 1.25).scale.set(1.15, 0.82, 1.49);
  part(root, sphere, pale, 0, -0.45, 0.2).scale.set(1.16, 0.4, 2.02);
  const tail = part(root, new THREE.CylinderGeometry(0.12, 0.36, 4.3, 9), olive, 0, 0.27, -3.1);
  tail.rotation.x = -Math.PI / 2 - 0.12;
  part(root, new THREE.BoxGeometry(0.17, 1.55, 0.53), pale, 0, 0.66, -5.1).rotation.x = -0.3;
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.19, 0.71, -5.16);
  root.add(tailRotor);
  part(tailRotor, new THREE.BoxGeometry(0.08, 1.32, 0.13), dark, 0, 0, 0);
  for (const side of [-1, 1]) {
    part(root, new THREE.BoxGeometry(0.12, 0.12, 3.6), dark, side * 1.04, -1.09, 0.1);
    for (const z of [-0.8, 0.9]) {
      part(root, new THREE.BoxGeometry(0.11, 0.64, 0.11), pale, side * 0.92, -0.82, z)
        .rotation.z = side * 0.46;
    }
    const nav = new THREE.MeshBasicMaterial({ color: side > 0 ? '#6dffce' : '#ff333d' });
    part(root, sphere, nav, side * 1.16, 0.1, -0.7).scale.setScalar(0.12);
  }
  const rotor = new THREE.Group();
  rotor.position.y = 1.25;
  root.add(rotor);
  part(root, new THREE.CylinderGeometry(0.12, 0.12, 0.55), pale, 0, 1.02, 0);
  const blur = new THREE.MeshBasicMaterial({ color: '#284050', transparent: true, opacity: 0.18 });
  part(rotor, new THREE.CircleGeometry(4.55, 36), blur, 0, 0, 0).rotation.x = -Math.PI / 2;
  for (const angle of [0, Math.PI / 2]) {
    part(rotor, new THREE.BoxGeometry(8.9, 0.045, 0.2), dark, 0, 0.03, 0).rotation.y = angle;
  }

  // Keep the light, visible beam, and ground spot in sync.
  const light = new THREE.SpotLight('#c6f2ff', 1280, 72, 0.23, 0.72, 1.5);
  const coneMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 coord;
      void main() { coord = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec2 coord;
      void main() { gl_FragColor = vec4(.45, .78, 1., .075 * sin(coord.y * 3.14159)); }`
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.23, 1, 32, 1, true), coneMaterial);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({
    color: '#bcefff', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  spot.rotation.x = -Math.PI / 2;
  scene.add(root, light, light.target, cone, spot);
  const ground = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const beam = new THREE.Vector3();
  const unit = { name: 'AIR 01', status: 'HELI', position: root.position };
  let active = false;

  function pose(position, target, yaw, time) {
    root.position.copy(position);
    root.rotation.y = yaw;
    rotor.rotation.y = time * 27;
    tailRotor.rotation.x = time * 34;
    light.position.copy(position).y -= 0.78;
    ground.set(target.x, 0.09, target.z);
    light.target.position.copy(ground);
    beam.copy(light.position).sub(ground);
    const length = beam.length();
    cone.position.copy(light.position).lerp(ground, 0.5);
    cone.quaternion.setFromUnitVectors(up, beam.normalize());
    cone.scale.setScalar(length);
    spot.position.copy(ground);
    spot.scale.setScalar(length * 0.16);
  }

  function setActive(value) {
    active = value;
    root.visible = light.visible = cone.visible = spot.visible = value;
  }

  function showcaseLight(intensity) {
    light.intensity = 2200 * intensity;
  }

  function update(dt, time, stars, target) {
    if (stars < 3) {
      setActive(false);
      return false;
    }
    const orbit = time * 0.37;
    const desired = target.clone().add(new THREE.Vector3(Math.cos(orbit) * 24, 29, Math.sin(orbit) * 24));
    if (active) desired.lerpVectors(root.position, desired, 1 - Math.exp(-dt * 1.9));
    setActive(true);
    pose(desired, target, -orbit, time);
    return canSee(light.position, target.clone().addScaledVector(up, 1), city.colliders, 65);
  }
  setActive(false);
  return { update, pose, setActive, showcaseLight, unit, get active() { return active; } };
}
