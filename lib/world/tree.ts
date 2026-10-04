import * as THREE from "three";
import { SimplexNoise, clamp, createRng, lerp, range, smoothstep } from "./noise";
import { buildTube, resampleCurve } from "./geometry";
import { TREE_ENTRANCE_ANGLE } from "./layout";
import type { ArtifactId } from "./archive";

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

export const LIMBS: LimbSpec[] = [
  { angle: 0.3, y: 286, elevation: 0.55, length: 470, radius: 18, sweep: 0.25 },
  { angle: 1.15, y: 330, elevation: 0.95, length: 370, radius: 15, sweep: -0.3 },
  { angle: 2.0, y: 250, elevation: 0.38, length: 510, radius: 19.5, sweep: 0.2 },
  { angle: 2.85, y: 318, elevation: 0.72, length: 430, radius: 16.5, sweep: -0.22 },
  { angle: 3.75, y: 268, elevation: 0.46, length: 495, radius: 18.5, sweep: 0.3 },
  { angle: 4.6, y: 336, elevation: 0.9, length: 360, radius: 14, sweep: -0.18 },
  { angle: 5.45, y: 296, elevation: 0.6, length: 445, radius: 17, sweep: 0.22 },
  { angle: 1.6, y: 222, elevation: 0.3, length: 330, radius: 13, sweep: 0.35 },
  { angle: 5.0, y: 240, elevation: 0.34, length: 380, radius: 14, sweep: -0.25 },
  // Near-vertical leaders raise the crown into a dome.
  { angle: 0.9, y: 338, elevation: 1.2, length: 300, radius: 13.5, sweep: 0.15 },
  { angle: 4.0, y: 330, elevation: 1.15, length: 290, radius: 13, sweep: -0.12 },
  { angle: 2.45, y: 334, elevation: 1.25, length: 270, radius: 12, sweep: 0.1 },
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

// ─── Archive slots (artifact mounts inside the hall) ────────────────────────

export type MountKind = "roots" | "alcove" | "branch" | "fungus" | "suspended";

export interface ArchiveSlot {
  id: ArtifactId;
  y: number;
  theta: number;
  mount: MountKind;
}

const FAR = ENTRANCE.angle + Math.PI;
const SLOT_ORDER: [ArtifactId, MountKind][] = [
  ["aura", "roots"],
  ["etth", "alcove"],
  ["shadowguard", "branch"],
  ["qshield", "fungus"],
  ["jiva", "alcove"],
  ["sugarai", "fungus"],
  ["street-hierarchy", "alcove"],
  ["trc", "branch"],
  ["achievements", "alcove"],
  ["leadership", "suspended"],
  ["experience", "alcove"],
];
export const ARCHIVE_SLOTS: ArchiveSlot[] = SLOT_ORDER.map(([id, mount], i) => ({
  id,
  mount,
  y: 12 + i * 16,
  theta: FAR + 0.25 + i * 1.72,
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
  // Niches carved into the wall behind alcove-mounted artifacts.
  for (const slot of ARCHIVE_SLOTS) {
    if (slot.mount !== "alcove") continue;
    const da = angleDiff(theta, slot.theta) * r;
    const dy = y - (slot.y + 2);
    r += 4.6 * Math.exp(-(da * da) / 26 - (dy * dy) / 30);
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

const COLS = 360;
const ROWS = 230;
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

function buildRoots(): THREE.BufferGeometry[] {
  const rng = createRng(3131);
  const geos: THREE.BufferGeometry[] = [];
  const sp = new THREE.Vector2();
  const at = (theta: number, r: number, y: number) => {
    spine(Math.max(y, 0), sp);
    return new THREE.Vector3(sp.x + Math.cos(theta) * r, y, sp.y + Math.sin(theta) * r);
  };
  for (const lobe of LOBES) {
    const rootCount = lobe.strength > 22 ? 2 : 1;
    for (let rc = 0; rc < rootCount; rc++) {
      const theta0 = lobe.angle + (rc === 0 ? 0 : range(rng, -0.22, 0.22));
      // Keep the entrance corridor open.
      if (Math.abs(angleDiff(theta0, ENTRANCE.angle)) < 0.3) continue;
      const reach = range(rng, 80, 150) + lobe.strength * 1.6;
      const r0 = baseRadius(8) + lobe.strength * 0.4;
      const drift = range(rng, -0.16, 0.16);
      const ctrl = [
        at(theta0, r0 - 14, 16 + lobe.strength * 0.35),
        at(theta0 + drift * 0.2, r0 + 6, 9),
        at(theta0 + drift * 0.5, r0 + reach * 0.35, 4 + range(rng, 0, 3)),
        at(theta0 + drift * 0.8, r0 + reach * 0.62, rc === 1 ? 6 : 1.4),
        at(theta0 + drift, r0 + reach * 0.85, 0.2),
        at(theta0 + drift * 1.1, r0 + reach, -5),
      ];
      const pts = resampleCurve(ctrl, 56);
      const base = rc === 0 ? 6.5 + lobe.strength * 0.18 : 4;
      const radii = pts.map((_, i) => base * (1 - 0.85 * Math.pow(i / (pts.length - 1), 0.85)) + 0.5);
      const ellipse = pts.map((_, i) => {
        const t = i / (pts.length - 1);
        return [lerp(0.5, 1.0, smoothstep(0, 0.5, t)), lerp(1.55, 0.85, smoothstep(0, 0.6, t))] as [number, number];
      });
      geos.push(buildTube({ points: pts, radii, ellipse, radialSegments: 16, bumpiness: 0.12, noise: N, vScale: 9, uRepeats: 8 }));
    }
  }
  return geos;
}

// ─── Branches & canopy anchors ───────────────────────────────────────────────

export interface LeafAnchor {
  position: THREE.Vector3;
  scale: number;
  tint: number;
}

interface BranchResult {
  geometries: THREE.BufferGeometry[][]; // by level
  anchors: LeafAnchor[];
}

function buildBranches(): BranchResult {
  const rng = createRng(6060);
  const geometries: THREE.BufferGeometry[][] = [[], [], []];
  const anchors: LeafAnchor[] = [];
  const sp = new THREE.Vector2();
  const up = new THREE.Vector3(0, 1, 0);

  const grow = (start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, level: number, sweep: number) => {
    const segs = level === 0 ? 8 : level === 1 ? 5 : 4;
    const ctrl: THREE.Vector3[] = [start.clone()];
    const d = dir.clone().normalize();
    const p = start.clone();
    const side = new THREE.Vector3().crossVectors(d, up).normalize();
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      // Limbs rise, then spread and arc outward under their own weight.
      const droop = level === 0 ? 0.12 : 0.1;
      d.addScaledVector(up, -droop * t).addScaledVector(side, sweep * 0.12 + range(rng, -0.08, 0.08));
      d.y += range(rng, -0.05, 0.08);
      d.normalize();
      p.addScaledVector(d, length / segs);
      ctrl.push(p.clone());
    }
    const pts = resampleCurve(ctrl, level === 0 ? 56 : level === 1 ? 24 : 10);
    const tipR = level === 0 ? 3 : level === 1 ? 1.1 : 0.35;
    const radii = pts.map((_, i) => lerp(radius, tipR, Math.pow(i / (pts.length - 1), 0.75)));
    geometries[level].push(
      buildTube({
        points: pts,
        radii,
        radialSegments: level === 0 ? 18 : level === 1 ? 10 : 6,
        bumpiness: level === 0 ? 0.07 : 0.05,
        noise: N,
        vScale: level === 0 ? 11 : 7,
        capEnd: level === 2,
      })
    );
    return { pts, radii };
  };

  const canopyCenter = new THREE.Vector3(0, 470, 0);

  for (const limb of LIMBS) {
    const y = limb.y;
    spine(y, sp);
    const ro = outerRadius(limb.angle, y);
    const ri = innerRadius(limb.angle, y, ro);
    // Embed the limb base inside the wall without breaking into the hall.
    const centerR = Math.max(ri + limb.radius * Math.sin(limb.elevation) + 2.0, ro - limb.radius * 0.75);
    const start = new THREE.Vector3(sp.x + Math.cos(limb.angle) * centerR, y, sp.y + Math.sin(limb.angle) * centerR);
    const dir = new THREE.Vector3(Math.cos(limb.angle) * Math.cos(limb.elevation), Math.sin(limb.elevation), Math.sin(limb.angle) * Math.cos(limb.elevation));
    const primary = grow(start, dir, limb.length, limb.radius, 0, limb.sweep);

    const childCount = 5 + Math.floor(rng() * 2);
    for (let c = 0; c < childCount; c++) {
      const t = lerp(0.28, 0.94, (c + rng() * 0.6) / childCount);
      const i = Math.floor(t * (primary.pts.length - 1));
      const base = primary.pts[i];
      const tangent = primary.pts[Math.min(i + 1, primary.pts.length - 1)].clone().sub(primary.pts[Math.max(i - 1, 0)]).normalize();
      const around = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const childDir = tangent
        .clone()
        .applyAxisAngle(around, range(rng, -0.9, -0.35))
        .applyAxisAngle(tangent, range(rng, -1.6, 1.6));
      childDir.y = Math.abs(childDir.y) * 0.8 + 0.12;
      const len = limb.length * range(rng, 0.3, 0.46) * (1.1 - t * 0.4);
      const rad = primary.radii[i] * range(rng, 0.42, 0.56);
      const secondary = grow(base, childDir, len, rad, 1, range(rng, -0.4, 0.4));

      const grand = 4 + Math.floor(rng() * 2);
      for (let g = 0; g < grand; g++) {
        const tg = lerp(0.42, 1.0, (g + rng() * 0.7) / grand);
        const gi = Math.floor(tg * (secondary.pts.length - 1));
        const gb = secondary.pts[gi];
        const gt = secondary.pts[Math.min(gi + 1, secondary.pts.length - 1)].clone().sub(secondary.pts[Math.max(gi - 1, 0)]).normalize();
        const gAround = new THREE.Vector3().crossVectors(gt, up).normalize();
        const gDir = gt.clone().applyAxisAngle(gAround, range(rng, -0.8, 0.3)).applyAxisAngle(gt, range(rng, -2, 2));
        gDir.y = gDir.y * 0.6 + 0.15;
        const tertiary = grow(gb, gDir, range(rng, 34, 62), secondary.radii[gi] * 0.5, 2, 0);
        const tip = tertiary.pts[tertiary.pts.length - 1];
        anchors.push({ position: tip.clone(), scale: range(rng, 36, 52), tint: rng() });
        if (rng() < 0.75) anchors.push({ position: tertiary.pts[Math.floor(tertiary.pts.length * 0.45)].clone().add(new THREE.Vector3(0, 6, 0)), scale: range(rng, 28, 40), tint: rng() });
      }
      anchors.push({ position: secondary.pts[secondary.pts.length - 1].clone(), scale: range(rng, 40, 56), tint: rng() });
      for (const f of [0.55, 0.8]) {
        const p = secondary.pts[Math.floor(f * (secondary.pts.length - 1))].clone().add(new THREE.Vector3(0, 7, 0));
        anchors.push({ position: p, scale: range(rng, 30, 44), tint: rng() });
      }
    }
    // Clumps hugging the outer half of each limb fill the crown's core.
    for (let k = 0; k < 4; k++) {
      const i = Math.floor(lerp(0.5, 0.97, k / 3) * (primary.pts.length - 1));
      const p = primary.pts[i].clone();
      const out = p.clone().sub(canopyCenter).setY(0).normalize();
      p.addScaledVector(out, 10).add(new THREE.Vector3(0, 16, 0));
      anchors.push({ position: p, scale: range(rng, 44, 60), tint: rng() });
    }
  }

  // The dome: cumulus-like billows of foliage over the limbs, so from afar the
  // crown reads as one vast golden mass spread across the sky.
  const BILLOWS = 72;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const u = new THREE.Vector3();
  for (let b = 0; b < BILLOWS; b++) {
    const yN = 1 - (b / (BILLOWS - 1)) * 1.2;
    const ring = Math.sqrt(Math.max(0, 1 - yN * yN));
    const th = b * golden + range(rng, -0.2, 0.2);
    const dir = new THREE.Vector3(Math.cos(th) * ring, yN, Math.sin(th) * ring);
    const centre = new THREE.Vector3(dir.x * 430, 470 + dir.y * 200, dir.z * 430);
    const rb = range(rng, 70, 110);
    for (let m = 0; m < 11; m++) {
      u.set(range(rng, -1, 1), range(rng, -1, 1), range(rng, -1, 1)).normalize();
      // Keep masses on the billow's outer side.
      if (u.dot(dir) < -0.1) u.addScaledVector(dir, -2 * u.dot(dir));
      anchors.push({ position: centre.clone().addScaledVector(u, rb * range(rng, 0.5, 0.95)), scale: range(rng, 56, 76), tint: rng() });
    }
  }

  // Thin the anchor cloud where clumps would overlap heavily.
  const kept: LeafAnchor[] = [];
  for (const a of anchors) {
    if (kept.every((k) => k.position.distanceToSquared(a.position) > Math.pow((k.scale + a.scale) * 0.15, 2))) kept.push(a);
  }
  return { geometries, anchors: kept };
}

// ─── Interior structures ─────────────────────────────────────────────────────

export function wallPoint(theta: number, y: number, inset: number) {
  const sp = spine(y);
  const r = innerRadius(theta, y) - inset;
  return new THREE.Vector3(sp.x + Math.cos(theta) * r, y, sp.y + Math.sin(theta) * r);
}

/** Root tendrils climbing the hall walls, floor roots, and the branch stubs that carry artifacts. */
function buildInterior(): THREE.BufferGeometry[] {
  const rng = createRng(5151);
  const geos: THREE.BufferGeometry[] = [];
  // Tendrils hugging the wall.
  for (let k = 0; k < 20; k++) {
    let theta = (k / 20) * TAU + range(rng, -0.12, 0.12);
    if (Math.abs(angleDiff(theta, ENTRANCE.angle)) < 0.45) theta += 0.7;
    const top = range(rng, 40, 230);
    // Never let a tendril hang between a relic and the hall.
    if (ARCHIVE_SLOTS.some((s) => s.y - 8 < top && Math.abs(angleDiff(theta, s.theta)) < 0.5)) continue;
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
    const a = wallPoint(theta, 5, 0.5);
    const b = wallPoint(theta + 0.12, 2.6, 8);
    const c = wallPoint(theta + 0.2, 1.6, 15);
    const d = wallPoint(theta + 0.26, -0.8, 20);
    const pts = resampleCurve([a, b, c, d], 26);
    const r0 = range(rng, 1.6, 2.8);
    geos.push(buildTube({ points: pts, radii: pts.map((_, i) => lerp(r0, 0.5, i / (pts.length - 1))), radialSegments: 10, bumpiness: 0.12, noise: N, vScale: 5, uRepeats: 2 }));
  }
  // Branch stubs growing inward from the wall: artifacts rest at their tips.
  for (const slot of ARCHIVE_SLOTS) {
    if (slot.mount !== "branch") continue;
    const a = wallPoint(slot.theta, slot.y - 3.2, -3);
    const b = wallPoint(slot.theta + 0.04, slot.y - 2.2, 4);
    const c = wallPoint(slot.theta + 0.02, slot.y - 1.6, 7.5);
    const pts = resampleCurve([a, b, c], 20);
    geos.push(
      buildTube({ points: pts, radii: pts.map((_, i) => lerp(3.2, 1.6, i / (pts.length - 1))), radialSegments: 14, bumpiness: 0.1, noise: N, vScale: 5, uRepeats: 3, capEnd: true })
    );
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

export function generateWorldTree(): WorldTreeData {
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

export function cavityAt(y: number) {
  const sp = spine(y);
  let min = Infinity;
  for (let k = 0; k < 64; k++) min = Math.min(min, innerRadius((k / 64) * TAU, y));
  return { x: sp.x, z: sp.y, radius: min };
}

/** Local position where an archive slot's artifact rests. */
export function slotPosition(slot: ArchiveSlot) {
  switch (slot.mount) {
    case "branch":
      return wallPoint(slot.theta + 0.02, slot.y + 0.2, 7.5);
    case "alcove":
      return wallPoint(slot.theta, slot.y + 1.2, 2.2);
    case "fungus":
      return wallPoint(slot.theta, slot.y + 0.8, 5.2);
    case "suspended":
      return wallPoint(slot.theta, slot.y + 1, 7);
    case "roots":
    default:
      return wallPoint(slot.theta, slot.y + 0.6, 6);
  }
}
