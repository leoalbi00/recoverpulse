// Genera colonne sonore ed effetti dei video Remotion in
// src/remotion/assets/audio/ (servita come publicDir da remotion.config.ts).
// Tutto è sintetizzato qui, senza campioni esterni: nessun problema di
// licenze e file rigenerabili in modo deterministico.
//   node scripts/generate-spot-audio.mjs
// Codifica MP3 e normalizzazione loudness con l'ffmpeg incluso in Remotion
// (`npx remotion ffmpeg`), nessuna installazione di sistema richiesta.
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = fileURLToPath(new URL("../src/remotion/assets/audio/", import.meta.url));
const TWO_PI = Math.PI * 2;

// ─── Primitive ──────────────────────────────────────────────────────────────

/** PRNG deterministico (mulberry32): stessi file a ogni esecuzione. */
function prng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = prng(7);
const noise = () => rand() * 2 - 1;

const mtof = (midi) => 440 * 2 ** ((midi - 69) / 12);
const NOTE = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
/** "A3" → frequenza. */
function hz(name) {
  const [, pitch, octave] = name.match(/^([A-G][#b]?)(-?\d)$/);
  return mtof(NOTE[pitch] + (Number(octave) + 1) * 12);
}

const samples = (seconds) => Math.max(1, Math.round(seconds * SR));

class Track {
  constructor(seconds) {
    this.n = samples(seconds);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  /** Mixa un buffer mono a `at` secondi con guadagno e panning (-1…1, legge a potenza costante). */
  add(mono, at, gain = 1, pan = 0) {
    const start = Math.round(at * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    for (let i = 0; i < mono.length; i++) {
      const j = start + i;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += mono[i] * gl;
      this.R[j] += mono[i] * gr;
    }
    return this;
  }
  mix(track, gain = 1) {
    for (let i = 0; i < Math.min(this.n, track.n); i++) {
      this.L[i] += track.L[i] * gain;
      this.R[i] += track.R[i] * gain;
    }
    return this;
  }
  /** Volume automatizzato: punti [secondi, guadagno] interpolati linearmente. */
  automate(points) {
    for (let i = 0; i < this.n; i++) {
      const t = i / SR;
      let g = points[points.length - 1][1];
      for (let k = 0; k < points.length - 1; k++) {
        const [t0, g0] = points[k];
        const [t1, g1] = points[k + 1];
        if (t <= t0) {
          g = g0;
          break;
        }
        if (t < t1) {
          g = g0 + ((g1 - g0) * (t - t0)) / (t1 - t0);
          break;
        }
      }
      this.L[i] *= g;
      this.R[i] *= g;
    }
    return this;
  }
  fade(inSec, outSec) {
    const fi = samples(inSec);
    const fo = samples(outSec);
    for (let i = 0; i < fi && i < this.n; i++) {
      this.L[i] *= i / fi;
      this.R[i] *= i / fi;
    }
    for (let i = 0; i < fo && i < this.n; i++) {
      const j = this.n - 1 - i;
      this.L[j] *= i / fo;
      this.R[j] *= i / fo;
    }
    return this;
  }
}

/** Filtro passa-basso a un polo, in place. */
function lowpass(buf, cutoff) {
  const a = 1 - Math.exp((-TWO_PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < buf.length; i++) buf[i] = y += a * (buf[i] - y);
  return buf;
}
function highpass(buf, cutoff) {
  const a = 1 - Math.exp((-TWO_PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    y += a * (buf[i] - y);
    buf[i] -= y;
  }
  return buf;
}
/** Passa-banda a variabili di stato con frequenza variabile nel tempo (fc(t) in Hz). */
function bandpass(buf, fc, q = 0.7) {
  let low = 0;
  let band = 0;
  for (let i = 0; i < buf.length; i++) {
    const f = 2 * Math.sin((Math.PI * Math.min(typeof fc === "function" ? fc(i / SR) : fc, SR / 6)) / SR);
    low += f * band;
    const high = buf[i] - low - q * band;
    band += f * high;
    buf[i] = band;
  }
  return buf;
}

/** Riverbero stereo tipo Freeverb (8 comb + 4 all-pass per canale). */
function reverb(track, { mix = 0.25, room = 0.84, damp = 0.3 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpasses = [556, 441, 341, 225];
  const process = (input, spread) => {
    const out = new Float32Array(input.length);
    const states = combs.map((len) => ({ buf: new Float32Array(len + spread), i: 0, store: 0 }));
    for (let n = 0; n < input.length; n++) {
      const x = input[n] * 0.015;
      let sum = 0;
      for (const c of states) {
        const y = c.buf[c.i];
        c.store = y * (1 - damp) + c.store * damp;
        c.buf[c.i] = x + c.store * room;
        c.i = (c.i + 1) % c.buf.length;
        sum += y;
      }
      out[n] = sum;
    }
    for (const len of allpasses) {
      const buf = new Float32Array(len + spread);
      let i = 0;
      for (let n = 0; n < out.length; n++) {
        const delayed = buf[i];
        const y = -out[n] + delayed;
        buf[i] = out[n] + delayed * 0.5;
        i = (i + 1) % buf.length;
        out[n] = y;
      }
    }
    return out;
  };
  const wetL = process(track.L, 0);
  const wetR = process(track.R, 23);
  for (let i = 0; i < track.n; i++) {
    track.L[i] = track.L[i] * (1 - mix) + wetL[i] * mix * 3;
    track.R[i] = track.R[i] * (1 - mix) + wetR[i] * mix * 3;
  }
  return track;
}

// ─── Strumenti ──────────────────────────────────────────────────────────────

/** Pianoforte additivo: parziali leggermente inarmoniche, decadimento più rapido sugli acuti, martelletto. */
function piano(freq, dur = 1, vel = 0.8) {
  const len = samples(dur + 2.2);
  const out = new Float32Array(len);
  const B = 0.00035;
  const brightness = 0.6 + vel * 0.6;
  for (let k = 1; k <= 12; k++) {
    const fk = k * freq * Math.sqrt(1 + B * k * k);
    if (fk > SR / 2.2) break;
    const amp = (vel / k ** (1.6 - brightness * 0.5)) * (k === 1 ? 1 : 0.7);
    const decay = 0.9 + k * 0.55 + freq / 600;
    const phase = rand() * TWO_PI;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const release = t > dur ? Math.exp(-(t - dur) * 7) : 1;
      out[i] += amp * Math.sin(TWO_PI * fk * t + phase) * Math.exp(-t * decay) * release;
    }
  }
  const hammer = samples(0.012);
  for (let i = 0; i < hammer; i++) out[i] += noise() * 0.12 * vel * (1 - i / hammer);
  for (let i = 0; i < Math.min(len, 60); i++) out[i] *= i / 60;
  return lowpass(out, 5200);
}

/** Piano elettrico FM (lo-fi): indice di modulazione che decade, tremolo leggero. */
function epiano(freq, dur = 1.5, vel = 0.7) {
  const len = samples(dur + 1.2);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 1.6) * (t > dur ? Math.exp(-(t - dur) * 5) : 1);
    const index = 1.8 * Math.exp(-t * 6) + 0.25;
    const mod = Math.sin(TWO_PI * freq * t) * index;
    const trem = 1 + 0.08 * Math.sin(TWO_PI * 4.5 * t);
    out[i] = vel * env * trem * Math.sin(TWO_PI * freq * t + mod) * Math.min(1, t * 400);
  }
  return out;
}

/** Pad: tre seghe stonate per nota, filtrate; attacco e rilascio lenti. */
function pad(freqs, dur, { attack = 1.2, release = 1.5, cutoff = 1400, gain = 0.18 } = {}) {
  const len = samples(dur + release);
  const out = new Float32Array(len);
  for (const f of freqs) {
    for (const detune of [-0.006, 0, 0.0055]) {
      const fd = f * (1 + detune);
      let phase = rand();
      for (let i = 0; i < len; i++) {
        phase += fd / SR;
        if (phase >= 1) phase -= 1;
        out[i] += (phase * 2 - 1) * gain;
      }
    }
  }
  lowpass(out, cutoff);
  lowpass(out, cutoff * 1.4);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t / attack) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    out[i] *= env / Math.sqrt(freqs.length);
  }
  return out;
}

/** Corda pizzicata Karplus-Strong. */
function pluck(freq, dur = 0.6, { bright = 0.5, gain = 0.6 } = {}) {
  const len = samples(dur + 0.4);
  const period = Math.max(2, Math.round(SR / freq));
  const ring = Float32Array.from({ length: period }, () => noise());
  lowpass(ring, 2000 + bright * 8000);
  const out = new Float32Array(len);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % period;
    const y = ring[idx];
    ring[idx] = 0.5 * (ring[idx] + ring[next]) * 0.996;
    idx = next;
    const t = i / SR;
    out[i] = y * gain * (t > dur ? Math.exp(-(t - dur) * 12) : 1);
  }
  return out;
}

/** Basso: sinusoide con un filo di saturazione. */
function bass(freq, dur = 0.5, gain = 0.6) {
  const len = samples(dur + 0.08);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 200) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.08) : 1) * (0.75 + 0.25 * Math.exp(-t * 6));
    out[i] = Math.tanh(1.6 * Math.sin(TWO_PI * freq * t)) * gain * env;
  }
  return out;
}

