// One car, built from primitives into a Group: a lower body, a cabin, glass, lamps, a grille, four
// wheels that steer and roll, and a number plate. Body shapes differ by `kind`: sedan (the default
// street car), muscle (long low hood), hatch (short and cheap), van (tall box), sport (wide and
// low), police (sedan with a light bar) and taxi. Colours are JSON-able hex numbers, so a stolen
// car's paint survives a save.
import * as THREE from 'three';
import { plateTexture } from '../render/textures.js';
import { coachwork, taperedCabin, labelTexture } from './carGeometry.js';

const wheelGeometry = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 14);
const hubGeometry = new THREE.CylinderGeometry(0.17, 0.17, 0.26, 10);
const tyreMaterial = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.92 });
const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xb9c0c8, roughness: 0.32, metalness: 0.85 });
const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x1c2b3a, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.72,
});
const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.55, metalness: 0.4 });
const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xdfe6ec, roughness: 0.22, metalness: 0.95 });
const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff3d2 });
const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xff3a2a });

/** The silhouette of each car kind: overall size, cabin size and where the cabin sits. */
export const CAR_SHAPES = {
  sedan: { length: 4.55, width: 1.96, bodyH: 0.78, bodyY: 0.62, cabinL: 2.2, cabinH: 0.62, cabinZ: -0.16, nose: 0.1 },
  muscle: { length: 4.85, width: 2.04, bodyH: 0.72, bodyY: 0.58, cabinL: 2.0, cabinH: 0.54, cabinZ: -0.34, nose: 0.16 },
  hatch: { length: 3.85, width: 1.78, bodyH: 0.86, bodyY: 0.66, cabinL: 2.05, cabinH: 0.72, cabinZ: -0.1, nose: 0.05 },
  van: { length: 5.2, width: 2.05, bodyH: 1.3, bodyY: 0.86, cabinL: 3.1, cabinH: 0.86, cabinZ: -0.42, nose: 0.12 },
  suv: { length: 4.95, width: 2.08, bodyH: 1.08, bodyY: 0.76, cabinL: 2.65, cabinH: 0.78, cabinZ: -0.2, nose: 0.08 },
  sport: { length: 4.5, width: 2.06, bodyH: 0.62, bodyY: 0.5, cabinL: 1.8, cabinH: 0.5, cabinZ: -0.28, nose: 0.22 },
  police: { length: 4.7, width: 2.0, bodyH: 0.76, bodyY: 0.62, cabinL: 2.25, cabinH: 0.6, cabinZ: -0.18, nose: 0.1 },
  taxi: { length: 4.6, width: 1.94, bodyH: 0.8, bodyY: 0.63, cabinL: 2.24, cabinH: 0.64, cabinZ: -0.16, nose: 0.1 },
};

/**
 * Build the visual group for a car. Returns { group, wheels, lights } where `wheels` is the four
 * wheel pivots (front two steer) and `lights` holds the light bar and lamp materials to toggle.
 */
