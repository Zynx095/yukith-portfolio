import * as THREE from "three";
import { SimplexNoise, clamp, lerp, smoothstep } from "./noise";

/**
 * Single source of truth for the world's geography.
 *
 * Coordinate system: +X right, +Y up, -Z is "forward" along the journey.
 * Units are roughly metres (the family characters are ~1.7 units tall).
 *
 *   camp + lake (z ≈ -15)  →  river  →  waterfall bay (z ≈ -120, left)
 *   →  valley  →  World Tree (z = -420)
 *
 * Every system that places something on the ground samples `terrainHeight`,
 * so nothing floats or sinks.
 */

export const WATER_LEVEL = -0.35;

export const CAMP = new THREE.Vector3(7, 0, -15);
export const CAMP_RADIUS = 13;

/** Lake: rotated, wobbly ellipse. */
export const LAKE = { x: -17, z: -31, rx: 21, rz: 14, rotation: -0.5, depth: 3.6 };

/** World Tree trunk axis. */
export const TREE = new THREE.Vector3(0, 0, -820);
/** Ground level the tree clearing is flattened to. */
export const TREE_GROUND = 1.2;
/** Angle (atan2(z, x) around the trunk axis) the root entrance faces: ≈ +Z, towards the approach. */
export const TREE_ENTRANCE_ANGLE = Math.PI / 2 - 0.12;

const noise = new SimplexNoise(20251);

// ─── Waterfall plateau ────────────────────────────────────────────────────────
// A raised land mass on the valley's left flank with a horseshoe bay carved
// into its edge. The waterfall pours from the back wall of the bay.

const LAND: [number, number, number][] = [
  [-97, -136, 43],
  [-92, -182, 38],
  [-90, -96, 30],
];
const BAY = { x: -56, z: -117, r: 12.5 };
const BAY_OPEN = new THREE.Vector2(BAY.x + 95, BAY.z + 136).normalize(); // bay opening direction

function smin(a: number, b: number, k: number) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return lerp(b, a, h) - k * h * (1 - h);
}

/** Signed distance to the plateau edge in XZ (positive = on the plateau). */
export function plateauSigned(x: number, z: number) {
  let d = Math.hypot(x - LAND[0][0], z - LAND[0][1]) - LAND[0][2];
  for (let i = 1; i < LAND.length; i++) {
    const [cx, cz, r] = LAND[i];
    d = smin(d, Math.hypot(x - cx, z - cz) - r, 22);
  }
  const bay = Math.hypot(x - BAY.x, z - BAY.z) - BAY.r;
  d = -smin(-d, bay, 5); // smooth subtraction of the bay
  d += 2.4 * noise.noise2(x * 0.05, z * 0.05) + 0.9 * noise.noise2(x * 0.17 + 3, z * 0.17);
  return -d;
}

const LIP_XZ = new THREE.Vector2(BAY.x - BAY_OPEN.x * (BAY.r + 0.5), BAY.z - BAY_OPEN.y * (BAY.r + 0.5));

export const WATERFALL = {
  /** Top of the fall (y resolved from the terrain below). */
  lip: new THREE.Vector3(LIP_XZ.x, 0, LIP_XZ.y),
  /** Plunge pool centre — just in front of the back wall. */
  pool: new THREE.Vector3(BAY.x - BAY_OPEN.x * 3.5, 0.55, BAY.z - BAY_OPEN.y * 3.5),
  /** Direction the fall faces (out of the bay). */
  normal: new THREE.Vector3(BAY_OPEN.x, 0, BAY_OPEN.y),
  poolRadius: 8,
  width: 7,
  plateauHeight: 26,
  bay: BAY,
};

/** River centreline from the plunge pool down to the lake (y = water surface). */
export const RIVER_POINTS: [number, number, number][] = [
  [WATERFALL.pool.x, 0.55, WATERFALL.pool.z],
  [-46, 0.46, -111],
  [-40.5, 0.34, -97],
  [-35, 0.2, -82],
  [-29.5, 0.06, -66],
  [-25.5, -0.08, -53],
  [-22, -0.24, -44],
  [-19.5, -0.35, -37],
];

