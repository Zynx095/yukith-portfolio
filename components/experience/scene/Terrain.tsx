"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CLEARING_RADIUS, PATH_HALF_WIDTH, TREE, lakeDistance, pathInfo, riverHalfWidth, riverInfo, terrainHeight, valleyCenter } from "@/lib/world/layout";
import { SimplexNoise, smoothstep } from "@/lib/world/noise";
import { createGroundMaterial } from "@/lib/world/materials";
import { useWorld } from "./WorldContext";

/**
 * Ground for the whole world: one heightfield on a graded grid — 2.5 m cells
 * along the journey corridor, growing towards the horizon (one mesh, so there
 * are no cracks). Per-vertex masks drive the splat material.
 */

const TILE = 3.2; // metres per grass texture tile

function axis(denseMin: number, denseMax: number, step: number, outerMin: number, outerMax: number, grow: number, cap: number) {
  const out: number[] = [];
  for (let v = denseMin; v <= denseMax + 1e-6; v += step) out.push(v);
  let s = step;
  let v = denseMax;
  while (v < outerMax) {
    s = Math.min(s * grow, cap);
    v += s;
    out.push(Math.min(v, outerMax));
  }
  s = step;
  v = denseMin;
  const low: number[] = [];
  while (v > outerMin) {
    s = Math.min(s * grow, cap);
    v -= s;
    low.push(Math.max(v, outerMin));
  }
  return [...low.reverse(), ...out];
}

function buildTerrain(step = 2.5) {
  const xs = axis(-200, 230, step, -2600, 2600, 1.1, 34);
  const zs = axis(-1060, 100, step, -3000, 900, 1.1, 34);
  const cols = xs.length;
  const rows = zs.length;
  const n = cols * rows;
  const pos = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const mask = new Float32Array(n * 4);
  const noise = new SimplexNoise(77);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const x = xs[i];
      const z = zs[j];
      const h = terrainHeight(x, z);
      pos[k * 3] = x;
      pos[k * 3 + 1] = h;
      pos[k * 3 + 2] = z;
      uv[k * 2] = x / TILE;
      uv[k * 2 + 1] = z / TILE;

      // Litter: under the World Tree's crown, on the wooded valley sides, in patches.
      const td = Math.hypot(x - TREE.x, z - TREE.z);
      const patch = noise.fbm2(x * 0.02, z * 0.02, 3);
      const side = smoothstep(60, 140, Math.abs(x - valleyCenter(z)) - 40);
      let litter = Math.max(1 - smoothstep(CLEARING_RADIUS * 0.55, CLEARING_RADIUS + 40, td), side * 0.35);
      litter = Math.min(1, Math.max(litter, smoothstep(0.35, 0.75, patch) * 0.6));
      // Trail.
      const p = pathInfo(x, z);
      const trail = 1 - smoothstep(PATH_HALF_WIDTH - 0.4, PATH_HALF_WIDTH + 1.1 + patch * 0.6, p.dist);
      // Wet earth by the water.
      const r = riverInfo(x, z);
      let wet = r.dist < 30 ? 1 - smoothstep(riverHalfWidth(r.t) - 0.5, riverHalfWidth(r.t) + 1.8, r.dist) : 0;
      wet = Math.max(wet, 1 - smoothstep(0.98, 1.12, lakeDistance(x, z)));
      mask[k * 4] = litter;
      mask[k * 4 + 1] = trail;
      mask[k * 4 + 3] = wet;
    }
  }

  const index: number[] = [];
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      // Alternate the diagonal so long ridges don't zigzag.
      if ((i + j) % 2 === 0) index.push(a, c, b, b, c, d);
      else index.push(a, c, d, a, d, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(index, 1) : new THREE.Uint16BufferAttribute(index, 1));
  geo.computeVertexNormals();
  // Rock where the ground is steep (needs the normals).
  const nor = geo.getAttribute("normal") as THREE.BufferAttribute;
  for (let k = 0; k < n; k++) mask[k * 4 + 2] = Math.max(smoothstep(0.86, 0.66, nor.getY(k)), smoothstep(80, 190, pos[k * 3 + 1]));
  geo.setAttribute("aMask", new THREE.BufferAttribute(mask, 4));
  geo.computeBoundingSphere();
  return geo;
}

/**
 * The heightfield is pure CPU work: build it once per resolution for the visit.
 * Unmounting releases its GPU buffers (dispose); a later mount re-uploads them.
 */
const terrainCache = new Map<number, THREE.BufferGeometry>();
const terrainGeometry = (step: number) => {
  let g = terrainCache.get(step);
  if (!g) terrainCache.set(step, (g = buildTerrain(step)));
  return g;
};

export function Terrain() {
  const { assets, quality } = useWorld();
  const geometry = useMemo(() => terrainGeometry(quality.foliage < 0.4 ? 4 : 2.5), [quality.foliage]);
  const material = useMemo(() => createGroundMaterial(assets), [assets]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  return <mesh geometry={geometry} material={material} receiveShadow />;
}
