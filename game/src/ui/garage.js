// The workshop menu exposes tuning, repairs and paint without moving the car.
import { paints, upgrades } from '../world/garages.js';

export function createGarageMenu(garage, progress) {
  const root = document.createElement('section');
  root.className = 'service-menu';
  root.hidden = true;
  root.innerHTML = `<small>PORT SOLARA / WORKSHOP</small><h2>Marina Motor Works</h2>
    <p class="service-detail"></p><div class="swatches" aria-label="Paint colours"></div>
    <div class="service-actions"></div><p role="status"></p>`;
  document.body.append(root);
  const detail = root.querySelector('.service-detail');
  const status = root.querySelector('[role="status"]');
  const actions = root.querySelector('.service-actions');

  function displayCash() {
    detail.textContent = `Respray $200 · Balance $${progress.cash.toLocaleString('en-US')}`;
  }
  function buy(id, color) {
    status.textContent = garage.service(id, color);
    displayCash();
  }
  function close() {
    root.hidden = true;
  }
  function addButton(parent, label, action) {
    const button = document.createElement('button');
    button.textContent = label;
    button.onclick = action;
    parent.append(button);
    return button;
  }
  for (const paint of paints) {
    const button = addButton(root.querySelector('.swatches'), `Paint ${paint}`, () => buy('paint', paint));
    button.setAttribute('aria-label', button.textContent);
    button.textContent = '';
    button.style.background = paint;
  }
  for (const part of upgrades) {
    const button = addButton(actions, `${part.name} · $${part.price}`, () => buy(part.id));
    button.title = part.detail;
  }
  addButton(actions, 'Repair & clear SPD · $300', () => buy('repair'));
  addButton(actions, 'Leave workshop', close);
  return { close, open() {
    if (document.pointerLockElement) document.exitPointerLock();
    status.textContent = '';
    displayCash();
    root.hidden = false;
  }, get active() { return !root.hidden; } };
}