export function buildCarVisual({ kind = 'sedan', color = 0xd8d8de, plate = 'NT 4001', accent = 0x1a1d22 }) {
  const shape = CAR_SHAPES[kind] ?? CAR_SHAPES.sedan;
  const group = new THREE.Group();
  group.name = `car-${kind}`;

  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, metalness: 0.5, clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1.15 });

  // Lower body: a slightly tapered slab so the flanks are not a naked box.
  const body = coachwork(shape.width, shape.length, shape.bodyH, paint);
  body.position.y = shape.bodyY - shape.bodyH / 2;
  group.add(body);

  // A chamfer cap along the top edge of the body (reads as a shoulder line).
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(shape.width * 0.94, 0.16, shape.length * 0.97), paint);
  shoulder.position.y = shape.bodyY + shape.bodyH / 2 + 0.03;
  group.add(shoulder);

  // Cabin, sitting on the body, glass on all four sides with a solid roof.
  const cabinBottom = shape.bodyY + shape.bodyH / 2;
  const cabin = taperedCabin(shape.width * .84, cabinBottom, cabinBottom + shape.cabinH, shape.cabinZ - shape.cabinL / 2, shape.cabinZ + shape.cabinL / 2, paint, kind === 'van' ? .91 : .69);
  cabin.castShadow = true;
  group.add(cabin);
  const sideGlassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x40a9bb, roughness: .12, metalness: .18, transparent: true, opacity: .72, clearcoat: .85, emissive: 0x081b20 });
  const glassY = cabinBottom + shape.cabinH * .56;
  const glassH = shape.cabinH * .58;
  const sideWindow = new THREE.BoxGeometry(.018, glassH, shape.cabinL * .54);
  for (const side of [-1,1]) {
    const windowMesh = new THREE.Mesh(sideWindow, sideGlassMaterial);
    windowMesh.position.set(side * shape.width * .43, glassY, shape.cabinZ);
    group.add(windowMesh);
  }
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(shape.width * .54, shape.cabinH * .52), sideGlassMaterial);
  windshield.position.set(0, cabinBottom + shape.cabinH * .65, shape.cabinZ + shape.cabinL * .39);
  windshield.rotation.x = -0.18; group.add(windshield);
  // Roof panel over the glass, so the cabin reads solid from above.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(shape.width * 0.84, 0.1, shape.cabinL * 0.9), paint);
  roof.position.set(0, cabinBottom + shape.cabinH + 0.02, shape.cabinZ);
  group.add(roof);
  if (kind === 'suv' || kind === 'van') {
    for (const side of [-1,1]) {
      const rail=new THREE.Mesh(new THREE.BoxGeometry(.055,.055,shape.cabinL*.82),chromeMaterial);
      rail.position.set(side*shape.width*.3,cabinBottom+shape.cabinH+.12,shape.cabinZ);group.add(rail);
    }
  }

  // Bonnet and boot slopes: thin wedges front and back to break the box silhouette.
  const hood = new THREE.Mesh(new THREE.BoxGeometry(shape.width * 0.9, 0.16, (shape.length - shape.cabinL) * 0.42), paint);
  hood.position.set(0, shape.bodyY + shape.bodyH / 2 + 0.06, (shape.length / 2) - (shape.length - shape.cabinL) * 0.26);
  group.add(hood);
  const boot = new THREE.Mesh(new THREE.BoxGeometry(shape.width * 0.92, 0.18, (shape.length - shape.cabinL) * 0.34), paint);
  boot.position.set(0, shape.bodyY + shape.bodyH / 2 + 0.07, -(shape.length / 2) + (shape.length - shape.cabinL) * 0.2);
  group.add(boot);

  // Bumpers, grille and a chrome strip.
  for (const end of [-1, 1]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(shape.width * 0.98, 0.26, 0.22), trimMaterial);
    bumper.position.set(0, shape.bodyY - shape.bodyH * 0.18, end * (shape.length / 2 - 0.06));
    group.add(bumper);
  }
  const grille = new THREE.Mesh(new THREE.BoxGeometry(shape.width * 0.52, 0.18, 0.1), trimMaterial);
  grille.position.set(0, shape.bodyY + 0.04, shape.length / 2 + 0.02);
  group.add(grille);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(shape.width * 0.9, 0.05, 0.06), chromeMaterial);
  strip.position.set(0, shape.bodyY + shape.bodyH * 0.42, shape.length / 2 + 0.01);
  group.add(strip);

  // Lamps.
  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), headlightMaterial);
    head.position.set(side * shape.width * 0.32, shape.bodyY + shape.bodyH * 0.14, shape.length / 2 + 0.02);
    group.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.08), taillightMaterial);
    tail.position.set(side * shape.width * 0.33, shape.bodyY + shape.bodyH * 0.16, -shape.length / 2 - 0.02);
    group.add(tail);
  }

  // Number plate on the back.
  const plateMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.17),
    new THREE.MeshBasicMaterial({ map: plateTexture(plate) }),
  );
  plateMesh.position.set(0, shape.bodyY - 0.1, -shape.length / 2 - 0.07);
  plateMesh.rotation.y = Math.PI;
  group.add(plateMesh);

  // Wheels: four pivots. The fronts steer, all four roll.
  const wheels = [];
  const wheelbase = shape.length * 0.62;
  const track = shape.width * 0.5 + 0.02;
  for (const [sx, sz, steer] of [[-1, 1, true], [1, 1, true], [-1, -1, false], [1, -1, false]]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * track, 0.36, sz * wheelbase / 2);
    const spin = new THREE.Group();
    const tyre = new THREE.Mesh(wheelGeometry, tyreMaterial);
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = true;
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.rotation.z = Math.PI / 2;
    spin.add(tyre, hub);
    pivot.add(spin);
    pivot.userData.steer = steer;
    pivot.userData.spin = spin;
    group.add(pivot);
    wheels.push(pivot);
  }

  // Arch shadow, so the wheels look recessed.
  for (const sx of [-1, 1]) {
    const arch = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.5, shape.length * 0.72),
      new THREE.MeshStandardMaterial({ color: accent, roughness: 0.95 }),
    );
    arch.position.set(sx * (shape.width / 2 + 0.01), 0.4, 0);
    group.add(arch);
  }

  // Police: livery band and a light bar. Taxi: a roof sign.
  const lights = { bar: null, red: null, blue: null };
  if (kind === 'police') {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(shape.width + 0.02, 0.3, shape.length * 0.86),
      new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.6 }),
    );
    band.position.y = shape.bodyY + 0.02;
    group.add(band);
    // White doors, deep navy rocker stripe and original Solara police markings.
    for (const side of [-1,1]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(.035,.38,1.55), new THREE.MeshPhysicalMaterial({color:0xf1f2ed,roughness:.3,clearcoat:.65}));
      door.position.set(side * (shape.width * .505), shape.bodyY + .05, -.03); group.add(door);
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.05,.34), new THREE.MeshBasicMaterial({map:labelTexture('SPD','#10233a','#f1f2ed')}));
      decal.position.set(side * (shape.width * .53), shape.bodyY + .09, -.02); decal.rotation.y = side * Math.PI/2; group.add(decal);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.34), trimMaterial);
    bar.position.set(0, shape.bodyY + shape.bodyH / 2 + shape.cabinH + 0.16, shape.cabinZ - 0.1);
    group.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: 0xff1717, toneMapped:false }));
    red.position.set(-0.32, bar.position.y + 0.12, bar.position.z);
    group.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: 0x1677ff, toneMapped:false }));
    blue.position.set(0.32, bar.position.y + 0.12, bar.position.z);
    group.add(blue);
    lights.bar = bar; lights.red = red; lights.blue = blue;
    for (const side of [-1,1]) {
      const pool = new THREE.PointLight(side < 0 ? 0xff1838 : 0x207bff, 0, 9, 2);
      pool.position.set(side*.5,bar.position.y+.05,bar.position.z); group.add(pool);
      lights[side < 0 ? 'redPool' : 'bluePool'] = pool;
    }
  } else if (kind === 'taxi') {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.24, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffcf3a }),
    );
    sign.position.set(0, shape.bodyY + shape.bodyH / 2 + shape.cabinH + 0.16, shape.cabinZ - 0.1);
    group.add(sign);
  }

  return { group, wheels, lights, shape };
}
