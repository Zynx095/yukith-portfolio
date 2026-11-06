import * as THREE from "three";
import { SimplexNoise, clamp, createRng, lerp, range, smoothstep } from "./noise";
import { buildTube, resampleCurve } from "./geometry";
import { TREE, TREE_ENTRANCE_ANGLE, terrainHeight } from "./layout";

/**
 * The World Tree generator — an Erdtree-scale colossus.
 *
 * Local frame: origin on the trunk axis at ground level, +Y up. Angles θ are
 * measured with position = (cos θ, 0, sin θ) · r.
 *
 * The trunk is two lofted shells — bark outside, a hollow heartwood hall
 * inside — joined at a jagged broken crown and at a root entrance arch that
 * opens between two great buttress roots. Limbs, branches, roots and the
 * interior's tendrils and ledges are variable-radius tubes. Deterministic.
 */

const N = new SimplexNoise(7781);
const TAU = Math.PI * 2;

export const TRUNK = {
  bottom: -12,
  crown: 345,
  baseRadius: 46,
  topRadius: 30,
  wallMin: 8,
};

export const ENTRANCE = {
  angle: TREE_ENTRANCE_ANGLE,
  halfWidth: 9.5,
  height: 34,
};

const E_DIR = new THREE.Vector2(Math.cos(ENTRANCE.angle), Math.sin(ENTRANCE.angle));
const E_SIDE = new THREE.Vector2(-E_DIR.y, E_DIR.x);

/** Shortest signed angular difference a - b in (-π, π]. */
export function angleDiff(a: number, b: number) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
}

// ─── Trunk shape ──────────────────────────────────────────────────────────────

interface Lobe {
  angle: number;
  strength: number;
  decay: number;
  width: number;
}

const LOBES: Lobe[] = (() => {
  const rng = createRng(4242);
  const lobes: Lobe[] = [
    // The two great buttresses framing the entrance.
    { angle: ENTRANCE.angle - 0.46, strength: 26, decay: 62, width: 0.17 },
    { angle: ENTRANCE.angle + 0.5, strength: 29, decay: 56, width: 0.18 },
  ];
  const count = 8;
  const free = TAU - 0.96 - 0.44;
  for (let k = 0; k < count; k++) {
    lobes.push({
      angle: ENTRANCE.angle + 0.5 + 0.22 + ((k + 0.5) / count) * free + range(rng, -0.1, 0.1),
      strength: range(rng, 14, 27),
      decay: range(rng, 30, 64),
      width: range(rng, 0.13, 0.22),
    });
  }
  return lobes;
})();

/** Primary limbs — also used to raise branch collars on the trunk. */
export interface LimbSpec {
  angle: number;
  y: number;
  elevation: number; // radians above horizontal
  length: number;
  radius: number;
  sweep: number; // sideways curl
}

/**
 * The crown is built in tiers, not as one dome: long, low limbs that run out
 * almost level and carry broad pads of foliage, a middle tier, and a few
 * steep leaders that lift the top of the silhouette. Deliberately uneven —
 * the left side (seen from the approach) reaches further and lower than the
 * right — so the tree reads as one ancient individual rather than an oak.
 * θ = 0 is +x (right of the approach), θ ≈ 1.45 faces the approach (the
 * entrance), θ = π is left.
 */
export const LIMBS: LimbSpec[] = [
  // Tier 1 — long, nearly level limbs (the aerial roots hang from these).
  { angle: 2.55, y: 214, elevation: 0.2, length: 640, radius: 21, sweep: 0.3 },
  { angle: 3.55, y: 236, elevation: 0.26, length: 560, radius: 19.5, sweep: -0.25 },
  { angle: 0.12, y: 226, elevation: 0.24, length: 520, radius: 19, sweep: -0.32 },
  { angle: 5.05, y: 248, elevation: 0.3, length: 480, radius: 17.5, sweep: 0.28 },
  // Tier 2 — the middle storey.
  { angle: 1.05, y: 292, elevation: 0.56, length: 420, radius: 16, sweep: 0.22 },
  { angle: 2.1, y: 300, elevation: 0.5, length: 430, radius: 15.5, sweep: -0.3 },
  { angle: 4.25, y: 286, elevation: 0.52, length: 440, radius: 16.5, sweep: 0.2 },
  { angle: 5.75, y: 306, elevation: 0.62, length: 380, radius: 14.5, sweep: -0.2 },
  // Tier 3 — leaders rising out of the broken crown.
  { angle: 0.6, y: 334, elevation: 1.18, length: 380, radius: 14, sweep: 0.12 },
  { angle: 3.05, y: 338, elevation: 1.28, length: 430, radius: 15, sweep: -0.1 },
  { angle: 4.7, y: 332, elevation: 1.12, length: 330, radius: 12.5, sweep: 0.18 },
];

interface Burl {
  angle: number;
  y: number;
  size: number;
  amp: number;
}

const BURLS: Burl[] = (() => {
  const rng = createRng(911);
  const burls: Burl[] = LIMBS.map((l) => ({ angle: l.angle, y: l.y - l.radius * 0.5, size: l.radius * 1.9, amp: l.radius * 0.5 }));
  for (let i = 0; i < 12; i++) {
    burls.push({ angle: range(rng, 0, TAU), y: range(rng, 50, 260), size: range(rng, 6, 14), amp: range(rng, 1.6, 4.5) });
  }
  return burls;
})();

/** The trunk is a braid of great stems grown together, spiralling as they rise. */
const STRANDS = 9;
const STRAND_TWIST = 0.0065; // radians of twist per unit of height

/** Trunk axis offset (gentle lean and sway). */
export function spine(y: number, out = new THREE.Vector2()) {
  return out.set(5 * Math.sin(y * 0.006 + 0.4) - 1.9, 3.4 * Math.sin(y * 0.0047 + 1.9) - 3.2);
}

function baseRadius(y: number) {
  const t = clamp(y / TRUNK.crown, 0, 1);
  return lerp(TRUNK.baseRadius, TRUNK.topRadius, Math.pow(t, 0.7)) + 5 * Math.exp(-Math.max(y, 0) / 12);
}

