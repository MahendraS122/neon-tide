// Full-city atlas paints the real grid, districts, services, story state and road-following GPS.
import { ROADS, CITY, BLOCK_HALF } from '../config.js';
import { DISTRICTS } from '../world/cityGen.js';
import { STORY, CHAPTERS } from '../missions/story.js';
import { drawPortrait } from './portraits.js';
export const MAP_ICONS =[['safehouse', 'H', '#87e6c1', 'Safehouse'],['garage', 'G', '#f4b36b', 'Garage / respray'],
['mission', 'M', '#ffe18b', 'Story contact'],['weapons', 'W', '#ef869c', 'Weapons'],['race', 'R',
'#c29df5', 'Street race'],['hospital', '+', '#f29095', 'Hospital'],['police', 'P', '#7eaefa', 'Police station'],
['token', 'T', '#73e9eb', 'Tide token'],];
export function gpsRoute(from, target) { if (!target) return[];
const nearest = value => ROADS.reduce((a, b) => Math.abs(b - value) < Math.abs(a - value) ? b: a);
const roadZ = nearest(from.z);
const endX = nearest(target[0]);
return[[from.x, from.z],[from.x, roadZ],[endX, roadZ],[endX, target[1]], target];
} export function createCityMap(game) { const root = document.createElement('section');
root.id = 'city-map';
root.className = 'screen';
root.hidden = true;
root.innerHTML = `
    <header class="atlas-head"><div><b>PORT SOLARA</b><small>CITY ATLAS / STORY & SERVICES</small></div>
      <span class="atlas-clock"></span><button>M / ESC · BACK</button></header>
    <div class="atlas-body"><aside class="story-list"><h3>STORY <span>04 CHAPTERS / 08 JOBS</span></h3>
      <div class="mission-list"></div><section class="atlas-stats"></section></aside>
      <main class="map-area"><canvas></canvas><div class="map-caption">SOLARA COUNTY / FLORIDA COAST</div>
        <div class="map-north">N ↑</div><div class="map-scale">━━━━ 100 M</div>
        <div class="map-hint">CLICK MAP · SET GPS WAYPOINT</div></main>
      <aside class="atlas-right"><section class="current-job"></section><h3>LEGEND</h3>
        <div class="map-legend"></div><div class="atlas-note">THE TIDE TURNS.<br>MAKE YOUR MOVE.</div>
      </aside></div>`;
document.body.append(root);
const canvas = root.querySelector('canvas');
const context = canvas.getContext('2d');
let previousMode = 'play';
let projection = null;
let waypoint = null;
const colors = { port: '#364950', glass: '#384757', deco: '#46565b', apartment: '#40544e' };
function icons() {
  const landmarks = game.world.landmarks;
  const list =[{ ...landmarks.safehouse, kind: 'safehouse' }, { ...landmarks.garage, kind: 'garage' },
  { x: - 188, z: 0, kind: 'weapons' }, { x: 0, z: 188, kind: 'hospital' }, { x: 94, z: 94, kind:
  'police' }, { ...(game.races?.startPoint ?? { x: - 282, z: - 94 }), kind: 'race' },];
  STORY.forEach((mission, index) => {
    if (index <= game.missions.state.completed.length) {
      list.push({ x: mission.start[0], z: mission.start[1], kind: 'mission' });
    }
  });
  for (const token of game.collectibles?.remaining() ??[]) list.push({ ...token, kind: 'token' });
  return list;
}
function draw() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);
  canvas.width = w * 2;
  canvas.height = h * 2;
  context.setTransform(2, 0, 0, 2, 0, 0);
  const c = context;
  const scale = Math.min((w - 42) / 940,(h - 72) / 750);
  const px = x => w / 2 +(x + 100) * scale;
  const py = z => h / 2 - z * scale;
  projection = { scale, px, py, w, h };
  c.fillStyle = '#102c3b';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = '#8ab8bf0d';
  c.lineWidth = 1;
  for (let x = 0; x < w; x += 30) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  c.fillStyle = '#798879';
  c.fillRect(px(CITY.waterX), py(350),(350 - CITY.waterX) * scale, 700 * scale);
  c.fillStyle = '#b6aa80';
  c.fillRect(px(CITY.waterX), py(350),(CITY.promenadeX - CITY.waterX) * scale, 700 * scale);
  c.fillStyle = '#788e87';
  c.fillRect(px(CITY.promenadeX - 20), py(350), 40 * scale, 700 * scale);
  for (const block of game.world.blocks) {
    const park =(block.col === 1 && block.row === 5) ||(block.col === 3 && block.row === 4);
    c.fillStyle = park ? '#427364': colors[block.style];
    c.fillRect(px(block.cx - BLOCK_HALF), py(block.cz + BLOCK_HALF), BLOCK_HALF * 2 * scale, BLOCK_HALF * 2 * scale);
    if (!park) {
      c.strokeStyle = '#77928b33';
      c.lineWidth = 1;
      c.strokeRect(px(block.cx - 25), py(block.cz + 25), 50 * scale, 50 * scale);
    }
  }
  c.strokeStyle = '#b6c2b4';
  c.lineWidth = Math.max(3, 9 * scale);
  for (const road of ROADS) {
    c.beginPath();
    c.moveTo(px(road), py(- 329));
    c.lineTo(px(road), py(329));
    c.moveTo(px(- 294), py(road));
    c.lineTo(px(314), py(road));
    c.stroke();
  }
  c.strokeStyle = '#425951';
  c.lineWidth = 1;
  for (const road of ROADS) {
    c.beginPath();
    c.moveTo(px(road), py(- 329));
    c.lineTo(px(road), py(329));
    c.stroke();
  }
  c.fillStyle = '#9b9c88';
  c.fillRect(px(CITY.pierX - CITY.pierLength), py(CITY.pierZ + 9), CITY.pierLength * scale, 18 * scale);
  c.textAlign = 'center';
  c.font = 'italic 12px Arial';
  c.fillStyle = '#87c8d7';
  c.save();
  c.translate(px(- 480), py(- 80));
  c.rotate(- Math.PI / 2);
  c.fillText('S O L A R A   B A Y', 0, 0);
  c.restore();
  for (const district of DISTRICTS) {
    const blocks = game.world.blocks.filter(block => district.cols.includes(block.col) && district.rows.includes(block.row));
    if (!blocks.length) continue;
    const x = blocks.reduce((sum, b) => sum + b.cx, 0) / blocks.length;
    const z = blocks.reduce((sum, b) => sum + b.cz, 0) / blocks.length;
    c.font = 'bold 9px Arial';
    c.lineWidth = 3;
    c.strokeStyle = '#193c39';
    c.fillStyle = '#c7d4c1';
    c.strokeText(district.name.toUpperCase(), px(x), py(z));
    c.fillText(district.name.toUpperCase(), px(x), py(z));
  }
  const position = game.playerRig.player.position;
  const route = gpsRoute(position, waypoint ?? game.missions.target());
  if (route.length) {
    c.strokeStyle = '#ffbe72';
    c.lineWidth = 3;
    c.shadowBlur = 9;
    c.shadowColor = '#ff9c56';
    c.beginPath();
    route.forEach(([x, z], i) => i ? c.lineTo(px(x), py(z)): c.moveTo(px(x), py(z)));
    c.stroke();
    c.shadowBlur = 0;
    const end = route.at(- 1);
    c.strokeRect(px(end[0]) - 6, py(end[1]) - 6, 12, 12);
  }
  for (const icon of icons()) {
    const info = MAP_ICONS.find(entry => entry[0] === icon.kind);
    c.fillStyle = '#102c38';
    c.strokeStyle = info[2];
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(px(icon.x), py(icon.z), icon.kind === 'token' ? 5: 9, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = info[2];
    c.font = 'bold 9px Arial';
    if (icon.kind !== 'token') c.fillText(info[1], px(icon.x), py(icon.z) + 3);
  }
  c.save();
  c.translate(px(position.x), py(position.z));
  c.rotate(game.cameraState.yaw);
  c.fillStyle = '#fff5dd';
  c.strokeStyle = '#0b2430';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, - 12);
  c.lineTo(8, 8);
  c.lineTo(0, 4);
  c.lineTo(- 8, 8);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}
