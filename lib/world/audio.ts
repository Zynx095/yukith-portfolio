/**
 * Ambient sound, synthesised with the Web Audio API — no audio files, so
 * there is nothing to download and no asset that can fail to load.
 *
 *   wind     filtered brown noise, strongest in the open valley
 *   fire     crackles from short noise bursts, at the home camp
 *   water    band-passed noise by the lake and the river
 *   crickets amplitude-modulated tones as dusk falls
 *   hall     a low, slowly beating drone and soft air inside the tree
 *   chime    a single soft bell when a relic comes into focus
 *
 * Sound is off until the visitor turns it on (a user gesture, as browsers
 * require), fades in and out, and pauses while the tab is hidden.
 */

export interface AmbientMix {
  wind: number;
  fire: number;
  water: number;
  crickets: number;
  hall: number;
}

function noiseBuffer(ctx: AudioContext, seconds = 4, brown = true) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

export class Ambient {
  private ctx: AudioContext;
  private master: GainNode;
  private layers: Record<keyof AmbientMix, GainNode>;
  private windFilter: BiquadFilterNode;
  private crackleTimer = 0;
  private stopped = false;

  constructor() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    const layer = () => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.master);
      return g;
    };
    this.layers = { wind: layer(), fire: layer(), water: layer(), crickets: layer(), hall: layer() };

    const brown = noiseBuffer(ctx, 6, true);
    const white = noiseBuffer(ctx, 3, false);
    const loop = (buf: AudioBuffer) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start(0, Math.random() * buf.duration);
      return s;
    };

    // Wind: brown noise through a slowly wandering low-pass.
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "lowpass";
    this.windFilter.frequency.value = 500;
    loop(brown).connect(this.windFilter).connect(this.layers.wind);

    // Water: white noise band-passed into a soft rush.
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.frequency.value = 900;
    wf.Q.value = 0.6;
    const wg = ctx.createGain();
    wg.gain.value = 0.35;
    loop(white).connect(wf).connect(wg).connect(this.layers.water);

    // Crickets: a high tone gated by a fast tremolo.
    for (const f of [4200, 4650]) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const trem = ctx.createGain();
      trem.gain.value = 0;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 28 + Math.random() * 6;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain).connect(trem.gain);
      o.connect(trem).connect(this.layers.crickets);
      o.start();
      lfo.start();
    }

    // Hall: two low sines a hair apart (a slow beat) plus warm air.
    for (const f of [55, 55.35, 82.4]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = f > 80 ? 0.05 : 0.12;
      o.connect(g).connect(this.layers.hall);
      o.start();
    }
    const air = ctx.createBiquadFilter();
    air.type = "lowpass";
    air.frequency.value = 260;
    const ag = ctx.createGain();
    ag.gain.value = 0.5;
    loop(brown).connect(air).connect(ag).connect(this.layers.hall);

    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private onVisibility = () => {
    if (document.hidden) void this.ctx.suspend();
    else if (!this.stopped) void this.ctx.resume();
  };

  async start() {
    this.stopped = false;
    await this.ctx.resume();
    this.master.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.8);
  }

  stop() {
    this.stopped = true;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    window.setTimeout(() => this.stopped && void this.ctx.suspend(), 1200);
  }

  /** Called every frame with the desired loudness of each layer (0..1). */
  update(mix: AmbientMix, dt: number) {
    const now = this.ctx.currentTime;
    (Object.keys(mix) as (keyof AmbientMix)[]).forEach((k) => this.layers[k].gain.setTargetAtTime(mix[k], now, 0.6));
    this.windFilter.frequency.setTargetAtTime(380 + 260 * (0.5 + 0.5 * Math.sin(now * 0.13)), now, 1.5);
    // Fire: occasional crackles, more often when the fire is loud.
    this.crackleTimer -= dt;
    if (mix.fire > 0.05 && this.crackleTimer <= 0) {
      this.crackleTimer = 0.04 + Math.random() * 0.35;
      this.crackle(mix.fire);
    }
  }

  private crackle(level: number) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * (0.01 + Math.random() * 0.03));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1200 + Math.random() * 2500;
    const g = ctx.createGain();
    g.gain.value = level * (0.25 + Math.random() * 0.5);
    s.connect(f).connect(g).connect(this.master);
    s.start();
  }

  /** A soft bell for a relic coming into focus. */
  chime() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    for (const [f, a] of [
      [659.25, 0.07],
      [987.77, 0.035],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(a, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      o.connect(g).connect(this.master);
      o.start(now);
      o.stop(now + 2.5);
    }
  }

  dispose() {
    document.removeEventListener("visibilitychange", this.onVisibility);
    void this.ctx.close();
  }
}
