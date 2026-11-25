// Tiny synthesised sounds (WebAudio, no audio files): a chop thock, a sizzle
// blip, a serve ding and a coin chime. Silent until the first click unlocks
// audio, and a mute toggle kills it all.
export function createSound() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  return {
    unlock() { ensure(); },
    setMuted(value) { muted = value; },
    isMuted() { return muted; },
    click() { tone(660, 0.06, 'sine', 0.08); },
    chop() { tone(180, 0.08, 'square', 0.12); tone(90, 0.1, 'triangle', 0.14); },
    chopped() { tone(520, 0.09, 'sine', 0.1); tone(780, 0.12, 'sine', 0.1, 0.08); },
    cooking() { tone(300, 0.15, 'sawtooth', 0.05); },
    ready() { tone(880, 0.12, 'sine', 0.12); tone(1174, 0.18, 'sine', 0.12, 0.1); },
    plated() { tone(440, 0.08, 'sine', 0.09); },
    coin() { tone(988, 0.09, 'sine', 0.12); tone(1319, 0.22, 'sine', 0.12, 0.08); },
    error() { tone(140, 0.18, 'sawtooth', 0.1); },
    burnt() { tone(110, 0.3, 'sawtooth', 0.12); tone(82, 0.35, 'square', 0.08, 0.12); },
    missed() { tone(220, 0.25, 'triangle', 0.12); tone(165, 0.35, 'triangle', 0.12, 0.15); },
  };
}
