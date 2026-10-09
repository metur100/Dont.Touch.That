/**
 * Synthesizes the game's sound effects and music loop as 16-bit mono WAV files (no third-party
 * assets). Replace any file in assets/sounds with produced audio of the same name at any time.
 *
 * Usage: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');

function writeWav(name, samples, peak = 0.9) {
  let max = 0;
  for (const v of samples) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < samples.length; i++) samples[i] *= peak / max;
  const size = samples.length * 2;
  const buf = Buffer.alloc(44 + size);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + size, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(size, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`wrote ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

const TAU = Math.PI * 2;
const waves = {
  sine: (p) => Math.sin(TAU * p),
  square: (p) => (p % 1 < 0.5 ? 1 : -1) * 0.6,
  triangle: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
  saw: (p) => 2 * (p % 1) - 1,
};

/**
 * A note with a frequency that may glide from `freq` to `to`, an attack/decay envelope and
 * optional vibrato.
 */
function note({ freq, to = freq, dur, wave = 'sine', vol = 1, attack = 0.005, release = 0.05, decay = 0, vibrato = 0 }) {
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const k = i / n;
    const f = freq + (to - freq) * k + (vibrato ? Math.sin(TAU * 6 * t) * vibrato : 0);
    phase += f / RATE;
    let env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    if (decay) env *= Math.exp(-decay * t);
    out[i] = waves[wave](phase) * env * vol;
  }
  return out;
}

function noise({ dur, vol = 1, from = 1, to = 0.1, attack = 0.01 }) {
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    // One-pole low-pass with a sweeping cutoff: a cheap "whoosh".
    const a = from + (to - from) * k;
    last = last + a * (Math.random() * 2 - 1 - last);
    const env = Math.min(1, i / RATE / attack) * Math.sin(Math.PI * k);
    out[i] = last * env * vol;
  }
  return out;
}

function mix(dur, parts) {
  const out = new Float32Array(Math.floor(RATE * dur));
  for (const [offset, s] of parts) {
    const start = Math.floor(RATE * offset);
    for (let i = 0; i < s.length && start + i < out.length; i++) out[start + i] += s[i];
  }
  return out;
}

const hz = (semitonesFromA4) => 440 * Math.pow(2, semitonesFromA4 / 12);
// Note names -> semitones from A4
const N = { C4: -9, D4: -7, E4: -5, F4: -4, G4: -2, A4: 0, B4: 2, C5: 3, D5: 5, E5: 7, F5: 8, G5: 10, A5: 12, C6: 15, C3: -21, D3: -19, E3: -17, F3: -16, G3: -14, A3: -12, B3: -10, Fs3: -15 };

fs.mkdirSync(OUT, { recursive: true });

