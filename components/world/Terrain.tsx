"use client";

import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useWorldResources } from "./WorldResources";
import { createRockMaterial, createTerrainMaterial } from "@/lib/world/materials";
import {
  CAMP,
  CAMP_RADIUS,
  RIVER_CURVE,
  TREE,
  WATERFALL,
  isReserved,
  lakeDistance,
  plateauSigned,
  riverHalfWidth,
  riverInfo,
  terrainHeight,
  terrainNormal,
} from "@/lib/world/layout";
import { buildRock } from "@/lib/world/geometry";
import { buildCliff } from "@/lib/world/cliff";
import { createRng, range, smoothstep } from "@/lib/world/noise";

/**
 * Ground for the whole world: one heightfield mesh on a graded grid (dense
 * along the journey corridor, coarse towards the horizon — no cracks), the
 * stratified cliff face of the waterfall plateau, and instanced boulders.
 */

/** Axis coordinates: fine spacing inside [a, b], growing geometrically outside. */
function gradedAxis(a: number, b: number, step: number, min: number, max: number, growth = 1.085, cap = 28) {
  const core: number[] = [];
  for (let x = a; x <= b + 1e-6; x += step) core.push(x);
  const lo: number[] = [];
  let s = step;
  let x = a;
  while (x > min) {
    s = Math.min(s * growth, cap);
    x = Math.max(min, x - s);
    lo.unshift(x);
  }
  const hi: number[] = [];
  s = step;
  x = core[core.length - 1];
  while (x < max) {
    s = Math.min(s * growth, cap);
    x = Math.min(max, x + s);
    hi.push(x);
  }
  return [...lo, ...core, ...hi];
}