function kick(gain = 0.9, tight = 1) {
  const len = samples(0.45);
  const out = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    phase += (45 + 120 * Math.exp(-t * 32 * tight)) / SR;
    out[i] = Math.tanh(2 * Math.sin(TWO_PI * phase)) * Math.exp(-t * 7 * tight) * gain;
  }
  for (let i = 0; i < 90; i++) out[i] += noise() * 0.25 * gain * (1 - i / 90);
  return out;
}

function clap(gain = 0.5) {
  const len = samples(0.3);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const bursts = [0, 0.011, 0.022].reduce((sum, at) => sum + (t >= at ? Math.exp(-(t - at) * 140) : 0), 0);
    out[i] = noise() * (bursts * 0.6 + Math.exp(-t * 18) * 0.5) * gain;
  }
  return bandpass(out, 1300, 0.9);
}

function snare(gain = 0.4) {
  const len = samples(0.25);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = (noise() * 0.6 * Math.exp(-t * 22) + Math.sin(TWO_PI * 185 * t) * 0.5 * Math.exp(-t * 30)) * gain;
  }
  return lowpass(out, 6000);
}

function hat(open = false, gain = 0.18) {
  const len = samples(open ? 0.25 : 0.06);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = noise() * Math.exp(-(i / SR) * (open ? 14 : 70)) * gain;
  return highpass(highpass(out, 7000), 7000);
}

