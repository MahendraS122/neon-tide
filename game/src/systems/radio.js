// Three synthesized radio stations and silence share a lightweight WebAudio sequencer.
const stations = [
  { station: 'SOLARA FM', song: 'Kite Arc — Tidal Static', bpm: 115,
    notes: [45, 45, 48, 43, 45, 52, 48, 43] },
  { station: 'NIGHT SIGNAL', song: 'Dusk Relay — Blue Exit', bpm: 94,
    notes: [42, 45, 49, 40, 42, 52, 49, 45] },
  { station: 'LOW TIDE AM', song: 'Paper Suns — Coral Steps', bpm: 132,
    notes: [48, 55, 52, 57, 46, 53, 50, 55], voice: 'square' },
  { station: 'RADIO OFF', song: 'Q / E tune' }
];

export function createRadio() {
  let context;
  let index = 0;
  let tick = 0;
  let step = 0;
  let driving = false;
  function unlock() {
    if (!driving || !stations[index].bpm) return;
    context ??= new AudioContext();
    if (context.state === 'suspended') context.resume().catch(() => {});
  }
  addEventListener('keydown', unlock);
  addEventListener('pointerdown', unlock);
  function tone(note, time, duration, gain, type) {
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    volume.gain.setValueAtTime(0.001, time);
    volume.gain.exponentialRampToValueAtTime(gain, time + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.01);
  }
  function update(dt, enabled) {
    driving = enabled;
    if (!enabled || !stations[index].bpm) return;
    tick -= dt;
    if (tick > 0) return;
    const { bpm, notes, voice = 'triangle' } = stations[index];
    tick += 30 / bpm;
    const beat = step++;
    if (context?.state !== 'running') return;
    const time = context.currentTime;
    const note = notes[beat % notes.length];
    tone(note, time, tick * 0.92, voice === 'square' ? .023 : .045, voice);
    if (beat % 2 === 0) tone(31, time, 0.15, 0.05, 'sine');
    if (beat % 4 !== 2) tone(note + 19, time + 0.02, tick, 0.017, 'sine');
  }
  return {
    update,
    cycle(direction = 1) {
      index = (index + direction + stations.length) % stations.length;
      tick = step = 0;
    },
    get current() { return stations[index]; }
  };
}
