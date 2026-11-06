import * as THREE from "three";
import { SimplexNoise, createRng } from "./noise";

/**
 * Generic procedural geometry builders shared by the World Tree, forest
 * trees and props.
 */

export interface TubeOptions {
  /** Centre-line points (at least 2). */
  points: THREE.Vector3[];
  /** Radius at each point. */
  radii: number[];
  radialSegments: number;
  /** Optional per-point cross-section squash: x scales the "side" axis, y the "up-ish" axis. */
  ellipse?: [number, number][];
  /** Surface roughness amplitude (fraction of radius) and seed. */
  bumpiness?: number;
  noise?: SimplexNoise;
  /** World units per texture repeat along the tube. */
  vScale?: number;
  /** Texture repeats around the tube; defaults to circumference / vScale (min 1). */
  uRepeats?: number;
  /** Close the far end with a small rounded cap. */
  capEnd?: boolean;
}

const _up = new THREE.Vector3(0, 1, 0);

/**
 * The "up" axis of buildTube's cross-sections at every point (parallel-transport
 * frames, started perpendicular to the first tangent and biased to world-up).
 * Lets other systems place things exactly on a tube's crest.
 */
export function tubeUpVectors(points: THREE.Vector3[]): THREE.Vector3[] {
  const n = points.length;
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) tangents.push(new THREE.Vector3().subVectors(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]).normalize());
  let nrm = new THREE.Vector3().crossVectors(tangents[0], _up);
  if (nrm.lengthSq() < 1e-6) nrm.set(1, 0, 0);
  nrm.normalize().cross(tangents[0]).normalize();
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      const axis = new THREE.Vector3().crossVectors(tangents[i - 1], tangents[i]);
      const s = axis.length();
      if (s > 1e-6) {
        axis.divideScalar(s);
        nrm = nrm.clone().applyAxisAngle(axis, Math.acos(THREE.MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1)));
      } else nrm = nrm.clone();
    }
    out.push(nrm.clone());
  }
  return out;
}

/**
 * Variable-radius tube along a polyline using parallel-transport frames
 * (no twisting), with optional elliptical sections and organic bumps.
 * Produces UVs suitable for the bark textures (u around, v along length).
 */
