import * as THREE from "three";
import { CAMP, TREE, TREE_GROUND, WATERFALL } from "./layout";
import { ARCHIVE_SLOTS, cavityAt, slotPosition, spine, type MountKind } from "./tree";
import type { ArtifactId } from "./archive";

/**
 * The journey: chapters, narration and the camera path, all keyed to scroll
 * progress (0 → 1). Positions are world coordinates.
 */

export { JOURNEY_VH } from "./constants";

// ─── Narration (one thought at a time; verified facts only) ──────────────────

export interface Beat {
  start: number;
  end: number;
  kicker: string;
  line: string;
  sub?: string;
}

export const BEATS: Beat[] = [
  { start: 0.0, end: 0.032, kicker: "Bengaluru", line: "Yukith M Joseph", sub: "Network security · Applied AI · Builder" },
  { start: 0.038, end: 0.078, kicker: "Family", line: "My mom, my dad, my grandma, my aunt, her son — my brother — and Bella." },
  { start: 0.082, end: 0.112, kicker: "Foundation", line: "They are my foundation, my strength, and the reason I keep going." },
  { start: 0.118, end: 0.152, kicker: "And her", line: "My girlfriend — who keeps me growing into a better version of myself." },
  { start: 0.165, end: 0.225, kicker: "Presidency University", line: "B.Tech in Computer Science & Engineering — networks and cybersecurity." },
  { start: 0.235, end: 0.285, kicker: "The lesson", line: "Never give up." },
  { start: 0.3, end: 0.345, kicker: "The World Tree", line: "Everything I have built grows here." },
  { start: 0.355, end: 0.43, kicker: "What I build", line: "Security systems, AI, games and websites — each one a branch." },
  { start: 0.445, end: 0.5, kicker: "The archive", line: "Step inside." },
  { start: 0.962, end: 1.01, kicker: "Next", line: "The rest of the story, in the open." },
];

export const CHAPTERS = [
  { start: 0, label: "Home" },
  { start: 0.15, label: "The river" },
  { start: 0.23, label: "The falls" },
  { start: 0.29, label: "The valley" },
  { start: 0.44, label: "The World Tree" },
  { start: 0.535, label: "The archive" },
  { start: 0.955, label: "Ascent" },
];

// ─── Archive focus windows ────────────────────────────────────────────────────

export const ARCHIVE_START = 0.555;
export const ARCHIVE_STEP = 0.0368;

export interface FocusStop {
  id: ArtifactId;
  progress: number;
  /** World position of the relic. */
  target: THREE.Vector3;
  /** Ideal camera position when focused. */
  camera: THREE.Vector3;
}

const treeWorld = (v: THREE.Vector3) => v.add(new THREE.Vector3(TREE.x, TREE_GROUND, TREE.z));

/** Radius of a relic medallion (world units). */
export const RELIC_RADIUS = 1.55;

/** Height of a relic's centre above its mount point (clear of the mount itself). */
export function relicLift(mount: MountKind) {
  switch (mount) {
    case "alcove":
      return 4.2; // above the carved plinth
    case "branch":
      return 2.05;
    case "fungus":
      return 2.15;
    case "suspended":
      return 2.6;
    case "roots":
    default:
      return 2.0;
  }
}

export const FOCUS_STOPS: FocusStop[] = ARCHIVE_SLOTS.map((slot, i) => {
  const mount = treeWorld(slotPosition(slot));
  const target = mount.clone().add(new THREE.Vector3(0, relicLift(slot.mount), 0));
  const axis = spine(slot.y);
  const toAxis = new THREE.Vector3(TREE.x + axis.x - target.x, 0, TREE.z + axis.y - target.z).normalize();
  const camera = target.clone().addScaledVector(toAxis, 8.5).add(new THREE.Vector3(0, 1.4, 0));
  return { id: slot.id, progress: ARCHIVE_START + i * ARCHIVE_STEP, target, camera };
});

// ─── Camera keyframes ─────────────────────────────────────────────────────────

