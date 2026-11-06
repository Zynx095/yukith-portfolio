"use client";

import { useEffect, useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  CAMP,
  PATH_CURVE,
  TREE,
  TREE_ENTRANCE_ANGLE,
  WAYSTONES,
  isReserved,
  lakeDistance,
  pathInfo,
  riverHalfWidth,
  riverInfo,
  terrainHeight,
  terrainNormal,
  waystonePosition,
} from "@/lib/world/layout";
import { SimplexNoise, createRng, range } from "@/lib/world/noise";
import { spine } from "@/lib/world/tree";
import { Glows, type GlowPoint } from "./Glows";
import { useWorld } from "./WorldContext";

/**
 * Photo-scanned dressing (CC0, Poly Haven): waystones carved with the four
 * things Yukith keeps coming back to, boulders by the water, ferns and moss
 * among the roots, flowers in the meadow, and two lanterns at the entrance.
 * Each model part is instanced, so a few hundred props cost a few draw calls.
 */

/** Waystones face the traveller coming up the trail, turned slightly towards the path. */
function waystoneFacing(i: number) {
  const w = WAYSTONES[i];
  const pos = waystonePosition(i);
  const p = PATH_CURVE.getPointAt(w.t);
  const tan = PATH_CURVE.getTangentAt(w.t);
  const toPath = new THREE.Vector3(p.x - pos.x, 0, p.z - pos.z).normalize();
  return new THREE.Vector3(-tan.x, 0, -tan.z).normalize().multiplyScalar(0.8).addScaledVector(toPath, 0.6).normalize();
}

interface Part {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** Height of the part's bounding box (for scaling to a target size). */
  height: number;
  /** Largest horizontal extent. */
  width: number;
}

/** Every mesh of a model, with its node transform baked into the geometry and the base moved to y = 0. */
function modelParts(gltf: GLTF): Part[] {
  const parts: Part[] = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const g = mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    g.computeBoundingBox();
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    parts.push({ geometry: g, material: mat, height: bb.max.y - bb.min.y, width: Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) });
  });
  return parts;
}

interface Placement {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  /** Extra vertical stretch (1 = uniform). */
  stretch?: number;
  /** Tilt to follow the ground. */
  tilt?: THREE.Vector3;
}

function instanced(part: Part, placements: Placement[], shadows = true) {
  const mesh = new THREE.InstancedMesh(part.geometry, part.material, placements.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Quaternion();
  placements.forEach((p, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rotation);
    if (p.tilt) up.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.tilt).multiply(q);
    else up.copy(q);
    m.compose(p.position, up, new THREE.Vector3(p.scale, p.scale * (p.stretch ?? 1), p.scale));
    mesh.setMatrixAt(i, m);
  });
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

function scatter(count: number, seed: number, accept: (x: number, z: number, rng: () => number) => boolean, area: { x0: number; x1: number; z0: number; z1: number }, scale: [number, number]): Placement[] {
  const rng = createRng(seed);
  const out: Placement[] = [];
  const n = new THREE.Vector3();
  let guard = 0;
  while (out.length < count && guard++ < count * 200) {
    const x = range(rng, area.x0, area.x1);
    const z = range(rng, area.z0, area.z1);
    if (!accept(x, z, rng)) continue;
    terrainNormal(x, z, n);
    out.push({ position: new THREE.Vector3(x, terrainHeight(x, z) - 0.05, z), rotation: rng() * Math.PI * 2, scale: range(rng, scale[0], scale[1]), tilt: n.clone().lerp(new THREE.Vector3(0, 1, 0), 0.5).normalize() });
  }
  return out;
}

