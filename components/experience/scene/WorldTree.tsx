"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { generateWorldTree, buildHallFloor, type WorldTreeData } from "@/lib/world/tree";
import { TREE, TREE_GROUND } from "@/lib/world/layout";
import { buildLeafMass, mergeGeometries } from "@/lib/world/geometry";
import { createRng, range } from "@/lib/world/noise";
import { createBarkMaterial, createFoliageDepthMaterial, createFoliageMaterial, createHeartwoodMaterial } from "@/lib/world/materials";
import { useWorld } from "./WorldContext";

/**
 * The World Tree: a braid of great stems in photo-scanned bark, buttress roots
 * like cliffs, limbs that spread for hundreds of metres, and a crown of
 * thousands of instanced leaf masses shaded as one living volume.
 */

let cached: WorldTreeData | null = null;
const treeData = () => (cached ??= generateWorldTree());

/** Keep only the attributes every bark piece shares, so they merge into one draw call. */
function prepare(g: THREE.BufferGeometry) {
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  const out = new THREE.BufferGeometry();
  for (const a of ["position", "normal", "uv"]) out.setAttribute(a, g.getAttribute(a));
  out.setIndex(g.getIndex());
  return out;
}

interface Canopy {
  geometry: THREE.InstancedBufferGeometry | THREE.BufferGeometry;
  matrices: Float32Array;
  colors: Float32Array;
  blob: Float32Array;
  count: number;
}

/** Leaf masses spread through each canopy anchor's volume, with canopy-scale normals for soft volume shading. */
function buildCanopy(data: WorldTreeData, density: number): Canopy {
  const rng = createRng(4049);
  const mass = buildLeafMass(18, 11, 0.36);
  // Remap the mass's 0..1 UVs onto the atlas's World Tree cell (bottom-right quadrant).
  const uv = mass.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + uv.getX(i) * 0.5, uv.getY(i) * 0.5);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const blobCenter = new THREE.Vector3();
  const n = new THREE.Vector3();
  const col = new THREE.Color();
  const deep = new THREE.Color("#2f4a1e");
  const mid = new THREE.Color("#4f6b27");
  const light = new THREE.Color("#7f8f37");
  const matrices: number[] = [];
  const colors: number[] = [];
  const blob: number[] = [];

  for (const a of data.anchors) {
    const count = Math.max(1, Math.round((a.scale / 5.5) * density));
    blobCenter.copy(a.position).add(new THREE.Vector3(0, -a.scale * 0.32, 0));
    for (let k = 0; k < count; k++) {
      // Points inside a flattened ellipsoid, biased to its upper, outer skin.
      const u = rng() * 2 - 1;
      const th = rng() * Math.PI * 2;
      const ring = Math.sqrt(1 - u * u);
      const rr = a.scale * 0.55 * Math.pow(rng(), 0.45);
      p.set(Math.cos(th) * ring * rr, Math.abs(u) * rr * 0.62 * (u < 0 ? 0.55 : 1), Math.sin(th) * ring * rr).add(a.position);
      const size = a.scale * range(rng, 0.17, 0.26);
      e.set(range(rng, -0.4, 0.4), rng() * Math.PI * 2, range(rng, -0.4, 0.4));
      q.setFromEuler(e);
      s.setScalar(size);
      m.compose(p, q, s);
      matrices.push(...m.elements);
      n.copy(p).sub(blobCenter).normalize();
      blob.push(n.x, n.y, n.z);
      // Sun-facing tops lighter and warmer, the inner crown deeper.
      const up = THREE.MathUtils.clamp(n.y * 0.5 + 0.5, 0, 1);
      col.copy(deep).lerp(mid, up).lerp(light, Math.max(0, up - 0.55) * rng() * 1.4);
      const v = range(rng, 0.85, 1.12);
      colors.push(col.r * v, col.g * v, col.b * v);
    }
  }
  return {
    geometry: mass,
    matrices: new Float32Array(matrices),
    colors: new Float32Array(colors),
    blob: new Float32Array(blob),
    count: matrices.length / 16,
  };
}

export function WorldTree() {
  const { assets, leaves, quality } = useWorld();
  const data = treeData();

  const parts = useMemo(() => {
    const barkPieces = [data.outerShell, data.crownRim, data.tunnel, ...data.roots, ...data.branches.flat(), ...data.interior].map(prepare);
    const bark = mergeGeometries(barkPieces);
    bark.computeBoundingSphere();
    const heart = prepare(data.innerShell);
    heart.computeBoundingSphere();
    const floor = buildHallFloor();
    return { bark, heart, floor };
  }, [data]);

  const canopy = useMemo(() => buildCanopy(data, quality.foliage), [data, quality.foliage]);

  const materials = useMemo(() => {
    const bark = createBarkMaterial(assets, { ground: TREE_GROUND, moss: 0.7, tint: "#fff1e2", brightness: 1.55, macro: 0.08 });
    const heartwood = createHeartwoodMaterial(assets);
    const floor = new THREE.MeshStandardMaterial({ map: assets.litter.color, normalMap: assets.litter.normal, roughness: 0.95, color: "#b49a80" });
    const foliageOpts = { sway: 0.22, translucency: 1.0, vertexColors: true, blob: 0.72, alphaTest: 0.38 };
    const leavesMat = createFoliageMaterial(leaves, foliageOpts);
    const leavesDepth = createFoliageDepthMaterial(leaves, foliageOpts);
    return { bark, heartwood, floor, leavesMat, leavesDepth };
  }, [assets, leaves]);

  const canopyMesh = useMemo(() => {
    const mesh = new THREE.InstancedMesh(canopy.geometry, materials.leavesMat, canopy.count);
    mesh.instanceMatrix.array.set(canopy.matrices);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(canopy.colors, 3);
    canopy.geometry.setAttribute("aBlobN", new THREE.InstancedBufferAttribute(canopy.blob, 3));
    mesh.customDepthMaterial = materials.leavesDepth;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    return mesh;
  }, [canopy, materials]);

  useEffect(
    () => () => {
      parts.bark.dispose();
      parts.heart.dispose();
      parts.floor.dispose();
      Object.values(materials).forEach((m) => m.dispose());
      canopy.geometry.dispose();
      canopyMesh.dispose();
    },
    [parts, materials, canopy, canopyMesh]
  );

  return (
    <group position={[TREE.x, TREE.y, TREE.z]}>
      <mesh geometry={parts.bark} material={materials.bark} castShadow receiveShadow />
      <mesh geometry={parts.heart} material={materials.heartwood} receiveShadow />
      <mesh geometry={parts.floor} material={materials.floor} receiveShadow />
      <primitive object={canopyMesh} />
    </group>
  );
}
