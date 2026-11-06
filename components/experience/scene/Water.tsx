"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { LAKE, RIVER_CURVE, WATER_LEVEL, riverHalfWidth, terrainHeight } from "@/lib/world/layout";
import { createWaterMaterial } from "@/lib/world/materials";

/**
 * The river that rises among the World Tree's roots and the lake it fills by
 * the camp. Surfaces sit exactly at the water level the terrain was carved to;
 * `aDepth` (water depth) drives the shallows and the shore foam, `aFlow` the
 * direction ripples drift.
 */

function lakeGeometry() {
  const segR = 48;
  const segA = 128;
  const pos: number[] = [];
  const depth: number[] = [];
  const flow: number[] = [];
  const index: number[] = [];
  const c = Math.cos(LAKE.rotation);
  const s = Math.sin(LAKE.rotation);
  for (let r = 0; r <= segR; r++) {
    for (let a = 0; a < segA; a++) {
      const f = (r / segR) * 1.18;
      const th = (a / segA) * Math.PI * 2;
      const lx = Math.cos(th) * LAKE.rx * f * 1.12;
      const lz = Math.sin(th) * LAKE.rz * f * 1.12;
      const x = LAKE.x + lx * c + lz * s;
      const z = LAKE.z - lx * s + lz * c;
      pos.push(x, WATER_LEVEL, z);
      depth.push(Math.max(0, WATER_LEVEL - terrainHeight(x, z)));
      flow.push(0.04, 0.02);
    }
  }
  for (let r = 0; r < segR; r++)
    for (let a = 0; a < segA; a++) {
      const i0 = r * segA + a;
      const i1 = r * segA + ((a + 1) % segA);
      index.push(i0, i1, i0 + segA, i1, i1 + segA, i0 + segA);
    }
  return finish(pos, depth, flow, index);
}

function riverGeometry() {
  const n = 420;
  const across = 8;
  const pos: number[] = [];
  const depth: number[] = [];
  const flow: number[] = [];
  const index: number[] = [];
  const p = new THREE.Vector3();
  const tan = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    RIVER_CURVE.getPointAt(t, p);
    RIVER_CURVE.getTangentAt(t, tan);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const hw = riverHalfWidth(t) + 1.2;
    for (let k = 0; k <= across; k++) {
      const o = (k / across) * 2 - 1;
      const x = p.x + side.x * o * hw;
      const z = p.z + side.z * o * hw;
      pos.push(x, p.y, z);
      depth.push(Math.max(0, p.y - terrainHeight(x, z)));
      flow.push(tan.x * 1.4, tan.z * 1.4);
    }
  }
  const row = across + 1;
  for (let i = 0; i < n; i++)
    for (let k = 0; k < across; k++) {
      const a = i * row + k;
      index.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  return finish(pos, depth, flow, index);
}

function finish(pos: number[], depth: number[], flow: number[], index: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute("aDepth", new THREE.Float32BufferAttribute(depth, 1));
  g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 2));
  g.setIndex(index);
  g.computeBoundingSphere();
  return g;
}

export function Water() {
  const lake = useMemo(() => lakeGeometry(), []);
  const river = useMemo(() => riverGeometry(), []);
  const material = useMemo(() => createWaterMaterial(), []);
  useEffect(
    () => () => {
      lake.dispose();
      river.dispose();
      material.dispose();
    },
    [lake, river, material]
  );
  return (
    <>
      <mesh geometry={lake} material={material} receiveShadow renderOrder={1} />
      <mesh geometry={river} material={material} receiveShadow renderOrder={1} />
    </>
  );
}