// ─── Effetti sonori ─────────────────────────────────────────────────────────

/** Notifica a due toni, generica (non riproduce suoni di sistema reali). */
function ping() {
  const out = new Float32Array(samples(1));
  for (const [f, at] of [
    [hz("G6"), 0],
    [hz("C7"), 0.085],
  ]) {
    const start = samples(at);
    for (let i = start; i < out.length; i++) {
      const t = (i - start) / SR;
      out[i] += (Math.sin(TWO_PI * f * t) + 0.15 * Math.sin(TWO_PI * 2 * f * t)) * Math.exp(-t * 7) * 0.4 * Math.min(1, t * 2000);
    }
  }
  return out;
}

/** Vibrazione del telefono appoggiato su un mobile: due impulsi ruvidi. */
function buzz() {
  const out = new Float32Array(samples(0.95));
  for (const at of [0, 0.5]) {
    const start = samples(at);
    const len = samples(0.38);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const env = Math.min(1, t * 60) * Math.min(1, (0.38 - t) * 60);
      const motor = Math.sign(Math.sin(TWO_PI * 158 * t)) * 0.5 + Math.sin(TWO_PI * 316 * t) * 0.3;
      out[start + i] += (motor + noise() * 0.25) * env * 0.35;
    }
  }
  return lowpass(out, 1800);
}

function tap() {
  const out = new Float32Array(samples(0.08));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = noise() * Math.exp(-t * 900) * 0.6 + Math.sin(TWO_PI * 140 * t) * Math.exp(-t * 60) * 0.35;
  }
  return out;
}

/** Fruscio d'aria: rumore filtrato con banda in salita (o discesa). */
function whoosh(dur = 0.6, up = true, gain = 0.6) {
  const out = Float32Array.from({ length: samples(dur) }, () => noise());
  bandpass(out, (t) => (up ? 350 + (t / dur) * 4200 : 4500 - (t / dur) * 4000), 0.5);
  for (let i = 0; i < out.length; i++) out[i] *= Math.sin((Math.PI * i) / out.length) ** 1.5 * gain;
  return out;
}

/** Digitazione su tastiera touch o fisica: clic con tempi irregolari. */
function typing(dur = 1.2, soft = false) {
  const out = new Float32Array(samples(dur + 0.1));
  let t = 0.02;
  while (t < dur) {
    const start = samples(t);
    const tone = 2200 + rand() * 1800;
    const len = samples(0.025);
    const click = Float32Array.from({ length: len }, (_, i) => noise() * Math.exp(-(i / SR) * 350));
    bandpass(click, tone, 0.6);
    for (let i = 0; i < len; i++) {
      out[start + i] += click[i] * (soft ? 0.5 : 0.9);
      out[start + i] += Math.sin(TWO_PI * (soft ? 260 : 180) * (i / SR)) * Math.exp(-(i / SR) * 120) * 0.12;
    }
    t += 0.07 + rand() * 0.09;
  }
  return out;
}

/** Campanello di conferma: arpeggio maggiore con timbro di campana FM. */
function chime() {
  const out = new Float32Array(samples(2));
  ["C6", "E6", "G6", "C7"].forEach((name, index) => {
    const f = hz(name);
    const start = samples(index * 0.07);
    for (let i = start; i < out.length; i++) {
      const t = (i - start) / SR;
      const mod = Math.sin(TWO_PI * f * 3.5 * t) * 1.2 * Math.exp(-t * 4);
      out[i] += Math.sin(TWO_PI * f * t + mod) * Math.exp(-t * 3.2) * 0.25 * Math.min(1, t * 3000);
    }
  });
  return out;
}

