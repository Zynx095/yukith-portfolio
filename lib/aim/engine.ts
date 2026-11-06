/**
 * Aim-trainer rules — pure and deterministic given an RNG, so they can be
 * tested without a browser (scripts/test-aim.ts). The renderer
 * (components/aim/AimTrainer.tsx) only draws `session.targets` and reports
 * shots back.
 *
 * Coordinates: targets live on a wall in front of the player, x ∈ [-W, W],
 * y ∈ [-H, H] (metres), at depth `WALL_DEPTH`.
 */

export type AimMode = "flick" | "precision" | "reaction" | "moving";
export type Difficulty = "easy" | "normal" | "hard";
export type Phase = "idle" | "countdown" | "running" | "paused" | "done";

export const WALL = { w: 5.2, h: 2.4 };
export const WALL_DEPTH = 10;
export const COUNTDOWN = 3;

export interface ModeSpec {
  label: string;
  blurb: string;
  /** Seconds, or rounds for the reaction test. */
  length: number;
  unit: "seconds" | "rounds";
  /** Targets on the wall at once. */
  concurrent: number;
}

export const MODES: Record<AimMode, ModeSpec> = {
  flick: { label: "Flick", blurb: "Targets appear anywhere on the wall. Snap to each one.", length: 30, unit: "seconds", concurrent: 1 },
  precision: { label: "Precision", blurb: "Smaller targets, three at a time. Misses cost points.", length: 30, unit: "seconds", concurrent: 3 },
  reaction: { label: "Reaction", blurb: "Wait for the target, then hit it as fast as you can. Ten rounds.", length: 10, unit: "rounds", concurrent: 1 },
  moving: { label: "Moving targets", blurb: "Targets strafe across the wall. Track and hit.", length: 30, unit: "seconds", concurrent: 2 },
};

export interface DifficultySpec {
  label: string;
  /** Target radius in metres. */
  radius: number;
  /** Seconds a target stays before it is missed (flick / precision / moving). */
  life: number;
  /** Strafe speed, metres per second (moving). */
  speed: number;
}

export const DIFFICULTY: Record<Difficulty, DifficultySpec> = {
  easy: { label: "Easy", radius: 0.42, life: 2.6, speed: 1.4 },
  normal: { label: "Normal", radius: 0.3, life: 1.8, speed: 2.4 },
  hard: { label: "Hard", radius: 0.2, life: 1.2, speed: 3.6 },
};

export interface Target {
  id: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  /** Session time (s) when it appeared. */
  born: number;
  /** Seconds until it expires unhit. */
  life: number;
}

export interface Results {
  mode: AimMode;
  difficulty: Difficulty;
  score: number;
  shots: number;
  hits: number;
  /** Targets that expired unhit. */
  expired: number;
  accuracy: number;
  /** Mean time from appearance to hit, milliseconds (null with no hits). */
  avgReactionMs: number | null;
  bestReactionMs: number | null;
}

/** Points for a hit: 100, plus up to 100 for speed, scaled up for smaller targets. */
export function hitPoints(reactionS: number, radius: number) {
  const speed = Math.max(0, 1 - reactionS / 1.5);
  const size = 0.3 / radius;
  return Math.round((100 + 100 * speed) * size);
}

export const MISS_PENALTY: Record<AimMode, number> = { flick: 0, precision: 40, reaction: 0, moving: 0 };

export class AimSession {
  readonly mode: AimMode;
  readonly difficulty: Difficulty;
  readonly spec: ModeSpec;
  readonly diff: DifficultySpec;
  phase: Phase = "idle";
  /** Seconds since the run started (excludes countdown and pauses). */
  time = 0;
  /** Seconds left in the countdown. */
  countdown = COUNTDOWN;
  score = 0;
  shots = 0;
  hits = 0;
  expired = 0;
  round = 0;
  reactions: number[] = [];
  targets: Target[] = [];
  private nextId = 1;
  /** Reaction test: when the next target appears. */
  private nextAt = 0;
  private rng: () => number;