export interface Keyframe {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const tz = TREE.z;
const portal = (r: number, y: number) => {
  // A point on the portal axis, r units out from the trunk axis.
  const a = Math.PI / 2 - 0.12;
  const sp = spine(Math.max(y - TREE_GROUND, 0));
  return V(TREE.x + sp.x + Math.cos(a) * r, y, tz + sp.y + Math.sin(a) * r);
};

function interiorKeyframes(): Keyframe[] {
  const out: Keyframe[] = [];
  FOCUS_STOPS.forEach((stop, i) => {
    out.push({ p: stop.progress, pos: stop.camera.clone(), look: stop.target.clone(), fov: 46 });
    const next = FOCUS_STOPS[i + 1];
    if (next) {
      // Between relics: drift towards the hall's axis and look up to the next one.
      const midY = (stop.target.y + next.target.y) / 2;
      const c = cavityAt(midY - TREE_GROUND);
      const axis = V(TREE.x + c.x, midY, tz + c.z);
      const from = stop.camera.clone().lerp(next.camera, 0.5);
      const pos = axis.clone().lerp(from, 0.55);
      out.push({ p: stop.progress + ARCHIVE_STEP * 0.5, pos, look: next.target.clone().lerp(stop.target, 0.25), fov: 50 });
    }
  });
  return out;
}

const firstStop = FOCUS_STOPS[0];
const lastStop = FOCUS_STOPS[FOCUS_STOPS.length - 1];
const chimney = (y: number) => {
  const c = cavityAt(y - TREE_GROUND);
  return V(TREE.x + c.x, y, tz + c.z);
};

export const KEYFRAMES: Keyframe[] = [
  // Home: the World Tree on the horizon, then down to the camp.
  { p: 0.0, pos: V(19, 5.2, 24), look: V(0, 230, TREE.z), fov: 50 },
  { p: 0.03, pos: V(17, 3.8, 13), look: V(5, 2.2, -18), fov: 48 },
  // The whole family around the fire.
  { p: 0.065, pos: V(6, 4.0, -1.5), look: V(6.5, 0.8, -16.5), fov: 46 },
  // Closer, by the fire's warmth.
  { p: 0.098, pos: V(12.5, 2.4, -6), look: V(4.5, 1.0, -16), fov: 46 },
  // Her, at the lake's edge.
  { p: 0.13, pos: V(-2.5, 1.9, -6.5), look: V(-11, 0.9, -17), fov: 46 },
  // Along the shore and up the river.
  { p: 0.17, pos: V(-13, 4.2, -43), look: V(-30, 5, -82), fov: 52 },
  { p: 0.21, pos: V(-29, 5.4, -80), look: V(WATERFALL.lip.x, 14, WATERFALL.lip.z), fov: 52 },
  // The falls.
  { p: 0.255, pos: V(-38, 6.5, -100), look: V(WATERFALL.lip.x, 12, WATERFALL.lip.z), fov: 50 },
  // Turn to the valley: the World Tree revealed.
  { p: 0.295, pos: V(-33, 10, -118), look: V(-6, 120, TREE.z), fov: 52 },
  // Valley flight.
  { p: 0.34, pos: V(-16, 30, -230), look: V(0, 230, TREE.z), fov: 54 },
  { p: 0.39, pos: V(-4, 52, -410), look: V(0, 250, TREE.z), fov: 54 },
  { p: 0.44, pos: V(6, 42, -600), look: V(2, 170, TREE.z), fov: 52 },
  // Down to the roots and the portal.
  { p: 0.475, pos: portal(120, 15), look: portal(40, 14), fov: 50 },
  { p: 0.5, pos: portal(72, 6.5), look: portal(30, 9), fov: 50 },
  { p: 0.52, pos: portal(44, 5.5), look: portal(10, 8), fov: 52 },
  // Into the hall.
  { p: 0.538, pos: portal(18, 6), look: firstStop.target.clone().lerp(V(TREE.x, 20, tz), 0.4), fov: 54 },
  ...interiorKeyframes(),
  // Ascent through the chimney into the light.
  { p: lastStop.progress + 0.022, pos: chimney(lastStop.target.y + 18), look: chimney(lastStop.target.y + 60).add(V(10, 0, 0)), fov: 54 },
  { p: 0.975, pos: chimney(270), look: chimney(360).add(V(14, 0, 0)), fov: 56 },
  { p: 1.0, pos: chimney(325), look: chimney(420).add(V(14, 0, 0)), fov: 58 },
];

// ─── Smooth pacing: monotone cubic (PCHIP) from progress to keyframe index ──

const xs = KEYFRAMES.map((k) => k.p);
const ys = KEYFRAMES.map((_, i) => i);
const slopes = (() => {
  const n = xs.length;
  const d = new Array(n - 1).fill(0).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
      const w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]);
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
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
  return (
    (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * slopes[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * slopes[i + 1]
  );
}

export const POSITION_CURVE = new THREE.CatmullRomCurve3(KEYFRAMES.map((k) => k.pos), false, "centripetal");
export const LOOK_CURVE = new THREE.CatmullRomCurve3(KEYFRAMES.map((k) => k.look), false, "centripetal");

/** Camera pose for a progress value. */
export function poseAt(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const k = keyframeParam(p);
  const u = k / (KEYFRAMES.length - 1);
  POSITION_CURVE.getPoint(u, pos);
  LOOK_CURVE.getPoint(u, look);
  const i = Math.min(Math.floor(k), KEYFRAMES.length - 2);
  const f = k - i;
  return THREE.MathUtils.lerp(KEYFRAMES[i].fov, KEYFRAMES[i + 1].fov, f * f * (3 - 2 * f));
}

/** 0 outside the tree, 1 deep inside — drives lighting, exposure and fog. */
export function interiorAmount(p: number) {
  return THREE.MathUtils.smoothstep(p, 0.505, 0.54);
}
