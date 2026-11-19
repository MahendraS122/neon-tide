// One versioned safehouse slot stores campaign, economy, clock and the garage car.
import { chapterForMission } from '../missions/story.js';
import { clockLabel } from './clock.js';

const key = 'neon-tide.slot.v1';

/** Provide validated read, write, restore and title-detail operations for the save slot. */
export function createSave({ progress, missions, cityClock, garage }) {
  function read() {
    try {
      const slot = JSON.parse(localStorage.getItem(key));
      if (slot?.version !== 1 || !Number.isFinite(slot.cash) || !Number.isInteger(slot.index)) return null;
      return slot;
    } catch {
      return null;
    }
  }

  function write() {
    const { cash, respect, stolen, tokens, races } = progress;
    const slot = { version: 1, cash, respect, stolen, tokens, races, index: missions.index,
      minutes: cityClock.minutes, vehicle: garage.snapshot() };
    try {
      localStorage.setItem(key, JSON.stringify(slot));
      return true;
    } catch {
      return false;
    }
  }

  function load() {
    const slot = read();
    if (!slot) return false;
    const { cash, respect, stolen, tokens, races } = slot;
    Object.assign(progress, { cash, respect, stolen, tokens, races });
    cityClock.restore(slot.minutes);
    garage.restore(slot.vehicle);
    missions.restore(slot.index);
    return true;
  }

  function detail() {
    const slot = read();
    if (!slot) return '';
    const chapter = chapterForMission(slot.index);
    return `Ch.${chapter.number} ${chapter.name} · $${slot.cash.toLocaleString('en-US')} · ${clockLabel(slot.minutes)}`;
  }
  return { write, load, detail };
}
