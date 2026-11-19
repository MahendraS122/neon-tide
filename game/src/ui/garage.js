// Build the workshop menu for tuning, repairs, and paint.
import { paints, upgrades } from '../world/garages.js';

export function createGarageMenu(garage, progress, game = null) {
  const root = document.createElement('section');
  root.className = 'service-menu garage-menu';
  root.hidden = true;
  root.innerHTML = `<small>PORT SOLARA / WORKSHOP</small><h2>Marina Motor Works</h2>
    <p class="service-detail"></p><div class="service-actions"></div>
    <p class="paint-label">CUSTOM PAINT · $200</p><div class="swatches" aria-label="Paint colours"></div>
    <div class="garage-actions"></div><p role="status"></p>`;
  document.body.append(root);
  const detail = root.querySelector('.service-detail');
  const status = root.querySelector('[role="status"]');
  const actions = root.querySelector('.service-actions');
  const garageActions = root.querySelector('.garage-actions');

  function refresh() {
    const respect = Math.max(0, Math.floor(progress.respect));
    const rank = Math.min(3, Math.floor(respect / 25));
    detail.textContent = `CASH  $${progress.cash.toLocaleString('en-US')}   ·   RESPECT LV ${rank + 1}`;
    const car = (game ?? window.__game)?.player.vehicle;
    actions.replaceChildren();
    for (const [index, part] of upgrades.entries()) {
      const row = document.createElement('div');
      row.className = 'upgrade-row';
      const name = document.createElement('span');
      name.textContent = part.name;
      const bar = document.createElement('span');
      bar.className = 'upgrade-stat';
      bar.setAttribute('aria-label', part.detail);
      for (let n = 0; n < 5; n += 1) {
        const segment = document.createElement('i');
        if (n < index + 2) segment.className = 'filled';
        bar.append(segment);
      }
      const price = document.createElement('span');
      price.className = 'upgrade-price';
      price.textContent = `$${part.price}`;
      const equipped = Boolean(car?.upgrades?.[part.id]);
      const button = document.createElement('button');
      button.className = `upgrade-tag${equipped ? ' owned' : ''}`;
      button.textContent = equipped ? 'OWNED' : 'BUY';
      button.disabled = equipped;
      button.title = part.detail;
      button.onclick = () => buy(part.id);
      row.append(name, bar, price, button);
      actions.append(row);
    }
  }
  function buy(id, color) {
    status.textContent = garage.service(id, color);
    refresh();
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
  addButton(garageActions, 'Repair & clear SPD · $300', () => buy('repair'));
  addButton(garageActions, 'Leave workshop', close);
  return { close, open() {
    if (document.pointerLockElement) document.exitPointerLock();
    status.textContent = '';
    refresh();
    root.hidden = false;
  }, get active() { return !root.hidden; } };
}
