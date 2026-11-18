// Versioned local save slot; malformed or unavailable storage never prevents play.
import { applyVehicleUpgrades, repaint } from '../ui/garage.js';
const KEY = 'neon-tide-port-solara-v2';
export function createSave(game) { function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data?.version !== 2 || !Number.isFinite(data.cash) || data.cash < 0 || !Number.isFinite(data.time?.minutes) ||
    data.time.minutes < 0 || data.time.minutes >= 1440 || !Number.isInteger(data.time.day) || data.time.day < 1 ||
    !Array.isArray(data.missions?.completed) || data.missions.completed.length > 8 || data.missions.completed.some((value,
    i) => value !== i) || !Array.isArray(data.stats?.tokens) || !Number.isFinite(data.stats.respect) ||
    !Number.isFinite(data.stats.carsStolen)) return null;
    return data;
  }
  catch {
    return null;
  }
}
function autosave() {
  if (game.shotName) return false;
  const car = game.playerRig.player.inVehicle ?? game.lastVehicle;
  const data = {
    version: 2, cash: game.cash, time: { ...game.time }, stats: { ...game.stats }, missions: { completed:
    [...game.missions.state.completed] }, settings: { ...game.settings }, vehicle: car ? { kind:
    car.kind, color: car.color, upgrades: { ...car.upgrades } }: null,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return Boolean(read());
  }
  catch {
    game.hud.float('Storage unavailable: progress stays in this session', 'bad');
    return false;
  }
}
function atSafehouse() {
  const p = game.playerRig.player.position;
  const home = game.world.landmarks.safehouse;
  return Math.hypot(p.x - home.x, p.z - home.z) < 20;
}
function save() {
  if (game.wanted.state.level) {
    game.hud.float('Lose the police before saving', 'bad');
    return false;
  }
  if (game.missions.current()) {
    game.hud.float('Finish the current job before saving', 'bad');
    return false;
  }
  if (!atSafehouse()) {
    game.hud.float('Save at the H safehouse marker', 'good');
    return false;
  }
  const success = autosave();
  if (success) game.hud.float('SAFEHOUSE · GAME SAVED', 'cash');
  return success;
}
function load() {
  const data = read();
  if (!data) return false;
  game.resetWorld?.();
  game.cash = data.cash;
  game.time = { ...data.time };
  game.stats = {
    ...data.stats, tokens:[...new Set(data.stats.tokens.filter(i => Number.isInteger(i) && i >= 0 &&
    i < 24))]
  };
  game.missions.restore(data.missions);
  game.settings = { ...game.settings, ...data.settings };
  const home = game.world.landmarks.safehouse;
  game.playerRig.teleport(home.x, home.z);
  if (data.vehicle &&['sedan', 'muscle', 'sport', 'police', 'hatch', 'van', 'taxi', 'suv'].includes(data.vehicle.kind)) {
    game.starter?.group.removeFromParent();
    const starterIndex = game.parked?.indexOf(game.starter) ?? -1;
    if (starterIndex >= 0) game.parked.splice(starterIndex, 1);
    const car = game.parkCar({ ...data.vehicle, x: home.x, z: home.z - 7 });
    applyVehicleUpgrades(car, data.vehicle.upgrades);
    repaint(car, data.vehicle.color);
    game.lastVehicle = car;
  }
  game.collectibles?.reset();
  game.clock?.refresh();
  game.missions.update(0, { pressed:() => false });
  game.hud.setCash(game.cash);
  return true;
}
return { read, save, autosave, load, atSafehouse };
}