export function buildTube(opts: TubeOptions): THREE.BufferGeometry {
  const { points, radii, radialSegments: rs, ellipse, bumpiness = 0, noise, vScale = 18, capEnd = false } = opts;
  const n = points.length;
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(n - 1, i + 1)];
    tangents.push(new THREE.Vector3().subVectors(b, a).normalize());
  }
  // Initial normal: perpendicular to the first tangent, biased to world-up.
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];
  let nrm = new THREE.Vector3().crossVectors(tangents[0], _up);
  if (nrm.lengthSq() < 1e-6) nrm.set(1, 0, 0);
  nrm.normalize().cross(tangents[0]).normalize(); // points "up" relative to the tube
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      const axis = new THREE.Vector3().crossVectors(tangents[i - 1], tangents[i]);
      const s = axis.length();
      if (s > 1e-6) {
        axis.divideScalar(s);
        const ang = Math.acos(THREE.MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1));
        nrm = nrm.clone().applyAxisAngle(axis, ang);
      } else nrm = nrm.clone();
    }
    normals.push(nrm.clone());
    binormals.push(new THREE.Vector3().crossVectors(tangents[i], nrm).normalize());
  }

  // Arc length for v coordinates.
  const arc = [0];
  for (let i = 1; i < n; i++) arc.push(arc[i - 1] + points[i].distanceTo(points[i - 1]));
  const circumference = 2 * Math.PI * radii[0];
  const uRep = opts.uRepeats ?? Math.max(1, Math.round(circumference / vScale));

  const ring = rs + 1;
  const capRings = capEnd ? 3 : 0;
  const total = n + capRings;
  const pos = new Float32Array(total * ring * 3);
  const nor = new Float32Array(total * ring * 3);
  const uv = new Float32Array(total * ring * 2);
  const p = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const writeRing = (ri: number, center: THREE.Vector3, N: THREE.Vector3, B: THREE.Vector3, T: THREE.Vector3, r: number, ex: number, ey: number, v: number, normalTilt: number) => {
    for (let j = 0; j <= rs; j++) {
      const a = (j / rs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      dir.copy(B).multiplyScalar(ca * ex).addScaledVector(N, sa * ey);
      let rr = r;
      if (bumpiness > 0 && noise) {
        const q = center.x * 0.13 + ca * 1.7;
        rr *= 1 + bumpiness * noise.noise3(q, center.y * 0.13 + sa * 1.7, center.z * 0.13 + v * 0.9);
      }
      p.copy(center).addScaledVector(dir, rr);
      const k = (ri * ring + j) * 3;
      pos[k] = p.x;
      pos[k + 1] = p.y;
      pos[k + 2] = p.z;
      // Normal of an ellipse section: scale the opposite axes.
      const nn = new THREE.Vector3().copy(B).multiplyScalar(ca / Math.max(ex, 1e-3)).addScaledVector(N, sa / Math.max(ey, 1e-3)).normalize();
      nn.addScaledVector(T, normalTilt).normalize();
      nor[k] = nn.x;
      nor[k + 1] = nn.y;
      nor[k + 2] = nn.z;
      const u2 = (ri * ring + j) * 2;
      uv[u2] = (j / rs) * uRep;
      uv[u2 + 1] = v;
    }
  };

  for (let i = 0; i < n; i++) {
    const [ex, ey] = ellipse ? ellipse[i] : [1, 1];
    // Taper contributes a slight forward tilt to the normal.
    const dr = i < n - 1 ? (radii[i] - radii[i + 1]) / Math.max(1e-3, points[i].distanceTo(points[i + 1])) : 0;
    writeRing(i, points[i], normals[i], binormals[i], tangents[i], radii[i], ex, ey, arc[i] / vScale, dr * 0.5);
  }
  if (capEnd) {
    const last = n - 1;
    for (let c = 1; c <= capRings; c++) {
      const t = c / capRings;
      const ang = t * Math.PI * 0.5;
      const center = points[last].clone().addScaledVector(tangents[last], Math.sin(ang) * radii[last] * 0.8);
      const [ex, ey] = ellipse ? ellipse[last] : [1, 1];
      writeRing(n - 1 + c, center, normals[last], binormals[last], tangents[last], radii[last] * Math.cos(ang) + 1e-3, ex, ey, arc[last] / vScale + t * 0.2, Math.sin(ang) * 2.5);
    }
  }

  const idx: number[] = [];
  for (let i = 0; i < total - 1; i++) {
    for (let j = 0; j < rs; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

/** Smooth a polyline into `segments` points with a centripetal Catmull-Rom spline. */
export function resampleCurve(control: THREE.Vector3[], segments: number) {
  const curve = new THREE.CatmullRomCurve3(control, false, "centripetal");
  return curve.getSpacedPoints(segments);
}

/** Merge geometries that share the same attribute layout into one. */
export function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const attrs = Object.keys(geos[0].attributes);
  const out = new THREE.BufferGeometry();
  let vertexOffset = 0;
  const index: number[] = [];
  const data: Record<string, number[]> = {};
  for (const a of attrs) data[a] = [];
  for (const g of geos) {
    for (const a of attrs) {
      const attr = g.getAttribute(a) as THREE.BufferAttribute;
      const arr = attr.array as ArrayLike<number>;
      for (let i = 0; i < arr.length; i++) data[a].push(arr[i]);
    }
    const gi = g.getIndex();
    const count = g.getAttribute("position").count;
    if (gi) for (let i = 0; i < gi.count; i++) index.push(gi.getX(i) + vertexOffset);
    else for (let i = 0; i < count; i++) index.push(i + vertexOffset);
    vertexOffset += count;
  }
  for (const a of attrs) {
    const itemSize = (geos[0].getAttribute(a) as THREE.BufferAttribute).itemSize;
    out.setAttribute(a, new THREE.Float32BufferAttribute(data[a], itemSize));
  }
  out.setIndex(vertexOffset > 65535 ? new THREE.Uint32BufferAttribute(index, 1) : new THREE.Uint16BufferAttribute(index, 1));
  return out;
}

/**
 * Leaf mass: many small cards scattered through a unit sphere, denser towards
 * its surface, so a crown assembled from these reads as a continuous volume
 * of foliage rather than as individual flat cards. Normals blend each card's
 * own facing with the outward direction from the mass centre, and positions
 * stay inside the unit sphere so `length(position)` doubles as a depth cue.
 */
export function buildLeafMass(cards = 30, seed = 3, cardSize = 0.3): THREE.BufferGeometry {
  const rng = createRng(seed);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const dir = new THREE.Vector3();
  const center = new THREE.Vector3();
  const v = new THREE.Vector3();
  const cn = new THREE.Vector3();
  for (let c = 0; c < cards; c++) {
    // Uniform direction, radius biased outwards (the visible skin carries most cards).
    const u = rng() * 2 - 1;
    const a = rng() * Math.PI * 2;
    const ring = Math.sqrt(1 - u * u);
    dir.set(Math.cos(a) * ring, u, Math.sin(a) * ring);
    center.copy(dir).multiplyScalar(0.3 + 0.62 * Math.sqrt(rng()));
    center.y *= 0.82;
    e.set(rng() * Math.PI, rng() * Math.PI * 2, rng() * Math.PI);
    q.setFromEuler(e);
    cn.set(0, 0, 1).applyQuaternion(q);
    const size = cardSize * (0.8 + rng() * 0.45);
    // Each card a little lighter or darker, warmer or cooler than its neighbours.
    const value = 0.72 + rng() * 0.4;
    const warm = rng() * 0.12;
    const base = positions.length / 3;
    for (const [cx, cy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      v.set(cx * size, cy * size, 0).applyQuaternion(q).add(center);
      positions.push(v.x, v.y, v.z);
      const outward = v.clone().normalize();
      const n = outward.multiplyScalar(0.78).addScaledVector(cn, Math.sign(cn.dot(outward) || 1) * 0.22).normalize();
      normals.push(n.x, n.y, n.z);
      uvs.push((cx + 1) / 2, (cy + 1) / 2);
      colors.push(value, value * (1 - warm * 0.5), value * (1 - warm));
    }
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  return geo;
}
