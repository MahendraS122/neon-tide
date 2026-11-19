// Port Solara's live tactical HUD; scene directors can supply mission and dialogue state.
import { createMinimap } from './minimap.js';

const icons = [
  'M4 13V8h3V5h3v2h2V4h3v4h2V6h3v8l-4 5H8z',
  'M2 5h24v5H14v3h-3l-2 6H4l2-9H2z',
  'M2 8h5V5h18v3h5v3H18l2 7h-4l-3-7h-3l-2 6H5l1-6H2z',
  'M1 11l7-5h22v3H17l-4 3H8l-5 4H1z',
  'M1 8h6V6h8V4h5v2h5v2h6v2H18l2 8h-4l-3-7h-2l-2 5H6l1-6H1z'
];
const cashFormat = new Intl.NumberFormat('en-US');
const timePart = value => String(value).padStart(2, '0');

function portrait(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#347b80';
  ctx.fillRect(0, 0, 56, 56);
  const ellipse = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  ellipse(28, 34, 19, 26, '#201b2a');
  ellipse(29, 59, 26, 18, '#842f57');
  ellipse(29, 40, 7, 12, '#a55c4a');
  ellipse(30, 26, 13, 17, '#d89876');
  ellipse(27, 13, 15, 8, '#231f2e');
  ellipse(18, 24, 4, 13, '#231f2e');
  for (const x of [26, 36]) ellipse(x, 26, 2, 1.3, '#352331');
  ellipse(32, 35, 4, 1.2, '#8a454a');
  ellipse(42, 35, 2, 3, '#ffe2a0');
}

export function createHud(player, vehicles, city, { wanted, vitals, weapons, gangs, radio, progress, units }) {
  const el = id => document.getElementById(id);
  const map = createMinimap(el('minimap'), city, player);
  const weaponRows = weapons.slots.map((slot, index) => {
    const row = document.createElement('div');
    row.innerHTML = `<kbd>${index + 1}</kbd><svg viewBox="0 0 32 22" aria-hidden="true">
      <path d="${icons[index]}"/></svg><b>${slot.name}</b><span></span>`;
    el('weapons').append(row);
    return row;
  });
  portrait(el('portrait'));
  let elapsed = 0;
  let lastUpdate = -1;
  const meter = (id, value) => el(id).style.setProperty('--fill', `${value}%`);
  const text = (id, value) => { el(id).textContent = value; };

  function responseList(entries) {
    const nodes = entries.slice(0, 5).map(unit => {
      const row = document.createElement('li');
      const label = document.createElement('b');
      const distance = document.createElement('span');
      const status = document.createElement('small');
      label.textContent = unit.name;
      distance.textContent = `${Math.round(unit.position.distanceTo(player.position))} m`;
      status.textContent = unit.status;
      status.dataset.status = unit.status;
      row.append(label, distance, status);
      return row;
    });
    el('response-list').replaceChildren(...nodes);
    el('response').hidden = entries.length === 0;
  }
  function update(dt, night, presentation = {}) {
    elapsed += dt;
    if (elapsed - lastUpdate < 0.075) return;
    lastUpdate = elapsed;
    const entries = units();
    const position = player.position;
    const vehicle = player.vehicle;
    const mission = presentation.mission ?? {};
    text('chapter', mission.chapter ?? 'FREE ROAM · PORT SOLARA');
    text('mission-name', mission.name ?? 'A city to call your own');
    text('objective', mission.objective ?? 'Explore Ocean Drive. Find a ride.');
    text('timer', mission.timer ?? '');
    text('next', `NEXT: ${mission.next ?? 'Find the Lavado lookouts in Glasswater'}`);
    meter('stage', mission.stage ?? 0);
    text('cash', `$${cashFormat.format(progress.cash)}`);
    text('stars', '★'.repeat(wanted.stars) + '☆'.repeat(5 - wanted.stars));
    el('stars').classList.toggle('searching', wanted.status === 'SEARCHING');
    text('wanted-label', wanted.arrest > 0 ? `ARREST ${Math.ceil(wanted.arrest * 100)}%` : wanted.status);
    el('failure').hidden = !wanted.ending;
    el('failure').firstElementChild.textContent = wanted.ending;
    responseList(entries);
    text('district', presentation.district ?? city.districtAt(position.x, position.z));
    meter('health', vitals.health);
    meter('armour', vitals.armour);
    meter('respect', progress.respect);
    text('health-value', Math.ceil(vitals.health));
    text('armour-value', Math.ceil(vitals.armour));
    map.draw(entries, gangs.members, vehicles.vehicles);
    el('speedometer').hidden = !vehicle;
    el('weapons').classList.toggle('stowed', Boolean(vehicle));
    el('reticle').hidden = Boolean(vehicle || !weapons.selected || presentation.hideReticle);
    weaponRows.forEach((row, index) => {
      const slot = weapons.slots[index];
      const active = index === weapons.selected;
      row.classList.toggle('active', active);
      row.lastElementChild.textContent = active && weapons.reloading ? 'LOAD' : slot.magazine
        ? `${slot.ammo} / ${slot.reserve}` : '—';
    });
    if (vehicle) {
      const speed = Math.round(Math.abs(vehicle.speed) * 3.6);
      text('speed', speed);
      text('gear', vehicle.speed < -0.4 ? 'R' : speed < 1 ? 'N' : Math.min(6, 1 + Math.floor(speed / 33)));
      text('car-name', vehicle.spec.name.toUpperCase());
      text('condition', `BODY ${Math.round(vehicle.condition)}%`);
      meter('nitro', vehicle.nitro ?? 0);
      text('station', radio.current.station);
      text('song', radio.current.song);
      el('eq').classList.toggle('on', Boolean(radio.current.bpm) && !presentation.static);
    }
    const minutes = (night ? 23 * 60 + 17 : 18 * 60 + 42) + Math.floor(elapsed / 4);
    const day = ['THU', 'FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED'][Math.floor(minutes / 1440) % 7];
    text('clock', `${timePart(Math.floor(minutes / 60) % 24)}:${timePart(minutes % 60)} / ${day}`);
    el('dialogue').hidden = !presentation.dialogue;
    if (presentation.dialogue) {
      text('speaker', presentation.dialogue.speaker);
      text('line', presentation.dialogue.line);
    }
    el('callout').hidden = !progress.flash;
    text('callout', progress.callout);
    text('hint', presentation.hint ?? (vehicle ? 'WASD DRIVE · SPACE DRIFT · SHIFT NITRO · V TUNE · F EXIT'
      : vehicles.nearestHint() || 'CLICK TO LOOK · WASD MOVE · F ENTER · 1–5 WEAPONS · LMB FIRE · R RELOAD'));
  }
  return { update };
}
