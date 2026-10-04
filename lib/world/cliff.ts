import * as THREE from "three";
import { SimplexNoise, createRng, lerp, smoothstep } from "./noise";
import { WATERFALL, plateauSigned, terrainHeight } from "./layout";

/**
 * The waterfall plateau's cliff face.
 *
 * A heightfield can only stretch a few triangles over a 26-unit drop, so the
 * face gets its own mesh: the plateau edge is traced as an iso-contour of the
 * plateau's signed distance (marching squares), and for every point along it
 * a column of vertices follows the terrain's own profile down the cliff —
 * pushed a little proud of it and carved into stratified rock: horizontal
 * bedding ledges, vertical joints, weathered noise. Talus boulders gather at
 * the foot. Deterministic.
 */

const noise = new SimplexNoise(6262);

const BOX = { x0: -180, x1: -12, z0: -262, z1: -40, step: 1 };
const LEVEL = -1.5;
const COLUMN_SPACING = 0.9;
const ROWS = 64;
const MIN_DROP = 7;

/** Contour polylines of the plateau edge (closed loops repeat their first point at the end). */
function traceContours(): THREE.Vector2[][] {
  const { x0, x1, z0, z1, step } = BOX;
  const nx = Math.round((x1 - x0) / step) + 1;
  const nz = Math.round((z1 - z0) / step) + 1;
  const val = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) val[j * nx + i] = plateauSigned(x0 + i * step, z0 + j * step) - LEVEL;
  const V = (i: number, j: number) => val[j * nx + i];

  const points = new Map<string, THREE.Vector2>();
  const crossing = (i0: number, j0: number, i1: number, j1: number) => {
    const key = i0 === i1 ? `v${i0},${Math.min(j0, j1)}` : `h${Math.min(i0, i1)},${j0}`;
    if (!points.has(key)) {
      const a = V(i0, j0);
      const b = V(i1, j1);
      const t = a / (a - b);
      points.set(key, new THREE.Vector2(x0 + (i0 + (i1 - i0) * t) * step, z0 + (j0 + (j1 - j0) * t) * step));
    }
    return key;
  };
  const adjacency = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push(b);
    adjacency.get(b)!.push(a);
  };

  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      // Corners 0 (i,j) 1 (i+1,j) 2 (i+1,j+1) 3 (i,j+1); edge k joins corner k and k+1.
      const c = [V(i, j) > 0, V(i + 1, j) > 0, V(i + 1, j + 1) > 0, V(i, j + 1) > 0];
      const e = [
        c[0] !== c[1] ? crossing(i, j, i + 1, j) : "",
        c[1] !== c[2] ? crossing(i + 1, j, i + 1, j + 1) : "",
        c[2] !== c[3] ? crossing(i, j + 1, i + 1, j + 1) : "",
        c[3] !== c[0] ? crossing(i, j, i, j + 1) : "",
      ];
      const hits = e.filter(Boolean);
      if (hits.length === 2) link(hits[0], hits[1]);
      else if (hits.length === 4) {
        // Saddle: resolve with the cell-centre value.
        const centre = V(i, j) + V(i + 1, j) + V(i + 1, j + 1) + V(i, j + 1) > 0;
        if (centre === c[0]) {
          link(e[0], e[1]);
          link(e[2], e[3]);
        } else {
          link(e[3], e[0]);
          link(e[1], e[2]);
        }
      }
    }
  }

  // Walk the graph into polylines, open ends first.
  const used = new Set<string>();
  const lines: THREE.Vector2[][] = [];
  const starts = [...adjacency.keys()].sort((a, b) => adjacency.get(a)!.length - adjacency.get(b)!.length);
  for (const start of starts) {
    if (used.has(start)) continue;
    const keys = [start];
    used.add(start);
    let current = start;
    for (;;) {
      const next = adjacency.get(current)!.find((k) => !used.has(k));
      if (!next) break;
      used.add(next);
      keys.push(next);
      current = next;
    }
    if (keys.length < 12) continue;
    const line = keys.map((k) => points.get(k)!.clone());
    if (adjacency.get(current)!.includes(start)) line.push(line[0].clone());
    lines.push(line);
  }
  return lines;
}

