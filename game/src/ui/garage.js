// Paid paint and performance choices update the actual driven vehicle, never a preview clone.
export const PAINTS =[['TIDAL TEAL', 0x23cbb6],['VICE PINK', 0xf04b96],['SUNSET', 0xee7a36],['PEARL',
0xece9db],['MIDNIGHT', 0x17233c],['ELECTRIC', 0x497bef],];
const UPGRADES =[['engine', 'STREET ENGINE', 1400, 'More acceleration and a higher top speed'],
['armour', 'REINFORCED ARMOUR', 1100, 'Collision protection and a full repair'],['nitro', 'NITRO INJECTION',
1800, 'Hold N for a rechargeable burst'],['tyres', 'PERFORMANCE TYRES', 900, 'Tighter grip through hard corners'],
];
export function applyVehicleUpgrades(car, upgrades = { }) {
  car.baseAccel ??= car.accel;
  car.baseTopSpeed ??= car.topSpeed;
  car.upgrades = { ...upgrades };
  car.accel = car.baseAccel *(upgrades.engine ? 1.25: 1);
  car.topSpeed = car.baseTopSpeed *(upgrades.engine ? 1.15: 1);
  car.nitro ??= 1;
}
export function repaint(car, color) { car.color = color;
const materials = new Set();
car.group.traverse(function recolor(object) {
  if (object.material?.isMeshPhysicalMaterial && object.material.clearcoat === 0.9) {
    materials.add(object.material);
  }
});
materials.forEach(material => material.color.setHex(color));
} export function createGarage(game) { const root = document.createElement('section');
root.id = 'garage-screen';
root.className = 'screen';
root.hidden = true;
document.body.append(root);
let car = null;
function purchase(cost, action) {
  if (game.cash < cost) {
    game.hud.float('NOT ENOUGH CASH', 'bad');
    return false;
  }
  game.cash -= cost;
  action();
  game.wanted.clear();
  car.health = 100;
  car.wrecked = false;
  game.hud.setCash(game.cash);
  render();
  return true;
}
function render() {
  root.innerHTML = `<div class="customs-panel"><small>PORT SOLARA / EST. 1986</small>
      <h1>CORALLO<br><span>CUSTOMS</span></h1><div class="garage-cash">` + `$${game.cash.toLocaleString('en-US')}</div><p>RESRAY / REPAIR / DISAPPEAR</p>
      <h3>PAINT SHOP <span>$350</span></h3><div class="paint-swatches"></div>
      <h3>PERFORMANCE</h3><div class="upgrade-list"></div>
      <button class="menu-button" data-repair>REPAIR & CLEAN PLATES · $250</button>
      <button class="menu-button" data-exit>ESC · BACK TO THE STREETS</button>
      <small>ALL SERVICES INCLUDE WANTED CLEARANCE</small></div>
      <div class="garage-vehicle"><b>${car.kind.toUpperCase()}</b><span>CONDITION ${Math.round(car.health)}%</span>
      <p>BUILT FOR THE LONG WAY HOME.</p></div>`;
  const colors = root.querySelector('.paint-swatches');
  PAINTS.forEach(([name, color]) => {
    const button = document.createElement('button');
    button.title = `${name} · $350`;
    button.setAttribute('aria-label', button.title);
    button.style.background = `#${color.toString(16).padStart(6, '0')}`;
    button.onclick = function buyPaint() {
      purchase(350,() => repaint(car, color));
    };
    colors.append(button);
  });
  const list = root.querySelector('.upgrade-list');
  UPGRADES.forEach(([key, name, cost, description]) => {
    const button = document.createElement('button');
    button.className = 'menu-button';
    button.innerHTML = `${name}<em>${car.upgrades[key] ? 'INSTALLED' : `$${cost}`}</em>` + `<small>${description}</small>`;
    button.disabled = Boolean(car.upgrades[key]);
    button.onclick = function buyUpgrade() {
      purchase(cost,() => applyVehicleUpgrades(car, { ...car.upgrades,[key]: true }));
    };
    list.append(button);
  });
  root.querySelector('[data-repair]').onclick = function repair() {
    purchase(250,() => {
    });
  };
  root.querySelector('[data-exit]').onclick = hide;
}
function show() {
  car = game.playerRig.player.inVehicle;
  if (!car) return false;
  applyVehicleUpgrades(car, car.upgrades);
  game.mode = 'garage';
  root.hidden = false;
  game.hud.showHud(false);
  document.exitPointerLock?.();
  car.velocity.set(0, 0, 0);
  const camera = game.view.camera;
  camera.position.set(car.position.x + 7, car.position.y + 3.6, car.position.z + 7);
  camera.lookAt(car.position.x - 1, car.position.y + 0.8, car.position.z);
  render();
  return true;
}
function hide() {
  root.hidden = true;
  game.mode = 'play';
  game.hud.showHud(true);
  game.save?.autosave();
}
return { show, hide, purchase };
}
