// Dex Calloway, built from primitives: hips, torso, a jacket, head with hair and a chin shadow,
// arms and legs on pivots so they swing when he walks and tuck when he runs. One function builds
// the rig; `poseFigure` animates it from a phase and a speed, which pedestrians and cops reuse.
import * as THREE from 'three';
const SKIN = [0xe8b48c, 0xc98a5e, 0x8c5a3c, 0xf0c9a4];
const HAIR = [0x2a1d14, 0x120f0c, 0x4a2c14, 0x1a1a1a];
export function createFigure ({
  shirt = 0x2b3a52, trousers = 0x1d2532, skin = SKIN [0], hair = HAIR [0], shoes = 0x14161a, jacket =
  null, cap = null
}
= {
}
) {
  const root = new THREE.Group ();
  const skinMaterial = new THREE.MeshStandardMaterial ({
    color : skin, roughness : 0.72
  }
  );
  const hairMaterial = new THREE.MeshStandardMaterial ({
    color : hair, roughness : 0.9
  }
  );
  const shirtMaterial = new THREE.MeshStandardMaterial ({
    color : shirt, roughness : 0.82
  }
  );
  const trouserMaterial = new THREE.MeshStandardMaterial ({
    color : trousers, roughness : 0.86
  }
  );
  const shoeMaterial = new THREE.MeshStandardMaterial ({
    color : shoes, roughness : 0.7
  }
  );
  const hips = new THREE.Group ();
  hips.position.y = 0.92;
  root.add (hips);
  const torso = new THREE.Mesh (new THREE.BoxGeometry (0.44, 0.56, 0.26), shirtMaterial);
  torso.position.y = 0.28;
  torso.castShadow = true;
  hips.add (torso);
  if (jacket !== null) {
    const coat = new THREE.Mesh (new THREE.BoxGeometry (0.5, 0.5, 0.32), new THREE.MeshStandardMaterial ({
      color : jacket, roughness : 0.78
    }
    ),);
    coat.position.y = 0.3;
    coat.castShadow = true;
    hips.add (coat);
  }
  // Shoulders, a touch wider than the torso.
  const shoulders = new THREE.Mesh (new THREE.BoxGeometry (0.5, 0.14, 0.28), shirtMaterial);
  shoulders.position.y = 0.54;
  hips.add (shoulders);
  const neck = new THREE.Mesh (new THREE.CylinderGeometry (0.07, 0.08, 0.1, 8), skinMaterial);
  neck.position.y = 0.62;
  hips.add (neck);
  const head = new THREE.Group ();
  head.position.y = 0.78;
  hips.add (head);
  const skull = new THREE.Mesh (new THREE.BoxGeometry (0.22, 0.26, 0.23), skinMaterial);
  skull.castShadow = true;
  head.add (skull);
  const hairCap = new THREE.Mesh (new THREE.BoxGeometry (0.235, 0.1, 0.245), hairMaterial);
  hairCap.position.y = 0.11;
  head.add (hairCap);
  const backHair = new THREE.Mesh (new THREE.BoxGeometry (0.235, 0.14, 0.06), hairMaterial);
  backHair.position.set (0, 0.01, - 0.1);
  head.add (backHair);
  if (cap !== null) {
    const capMesh = new THREE.Mesh (new THREE.BoxGeometry (0.25, 0.09, 0.26), new THREE.MeshStandardMaterial ({
      color : cap, roughness : 0.7
    }
    ),);
    capMesh.position.y = 0.14;
    head.add (capMesh);
    const brim = new THREE.Mesh (new THREE.BoxGeometry (0.24, 0.03, 0.12), new THREE.MeshStandardMaterial ({
      color : cap, roughness : 0.7
    }
    ));
    brim.position.set (0, 0.1, 0.16);
    head.add (brim);
  }
  // Face: two dark eye dots and a jaw shade, so the head reads from behind the camera.
  const eyeMaterial = new THREE.MeshBasicMaterial ({
    color : 0x20232a
  }
  );
  for (const side of [- 1, 1]) {
    const eye = new THREE.Mesh (new THREE.BoxGeometry (0.035, 0.03, 0.02), eyeMaterial);
    eye.position.set (side * 0.055, 0.02, 0.118);
    head.add (eye);
  }
  function limb (width, length, material, radius) {
    const pivot = new THREE.Group ();
    const upper = new THREE.Mesh (new THREE.BoxGeometry (width, length, width * (radius ?? 1)),
    material);
    upper.position.y = - length / 2;
    upper.castShadow = true;
    pivot.add (upper);
    return pivot;
  }
  const armL = limb (0.13, 0.62, shirtMaterial, 0.9);
  armL.position.set (- 0.3, 0.5, 0);
  hips.add (armL);
  const armR = limb (0.13, 0.62, shirtMaterial, 0.9);
  armR.position.set (0.3, 0.5, 0);
  hips.add (armR);
  // Hands.
  for (const arm of [armL, armR]) {
    const hand = new THREE.Mesh (new THREE.BoxGeometry (0.12, 0.13, 0.12), skinMaterial);
    hand.position.y = - 0.66;
    arm.add (hand);
  }
  const legL = limb (0.17, 0.86, trouserMaterial, 1);
  legL.position.set (- 0.13, 0, 0);
  hips.add (legL);
  const legR = limb (0.17, 0.86, trouserMaterial, 1);
  legR.position.set (0.13, 0, 0);
  hips.add (legR);
  for (const leg of [legL, legR]) {
    const shoe = new THREE.Mesh (new THREE.BoxGeometry (0.19, 0.1, 0.3), shoeMaterial);
    shoe.position.set (0, - 0.86, 0.06);
    shoe.castShadow = true;
    leg.add (shoe);
  }
  return {
    root, hips, torso, head, armL, armR, legL, legR, materials : {
      shirtMaterial, trouserMaterial, skinMaterial
    }
  }
  ;
}
/**
* Pose a figure. `phase` is the walk cycle in radians (advance it by speed while moving), `speed`
* normalises the swing (0 standing, 1 walking, up to 1.6 running), `aim` tucks the arms in front
* for a gun, and `sit` folds the legs for a car seat.
*/
export function poseFigure (figure, phase, speed, {
  aim = false, sit = false, hurt = 0
}
= {
}
) {
  const swing = Math.sin (phase) * Math.min (1.1, speed) * 0.75;
  const swingB = Math.sin (phase + Math.PI) * Math.min (1.1, speed) * 0.75;
  figure.legL.rotation.x = sit ? - 1.15 : swing;
  figure.legR.rotation.x = sit ? - 1.15 : swingB;
  if (sit) {
    figure.legL.rotation.x = - 1.25;
    figure.legR.rotation.x = - 1.2;
  }
  if (aim) {
    figure.armR.rotation.x = - 1.45;
    figure.armR.rotation.z = - 0.12;
    figure.armL.rotation.x = - 1.3;
    figure.armL.rotation.z = 0.34;
  }
  else {
    figure.armR.rotation.x = swingB * 0.85 - (sit ? 0.5 : 0);
    figure.armL.rotation.x = swing * 0.85 - (sit ? 0.5 : 0);
    figure.armR.rotation.z = 0;
    figure.armL.rotation.z = 0;
  }
  // A run leans the torso in; a hurt figure doubles over.
  figure.hips.rotation.x = (sit ? - 0.1 : 0) + hurt * 0.6 + Math.min (0.22, Math.max (0, speed - 1) * 0.16);
  // Bob: the whole body rises and falls twice a stride.
  figure.hips.position.y = 0.92 + (sit ? - 0.02 : Math.abs (Math.sin (phase)) * 0.045 * Math.min (1.2,
  speed));
}
/** Skin and hair for a named character, so the cast reads consistently in the world and portraits. */
export const CAST = {
  dex : {
    shirt : 0xd9dde3, trousers : 0x2b3a52, jacket : 0x21344a, skin : SKIN [0], hair : HAIR [0]
  }
  , mara : {
    shirt : 0x8b2f52, trousers : 0x25202c, jacket : null, skin : SKIN [2], hair : 0x1a1210
  }
  , tavo : {
    shirt : 0xe6e0d0, trousers : 0x1a1a1f, jacket : 0x3a5f7a, skin : SKIN [1], hair : 0x0e0c0a
  }
  , nina : {
    shirt : 0x2fd6b6, trousers : 0x1b2430, jacket : null, skin : SKIN [3], hair : 0x6b3a1a
  }
  , garza : {
    shirt : 0xb2874a, trousers : 0x2a2a2e, jacket : 0x4a3a28, skin : SKIN [1], hair : 0x3a2a1a
  }
  , hollis : {
    shirt : 0x2a3a5a, trousers : 0x14181f, jacket : null, skin : SKIN [0], hair : 0x5a5a5a, cap :
    0x1a2233
  }
  , cop : {
    shirt : 0x2a3f6b, trousers : 0x121828, jacket : null, skin : SKIN [1], hair : HAIR [1], cap :
    0x16243c
  }
  , ped : {
    shirt : 0xd8a030, trousers : 0x323a44, jacket : null, skin : SKIN [2], hair : HAIR [3]
  }
  ,
}
;
