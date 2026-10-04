import * as THREE from "three";
import { SimplexNoise, createRng, lerp, range } from "./noise";
import { buildTube, mergeGeometries, resampleCurve } from "./geometry";
import { CAMP, isReserved, terrainHeight } from "./layout";

/**
 * Ordinary trees for the valley — deliberately few (≈36) and much smaller
 * than the World Tree. Five generated variants (three broadleaf, two
 * conifer), each instanced with its own rotation, scale and tint.
 */

const N = new SimplexNoise(4545);

export interface Clump {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  cell: number;
}

export interface TreeVariant {
  kind: "broad" | "conifer";
  wood: THREE.BufferGeometry;
  clumps: Clump[];
}

function branch(start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, rng: () => number, droop: number, segs = 5) {
  const pts: THREE.Vector3[] = [start.clone()];
  const d = dir.clone().normalize();
  const p = start.clone();
  for (let s = 1; s <= segs; s++) {
    d.y -= droop * (s / segs);
    d.x += range(rng, -0.12, 0.12);
    d.z += range(rng, -0.12, 0.12);
    d.normalize();
    p.addScaledVector(d, length / segs);
    pts.push(p.clone());
  }
  const curve = resampleCurve(pts, segs * 3);
  const radii = curve.map((_, i) => lerp(radius, radius * 0.18, i / (curve.length - 1)));
  return { pts: curve, radii };
}

export function generateBroadleaf(seed: number): TreeVariant {
  const rng = createRng(seed);
  const height = range(rng, 15, 21);
  const geos: THREE.BufferGeometry[] = [];
  const clumps: Clump[] = [];
  const lean = new THREE.Vector3(range(rng, -0.12, 0.12), 1, range(rng, -0.12, 0.12)).normalize();
  const trunkTop = lean.clone().multiplyScalar(height * 0.48);
  const trunkPts = resampleCurve(
    [new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, height * 0.18, 0).addScaledVector(lean, 0.3), trunkTop.clone().add(new THREE.Vector3(range(rng, -0.4, 0.4), 0, range(rng, -0.4, 0.4)))],
    18
  );
  const r0 = height * 0.038;
  geos.push(
    buildTube({ points: trunkPts, radii: trunkPts.map((_, i) => lerp(r0 * 1.35, r0 * 0.62, i / (trunkPts.length - 1))), radialSegments: 10, bumpiness: 0.1, noise: N, vScale: 3, uRepeats: 2 })
  );
  const primaries = 5 + Math.floor(rng() * 2);
  for (let b = 0; b < primaries; b++) {
    const t = lerp(0.55, 1, b / primaries);
    const i = Math.floor(t * (trunkPts.length - 1));
    const start = trunkPts[i];
    const a = (b / primaries) * Math.PI * 2 + range(rng, -0.4, 0.4);
    const up = range(rng, 0.5, 1.1);
    const dir = new THREE.Vector3(Math.cos(a), up, Math.sin(a));
    const len = height * range(rng, 0.32, 0.46);
    const br = branch(start, dir, len, r0 * 0.62, rng, 0.25);
    geos.push(buildTube({ points: br.pts, radii: br.radii, radialSegments: 7, bumpiness: 0.06, noise: N, vScale: 3, uRepeats: 1 }));
    for (let c = 0; c < 3; c++) {
      const ci = Math.floor(lerp(0.45, 0.95, c / 2) * (br.pts.length - 1));
      const cs = br.pts[ci];
      const cdir = new THREE.Vector3(Math.cos(a + range(rng, -1, 1)), range(rng, 0.3, 0.9), Math.sin(a + range(rng, -1, 1)));
      const sub = branch(cs, cdir, len * range(rng, 0.35, 0.55), br.radii[ci] * 0.55, rng, 0.2, 3);
      geos.push(buildTube({ points: sub.pts, radii: sub.radii, radialSegments: 5, vScale: 3, uRepeats: 1 }));
      const tip = sub.pts[sub.pts.length - 1];
      const s = range(rng, 2.6, 3.8);
      clumps.push({ position: tip.clone(), scale: new THREE.Vector3(s, s * 0.85, s), cell: rng() < 0.5 ? 0 : 1 });
    }
    const tip = br.pts[br.pts.length - 1];
    const s = range(rng, 3.2, 4.4);
    clumps.push({ position: tip.clone().add(new THREE.Vector3(0, 0.6, 0)), scale: new THREE.Vector3(s, s * 0.85, s), cell: rng() < 0.5 ? 0 : 1 });
  }
  // A crown core so the canopy reads as one mass, not floating puffs.
  const core = trunkTop.clone().add(new THREE.Vector3(0, height * 0.18, 0));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + rng();
    const s = range(rng, 3.4, 4.6);
    clumps.push({
      position: core.clone().add(new THREE.Vector3(Math.cos(a) * height * 0.12, range(rng, -0.5, 1.5), Math.sin(a) * height * 0.12)),
      scale: new THREE.Vector3(s, s * 0.8, s),
      cell: k % 2,
    });
  }
  return { kind: "broad", wood: mergeGeometries(geos), clumps };
}

