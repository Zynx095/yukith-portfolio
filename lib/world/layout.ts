import * as THREE from "three";
import { SimplexNoise, clamp, lerp, smoothstep } from "./noise";

/**
 * Single source of truth for the world's geography.
 *
 * +X right, +Y up, −Z is "forward" along the journey. Units are metres.
 *
 *   home camp + lake (z ≈ 0)  →  meadow path beside the river  →
 *   tree clearing (r ≈ 175)  →  the World Tree (z = −820)
 *
 * The river rises from a spring among the World Tree's roots and runs down the
 * valley to the lake by the camp. Every system that places something on the
 * ground samples `terrainHeight`, so nothing floats or sinks.
 */

export const WATER_LEVEL = -0.4;

export const CAMP = new THREE.Vector3(10, 0, -8);
export const CAMP_RADIUS = 11;

/** Lake by the camp: rotated, wobbly ellipse. */
export const LAKE = { x: -22, z: -34, rx: 22, rz: 14, rotation: -0.45, depth: 3.2 };

/** World Tree trunk axis (y = ground level of the clearing). */
export const TREE = new THREE.Vector3(0, 1.2, -820);
export const TREE_GROUND = 1.2;
/** Angle (atan2(z, x) around the trunk axis) the root entrance faces: towards the approach. */
export const TREE_ENTRANCE_ANGLE = Math.PI / 2 - 0.12;
export const CLEARING_RADIUS = 175;

const noise = new SimplexNoise(20261);

function smin(a: number, b: number, k: number) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return lerp(b, a, h) - k * h * (1 - h);
}

// ─── Curves: river and path ───────────────────────────────────────────────────

/** River centreline from the spring by the roots down to the lake (y = water surface). */
const RIVER_POINTS: [number, number, number][] = [
  [-58, 2.0, -676],
  [-74, 1.75, -600],
  [-52, 1.5, -520],
  [-26, 1.2, -450],
  [-14, 0.95, -380],
  [-22, 0.7, -305],
  [-8, 0.45, -228],
  [-20, 0.2, -150],
  [-30, -0.05, -88],
  [-27, -0.3, -52],
];

export const RIVER_CURVE = new THREE.CatmullRomCurve3(
  RIVER_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal"
);

/** The trail the journey follows: camp → right bank of the river → clearing → the entrance. */
const PATH_POINTS: [number, number][] = [
  [12, 2],
  [16, -40],
  [22, -96],
  [30, -160],
  [24, -232],
  [30, -300],
  [46, -372],
  [58, -450],
  [44, -530],
  [24, -600],
  [12, -660],
  [9, -720],
];

export const PATH_CURVE = new THREE.CatmullRomCurve3(
  PATH_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  "centripetal"
);

interface Polyline {
  pts: THREE.Vector3[];
  /** Spatial hash: cell → segment indices. */
  grid: Map<number, number[]>;
}
const CELL = 24;
const key = (cx: number, cz: number) => cx * 73856093 + cz * 19349663;

function buildPolyline(curve: THREE.CatmullRomCurve3, samples: number, pad: number): Polyline {
  const pts = curve.getSpacedPoints(samples);
  const grid = new Map<number, number[]>();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const x0 = Math.floor((Math.min(a.x, b.x) - pad) / CELL);
    const x1 = Math.floor((Math.max(a.x, b.x) + pad) / CELL);
    const z0 = Math.floor((Math.min(a.z, b.z) - pad) / CELL);
    const z1 = Math.floor((Math.max(a.z, b.z) + pad) / CELL);
    for (let cx = x0; cx <= x1; cx++)
      for (let cz = z0; cz <= z1; cz++) {
        const k = key(cx, cz);
        let list = grid.get(k);
        if (!list) grid.set(k, (list = []));
        list.push(i);
      }
  }
  return { pts, grid };
}

const RIVER_LINE = buildPolyline(RIVER_CURVE, 260, 30);
const PATH_LINE = buildPolyline(PATH_CURVE, 300, 30);

