"use client";

import type { SoundId } from "./account";

/**
 * Ambient soundscapes synthesised in the browser with the Web Audio API: no audio files to download.
 * Rain is filtered pink noise with scattered droplets; ocean is brown noise swelling on a slow tide;
 * "hush" is a soft, low white noise.
 */
class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  current: SoundId | null = null;

  private noise(kind: "white" | "pink" | "brown", seconds = 6) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === "white") d[i] = w * 0.5;
        else if (kind === "brown") {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.5;
        } else {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
        }
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  private filter(type: BiquadFilterType, freq: number, q = 0.7) {
    const f = this.ctx!.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  private build(id: SoundId) {
    const ctx = this.ctx!;
    const out = this.master!;
    if (id === "rain") {
      const src = this.noise("pink");
      const hp = this.filter("highpass", 450);
      const lp = this.filter("lowpass", 7000);
      const g = ctx.createGain();
      g.gain.value = 0.55;
      src.connect(hp).connect(lp).connect(g).connect(out);
      src.start();
      this.nodes.push(src, hp, lp, g);
      // Individual droplets on the window
      const drop = () => {
        if (this.current !== "rain" || !this.ctx) return;
        const d = this.noise("white", 0.05);
        d.loop = false;
        const bp = this.filter("bandpass", 1800 + Math.random() * 4200, 4);
        const dg = ctx.createGain();
        const t = ctx.currentTime;
        dg.gain.setValueAtTime(0, t);
        dg.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.12, t + 0.004);
        dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        d.connect(bp).connect(dg).connect(out);
        d.start(t);
        d.stop(t + 0.06);
        this.timers.push(setTimeout(drop, 40 + Math.random() * 220));
      };
      drop();
    } else if (id === "ocean") {
      const src = this.noise("brown", 8);
      const lp = this.filter("lowpass", 900);
      const g = ctx.createGain();
      g.gain.value = 0.5;
      // A slow tide: the swell rises and falls every ~11 seconds
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const depth = ctx.createGain();
      depth.gain.value = 0.42;
      lfo.connect(depth).connect(g.gain);
      const flfo = ctx.createOscillator();
      flfo.frequency.value = 0.09;
      const fdepth = ctx.createGain();
      fdepth.gain.value = 500;
      flfo.connect(fdepth).connect(lp.frequency);
      src.connect(lp).connect(g).connect(out);
      src.start();
      lfo.start();
      flfo.start();
      this.nodes.push(src, lp, g, lfo, depth, flfo, fdepth);
    } else {
      const src = this.noise("pink");
      const lp = this.filter("lowpass", 2400);
      const g = ctx.createGain();
      g.gain.value = 0.45;
      src.connect(lp).connect(g).connect(out);
      src.start();
      this.nodes.push(src, lp, g);
    }
  }

  /** Detaches the current soundscape's nodes and returns a function that silences them. */
  private detach() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    const nodes = this.nodes;
    this.nodes = [];
    return () => {
      for (const n of nodes) {
        try {
          if (n instanceof AudioScheduledSourceNode) n.stop();
          n.disconnect();
        } catch {}
      }
    };
  }

  async play(id: SoundId, volume: number) {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const silence = this.detach();
    if (this.master) {
      // Crossfade: the old soundscape drifts out while the new one rises
      const old = this.master;
      old.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
      setTimeout(() => {
        silence();
        old.disconnect();
      }, 1800);
    } else silence();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    this.current = id;
    this.build(id);
    this.master.gain.setTargetAtTime(volume * 0.6, this.ctx.currentTime, 0.8);
  }

  setVolume(v: number) {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v * 0.6, this.ctx.currentTime, 0.2);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const m = this.master;
    const silence = this.detach();
    m.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    this.current = null;
    setTimeout(() => {
      silence();
      m.disconnect();
      if (!this.current) this.ctx?.suspend();
    }, 2200);
    this.master = null;
  }
}

export const ambient = typeof window !== "undefined" ? new AmbientEngine() : (null as unknown as AmbientEngine);
