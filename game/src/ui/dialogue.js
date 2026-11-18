// Queued, letterboxed conversations pause the world and reveal each line progressively.
import { drawPortrait, PORTRAITS } from './portraits.js';
export function createDialogue(game) { const root = document.createElement('section');
root.id = 'cutscene';
root.hidden = true;
root.innerHTML = `
    <div class="cinema-top"><span>NEON TIDE / PORT SOLARA</span><span>STORY</span></div>
    <div class="cinema-bottom">
      <canvas width="104" height="104"></canvas>
      <div class="speech"><small></small><h2></h2><p></p></div>
      <button>ENTER · CONTINUE</button>
    </div>`;
document.body.append(root);
const portrait = root.querySelector('canvas');
const name = root.querySelector('h2');
const role = root.querySelector('small');
const text = root.querySelector('p');
let queue =[];
let elapsed = 0;
let line = '';
let complete = null;
function advance() {
  if (elapsed * 38 < line.length) {
    elapsed = line.length / 38 + 1;
    text.textContent = line;
    return;
  }
  const next = queue.shift();
  if (!next) {
    root.hidden = true;
    game.mode = 'play';
    const callback = complete;
    complete = null;
    callback?.();
    return;
  }
  const[key, words] = next;
  const speaker = PORTRAITS[key];
  drawPortrait(portrait, key, { size: 104 });
  name.textContent = speaker.name;
  role.textContent = speaker.role;
  name.style.color = speaker.accent;
  line = words;
  elapsed = 0;
  text.textContent = '';
}
function play(lines, callback) {
  queue = lines.map(item =>[...item]);
  complete = callback;
  line = '';
  elapsed = 0;
  root.hidden = false;
  game.mode = 'dialogue';
  document.exitPointerLock?.();
  advance();
}
function update(dt, input) {
  if (root.hidden) return;
  elapsed += dt;
  text.textContent = line.slice(0, Math.floor(elapsed * 38));
  if (input.pressed('Enter') || input.pressed('Space')) advance();
}
root.querySelector('button').onclick = advance;
return { play, update, get active() {
  return !root.hidden;
}
};
}
