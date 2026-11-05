// Mixes soft shore waves under the wedding song: the waves are synthesised (filtered noise shaped like waves rolling
// in, breaking and washing back as foam), looped seamlessly over the song's length so the song can loop, ducked a
// little under the loud parts, and mixed in one file so the site keeps playing a single audio element (iOS ignores
// the volume of audio elements, so the waves' level is baked in here).
//
// Usage (macOS, uses afconvert): node scripts/mix-waves.mjs [song.mp3] [out.m4a] [waves dB below the song]
// WAVES_ONLY=path.wav also writes the waves alone, at their level in the mix, to listen to them
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const [song = "audio-src/Love Letter From The Sea to The Shore.mp3", out = "public/audio/love-letter-waves.m4a", below = "13"] =
  process.argv.slice(2);

const tmp = mkdtempSync(join(tmpdir(), "waves-"));
const wavIn = join(tmp, "song.wav");
const wavOut = join(tmp, "mix.wav");

// --- WAV helpers (16-bit PCM in, 16-bit PCM out) ---
const readWav = (path) => {
  const buf = readFileSync(path);
  let pos = 12;
  let fmt;
  let data;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === "fmt ") fmt = { channels: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
    if (id === "data") data = buf.subarray(pos + 8, pos + 8 + size);
    pos += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16 || fmt.channels !== 2) throw new Error("expected a 16-bit stereo WAV");
  const frames = data.length / 4;
  const ch = [new Float32Array(frames), new Float32Array(frames)];
  for (let i = 0; i < frames; i++) {
    ch[0][i] = data.readInt16LE(i * 4) / 32768;
    ch[1][i] = data.readInt16LE(i * 4 + 2) / 32768;
  }
  return { rate: fmt.rate, ch };
};

const writeWav = (path, rate, ch) => {
  const frames = ch[0].length;
  const buf = Buffer.alloc(44 + frames * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + frames * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < 2; c++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, ch[c][i])) * 32767), 44 + i * 4 + c * 2);
  }
  writeFileSync(path, buf);
};

// --- Deterministic randomness, so the same waves come out every run ---
let seed = 20261205;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const between = (a, b) => a + (b - a) * rand();

execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16", song, wavIn]);
const { rate, ch: songCh } = readWav(wavIn);
const N = songCh[0].length;
const waves = [new Float32Array(N), new Float32Array(N)];
// Everything is added at (index mod N), so what spills past the end continues at the start: a seamless loop
const add = (c, i, v) => (waves[c][((i % N) + N) % N] += v);

// One-pole low-pass coefficient for a cutoff in Hz
const lp = (hz) => 1 - Math.exp((-2 * Math.PI * hz) / rate);
const smooth = (x) => x * x * (3 - 2 * x);

// A wave: rolls in (a low swell whose roar brightens), breaks, then washes back up the sand as fizzing foam
const wave = (start, gain, pan) => {
  const rise = between(2.6, 3.6);
  const wash = between(4.5, 6.5);
  const len = Math.round((rise + wash) * rate);
  const s0 = Math.round(start * rate);
  for (let c = 0; c < 2; c++) {
    const side = c === 0 ? 1 - pan : 1 + pan;
    let brown = 0;
    let body = 0;
    let hissLow = 0;
    let flutter = 0.5;
    let flutterTarget = 0.5;
    for (let k = 0; k < len; k++) {
      const t = k / rate;
      const white = rand() * 2 - 1;
      brown = brown * 0.995 + white * 0.1;
      // Roar: brown noise whose cutoff climbs to the break and sinks back in the wash
      const cutoff = t < rise ? 220 + 900 * smooth(t / rise) : 1120 - 620 * Math.min(1, (t - rise) / wash);
      body += (brown - body) * lp(cutoff);
      const bodyEnv = t < rise ? smooth(t / rise) ** 1.6 : Math.exp(-(t - rise) / 2.2);
      // Foam: high hiss after the break, fluttering like bubbles, fading as the water slides back
      hissLow += (white - hissLow) * lp(2400);
      if (k % 900 === 0) flutterTarget = between(0.35, 1);
      flutter += (flutterTarget - flutter) * 0.0008;
      const ft = t - rise + 0.15;
      const foamEnv = ft <= 0 ? 0 : Math.min(1, ft / 0.6) * Math.exp(-ft / (wash * 0.4));
      const v = body * bodyEnv * 1.6 + (white - hissLow) * foamEnv * flutter * 0.05;
      add(c, s0 + k, v * gain * side);
    }
  }
};