function tick(high = true) {
  const out = new Float32Array(samples(0.05));
  const f = high ? 3100 : 2300;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = (Math.sin(TWO_PI * f * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 260) * 0.5;
  }
  return out;
}

function riser(dur = 2, gain = 0.5) {
  const out = new Float32Array(samples(dur));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const p = i / out.length;
    phase += (180 + 900 * p * p) / SR;
    out[i] = (noise() * 0.5 * p + Math.sin(TWO_PI * phase) * 0.25 * p) * p * gain;
  }
  return bandpass(out, (t) => 400 + (t / dur) * 5000, 0.6);
}

/** Colpo cinematografico sul logo: sub che scende e coda di rumore. */
function impact(gain = 0.9) {
  const out = new Float32Array(samples(3));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    phase += (32 + 60 * Math.exp(-t * 5)) / SR;
    out[i] = (Math.sin(TWO_PI * phase) * Math.exp(-t * 1.4) * 0.9 + noise() * Math.exp(-t * 9) * 0.35) * gain;
  }
  return lowpass(out, 2400);
}

/** Notte: grilli lontani su un fondo d'ambiente scuro. */
function nightAmbience(dur) {
  const out = new Float32Array(samples(dur));
  let brown = 0;
  for (let i = 0; i < out.length; i++) {
    brown = (brown + noise() * 0.02) * 0.995;
    out[i] = brown * 0.6;
  }
  let t = 0.3;
  while (t < dur - 0.3) {
    const f = 4300 + rand() * 500;
    for (let k = 0; k < 3; k++) {
      const start = samples(t + k * 0.055);
      const len = samples(0.035);
      for (let i = 0; i < len && start + i < out.length; i++) {
        const tt = i / SR;
        out[start + i] += Math.sin(TWO_PI * f * tt) * Math.sin((Math.PI * i) / len) * 0.05;
      }
    }
    t += 0.55 + rand() * 0.6;
  }
  return out;
}

/** Mattina: cinguettii brevi e brusio lontano. */
function morningAmbience(dur) {
  const out = new Float32Array(samples(dur));
  for (let i = 0; i < out.length; i++) out[i] = noise() * 0.008;
  lowpass(out, 900);
  let t = 0.2;
  while (t < dur - 0.4) {
    const base = 2600 + rand() * 1600;
    const notes = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < notes; k++) {
      const start = samples(t + k * 0.11);
      const len = samples(0.075);
      let phase = 0;
      for (let i = 0; i < len && start + i < out.length; i++) {
        const p = i / len;
        phase += (base * (1 + 0.35 * p) + 120 * Math.sin(TWO_PI * 40 * (i / SR))) / SR;
        out[start + i] += Math.sin(TWO_PI * phase) * Math.sin(Math.PI * p) * 0.06;
      }
    }
    t += 0.7 + rand() * 1.1;
  }
  return out;
}

/** Fruscio e crepitio da vinile per il lo-fi. */
function vinyl(dur) {
  const out = new Float32Array(samples(dur));
  for (let i = 0; i < out.length; i++) {
    out[i] = noise() * 0.012;
    if (rand() < 0.0006) out[i] += noise() * 0.5;
  }
  return lowpass(out, 5000);
}

// ─── Brani ──────────────────────────────────────────────────────────────────

const chordNotes = {
  Am: ["A2", "C4", "E4", "A4"],
  F: ["F2", "A3", "C4", "F4"],
  C: ["C3", "E4", "G4", "C5"],
  G: ["G2", "B3", "D4", "G4"],
  Em: ["E2", "B3", "E4", "G4"],
  Dm9: ["D3", "F3", "A3", "C4", "E4"],
  G13: ["G2", "F3", "B3", "E4"],
  Cmaj9: ["C3", "E3", "B3", "D4", "G4"],
  A7: ["A2", "G3", "C#4", "E4"],
};