function refreshPanels() {
  const completed = game.missions.state.completed.length;
  const active = game.missions.state.active;
  const list = root.querySelector('.mission-list');
  list.innerHTML = '';
  STORY.forEach((mission, index) => {
    const row = document.createElement('button');
    row.className = `story-row ${index === active ? 'active' : ''}`;
    row.disabled = index > completed;
    const status = index < completed ? 'COMPLETE': index === active ? 'IN PROGRESS': index === completed ?
    'AVAILABLE': 'LOCKED';
    const chapter = Math.floor(index / 2);
    row.innerHTML = `<canvas></canvas><div><small>CH ${chapter + 1} · ${CHAPTERS[chapter]}</small>
      <b>${index + 1}. ${mission.name}</b>
      <span>${status} <em>$${mission.reward.toLocaleString('en-US')}</em></span></div>`;
    drawPortrait(row.querySelector('canvas'), mission.contact, { size: 44 });
    row.onclick = function trackMission() {
      waypoint = mission.start;
      draw();
    };
    list.append(row);
  });
  const mission = game.missions.current();
  const state = game.missions.state;
  const stages = (mission?.stages ?? []).map((_, i) =>
    `<i class="${i <= state.stage ? 'lit' : ''}"></i>`).join('');
  root.querySelector('.current-job').innerHTML = `<h3>CURRENT JOB</h3>
    <h2>${mission?.name ?? 'Free roam'}</h2>
    <small>CHAPTER ${Math.min(4, Math.floor(completed / 2) + 1)}</small>
    <p>${mission?.stages[state.stage]?.text ?? 'Find a story contact or explore the coast.'}</p>
    <div class="job-stage">${stages}</div>
    <strong>${mission ? `STAGE ${state.stage + 1} / ${mission.stages.length}` : 'NO ACTIVE JOB'}</strong>`;
  const stats = game.stats;
  root.querySelector('.atlas-stats').innerHTML = `<h3>STATS</h3><dl>` +[['CASH', `$${game.cash.toLocaleString('en-US')}`],
  ['RESPECT', stats.respect],['MISSIONS', `${completed} / 8`],['CARS STOLEN', stats.carsStolen],
  ['TIDE TOKENS', `${stats.tokens.length} / 24`],['PROPERTIES', stats.properties]].map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('') + '</dl>';
  root.querySelector('.map-legend').innerHTML = MAP_ICONS.map(([, icon, color, label]) => `<div><b style="color:${color};border-color:${color}">${icon}</b>${label}</div>`).join('');
  const hour = String(Math.floor(game.time.minutes / 60)).padStart(2, '0');
  const minute = String(Math.floor(game.time.minutes % 60)).padStart(2, '0');
  root.querySelector('.atlas-clock').textContent = `DAY ${game.time.day} / ${hour}:${minute}`;
}
function show() {
  previousMode = game.mode === 'pause' ? 'pause': 'play';
  game.mode = 'map';
  root.hidden = false;
  game.hud.showHud(false);
  document.exitPointerLock?.();
  refreshPanels();
  draw();
}
function hide() {
  root.hidden = true;
  game.mode = previousMode;
  game.hud.showHud(previousMode === 'play');
}
root.querySelector('header button').onclick = hide;
canvas.onclick = function setWaypoint(event) {
  const rect = canvas.getBoundingClientRect();
  waypoint =[Math.max(- 350, Math.min(320,(event.clientX - rect.left - projection.w / 2) / projection.scale - 100)),
  Math.max(- 330, Math.min(330, -(event.clientY - rect.top - projection.h / 2) / projection.scale))];
  draw();
};
window.addEventListener('resize', function resizeMap() {
  if (!root.hidden) draw();
});
return { show, hide, draw, icons, get waypoint() {
  return waypoint;
}
};
}
