// Letterboxed dialogue queues original cast performances and reveals each line at speaking pace.
import { drawPortrait } from './portraits.js';

export function createDialogue() {
  const canvas = document.createElement('canvas');
  canvas.id = 'story-dialogue';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9;pointer-events:none';
  document.body.append(canvas);
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener('resize', resize);
  resize();
  const context = canvas.getContext('2d');
  const queue = [];
  let current = null;
  let visible = 0;
  let elapsed = 0;
  let active = false;
  let advance = false;
  const onKeydown = event => {
    if (active && !event.repeat && ['Enter', 'Space', 'KeyF'].includes(event.code)) advance = true;
  };
  addEventListener('keydown', onKeydown);

  function enqueue(lines) {
    queue.push(...lines.map(([name, words, title = 'CONTACT']) => ({ name, words, title })));
    if (!current) next();
    active = true;
  }

  function next() {
    current = queue.shift() ?? null;
    visible = 0;
    elapsed = 0;
    if (!current) active = false;
  }

  function draw() {
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    if (!active || !current) return;
    context.fillStyle = '#070c18dc';
    context.fillRect(0, 0, width, 77);
    context.fillRect(0, height - 183, width, 183);
    context.fillStyle = '#52f4d6';
    context.fillRect(0, height - 183, 5, 183);
    drawPortrait(context, current.name, 54, height - 164, 110, 110);
    context.fillStyle = '#9af8df';
    context.font = '700 12px Arial';
    context.textAlign = 'left';
    context.fillText(`${current.name.toUpperCase()}  /  ${current.title}`, 190, height - 132);
    context.fillStyle = '#fff7e9';
    context.font = '22px Arial';
    context.fillText(current.words.slice(0, visible), 190, height - 91, width - 260);
    context.fillStyle = '#ffd180';
    context.font = '10px Arial';
    context.textAlign = 'right';
    context.fillText(visible < current.words.length ? 'ENTER TO SKIP' : 'ENTER TO CONTINUE', width - 48,
      height - 38);
  }

  function update(dt) {
    if (current) {
      elapsed += dt;
      visible = Math.min(current.words.length, Math.floor(elapsed * 42));
      if (advance) {
        if (visible < current.words.length) {
          visible = current.words.length;
          elapsed = current.words.length / 42;
        }
        else next();
      }
    }
    advance = false;
    draw();
  }

  draw();
  return { enqueue, update, get active() { return active; } };
}