/** Outer bark surface radius at (θ, y). */
export function outerRadius(theta: number, y: number) {
  const yy = Math.max(y, 0);
  let r = baseRadius(y);
  // Buttress lobes (Lorentzian: sharp crest, concave flanks).
  for (const l of LOBES) {
    const d = angleDiff(theta, l.angle);
    const w = l.width * (1 + 0.8 * Math.exp(-yy / 16));
    r += (l.strength * Math.exp(-yy / l.decay)) / (1 + (d / w) * (d / w));
  }
  // Twisting vertical flutes: narrow deep grooves between rounded ridges.
  const twist = y * 0.0022 + 0.5 * Math.sin(theta * 3 + y * 0.007);
  const groove = Math.pow(Math.abs(Math.cos(0.5 * (31 * theta + twist * 31 * 0.25))), 9);
  r -= 1.8 * groove * (0.6 + 0.4 * smoothstep(-6, 60, y));
  // Braided stems: broad rounded strands with deep seams between them.
  const strandPhase = STRANDS * (theta - y * STRAND_TWIST) + 0.6 * N.noise2(theta * 1.3, y * 0.004);
  const strandAmp = smoothstep(2, 45, y) * (1 - 0.35 * smoothstep(260, 345, y));
  r += strandAmp * (2.6 * Math.cos(strandPhase) - 5.5 * Math.pow(Math.abs(Math.sin(0.5 * strandPhase)), 18));
  // Large irregular lumps (seamless around θ via 3D noise on the cylinder).
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  r += 3.8 * N.noise3(c * 1.5, y * 0.009, s * 1.5) + 1.2 * N.noise3(c * 4.2 + 3, y * 0.026, s * 4.2);
  // Burls and branch collars.
  for (const b of BURLS) {
    const da = angleDiff(theta, b.angle) * r;
    const dy = y - b.y;
    r += b.amp * Math.exp(-(da * da + dy * dy) / (b.size * b.size));
  }
  // The portal: the trunk is recessed between the two great buttresses.
  const de = angleDiff(theta, ENTRANCE.angle);
  r -= 17 * Math.exp(-(de * de) / (0.3 * 0.3)) * Math.exp(-yy / 55);
  return r;
}

/** Cavity radius profile (before wall clamping). */
function cavityProfile(y: number) {
  const pts: [number, number][] = [
    [-12, 25],
    [6, 26.5],
    [40, 25],
    [90, 22.5],
    [140, 20],
    [190, 17.5],
    [240, 14.5],
    [290, 11.5],
    [330, 10],
    [370, 9.5],
  ];
  if (y <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0, r0] = pts[i];
    const [y1, r1] = pts[i + 1];
    if (y <= y1) {
      const t = (y - y0) / (y1 - y0);
      return lerp(r0, r1, t * t * (3 - 2 * t));
    }
  }
  return pts[pts.length - 1][1];
}

// ─── Archive slots (relic alcoves around the hall) ──────────────────────────

/**
 * The archive hall at the foot of the hollow: relics stand in alcoves carved
 * into the wall all round the hall, leaving the side facing the entrance open.
 * Slot i is assigned to a project by lib/world/archive.ts.
 */
export const ARCHIVE_COUNT = 9;
/** Angular gap kept free on each side of the entrance. */
const ENTRANCE_CLEAR = 0.95;
const ALCOVE = { y: 2.2, centerY: 7.2, halfWidth: 4.2, halfHeight: 5.6, depth: 5.4 };

export interface ArchiveSlot {
  index: number;
  theta: number;
  /** Local Y of the alcove floor (plinths stand on it). */
  y: number;
}

export const ARCHIVE_SLOTS: ArchiveSlot[] = Array.from({ length: ARCHIVE_COUNT }, (_, i) => ({
  index: i,
  y: ALCOVE.y,
  theta: ENTRANCE.angle + ENTRANCE_CLEAR + (i * (TAU - 2 * ENTRANCE_CLEAR)) / (ARCHIVE_COUNT - 1),
}));

/** Inner (cavity) wall radius at (θ, y), clamped so the wall keeps a minimum thickness. */
export function innerRadius(theta: number, y: number, outer?: number) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  let r = cavityProfile(y);
  // Fibrous vertical ribs protruding into the hall.
  const rib = Math.pow(Math.abs(Math.cos(0.5 * (41 * theta + 2.4 * N.noise2(theta * 2, y * 0.016)))), 7);
  r -= 1.3 * rib;
  r += 2.2 * N.noise3(c * 2.1 + 7, y * 0.016, s * 2.1) + 0.8 * N.noise3(c * 6 + 1, y * 0.05, s * 6);
  // An antechamber opening towards the portal at floor level.
  const de = angleDiff(theta, ENTRANCE.angle);
  r += 8 * Math.exp(-(de * de) / (0.42 * 0.42)) * Math.exp(-Math.max(y, 0) / 32);
  // Alcoves carved into the wall behind every relic: round-topped arches with a flat floor.
  for (const slot of ARCHIVE_SLOTS) {
    const da = (angleDiff(theta, slot.theta) * r) / ALCOVE.halfWidth;
    const dy = (y - ALCOVE.centerY) / ALCOVE.halfHeight;
    const below = y < ALCOVE.y ? (ALCOVE.y - y) / 0.6 : 0;
    const shape = Math.pow(Math.abs(da), 3) + Math.pow(Math.max(dy, -0.85), 2) + below * below;
    r += ALCOVE.depth * Math.exp(-Math.pow(shape, 2.2) * 1.4);
  }
  const o = outer ?? outerRadius(theta, y);
  return Math.min(r, o - TRUNK.wallMin);
}

/** Jagged broken crown height. */
export function crownHeight(theta: number) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  let h = TRUNK.crown + 7 * N.noise2(c * 1.6 + 4, s * 1.6);
  const teeth: [number, number, number][] = [
    [0.4, 16, 0.2],
    [1.9, 10, 0.16],
    [2.9, 20, 0.26],
    [4.2, 11, 0.18],
    [5.4, 14, 0.22],
  ];
  for (const [a, amp, w] of teeth) {
    const d = Math.abs(angleDiff(theta, a));
    h += amp * Math.pow(Math.max(0, 1 - d / w), 1.6);
  }
  return h;
}