writeWav('tap.wav', note({ freq: 1400, to: 900, dur: 0.05, wave: 'sine', release: 0.03 }), 0.6);
writeWav('pop.wav', mix(0.14, [
  [0, note({ freq: 380, to: 1100, dur: 0.09, wave: 'sine', release: 0.04 })],
  [0, noise({ dur: 0.04, vol: 0.3, from: 0.6, to: 0.2 })],
]));
writeWav('button.wav', mix(0.22, [
  [0, note({ freq: hz(N.G4), dur: 0.08, wave: 'square', vol: 0.5 })],
  [0.08, note({ freq: hz(N.C5), dur: 0.12, wave: 'square', vol: 0.5, release: 0.08 })],
]));
writeWav('success.wav', mix(0.55, [N.C5, N.E5, N.G5, N.C6].map((s, i) => [i * 0.07, note({ freq: hz(s), dur: i === 3 ? 0.3 : 0.12, wave: 'square', vol: 0.45, release: 0.08, decay: 3 })])));
// Sad trombone: "wah wah wah waaah".
writeWav('failure.wav', mix(1.5, [
  [0, note({ freq: hz(N.A3) * 1.06, to: hz(N.A3), dur: 0.3, wave: 'saw', vol: 0.5, attack: 0.03, release: 0.06 })],
  [0.32, note({ freq: hz(N.G3) * 1.06, to: hz(N.G3), dur: 0.3, wave: 'saw', vol: 0.5, attack: 0.03, release: 0.06 })],
  [0.64, note({ freq: hz(N.Fs3) * 1.06, to: hz(N.Fs3), dur: 0.3, wave: 'saw', vol: 0.5, attack: 0.03, release: 0.06 })],
  [0.96, note({ freq: hz(N.F3), to: hz(N.F3) * 0.97, dur: 0.54, wave: 'saw', vol: 0.5, attack: 0.03, release: 0.2, vibrato: 6 })],
]));
writeWav('streak.wav', mix(0.6, [N.E5, N.G5, N.A5, N.C6, N.E5 + 12].map((s, i) => [i * 0.055, note({ freq: hz(s), dur: 0.2, wave: 'triangle', vol: 0.6, decay: 6 })])));
writeWav('level-start.wav', mix(0.45, [
  [0, noise({ dur: 0.22, vol: 0.5, from: 0.05, to: 0.7 })],
  [0.18, note({ freq: hz(N.E5), dur: 0.25, wave: 'triangle', vol: 0.7, decay: 5 })],
]));
writeWav('countdown.wav', note({ freq: 880, dur: 0.07, wave: 'square', vol: 0.4, release: 0.03 }), 0.6);
writeWav('boss.wav', mix(1.1, [
  [0, note({ freq: 90, to: 45, dur: 0.35, wave: 'sine', vol: 1, decay: 4 })],
  [0, noise({ dur: 0.12, vol: 0.5, from: 0.3, to: 0.05 })],
  [0.25, note({ freq: hz(N.C3), dur: 0.8, wave: 'saw', vol: 0.35, attack: 0.05, release: 0.3 })],
  [0.25, note({ freq: hz(N.Fs3), dur: 0.8, wave: 'saw', vol: 0.3, attack: 0.05, release: 0.3 })],
]));
writeWav('whoosh.wav', noise({ dur: 0.3, vol: 1, from: 0.05, to: 0.6 }), 0.6);

// ---------- Music: an 8-bar bouncy chiptune loop at 132 BPM ----------
(function music() {
  const bpm = 132;
  const beat = 60 / bpm;
  const bars = 8;
  const dur = bars * 4 * beat;
  const parts = [];
  const chords = [
    [N.C3, N.E4, N.G4], [N.A3, N.C5 - 12, N.E4], [N.F3, N.A4 - 12, N.C5 - 12], [N.G3, N.B3, N.D4],
    [N.C3, N.E4, N.G4], [N.A3, N.C5 - 12, N.E4], [N.F3, N.A4 - 12, N.C5 - 12], [N.G3, N.B3, N.D4],
  ];
  const melody = [
    N.E5, null, N.G5, N.E5, N.D5, null, N.C5, null,
    N.E5, null, N.A5, N.G5, N.E5, null, null, null,
    N.F5, null, N.A5, N.F5, N.E5, null, N.C5, null,
    N.D5, N.E5, N.D5, N.B4, N.G4, null, null, null,
    N.E5, null, N.G5, N.E5, N.D5, null, N.C5, null,
    N.E5, null, N.A5, N.G5, N.E5, null, N.G5, null,
    N.F5, N.E5, N.D5, N.C5, N.A4, null, N.C5, null,
    N.D5, null, N.B4, null, N.C5, null, null, null,
  ];
  chords.forEach((chord, bar) => {
    for (let b = 0; b < 4; b++) {
      const t = (bar * 4 + b) * beat;
      // Bass on every beat, octave jump on off-beats.
      parts.push([t, note({ freq: hz(chord[0]), dur: beat * 0.45, wave: 'triangle', vol: 0.9, release: 0.04 })]);
      parts.push([t + beat / 2, note({ freq: hz(chord[0] + 12), dur: beat * 0.35, wave: 'triangle', vol: 0.6, release: 0.04 })]);
      // Soft off-beat chord stab.
      if (b % 2 === 1) {
        for (const s of chord.slice(1)) parts.push([t, note({ freq: hz(s), dur: beat * 0.3, wave: 'square', vol: 0.12, release: 0.05 })]);
      }
      // Hi-hat.
      parts.push([t + beat / 2, noise({ dur: 0.04, vol: 0.18, from: 0.9, to: 0.9 })]);
    }
  });
  melody.forEach((s, i) => {
    if (s === null) return;
    parts.push([i * beat / 2, note({ freq: hz(s), dur: beat * 0.45, wave: 'square', vol: 0.28, release: 0.05, decay: 2 })]);
  });
  writeWav('music.wav', mix(dur, parts), 0.8);
})();
