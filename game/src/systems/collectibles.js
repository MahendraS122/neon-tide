// Hidden tide tokens are physical pickups, tracked by index in the safehouse slot.
import * as THREE from '../../vendor/three.module.min.js';
import { armoury, hospital, tideTokens } from '../world/locations.js';

export function createCollectibles({ scene, player, progress, vitals, weapons }, reward) {
  const geometry = new THREE.OctahedronGeometry(.42);
  const material = new THREE.MeshStandardMaterial({ color: '#61ffdc', emissive: '#39cde3', emissiveIntensity: 2 });
  const models = tideTokens.map(([x, z]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, .75, z);
    scene.add(mesh);
    return mesh;
  });
  const near = site => Math.hypot(player.position.x - site.x, player.position.z - site.z) < 6;

  function update(dt, time) {
    models.forEach((mesh, index) => {
      mesh.visible = !progress.tokens.includes(index);
      if (!mesh.visible) return;
      mesh.position.y = .8 + Math.sin(time * 3 + index) * .18;
      mesh.rotation.y += dt * 2;
      if (mesh.position.distanceTo(player.position) > 1.9) return;
      progress.tokens.push(index);
      mesh.visible = false;
      reward(`TIDE TOKEN ${progress.tokens.length}/${models.length}`, 125);
    });
  }
  function useService() {
    if (!player.vehicle && near(hospital) && progress.cash >= 150) {
      progress.cash -= 150;
      vitals.reset();
      return 'CLINIC · HEALTH RESTORED';
    }
    if (!player.vehicle && near(armoury) && progress.cash >= 180) {
      progress.cash -= 180;
      weapons.slots.forEach(slot => { if (slot.magazine) slot.reserve += slot.magazine * 2; });
      return 'HARBOUR SUPPLY · AMMO RESTOCKED';
    }
    return '';
  }
  const hint = () => player.vehicle ? '' : near(hospital) ? 'K CLINIC · $150'
    : near(armoury) ? 'K AMMO RESTOCK · $180' : '';
  return { update, useService, hint };
}