/** Signed distance-like field of the entrance arch in (lateral, height) space (< 0 = opening). */
export function archField(lateral: number, y: number) {
  const yy = Math.max(y, 0);
  const lean = 0.8 * Math.sin(yy * 0.1) + 0.5;
  const hw = ENTRANCE.halfWidth * (1 + 0.1 * N.noise2(yy * 0.07, 4.2));
  const nx = Math.abs(lateral - lean) / hw;
  const ny = yy / ENTRANCE.height;
  // Superellipse: fuller shoulders, softly pointed crown.
  const f = Math.pow(Math.pow(nx, 2.3) + Math.pow(ny, 1.7), 1 / 2.0) - 1;
  return f * ENTRANCE.halfWidth;
}

function entranceField(px: number, pz: number, y: number) {
  const fwd = px * E_DIR.x + pz * E_DIR.y;
  if (fwd < 4) return 20;
  const lat = px * E_SIDE.x + pz * E_SIDE.y;
  return archField(lat, y);
}

// ─── Lofted shells ────────────────────────────────────────────────────────────

/** Shell resolution; lowered for the low quality tier (see generateWorldTree). */
let COLS = 360;
let ROWS = 230;
const OUTER_U_TILES = 28;
const INNER_U_TILES = 24;
const OUTER_V_TILE = 15;
const INNER_V_TILE = 9;

interface ShellGrid {
  pos: Float32Array;
  nor: Float32Array;
  uv: Float32Array;
  field: Float32Array;
}

function rowParam(i: number) {
  return Math.pow(i / ROWS, 1.1);
}

function buildShellGrid(kind: "outer" | "inner", outerCache?: Float32Array): { grid: ShellGrid; radii: Float32Array } {
  const cols = COLS + 1; // duplicated seam column
  const count = cols * (ROWS + 1);
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const field = new Float32Array(count);
  const radii = new Float32Array(count);
  const sp = new THREE.Vector2();
  const tops = new Float32Array(cols);
  for (let j = 0; j < cols; j++) tops[j] = crownHeight((j / COLS) * TAU);

  for (let i = 0; i <= ROWS; i++) {
    const s = rowParam(i);
    for (let j = 0; j < cols; j++) {
      const theta = (j / COLS) * TAU;
      const y = lerp(TRUNK.bottom, tops[j], s);
      const k = i * cols + j;
      const ro = outerCache ? outerCache[k] : outerRadius(theta, y);
      const r = kind === "outer" ? ro : innerRadius(theta, y, ro);
      radii[k] = kind === "outer" ? ro : r;
      spine(y, sp);
      const px = Math.cos(theta) * r;
      const pz = Math.sin(theta) * r;
      pos[k * 3] = sp.x + px;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = sp.y + pz;
      field[k] = entranceField(px, pz, y);
    }
  }

  // Normals from the grid (central differences, wrapping in θ).
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const n = new THREE.Vector3();
  const t0 = new THREE.Vector3();
  const t1 = new THREE.Vector3();
  const P = (i: number, j: number, out: THREE.Vector3) => {
    const jj = ((j % COLS) + COLS) % COLS;
    const ii = clamp(i, 0, ROWS);
    const k = (ii * cols + jj) * 3;
    return out.set(pos[k], pos[k + 1], pos[k + 2]);
  };
  for (let i = 0; i <= ROWS; i++) {
    for (let j = 0; j < cols; j++) {
      P(i, j + 1, t0);
      P(i, j - 1, t1);
      a.subVectors(t0, t1); // d/dθ
      P(i + 1, j, t0);
      P(i - 1, j, t1);
      b.subVectors(t0, t1); // d/dy
      n.crossVectors(b, a).normalize();
      if (kind === "inner") n.negate();
      const k = (i * cols + j) * 3;
      nor[k] = n.x;
      nor[k + 1] = n.y;
      nor[k + 2] = n.z;
    }
  }

  // UVs: u by arc length around each row (even texel density on buttress flanks).
  const tiles = kind === "outer" ? OUTER_U_TILES : INNER_U_TILES;
  const acc = new Float32Array(cols);
  for (let i = 0; i <= ROWS; i++) {
    let total = 0;
    acc[0] = 0;
    for (let j = 1; j < cols; j++) {
      const k0 = (i * cols + j - 1) * 3;
      const k1 = (i * cols + j) * 3;
      total += Math.hypot(pos[k1] - pos[k0], pos[k1 + 1] - pos[k0 + 1], pos[k1 + 2] - pos[k0 + 2]);
      acc[j] = total;
    }
    for (let j = 0; j < cols; j++) {
      const k = i * cols + j;
      // The bark grain follows the braid's spiral.
      const spiral = kind === "outer" ? (pos[k * 3 + 1] * STRAND_TWIST * tiles) / TAU : 0;
      uv[k * 2] = (acc[j] / total) * tiles - spiral;
      uv[k * 2 + 1] = pos[k * 3 + 1] / (kind === "outer" ? OUTER_V_TILE : INNER_V_TILE);
    }
  }
  return { grid: { pos, nor, uv, field }, radii };
}

/**
 * Triangulate a shell grid, clipping cells against the entrance field
 * (marching-squares style) so the arch edge is smooth rather than stepped.
 */
