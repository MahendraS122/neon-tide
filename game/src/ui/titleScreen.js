// Draw the title over a staged sunset view of the playable coast.
import { drawPortrait, portraitNames } from './portraits.js';

// Create the title menu, its controls panel, and the staged camera update.
export function createTitleScreen({ player, camera, hero, onStart, saveDetail, shot }) {
  const root = document.createElement('main');
  root.id = 'title-screen';
  root.innerHTML = `<canvas id="title-art"></canvas><nav id="title-menu" aria-label="Main menu"></nav>
    <aside id="title-quick"><h2>HOW TO PLAY</h2><p><kbd>WASD</kbd> Move / Drive</p>
    <p><kbd>F</kbd> Enter / Exit car</p><p><kbd>J / M</kbd> Jobs / Atlas</p></aside>
    <section id="title-controls" hidden></section>`;
  document.body.append(root);
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const menu = root.querySelector('nav');
  const panel = root.querySelector('section');
  const parked = hero.position.clone();
  const parkedYaw = hero.yaw;
  let active = true;
  let elapsed = 0;
  let glow = true;

  function launch(continuing) {
    if (shot) return;
    active = false;
    root.hidden = true;
    hero.position.copy(parked);
    hero.yaw = parkedYaw;
    hero.root.rotation.y = parkedYaw;
    removeEventListener('resize', resize);
    onStart(continuing);
  }

  function button(label, detail, action, disabled = false) {
    const element = document.createElement('button');
    element.type = 'button';
    element.disabled = disabled;
    element.innerHTML = `${label}<small>${detail}</small>`;
    element.addEventListener('click', action);
    menu.append(element);
  }

  function showMenu() {
    panel.hidden = true;
    menu.hidden = false;
    menu.replaceChildren();
    const detail = shot ? 'Ch.3 Hot Wire · $12,480 · Day 3 18:42' : saveDetail;
    button('CONTINUE', detail || 'No safehouse save yet', () => launch(true), !detail);
    button('NEW GAME', 'Begin Dex Navarro’s return to Solara', () => launch(false));
    button('CONTROLS', 'Keyboard and driving guide', showControls);
    button('SETTINGS', `Glow: ${glow ? 'ON' : 'OFF'} · press to toggle`, () => {
      glow = !glow;
      draw();
      showMenu();
      menu.lastElementChild.focus();
    });
  }

  function showControls() {
    panel.hidden = false;
    menu.hidden = true;
    panel.innerHTML = `<h2>HOW TO PLAY</h2>
      <p><kbd>WASD</kbd> Walk, steer and drive</p>
      <p><kbd>SHIFT</kbd> Sprint on foot · nitro in a car</p>
      <p><kbd>F</kbd> Enter, steal or exit a vehicle</p>
      <p><kbd>J</kbd> Start or retry a glowing story job</p>
      <p><kbd>1–5 / LMB</kbd> Select and fire · R reload</p>
      <p><kbd>Q / E</kbd> Tune the car radio</p>
      <p><kbd>M / ESC</kbd> Atlas · pause</p>
      <p><kbd>G / K / T</kbd> Workshop · save or shop · race</p>
      <p><kbd>SPACE</kbd> Jump on foot · handbrake in a car</p>
      <button type="button">BACK</button>`;
    const back = panel.querySelector('button');
    back.onclick = () => {
      showMenu();
      menu.children[2].focus();
    };
    back.focus();
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    const width = innerWidth;
    const height = innerHeight;
    ctx.clearRect(0, 0, width, height);
    const shade = ctx.createLinearGradient(0, 0, width * 0.68, 0);
    shade.addColorStop(0, '#151329a8');
    shade.addColorStop(1, '#15132900');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width * 0.68, height);
    ctx.save();
    ctx.shadowColor = glow ? '#6effdf' : 'transparent';
    ctx.shadowBlur = 22;
    ctx.font = `900 italic ${Math.min(106, width * 0.10)}px Arial`;
    ctx.fillStyle = '#f6f3e9';
    const baseline = Math.max(95, height * 0.21);
    ctx.fillText('NEON TIDE', 50, baseline);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8dffe7';
    ctx.font = '800 17px Arial';
    ctx.letterSpacing = '7px';
    ctx.fillText('PORT SOLARA', 58, baseline + 35);
    ctx.restore();

    const names = portraitNames();
    const size = Math.min(64, width * 0.09);
    const step = size + 9;
    const top = height - size - 43;
    names.forEach((name, index) => {
      const x = width - step * (names.length - index) - 27;
      ctx.fillStyle = '#081523ef';
      ctx.fillRect(x - 2, top - 2, size + 4, size + 22);
      drawPortrait(ctx, name, x, top, size, size);
      ctx.fillStyle = '#fff4e6';
      ctx.font = '700 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), x + size / 2, top + size + 13, size + 2);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff2de';
    ctx.font = 'bold italic 15px Arial';
    ctx.fillText('EVERY TIDE LEAVES SOMETHING BEHIND.', 50, height - 27);
  }

  function update(dt) {
    if (!active) return;
    elapsed += dt;
    camera.fov = 47;
    camera.position.set(137 + Math.sin(elapsed * 0.15) * 0.44, 2.35, 53);
    camera.lookAt(142, 1.85, 39);
    camera.updateProjectionMatrix();
  }

  hero.root.visible = true;
  hero.position.set(142.9, 0.12, 46.3);
  hero.yaw = -0.77;
  hero.root.rotation.y = hero.yaw;
  player.position.set(139.9, 0.02, 48.1);
  player.character.root.position.copy(player.position);
  player.character.root.visible = true;
  player.character.root.rotation.y = -0.55;
  resize();
  addEventListener('resize', resize);
  showMenu();
  return { update, get active() { return active; } };
}