/** Spot TV "24 ore" (30 s): orologio e tensione, piano narrativo, apertura sul logo a 22 s. */
function trackTv() {
  rand = prng(101);
  const music = new Track(30);
  // 0–3.2 s: orologio che accelera su un bordone grave.
  music.add(pad([hz("A1"), hz("E2")], 3.4, { attack: 0.8, release: 0.6, cutoff: 500, gain: 0.25 }), 0, 0.9);
  let t = 0.2;
  let gap = 0.42;
  while (t < 3.1) {
    music.add(tick(Math.round(t / gap) % 2 === 0), t, 0.5, 0.2);
    t += gap;
    gap = Math.max(0.07, gap * 0.82);
  }
  music.add(riser(1.2, 0.35), 2.0, 1);
  // 3.2–22 s: piano e pad, 80 bpm (battuta = 3 s).
  const progression = ["Am", "F", "C", "G", "Am", "F"];
  progression.forEach((name, bar) => {
    const at = 3.2 + bar * 3;
    music.add(pad(chordNotes[name].slice(1).map(hz), 3, { attack: 0.9, release: 1.2, cutoff: 1100, gain: 0.16 }), at, 0.9);
    music.add(piano(hz(chordNotes[name][0]) * 2, 2.5, 0.55), at, 0.5, -0.2);
  });
  const motif = ["E5", "C5", "A4", "B4", "C5", "E5", "G5", "E5", "A5", "G5", "E5", "D5"];
  motif.forEach((name, index) => music.add(piano(hz(name), 0.7, 0.45 + (index % 4 === 0 ? 0.15 : 0)), 3.2 + 0.75 + index * 1.5, 0.55, 0.15));
  // Pulsazione di "battito" sotto le scene, poi si apre.
  for (let beat = 0; beat < 25; beat++) music.add(kick(0.35, 0.6), 3.2 + beat * 0.75, 0.5);
  music.add(riser(2.2, 0.4), 19.8, 1);
  // 22 s: colpo e accordo pieno che risuona fino alla fine.
  music.add(impact(0.9), 22, 1);
  music.add(pad(["C3", "G3", "C4", "E4", "G4", "D5"].map(hz), 6.5, { attack: 0.05, release: 1.5, cutoff: 2600, gain: 0.16 }), 22, 1);
  ["C4", "G4", "C5", "E5", "G5"].forEach((name, index) => music.add(piano(hz(name), 5, 0.6), 22 + index * 0.06, 0.55));
  reverb(music, { mix: 0.3, room: 0.86 });
  return music.fade(0.05, 1.2);
}

/** Reel social (15 s, 120 bpm): hook filtrato, drop a 2 s, stop secco a 13 s. */
function trackReel() {
  rand = prng(202);
  const music = new Track(15);
  const beat = 0.5;
  const progression = ["Am", "F", "C", "G"];
  const melody = ["E5", "E5", "D5", "C5", "A4", "C5", "D5", "E5", "G5", "E5", "D5", "C5", "D5", "C5", "B4", "G4"];
  for (let b = 0; b < 26; b++) {
    const at = b * beat;
    const dropped = at >= 2;
    const bar = Math.floor(b / 4) % 4;
    const chord = chordNotes[progression[bar]];
    if (dropped || b % 2 === 0) music.add(kick(dropped ? 0.95 : 0.5), at, dropped ? 0.9 : 0.6);
    if (dropped && b % 2 === 1) music.add(clap(0.55), at, 0.8, 0.05);
    for (let h = 0; h < (dropped ? 2 : 1); h++) music.add(hat(h === 1 && b % 4 === 3, 0.16), at + h * (beat / 2), 0.7, 0.3);
    if (dropped && b % 8 === 7) for (let r = 0; r < 4; r++) music.add(hat(false, 0.12), at + 0.25 + r * 0.0625, 0.7, 0.3);
    if (dropped) {
      music.add(bass(hz(chord[0]), 0.22, 0.55), at + 0.25, 0.9);
      music.add(pluck(hz(melody[b % melody.length]), 0.18, { bright: 0.75, gain: 0.5 }), at, 0.55, -0.25);
      music.add(pluck(hz(melody[(b + 3) % melody.length]), 0.12, { bright: 0.6, gain: 0.35 }), at + 0.25, 0.4, 0.3);
    }
    if (b % 4 === 0) music.add(pad(chord.slice(1).map(hz), 2, { attack: 0.02, release: 0.4, cutoff: dropped ? 2600 : 700, gain: 0.12 }), at, 0.7);
  }
  // Prima del drop tutto è "dietro un muro": filtro sul primo tratto.
  const hookEnd = samples(2);
  const hookL = lowpass(music.L.slice(0, hookEnd), 600);
  const hookR = lowpass(music.R.slice(0, hookEnd), 600);
  music.L.set(hookL, 0);
  music.R.set(hookR, 0);
  music.add(riser(0.9, 0.4), 1.1, 1);
  music.add(impact(0.7), 13, 0.8);
  for (let i = samples(13); i < music.n; i++) {
    const keep = Math.exp(-(i - samples(13)) / SR / 0.05);
    music.L[i] *= keep;
    music.R[i] *= keep;
  }
  music.add(impact(0.7), 13, 0.9);
  ["A4", "C5", "E5"].forEach((name, index) => music.add(pluck(hz(name), 1.2, { bright: 0.8, gain: 0.5 }), 13 + index * 0.08, 0.6));
  reverb(music, { mix: 0.15, room: 0.75 });
  return music.fade(0.01, 0.4);
}

