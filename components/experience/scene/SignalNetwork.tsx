"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildThreads, threadGeometry } from "@/lib/world/signal";
import { createSignalMaterial } from "@/lib/world/materials";
import { ARCHIVE, HALL_CENTER } from "@/lib/world/archive";
import { PATH_CURVE, TREE, TREE_ENTRANCE_ANGLE, WAYSTONES, terrainHeight, waystonePosition } from "@/lib/world/layout";
import { spine, treeSkeleton } from "@/lib/world/tree";
import { frame, ui } from "@/lib/world/store";
import { Glows, type GlowPoint } from "./Glows";

const SIGNAL = "#7ee0cf";

/**
 * The root network made visible: glowing threads with pulses travelling
 * towards the World Tree, the star of links inside the hall (the link to the
 * relic in focus carries the brightest pulse) and soft glows at every node.
 */
export function SignalNetwork() {
  const res = useMemo(() => {
    const threads = buildThreads();
    const outside = threadGeometry(threads.filter((t) => t.group === "outside" || t.group === "entrance"));
    const veins = threadGeometry(threads.filter((t) => t.group === "veins"), 6);
    const chimney = threadGeometry(threads.filter((t) => t.group === "chimney"));
    const hall = ARCHIVE.map((_, i) => threadGeometry(threads.filter((t) => t.group === "hall" && t.relic === i), 6));
    const outsideMat = createSignalMaterial({ color: SIGNAL, intensity: 1.4, speed: 0.1 });
    // The tree's veins are thicker and brighter: they are what the roots chapter is about.
    const veinsMat = createSignalMaterial({ color: SIGNAL, intensity: 2.0, speed: 0.08, floor: 0.55 });
    const chimneyMat = createSignalMaterial({ color: SIGNAL, intensity: 1.2, speed: 0.06 });
    const hallMats = ARCHIVE.map(() => createSignalMaterial({ color: SIGNAL, intensity: 1.6, speed: 0.12 }));
    return { outside, veins, chimney, hall, outsideMat, veinsMat, chimneyMat, hallMats };
  }, []);

  const glows = useMemo<GlowPoint[]>(() => {
    const pts: GlowPoint[] = [];
    // Beacons along the trail: faint by day, a dotted line of light seen from the crown at night.
    for (let t = 0.09; t < 0.97; t += 0.032) {
      const p = PATH_CURVE.getPointAt(t);
      pts.push({ position: new THREE.Vector3(p.x, terrainHeight(p.x, p.z) + 0.25, p.z), size: 1.7, color: SIGNAL, night: 1, pulse: t * 7 });
    }
    WAYSTONES.forEach((_, i) => pts.push({ position: waystonePosition(i).add(new THREE.Vector3(0, 0.3, 0)), size: 1.6, color: SIGNAL, night: 0.8, pulse: i * 0.2 }));
    const a = TREE_ENTRANCE_ANGLE;
    const sp = spine(0);
    for (const r of [56, 46]) pts.push({ position: new THREE.Vector3(TREE.x + sp.x + Math.cos(a) * r, TREE.y + 0.8, TREE.z + sp.y + Math.sin(a) * r), size: 2.2, color: new THREE.Color(SIGNAL).multiplyScalar(0.6), night: 0.7, pulse: r * 0.1 });
    pts.push({ position: HALL_CENTER.clone().add(new THREE.Vector3(0, 2, 0)), size: 3.4, color: new THREE.Color(SIGNAL).multiplyScalar(0.5), night: 0, pulse: 0.5 });
    ARCHIVE.forEach((r, i) => pts.push({ position: r.base.clone().add(new THREE.Vector3(0, -1.2, 0)).lerp(HALL_CENTER, 0.06), size: 0.55, color: SIGNAL, night: 0, pulse: i * 0.11 }));
    // After dark the crown shows its own network: faint nodes of signal light across the
    // tops of the foliage pads (invisible by day — night = 1).
    const origin = new THREE.Vector3(TREE.x, TREE.y, TREE.z);
    const dim = new THREE.Color(SIGNAL).multiplyScalar(0.55);
    treeSkeleton().anchors.forEach((a, i) => {
      if (i % 5) return;
      pts.push({ position: a.position.clone().add(origin).add(new THREE.Vector3(0, a.scale * 0.22 * a.flat, 0)), size: 2.4 + (i % 3), color: dim, night: 1, pulse: i * 0.173 });
    });
    return pts;
  }, []);

  useEffect(
    () => () => {
      res.outside.dispose();
      res.veins.dispose();
      res.veinsMat.dispose();
      res.chimney.dispose();
      res.hall.forEach((g) => g.dispose());
      res.outsideMat.dispose();
      res.chimneyMat.dispose();
      res.hallMats.forEach((m) => m.dispose());
    },
    [res]
  );

  useFrame((_, dt) => {
    const focus = ui.get().focusId;
    const near = frame.focusNear;
    res.hallMats.forEach((m, i) => {
      const want = ARCHIVE[i].project.id === focus ? 1.6 * near : 0;
      m.uniforms.uFocus.value += (want - m.uniforms.uFocus.value) * Math.min(1, dt * 4);
    });
  });

  return (
    <group>
      <mesh geometry={res.outside} material={res.outsideMat} renderOrder={4} />
      <mesh geometry={res.veins} material={res.veinsMat} renderOrder={4} />
      <mesh geometry={res.chimney} material={res.chimneyMat} renderOrder={4} />
      {res.hall.map((g, i) => (
        <mesh key={i} geometry={g} material={res.hallMats[i]} renderOrder={4} />
      ))}
      <Glows points={glows} />
    </group>
  );
}