  constructor(mode: AimMode, difficulty: Difficulty, rng: () => number = Math.random) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.spec = MODES[mode];
    this.diff = DIFFICULTY[difficulty];
    this.rng = rng;
  }

  start() {
    this.phase = "countdown";
    this.countdown = COUNTDOWN;
  }

  pause() {
    if (this.phase === "running" || this.phase === "countdown") this.phase = "paused";
  }

  resume() {
    if (this.phase !== "paused") return;
    this.phase = this.countdown > 0 ? "countdown" : "running";
  }

  get remaining() {
    return this.spec.unit === "seconds" ? Math.max(0, this.spec.length - this.time) : this.spec.length - this.round;
  }

  get accuracy() {
    return this.shots ? this.hits / this.shots : 0;
  }

  /** Advance by dt seconds. */
  update(dt: number) {
    if (this.phase === "countdown") {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.phase = "running";
        this.begin();
        // Fall through so the first targets appear on the same tick.
        dt = 0;
      } else return;
    }
    if (this.phase !== "running") return;
    this.time += dt;

    // Move and expire.
    for (const t of this.targets) {
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      if (Math.abs(t.x) > WALL.w - t.r) {
        t.vx = -t.vx;
        t.x = Math.sign(t.x) * (WALL.w - t.r);
      }
      if (Math.abs(t.y) > WALL.h - t.r) {
        t.vy = -t.vy;
        t.y = Math.sign(t.y) * (WALL.h - t.r);
      }
    }
    const alive = this.targets.filter((t) => this.time - t.born < t.life);
    const gone = this.targets.length - alive.length;
    this.expired += gone;
    this.targets = alive;
    if (gone && this.mode === "reaction") this.nextAt = this.time + 0.9 + this.rng() * 1.8;

    if (this.mode === "reaction") {
      if (!this.targets.length && this.round < this.spec.length && this.time >= this.nextAt) this.spawn();
      if (this.round >= this.spec.length && !this.targets.length) this.finish();
      return;
    }
    while (this.targets.length < this.spec.concurrent) this.spawn();
    if (this.time >= this.spec.length) this.finish();
  }

  /**
   * Register a shot. `targetId` is the target the ray hit (null for a miss).
   * Returns the points awarded (negative for a penalised miss).
   */
  shoot(targetId: number | null): number {
    if (this.phase !== "running") return 0;
    this.shots++;
    const t = targetId == null ? undefined : this.targets.find((x) => x.id === targetId);
    if (!t) {
      const penalty = Math.min(this.score, MISS_PENALTY[this.mode]);
      this.score -= penalty;
      return -penalty;
    }
    const reaction = this.time - t.born;
    const pts = hitPoints(reaction, t.r);
    this.hits++;
    this.score += pts;
    this.reactions.push(reaction);
    this.targets = this.targets.filter((x) => x.id !== t.id);
    if (this.mode === "reaction") this.nextAt = this.time + 0.9 + this.rng() * 1.8;
    return pts;
  }

  /** Hit test on the wall plane (x, y in metres). */
  pick(x: number, y: number): number | null {
    let best: Target | null = null;
    let bestD = Infinity;
    for (const t of this.targets) {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d <= t.r && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best ? best.id : null;
  }

  results(): Results {
    const ms = this.reactions.map((r) => r * 1000);
    return {
      mode: this.mode,
      difficulty: this.difficulty,
      score: this.score,
      shots: this.shots,
      hits: this.hits,
      expired: this.expired,
      accuracy: this.accuracy,
      avgReactionMs: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null,
      bestReactionMs: ms.length ? Math.round(Math.min(...ms)) : null,
    };
  }

  private begin() {
    this.time = 0;
    if (this.mode === "reaction") this.nextAt = 0.9 + this.rng() * 1.6;
  }

  private finish() {
    this.phase = "done";
    this.targets = [];
  }

  private spawn() {
    const r = this.mode === "precision" ? this.diff.radius * 0.7 : this.diff.radius;
    let x = 0;
    let y = 0;
    // Keep new targets apart from the ones already on the wall.
    for (let tries = 0; tries < 12; tries++) {
      x = (this.rng() * 2 - 1) * (WALL.w - r);
      y = (this.rng() * 2 - 1) * (WALL.h - r);
      if (this.targets.every((t) => Math.hypot(t.x - x, t.y - y) > (t.r + r) * 2.2)) break;
    }
    const moving = this.mode === "moving";
    const dir = this.rng() < 0.5 ? -1 : 1;
    this.targets.push({
      id: this.nextId++,
      x,
      y,
      r,
      vx: moving ? dir * this.diff.speed * (0.7 + this.rng() * 0.6) : 0,
      vy: moving ? (this.rng() * 2 - 1) * this.diff.speed * 0.25 : 0,
      born: this.time,
      // A reaction target waits up to three seconds, then the round counts as missed.
      life: this.mode === "reaction" ? 3 : this.diff.life * (moving ? 1.4 : 1),
    });
    if (this.mode === "reaction") this.round++;
  }
}

/** Seeded RNG for tests. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
