/**
 * soundFx.ts
 * Procedural Web Audio API soundscape and tactile micro-interactions.
 * Generates an ethereal, low-key ambient synth soundscape (VOS9X style)
 * alongside tactile micro-feedback for hovers, clicks, and transitions.
 * 100% procedural - zero external audio assets or network requests.
 */

let audioCtx: AudioContext | null = null;
let isAudioEnabled = false;

// Ambient Soundscape nodes
let ambientGain: GainNode | null = null;
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientOsc3: OscillatorNode | null = null;
let filterNode: BiquadFilterNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx && (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function startAmbientSoundscape(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    stopAmbientSoundscape();

    // Master ambient gain with smooth fade in
    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 2.5);

    // Warm low-pass filter (subtle cinematic cutoff)
    filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(320, ctx.currentTime);
    filterNode.Q.setValueAtTime(1.8, ctx.currentTime);

    // Harmonic Pad 1 (Base Root - F# / 92.5 Hz)
    ambientOsc1 = ctx.createOscillator();
    ambientOsc1.type = 'sine';
    ambientOsc1.frequency.setValueAtTime(92.5, ctx.currentTime);

    // Harmonic Pad 2 (Perfect Fifth - C# / 138.6 Hz)
    ambientOsc2 = ctx.createOscillator();
    ambientOsc2.type = 'triangle';
    ambientOsc2.frequency.setValueAtTime(138.6, ctx.currentTime);

    // Harmonic Pad 3 (Octave shimmer - F#2 / 185 Hz)
    ambientOsc3 = ctx.createOscillator();
    ambientOsc3.type = 'sine';
    ambientOsc3.frequency.setValueAtTime(185.0, ctx.currentTime);

    // Connect oscillators -> filter -> gain -> destination
    ambientOsc1.connect(filterNode);
    ambientOsc2.connect(filterNode);
    ambientOsc3.connect(filterNode);
    filterNode.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOsc1.start();
    ambientOsc2.start();
    ambientOsc3.start();
  } catch {
    // Graceful fallback
  }
}

function stopAmbientSoundscape(): void {
  if (ambientGain && audioCtx) {
    try {
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, audioCtx.currentTime);
      ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      setTimeout(() => {
        ambientOsc1?.stop();
        ambientOsc2?.stop();
        ambientOsc3?.stop();
        ambientOsc1?.disconnect();
        ambientOsc2?.disconnect();
        ambientOsc3?.disconnect();
        ambientGain?.disconnect();
        filterNode?.disconnect();
        ambientOsc1 = null;
        ambientOsc2 = null;
        ambientOsc3 = null;
        ambientGain = null;
        filterNode = null;
      }, 900);
    } catch {
      // Ignored
    }
  }
}

export function toggleAudio(): boolean {
  isAudioEnabled = !isAudioEnabled;
  if (isAudioEnabled) {
    getAudioContext();
    startAmbientSoundscape();
    playBipSound(880, 0.05);
  } else {
    stopAmbientSoundscape();
  }
  return isAudioEnabled;
}

export function isSoundActive(): boolean {
  return isAudioEnabled;
}

export function playHoverSound(): void {
  if (!isAudioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(860, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Graceful fallback
  }
}

export function playClickSound(): void {
  if (!isAudioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Graceful fallback
  }
}

function playBipSound(freq: number, duration: number): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}
