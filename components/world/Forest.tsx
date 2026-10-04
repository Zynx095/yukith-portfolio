"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useWorldResources } from "./WorldResources";
import { generateForestVariants, placeForest } from "@/lib/world/flora";
import { buildFoliageClump } from "@/lib/world/geometry";
import { createBarkMaterial, createFoliageDepthMaterial, createFoliageMaterial } from "@/lib/world/materials";
import { createRng } from "@/lib/world/noise";
import type { QualitySettings } from "@/lib/world/quality";

const LEAF_TINTS = ["#5d7a35", "#6f8a3c", "#4f6b2e", "#7c9443", "#567238", "#86993f"];
const NEEDLE_TINTS = ["#3f5a35", "#4a6638", "#36502f", "#52703d"];

/** The valley forest: five instanced tree variants and one instanced canopy. */
export function Forest({ quality }: { quality: QualitySettings }) {
  const { textures } = useWorldResources();
  const variants = useMemo(() => generateForestVariants(), []);
  const trees = useMemo(() => placeForest(36), []);
  const clump = useMemo(() => buildFoliageClump(10, 9), []);

  const materials = useMemo(
    () => ({
      bark: createBarkMaterial(textures, {
        deep: "#2b241d",
        mid: "#5a4c3d",
        ridge: "#8a7c68",
        moss: "#4d5e2b",
        mossAmount: 0.55,
        ground: -20,
        normalScale: 1.0,
      }),
      leaves: createFoliageMaterial(textures, { perInstanceCell: true, wind: 0.16, translucency: 0.6 }),
      leavesDepth: createFoliageDepthMaterial(textures, { perInstanceCell: true, wind: 0.16 }),
    }),
    [textures]
  );

  // Instance matrices for each variant's wood.
  const wood = useMemo(
    () =>
      variants.map((_, v) =>
        trees
          .filter((t) => t.variant === v)
          .map((t) => new THREE.Matrix4().compose(t.position, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rotation), new THREE.Vector3(t.scale, t.scale, t.scale)))
      ),
    [variants, trees]
  );

  // Every clump of every tree in one instanced draw.
  const canopy = useMemo(() => {
    const rng = createRng(919);
    const matrices: THREE.Matrix4[] = [];
    const cells: number[] = [];
    const colors: THREE.Color[] = [];
    for (const t of trees) {
      const tm = new THREE.Matrix4().compose(t.position, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rotation), new THREE.Vector3(t.scale, t.scale, t.scale));
      for (const c of variants[t.variant].clumps) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6));
        const m = new THREE.Matrix4().compose(c.position, q, c.scale.clone().multiplyScalar(0.5));
        matrices.push(tm.clone().multiply(m));
        cells.push(c.cell);
        const palette = c.cell === 2 ? NEEDLE_TINTS : LEAF_TINTS;
        colors.push(new THREE.Color(palette[Math.floor((t.tint * 0.6 + rng() * 0.4) * palette.length) % palette.length]));
      }
    }
    return { matrices, cells, colors };
  }, [trees, variants]);

  const canopyRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = canopyRef.current;
    if (!mesh) return;
    canopy.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    canopy.colors.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.geometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(new Float32Array(canopy.cells), 1));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = Math.floor(canopy.matrices.length * quality.foliage);
    mesh.computeBoundingSphere();
  }, [canopy, quality.foliage]);

  useEffect(
    () => () => {
      variants.forEach((v) => v.wood.dispose());
      clump.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
    [variants, clump, materials]
  );

  return (
    <group>
      {variants.map((v, i) =>
        wood[i].length ? (
          <instancedMesh
            key={i}
            args={[v.wood, materials.bark, wood[i].length]}
            castShadow
            receiveShadow
            ref={(mesh) => {
              if (!mesh) return;
              wood[i].forEach((m, k) => mesh.setMatrixAt(k, m));
              mesh.instanceMatrix.needsUpdate = true;
              mesh.computeBoundingSphere();
            }}
          />
        ) : null
      )}
      <instancedMesh ref={canopyRef} args={[clump, materials.leaves, canopy.matrices.length]} customDepthMaterial={materials.leavesDepth} castShadow receiveShadow />
    </group>
  );
}
