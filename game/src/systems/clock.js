// Accelerated calendar drives the HUD, sunset palette and smooth daylight intensity.
const DAYS =['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export function createClock(game) { let palette = '';
let display = '';
function refresh() {
  const time = game.time;
  time.dayName = DAYS[(time.day - 1) % DAYS.length];
  const hours = Math.floor(time.minutes / 60);
  const minutes = Math.floor(time.minutes % 60);
  const text = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const key = `${time.day}:${text}`;
  if (key !== display) {
    game.hud.setClock(time.day, time.dayName, text);
    display = key;
  }
  const next = hours >= 20 || hours < 6 ? 'night': 'day';
  if (next !== palette) {
    game.sky.setTime(next);
    palette = next;
  }
  const light = game.view.state.sunLight;
  if (light) {
    const daylight = Math.max(0, Math.sin((time.minutes / 1440 - 0.25) * Math.PI * 2));
    light.intensity = 0.55 + daylight * 3.0;
  }
}
function update(dt) {
  game.time.minutes += dt * 0.6;
  if (game.time.minutes >= 1440) {
    game.time.minutes -= 1440;
    game.time.day ++;
  }
  refresh();
}
return { update, refresh };
}
