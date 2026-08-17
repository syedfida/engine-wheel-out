// ---------------------------------------------------------------------------
// Procedural audio system (Web Audio API). No external assets — every sound
// is synthesized so the game works fully offline. All calls are guarded:
// if audio fails for any reason the game continues silently.
// ---------------------------------------------------------------------------
import { locationById } from "./config";

type SfxName =
  | "click"
  | "coin"
  | "launch"
  | "impact"
  | "upgrade"
  | "achievement"
  | "newRecord"
  | "levelUp"
  | "backfire"
  | "tick"
  | "slam";

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private engineNodes: { osc1: OscillatorNode; osc2: OscillatorNode; noise: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private windNodes: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;

  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicRoot = 146.83;
  private musicScale: number[] = [0, 3, 5, 7, 10, 12, 15];
  private musicEnabled = false;

  soundOn = true;
  musicOn = true;
  private audioFailed = false;

  /** Must be called from a user gesture (button press) to unlock audio. */
  unlock(): void {
    if (this.audioFailed) return;
    try {
      if (!this.ctx) {
        const AC: typeof AudioContext | undefined =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) throw new Error("no audio context");
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.5;
        this.sfxBus.connect(this.master);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.15;
        this.musicBus.connect(this.master);
        this.noiseBuffer = this.makeNoise();
        if (this.musicOn) this.startMusicLoop();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch (err) {
      console.warn("[EWOP] Audio unavailable, continuing without sound:", err);
      this.audioFailed = true;
    }
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  setSound(on: boolean): void {
    this.soundOn = on;
    if (this.ctx && this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.05);
    }
    if (!on && this.engineNodes) this.stopEngine();
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (!this.ctx) return;
    if (on && this.musicBus) {
      this.musicBus.gain.setTargetAtTime(0.15, this.ctx.currentTime, 0.1);
      if (this.musicTimer === null) this.startMusicLoop();
    } else if (this.musicBus) {
      this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  setLocation(locationId: string): void {
    const loc = locationById(locationId);
    this.musicRoot = loc.visual.musicRoot;
    this.musicScale = loc.visual.musicScale;
    if (this.ctx && this.musicOn && this.musicTimer === null) this.startMusicLoop();
  }

  /** Called every animation frame while the engine phase is active. */
  updateEngine(rpm: number, running: boolean): void {
    if (this.audioFailed || !this.soundOn) {
      if (!this.soundOn) this.stopEngine();
      return;
    }
    try {
      if (running) {
        if (!this.engineNodes) this.createEngine();
        const n = this.engineNodes!;
        const t = this.ctx!.currentTime;
        const freq = 44 + rpm * 1.5;
        n.osc1.frequency.setTargetAtTime(freq, t, 0.06);
        n.osc2.frequency.setTargetAtTime(freq * 1.015, t, 0.06);
        n.filter.frequency.setTargetAtTime(240 + rpm * 9, t, 0.08);
        n.gain.gain.setTargetAtTime(0.05 + rpm * 0.0045, t, 0.08);
      } else {
        this.stopEngine();
      }
    } catch {
      this.audioFailed = true;
    }
  }

  private createEngine(): void {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 60;
    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.value = 61;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer!;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 300;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc1.connect(gain);
    osc2.connect(gain);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus!);
    osc1.start();
    osc2.start();
    source.start();
    this.engineNodes = { osc1, osc2, noise: source, filter, gain };
  }

  stopEngine(): void {
    if (!this.engineNodes || !this.ctx) return;
    try {
      const n = this.engineNodes;
      n.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      const t = this.ctx.currentTime + 0.4;
      n.osc1.stop(t);
      n.osc2.stop(t);
      n.noise.stop(t);
    } catch {
      /* ignore */
    }
    this.engineNodes = null;
  }

  /** Called during flight to drive wind sound. */
  updateWind(speed: number): void {
    if (this.audioFailed || !this.soundOn || !this.ctx) return;
    try {
      if (speed > 8) {
        if (!this.windNodes) {
          const source = this.ctx.createBufferSource();
          source.buffer = this.noiseBuffer!;
          source.loop = true;
          const filter = this.ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 900;
          filter.Q.value = 0.6;
          const gain = this.ctx.createGain();
          gain.gain.value = 0;
          source.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxBus!);
          source.start();
          this.windNodes = { source, filter, gain };
        }
        const w = this.windNodes;
        const t = this.ctx.currentTime;
        w.filter.frequency.setTargetAtTime(500 + speed * 8, t, 0.1);
        w.gain.gain.setTargetAtTime(Math.min(0.16, (speed / 180) * 0.16), t, 0.1);
      } else {
        this.stopWind();
      }
    } catch {
      this.audioFailed = true;
    }
  }

  stopWind(): void {
    if (!this.windNodes || !this.ctx) return;
    try {
      this.windNodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      const t = this.ctx.currentTime + 0.5;
      this.windNodes.source.stop(t);
    } catch {
      /* ignore */
    }
    this.windNodes = null;
  }

  // --- SFX ------------------------------------------------------------------

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, when = 0): void {
    if (!this.ctx || !this.sfxBus || this.audioFailed || !this.soundOn) return;
    try {
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch {
      this.audioFailed = true;
    }
  }

  private noiseBurst(dur: number, vol: number, filterFreq: number, type: BiquadFilterType = "bandpass", when = 0): void {
    if (!this.ctx || !this.sfxBus || this.audioFailed || !this.soundOn) return;
    try {
      const t = this.ctx.currentTime + when;
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer!;
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = filterFreq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      source.connect(filter);
      filter.connect(g);
      g.connect(this.sfxBus);
      source.start(t);
      source.stop(t + dur + 0.05);
    } catch {
      this.audioFailed = true;
    }
  }

  sfx(name: SfxName): void {
    switch (name) {
      case "click": this.tone(620, 0.07, "square", 0.12, 480); break;
      case "coin": this.tone(880, 0.09, "square", 0.14); this.tone(1320, 0.14, "square", 0.14, undefined, 0.08); break;
      case "launch":
        this.noiseBurst(0.9, 0.35, 300, "lowpass");
        this.tone(220, 0.8, "sawtooth", 0.22, 70);
        this.noiseBurst(0.4, 0.2, 2400, "highpass", 0.05);
        break;
      case "impact":
        this.tone(110, 0.25, "sine", 0.4, 40);
        this.noiseBurst(0.25, 0.3, 500, "lowpass");
        break;
      case "upgrade":
        this.tone(523, 0.1, "triangle", 0.2);
        this.tone(659, 0.1, "triangle", 0.2, undefined, 0.08);
        this.tone(784, 0.18, "triangle", 0.22, undefined, 0.16);
        break;
      case "achievement":
        this.tone(659, 0.12, "triangle", 0.22);
        this.tone(880, 0.12, "triangle", 0.22, undefined, 0.1);
        this.tone(1175, 0.3, "triangle", 0.24, undefined, 0.2);
        break;
      case "newRecord":
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.16, "square", 0.16, undefined, i * 0.09));
        break;
      case "levelUp":
        [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, "triangle", 0.24, undefined, i * 0.1));
        break;
      case "backfire":
        this.tone(160, 0.5, "sawtooth", 0.3, 40);
        this.noiseBurst(0.5, 0.3, 400, "lowpass");
        break;
      case "tick": this.tone(1200, 0.05, "sine", 0.08); break;
      case "slam":
        // sharp mechanical thunk — the pusher stick slamming the tyre
        this.noiseBurst(0.16, 0.4, 280, "lowpass");
        this.tone(165, 0.15, "square", 0.2, 50);
        break;
    }
  }

  // --- Music ----------------------------------------------------------------

  private startMusicLoop(): void {
    if (!this.ctx || this.musicTimer !== null || this.audioFailed || !this.musicOn) return;
    this.musicStep = 0;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 280);
  }

  private scheduleMusic(): void {
    if (!this.ctx || this.audioFailed || !this.musicOn) return;
    try {
      const t0 = this.ctx.currentTime;
      const root = this.musicRoot;
      const scale = this.musicScale;
      const note = (offset: number) => root * Math.pow(2, offset / 12);

      const bass = [0, null, 0, null, -12, null, 0, null, 0, null, 7, null, -12, null, 0, null];
      const arp = [12, 7, 15, 12, 19, 15, 12, 7, 12, 7, 15, 12, 17, 15, 12, 19];

      const s = this.musicStep;
      const when = t0 + 0.02;
      const b = bass[s % 16];
      if (b !== null) {
        this.pluck(note(scale[((b % scale.length) + scale.length) % scale.length] ?? 0) * 0.5, when, 0.22, "triangle", 0.5);
        this.pluck(note(scale[((b % scale.length) + scale.length) % scale.length] ?? 0), when, 0.2, "triangle", 0.28);
      }
      if (s % 2 === 0) {
        const a = arp[s % 16];
        this.pluck(note(scale[((a % scale.length) + scale.length) % scale.length] ?? 0) * 2, when, 0.16, "square", 0.05);
      }
      this.musicStep = (this.musicStep + 1) % 64;
    } catch {
      this.audioFailed = true;
    }
  }

  private pluck(freq: number, when: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.musicBus || this.audioFailed) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(this.musicBus);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  /** Pause everything (page hidden). */
  suspend(): void {
    try {
      void this.ctx?.suspend();
    } catch {
      /* ignore */
    }
  }

  resume(): void {
    try {
      void this.ctx?.resume();
    } catch {
      /* ignore */
    }
  }
}

export const audio = new AudioManager();