function triangulateShell(grid: ShellGrid, kind: "outer" | "inner"): THREE.BufferGeometry {
  const cols = COLS + 1;
  const pos: number[] = Array.from(grid.pos);
  const nor: number[] = Array.from(grid.nor);
  const uv: number[] = Array.from(grid.uv);
  const index: number[] = [];
  const f = grid.field;

  const lerpVertex = (ka: number, kb: number, t: number) => {
    const id = pos.length / 3;
    for (let c = 0; c < 3; c++) pos.push(lerp(grid.pos[ka * 3 + c], grid.pos[kb * 3 + c], t));
    const nx = lerp(grid.nor[ka * 3], grid.nor[kb * 3], t);
    const ny = lerp(grid.nor[ka * 3 + 1], grid.nor[kb * 3 + 1], t);
    const nz = lerp(grid.nor[ka * 3 + 2], grid.nor[kb * 3 + 2], t);
    const l = Math.hypot(nx, ny, nz) || 1;
    nor.push(nx / l, ny / l, nz / l);
    uv.push(lerp(grid.uv[ka * 2], grid.uv[kb * 2], t), lerp(grid.uv[ka * 2 + 1], grid.uv[kb * 2 + 1], t));
    return id;
  };

  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const ka = i * cols + j;
      const kb = i * cols + j + 1;
      const kc = (i + 1) * cols + j + 1;
      const kd = (i + 1) * cols + j;
      const ring = kind === "outer" ? [ka, kd, kc, kb] : [ka, kb, kc, kd];
      const inside = ring.map((k) => f[k] < 0);
      if (!inside.some(Boolean)) {
        index.push(ring[0], ring[1], ring[2], ring[0], ring[2], ring[3]);
        continue;
      }
      if (inside.every(Boolean)) continue;
      const poly: number[] = [];
      for (let e = 0; e < 4; e++) {
        const k0 = ring[e];
        const k1 = ring[(e + 1) % 4];
        const in0 = f[k0] < 0;
        const in1 = f[k1] < 0;
        if (!in0) poly.push(k0);
        if (in0 !== in1) poly.push(lerpVertex(k0, k1, f[k0] / (f[k0] - f[k1])));
      }
      for (let p = 1; p < poly.length - 1; p++) index.push(poly[0], poly[p], poly[p + 1]);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(new THREE.Uint32BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  return geo;
}

/** Strip joining the outer and inner shells along the broken crown. */
function buildCrownRim(outer: ShellGrid, inner: ShellGrid): THREE.BufferGeometry {
  const cols = COLS + 1;
  const top = ROWS * cols;
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const steps = 5;
  for (let j = 0; j < cols; j++) {
    const k = (top + j) * 3;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const bulge = Math.sin(t * Math.PI) * 2.2;
      pos.push(lerp(outer.pos[k], inner.pos[k], t), lerp(outer.pos[k + 1], inner.pos[k + 1], t) + bulge, lerp(outer.pos[k + 2], inner.pos[k + 2], t));
      uv.push((j / COLS) * INNER_U_TILES, outer.pos[k + 1] / INNER_V_TILE + t * 0.4);
    }
  }
  const R = steps + 1;
  for (let j = 0; j < COLS; j++) {
    for (let s = 0; s < steps; s++) {
      const a = j * R + s;
      const b = (j + 1) * R + s;
      index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

// ─── Entrance tunnel ─────────────────────────────────────────────────────────

/** Distance along the entrance direction where a lateral line meets a shell. */
function shellDepth(lateral: number, y: number, kind: "outer" | "inner") {
  const fn = (d: number) => {
    const px = E_DIR.x * d + E_SIDE.x * lateral;
    const pz = E_DIR.y * d + E_SIDE.y * lateral;
    const theta = Math.atan2(pz, px);
    const r = Math.hypot(px, pz);
    const ro = outerRadius(theta, y);
    return r - (kind === "outer" ? ro : innerRadius(theta, y, ro));
  };
  let lo = 0;
  let hi = 140;
  for (let it = 0; it < 44; it++) {
    const mid = (lo + hi) / 2;
    if (fn(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function buildEntranceTunnel(): THREE.BufferGeometry {
  const boundary: { lat: number; y: number; nx: number; ny: number }[] = [];
  const centerLat = 0.5;
  const solveRay = (dx: number, dy: number, oy: number) => {
    let lo = 0;
    let hi = 60;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2;
      if (archField(centerLat + dx * mid, oy + dy * mid) < 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const push = (lat: number, y: number) => {
    const e = 0.05;
    const gx = (archField(lat + e, y) - archField(lat - e, y)) / (2 * e);
    const gy = (archField(lat, y + e) - archField(lat, y - e)) / (2 * e);
    const l = Math.hypot(gx, gy) || 1;
    boundary.push({ lat, y, nx: gx / l, ny: gy / l });
  };
  for (let y = -8; y < 0; y += 1.5) push(centerLat - solveRay(-1, 0, y), y);
  const arcSteps = 80;
  for (let s = 0; s <= arcSteps; s++) {
    const a = -Math.PI / 2 + (s / arcSteps) * Math.PI;
    const dx = Math.sin(a);
    const dy = Math.cos(a);
    const d = solveRay(dx, dy, 0);
    push(centerLat + dx * d, dy * d);
  }
  for (let y = -1.5; y >= -8; y -= 1.5) push(centerLat + solveRay(1, 0, y), y);

  // Across the wall: inner lip → wall → outer lip. [t (0 inner, 1 outer), extra depth, offset into wood]
  const profile: [number, number, number][] = [
    [0, 1.3, 2.9],
    [0, -0.55, 1.9],
    [0, -0.9, 0.85],
    [0, -0.45, 0.14],
    [0.25, 0, 0],
    [0.5, 0, -0.2],
    [0.75, 0, 0],
    [1, 0.45, 0.14],
    [1, 0.9, 0.85],
    [1, 0.55, 1.9],
    [1, -1.3, 2.9],
  ];

  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  let arc = 0;
  const sp = new THREE.Vector2();
  for (let k = 0; k < boundary.length; k++) {
    const b = boundary[k];
    if (k > 0) arc += Math.hypot(b.lat - boundary[k - 1].lat, b.y - boundary[k - 1].y);
    const inner = shellDepth(b.lat, b.y, "inner");
    const outer = shellDepth(b.lat, b.y, "outer");
    const wobble = 0.7 * N.noise2(arc * 0.18, 3.3);
    for (const [t, extra, into] of profile) {
      const d = lerp(inner, outer, t) + extra;
      const w = t > 0 && t < 1 ? wobble : 0;
      const lat = b.lat + b.nx * (into + w);
      const y = b.y + b.ny * (into + w);
      spine(y, sp);
      pos.push(sp.x + E_DIR.x * d + E_SIDE.x * lat, y, sp.y + E_DIR.y * d + E_SIDE.y * lat);
      uv.push(arc / 6, d / 6);
    }
  }
  const R = profile.length;
  for (let k = 0; k < boundary.length - 1; k++) {
    for (let p = 0; p < R - 1; p++) {
      const a = k * R + p;
      const b = (k + 1) * R + p;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Normals must face into the opening.
  const nrm = geo.getAttribute("normal") as THREE.BufferAttribute;
  const mid = Math.floor(boundary.length / 2);
  const probe = boundary[mid];
  const k = mid * R + 5;
  const toCenter = new THREE.Vector3(-E_SIDE.x * probe.nx, -probe.ny, -E_SIDE.y * probe.nx);
  if (new THREE.Vector3(nrm.getX(k), nrm.getY(k), nrm.getZ(k)).dot(toCenter) < 0) {
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, -nrm.getX(i), -nrm.getY(i), -nrm.getZ(i));
    const idx = geo.getIndex()!;
    for (let i = 0; i < idx.count; i += 3) {
      const t = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, t);
    }
  }
  return geo;
}

// ─── Roots ────────────────────────────────────────────────────────────────────

/** A root's centre line in the tree's local frame (shared with the signal veins). */
export interface RootPath {
  points: THREE.Vector3[];
  radii: number[];
  /** Cross-section squash per point: [side, up]. */
  ellipse: [number, number][];
  /** Main roots carry a vein of signal light along their crest. */
  main: boolean;
}

/** Local ground height under a point of the tree's frame (the clearing is not perfectly flat). */
function groundLocal(x: number, z: number) {
  return terrainHeight(TREE.x + x, TREE.z + z) - TREE.y;
}

let rootPathCache: RootPath[] | null = null;

/**
 * The exposed root system: from every buttress lobe one or two great roots run
 * out across the clearing — arching clear of the ground, diving under it and
 * surfacing again — with side roots branching off the largest. Roots beside
 * the entrance corridor stay low so the approach is never blocked.
 */
export function rootPaths(): RootPath[] {
  if (rootPathCache) return rootPathCache;
  const rng = createRng(3131);
  const out: RootPath[] = [];
  const sp = new THREE.Vector2();
  const at = (theta: number, r: number, lift: number) => {
    spine(Math.max(lift, 0), sp);
    const x = sp.x + Math.cos(theta) * r;
    const z = sp.y + Math.sin(theta) * r;
    return new THREE.Vector3(x, groundLocal(x, z) + lift, z);
  };
  const taper = (n: number, base: number, end = 0.5) => Array.from({ length: n }, (_, i) => base * (1 - 0.85 * Math.pow(i / (n - 1), 0.85)) + end);

  for (const lobe of LOBES) {
    const rootCount = lobe.strength > 22 ? 2 : 1;
    for (let rc = 0; rc < rootCount; rc++) {
      const theta0 = lobe.angle + (rc === 0 ? 0 : range(rng, -0.22, 0.22));
      const de = Math.abs(angleDiff(theta0, ENTRANCE.angle));
      if (de < 0.3) continue;
      const arch = de < 0.6 ? 0.15 : range(rng, 0.65, 1);
      const reach = range(rng, 130, 200) + lobe.strength * 2.2;
      const r0 = baseRadius(8) + lobe.strength * 0.4;
      const drift = range(rng, -0.18, 0.18);
      const base = rc === 0 ? 6.5 + lobe.strength * 0.2 : 4.2;
      const peak = (rc === 0 ? 8 + lobe.strength * 0.38 : 5.5) * arch;
      const rAt = (t: number) => base * (1 - 0.85 * Math.pow(t, 0.85)) + 0.5;
      const ctrl = [
        at(theta0, r0 - 14, 16 + lobe.strength * 0.35),
        at(theta0 + drift * 0.15, r0 + 6, 9 + peak * 0.35),
        at(theta0 + drift * 0.4, r0 + reach * 0.27, 2 + peak), // the arch
        at(theta0 + drift * 0.58, r0 + reach * 0.48, rAt(0.48) * 0.3 + peak * 0.2),
        at(theta0 + drift * 0.74, r0 + reach * 0.66, -rAt(0.66) * 0.95), // under the ground
        at(theta0 + drift * 0.88, r0 + reach * 0.82, rAt(0.82) * (0.15 + 0.6 * arch)), // and out again
        at(theta0 + drift, r0 + reach, -rAt(1) * 2.5),
      ];
      const points = resampleCurve(ctrl, 64);
      const radii = taper(points.length, base);
      const ellipse = points.map((_, i) => {
        const t = i / (points.length - 1);
        return [lerp(0.5, 1.0, smoothstep(0, 0.5, t)), lerp(1.55, 0.85, smoothstep(0, 0.6, t))] as [number, number];
      });
      out.push({ points, radii, ellipse, main: rc === 0 });

      // Side roots off the great arching roots.
      if (rc === 0 && arch > 0.5) {
        for (const side of [-1, 1]) {
          if (rng() < 0.35) continue;
          const i0 = Math.floor(range(rng, 0.4, 0.56) * (points.length - 1));
          const start = points[i0].clone();
          const r = Math.hypot(start.x, start.z);
          const th = Math.atan2(start.z, start.x) + side * range(rng, 0.22, 0.38);
          const len = range(rng, 45, 85);
          const s0 = radii[i0] * 0.55;
          const c = [start, at(th - side * 0.12, r + len * 0.35, s0 * 0.6), at(th, r + len * 0.7, -s0 * 0.4), at(th + side * 0.05, r + len, -s0 * 2)];
          const pts = resampleCurve(c, 22);
          out.push({ points: pts, radii: taper(pts.length, s0, 0.3), ellipse: pts.map(() => [1, 0.9] as [number, number]), main: false });
        }
      }
    }
  }
  rootPathCache = out;
  return out;
}

function buildRoots(): THREE.BufferGeometry[] {
  return rootPaths().map((r) =>
    buildTube({ points: r.points, radii: r.radii, ellipse: r.ellipse, radialSegments: r.main ? 16 : 10, bumpiness: 0.12, noise: N, vScale: 9, uRepeats: r.main ? 8 : 4 })
  );
}

// ─── Branches, canopy and aerial roots ───────────────────────────────────────

export interface LeafAnchor {
  position: THREE.Vector3;
  scale: number;
  tint: number;
  /** Vertical squash of the leaf volume (pads are broad and shallow). */
  flat: number;
}

interface Tube {
  pts: THREE.Vector3[];
  radii: number[];
  /** 0 limb · 1 branch · 2 twig · 3 aerial root. */
  level: 0 | 1 | 2 | 3;
}

interface Skeleton {
  tubes: Tube[];
  anchors: LeafAnchor[];
  /** Aerial roots that reach the ground; the signal climbs some of them into the crown. */
  props: { points: THREE.Vector3[]; radii: number[] }[];
}

let skeletonCache: Skeleton | null = null;

/**
 * Limbs, branches and twigs; the foliage pads at their ends; and the aerial
 * roots that hang from the long lower limbs — some reaching the ground and
 * thickening into pillars, like a banyan's. Deterministic and cached.
 */
export function treeSkeleton(): Skeleton {
  if (skeletonCache) return skeletonCache;
  const rng = createRng(6060);
  const tubes: Tube[] = [];
  const anchors: LeafAnchor[] = [];
  const props: Skeleton["props"] = [];
  const sp = new THREE.Vector2();
  const up = new THREE.Vector3(0, 1, 0);
  const golden = Math.PI * (3 - Math.sqrt(5));

  const grow = (start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, level: 0 | 1 | 2, sweep: number, lift = 0) => {
    const segs = level === 0 ? 9 : level === 1 ? 5 : 4;
    const ctrl: THREE.Vector3[] = [start.clone()];
    const d = dir.clone().normalize();
    const p = start.clone();
    const side = new THREE.Vector3().crossVectors(d, up).normalize();
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      // Limbs run out under their own weight, then turn up towards the light at the end.
      const droop = level === 0 ? 0.13 : 0.1;
      // Old limbs wander: a slow S-curve plus small random turns.
      const wander = level === 0 ? 0.11 * Math.sin(t * 5.2 + sweep * 9) + range(rng, -0.1, 0.1) : range(rng, -0.08, 0.08);
      d.addScaledVector(up, -droop * t + lift * t * t).addScaledVector(side, sweep * 0.12 + wander);
      d.y += range(rng, -0.05, 0.08);
      d.normalize();
      p.addScaledVector(d, length / segs);
      ctrl.push(p.clone());
    }
    const pts = resampleCurve(ctrl, level === 0 ? 60 : level === 1 ? 24 : 10);
    const tipR = level === 0 ? 3 : level === 1 ? 1.1 : 0.35;
    const radii = pts.map((_, i) => lerp(radius, tipR, Math.pow(i / (pts.length - 1), 0.75)));
    tubes.push({ pts, radii, level });
    return { pts, radii };
  };

  /** A broad, shallow pad of foliage: anchors on a disc, domed slightly on top. */
  const pad = (centre: THREE.Vector3, radius: number, scale: [number, number], flat: number, density = 1) => {
    const n = Math.max(1, Math.round(((radius * radius) / 650) * density));
    const spin = rng() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const rr = radius * Math.sqrt((k + 0.5) / n) * range(rng, 0.9, 1.05);
      const a = spin + k * golden + range(rng, -0.25, 0.25);
      const dome = 1 - (rr / radius) * (rr / radius);
      anchors.push({
        position: new THREE.Vector3(centre.x + Math.cos(a) * rr, centre.y + dome * radius * 0.12 + range(rng, -3, 3), centre.z + Math.sin(a) * rr),
        scale: range(rng, scale[0], scale[1]) * (0.8 + 0.25 * dome),
        tint: rng(),
        flat,
      });
    }
  };

  for (const limb of LIMBS) {
    const y = limb.y;
    spine(y, sp);
    const ro = outerRadius(limb.angle, y);
    const ri = innerRadius(limb.angle, y, ro);
    // Embed the limb base inside the wall without breaking into the hall.
    const centerR = Math.max(ri + limb.radius * Math.sin(limb.elevation) + 2.0, ro - limb.radius * 0.75);
    const start = new THREE.Vector3(sp.x + Math.cos(limb.angle) * centerR, y, sp.y + Math.sin(limb.angle) * centerR);
    const dir = new THREE.Vector3(Math.cos(limb.angle) * Math.cos(limb.elevation), Math.sin(limb.elevation), Math.sin(limb.angle) * Math.cos(limb.elevation));
    const low = limb.elevation < 0.35;
    const primary = grow(start, dir, limb.length, limb.radius, 0, limb.sweep, low ? 0.32 : 0.12);
    const tip = primary.pts[primary.pts.length - 1];
    pad(tip.clone().add(new THREE.Vector3(0, 14, 0)), 84 + limb.length * 0.15, [52, 70], 0.5, 1.35);
    // Further pads along the outer limb, so each tier reads as one broad layer.
    for (const f of [0.62, 0.82]) {
      const q = primary.pts[Math.floor(f * (primary.pts.length - 1))];
      pad(q.clone().add(new THREE.Vector3(0, 18, 0)), 44 + limb.length * 0.07, [46, 62], 0.5, 1.1);
    }

    const childCount = 5 + Math.floor(rng() * 2);
    for (let c = 0; c < childCount; c++) {
      const t = lerp(0.3, 0.92, (c + rng() * 0.6) / childCount);
      const i = Math.floor(t * (primary.pts.length - 1));
      const base = primary.pts[i];
      const tangent = primary.pts[Math.min(i + 1, primary.pts.length - 1)].clone().sub(primary.pts[Math.max(i - 1, 0)]).normalize();
      const around = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const childDir = tangent
        .clone()
        .applyAxisAngle(around, range(rng, -0.9, -0.35))
        .applyAxisAngle(tangent, range(rng, -1.6, 1.6));
      childDir.y = Math.abs(childDir.y) * 0.7 + 0.14;
      const len = limb.length * range(rng, 0.26, 0.4) * (1.1 - t * 0.4);
      const rad = primary.radii[i] * range(rng, 0.42, 0.56);
      const secondary = grow(base, childDir, len, rad, 1, range(rng, -0.4, 0.4), 0.1);
      pad(secondary.pts[secondary.pts.length - 1].clone().add(new THREE.Vector3(0, 9, 0)), 40 + len * 0.2, [42, 58], 0.55, 1.2);

      const grand = 3 + Math.floor(rng() * 2);
      for (let g = 0; g < grand; g++) {
        const tg = lerp(0.45, 1.0, (g + rng() * 0.7) / grand);
        const gi = Math.floor(tg * (secondary.pts.length - 1));
        const gb = secondary.pts[gi];
        const gt = secondary.pts[Math.min(gi + 1, secondary.pts.length - 1)].clone().sub(secondary.pts[Math.max(gi - 1, 0)]).normalize();
        const gAround = new THREE.Vector3().crossVectors(gt, up).normalize();
        const gDir = gt.clone().applyAxisAngle(gAround, range(rng, -0.8, 0.3)).applyAxisAngle(gt, range(rng, -2, 2));
        gDir.y = gDir.y * 0.5 + 0.12;
        const tertiary = grow(gb, gDir, range(rng, 30, 56), secondary.radii[gi] * 0.5, 2, 0);
        const tt = tertiary.pts[tertiary.pts.length - 1];
        anchors.push({ position: tt.clone().add(new THREE.Vector3(0, 5, 0)), scale: range(rng, 40, 56), tint: rng(), flat: 0.6 });
      }
    }

    // Aerial roots from the long lower limbs: hanging strands, and pillars that reached the ground.
    if (low) {
      for (let t = 0.26; t < 0.92; t += range(rng, 0.06, 0.1)) {
        const i = Math.floor(t * (primary.pts.length - 1));
        const top = primary.pts[i].clone().add(new THREE.Vector3(0, -primary.radii[i] * 0.55, 0));
        const r = Math.hypot(top.x, top.z);
        const th = Math.atan2(top.z, top.x);
        const nearEntrance = Math.abs(angleDiff(th, ENTRANCE.angle)) < 0.55;
        const ground = groundLocal(top.x, top.z);
        const reachesGround = !nearEntrance && t < 0.8 && r > 90 && rng() < 0.5;
        if (!reachesGround && rng() < 0.4) continue;
        const jx = range(rng, -7, 7);
        const jz = range(rng, -7, 7);
        if (reachesGround) {
          const drop = top.y - ground;
          const ctrl = [
            top,
            top.clone().add(new THREE.Vector3(jx * 0.6, -drop * 0.3, jz * 0.6)),
            top.clone().add(new THREE.Vector3(-jx * 0.3, -drop * 0.62, jz * 0.2)),
            top.clone().add(new THREE.Vector3(jx * 0.8, -drop * 0.86, jz)),
            new THREE.Vector3(top.x + jx, ground - 1.5, top.z + jz * 1.1),
          ];
          const pts = resampleCurve(ctrl, 26);
          const r0 = range(rng, 1.5, 2.6);
          // Thickens downwards and flares where it has rooted.
          const radii = pts.map((_, k) => {
            const f = k / (pts.length - 1);
            return r0 * (1 + f * 0.7) * (1 + 1.6 * smoothstep(0.86, 1, f));
          });
          tubes.push({ pts, radii, level: 3 });
          props.push({ points: pts, radii });
        } else {
          // Hanging strands: short and swaying, mostly, in loose curtains of two or three.
          const strands = 1 + Math.floor(rng() * 3);
          for (let k = 0; k < strands; k++) {
            const len = range(rng, 18, Math.max(24, Math.min(110, (top.y - ground) * 0.55))) * (k === 0 ? 1 : 0.7);
            const o = new THREE.Vector3(range(rng, -3, 3), 0, range(rng, -3, 3));
            const ctrl = [top.clone().add(o), top.clone().add(o).add(new THREE.Vector3(jx * 0.5, -len * 0.45, jz * 0.5)), top.clone().add(o).add(new THREE.Vector3(-jx * 0.2, -len, jz * 0.8))];
            const pts = resampleCurve(ctrl, 12);
            const r0 = range(rng, 0.4, 0.85);
            tubes.push({ pts, radii: pts.map((_, i2) => lerp(r0, 0.1, i2 / (pts.length - 1))), level: 3 });
          }
        }
      }
    }
  }

  // Thin the anchor cloud where masses would overlap heavily.
  const kept: LeafAnchor[] = [];
  for (const a of anchors) {
    if (kept.every((k) => k.position.distanceToSquared(a.position) > Math.pow((k.scale + a.scale) * 0.15, 2))) kept.push(a);
  }
  skeletonCache = { tubes, anchors: kept, props };
  return skeletonCache;
}

interface BranchResult {
  geometries: THREE.BufferGeometry[][]; // by level
  anchors: LeafAnchor[];
}

function buildBranches(): BranchResult {
  const sk = treeSkeleton();
  const geometries: THREE.BufferGeometry[][] = [[], [], [], []];
  const SEGMENTS = [18, 10, 6, 7];
  for (const tube of sk.tubes) {
    geometries[tube.level].push(
      buildTube({
        points: tube.pts,
        radii: tube.radii,
        radialSegments: SEGMENTS[tube.level],
        bumpiness: tube.level === 0 ? 0.07 : 0.05,
        noise: N,
        vScale: tube.level === 0 ? 11 : 7,
        capEnd: tube.level >= 2,
      })
    );
  }
  return { geometries, anchors: sk.anchors };
}

// ─── Interior structures ─────────────────────────────────────────────────────

export function wallPoint(theta: number, y: number, inset: number) {
  const sp = spine(y);
  const r = innerRadius(theta, y) - inset;
  return new THREE.Vector3(sp.x + Math.cos(theta) * r, y, sp.y + Math.sin(theta) * r);
}

/** Root tendrils climbing the hall walls and roots running across the hall floor. */
function buildInterior(): THREE.BufferGeometry[] {
  const rng = createRng(5151);
  const geos: THREE.BufferGeometry[] = [];
  // Tendrils hugging the wall.
  for (let k = 0; k < 20; k++) {
    let theta = (k / 20) * TAU + range(rng, -0.12, 0.12);
    if (Math.abs(angleDiff(theta, ENTRANCE.angle)) < 0.45) theta += 0.7;
    const top = range(rng, 40, 230);
    // Never let a tendril hang in front of a relic's alcove.
    if (ARCHIVE_SLOTS.some((s) => Math.abs(angleDiff(theta, s.theta)) < 0.3)) continue;
    const ctrl: THREE.Vector3[] = [];
    const steps = 9;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const y = lerp(top, -1, t);
      ctrl.push(wallPoint(theta + Math.sin(t * 5 + k) * 0.06, y, lerp(0.8, 2.6, t) + (s === steps ? 4 : 0)));
    }
    const pts = resampleCurve(ctrl, 56);
    const r0 = range(rng, 0.7, 1.7);
    geos.push(buildTube({ points: pts, radii: pts.map((_, i) => lerp(r0 * 0.35, r0 * 1.6, i / (pts.length - 1))), radialSegments: 8, bumpiness: 0.15, noise: N, vScale: 5, uRepeats: 2 }));
  }
  // Floor roots radiating from the wall towards the centre.
  for (let k = 0; k < 12; k++) {
    let theta = (k / 12) * TAU + 0.3;
    if (Math.abs(angleDiff(theta, ENTRANCE.angle)) < 0.4) theta += 0.5;
    // Roots grow between the alcoves, never out of one.
    if (ARCHIVE_SLOTS.some((s) => Math.abs(angleDiff(theta, s.theta)) < 0.16)) continue;
    // Short: they buttress the wall but stay clear of the camera's circle around the hall.
    const a = wallPoint(theta, 5, 0.5);
    const b = wallPoint(theta + 0.06, 2.6, 4);
    const c = wallPoint(theta + 0.1, 1.4, 7.5);
    const d = wallPoint(theta + 0.13, -0.8, 10);
    const pts = resampleCurve([a, b, c, d], 22);
    const r0 = range(rng, 1.3, 2.2);
    geos.push(buildTube({ points: pts, radii: pts.map((_, i) => lerp(r0, 0.5, i / (pts.length - 1))), radialSegments: 10, bumpiness: 0.12, noise: N, vScale: 5, uRepeats: 2 }));
  }
  return geos;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface WorldTreeData {
  outerShell: THREE.BufferGeometry;
  innerShell: THREE.BufferGeometry;
  crownRim: THREE.BufferGeometry;
  tunnel: THREE.BufferGeometry;
  roots: THREE.BufferGeometry[];
  branches: THREE.BufferGeometry[][];
  interior: THREE.BufferGeometry[];
  anchors: LeafAnchor[];
}

export function generateWorldTree(detail = 1): WorldTreeData {
  COLS = Math.round(360 * detail);
  ROWS = Math.round(230 * detail);
  const outer = buildShellGrid("outer");
  const inner = buildShellGrid("inner", outer.radii);
  const branches = buildBranches();
  return {
    outerShell: triangulateShell(outer.grid, "outer"),
    innerShell: triangulateShell(inner.grid, "inner"),
    crownRim: buildCrownRim(outer.grid, inner.grid),
    tunnel: buildEntranceTunnel(),
    roots: buildRoots(),
    branches: branches.geometries,
    interior: buildInterior(),
    anchors: branches.anchors,
  };
}

/** Hall centre and the smallest wall radius at height y (camera clamping, placement). */
/** Local height of the hall floor (the ground inside the trunk). */
export const HALL_FLOOR = 2.2;

/**
 * The hall floor: packed earth and root-wood, ridged by roots running in from
 * the walls, tucked under the wall at its rim and settling flush with the
 * ground at the entrance.
 */
export function buildHallFloor(): THREE.BufferGeometry {
  const rings = 28;
  const segs = 144;
  const centre = spine(HALL_FLOOR);
  const pos: number[] = [centre.x, HALL_FLOOR + 0.3, centre.y];
  const uv: number[] = [0, 0];
  const index: number[] = [];
  const reach: number[] = [];
  for (let s = 0; s < segs; s++) reach.push(innerRadius((s / segs) * TAU, HALL_FLOOR + 1) + 2.5);
  for (let r = 1; r <= rings; r++) {
    const f = r / rings;
    for (let s = 0; s < segs; s++) {
      const theta = (s / segs) * TAU;
      const rr = f * reach[s];
      const ridge = Math.pow(Math.abs(Math.sin(theta * 9 + N.noise2(rr * 0.08, theta * 2) * 1.6)), 8) * smoothstep(0.3, 0.88, f) * 0.85;
      const hump = N.noise2(Math.cos(theta) * rr * 0.12 + 5, Math.sin(theta) * rr * 0.12) * 0.22;
      const settle = 1 - smoothstep(0.9, 1.0, f);
      pos.push(centre.x + Math.cos(theta) * rr, HALL_FLOOR + 0.06 + (0.18 + ridge + hump) * settle, centre.y + Math.sin(theta) * rr);
      uv.push((s / segs) * 12, rr / 5);
    }
  }
  for (let s = 0; s < segs; s++) index.push(0, 1 + ((s + 1) % segs), 1 + s);
  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = 1 + (r - 1) * segs + s;
      const b = 1 + (r - 1) * segs + ((s + 1) % segs);
      index.push(a, b, a + segs, b, b + segs, a + segs);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** Exact hollow radius at height y: the narrowest of 64 wall samples. */
function cavityRadiusExact(y: number) {
  let min = Infinity;
  for (let k = 0; k < 64; k++) min = Math.min(min, innerRadius((k / 64) * TAU, y));
  return min;
}

/** Hollow radius sampled every metre once, then interpolated (motes, threads and rings call this thousands of times). */
const CAVITY_STEP = 1;
const CAVITY_MIN = -12;
const CAVITY_MAX = 420;
let cavityTable: Float32Array | null = null;

/** Hall axis and the hollow's smallest radius at local height y. */
export function cavityAt(y: number) {
  const sp = spine(y);
  if (!cavityTable) {
    cavityTable = new Float32Array(Math.round((CAVITY_MAX - CAVITY_MIN) / CAVITY_STEP) + 1);
    for (let i = 0; i < cavityTable.length; i++) cavityTable[i] = cavityRadiusExact(CAVITY_MIN + i * CAVITY_STEP);
  }
  const f = (clamp(y, CAVITY_MIN, CAVITY_MAX) - CAVITY_MIN) / CAVITY_STEP;
  const i = Math.min(Math.floor(f), cavityTable.length - 2);
  const t = f - i;
  return { x: sp.x, z: sp.y, radius: cavityTable[i] + (cavityTable[i + 1] - cavityTable[i]) * t };
}

/** Local position of a relic's plinth (the alcove floor, a little inside the hall). */
export function slotPosition(slot: ArchiveSlot) {
  return wallPoint(slot.theta, slot.y, 2.6);
}