/** LinkedIn (20 s, 85 bpm): lo-fi con piano elettrico e vinile. */
function trackLinkedin() {
  rand = prng(303);
  const music = new Track(20);
  const beat = 60 / 85;
  const progression = ["Dm9", "G13", "Cmaj9", "A7"];
  for (let bar = 0; bar < 7; bar++) {
    const at = bar * beat * 4;
    const chord = chordNotes[progression[bar % 4]];
    chord.forEach((name, index) => music.add(epiano(hz(name), beat * 3.6, 0.32), at + index * 0.012, 0.6, index % 2 ? 0.2 : -0.2));
    music.add(bass(hz(chord[0]) / 2, beat * 1.6, 0.45), at, 0.7);
    music.add(bass(hz(chord[0]) / 2, beat * 0.8, 0.4), at + beat * 2.5, 0.6);
    for (let b = 0; b < 4; b++) {
      const swing = (n) => at + b * beat + n * beat * 0.58;
      if (b === 0 || (b === 2 && bar % 2 === 1)) music.add(kick(0.6, 0.8), swing(0), 0.7);
      if (b === 2 && bar % 2 === 0) music.add(kick(0.5, 0.8), swing(1), 0.6);
      if (b % 2 === 1) music.add(snare(0.4), swing(0), 0.6, 0.05);
      music.add(hat(false, 0.1), swing(0), 0.6, 0.35);
      music.add(hat(false, 0.07), swing(1), 0.6, 0.35);
    }
  }
  music.add(vinyl(20), 0, 0.9);
  // Coda: ultimo accordo sospeso.
  ["D3", "A3", "C4", "E4", "F4"].forEach((name) => music.add(epiano(hz(name), 2.5, 0.3), 17.6, 0.6));
  reverb(music, { mix: 0.22, room: 0.8, damp: 0.5 });
  // Saturazione "a nastro" leggera: prima si porta il picco a 0.6, così il
  // tanh arrotonda senza distorcere gli attacchi degli accordi.
  const peak = [music.L, music.R].reduce((max, ch) => ch.reduce((m, x) => Math.max(m, Math.abs(x)), max), 1e-9);
  for (let i = 0; i < music.n; i++) {
    music.L[i] = Math.tanh((music.L[i] / peak) * 0.6 * 1.2);
    music.R[i] = Math.tanh((music.R[i] / peak) * 0.6 * 1.2);
  }
  return music.fade(0.3, 1.5);
}

/** Presentazione aziendale (70 s, 110 bpm): corporate in crescendo con pausa sulla sicurezza. */
function trackB2b() {
  rand = prng(404);
  const music = new Track(70);
  const beat = 60 / 110;
  const barLen = beat * 4;
  const progression = ["C", "G", "Am", "F"];
  const arp = [0, 1, 2, 3, 2, 1, 2, 3];
  for (let bar = 0; bar < 32; bar++) {
    const at = bar * barLen;
    const chord = chordNotes[progression[bar % 4]];
    const section = bar < 4 ? "intro" : bar < 16 ? "build" : bar < 24 ? "full" : bar < 28 ? "break" : "final";
    music.add(pad(chord.slice(1).map(hz), barLen, { attack: 0.4, release: 0.6, cutoff: section === "break" ? 900 : 1800, gain: 0.12 }), at, 0.8);
    if (section === "intro" || section === "break") {
      music.add(piano(hz(chord[3]), barLen * 0.9, 0.45), at, 0.5, 0.15);
      music.add(piano(hz(chord[1]) * 2, barLen * 0.5, 0.35), at + beat * 2, 0.45, -0.15);
    }
    if (section !== "intro" && section !== "break") {
      for (let s = 0; s < 16; s++) {
        const note = hz(chord[1 + (arp[s % 8] % 3)]) * (s % 8 > 3 ? 2 : 1);
        music.add(pluck(note, beat / 4, { bright: 0.55, gain: 0.32 }), at + (s * beat) / 4, 0.55, s % 2 ? 0.35 : -0.35);
      }
    }
    if (section === "full" || section === "final" || (section === "build" && bar >= 8)) {
      for (let b = 0; b < 4; b++) music.add(kick(0.6, 0.9), at + b * beat, section === "build" ? 0.45 : 0.65);
      for (let b = 0; b < 8; b++) music.add(hat(b % 2 === 1, 0.1), at + (b * beat) / 2, 0.5, 0.3);
    }
    if (section === "full" || section === "final") {
      music.add(clap(0.4), at + beat, 0.5);
      music.add(clap(0.4), at + beat * 3, 0.5);
      for (let b = 0; b < 8; b++) music.add(bass(hz(chord[0]), beat / 2 - 0.03, 0.42), at + (b * beat) / 2, 0.75);
    }
  }
  // Transizioni di capitolo, allineate ai cambi di scena (vedi OmniRevB2B.tsx).
  for (const at of [6, 16, 46, 58]) music.add(whoosh(0.8, true, 0.35), at - 0.5, 0.6);
  music.add(riser(2.2, 0.4), 58.9, 0.9);
  music.add(impact(0.8), 61.1, 0.9);
  ["C4", "G4", "C5", "E5", "G5"].forEach((name, index) => music.add(piano(hz(name), 7, 0.55), 61.1 + index * 0.05, 0.5));
  music.add(pad(["C3", "G3", "C4", "E4", "G4"].map(hz), 8, { attack: 0.05, release: 1.2, cutoff: 2400, gain: 0.14 }), 61.1, 0.9);
  // Nell'ultima frase solo l'accordo finale: zittisce il resto dopo 61.1 s.
  reverb(music, { mix: 0.24, room: 0.82 });
  return music.fade(1.5, 2);
}

