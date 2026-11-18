// Dex Calloway, built from primitives: hips, torso, a jacket, head with hair and a chin shadow,
// arms and legs on pivots so they swing when he walks and tuck when he runs. One function builds
// the rig; `poseFigure` animates it from a phase and a speed, which pedestrians and cops reuse.
import * as THREE from 'three';
const SKIN =[0xe8b48c, 0xc98a5e, 0x8c5a3c, 0xf0c9a4];
const HAIR =[0x2a1d14, 0x120f0c, 0x4a2c14, 0x1a1a1a];
export function createFigure({ shirt = 0x2b3a52, trousers = 0x1d2532, skin = SKIN[0], hair = HAIR[0],
shoes = 0x14161a, jacket = null, cap = null } = { }) {
  const root = new THREE.Group();
  const skinMaterial = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.72 });
  const hairMaterial = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.9 });
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.82 });
  const coatMaterial = jacket === null ? shirtMaterial : new THREE.MeshStandardMaterial({
    color: jacket, roughness: .74
  });
  const trouserMaterial = new THREE.MeshStandardMaterial({ color: trousers, roughness: 0.86 });
  const shoeMaterial = new THREE.MeshStandardMaterial({ color: shoes, roughness: 0.7 });
  const hips = new THREE.Group();
  hips.position.y = 0.92;
  root.add(hips);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.32, 5, 10), shirtMaterial);
  torso.position.y = 0.28;
  torso.scale.set(1, 1, .65);
  torso.castShadow = true;
  hips.add(torso);
  if (jacket !== null) {
    const coat = new THREE.Mesh(new THREE.CapsuleGeometry(.25, .27, 6, 12), coatMaterial);
    coat.position.y = 0.3;
    coat.scale.set(1, 1, .72);
    coat.castShadow = true;
    hips.add(coat);
  }
  const collarMaterial = new THREE.MeshStandardMaterial({ color: 0xe5d4bd, roughness: .72 });
  for (const side of [-1, 1]) {
    const collar = new THREE.Mesh(new THREE.ConeGeometry(.1, .18, 3), collarMaterial);
    collar.position.set(side * .1, .62, .1);
    collar.rotation.set(-.35, side * .35, side * .25);
    hips.add(collar);
  }
  // Shoulders, a touch wider than the torso.
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(.25, 12, 8), coatMaterial);
  shoulders.scale.set(1.12, .48, .64);
  shoulders.position.y = 0.54;
  hips.add(shoulders);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 8), skinMaterial);
  neck.position.y = 0.62;
  hips.add(neck);
  const head = new THREE.Group();
  head.position.y = 0.78;
  hips.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), skinMaterial);
  skull.scale.set(0.86, 1, 0.82);
  skull.castShadow = true;
  head.add(skull);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10), hairMaterial);
  hairCap.scale.set(0.9, 0.48, 0.87);
  hairCap.position.y = 0.085;
  head.add(hairCap);
  const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 8), hairMaterial);
  backHair.scale.set(1, 1.2, .55);
  backHair.position.set(0, -0.015, - 0.08);
  head.add(backHair);
  if (cap !== null) {
    const capMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, 0.26), new THREE.MeshStandardMaterial({ color:
    cap, roughness: 0.7 }),);
    capMesh.position.y = 0.14;
    head.add(capMesh);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.12), new THREE.MeshStandardMaterial({ color:
    cap, roughness: 0.7 }));
    brim.position.set(0, 0.1, 0.16);
    head.add(brim);
  }
  const jawMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(skin).multiplyScalar(.69) });
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(.102, 12, 8), jawMaterial);
  jaw.scale.set(1, .68, .89);
  jaw.position.set(0, -.065, .036);
  head.add(jaw);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.032, 8, 6), skinMaterial);
  nose.position.set(0, -.012, .121);
  head.add(nose);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x20232a });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.011, 8, 6), eyeMaterial);
    eye.position.set(side * .048, .02, .109);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.032, 8, 6), skinMaterial);
    ear.scale.set(.65, 1.2, .76);
    ear.position.set(side * .119, -.014, -.012);
    head.add(eye, ear);
  }

  function limb(anchor, width, length, lowerWidth, lowerLength, material, end) {
    const joint = new THREE.Group();
    const hinge = new THREE.Group();
    const tip = new THREE.Group();
    const upper = segment(width, length, material);
    const lower = segment(lowerWidth, lowerLength, material);
    joint.position.set(...anchor);
    tip.add(end);
    hinge.add(lower, tip);
    joint.add(upper, hinge);
    hips.add(joint);
    return { joint, hinge, tip, upper, lower, length, lowerLength };
  }
  const arms = [-1, 1].map(side => {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), skinMaterial);
    hand.scale.set(.83, 1.12, .88);
    return limb([side * .251, .51, 0], .153, .29, .119, .282, coatMaterial, hand);
  });
  const legs = [-1, 1].map(side => {
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), shoeMaterial);
    shoe.position.set(0, -.021, .065);
    shoe.scale.set(.094, .061, .162);
    return limb([side * .124, 0, 0], .196, .43, .146, .42, trouserMaterial, shoe);
  });
  return { root, hips, torso, head, arms, legs, materials: { shirtMaterial, trouserMaterial, skinMaterial } };
}

