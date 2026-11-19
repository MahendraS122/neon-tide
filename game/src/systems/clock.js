// A saved city clock advances one game minute every four seconds of active play.
const DAY_MINUTES = 1440;

export function createClock() {
  let minutes = 18 * 60 + 42;
  return {
    update(dt) { minutes += dt / 4; },
    restore(value) { if (Number.isFinite(value) && value >= 0) minutes = value; },
    get minutes() { return minutes; },
    get night() { return minutes % DAY_MINUTES >= 1200 || minutes % DAY_MINUTES < 360; },
    get label() { return clockLabel(minutes); }
  };
}

export function clockLabel(minutes) {
  const part = value => String(Math.floor(value)).padStart(2, '0');
  return `Day ${1 + Math.floor(minutes / DAY_MINUTES)} ${part(minutes / 60 % 24)}:${part(minutes % 60)}`;
}