/** Spot verticale/orizzontale "03:12" (15 s): notte al piano, mattina più luminosa, chiusura. */
function trackSpot() {
  rand = prng(505);
  const music = new Track(15);
  const night = ["A3", "E4", "C5", "B4", "A4", "E4", "C5", "D5", "B4", "E4"];
  night.forEach((name, index) => music.add(piano(hz(name), 1.1, 0.42), 0.4 + index * 0.95, 0.55, index % 2 ? 0.2 : -0.2));
  music.add(pad(["A2", "E3", "C4"].map(hz), 6.5, { attack: 1.5, release: 1, cutoff: 700, gain: 0.16 }), 0, 0.8);
  music.add(pad(["F2", "C3", "A3"].map(hz), 3.4, { attack: 1, release: 1, cutoff: 700, gain: 0.16 }), 6.6, 0.8);
  // 10 s: mattina.
  music.add(pad(["C3", "G3", "D4", "E4"].map(hz), 2.4, { attack: 0.3, release: 0.8, cutoff: 1800, gain: 0.14 }), 10, 0.9);
  ["C5", "D5", "E5", "G5"].forEach((name, index) => music.add(piano(hz(name), 0.6, 0.5), 10.1 + index * 0.4, 0.5, 0.2));
  // 12.2 s: chiusura.
  music.add(impact(0.6), 12.2, 0.8);
  ["C4", "G4", "C5", "E5"].forEach((name, index) => music.add(piano(hz(name), 2.6, 0.55), 12.25 + index * 0.05, 0.55));
  reverb(music, { mix: 0.32, room: 0.86 });
  return music.fade(0.2, 0.8);
}

/**
 * Spot "Dunning su misura" (25 s): tensione sui dati del problema, svolta
 * calda a 8.5 s sul servizio, apertura sul risultato a 18 s, logo a 21.5 s
 * (scene in OmniRevDunningService.tsx).
 */
