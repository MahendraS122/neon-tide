// A saved city clock advances one game minute every four seconds of active play.
export function createClock() {
  let minutes = 18 * 60 + 42;
  return {
    update(dt) { minutes += dt / 4; },
    restore(value) { if (Number.isFinite(value) && value >= 0) minutes = value; },
    get minutes() { return minutes; },
    get night() { return minutes % 1440 >= 1200 || minutes % 1440 < 360; },
    get label() { return clockLabel(minutes); }
  };
}

export function clockLabel(minutes) {
  const part = value => String(Math.floor(value)).padStart(2, '0');
  return `Day ${1 + Math.floor(minutes / 1440)} ${part(minutes / 60 % 24)}:${part(minutes % 60)}`;
}
