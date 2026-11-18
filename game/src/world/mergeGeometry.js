// A tiny geometry merger, written here because three's addons are off limits. Everything the city
// reuses many times (palm trunks, fronds, container stacks) is baked into one buffer per material,
// which keeps a whole avenue of palms down to a couple of draw calls.
import * as THREE from 'three';
/**
* Merge `parts` ({ geometry, matrix } pairs) into one non-indexed BufferGeometry carrying
* position, normal and uv. Vertices are transformed by their matrix first.
*/
export function mergeGeometries(parts) { const position =[];
const normal =[];
const uv =[];
const normalMatrix = new THREE.Matrix3();
const vector = new THREE.Vector3();
const normalVector = new THREE.Vector3();
for (const part of parts) {
  const geometry = part.geometry.index ? part.geometry.toNonIndexed(): part.geometry.clone();
  const matrix = part.matrix ?? new THREE.Matrix4();
  normalMatrix.getNormalMatrix(matrix);
  const pos = geometry.attributes.position;
  const nrm = geometry.attributes.normal;
  const tex = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i += 1) {
    vector.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    position.push(vector.x, vector.y, vector.z);
    if (nrm) {
      normalVector.fromBufferAttribute(nrm, i).applyMatrix3(normalMatrix).normalize();
      normal.push(normalVector.x, normalVector.y, normalVector.z);
    }
    else {
      normal.push(0, 1, 0);
    }
    if (tex) uv.push(tex.getX(i), tex.getY(i));
    else uv.push(0, 0);
  }
  geometry.dispose();
}
const merged = new THREE.BufferGeometry();
merged.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
merged.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
merged.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
merged.computeBoundingSphere();
return merged;
}