function segment(width, length, material) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(width / 2, length - width / 2, 5, 10), material);
  mesh.position.y = -length / 2;
  mesh.castShadow = true;
  return mesh;
}

const DOWN = new THREE.Vector3(0, -1, 0);

function placeLimb(limb, bend, end) {
  const first = new THREE.Vector3(...bend).sub(limb.joint.position);
  limb.joint.quaternion.setFromUnitVectors(DOWN, first.clone().normalize());
  limb.upper.scale.y = first.length() / limb.length;
  limb.upper.position.y = -first.length() / 2;
  limb.hinge.position.y = -first.length();
  const second = new THREE.Vector3(...end).sub(new THREE.Vector3(...bend));
  second.applyQuaternion(limb.joint.quaternion.clone().invert());
  limb.hinge.quaternion.setFromUnitVectors(DOWN, second.clone().normalize());
  limb.lower.scale.y = second.length() / limb.lowerLength;
  limb.lower.position.y = -second.length() / 2;
  limb.tip.position.y = -second.length();
  limb.tip.quaternion.copy(limb.joint.quaternion).multiply(limb.hinge.quaternion).invert();
}

// The static combat frame uses explicit elbow, wrist, knee and ankle targets.
// Return the grip in world coordinates so the prop stays registered to both hands.
export function poseShowcaseAim(figure) {
  figure.hips.position.y = .865;
  figure.hips.rotation.x = .06;
  figure.head.rotation.y = -.07;
  figure.head.rotation.x = .08;
  placeLimb(figure.arms[0], [-.235, .415, .259], [-.023, .495, .48]);
  placeLimb(figure.arms[1], [.235, .455, .272], [.047, .5, .467]);
  placeLimb(figure.legs[0], [-.213, -.398, .197], [-.247, -.81, .184]);
  placeLimb(figure.legs[1], [.205, -.423, -.064], [.295, -.837, -.244]);
  return figure.hips.localToWorld(new THREE.Vector3(.022, .579, .543));
}
/**
* Pose a figure. `phase` is the walk cycle in radians (advance it by speed while moving), `speed`
* normalises the swing (0 standing, 1 walking, up to 1.6 running), `aim` tucks the arms in front
* for a gun, and `sit` folds the legs for a car seat.
*/
export function poseFigure(figure, phase, speed, { aim = false, sit = false, hurt = 0 } = { }) {
  const swing = Math.sin(phase) * Math.min(1.1, speed) * 0.75;
  const swingB = Math.sin(phase + Math.PI) * Math.min(1.1, speed) * 0.75;
  figure.arms.forEach((arm, i) => {
    const stride = i ? swingB : swing;
    const tuck = i ? -.29 : .29;
    arm.joint.rotation.set(aim ? -1.27 : stride * .85 - (sit ? .5 : 0), 0, aim ? tuck : 0);
    arm.hinge.rotation.x = aim ? -.34 : -.07 - Math.max(0, stride) * .45;
    arm.hinge.position.y = -arm.length;
    arm.tip.position.y = -arm.lowerLength;
  });
  figure.legs.forEach((leg, i) => {
    const stride = i ? swingB : swing;
    leg.joint.rotation.x = sit ? -1.22 : stride;
    leg.hinge.rotation.x = sit ? 1.24 : Math.max(0, -stride) * .74;
    leg.hinge.position.y = -leg.length;
    leg.tip.position.y = -leg.lowerLength;
  });
  // A run leans the torso in; a hurt figure doubles over.
  figure.hips.rotation.x =(sit ? - 0.1: 0) + hurt * 0.6 + Math.min(0.22, Math.max(0, speed - 1) * 0.16);
  // Bob: the whole body rises and falls twice a stride.
  figure.hips.position.y = 0.92 +(sit ? - 0.02: Math.abs(Math.sin(phase)) * 0.045 * Math.min(1.2,
  speed));
}
/** Skin and hair for a named character, so the cast reads consistently in the world and portraits. */
export const CAST = { dex: { shirt: 0xd9dde3, trousers: 0x2b3a52, jacket: 0x21344a, skin: SKIN[0],
hair: HAIR[0] }, mara: { shirt: 0x8b2f52, trousers: 0x25202c, jacket: null, skin: SKIN[2], hair:
0x1a1210 }, tavo: { shirt: 0xe6e0d0, trousers: 0x1a1a1f, jacket: 0x3a5f7a, skin: SKIN[1], hair:
0x0e0c0a }, nina: { shirt: 0x2fd6b6, trousers: 0x1b2430, jacket: null, skin: SKIN[3], hair: 0x6b3a1a },
garza: { shirt: 0xb2874a, trousers: 0x2a2a2e, jacket: 0x4a3a28, skin: SKIN[1], hair: 0x3a2a1a },
hollis: { shirt: 0x2a3a5a, trousers: 0x14181f, jacket: null, skin: SKIN[0], hair: 0x5a5a5a, cap:
0x1a2233 }, cop: { shirt: 0x2a3f6b, trousers: 0x121828, jacket: null, skin: SKIN[1], hair: HAIR[1],
cap: 0x16243c }, ped: { shirt: 0xd8a030, trousers: 0x323a44, jacket: null, skin: SKIN[2], hair:
HAIR[3] }, };
