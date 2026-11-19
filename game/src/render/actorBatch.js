// Moving actor parts remain articulated while shared meshes render as GPU instances.
import * as THREE from '../../vendor/three.module.min.js';

export function createActorBatch(scene) {
  const groups = new Map();

  function add(root) {
    root.traverse(mesh => {
      if (!mesh.isMesh) return;
      const key = `${mesh.geometry.uuid}/${mesh.material.uuid}`;
      let group = groups.get(key);
      if (!group) {
        group = { geometry: mesh.geometry, material: mesh.material, sources: [], batch: null };
        groups.set(key, group);
      }
      group.sources.push(mesh);
      mesh.layers.set(1);
      if (group.batch) {
        scene.remove(group.batch);
        group.batch.dispose();
        group.batch = null;
      }
    });
  }
  function update(focus) {
    scene.updateMatrixWorld(true);
    for (const group of groups.values()) {
      if (!group.batch) {
        group.batch = new THREE.InstancedMesh(group.geometry, group.material, group.sources.length);
        group.batch.castShadow = true;
        group.batch.receiveShadow = true;
        group.batch.frustumCulled = false;
        group.batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(group.batch);
      }
      let count = 0;
      group.sources.forEach(mesh => {
        let visible = true;
        let parent = mesh;
        while (parent && parent !== scene) {
          if (!parent.visible) visible = false;
          parent = parent.parent;
        }
        const elements = mesh.matrixWorld.elements;
        const near = (elements[12] - focus.x) ** 2 + (elements[14] - focus.z) ** 2 < 105 ** 2;
        if (visible && near) group.batch.setMatrixAt(count++, mesh.matrixWorld);
      });
      group.batch.count = count;
      group.batch.instanceMatrix.needsUpdate = true;
    }
  }
  return { add, update };
}