function trackDunning() {
  rand = prng(707);
  const music = new Track(25);
  // 0–8.5 s: bordone grave e ticchettio regolare, i pagamenti che falliscono uno dopo l'altro.
  music.add(pad(["A1", "E2", "C3"].map(hz), 4.6, { attack: 0.6, release: 1, cutoff: 600, gain: 0.22 }), 0, 0.9);
  music.add(pad(["F1", "C2", "A2"].map(hz), 4.8, { attack: 0.8, release: 1.2, cutoff: 600, gain: 0.22 }), 4, 0.9);
  for (let t = 0.25; t < 8.2; t += 0.5) music.add(tick(Math.round(t * 2) % 2 === 0), t, 0.3, 0.25);
  ["A4", "E4", "C5", "B4"].forEach((name, index) => music.add(piano(hz(name), 1.8, 0.4), 0.3 + index * 2, 0.45, -0.15));
  music.add(riser(1.4, 0.35), 7.1, 0.9);
  // 8.5–18 s: il servizio. Accordi caldi ogni 2.4 s, pulsazione a 100 bpm e motivo al piano.
  ["C", "G", "Am", "F"].forEach((name, bar) => {
    const at = 8.5 + bar * 2.4;
    music.add(pad(chordNotes[name].slice(1).map(hz), 2.6, { attack: 0.4, release: 1, cutoff: 1500, gain: 0.15 }), at, 0.9);
    music.add(bass(hz(chordNotes[name][0]), 2.2, 0.4), at, 0.6);
  });
  for (let beat = 0; beat < 16; beat++) music.add(kick(0.4, 0.7), 8.5 + beat * 0.6, 0.5);
  const motif = ["E5", "G5", "C5", "D5", "B4", "G4", "C5", "E5", "A4", "C5", "F5", "E5", "D5", "C5", "G5"];
  motif.forEach((name, index) => music.add(piano(hz(name), 0.8, 0.45 + (index % 4 === 0 ? 0.12 : 0)), 8.5 + index * 0.6, 0.5, 0.15));
  music.add(riser(1.6, 0.4), 16.4, 1);
  // 18–21.5 s: il risultato, più luminoso.
  music.add(pad(["C3", "G3", "E4", "G4", "D5"].map(hz), 3.8, { attack: 0.05, release: 1, cutoff: 2400, gain: 0.15 }), 18, 0.9);
  ["C5", "E5", "G5", "C6"].forEach((name, index) => music.add(pluck(hz(name), 0.5, { bright: 0.7, gain: 0.45 }), 18 + index * 0.3, 0.45, index % 2 ? 0.25 : -0.25));
  for (let beat = 0; beat < 6; beat++) music.add(kick(0.5, 0.8), 18 + beat * 0.6, 0.55);
  // 21.5 s: colpo e accordo finale sul logo.
  music.add(impact(0.8), 21.5, 0.9);
  music.add(pad(["C3", "G3", "C4", "E4", "G4", "D5"].map(hz), 3.5, { attack: 0.05, release: 1.2, cutoff: 2600, gain: 0.15 }), 21.5, 1);
  ["C4", "G4", "C5", "E5", "G5"].forEach((name, index) => music.add(piano(hz(name), 3.4, 0.55), 21.55 + index * 0.05, 0.55));
  reverb(music, { mix: 0.28, room: 0.85 });
  return music.fade(0.05, 1);
}

// ─── Scrittura file ─────────────────────────────────────────────────────────

function wav(channels) {
  const n = channels[0].length;
  const peak = channels.reduce((max, ch) => ch.reduce((m, x) => Math.max(m, Math.abs(x)), max), 1e-9);
  const scale = Math.min(1, 0.89 / peak); // −1 dBFS di picco
  const data = Buffer.alloc(n * channels.length * 2);
  for (let i = 0; i < n; i++) {
    channels.forEach((ch, c) => {
      const s = Math.max(-1, Math.min(1, ch[i] * scale));
      data.writeInt16LE(Math.round(s * 32767), (i * channels.length + c) * 2);
    });
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels.length, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * channels.length * 2, 28);
  header.writeUInt16LE(channels.length * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Taglia il rombo sotto i 30 Hz (inutile e dannoso su TV e smartphone). */
function cleanLowEnd(channels) {
  return channels.map((ch) => highpass(highpass(Float32Array.from(ch), 30), 30));
}

const tmp = await mkdtemp(join(tmpdir(), "omnirev-audio-"));
await mkdir(OUT, { recursive: true });

/** Scrive WAV temporaneo e lo codifica in MP3 (le basi musicali normalizzate a −18 LUFS). */
async function emit(name, channels, { loudness } = {}) {
  const source = join(tmp, `${name}.wav`);
  await writeFile(source, wav(cleanLowEnd(channels)));
  const filters = loudness ? ["-af", `loudnorm=I=${loudness}:TP=-1.5:LRA=11`, "-ar", String(SR)] : [];
  execFileSync("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", source, ...filters, "-c:a", "libmp3lame", "-b:a", "192k", join(OUT, `${name}.mp3`)], {
    stdio: "inherit",
  });
  console.log(`  ${name}.mp3`);
}

const music = { "music-tv": trackTv, "music-reel": trackReel, "music-linkedin": trackLinkedin, "music-b2b": trackB2b, "music-spot": trackSpot, "music-dunning": trackDunning };
for (const [name, build] of Object.entries(music)) {
  const track = build();
  await emit(name, [track.L, track.R], { loudness: -18 });
}

rand = prng(909);
const sfx = {
  "sfx-ping": ping(),
  "sfx-buzz": buzz(),
  "sfx-tap": tap(),
  "sfx-whoosh": whoosh(0.6, true),
  "sfx-whoosh-down": whoosh(0.7, false),
  "sfx-typing": typing(1.4),
  "sfx-typing-soft": typing(1.2, true),
  "sfx-chime": chime(),
  "sfx-tick": tick(true),
  "sfx-impact": impact(),
  "sfx-ambience-night": nightAmbience(8),
  "sfx-ambience-morning": morningAmbience(6),
};
for (const [name, mono] of Object.entries(sfx)) await emit(name, [mono]);

await rm(tmp, { recursive: true, force: true });
console.log(`Audio scritto in ${OUT}`);
