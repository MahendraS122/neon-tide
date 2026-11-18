// Street furniture, built from primitives and shared materials: palms with drooping frond cards,
// lit street lamps, benches, hydrants, bollards, traffic lights, the pier's planks and railing,
// the Ferris wheel and the port's cranes and container stacks. Everything is instanced or cloned
// from one prototype so a whole avenue of palms costs a handful of draw calls.
import * as THREE from 'three';
import {
  PALETTE
}
from '../config.js';
import {
  surfaceTexture, glowTexture
}
from '../render/textures.js';
import {
  createDice
}
from '../random.js';
const up = new THREE.Vector3 (0, 1, 0);
export function createPropsKit () {
  const trunkMaterial = new THREE.MeshStandardMaterial ({
    color : 0x8a7358, roughness : 0.95
  }
  );
  const frondMaterial = new THREE.MeshStandardMaterial ({
    color : 0x3f7a3a, roughness : 0.9, side : THREE.DoubleSide,
  }
  );
  const frondDark = new THREE.MeshStandardMaterial ({
    color : 0x2c5c34, roughness : 0.9, side : THREE.DoubleSide,
  }
  );
  const poleMaterial = new THREE.MeshStandardMaterial ({
    color : 0x6f7478, roughness : 0.6, metalness : 0.4
  }
  );
  const lampMaterial = new THREE.MeshBasicMaterial ({
    color : 0xffe3ad
  }
  );
  const woodMaterial = new THREE.MeshStandardMaterial ({
    map : surfaceTexture ('#a8814f', 'plank', {
      seams : true
    }
    ), roughness : 0.88,
  }
  );
  const concreteMaterial = new THREE.MeshStandardMaterial ({
    map : surfaceTexture ('#b6ae9f', 'concrete', {
      seams : true
    }
    ), roughness : 0.92,
  }
  );
  const redMaterial = new THREE.MeshStandardMaterial ({
    color : 0xc23a3a, roughness : 0.5
  }
  );
  const glassLamp = new THREE.MeshBasicMaterial ({
    color : 0xffd9a0
  }
  );
  /** One palm: a leaning tapered trunk and a crown of fronds, returned as a Group. */
  function palm (seed) {
    const rand = createDice (seed);
    const group = new THREE.Group ();
    const height = rand.range (7.5, 12.5);
    const lean = rand.range (0.6, 2.2);
    const leanDir = rand.range (0, Math.PI * 2);
    const segments = 5;
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < segments; i += 1) {
      const t = i / segments;
      const segH = height / segments;
      const r0 = 0.34 * (1 - t * 0.6);
      const r1 = 0.34 * (1 - (t + 1 / segments) * 0.6);
      const seg = new THREE.Mesh (new THREE.CylinderGeometry (r1, r0, segH, 7, 1), trunkMaterial);
      const bend = lean * (t + 0.5 / segments) * 0.28;
      seg.position.set (x + Math.cos (leanDir) * bend, y + segH / 2, z + Math.sin (leanDir) * bend,
      );
      seg.castShadow = true;
      group.add (seg);
      x += Math.cos (leanDir) * bend;
      z += Math.sin (leanDir) * bend;
      y += segH;
    }
    const crownY = y;
    // Fronds: flat tapered cards angled down and out, plus a couple standing up.
    const fronds = 11;
    for (let i = 0; i < fronds; i += 1) {
      const angle = (i / fronds) * Math.PI * 2 + rand.jitter (0.2);
      const len = rand.range (3.1, 4.6);
      const droop = rand.range (0.5, 1.15);
      const shape = new THREE.Shape ();
      shape.moveTo (0, 0);
      shape.quadraticCurveTo (len * 0.5, 0.55, len, - 0.2);
      shape.quadraticCurveTo (len * 0.52, 0.06, 0, - 0.34);
      const geo = new THREE.ShapeGeometry (shape, 8);
      const frond = new THREE.Mesh (geo, i % 2 ? frondMaterial : frondDark);
      frond.position.set (x, crownY, z);
      frond.rotation.set (- droop, 0, 0);
      frond.rotateOnWorldAxis (up, - angle);
      frond.castShadow = true;
      group.add (frond);
    }
    // A little cluster of coconuts.
    for (let i = 0; i < 3; i += 1) {
      const nut = new THREE.Mesh (new THREE.SphereGeometry (0.16, 6, 5), frondDark);
      nut.position.set (x + rand.jitter (0.3), crownY - 0.2, z + rand.jitter (0.3));
      group.add (nut);
    }
    return group;
  }
  /** A street lamp with a curved arm and a glowing head, and a warm pool at its foot. */
  function streetLamp () {
    const group = new THREE.Group ();
    const pole = new THREE.Mesh (new THREE.CylinderGeometry (0.09, 0.13, 6.4, 8), poleMaterial);
    pole.position.y = 3.2;
    pole.castShadow = true;
    group.add (pole);
    const arm = new THREE.Mesh (new THREE.CylinderGeometry (0.07, 0.07, 1.7, 6), poleMaterial);
    arm.position.set (0.8, 6.3, 0);
    arm.rotation.z = Math.PI / 2.3;
    group.add (arm);
    const head = new THREE.Mesh (new THREE.BoxGeometry (0.7, 0.18, 0.36), poleMaterial);
    head.position.set (1.55, 6.55, 0);
    group.add (head);
    const bulb = new THREE.Mesh (new THREE.BoxGeometry (0.56, 0.08, 0.26), glassLamp);
    bulb.position.set (1.55, 6.45, 0);
    group.add (bulb);
    return group;
  }
  function bench () {
    const group = new THREE.Group ();
    const seat = new THREE.Mesh (new THREE.BoxGeometry (2, 0.1, 0.6), woodMaterial);
    seat.position.y = 0.45;
    seat.castShadow = true;
    group.add (seat);
    const back = new THREE.Mesh (new THREE.BoxGeometry (2, 0.5, 0.08), woodMaterial);
    back.position.set (0, 0.72, - 0.26);
    back.rotation.x = - 0.12;
    group.add (back);
    for (const side of [- 0.82, 0.82]) {
      const leg = new THREE.Mesh (new THREE.BoxGeometry (0.08, 0.45, 0.5), concreteMaterial);
      leg.position.set (side, 0.22, 0);
      group.add (leg);
    }
    return group;
  }
  function hydrant () {
    const group = new THREE.Group ();
    const body = new THREE.Mesh (new THREE.CylinderGeometry (0.15, 0.18, 0.7, 8), redMaterial);
    body.position.y = 0.35;
    group.add (body);
    const cap = new THREE.Mesh (new THREE.SphereGeometry (0.16, 8, 6), redMaterial);
    cap.position.y = 0.72;
    group.add (cap);
    return group;
  }
  function bollard () {
    const mesh = new THREE.Mesh (new THREE.CylinderGeometry (0.11, 0.13, 0.9, 8), poleMaterial);
    mesh.position.y = 0.45;
    mesh.castShadow = true;
    return mesh;
  }
  /** A pole traffic light: black box, three lenses, the red one lit. */
  function trafficLight () {
    const group = new THREE.Group ();
    const pole = new THREE.Mesh (new THREE.CylinderGeometry (0.1, 0.12, 5.2, 8), poleMaterial);
    pole.position.y = 2.6;
    pole.castShadow = true;
    group.add (pole);
    const box = new THREE.Mesh (new THREE.BoxGeometry (0.42, 1.15, 0.34), new THREE.MeshStandardMaterial ({
      color : 0x22252a, roughness : 0.7
    }
    ));
    box.position.set (0, 4.9, 0.2);
    group.add (box);
    const lenses = [0xff3b30, 0xffb020, 0x35d060];
    lenses.forEach ((colour, i) => {
      const lens = new THREE.Mesh (new THREE.CircleGeometry (0.11, 10), new THREE.MeshBasicMaterial ({
        color : colour, transparent : true, opacity : i === 0 ? 1 : 0.18
      }
      ),); lens.position.set (0, 5.28 - i * 0.34, 0.38); group.add (lens);
    }
    );
    return group;
  }
  /** A tall container-crane silhouette for the port skyline. */
  function crane (seed) {
    const rand = createDice (seed);
    const group = new THREE.Group ();
    const height = rand.range (26, 34);
    const steel = new THREE.MeshStandardMaterial ({
      color : 0xd8552f, roughness : 0.7, metalness : 0.3
    }
    );
    steel.color.set (rand.pick ([0xd8552f, 0x2f7bd8, 0xd8a72f, 0x3aa85e]));
    for (const dx of [- 2.4, 2.4]) {
      for (const dz of [- 2.4, 2.4]) {
        const leg = new THREE.Mesh (new THREE.BoxGeometry (0.6, height, 0.6), steel);
        leg.position.set (dx, height / 2, dz);
        leg.castShadow = true;
        group.add (leg);
      }
    }
    const beam = new THREE.Mesh (new THREE.BoxGeometry (30, 1.4, 2.6), steel);
    beam.position.set (4, height + 0.7, 0);
    beam.castShadow = true;
    group.add (beam);
    const cab = new THREE.Mesh (new THREE.BoxGeometry (4, 3, 3.4), new THREE.MeshStandardMaterial ({
      color : 0xe6e2d8, roughness : 0.6
    }
    ));
    cab.position.set (1.5, height - 1.2, 0);
    group.add (cab);
    const cable = new THREE.Mesh (new THREE.BoxGeometry (0.12, 9, 0.12), poleMaterial);
    cable.position.set (15, height - 4, 0);
    group.add (cable);
    return group;
  }
  return {
    palm, streetLamp, bench, hydrant, bollard, trafficLight, crane, materials : {
      trunkMaterial, frondMaterial, poleMaterial, woodMaterial, concreteMaterial, lampMaterial
    }
    ,
  }
  ;
}
/**
* The pier: a plank deck running out over the water with a railing down each side and lamp posts,
* and the Ferris wheel at the far end. Returns the wheel so the game can spin it.
*/
export function buildPier (scene, props, options) {
  const {
    x, z, length, width, deckY
  }
  = options;
  const group = new THREE.Group ();
  const deck = new THREE.Mesh (new THREE.BoxGeometry (length, 0.7, width), props.materials.woodMaterial);
  deck.position.set (0, - 0.35, 0);
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add (deck);
  // Pylons under the deck.
  for (let i = 0; i < length; i += 14) {
    for (const side of [- 1, 1]) {
      const pylon = new THREE.Mesh (new THREE.CylinderGeometry (0.4, 0.4, 9, 8), props.materials.concreteMaterial);
      pylon.position.set (- length / 2 + i, - 5, side * (width / 2 - 1.4));
      group.add (pylon);
    }
  }
  // Railing and lamps.
  for (let i = 0; i < length; i += 3.2) {
    for (const side of [- 1, 1]) {
      const post = new THREE.Mesh (new THREE.CylinderGeometry (0.055, 0.055, 1.05, 6), props.materials.poleMaterial);
      post.position.set (- length / 2 + i, 0.55, side * (width / 2 - 0.4));
      group.add (post);
    }
  }
  for (const side of [- 1, 1]) {
    const rail = new THREE.Mesh (new THREE.BoxGeometry (length, 0.09, 0.09), props.materials.poleMaterial);
    rail.position.set (0, 1.05, side * (width / 2 - 0.4));
    group.add (rail);
  }
  for (let i = 10; i < length - 6; i += 22) {
    for (const side of [- 1, 1]) {
      const lamp = props.streetLamp ();
      lamp.position.set (- length / 2 + i, 0, side * (width / 2 - 1.2));
      if (side < 0) lamp.rotation.y = Math.PI;
      group.add (lamp);
    }
  }
  group.position.set (x, deckY, z);
  scene.add (group);
  // The Ferris wheel at the end of the pier: a rim of spokes, spokes to a hub, gondolas.
  const wheel = new THREE.Group ();
  const radius = 16;
  const rimMaterial = new THREE.MeshStandardMaterial ({
    color : 0xf1f1f6, roughness : 0.4, metalness : 0.4
  }
  );
  const rimA = new THREE.Mesh (new THREE.TorusGeometry (radius, 0.32, 8, 44), rimMaterial);
  const rimB = rimA.clone ();
  rimA.position.z = 1.6;
  rimB.position.z = - 1.6;
  wheel.add (rimA, rimB);
  const spokeCount = 16;
  for (let i = 0; i < spokeCount; i += 1) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spoke = new THREE.Mesh (new THREE.BoxGeometry (radius, 0.16, 0.16), rimMaterial);
    spoke.position.set (Math.cos (angle) * radius / 2, Math.sin (angle) * radius / 2, 0);
    spoke.rotation.z = angle;
    wheel.add (spoke);
  }
  const hub = new THREE.Mesh (new THREE.CylinderGeometry (1.4, 1.4, 4.2, 12), rimMaterial);
  hub.rotation.x = Math.PI / 2;
  wheel.add (hub);
  const gondolaColors = [0xff5b7f, 0x25e6d0, 0xffd166, 0x8f6bff, 0xff8a3d, 0x6bff8f];
  for (let i = 0; i < spokeCount; i += 1) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const gondola = new THREE.Mesh (new THREE.BoxGeometry (1.5, 1.3, 1.1), new THREE.MeshStandardMaterial ({
      color : gondolaColors [i % gondolaColors.length], roughness : 0.5, emissive : new THREE.Color (gondolaColors [i % gondolaColors.length]),
      emissiveIntensity : 0.18
    }
    ),);
    gondola.position.set (Math.cos (angle) * (radius - 1.1), Math.sin (angle) * (radius - 1.1),
    0);
    gondola.castShadow = true;
    wheel.add (gondola);
  }
  // Support legs: two A-frames.
  for (const side of [- 1, 1]) {
    for (const lean of [- 1, 1]) {
      const leg = new THREE.Mesh (new THREE.BoxGeometry (1.1, radius + 2, 1.1), rimMaterial);
      leg.position.set (0, - radius / 2, side * 3.4 + lean * 1.5);
      leg.rotation.x = lean * 0.22;
      wheel.add (leg);
    }
  }
  wheel.position.set (x - length / 2 - 8, deckY + radius + 2, z);
  scene.add (wheel);
  return {
    group, wheel
  }
  ;
}