// Waves every 7-10 s with a few softer ones, from before the start so the beginning is already mid-sea
for (let t = -8; t < N / rate; t += between(7, 10)) wave(t, rand() < 0.3 ? between(0.45, 0.65) : between(0.75, 1), between(-0.35, 0.35));

// Under the waves: a very low, slow sea rumble, overlap-added in Hann windows so it also wraps seamlessly
const WIN = Math.round(8 * rate);
for (let s = 0; s < N; s += WIN / 2) {
  for (let c = 0; c < 2; c++) {
    let brown = 0;
    let low = 0;
    for (let k = 0; k < WIN; k++) {
      brown = brown * 0.997 + (rand() * 2 - 1) * 0.05;
      low += (brown - low) * lp(160);
      add(c, s + k, low * 0.9 * Math.sin((Math.PI * k) / WIN) ** 2);
    }
  }
}

// Level: the song's loudness over ~1.5 s windows; the waves sit `below` dB under the song overall and partly follow
// its loudness, so the loud parts don't drown them and the quiet ones don't leave them too loud
const rms = (ch, from, to) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += ch[0][i] ** 2 + ch[1][i] ** 2;
  return Math.sqrt(sum / (2 * Math.max(1, to - from)));
};
const songRms = rms(songCh, 0, N);
const wavesRms = rms(waves, 0, N);
const base = (songRms * 10 ** (-Number(below) / 20)) / wavesRms;
const HOP = Math.round(0.25 * rate);
const loud = [];
for (let i = 0; i < N; i += HOP) loud.push(rms(songCh, Math.max(0, i - 3 * HOP), Math.min(N, i + 3 * HOP)) / songRms);

const mix = [new Float32Array(N), new Float32Array(N)];
const wavesOnly = process.env.WAVES_ONLY ? [new Float32Array(N), new Float32Array(N)] : null;
let peak = 0;
for (let i = 0; i < N; i++) {
  const f = i / HOP;
  const j = Math.min(loud.length - 1, Math.floor(f));
  const l = loud[j] + (loud[Math.min(loud.length - 1, j + 1)] - loud[j]) * (f - j);
  const follow = Math.max(0.75, Math.min(1.5, l ** 0.6));
  for (let c = 0; c < 2; c++) {
    mix[c][i] = songCh[c][i] + waves[c][i] * base * follow;
    if (wavesOnly) wavesOnly[c][i] = waves[c][i] * base * follow;
    peak = Math.max(peak, Math.abs(mix[c][i]));
  }
}
// Soft limit only above 0.9, so the song is untouched except on rare peaks
for (const c of mix) for (let i = 0; i < N; i++) {
  const v = c[i];
  const a = Math.abs(v);
  if (a > 0.9) c[i] = Math.sign(v) * (0.9 + 0.09 * Math.tanh((a - 0.9) / 0.09));
}

writeWav(wavOut, rate, mix);
if (wavesOnly) writeWav(process.env.WAVES_ONLY, rate, wavesOnly);
execFileSync("afconvert", ["-f", "m4af", "-d", "aac", "-b", "160000", "-q", "127", wavOut, out]);
rmSync(tmp, { recursive: true, force: true });
console.log(`${out}: waves ${below} dB under the song, mix peak before limiting ${peak.toFixed(3)}`);