export const RIVER_CURVE = new THREE.CatmullRomCurve3(
  RIVER_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal"
);

const RIVER_SAMPLES = RIVER_CURVE.getSpacedPoints(160);

/** Distance (XZ) to the river centreline, plus the curve parameter and water height there. */
export function riverInfo(x: number, z: number): { dist: number; t: number; surface: number } {
  let best = Infinity;
  let bestI = 0;
  let bestT = 0;
  for (let i = 0; i < RIVER_SAMPLES.length - 1; i++) {
    const a = RIVER_SAMPLES[i];
    const b = RIVER_SAMPLES[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const t = clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz), 0, 1);
    const px = a.x + abx * t - x;
    const pz = a.z + abz * t - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) {
      best = d2;
      bestI = i;
      bestT = t;
    }
  }
  const a = RIVER_SAMPLES[bestI];
  const b = RIVER_SAMPLES[bestI + 1];
  return { dist: Math.sqrt(best), t: (bestI + bestT) / (RIVER_SAMPLES.length - 1), surface: lerp(a.y, b.y, bestT) };
}

/** River half-width along its course (narrow at the pool, wider near the lake). */
export function riverHalfWidth(t: number) {
  return lerp(3.0, 4.6, t) + Math.sin(t * 17.0) * 0.35;
}

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

/** Valley centreline drifts gently so the journey isn't a straight corridor. */
function valleyCenter(z: number) {
  return 6 * Math.sin(z * 0.009 + 0.6) - 3;
}

function valleyHalfWidth(z: number) {
  const nearCamp = smoothstep(-160, -40, z);
  const treeClearing = 1 - smoothstep(120, 300, Math.abs(z - TREE.z));
  return 48 + nearCamp * 24 + treeClearing * 150;
}

