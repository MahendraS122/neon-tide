// Synthesize short effects and continuous vehicle sounds on a shared audio context.
export function createCombatAudio() {
  let context;
  let noise;
  let engine;
  let siren;
  let phase = 0;
  function unlock() {
    try {
      context ??= new AudioContext();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch {
      return;
    }
    if (noise) return;
    noise = context.createBuffer(1, Math.round(context.sampleRate * 0.23), context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
    engine = loop('sawtooth', 48, 230);
    siren = loop('triangle', 620, 1900);
  }
  addEventListener('pointerdown', unlock, { once: true });
  addEventListener('keydown', unlock, { once: true });
  document.addEventListener('click', event => {
    if (event.target.closest('button:not(:disabled)')) click();
  });

  function loop(type, frequency, cutoff) {
    const source = context.createOscillator();
    source.type = type;
    source.frequency.value = frequency;
    const filter = context.createBiquadFilter();
    filter.frequency.value = cutoff;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    return { source, filter, gain };
  }

  function update(dt, car, throttle, pursuitDistance) {
    if (context?.state !== 'running') return;
    phase = (phase + dt * 3.1) % (Math.PI * 2);
    const time = context.currentTime;
    const speed = Math.abs(car?.speed ?? 0);
    engine.source.frequency.setTargetAtTime(42 + Math.min(speed, 65) * 1.7 + throttle * 13, time, 0.09);
    engine.filter.frequency.setTargetAtTime(170 + speed * 5 + throttle * 130, time, 0.09);
    engine.gain.gain.setTargetAtTime(car ? 0.045 + throttle * 0.032 : 0, time, 0.06);
    siren.source.frequency.setTargetAtTime(690 + Math.sin(phase) * 195, time, 0.025);
    const distanceGain = Math.max(0, 1 - pursuitDistance / 83);
    siren.gain.gain.setTargetAtTime(distanceGain ** 2 * 0.063, time, 0.12);
  }

  function click() {
    if (!context) return;
    const tick = () => {
      const at = context.currentTime;
      const source = context.createOscillator();
      const gain = context.createGain();
      source.frequency.setValueAtTime(760, at);
      source.frequency.exponentialRampToValueAtTime(385, at + 0.075);
      gain.gain.setValueAtTime(0.07, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.085);
      source.connect(gain).connect(context.destination);
      source.start(at);
      source.stop(at + 0.09);
    };
    if (context.state === 'running') tick();
    else context.resume().then(tick).catch(() => {});
  }
  function play(power, volume = 0.2) {
    if (context?.state !== 'running' || !noise) return;
    const time = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1350 + 2200 * power, time);
    filter.frequency.exponentialRampToValueAtTime(130, time + 0.17);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(volume, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.08 + power * 0.12);
    source.connect(filter).connect(envelope).connect(context.destination);
    source.start();
  }
  return { play, update, click };
}
