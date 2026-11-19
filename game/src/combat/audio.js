// Synthesized shots and reload clicks, unlocked only by user interaction.
export function createCombatAudio() {
  let context;
  let noise;
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
  }
  addEventListener('pointerdown', unlock, { once: true });
  addEventListener('keydown', unlock, { once: true });
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
  return { play };
}
