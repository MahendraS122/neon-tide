// The full-screen atlas pairs live navigation with the Solara story dossier.
import { storyMissions } from '../missions/story.js';
import { objectivePlans } from '../missions/objectives.js';
import { atlasSites, tideTokens } from '../world/locations.js';
import { drawPortrait } from './portraits.js';
import { drawAtlas, roadRoute } from './atlasDrawing.js';

export function createCityMap({ city, player, progress, missions }) {
  const root = document.createElement('section');
  root.id = 'city-map';
  root.hidden = true;
  root.innerHTML = `<header><div><small>NEON TIDE / FIELD ATLAS</small><h1>PORT SOLARA</h1></div>
    <button type="button">M / CLOSE</button></header><div class="atlas-grid">
    <aside><h2>STORY <span></span></h2><ol></ol><article class="atlas-job"></article></aside>
    <canvas aria-label="Port Solara street atlas"></canvas>
    <aside><h2>LEGEND</h2><ul></ul><h2>STATS</h2><dl></dl></aside></div>`;
  document.body.append(root);
  const canvas = root.querySelector('canvas');
  const list = root.querySelector('ol');
  const job = root.querySelector('.atlas-job');
  const stats = root.querySelector('dl');
  const count = root.querySelector('h2 span');
  const contacts = storyMissions.map((mission, index) => ({ name: mission.contact,
    icon: '!', color: '#c5a6ff', x: objectivePlans[index].position[0], z: objectivePlans[index].position[1] }));
  const categories = ['Property / Save', 'Garage / Respray', 'Street Race', 'Hospital', 'Weapons Shop'];
  const legend = [...atlasSites.map((site, i) => ({ ...site, name: categories[i] ?? site.name })),
    { name: 'Story contact', icon: '!', color: '#c5a6ff' }, { name: 'Tide token', icon: '◆', color: '#6edfe6' },
    { name: 'GPS route', icon: '━', color: '#98ff63' }];
  root.querySelector('ul').innerHTML = legend.map(site =>
    `<li><b style="color:${site.color}">${site.icon}</b>${site.name}</li>`).join('');
  let preview = false;

  function redraw() {
    const collected = progress.tokens ?? [];
    const tokens = tideTokens.flatMap(([x, z], index) => collected.includes(index) ? [] :
      [{ x, z, color: '#6edfe6', icon: '◆' }]);
    const target = preview ? { x: 100, z: -112 } : missions.blips[0]?.position;
    const from = (player.vehicle ?? player).position;
    const sites = [...tokens, ...contacts.filter((_, i) => ![3, 4, 6].includes(i)), ...atlasSites];
    drawAtlas(canvas, city, player, sites, target ? roadRoute(city, from, target) : []);
  }

  function open(demo = false) {
    preview = demo;
    const completed = demo ? 4 : missions.completed.length;
    const current = demo ? 4 : missions.index;
    const presentation = demo ? { name: 'Hot Wire', objective: 'Reach race gate 2 / 4',
      stage: 38, timer: '01:24' } : missions.presentation();
    count.textContent = `${completed} / 8`;
    list.replaceChildren();
    storyMissions.forEach((mission, index) => {
      const state = index < completed ? 'Complete' : index === current ? 'In progress' : 'Locked';
      const row = document.createElement('li');
      row.dataset.state = state;
      row.innerHTML = `<canvas width="40" height="40"></canvas><div><strong>${mission.title}</strong>
        <small>CH ${mission.chapter} · $${mission.reward.toLocaleString('en-US')}</small></div><em>${state}</em>`;
      drawPortrait(row.querySelector('canvas').getContext('2d'), mission.contact, 0, 0, 40, 40);
      list.append(row);
    });
    job.innerHTML = `<h2>CURRENT JOB <span>${presentation.timer ?? ''}</span></h2>
      <strong>${presentation.name}</strong><p>${presentation.objective}</p>
      <div class="atlas-meter"><i style="width:${presentation.stage}%"></i></div>`;
    const values = { Cash: `$${(demo ? 12480 : progress.cash).toLocaleString('en-US')}`,
      Respect: demo ? 58 : progress.respect, Missions: `${completed} / 8`,
      'Cars stolen': demo ? 11 : (progress.stolen ?? 0),
      'Tide tokens': `${demo ? 3 : (progress.tokens?.length ?? 0)} / ${tideTokens.length}`,
      Properties: 1 };
    stats.innerHTML = Object.entries(values).map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('');
    if (document.pointerLockElement) document.exitPointerLock();
    root.hidden = false;
    redraw();
  }

  function close() {
    root.hidden = true;
  }

  root.querySelector('button').onclick = close;
  addEventListener('resize', () => { if (!root.hidden) redraw(); });
  return { open, close, get active() { return !root.hidden; } };
}
