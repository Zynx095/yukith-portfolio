"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { generateForestVariants, type TreeVariant } from "@/lib/world/flora";
import { CAMP, TREE, isReserved, pathInfo, terrainHeight, valleyCenter } from "@/lib/world/layout";
import { buildLeafMass } from "@/lib/world/geometry";
import { SimplexNoise, createRng, range, smoothstep } from "@/lib/world/noise";
import { createBarkMaterial, createFoliageDepthMaterial, createFoliageMaterial } from "@/lib/world/materials";
import { useWorld } from "./WorldContext";

/**
 * Ordinary trees — groves on the valley sides and the hills, dwarfed by the
 * World Tree. Five generated variants, each drawn as two instanced meshes
 * (wood, foliage), so hundreds of trees cost ten draw calls.
 */

interface Placement {
  variant: number;
  matrix: THREE.Matrix4;
  tint: number;
}

function placeTrees(count: number): Placement[] {
  const rng = createRng(8383);
  const noise = new SimplexNoise(5151);
  const out: Placement[] = [];
  const pts: THREE.Vector2[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 60) {
    const z = range(rng, -980, 220);
    const side = rng() < 0.5 ? -1 : 1;
    const x = valleyCenter(z) + side * range(rng, 30, 520);
    // Groves, not a uniform scatter.
    if (noise.fbm2(x * 0.006, z * 0.006, 3) < -0.05 + rng() * 0.25) continue;
    if (isReserved(x, z, 7)) continue;
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 30) continue;
    if (Math.hypot(x - TREE.x, z - TREE.z) < 240) continue;
    // Keep the views along the trail open.
    if (pathInfo(x, z).dist < 26) continue;
    const y = terrainHeight(x, z);
    if (y > 70) continue;
    if (pts.some((p) => Math.abs(p.x - x) < 9 && Math.abs(p.y - z) < 9)) continue;
    pts.push(new THREE.Vector2(x, z));
    const conifer = smoothstep(10, 45, y) * 0.7 + 0.18 > rng();
    const variant = conifer ? 3 + Math.floor(rng() * 2) : Math.floor(rng() * 3);
    const s = range(rng, 0.75, 1.3) * (1 + smoothstep(120, 400, Math.abs(x - valleyCenter(z))) * 0.25);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y - 0.3, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * Math.PI * 2),
      new THREE.Vector3(s, s * range(rng, 0.92, 1.1), s)
    );
    out.push({ variant, matrix: m, tint: rng() });
  }
  return out;
}

const CELL_UV: [number, number][] = [
  [0, 0.5],
  [0.5, 0.5],
  [0, 0],
  [0.5, 0],
];

function cellMass(cell: number, seed: number) {
  const g = buildLeafMass(cell === 2 ? 10 : 11, seed, 0.5);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  const [u0, v0] = CELL_UV[cell];
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * 0.5, v0 + uv.getY(i) * 0.5);
  return g;
}

interface VariantMeshes {
  wood: THREE.InstancedMesh;
  foliage: THREE.InstancedMesh;
}

function buildVariant(v: TreeVariant, trees: Placement[], wood: THREE.Material, leaves: THREE.Material, depth: THREE.Material, seed: number): VariantMeshes | null {
  if (trees.length === 0) return null;
  const woodMesh = new THREE.InstancedMesh(v.wood, wood, trees.length);
  trees.forEach((t, i) => woodMesh.setMatrixAt(i, t.matrix));
  woodMesh.castShadow = false;
  woodMesh.receiveShadow = true;

  const cell = v.clumps[0]?.cell ?? 0;
  const mass = cellMass(cell, seed);
  const count = trees.length * v.clumps.length;
  const fol = new THREE.InstancedMesh(mass, leaves, count);
  const blob = new Float32Array(count * 3);
  const crown = new THREE.Vector3();
  for (const c of v.clumps) crown.add(c.position);
  crown.divideScalar(Math.max(1, v.clumps.length));
  crown.y *= 0.85;
  const local = new THREE.Matrix4();
  const world = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const n = new THREE.Vector3();
  const col = new THREE.Color();
  const greens = v.kind === "conifer" ? [new THREE.Color("#33472b"), new THREE.Color("#42563a")] : [new THREE.Color("#4a5f2c"), new THREE.Color("#66743a")];
  let k = 0;
  trees.forEach((t) => {
    const rot = new THREE.Quaternion().setFromRotationMatrix(t.matrix);
    v.clumps.forEach((c, ci) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ci * 2.39);
      local.compose(c.position, q, c.scale);
      world.multiplyMatrices(t.matrix, local);
      fol.setMatrixAt(k, world);
      n.copy(c.position).sub(crown).normalize().applyQuaternion(rot);
      blob[k * 3] = n.x;
      blob[k * 3 + 1] = n.y;
      blob[k * 3 + 2] = n.z;
      col.copy(greens[0]).lerp(greens[1], t.tint * 0.8 + (n.y * 0.5 + 0.5) * 0.3);
      fol.setColorAt(k, col);
      k++;
    });
  });
  mass.setAttribute("aBlobN", new THREE.InstancedBufferAttribute(blob, 3));
  fol.customDepthMaterial = depth;
  fol.castShadow = true;
  fol.receiveShadow = true;
  woodMesh.computeBoundingSphere();
  fol.computeBoundingSphere();
  return { wood: woodMesh, foliage: fol };
}

export function Forest() {
  const { assets, leaves, quality } = useWorld();
  const variants = useMemo(() => generateForestVariants(), []);
  const trees = useMemo(() => placeTrees(Math.round(460 * (0.35 + 0.65 * quality.foliage))), [quality.foliage]);
  const mats = useMemo(() => {
    const opts = { sway: 0.35, translucency: 0.8, vertexColors: true, blob: 0.6, alphaTest: 0.42 };
    return {
      wood: createBarkMaterial(assets, { ground: -1000, moss: 0.35, tint: "#c8b7a2" }),
      leaves: createFoliageMaterial(leaves, opts),
      depth: createFoliageDepthMaterial(leaves, opts),
    };
  }, [assets, leaves]);
  const meshes = useMemo(() => {
    // Only trees near the trail can throw a shadow the camera will see; the
    // rest skip the shadow pass (an instanced mesh is culled as a whole).
    const near = (t: Placement) => {
      const p = new THREE.Vector3().setFromMatrixPosition(t.matrix);
      return pathInfo(p.x, p.z).dist < 90 || Math.hypot(p.x - CAMP.x, p.z - CAMP.z) < 90;
    };
    const out: VariantMeshes[] = [];
    variants.forEach((v, i) => {
      for (const cast of [true, false]) {
        const m = buildVariant(v, trees.filter((t) => t.variant === i && near(t) === cast), mats.wood, mats.leaves, mats.depth, 31 + i * 7);
        if (!m) continue;
        m.foliage.castShadow = cast;
        out.push(m);
      }
    });
    return out;
  }, [variants, trees, mats]);
  useEffect(
    () => () => {
      meshes.forEach((m) => {
        m.wood.dispose();
        m.foliage.geometry.dispose();
        m.foliage.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    },
    [meshes, mats]
  );
  return (
    <group>
      {meshes.map((m, i) => (
        <group key={i}>
          <primitive object={m.wood} />
          <primitive object={m.foliage} />
        </group>
      ))}
    </group>
  );
}
