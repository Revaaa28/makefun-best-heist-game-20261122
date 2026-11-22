// All sound is made in code with WebAudio oscillators and filtered noise:
// no audio files, no network. Created on the first user gesture so browsers
// allow it; every call is safe before that (it simply does nothing).

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  /** A short tone: frequency in Hz, length in seconds, 'sine'|'triangle'|'square'. */
  function tone(frequency, seconds, type, volume, when = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  /** A breath of filtered noise, for the smoke vial. */
  function hiss(seconds) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    const gain = ctx.createGain();
    gain.gain.value = 0.16;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  return {
    /** Call from any gesture so the context exists before the first real cue. */
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },

    step() { tone(190, 0.05, 'triangle', 0.03); },
    lift() { tone(880, 0.12, 'sine', 0.12); tone(1318, 0.2, 'sine', 0.1, 0.09); },
    prime() { tone(523, 0.14, 'triangle', 0.12); tone(659, 0.14, 'triangle', 0.12, 0.11); tone(784, 0.3, 'triangle', 0.14, 0.22); },
    door() { tone(392, 0.16, 'sine', 0.1); tone(587, 0.34, 'sine', 0.12, 0.13); },
    coin() { tone(1568, 0.07, 'square', 0.05); tone(2093, 0.1, 'square', 0.04, 0.06); },
    smoke() { hiss(0.5); },
    suspicious() { tone(440, 0.16, 'triangle', 0.08); tone(466, 0.16, 'triangle', 0.08, 0.14); },
    chase() { tone(311, 0.12, 'square', 0.07); tone(311, 0.12, 'square', 0.07, 0.15); tone(370, 0.2, 'square', 0.07, 0.3); },
    caught() { tone(233, 0.25, 'sawtooth', 0.1); tone(175, 0.25, 'sawtooth', 0.1, 0.2); tone(117, 0.6, 'sawtooth', 0.12, 0.4); },
    getaway() { tone(523, 0.15, 'triangle', 0.12); tone(659, 0.15, 'triangle', 0.12, 0.13); tone(784, 0.15, 'triangle', 0.12, 0.26); tone(1046, 0.4, 'triangle', 0.14, 0.39); },
  };
}