export function Props() {
  const { assets, quality } = useWorld();
  const noise = useMemo(() => new SimplexNoise(3131), []);
  const meshes = useMemo(() => {
    const out: THREE.InstancedMesh[] = [];
    const density = 0.4 + 0.6 * quality.foliage;
    const tall = modelParts(assets.models["rocks-tall"]);
    const round = modelParts(assets.models["rocks-round"]);
    const fern = modelParts(assets.models.fern);
    const moss = modelParts(assets.models.moss);
    const flower = modelParts(assets.models.celandine);
    const stump = modelParts(assets.models.stump);

    // Waystones: the most slender standing stone of the set, one per word, turned to face the trail.
    const stone = tall.reduce((a, b) => (b.height / b.width > a.height / a.width ? b : a));
    const ways: Placement[] = WAYSTONES.map((w, i) => {
      const pos = waystonePosition(i);
      const face = waystoneFacing(i);
      const xz = 1.15 / stone.width;
      return { position: pos.setY(pos.y - 0.3), rotation: Math.atan2(face.x, face.z), scale: xz, stretch: 2.8 / (stone.height * xz) };
    });
    out.push(instanced(stone, ways));

    // Boulders along the river and around the clearing.
    const nearWater = (x: number, z: number) => {
      const r = riverInfo(x, z);
      const hw = riverHalfWidth(r.t);
      return (r.dist > hw + 0.5 && r.dist < hw + 5) || (lakeDistance(x, z) > 1.05 && lakeDistance(x, z) < 1.3);
    };
    const boulderSpots = scatter(Math.round(70 * density), 71, (x, z) => nearWater(x, z) && pathInfo(x, z).dist > 3, { x0: -110, x1: 40, z0: -700, z1: -20 }, [0.5, 1.4]);
    const clearing = scatter(Math.round(26 * density), 73, (x, z) => {
      const d = Math.hypot(x - TREE.x, z - TREE.z);
      return d > 120 && d < 200 && pathInfo(x, z).dist > 6;
    }, { x0: TREE.x - 200, x1: TREE.x + 200, z0: TREE.z - 200, z1: TREE.z + 200 }, [1.2, 2.6]);
    round.forEach((part, i) => out.push(instanced(part, [...boulderSpots, ...clearing].filter((_, k) => k % round.length === i))));

    // Ferns and moss where the World Tree's roots meet the ground, and in the shade by the river.
    const rootZone = (x: number, z: number) => {
      const d = Math.hypot(x - TREE.x, z - TREE.z);
      return d > 50 && d < 135 && pathInfo(x, z).dist > 4;
    };
    const fernSpots = scatter(Math.round(380 * density), 81, (x, z, rng) => (rootZone(x, z) || (nearWater(x, z) && rng() < 0.4)) && noise.noise2(x * 0.05, z * 0.05) > -0.2, { x0: -150, x1: 150, z0: -960, z1: -60 }, [1.0, 1.8]);
    fern.forEach((part, i) => out.push(instanced(part, fernSpots.filter((_, k) => k % fern.length === i), false)));
    const mossSpots = scatter(Math.round(120 * density), 83, rootZone, { x0: -140, x1: 140, z0: -960, z1: -680 }, [1.5, 3.5]);
    moss.forEach((part) => out.push(instanced(part, mossSpots, false)));

    // Yellow celandine in the meadow, in drifts.
    const flowerSpots = scatter(Math.round(420 * density), 91, (x, z) => !isReserved(x, z, 1) && pathInfo(x, z).dist < 40 && noise.noise2(x * 0.03 + 4, z * 0.03) > 0.25, { x0: -60, x1: 110, z0: -620, z1: 30 }, [0.8, 1.3]);
    flower.forEach((part, i) => out.push(instanced(part, flowerSpots.filter((_, k) => k % flower.length === i), false)));

    // A stump by the campfire.
    const stumpPart = stump.reduce((a, b) => (b.height > a.height ? b : a));
    out.push(instanced(stumpPart, [{ position: new THREE.Vector3(CAMP.x + 2.6, terrainHeight(CAMP.x + 2.6, CAMP.z - 1.4) - 0.05, CAMP.z - 1.4), rotation: 0.6, scale: 0.55 / stumpPart.height }]));
    return out;
  }, [assets, quality.foliage, noise]);

  useEffect(
    () => () =>
      meshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
        m.dispose();
      }),
    [meshes]
  );

  // The carved words and the entrance lanterns.
  const words = useMemo(
    () =>
      WAYSTONES.map((w, i) => {
        const pos = waystonePosition(i);
        const face = waystoneFacing(i);
        return { word: w.word, position: pos.clone().addScaledVector(face, 0.62).add(new THREE.Vector3(0, 1.45, 0)), rotation: Math.atan2(face.x, face.z) };
      }),
    []
  );
  const lanterns = useMemo(() => {
    const a = TREE_ENTRANCE_ANGLE;
    const sp = spine(0);
    return [-1, 1].map((s) => {
      const r = 50;
      const x = TREE.x + sp.x + Math.cos(a) * r - Math.sin(a) * s * 9;
      const z = TREE.z + sp.y + Math.sin(a) * r + Math.cos(a) * s * 9;
      return new THREE.Vector3(x, terrainHeight(x, z), z);
    });
  }, []);
  const lanternGlows = useMemo<GlowPoint[]>(() => lanterns.map((p, i) => ({ position: p.clone().add(new THREE.Vector3(0, 2.25, 0)), size: 2.6, color: "#ffb35a", night: 0.9, pulse: i * 0.3 })), [lanterns]);
  const signal = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(1.6), toneMapped: true }), []);
  const flame = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb35a").multiplyScalar(3) }), []);
  const bronze = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5d4a34", metalness: 1, roughness: 0.5 }), []);
  useEffect(
    () => () => {
      signal.dispose();
      flame.dispose();
      bronze.dispose();
    },
    [signal, flame, bronze]
  );

  return (
    <group>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      {words.map((w) => (
        <Text
          key={w.word}
          font="/assets/fonts/fraunces-waystones.woff"
          fontSize={0.34}
          letterSpacing={0.04}
          anchorX="center"
          anchorY="middle"
          position={w.position}
          rotation={[0, w.rotation, Math.PI / 2]}
          material={signal}
        >
          {w.word}
        </Text>
      ))}
      {lanterns.map((p, i) => (
        <group key={i} position={p}>
          <mesh material={bronze} position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.12, 2.2, 8]} />
          </mesh>
          <mesh material={bronze} position={[0, 2.25, 0]}>
            <cylinderGeometry args={[0.24, 0.18, 0.5, 6, 1, true]} />
          </mesh>
          <mesh material={flame} position={[0, 2.22, 0]}>
            <sphereGeometry args={[0.12, 12, 8]} />
          </mesh>
        </group>
      ))}
      <Glows points={lanternGlows} />
    </group>
  );
}
