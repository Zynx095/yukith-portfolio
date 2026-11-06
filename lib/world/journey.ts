import * as THREE from "three";
import { CAMP, LAKE, TREE, TREE_ENTRANCE_ANGLE, WAYSTONES, pathPoint, terrainHeight, waystonePosition } from "./layout";
import { ARCHIVE, HALL_CENTER, hallAxis } from "./archive";
import { CHAPTERS } from "./chapters";
import { HALL_FLOOR, cavityAt, spine } from "./tree";

/**
 * The camera path and the narration, keyed to journey progress (0 → 1).
 * Chapter boundaries live in ./chapters so the HTML layer can use them.
 */

export { CHAPTERS };

// ─── Narration: one thought at a time, verified facts only ──────────────────

export interface Beat {
  start: number;
  end: number;
  kicker: string;
  line: string;
  sub?: string;
}

export const BEATS: Beat[] = [
  { start: 0.0, end: 0.045, kicker: "Bengaluru, India", line: "Yukith M Joseph", sub: "Computer Science & Engineering · Networks · Presidency University" },
  { start: 0.075, end: 0.105, kicker: "Home", line: "Every build starts somewhere. Mine started here — with family, and Bella." },
  { start: 0.11, end: 0.14, kicker: "Off the clock", line: "Elden Ring, Valorant, Bleach, Lookism — and stories I write myself." },
  { start: 0.145, end: 0.168, kicker: "The lesson", line: "Never give up." },
  { start: 0.18, end: 0.215, kicker: "The path", line: "Four things I keep coming back to." },
  { start: 0.295, end: 0.335, kicker: "The World Tree", line: "Everything I build connects here." },
  { start: 0.345, end: 0.378, kicker: "The network", line: "Its roots carry the signal — like the networks I study." },
  { start: 0.405, end: 0.44, kicker: "The archive", line: "Nine projects inside. Click any relic to open its record." },
  { start: 0.825, end: 0.85, kicker: "The rings", line: "Every year leaves a ring." },
  { start: 0.94, end: 1.01, kicker: "The crown", line: "Let's build something.", sub: "yukithj@gmail.com" },
];

// ─── Archive stops ──────────────────────────────────────────────────────────

export const ARCHIVE_START = 0.49;
export const ARCHIVE_STEP = 0.0375;

export interface FocusStop {
  id: string;
  index: number;
  progress: number;
  /** World position of the relic. */
  target: THREE.Vector3;
  /** Camera position when focused on it. */
  camera: THREE.Vector3;
}

/** Radius of the camera's orbit around the hall axis. */
const ORBIT_R = 10.5;
const EYE = HALL_FLOOR + 4.6;

function orbitPoint(theta: number, r = ORBIT_R, y = EYE) {
  const c = hallAxis(y);
  return new THREE.Vector3(c.x + Math.cos(theta) * r, c.y, c.z + Math.sin(theta) * r);
}

export const FOCUS_STOPS: FocusStop[] = ARCHIVE.map((a, i) => ({
  id: a.project.id,
  index: i,
  progress: ARCHIVE_START + i * ARCHIVE_STEP,
  target: a.center.clone(),
  camera: orbitPoint(a.slot.theta, ORBIT_R + 6.5, EYE - 0.9),
}));

/** Achievement rings carved inside the trunk: local heights. */
export const RINGS = [
  { year: "2024", localY: 58, progress: 0.845 },
  { year: "2025", localY: 128, progress: 0.87 },
  { year: "2026", localY: 198, progress: 0.895 },
];

// ─── Camera keyframes ─────────────────────────────────────────────────────────