/** Ground height at world (x, z). Deterministic; cheap enough for ~100k samples. */
export function terrainHeight(x: number, z: number): number {
  // Broad rolling ground.
  let h = noise.fbm2(x * 0.0065, z * 0.0065, 4) * 3.0 + noise.fbm2(x * 0.03 + 7.3, z * 0.03 - 2.1, 3) * 0.5;

  // Valley walls rising into hills.
  const d = Math.abs(x - valleyCenter(z)) - valleyHalfWidth(z);
  if (d > 0) {
    const rise = Math.pow(smoothstep(0, 130, d), 1.25);
    const hills = 62 + noise.fbm2(x * 0.004 + 11, z * 0.004 - 5, 4) * 34;
    h += rise * hills + smoothstep(0, 60, d) * noise.fbm2(x * 0.018, z * 0.018, 4) * 7;
  }

  // Distant ridges far behind the World Tree, low on the horizon so the tree reads against sky.
  h += smoothstep(-1150, -1500, z) * (70 + noise.fbm2(x * 0.0035, z * 0.0035 + 4, 5) * 50);

  // Waterfall plateau: steep rise to a flat top (cliff rock meshes dress the face).
  const ps = plateauSigned(x, z);
  if (ps > -6) {
    let top = WATERFALL.plateauHeight + noise.fbm2(x * 0.02, z * 0.02, 3) * 1.6 + smoothstep(12, 80, ps) * 14;
    // Stream channel cut into the plateau, feeding the lip.
    const sx = x - LIP_XZ.x;
    const sz = z - LIP_XZ.y;
    const back = -(sx * WATERFALL.normal.x + sz * WATERFALL.normal.z);
    const side = Math.abs(sx * WATERFALL.normal.z - sz * WATERFALL.normal.x);
    if (back > -2 && back < 60) top -= (1 - smoothstep(2.5, 6.5, side)) * 2.0 * smoothstep(-2, 3, back);
    h = lerp(h, top, smoothstep(-4.5, 1.5, ps));
  }

  // Camp clearing — flattened with a very slight crown.
  const cd = Math.hypot(x - CAMP.x, z - CAMP.z);
  if (cd < CAMP_RADIUS + 12) {
    h = lerp(h, 0.55 - cd * 0.004, 1 - smoothstep(CAMP_RADIUS, CAMP_RADIUS + 12, cd));
  }

  // World Tree clearing — flat where the roots spread, a soft mound at the base.
  const td = Math.hypot(x - TREE.x, z - TREE.z);
  if (td < 260) {
    const mound = TREE_GROUND + smoothstep(170, 40, td) * 2.2;
    h = lerp(h, mound, 1 - smoothstep(170, 260, td));
  }

  // Dry land stays above the water table: hollows in the rolling ground are
  // eased up (smoothly) so only the lake, river and pool ever hold water.
  h = -smin(-h, -(WATER_LEVEL + 0.45), 1.2);

  // Lake basin.
  const ld = lakeDistance(x, z);
  if (ld < 1.7) {
    const shore = WATER_LEVEL + 0.22;
    if (ld < 1) {
      const bed = WATER_LEVEL - LAKE.depth * (1 - ld * ld);
      h = Math.min(h, lerp(bed, shore, smoothstep(0.72, 1.0, ld)));
    } else {
      h = Math.min(h, lerp(shore, h, smoothstep(1, 1.7, ld)));
    }
  }

  // River channel, carved below the local water surface.
  const r = riverInfo(x, z);
  const hw = riverHalfWidth(r.t);
  if (r.dist < hw + 7) {
    const carve =
      r.dist < hw
        ? r.surface - 0.25 - 1.0 * (1 - (r.dist / hw) ** 2)
        : lerp(r.surface + 0.3, h, smoothstep(hw + 0.5, hw + 7, r.dist));
    h = Math.min(h, carve);
  }

  // Plunge pool.
  const pd = Math.hypot(x - WATERFALL.pool.x, z - WATERFALL.pool.z);
  if (pd < WATERFALL.poolRadius + 6) {
    const pr = WATERFALL.poolRadius;
    const carve =
      pd < pr ? WATERFALL.pool.y - 0.3 - 2.4 * (1 - (pd / pr) ** 2) : lerp(WATERFALL.pool.y + 0.3, h, smoothstep(pr, pr + 6, pd));
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

/** Areas that must stay clear of trees and boulders. */
export function isReserved(x: number, z: number, margin = 0) {
  if (Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP_RADIUS + 9 + margin) return true;
  if (lakeDistance(x, z) < 1.2 + margin * 0.04) return true;
  const r = riverInfo(x, z);
  if (r.dist < riverHalfWidth(r.t) + 2.5 + margin) return true;
  if (Math.hypot(x - BAY.x, z - BAY.z) < BAY.r + 6 + margin) return true;
  if (Math.hypot(x - TREE.x, z - TREE.z) < 215 + margin) return true;
  return false;
}

// Resolve heights that depend on the terrain.
TREE.y = TREE_GROUND;
CAMP.y = terrainHeight(CAMP.x, CAMP.z);
{
  // March inland from the bay centre until the ground reaches the plateau top:
  // that crossing is the real cliff edge (the SDF noise moves it a little).
  const n = WATERFALL.normal;
  let lipX = BAY.x;
  let lipZ = BAY.z;
  for (let s = 0; s < 40; s += 0.25) {
    const x = BAY.x - n.x * s;
    const z = BAY.z - n.z * s;
    if (terrainHeight(x, z) > WATERFALL.plateauHeight - 4) {
      lipX = x;
      lipZ = z;
      break;
    }
  }
  WATERFALL.lip.set(lipX, terrainHeight(lipX - n.x * 1.5, lipZ - n.z * 1.5), lipZ);
}