function buildTerrainGeometry() {
  const xs = gradedAxis(-115, 95, 1.5, -620, 620);
  // Fine near the camp and falls, a little coarser down the long valley, coarse beyond.
  const near = gradedAxis(-480, 40, 1.5, -480, 300);
  const far = gradedAxis(-1020, -480 - 2.4, 2.4, -1700, -480 - 2.4);
  const zs = [...far, ...near].sort((a, b) => a - b).filter((z, i, arr) => i === 0 || z - arr[i - 1] > 0.5);
  const nx = xs.length;
  const nz = zs.length;
  const count = nx * nz;
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const mask = new Float32Array(count * 4);

  for (let j = 0; j < nz; j++) {
    const z = zs[j];
    for (let i = 0; i < nx; i++) {
      const x = xs[i];
      const k = j * nx + i;
      const h = terrainHeight(x, z);
      pos[k * 3] = x;
      pos[k * 3 + 1] = h;
      pos[k * 3 + 2] = z;
      uv[k * 2] = x / 7;
      uv[k * 2 + 1] = z / 7;

      // Masks only matter near the journey; skip the work far away.
      if (Math.abs(x) > 260 || z < -1080 || z > 60) continue;
      const camp = Math.hypot(x - CAMP.x, z - CAMP.z);
      let dirt = 1 - smoothstep(CAMP_RADIUS - 6, CAMP_RADIUS + 1, camp);
      // Worn path from the camp towards the river and down the valley.
      const pathX = 3 + 6 * Math.sin(z * 0.03);
      if (z < -10 && z > -790) dirt = Math.max(dirt, (1 - smoothstep(1.2, 3.4, Math.abs(x - pathX))) * 0.6);
      const r = riverInfo(x, z);
      const lake = lakeDistance(x, z);
      const wet = Math.max(1 - smoothstep(riverHalfWidth(r.t) + 0.3, riverHalfWidth(r.t) + 3.5, r.dist), 1 - smoothstep(1.0, 1.22, lake));
      const treeD = Math.hypot(x - TREE.x, z - TREE.z);
      const humus = 1 - smoothstep(70, 190, treeD);
      const pool = Math.hypot(x - WATERFALL.pool.x, z - WATERFALL.pool.z);
      const rocky = Math.max(1 - smoothstep(WATERFALL.poolRadius + 1, WATERFALL.poolRadius + 7, pool), smoothstep(-5, -1, plateauSigned(x, z)) * 0.8);
      mask[k * 4] = dirt;
      mask[k * 4 + 1] = Math.max(wet, 1 - smoothstep(WATERFALL.poolRadius - 0.5, WATERFALL.poolRadius + 2, pool));
      mask[k * 4 + 2] = humus;
      mask[k * 4 + 3] = rocky * 0.7;
    }
  }

  const index = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let p = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      // Alternate the diagonal on steep cells to follow the slope better.
      if ((i + j) % 2 === 0) {
        index[p++] = a;
        index[p++] = c;
        index[p++] = b;
        index[p++] = b;
        index[p++] = c;
        index[p++] = d;
      } else {
        index[p++] = a;
        index[p++] = c;
        index[p++] = d;
        index[p++] = a;
        index[p++] = d;
        index[p++] = b;
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("aMask", new THREE.BufferAttribute(mask, 4));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

// ─── Rocks ────────────────────────────────────────────────────────────────────

interface RockPlacement {
  variant: number;
  matrix: THREE.Matrix4;
}

const ROCK_VARIANTS = 4;

function placeRocks(talus: { x: number; z: number; size: number }[]): RockPlacement[] {
  const rng = createRng(7171);
  const out: RockPlacement[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const n = new THREE.Vector3();
  const add = (x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw: number, tilt = 0.15) => {
    e.set(range(rng, -tilt, tilt), yaw, range(rng, -tilt, tilt));
    q.setFromEuler(e);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
    out.push({ variant: Math.floor(rng() * ROCK_VARIANTS), matrix: m });
  };

  // Blocks fallen from the cliff, half-buried at its foot.
  for (const t of talus) {
    if (Math.hypot(t.x - WATERFALL.pool.x, t.z - WATERFALL.pool.z) < WATERFALL.poolRadius + 1.5) continue;
    const r = riverInfo(t.x, t.z);
    if (r.dist < riverHalfWidth(r.t) + 0.5) continue;
    const s3 = t.size;
    add(t.x, terrainHeight(t.x, t.z) - s3 * 0.22, t.z, s3 * range(rng, 1.0, 1.5), s3 * range(rng, 0.6, 0.95), s3 * range(rng, 0.9, 1.3), range(rng, 0, 6.28), 0.3);
  }

  // Boulders around the plunge pool and along the river banks.
  for (let i = 0; i < 14; i++) {
    const a = range(rng, 0, Math.PI * 2);
    const d = WATERFALL.poolRadius + range(rng, 0.2, 3.2);
    const x = WATERFALL.pool.x + Math.cos(a) * d;
    const z = WATERFALL.pool.z + Math.sin(a) * d;
    if (plateauSigned(x, z) > -3) continue;
    const s3 = range(rng, 0.9, 2.4);
    add(x, terrainHeight(x, z) + s3 * 0.15, z, s3 * 1.2, s3 * 0.8, s3, range(rng, 0, 6.28));
  }
  for (let i = 0; i < 34; i++) {
    const t = range(rng, 0.04, 0.96);
    const c = riverPoint(t);
    const side = rng() < 0.5 ? -1 : 1;
    const off = riverHalfWidth(t) + range(rng, -0.6, 1.8);
    const x = c.x + c.nx * off * side;
    const z = c.z + c.nz * off * side;
    const s3 = range(rng, 0.45, 1.5);
    add(x, terrainHeight(x, z) + s3 * 0.1, z, s3 * 1.3, s3 * 0.7, s3, range(rng, 0, 6.28));
  }
  // A few stones on the lake shore near the camp.
  for (let i = 0; i < 12; i++) {
    const a = range(rng, -0.4, 2.2);
    const x = -17 + Math.cos(a) * 21 * range(rng, 0.95, 1.12);
    const z = -31 + Math.sin(a) * 14 * range(rng, 0.95, 1.12);
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP_RADIUS + 2) continue;
    const s3 = range(rng, 0.35, 1.1);
    add(x, terrainHeight(x, z) + s3 * 0.1, z, s3 * 1.2, s3 * 0.75, s3, range(rng, 0, 6.28));
  }
  // Scattered valley boulders, half-buried, avoiding reserved areas.
  for (let i = 0; i < 70; i++) {
    const z = range(rng, -770, -60);
    const x = range(rng, -110, 110);
    if (isReserved(x, z, 2) || Math.abs(x - (3 + 6 * Math.sin(z * 0.03))) < 8) continue;
    terrainNormal(x, z, n);
    const s3 = range(rng, 0.8, 3.6);
    add(x, terrainHeight(x, z) - s3 * 0.15, z, s3 * range(rng, 1, 1.6), s3 * range(rng, 0.6, 0.9), s3, range(rng, 0, 6.28));
  }
  return out;
}

/** Point on the river centreline and its horizontal normal. */
function riverPoint(t: number) {
  const p = RIVER_CURVE.getPointAt(t);
  const tan = RIVER_CURVE.getTangentAt(t);
  const nx = -tan.z;
  const nz = tan.x;
  const l = Math.hypot(nx, nz) || 1;
  return { x: p.x, z: p.z, nx: nx / l, nz: nz / l };
}

function Rocks() {
  const { textures } = useWorldResources();
  const { geometries, material, groups, cliff } = useMemo(() => {
    const geometries = Array.from({ length: ROCK_VARIANTS }, (_, i) => buildRock(101 + i * 17, 4, 0.7 + (i % 2) * 0.12));
    const material = createRockMaterial(textures, { mossAmount: 0.75 });
    const cliff = buildCliff();
    const placements = placeRocks(cliff.talus);
    const groups = geometries.map((_, v) => placements.filter((p) => p.variant === v).map((p) => p.matrix));
    return { geometries, material, groups, cliff: cliff.geometry };
  }, [textures]);

  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      cliff.dispose();
      material.dispose();
    },
    [geometries, cliff, material]
  );

  return (
    <>
      <mesh geometry={cliff} material={material} castShadow receiveShadow />
      {groups.map((mats, v) =>
        mats.length ? (
          <instancedMesh
            key={v}
            args={[geometries[v], material, mats.length]}
            castShadow
            receiveShadow
            ref={(mesh) => {
              if (!mesh) return;
              mats.forEach((m, i) => mesh.setMatrixAt(i, m));
              mesh.instanceMatrix.needsUpdate = true;
              mesh.computeBoundingSphere();
            }}
          />
        ) : null
      )}
    </>
  );
}

export function Terrain() {
  const { textures } = useWorldResources();
  const geometry = useMemo(() => buildTerrainGeometry(), []);
  const material = useMemo(() => createTerrainMaterial(textures), [textures]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  return (
    <>
      <mesh geometry={geometry} material={material} receiveShadow />
      <Rocks />
    </>
  );
}
