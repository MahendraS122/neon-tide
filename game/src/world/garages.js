// A workshop on Ocean Drive offers resprays, repairs and persistent street tuning.
import * as THREE from '../../vendor/three.module.min.js';
import { garageSite } from './locations.js';

export const paints = ['#20d6bf', '#ef6b82', '#ffaa54', '#6268b8', '#e8e2ce', '#263845'];
export const upgrades = [
  { id: 'engine', name: 'Engine', price: 850, detail: 'More acceleration and top speed' },
  { id: 'armour', name: 'Armour', price: 700, detail: 'Less damage from vehicle impacts' },
  { id: 'nitro', name: 'Nitro', price: 550, detail: 'Stronger boost that lasts longer' },
  { id: 'tyres', name: 'Tyres', price: 450, detail: 'More grip under cornering load' }
];

export function createGarage({ scene, vehicles, player, progress, wanted }) {
  const marker = new THREE.Mesh(new THREE.TorusGeometry(4, .12, 8, 40),
    new THREE.MeshBasicMaterial({ color: '#ffb675', toneMapped: false }));
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(garageSite.x, .13, garageSite.z);
  scene.add(marker);
  let record = null;
  const nearby = () => Math.hypot(player.position.x - garageSite.x, player.position.z - garageSite.z) < 8;

  function service(id, color) {
    const car = player.vehicle;
    if (!car || !nearby() || Math.abs(car.speed) > 3) return 'Stop a vehicle inside the workshop ring.';
    car.upgrades ??= {};
    const part = upgrades.find(item => item.id === id);
    if (part && car.upgrades[id]) return 'Already fitted to this car.';
    const price = part?.price ?? (id === 'paint' ? 200 : 300);
    if (progress.cash < price) return 'Not enough cash.';
    progress.cash -= price;
    if (part) car.upgrades[id] = true;
    if (id === 'paint') car.paint.color.set(color);
    if (id === 'paint' || id === 'repair') {
      car.condition = 100;
      wanted.clear();
    }
    record = { type: car.type, color: `#${car.paint.color.getHexString()}`, upgrades: { ...car.upgrades } };
    return part ? `${part.name} fitted.` : 'Body repaired. SPD cleared.';
  }

  function restore(saved) {
    if (!saved || !['sports', 'muscle', 'suv', 'police', 'taxi', 'van'].includes(saved.type)) return;
    record = saved;
    const car = vehicles.add(saved.type, saved.color, 104.4, 18.5, Math.PI);
    car.upgrades = { ...saved.upgrades };
  }

  return { nearby, service, restore, snapshot: () => record };
}