/** Distance to a polyline (XZ), its normalised parameter and the interpolated y there. Far = Infinity. */
function nearest(line: Polyline, x: number, z: number) {
  const list = line.grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
  if (!list) return { dist: Infinity, t: 0, y: 0 };
  let best = Infinity;
  let bi = 0;
  let bt = 0;
  for (const i of list) {
    const a = line.pts[i];
    const b = line.pts[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const t = clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz), 0, 1);
    const px = a.x + abx * t - x;
    const pz = a.z + abz * t - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) {
      best = d2;
      bi = i;
      bt = t;
    }
  }
  const a = line.pts[bi];
  const b = line.pts[bi + 1];
  return { dist: Math.sqrt(best), t: (bi + bt) / (line.pts.length - 1), y: lerp(a.y, b.y, bt) };
}

export const riverInfo = (x: number, z: number) => {
  const r = nearest(RIVER_LINE, x, z);
  return { dist: r.dist, t: r.t, surface: r.y };
};
export const pathInfo = (x: number, z: number) => {
  const r = nearest(PATH_LINE, x, z);
  return { dist: r.dist, t: r.t };
};

/** River half-width along its course (a narrow spring, a wider lower river). */
export function riverHalfWidth(t: number) {
  return lerp(2.2, 5.2, smoothstep(0, 0.6, t)) + Math.sin(t * 23.0) * 0.35;
}

/** Trail half-width. */
export const PATH_HALF_WIDTH = 1.05;

/** Normalised elliptical distance from the lake centre (≈1 at the shoreline). */
export function lakeDistance(x: number, z: number) {
  const dx = x - LAKE.x;
  const dz = z - LAKE.z;
  const c = Math.cos(LAKE.rotation);
  const s = Math.sin(LAKE.rotation);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const ang = Math.atan2(lz, lx);
  const wobble = 1 + 0.08 * Math.sin(ang * 3 + 0.7) + 0.05 * Math.sin(ang * 5 - 1.3);
  return Math.sqrt((lx / LAKE.rx) ** 2 + (lz / LAKE.rz) ** 2) / wobble;
}

// ─── Valley shape ─────────────────────────────────────────────────────────────

export function valleyCenter(z: number) {
  return 14 * Math.sin(z * 0.0042 + 0.4) + 6;
}

function valleyHalfWidth(z: number) {
  const widening = smoothstep(-200, -700, z); // the valley opens towards the tree
  return 150 + widening * 170 + 30 * noise.noise2(z * 0.004, 3.1);
}

/** Ground height at world (x, z). Deterministic; cheap enough for ~200k samples. */
export function terrainHeight(x: number, z: number): number {
  // Broad meadow undulation.
  let h = noise.fbm2(x * 0.006, z * 0.006, 4) * 3.2 + noise.fbm2(x * 0.028 + 7.3, z * 0.028 - 2.1, 3) * 0.6;

  // Valley sides: rolling wooded hills, then — far away — smooth blue mountains.
  const d = Math.abs(x - valleyCenter(z)) - valleyHalfWidth(z);
  if (d > 0) {
    const rise = Math.pow(smoothstep(0, 320, d), 1.6);
    const hills = 38 + noise.fbm2(x * 0.0032 + 11, z * 0.0032 - 5, 4) * 26;
    h += rise * hills + smoothstep(0, 120, d) * noise.fbm2(x * 0.011, z * 0.011, 3) * 5;
    // Mountains are smooth at the scale the far grid can resolve (no sub-cell ridges).
    const mountain = 0.5 + 0.5 * noise.fbm2(x * 0.0011 + 2.3, z * 0.0011 - 7.1, 3);
    h += smoothstep(450, 1300, d) * (110 + mountain * mountain * 330);
  }
  // The land behind the camp rises gently so the opening shot has a horizon behind it.
  h += smoothstep(40, 320, z) * (14 + noise.fbm2(x * 0.008, z * 0.008, 3) * 7);
  // Far mountains behind the World Tree, low enough that the crown reads against the sky.
  const far = 0.5 + 0.5 * noise.fbm2(x * 0.0012 + 4, z * 0.0012, 3);
  h += smoothstep(-1300, -1900, z) * (70 + far * far * 260);

  // Home camp clearing — flattened with a slight crown.
  const cd = Math.hypot(x - CAMP.x, z - CAMP.z);
  if (cd < CAMP_RADIUS + 14) h = lerp(h, 0.55 - cd * 0.004, 1 - smoothstep(CAMP_RADIUS, CAMP_RADIUS + 14, cd));

  // World Tree clearing — flat where the roots spread, a soft mound at the base.
  const td = Math.hypot(x - TREE.x, z - TREE.z);
  if (td < CLEARING_RADIUS + 110) {
    const mound = TREE_GROUND + smoothstep(CLEARING_RADIUS - 20, 45, td) * 2.6 + noise.fbm2(x * 0.02, z * 0.02, 3) * 0.6;
    h = lerp(h, mound, 1 - smoothstep(CLEARING_RADIUS, CLEARING_RADIUS + 110, td));
  }

  // The trail is worn slightly into the ground.
  const p = pathInfo(x, z);
  if (p.dist < PATH_HALF_WIDTH + 3) h -= 0.12 * (1 - smoothstep(PATH_HALF_WIDTH - 0.5, PATH_HALF_WIDTH + 3, p.dist));

  // Dry land stays above the water table: hollows are eased up so only the lake and river hold water.
  h = -smin(-h, -(WATER_LEVEL + 0.45), 1.2);

  // Lake basin.
  const ld = lakeDistance(x, z);
  if (ld < 1.7) {
    const shore = WATER_LEVEL + 0.22;
    if (ld < 1) {
      const bed = WATER_LEVEL - LAKE.depth * (1 - ld * ld);
      h = Math.min(h, lerp(bed, shore, smoothstep(0.72, 1.0, ld)));
    } else h = Math.min(h, lerp(shore, h, smoothstep(1, 1.7, ld)));
  }

  // River channel, carved below the local water surface.
  const r = riverInfo(x, z);
  if (r.dist < 20) {
    const hw = riverHalfWidth(r.t);
    const carve =
      r.dist < hw ? r.surface - 0.3 - 1.1 * (1 - (r.dist / hw) ** 2) : lerp(r.surface + 0.25, h, smoothstep(hw + 0.4, hw + 8, r.dist));
    h = Math.min(h, carve);
  }

  return h;
}