/** Even spacing along a polyline, lightly smoothed. */
function resample(line: THREE.Vector2[], spacing: number) {
  const closed = line[0].distanceTo(line[line.length - 1]) < 1e-6;
  const lengths = [0];
  for (let i = 1; i < line.length; i++) lengths.push(lengths[i - 1] + line[i].distanceTo(line[i - 1]));
  const total = lengths[lengths.length - 1];
  const count = Math.max(2, Math.round(total / spacing));
  const out: THREE.Vector2[] = [];
  let k = 0;
  for (let n = 0; n <= count; n++) {
    const d = (n / count) * total;
    while (k < lengths.length - 2 && lengths[k + 1] < d) k++;
    const t = (d - lengths[k]) / Math.max(1e-6, lengths[k + 1] - lengths[k]);
    out.push(line[k].clone().lerp(line[k + 1], t));
  }
  for (let pass = 0; pass < 3; pass++) {
    const copy = out.map((p) => p.clone());
    for (let i = 0; i < out.length; i++) {
      const prev = copy[i - 1] ?? (closed ? copy[copy.length - 2] : copy[i]);
      const next = copy[i + 1] ?? (closed ? copy[1] : copy[i]);
      out[i].copy(copy[i]).multiplyScalar(0.5).addScaledVector(prev, 0.25).addScaledVector(next, 0.25);
    }
  }
  return { points: out, closed };
}

/** Outward strata relief (≥ about -0.9) at height y and distance a along the face. */
function strata(y: number, a: number, lineSeed: number) {
  const yy = y + noise.noise2(a * 0.015, lineSeed) * 1.4;
  const H = 2.3 + 0.6 * noise.noise2(lineSeed * 3.1, yy * 0.05);
  const layer = Math.floor(yy / H);
  const u = yy / H - layer; // 0 at the bottom of a bed, 1 at its top
  // Each bed stands out by its own amount, changing slowly along the face.
  const amp = 0.35 + 1.35 * (0.5 + 0.5 * noise.noise2(layer * 3.7 + lineSeed, a * 0.03));
  // A rounded ledge that recedes into the bedding joint above it.
  const ledge = smoothstep(0.0, 0.25, u) * (1 - 0.85 * smoothstep(0.8, 1.0, u));
  // Vertical joints every few metres.
  const jp = a * 0.14 + noise.noise2(a * 0.05, layer * 0.7) * 0.8;
  const joint = Math.pow(Math.abs(Math.sin(jp * Math.PI)), 12);
  return amp * ledge - joint * 0.7 + noise.noise2(a * 0.4, y * 0.4) * 0.18;
}

export interface CliffData {
  geometry: THREE.BufferGeometry;
  /** Sites for boulders that have fallen to the foot of the face. */
  talus: { x: number; z: number; size: number }[];
}

