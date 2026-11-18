// Live city title scene, procedural neon logo, cast cards and accessible menus.
import { drawPortrait, PORTRAITS } from './portraits.js';
import { CHAPTERS, STORY } from '../missions/story.js';
export function createTitleScreen(game) { const root = document.createElement('section');
root.id = 'title-screen';
root.className = 'screen';
root.hidden = true;
root.innerHTML = `
    <div class="title-shade"></div>
    <div class="title-left">
      <div class="eyebrow">AN ORIGINAL OPEN WORLD CRIME STORY</div>
      <canvas id="neon-logo" width="1100" height="320" role="img" aria-label="Neon Tide: Port Solara"></canvas>
      <div class="title-rule">SIX YEARS INSIDE. ONE CITY LEFT TO LOSE.</div>
      <nav aria-label="Main menu">
        <button class="menu-button" data-action="continue">CONTINUE<small></small></button>
        <button class="menu-button" data-action="new">NEW GAME</button>
        <button class="menu-button" data-action="controls">CONTROLS</button>
        <button class="menu-button" data-action="settings">SETTINGS</button>
      </nav>
      <div class="how-play"><b>HOW TO PLAY</b><p>WASD · MOVE / DRIVE　 F · ENTER CAR<br>
        M · CITY MAP　 ENTER · TALK / START JOB<br>
        MOUSE · AIM / FIRE　 SPACE · HANDBRAKE<br>
        SHIFT · SPRINT　 R · RELOAD　 ESC · PAUSE</p></div>
    </div>
    <div class="cast-lineup"><header>THE PEOPLE WHO OWN YOUR TOMORROW</header><div></div></div>
    <footer><span>EVERY DEBT HAS A SHORELINE.</span><small>PORT SOLARA · STORY MODE · OFFLINE</small></footer>`;
document.body.append(root);
const modal = document.createElement('section');
modal.className = 'screen options-screen';
modal.hidden = true;
document.body.append(modal);
const logo = root.querySelector('canvas').getContext('2d');
const wordmark = 'NEON TIDE';
logo.textAlign = 'left';
logo.font = 'italic 900 205px Arial';
const bounds = logo.measureText(wordmark);
const logoX = 12 + bounds.actualBoundingBoxLeft;
const logoWidth = Math.min(1060, bounds.actualBoundingBoxLeft + bounds.actualBoundingBoxRight);
logo.lineWidth = 5;
logo.shadowBlur = 46;
logo.shadowColor = '#ff59a6';
logo.strokeStyle = '#ffb3d2';
logo.strokeText(wordmark, logoX, 190, 1060);
const gradient = logo.createLinearGradient(0, 60, 0, 225);
gradient.addColorStop(0, '#fff3d4');
gradient.addColorStop(0.56, '#ffb9b2');
gradient.addColorStop(1, '#ed3d89');
logo.fillStyle = gradient;
logo.fillText(wordmark, logoX, 190, 1060);
logo.textAlign = 'center';
logo.font = '500 58px Arial';
logo.fillStyle = '#72f8e0';
logo.shadowColor = '#24e9ce';
logo.shadowBlur = 24;
logo.fillText('P O R T   S O L A R A', 12 + logoWidth * .5, 272);
const cast = root.querySelector('.cast-lineup > div');
for (const key of['dex', 'mara', 'nina', 'tavo', 'garza', 'hollis']) {
  const card = document.createElement('article');
  card.innerHTML = `<canvas></canvas><b>${PORTRAITS[key].name}</b><small>${PORTRAITS[key].role}</small>`;
  drawPortrait(card.querySelector('canvas'), key, { size: 110 });
  cast.append(card);
}
let elapsed = 0;
function show() {
  game.mode = 'title';
  root.hidden = false;
  game.hud.showHud(false);
  game.hud.hideLoading();
  game.hud.hideBanner();
  game.playerRig.exitVehicle();
  game.playerRig.teleport(- 278, 190, - 0.6);
  const hero = game.lastVehicle;
  hero.position.set(- 283, game.world.groundHeight(- 283, 188), 188);
  hero.heading = - 0.65;
  hero.velocity.set(0, 0, 0);
  hero.updateModel();
  game.sky.setTime('day');
  const saved = game.save?.read();
  const button = root.querySelector('[data-action="continue"]');
  button.disabled = !saved;
  const completed = saved?.missions?.completed?.length ?? 0;
  const chapter = Math.min(3, Math.floor(completed / 2));
  const minutes = Math.floor(saved?.time?.minutes ?? 1100);
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  button.querySelector('small').textContent = saved
    ? `CH ${chapter + 1} · ${CHAPTERS[chapter]} / ${STORY[completed]?.name ?? 'Free roam'}\n`
      + `$${saved.cash.toLocaleString('en-US')} · DAY ${saved.time.day} · ${hour}:${minute}`
    : 'NO SAVE YET · START YOUR STORY';
  document.exitPointerLock?.();
  update(0);
}
function hide() {
  root.hidden = true;
  game.mode = 'play';
  game.playerRig.figure.root.scale.setScalar(1);
  game.hud.showHud(true);
}
function controls() {
  modal.hidden = false;
  modal.innerHTML = `<div class="modal-card"><h1>HOW TO PLAY</h1>
      <p>WASD / arrows — Move and drive<br>Mouse — Camera / left click fire / right click aim<br>
      F — Enter or leave a car<br>Shift — Sprint / careful steering<br>Space — Jump / handbrake<br>
      1–5 — Weapon slots · R — Reload<br>Enter — Talk / start job / advance dialogue<br>
      M — City map / GPS · G — Garage when nearby<br>Q / E — Radio station · N — Nitro<br>
      H — Save at safehouse · Esc — Pause / close menu<br>
      Follow the turquoise marker. Mission cars must survive. Lose police by breaking their sight.</p>
      <button class="menu-button">BACK</button></div>`;
  modal.querySelector('button').onclick = closeOptions;
}
function settings() {
  modal.hidden = false;
  modal.innerHTML = `<div class="modal-card"><h1>SETTINGS</h1>
      <p><label>RADIO VOLUME <input id="volume" type="range" min="0" max="1" step="0.05"
      value="${game.settings.volume}"></label></p>
      <p><label>CAMERA SENSITIVITY <input id="sensitivity" type="range" min="0.4" max="2"
      step="0.1" value="${game.settings.sensitivity}"></label></p>
      <p><label><input id="shadows" type="checkbox" ${game.view.renderer.shadowMap.enabled ? 'checked' : ''}>
      DYNAMIC SHADOWS</label></p><button class="menu-button">BACK</button></div>`;
  modal.querySelector('#volume').oninput = function setVolume(event) {
    game.settings.volume = Number(event.target.value);
    game.radio?.setVolume(game.settings.volume);
  };
  modal.querySelector('#sensitivity').oninput = function setSensitivity(event) {
    game.settings.sensitivity = Number(event.target.value);
  };
  modal.querySelector('#shadows').onchange = function setShadows(event) {
    game.view.renderer.shadowMap.enabled = event.target.checked;
    game.view.renderer.shadowMap.needsUpdate = true;
    game.view.scene.traverse(function refreshMaterials(object) {
      for (const material of[object.material].flat()) if (material) material.needsUpdate = true;
    });
  };
  modal.querySelector('button').onclick = closeOptions;
}
function closeOptions() {
  modal.hidden = true;
}
root.querySelector('nav').onclick = function menuClick(event) {
  const action = event.target.closest('button')?.dataset.action;
  if (action === 'new') {
    hide();
    game.newGame?.();
  }
  if (action === 'continue' && game.save?.load()) hide();
  if (action === 'controls') controls();
  if (action === 'settings') settings();
  game.radio?.unlock();
};
function update(dt) {
  elapsed += dt;
  const camera = game.view.camera;
  camera.position.set(- 270 + Math.sin(elapsed * 0.12) * 1.5, 2.8, 198);
  camera.lookAt(- 283, 1.6, 188);
  camera.updateMatrixWorld();
  game.playerRig.figure.root.scale.setScalar(1.16);
  game.view.focusShadows(- 282, 188);
  game.sky.update(camera);
}
return {
  show, hide, update, controls, settings, closeOptions, get optionsOpen() {
    return !modal.hidden;
  }
};
}
