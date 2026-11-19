// Neon Tide's canvas title art overlays a slowly drifting view of the live Solara streets.
import { drawPortrait, portraitNames } from './portraits.js';

export function createTitleScreen({ player, camera, hero, onNewGame, onContinue, shot = false }) {
  const root = document.createElement('main');
  root.id = 'title-screen';
  root.innerHTML = '<canvas id="title-art"></canvas><nav id="title-menu" aria-label="Main menu"></nav>' +
    '<section id="title-controls" hidden></section>';
  document.body.append(root);
  const canvas = root.querySelector('#title-art');
  const ctx = canvas.getContext('2d');
  const menu = root.querySelector('#title-menu');
  const panel = root.querySelector('#title-controls');
  let active = true;
  let elapsed = 0;
  let mode = 'menu';
  const settings = { glow: true };

  function button(label, detail, action) {
    const element = document.createElement('button');
    element.type = 'button';
    element.innerHTML = `${label}<small>${detail}</small>`;
    element.addEventListener('click', action);
    menu.append(element);
  }

  function showMenu() {
    mode = 'menu';
    panel.hidden = true;
    menu.replaceChildren();
    button('CONTINUE', 'Ch.3 Hot Wire · $12,480 · Day 3 18:42', () => {
      active = false;
      root.hidden = true;
      onContinue();
    });
    button('NEW GAME', 'Begin Dex Navarro’s return to Solara', () => {
      active = false;
      root.hidden = true;
      onNewGame();
    });
    button('CONTROLS', 'Keyboard and driving guide', showControls);
    button('SETTINGS', `Glow: ${settings.glow ? 'ON' : 'OFF'} · press to toggle`, () => {
      settings.glow = !settings.glow;
      showMenu();
    });
  }

  function showControls() {
    mode = 'controls';
    panel.hidden = false;
    panel.innerHTML = '<h2>HOW TO PLAY</h2>' +
      '<p><kbd>W A S D</kbd> Walk, steer and drive</p>' +
      '<p><kbd>SHIFT</kbd> Sprint on foot · nitro in a car</p>' +
      '<p><kbd>F</kbd> Enter, steal or exit a vehicle</p>' +
      '<p><kbd>J</kbd> Start or retry a glowing story job</p>' +
      '<p><kbd>1–5 / LMB</kbd> Select a weapon and fire · R reload</p>' +
      '<p><kbd>Q / E</kbd> Tune the car radio</p>' +
      '<p><kbd>M / ESC</kbd> Atlas · pause</p>' +
      '<p><kbd>G / K / T</kbd> Workshop · save or shop · race</p>' +
      '<p><kbd>SPACE</kbd> Jump on foot · handbrake in a car</p>' +
      '<button type="button">BACK</button>';
    panel.querySelector('button').addEventListener('click', showMenu);
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    const width = innerWidth;
    const height = innerHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    if (settings.glow) {
      ctx.shadowColor = '#6effdf';
      ctx.shadowBlur = 22;
    }
    ctx.textAlign = 'left';
    ctx.font = `900 italic ${Math.min(84, width * 0.085)}px Arial`;
    ctx.fillStyle = '#f6f3e9';
    ctx.fillText('NEON TIDE', 50, Math.max(95, height * 0.2));
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7cffe0';
    ctx.font = '700 15px Arial';
    ctx.letterSpacing = '7px';
    ctx.fillText('PORT SOLARA', 58, Math.max(124, height * 0.2 + 34));
    ctx.restore();

    const cardNames = portraitNames();
    const cardWidth = Math.min(112, width * 0.092);
    const cardHeight = Math.min(142, height * 0.22);
    const gap = 9;
    const startX = width - (cardWidth + gap) * cardNames.length - 34;
    const top = height - cardHeight - 48;
    cardNames.forEach((name, index) => {
      const x = startX + index * (cardWidth + gap);
      ctx.fillStyle = '#081523d9';
      ctx.fillRect(x - 2, top - 2, cardWidth + 4, cardHeight + 30);
      drawPortrait(ctx, name, x, top, cardWidth, cardHeight);
      ctx.fillStyle = '#fff4e6';
      ctx.font = '700 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), x + cardWidth / 2, top + cardHeight + 17, cardWidth + 2);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8eee5';
    ctx.font = 'italic 14px Arial';
    ctx.fillText('EVERY TIDE LEAVES SOMETHING BEHIND.', 50, height - 27);
    if (mode === 'menu') {
      ctx.fillStyle = '#8bf5dc';
      ctx.font = '700 9px Arial';
      ctx.fillText('AN OPEN CITY · A DEEP BLUE HORIZON', 50, height * 0.42);
    }
  }

  function update(dt) {
    if (!active) return;
    elapsed += dt;
    if (!shot) {
      camera.position.x = 118 + Math.sin(elapsed * 0.09) * 1.4;
      camera.position.y = 8.5 + Math.sin(elapsed * 0.12) * 0.25;
      camera.position.z = 37 + Math.cos(elapsed * 0.08) * 1.2;
      camera.lookAt(102, 2.3, 4);
    }
    draw();
  }

  if (hero) {
    hero.root.visible = true;
    hero.position.set(104.6, 0.12, 10);
    hero.yaw = Math.PI;
    hero.root.rotation.y = hero.yaw;
    hero.driverHead.visible = true;
  }
  player.position.set(109, 0.22, 15.3);
  player.character.root.position.copy(player.position);
  player.character.root.visible = true;
  player.character.root.rotation.y = Math.PI - 0.18;
  resize();
  addEventListener('resize', resize);
  showMenu();
  return { update, hide() { active = false; root.hidden = true; },
    get active() { return active; }, get root() { return root; } };
}