/** Central-difference terrain normal. */
export function terrainNormal(x: number, z: number, out = new THREE.Vector3()) {
  const e = 0.75;
  const hl = terrainHeight(x - e, z);
  const hr = terrainHeight(x + e, z);
  const hd = terrainHeight(x, z - e);
  const hu = terrainHeight(x, z + e);
  return out.set(hl - hr, 2 * e, hd - hu).normalize();
}

/** Areas that must stay clear of trees, rocks and grass clumps. */
/** The hackathon district's clearing: kept free of trees, rocks and grass. */
export const DISTRICT_SITE = { x: 122, z: -500, r: 46 };

export function isReserved(x: number, z: number, margin = 0) {
  if (Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP_RADIUS + 6 + margin) return true;
  if (lakeDistance(x, z) < 1.15 + margin * 0.04) return true;
  const r = riverInfo(x, z);
  if (r.dist < riverHalfWidth(r.t) + 2 + margin) return true;
  if (pathInfo(x, z).dist < PATH_HALF_WIDTH + 1.5 + margin) return true;
  if (Math.hypot(x - TREE.x, z - TREE.z) < 130 + margin) return true;
  // The hackathon district's clearing (lib/world/regions.ts).
  if (Math.hypot(x - DISTRICT_SITE.x, z - DISTRICT_SITE.z) < DISTRICT_SITE.r + margin) return true;
  return false;
}

/** A point on the trail at parameter t (0 camp → 1 tree), resting on the ground. */
export function pathPoint(t: number, lift = 0, out = new THREE.Vector3()) {
  PATH_CURVE.getPointAt(clamp(t, 0, 1), out);
  out.y = terrainHeight(out.x, out.z) + lift;
  return out;
}

/** Engineering interests carved into waystones beside the trail. */
export const WAYSTONES = [
  { t: 0.2, side: 1, word: "Networks" },
  { t: 0.33, side: -1, word: "Security" },
  { t: 0.46, side: 1, word: "Applied AI" },
  { t: 0.59, side: -1, word: "Systems" },
] as const;

/** World position of a waystone (beside the trail). */
export function waystonePosition(i: number, out = new THREE.Vector3()) {
  const w = WAYSTONES[i];
  const p = PATH_CURVE.getPointAt(w.t);
  const tan = PATH_CURVE.getTangentAt(w.t);
  const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(w.side * (PATH_HALF_WIDTH + 2.6));
  out.copy(p).add(side);
  out.y = terrainHeight(out.x, out.z);
  return out;
}

// Resolve heights that depend on the terrain.
CAMP.y = terrainHeight(CAMP.x, CAMP.z);