export interface Keyframe {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const onGround = (x: number, lift: number, z: number) => V(x, terrainHeight(x, z) + lift, z);

/** A point on the entrance axis, `r` units from the trunk axis, at world height `y`. */
function portal(r: number, y: number) {
  const a = TREE_ENTRANCE_ANGLE;
  const sp = spine(Math.max(y - TREE.y, 0));
  return V(TREE.x + sp.x + Math.cos(a) * r, y, TREE.z + sp.y + Math.sin(a) * r);
}

const entryTheta = TREE_ENTRANCE_ANGLE;

function archiveKeyframes(): Keyframe[] {
  const out: Keyframe[] = [];
  FOCUS_STOPS.forEach((stop, i) => {
    const theta = ARCHIVE[i].slot.theta;
    out.push({ p: stop.progress, pos: stop.camera.clone(), look: stop.target.clone(), fov: 46 });
    const next = FOCUS_STOPS[i + 1];
    if (next) {
      // Between relics the camera keeps to its circle and turns along the wall.
      const theta2 = ARCHIVE[i + 1].slot.theta;
      for (const f of [0.35, 0.65]) {
        const th = THREE.MathUtils.lerp(theta, theta2, f);
        const pos = orbitPoint(th, ORBIT_R + 3.5, EYE - 0.3);
        const look = stop.target.clone().lerp(next.target, f).add(V(0, 0.4, 0));
        out.push({ p: stop.progress + ARCHIVE_STEP * f, pos, look, fov: 48 });
      }
    }
  });
  return out;
}

const first = FOCUS_STOPS[0];
const last = FOCUS_STOPS[FOCUS_STOPS.length - 1];
const way = (i: number) => waystonePosition(i);
const chimney = (localY: number, lookUp = 60, sideTheta = 0, side = 0) => {
  const c = cavityAt(localY);
  const pos = V(TREE.x + c.x + Math.cos(sideTheta) * side, TREE.y + localY, TREE.z + c.z + Math.sin(sideTheta) * side);
  return { pos, look: hallAxis(localY + lookUp) };
};

const ringKeys = (): Keyframe[] =>
  RINGS.flatMap((r, k) => {
    // Rise to each ring and look across at the band carved into the far wall.
    const th = entryTheta + Math.PI * 0.35 + k * 2.1;
    const c = cavityAt(r.localY);
    const wall = V(TREE.x + c.x + Math.cos(th) * c.radius, TREE.y + r.localY + 1, TREE.z + c.z + Math.sin(th) * c.radius);
    const pos = V(TREE.x + c.x - Math.cos(th) * c.radius * 0.35, TREE.y + r.localY - 3, TREE.z + c.z - Math.sin(th) * c.radius * 0.35);
    return [{ p: r.progress, pos, look: wall, fov: 52 }];
  });

export const KEYFRAMES: Keyframe[] = [
  // Arrival: the World Tree on the horizon, the camp below.
  { p: 0.0, pos: V(34, 20, 72), look: V(4, 150, TREE.z), fov: 50 },
  { p: 0.04, pos: V(30, 11, 40), look: V(10, 40, TREE.z * 0.5), fov: 50 },
  // Home.
  { p: 0.075, pos: onGround(24, 3.6, 12), look: V(CAMP.x - 1, CAMP.y + 1.2, CAMP.z - 2), fov: 46 },
  { p: 0.105, pos: onGround(4, 2.0, 2), look: V(CAMP.x + 2, CAMP.y + 0.7, CAMP.z - 3), fov: 44 },
  { p: 0.14, pos: onGround(-2, 2.6, -14), look: V(LAKE.x - 8, 0.5, LAKE.z - 6), fov: 46 },
  { p: 0.168, pos: onGround(8, 3.4, -26), look: pathPoint(0.16, 2.5), fov: 50 },
  // The path: low over the meadow, past each waystone.
  ...WAYSTONES.map((w, i) => {
    const before = pathPoint(w.t - 0.016, 2.1);
    const stone = way(i).add(V(0, 2.2, 0));
    return { p: 0.19 + i * 0.026, pos: before, look: stone, fov: 46 };
  }),
  { p: 0.29, pos: pathPoint(0.66, 9), look: V(TREE.x, 150, TREE.z), fov: 50 },
  // The reveal: rising as the valley opens onto the World Tree.
  { p: 0.32, pos: pathPoint(0.72, 34), look: V(TREE.x, 230, TREE.z), fov: 52 },
  { p: 0.355, pos: V(30, 70, -600), look: V(TREE.x, 290, TREE.z), fov: 54 },
  // The roots: down to the entrance between the great buttresses.
  { p: 0.385, pos: portal(205, 42), look: portal(40, 26), fov: 52 },
  { p: 0.415, pos: portal(120, 12), look: portal(30, 14), fov: 50 },
  { p: 0.44, pos: portal(70, 6.2), look: portal(10, 8), fov: 50 },
  { p: 0.458, pos: portal(42, 5.4), look: portal(0, 7), fov: 54 },
  // Into the hall.
  { p: 0.472, pos: portal(22, 5.8), look: HALL_CENTER.clone().add(V(0, 3.5, 0)), fov: 56 },
  { p: 0.482, pos: orbitPoint(entryTheta, 6, EYE + 0.6), look: first.target.clone().lerp(HALL_CENTER, 0.3).add(V(0, 2, 0)), fov: 54 },
  ...archiveKeyframes(),
  // The rings: up through the hollow.
  { p: last.progress + 0.02, pos: orbitPoint(ARCHIVE[ARCHIVE.length - 1].slot.theta + 0.4, 4, EYE + 3), look: hallAxis(60), fov: 56 },
  ...ringKeys(),
  { p: 0.925, ...chimney(300, 80), fov: 56 },
  // The crown: out of the broken top, over the canopy, the valley below at blue hour.
  { p: 0.955, pos: hallAxis(380), look: V(20, 120, -300), fov: 56 },
  { p: 1.0, pos: V(TREE.x + 30, TREE.y + 620, TREE.z + 120), look: V(20, 0, -150), fov: 54 },
];

// ─── Smooth pacing: monotone cubic (PCHIP) from progress to keyframe index ──

const xs = KEYFRAMES.map((k) => k.p);
for (let i = 1; i < xs.length; i++) if (!(xs[i] > xs[i - 1])) throw new Error(`journey keyframes out of order at ${i}: ${xs[i - 1]} ≥ ${xs[i]}`);
const ys = KEYFRAMES.map((_, i) => i);
const slopes = (() => {
  const n = xs.length;
  const d = new Array(n - 1).fill(0).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return m;
})();

/** Fractional keyframe index for a progress value (C1-continuous). */
export function keyframeParam(p: number) {
  const n = xs.length;
  if (p <= xs[0]) return 0;
  if (p >= xs[n - 1]) return n - 1;
  let i = 0;
  while (i < n - 2 && p > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i];
  const t = (p - xs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * slopes[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * slopes[i + 1];
}

export const POSITION_CURVE = new THREE.CatmullRomCurve3(KEYFRAMES.map((k) => k.pos), false, "centripetal");
export const LOOK_CURVE = new THREE.CatmullRomCurve3(KEYFRAMES.map((k) => k.look), false, "centripetal");

/** Camera pose for a progress value; returns the field of view. */
export function poseAt(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const k = keyframeParam(p);
  const u = k / (KEYFRAMES.length - 1);
  POSITION_CURVE.getPoint(u, pos);
  LOOK_CURVE.getPoint(u, look);
  const i = Math.min(Math.floor(k), KEYFRAMES.length - 2);
  const f = k - i;
  return THREE.MathUtils.lerp(KEYFRAMES[i].fov, KEYFRAMES[i + 1].fov, f * f * (3 - 2 * f));
}

/** 0 outside the tree → 1 inside the hall (drives light, fog and exposure). */
export function interiorAmount(p: number) {
  return THREE.MathUtils.smoothstep(p, 0.452, 0.476) * (1 - THREE.MathUtils.smoothstep(p, 0.935, 0.96));
}
