// Shared primitive meshes and static instancing keep the procedural city inexpensive.
import * as THREE from '../../vendor/three.module.min.js';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 10);
const materials = new Map();
const BATCH_CELL_SIZE = 65;

export function surface(color, roughness = 0.8, metalness = 0) {
  const key = `${color}/${roughness}/${metalness}`;
  if (!materials.has(key)) {
    materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }
  return materials.get(key);
}

export function box(parent, x, y, z, width, height, depth, material) {
  const mesh = new THREE.Mesh(boxGeometry, typeof material === 'string' ? surface(material) : material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(parent, x, y, z, radius, height, material) {
  const mesh = new THREE.Mesh(cylinderGeometry, typeof material === 'string' ? surface(material) : material);
  mesh.position.set(x, y, z);
  mesh.scale.set(radius, height, radius);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function beam(parent, start, end, radius, material) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const mesh = cylinder(parent, 0, 0, 0, radius, a.distanceTo(b), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  return mesh;
}

export function batchStatic(root) {
  root.updateMatrixWorld(true);
  const batches = new Map();
  root.traverse(object => {
    if (!object.isMesh) return;
    let parent = object;
    while (parent && parent !== root) {
      if (parent.userData.dynamic) return;
      parent = parent.parent;
    }
    const materialKey = Array.isArray(object.material)
      ? object.material.map(material => material.uuid).join(',')
      : object.material.uuid;
    const cellX = Math.floor(object.matrixWorld.elements[12] / BATCH_CELL_SIZE);
    const cellZ = Math.floor(object.matrixWorld.elements[14] / BATCH_CELL_SIZE);
    const key = `${object.geometry.uuid}/${materialKey}/${cellX}/${cellZ}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 3) continue;
    const batch = new THREE.InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
    batch.castShadow = true;
    batch.receiveShadow = true;
    meshes.forEach((mesh, index) => {
      batch.setMatrixAt(index, mesh.matrixWorld);
      mesh.removeFromParent();
    });
    batch.computeBoundingSphere();
    root.add(batch);
  }
}
