// Escape pauses simulation; nested map and settings return to the paused session.
export function createPauseMenu(game) { const root = document.createElement('section');
root.id = 'pause-menu';
root.className = 'screen pause-screen';
root.hidden = true;
root.innerHTML = `<div class="modal-card"><small>NEON TIDE / PORT SOLARA</small><h1>PAUSED</h1>
    <p>Take a breath. The city can wait.</p><button class="menu-button" data-action="resume">RESUME</button>
    <button class="menu-button" data-action="map">CITY MAP</button>
    <button class="menu-button" data-action="settings">SETTINGS</button>
    <button class="menu-button" data-action="save">SAVE AT SAFEHOUSE</button>
    <button class="menu-button" data-action="quit">QUIT TO TITLE</button><p class="pause-status"></p></div>`;
document.body.append(root);
function show() {
  game.mode = 'pause';
  root.hidden = false;
  game.hud.showHud(false);
  document.exitPointerLock?.();
  root.querySelector('.pause-status').textContent = 'Jobs pause here. Save between jobs at your safehouse.';
}
function hide() {
  root.hidden = true;
  game.mode = 'play';
  game.hud.showHud(true);
}
root.onclick = function choose(event) {
  const action = event.target.closest('button')?.dataset.action;
  if (action === 'resume') hide();
  if (action === 'map') game.cityMap.show();
  if (action === 'settings') game.title.settings();
  if (action === 'save') {
    root.querySelector('.pause-status').textContent = game.save.save() ? 'GAME SAVED': 'Save requires the safehouse, no wanted level, and no active job.';
  }
  if (action === 'quit') {
    hide();
    game.title.show();
  }
};
return { show, hide };
}