export function generateConifer(seed: number): TreeVariant {
  const rng = createRng(seed);
  const height = range(rng, 20, 28);
  const geos: THREE.BufferGeometry[] = [];
  const clumps: Clump[] = [];
  const trunkPts = resampleCurve([new THREE.Vector3(0, -1, 0), new THREE.Vector3(range(rng, -0.3, 0.3), height * 0.5, range(rng, -0.3, 0.3)), new THREE.Vector3(0, height, 0)], 22);
  const r0 = height * 0.024;
  geos.push(buildTube({ points: trunkPts, radii: trunkPts.map((_, i) => lerp(r0 * 1.3, 0.05, i / (trunkPts.length - 1))), radialSegments: 9, bumpiness: 0.06, noise: N, vScale: 3, uRepeats: 2 }));
  const whorls = 9;
  for (let w = 0; w < whorls; w++) {
    const t = lerp(0.22, 0.95, w / (whorls - 1));
    const y = height * t;
    const reach = (1 - t) * height * 0.32 + 0.8;
    const count = 4 + Math.floor(rng() * 2);
    for (let b = 0; b < count; b++) {
      const a = (b / count) * Math.PI * 2 + w * 0.7 + range(rng, -0.2, 0.2);
      const start = new THREE.Vector3(0, y, 0);
      const dir = new THREE.Vector3(Math.cos(a), -0.08, Math.sin(a));
      const br = branch(start, dir, reach, r0 * 0.4 * (1 - t * 0.6) + 0.04, rng, 0.35, 3);
      geos.push(buildTube({ points: br.pts, radii: br.radii, radialSegments: 4, vScale: 3, uRepeats: 1 }));
      for (let c = 0; c < 2; c++) {
        const ci = Math.floor(lerp(0.4, 1, c) * (br.pts.length - 1));
        const s = reach * range(rng, 0.55, 0.75) + 0.6;
        clumps.push({ position: br.pts[ci].clone(), scale: new THREE.Vector3(s, s * 0.42, s), cell: 2 });
      }
    }
  }
  clumps.push({ position: new THREE.Vector3(0, height * 0.98, 0), scale: new THREE.Vector3(1.1, 1.6, 1.1), cell: 2 });
  return { kind: "conifer", wood: mergeGeometries(geos), clumps };
}

export interface TreeInstance {
  variant: number;
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  tint: number;
}

/** Deterministic placement along the valley sides, clear of the path, camp, water and the World Tree clearing. */
export function placeForest(count = 36): TreeInstance[] {
  const rng = createRng(8383);
  const out: TreeInstance[] = [];
  const pathX = (z: number) => 3 + 6 * Math.sin(z * 0.03);
  let guard = 0;
  while (out.length < count && guard++ < 5000) {
    // Groves: pick a side and a stretch of the valley.
    const z = range(rng, -770, -30);
    const side = rng() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * range(rng, 16, z > -120 ? 70 : 105);
    if (isReserved(x, z, 6)) continue;
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 34) continue;
    // Keep the long view of the World Tree open: no trees in a narrow cone along the path.
    if (Math.abs(x - pathX(z)) < 15) continue;
    if (out.some((t) => Math.hypot(t.position.x - x, t.position.z - z) < 11)) continue;
    const y = terrainHeight(x, z);
    if (y > 30) continue;
    const variant = rng() < 0.62 ? Math.floor(rng() * 3) : 3 + Math.floor(rng() * 2);
    out.push({ variant, position: new THREE.Vector3(x, y, z), rotation: rng() * Math.PI * 2, scale: range(rng, 0.8, 1.25), tint: rng() });
  }
  return out;
}

export function generateForestVariants(): TreeVariant[] {
  return [generateBroadleaf(11), generateBroadleaf(23), generateBroadleaf(37), generateConifer(51), generateConifer(67)];
}
