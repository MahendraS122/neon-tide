// Procedural tapered coachwork meshes give each original car its silhouette.
import * as THREE from 'three';
// Bevelled side profiles, extruded across the axle. The actual wheel wells are holes
// cut out of the lower silhouette, rather than dark boxes pasted onto a slab.
export function coachwork(width, length, height, material) { const s = new THREE.Shape();
const rear = - length / 2, front = length / 2, axle = length * .31;
s.moveTo(rear + .18, 0);
s.lineTo(rear, .34);
s.lineTo(rear + .08, height - .18);
s.lineTo(rear + .42, height);
s.lineTo(front - .75, height);
s.lineTo(front - .12, height - .16);
s.lineTo(front, .38);
s.lineTo(axle + .46, .13);
s.absarc(axle, .13, .46, 0, Math.PI, false);
s.lineTo(- axle + .46, .13);
s.absarc(- axle, .13, .46, 0, Math.PI, false);
s.lineTo(rear + .18, 0);
s.closePath();
const geo = new THREE.ExtrudeGeometry(s, {
  depth: width - .14, bevelEnabled: true, bevelThickness: .07, bevelSize: .065, bevelSegments: 3,
  steps: 1, curveSegments: 12
});
// Profile x is longitudinal, extrusion z is transverse.
geo.rotateY(- Math.PI / 2);
geo.translate((width - .14) / 2, 0, 0);
const mesh = new THREE.Mesh(geo, material);
mesh.castShadow = true;
mesh.receiveShadow = true;
return mesh;
} export function taperedCabin(width, bottomY, topY, back, front, material, taper = .76) { const bottom =
[[- width / 2, bottomY, back],[width / 2, bottomY, back],[width / 2, bottomY, front],[- width / 2,
bottomY, front]];
const top =[[- width * taper / 2, topY, back + .38],[width * taper / 2, topY, back + .38],[width * taper / 2,
topY, front - .55],[- width * taper / 2, topY, front - .55]];
const verts =[...bottom, ...top].flat(), indices =[0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5,
0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
geo.setIndex(indices);
geo.computeVertexNormals();
return new THREE.Mesh(geo, material);
} export function labelTexture(text, color = '#142438', background = '#f4f4ed') { const c = document.createElement('canvas');
c.width = 256;
c.height = 96;
const ctx = c.getContext('2d');
ctx.fillStyle = background;
ctx.fillRect(0, 0, 256, 96);
ctx.fillStyle = color;
ctx.font = 'italic bold 66px Arial';
ctx.textAlign = 'center';
ctx.fillText(text, 128, 72);
const t = new THREE.CanvasTexture(c);
t.colorSpace = THREE.SRGBColorSpace;
return t;
}
