import * as THREE from "three";
import { PATH_CURVE, PATH_HALF_WIDTH, TREE, TREE_ENTRANCE_ANGLE, WAYSTONES, terrainHeight, waystonePosition } from "./layout";
import { ARCHIVE, HALL_CENTER, hallAxis } from "./archive";
import { createRng, range } from "./noise";
import { HALL_FLOOR, cavityAt, spine } from "./tree";

/**
 * The root network — the site's one "technological" element (docs/ART_DIRECTION.md).
 * Threads of signal light run through the soil along the trail, converge on
 * the World Tree's entrance and, inside, form a star around the heart node:
 * one link to every relic. Every thread is a polyline whose direction is the
 * direction its pulses travel (towards the tree; out from the heart).
 */

export interface Thread {
  points: THREE.Vector3[];
  radius: number;
  /** Which group the thread belongs to (inside threads light up per relic). */
  group: "outside" | "entrance" | "hall" | "chimney";
  /** For hall threads: the relic index it feeds. */
  relic?: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const onGround = (x: number, z: number, lift = 0.06) => V(x, terrainHeight(x, z) + lift, z);

/** A point on the entrance axis `r` units from the trunk axis. */
function portal(r: number, side = 0, y?: number) {
  const a = TREE_ENTRANCE_ANGLE;
  const sp = spine(0);
  const x = TREE.x + sp.x + Math.cos(a) * r - Math.sin(a) * side;
  const z = TREE.z + sp.y + Math.sin(a) * r + Math.cos(a) * side;
  return y === undefined ? onGround(x, z) : V(x, y, z);
}

export function buildThreads(): Thread[] {
  const rng = createRng(6161);
  const threads: Thread[] = [];

  // Two strands braided along the trail, from just past the camp to the clearing.
  for (const phase of [0, Math.PI]) {
    const pts: THREE.Vector3[] = [];
    for (let t = 0.07; t <= 0.985; t += 0.0025) {
      const p = PATH_CURVE.getPointAt(t);
      const tan = PATH_CURVE.getTangentAt(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x);
      const off = (PATH_HALF_WIDTH + 1.1) * (phase === 0 ? 1 : -1) + Math.sin(t * 140 + phase) * 0.7;
      pts.push(onGround(p.x + side.x * off, p.z + side.z * off));
    }
    // Into the entrance.
    for (const r of [52, 40, 30, 22, 14]) pts.push(portal(r, phase === 0 ? 2.2 : -2.2));
    threads.push({ points: pts, radius: 0.07, group: "outside" });
  }

  // A short link from every waystone into the braid.
  WAYSTONES.forEach((w, i) => {
    const stone = waystonePosition(i);
    const p = PATH_CURVE.getPointAt(w.t + 0.004);
    const tan = PATH_CURVE.getTangentAt(w.t + 0.004);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).multiplyScalar(w.side * (PATH_HALF_WIDTH + 1.1));
    const a = onGround(stone.x, stone.z, 0.12);
    const b = onGround(p.x + side.x, p.z + side.z);
    const mid = a.clone().lerp(b, 0.5);
    threads.push({ points: [a, onGround(mid.x + 0.6, mid.z), b], radius: 0.06, group: "outside" });
  });

  // Roots of light radiating from the base of the World Tree across the clearing.
  for (let k = 0; k < 14; k++) {
    const a0 = (k / 14) * Math.PI * 2 + range(rng, -0.15, 0.15);
    if (Math.abs(((a0 - TREE_ENTRANCE_ANGLE + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.35) continue;
    const reach = range(rng, 120, 210);
    const pts: THREE.Vector3[] = [];
    const steps = 40;
    for (let s = steps; s >= 0; s--) {
      const f = s / steps;
      const r = 58 + f * reach;
      const a = a0 + Math.sin(f * 5 + k) * 0.08 + f * f * 0.25 * Math.sin(k * 2.1);
      pts.push(onGround(TREE.x + Math.cos(a) * r, TREE.z + Math.sin(a) * r));
    }
    threads.push({ points: pts, radius: 0.09, group: "entrance" });
  }

  // Inside: a star from the heart to every relic's plinth.
  ARCHIVE.forEach((a, i) => {
    const heart = HALL_CENTER.clone().add(V(0, 0.42, 0));
    const end = a.base.clone().setY(a.base.y - 1.2);
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 24; s++) {
      const f = s / 24;
      const p = heart.clone().lerp(end, f);
      // A gentle S-curve across the floor, lying on it.
      const side = new THREE.Vector3(-(end.z - heart.z), 0, end.x - heart.x).normalize();
      p.addScaledVector(side, Math.sin(f * Math.PI * 2) * 0.9);
      p.y = HALL_CENTER.y + 0.42 + Math.sin(f * Math.PI) * 0.05 + f * (end.y - HALL_CENTER.y - 0.42);
      pts.push(p);
    }
    threads.push({ points: pts, radius: 0.08, group: "hall", relic: i });
  });

  // Up the hollow: a few threads climb the wall towards the rings and the crown.
  for (let k = 0; k < 5; k++) {
    const th = TREE_ENTRANCE_ANGLE + 0.9 + k * 1.2;
    const pts: THREE.Vector3[] = [];
    for (let y = HALL_FLOOR + 1; y < 330; y += 6) {
      const c = cavityAt(y);
      const a = th + Math.sin(y * 0.02 + k) * 0.25;
      const r = c.radius - 0.6;
      const ax = hallAxis(y);
      pts.push(V(ax.x + Math.cos(a) * r, ax.y, ax.z + Math.sin(a) * r));
    }
    threads.push({ points: pts, radius: 0.1, group: "chimney" });
  }
  return threads;
}

/** Tube geometry for threads: uv.x = arc length / 30 (pulse spacing), `aSeed` per thread. */
export function threadGeometry(threads: Thread[], radialSegments = 5) {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const seed: number[] = [];
  const index: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const v = new THREE.Vector3();
  threads.forEach((th, ti) => {
    const pts = th.points;
    const s0 = ti * 0.618;
    let arc = 0;
    const base = pos.length / 3;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) arc += pts[i].distanceTo(pts[i - 1]);
      t.subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize();
      n.crossVectors(t, up);
      if (n.lengthSq() < 1e-6) n.set(1, 0, 0);
      n.normalize();
      b.crossVectors(t, n).normalize();
      // Taper at both ends.
      const f = i / (pts.length - 1);
      const r = th.radius * Math.min(1, f * 12, (1 - f) * 12 + 0.25);
      for (let k = 0; k < radialSegments; k++) {
        const a = (k / radialSegments) * Math.PI * 2;
        v.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(b, Math.sin(a));
        pos.push(pts[i].x + v.x * r, pts[i].y + v.y * r, pts[i].z + v.z * r);
        nor.push(v.x, v.y, v.z);
        uv.push(arc / 30, k / radialSegments);
        seed.push(s0);
      }
    }
    for (let i = 0; i < pts.length - 1; i++)
      for (let k = 0; k < radialSegments; k++) {
        const a = base + i * radialSegments + k;
        const c = base + i * radialSegments + ((k + 1) % radialSegments);
        index.push(a, a + radialSegments, c, c, a + radialSegments, c + radialSegments);
      }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
  g.setIndex(index);
  g.computeBoundingSphere();
  return g;
}