export function buildCliff(): CliffData {
  const rng = createRng(3131);
  const lip = new THREE.Vector2(WATERFALL.lip.x, WATERFALL.lip.z);
  const positions: number[] = [];
  const index: number[] = [];
  const talus: CliffData["talus"] = [];
  const offsets: number[] = [];
  for (let t = -6; t <= 6.5; t += 0.5) offsets.push(t);

  traceContours().forEach((raw, lineIndex) => {
    const { points, closed } = resample(raw, COLUMN_SPACING);
    // Walk so that up × along points out of the plateau (front faces outward).
    let facing = 0;
    for (let k = 0; k < points.length - 1; k += 4) {
      const p = points[k];
      const tx = points[k + 1].x - p.x;
      const tz = points[k + 1].y - p.y;
      const gx = plateauSigned(p.x + 0.6, p.y) - plateauSigned(p.x - 0.6, p.y);
      const gz = plateauSigned(p.x, p.y + 0.6) - plateauSigned(p.x, p.y - 0.6);
      facing += tz * -gx - tx * -gz;
    }
    if (facing < 0) points.reverse();
    const n = closed ? points.length - 1 : points.length; // closed loops repeat their first point
    const at = (k: number) => points[closed ? ((k % n) + n) % n : Math.min(Math.max(k, 0), n - 1)];

    // Smooth outward normals from the contour's own tangent, so neighbouring
    // columns never fan across each other.
    const normals: THREE.Vector2[] = [];
    for (let k = 0; k < n; k++) {
      const tan = at(k + 4).clone().sub(at(k - 4)).normalize();
      normals.push(new THREE.Vector2(tan.y, -tan.x));
    }
    for (let pass = 0; pass < 2; pass++) {
      const copy = normals.map((v) => v.clone());
      for (let k = 0; k < n; k++) {
        const acc = new THREE.Vector2();
        for (let d = -4; d <= 4; d++) {
          const j = closed ? (((k + d) % n) + n) % n : Math.min(Math.max(k + d, 0), n - 1);
          acc.add(copy[j]);
        }
        normals[k].copy(acc.normalize());
      }
    }

    // Terrain profile across each column, and whether there is a real drop here.
    const columns = points.slice(0, n).map((p, k) => {
      const nn = normals[k];
      const heights = offsets.map((o) => terrainHeight(p.x + nn.x * o, p.y + nn.y * o));
      const top = terrainHeight(p.x - nn.x * 4.5, p.y - nn.y * 4.5);
      let foot = Infinity;
      offsets.forEach((o, s) => {
        if (o >= 3) foot = Math.min(foot, heights[s]);
      });
      return { p, nn, heights, top, foot, valid: top - foot >= MIN_DROP };
    });

    // Distance (in columns) to the nearest end of the face: relief fades out there.
    const reach = columns.map(() => Infinity);
    for (let k = 0; k < n; k++) {
      if (!columns[k].valid) continue;
      let d = 0;
      while (d < 8) {
        const a = k - d - 1;
        const b = k + d + 1;
        const ia = closed ? ((a % n) + n) % n : a;
        const ib = closed ? b % n : b;
        const endA = !closed && a < 0 ? true : !columns[ia]?.valid;
        const endB = !closed && b >= n ? true : !columns[ib]?.valid;
        if (endA || endB) break;
        d++;
      }
      reach[k] = d;
    }

    const lineSeed = lineIndex * 17.3;
    const columnVertex = new Array<number>(n).fill(-1);
    for (let k = 0; k < n; k++) {
      const c = columns[k];
      if (!c.valid) continue;
      const a = k * COLUMN_SPACING;
      // Keep the face behind the falling water flat and set back.
      const calm = smoothstep(WATERFALL.width * 0.5 + 2.0, WATERFALL.width * 0.5 + 7.0, c.p.distanceTo(lip));
      const settle = smoothstep(0, 6, reach[k]) * calm;
      columnVertex[k] = positions.length / 3;
      for (let r = 0; r <= ROWS; r++) {
        const y = lerp(c.foot - 1.4, c.top + 0.12, r / ROWS);
        // Outermost offset where the ground still reaches this height.
        let t = offsets[0];
        for (let s = offsets.length - 1; s > 0; s--) {
          if (c.heights[s - 1] >= y) {
            const h0 = c.heights[s - 1];
            const h1 = c.heights[s];
            const f = h0 === h1 ? 0 : (h0 - y) / (h0 - h1);
            t = lerp(offsets[s - 1], offsets[s], Math.min(Math.max(f, 0), 1));
            break;
          }
        }
        const push = lerp(0.25, 0.95, settle) + strata(y, a, lineSeed) * settle;
        positions.push(c.p.x + c.nn.x * (t + push), y, c.p.y + c.nn.y * (t + push));
      }

      // Fallen blocks at the foot, now and then.
      if (settle > 0.9 && rng() < 0.12) {
        const footIndex = c.heights.findIndex((h, s) => offsets[s] > 0 && h <= c.foot + 1.2);
        const out = (footIndex >= 0 ? offsets[footIndex] : 4) + 1.5 + rng() * 3.5;
        talus.push({ x: c.p.x + c.nn.x * out, z: c.p.y + c.nn.y * out, size: 0.7 + Math.pow(rng(), 2) * 2.8 });
      }
    }

    // Stitch neighbouring columns (and the loop's seam).
    const pairs = closed ? n : n - 1;
    for (let k = 0; k < pairs; k++) {
      const a0 = columnVertex[k];
      const b0 = columnVertex[(k + 1) % n];
      if (a0 < 0 || b0 < 0) continue;
      for (let r = 0; r < ROWS; r++) index.push(a0 + r, a0 + r + 1, b0 + r, b0 + r, a0 + r + 1, b0 + r + 1);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(positions.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(index, 1) : new THREE.Uint16BufferAttribute(index, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return { geometry, talus };
}
