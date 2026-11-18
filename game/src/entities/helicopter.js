import * as THREE from 'three';
export function createHelicopter (scene) {
  const root = new THREE.Group ();
  root.name = 'SPD AIR 1';
  const dark = new THREE.MeshStandardMaterial ({
    color : 0x182532, metalness : .5, roughness : .3
  }
  );
  const fuselage = new THREE.Mesh (new THREE.SphereGeometry (1, 14, 10), dark);
  fuselage.scale.set (1.65, .72, .72);
  root.add (fuselage);
  const cockpit = new THREE.Mesh (new THREE.SphereGeometry (.64, 12, 8), new THREE.MeshPhysicalMaterial ({
    color : 0x37c6dd, metalness : .2, roughness : .08, transparent : true, opacity : .72, clearcoat :
    1
  }
  ));
  cockpit.position.z = .58;
  root.add (cockpit);
  const tail = new THREE.Mesh (new THREE.CylinderGeometry (.13, .24, 3.1, 8), dark);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = - 2;
  root.add (tail);
  const mast = new THREE.Mesh (new THREE.CylinderGeometry (.07, .1, .5, 8), dark);
  mast.position.y = .8;
  root.add (mast);
  const rotor = new THREE.Group ();
  rotor.position.y = 1.08;
  for (let i = 0; i < 4; i ++) {
    const blade = new THREE.Mesh (new THREE.BoxGeometry (.19, .035, 5.8), dark);
    blade.rotation.y = i * Math.PI / 2;
    blade.position.z = .85;
    rotor.add (blade);
  }
  root.add (rotor);
  const cone = new THREE.Mesh (new THREE.ConeGeometry (5, 27, 24, 1, true), new THREE.MeshBasicMaterial ({
    color : 0xc9fbff, transparent : true, opacity : .09, depthWrite : false, side : THREE.DoubleSide
  }
  ));
  cone.position.set (0, - 13, - 1);
  cone.rotation.x = Math.PI;
  root.add (cone);
  const spot = new THREE.SpotLight (0xd8faff, 95, 75, Math.PI / 8, .4, 1.4);
  spot.position.set (0, - .1, .15);
  spot.target.position.set (0, - 25, 4);
  root.add (spot, spot.target);
  const lamp = new THREE.Mesh (new THREE.SphereGeometry (.16, 8, 6), new THREE.MeshBasicMaterial ({
    color : 0xbdfcff, toneMapped : false
  }
  ));
  lamp.position.set (0, - .45, .3);
  root.add (lamp);
  scene.add (root);
  let time = 0;
  const unit = {
    label : 'AIR 1', kind : 'heli', position : root.position, sightRange : 180, occluded : false
  }
  ;
  function update (dt, player, level) {
    time += dt;
    root.position.set (player.x + Math.sin (time * .35) * 13, 24 + Math.sin (time * 1.5) * 1.2,
    player.z - 20 + Math.cos (time * .35) * 8);
    root.rotation.y = Math.atan2 (player.x - root.position.x, player.z - root.position.z);
    rotor.rotation.y += dt * 25;
    spot.target.position.set (player.x - root.position.x, - root.position.y, player.z - root.position.z);
    spot.target.updateMatrixWorld ();
    unit.position.copy (root.position);
    unit.visible = level >= 3;
    root.visible = level >= 3;
    return unit;
  }
  return {
    root, unit, update
  }
  ;
}
