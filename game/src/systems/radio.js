// Three original synthesized stations; short lookahead scheduling keeps music smooth offline.
export const STATIONS = [
  { name: 'SUNSET FM 98.6', songs: ['Chrome Palms', 'Coastline Fever', 'Amber Exit'],
    notes: [0, 7, 12, 10, 7, 3, 5, 7], bpm: 104, wave: 'triangle', base: 164.81 },
  { name: 'K-WAVE 104.2', songs: ['Night Bloom', 'Static Hearts', 'Last Light on 5th'],
    notes: [0, 3, 7, 12, 10, 7, 3, -2], bpm: 118, wave: 'sine', base: 146.83 },
  { name: 'LA MAREA 91.3', songs: ['Sal y Sol', 'Puerto de Nadie', 'La Ultima Vuelta'],
    notes: [0, 4, 7, 9, 7, 4, 2, 4], bpm: 112, wave: 'triangle', base: 174.61 },
];

export function createRadio(game) {
  const state = { station: 0, beat: 0, unlocked: false, song: 0 };
  let audio = null;
  let master = null;
  let nextBeat = 0;

  function unlock() {
    if (!audio) {
      const Audio = window.AudioContext ?? window.webkitAudioContext;
      if (!Audio) return;
      audio = new Audio();
      master = audio.createGain();
      master.gain.value = game.settings.volume * 0.16;
      master.connect(audio.destination);
    }
    audio.resume().catch(() => {});
    state.unlocked = true;
    nextBeat = Math.max(nextBeat, audio.currentTime);
  }

  function tone(frequency, start, duration, volume, wave) {
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    oscillator.onended = function releaseNote() { oscillator.disconnect(); envelope.disconnect(); };
  }

  function switchStation(direction) {
    state.station = (state.station + direction + STATIONS.length) % STATIONS.length;
    state.beat = 0;
    state.song = 0;
    if (audio) nextBeat = audio.currentTime + 0.04;
    present();
    unlock();
  }

  function present() {
    const station = STATIONS[state.station];
    game.hud.setRadio(station.name, station.songs[state.song]);
  }

  function update(dt, input) {
    if (input.pressed('KeyQ')) switchStation(-1);
    if (input.pressed('KeyE')) switchStation(1);
    if (!audio || audio.state !== 'running') return;
    const audible = game.mode === 'play' && Boolean(game.playerRig.player.inVehicle);
    master.gain.setTargetAtTime(audible ? game.settings.volume * 0.16 : 0, audio.currentTime, 0.15);
    if (!audible) { nextBeat = audio.currentTime; return; }
    const station = STATIONS[state.station];
    const length = 60 / station.bpm / 2;
    if (nextBeat < audio.currentTime - 0.1) nextBeat = audio.currentTime;
    while (nextBeat < audio.currentTime + 0.12) {
      const index = state.beat % station.notes.length;
      tone(station.base * 2 ** (station.notes[index] / 12), nextBeat, length * 0.8, 0.24, station.wave);
      if (state.beat % 2 === 0) tone(station.base / 4, nextBeat, length * 1.7, 0.38, 'sine');
      if (state.beat % 4 === 0) tone(53, nextBeat, 0.1, 0.5, 'sine');
      state.beat++;
      state.song = Math.floor(state.beat / 128) % 3;
      nextBeat += length;
    }
    present();
  }

  function setVolume(volume) {
    game.settings.volume = volume;
    if (master) master.gain.setTargetAtTime(volume * 0.16, audio.currentTime, 0.1);
  }
  present();
  return { state, unlock, update, switchStation, setVolume };
}
