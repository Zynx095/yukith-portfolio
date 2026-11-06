"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RINGS } from "@/lib/world/journey";
import { RING_STAGES } from "@/lib/world/rings";
import { createSignalMaterial, shared } from "@/lib/world/materials";
import { threadGeometry, type Thread } from "@/lib/world/signal";
import { createRng, range } from "@/lib/world/noise";
import { wallPoint } from "@/lib/world/tree";
import { TREE } from "@/lib/world/layout";
import { frame } from "@/lib/world/store";
import { Glows, type GlowPoint } from "./Glows";
import { createShaftMaterial } from "./ArchiveHall";

/**
 * The growth rings: three years carved into the hollow as three stages, each
 * with its own light.
 *
 *   2024 · Roots     — amber; a few nodes, and threads that keep climbing
 *                      (the roles and the degree begun that year still run).
 *   2025 · Reach     — gold; shafts of daylight through cracks in the trunk.
 *   2026 · Branching — signal-teal; a dense ring of nodes (one per project,
 *                      role, result and engagement) fanning out into threads.
 *
 * Every node stands for one item on that year's card (lib/world/rings.ts);
 * the HTML overlay lists them. The wall itself is lit by a band of light
 * hugging its real, uneven surface.
 */

const ORIGIN = new THREE.Vector3(TREE.x, TREE.y, TREE.z);
const world = (theta: number, y: number, inset: number) => wallPoint(theta, y, inset).add(ORIGIN);

/** Arc of the wall the year's nodes are spread across (radians either side of the view direction). */
const SPAN = [0.62, 0.3, 1.05];

/** A glowing band of light conforming to the wall around a ring. */
function createWashMaterial(color: string, strength: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime, uColor: { value: new THREE.Color(color) }, uStrength: { value: strength }, uReveal: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uStrength, uReveal;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float v = abs(vUv.y - 0.5) * 2.0;
        float band = pow(max(1.0 - v, 0.0), 2.4);
        float shimmer = 0.82 + 0.18 * sin(vUv.x * 40.0 - uTime * 0.6);
        vec3 c = uColor * band * shimmer * uStrength * (0.35 + 0.65 * uReveal);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

function washGeometry(localY: number, height: number) {
  const cols = 160;
  const rows = 8;
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let j = 0; j <= rows; j++) {
    const y = localY - height / 2 + (j / rows) * height;
    for (let i = 0; i <= cols; i++) {
      const th = (i / cols) * Math.PI * 2;
      const p = world(th, y, 0.12);
      pos.push(p.x, p.y, p.z);
      uv.push(i / cols, j / rows);
    }
  }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      index.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeBoundingSphere();
  return g;
}

/** Points round the wall at a ring's height (the carved band). */
function ringLoop(localY: number, inset: number, wave: number, seed: number) {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= 200; k++) {
    const th = (k / 200) * Math.PI * 2;
    pts.push(world(th, localY + Math.sin(th * 3 + seed) * wave, inset));
  }
  return pts;
}

/** Node directions: evenly spread across the arc facing the camera stop. */
function nodeAngles(count: number, centre: number, span: number) {
  if (count === 1) return [centre];
  return Array.from({ length: count }, (_, i) => centre - span + (2 * span * i) / (count - 1));
}

export function GrowthRings() {
  const group = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const rng = createRng(2024);
    const parts = RINGS.map((ring, k) => {
      const stage = RING_STAGES[k];
      const threads: Thread[] = [
        { points: ringLoop(ring.localY, 0.3, 0.22, k), radius: 0.34, group: "chimney" },
        { points: ringLoop(ring.localY - 1.3, 0.25, 0.18, k + 2), radius: 0.14, group: "chimney" },
      ];
      const angles = nodeAngles(stage.nodes, ring.theta - 0.2, SPAN[k]);
      const nodes = angles.map((th) => world(th, ring.localY + 0.2, 0.75));
      const glows: GlowPoint[] = nodes.map((p, i) => ({ position: p, size: k === 2 ? 1.15 : 1.6, color: stage.color, night: 0, pulse: i * 0.37 + k }));
      const ups: Thread[] = [];
      if (k === 0) {
        // What began in 2024 is still running: one thread per role, and the degree, climbing past
        // the later rings. The degree's thread runs on towards the crown.
        angles.slice(0, stage.continuing).forEach((th0, i) => {
          const isDegree = i === 0;
          const top = isDegree ? 320 : RINGS[2].localY + 16;
          const pts: THREE.Vector3[] = [];
          for (let y = ring.localY + 0.4; y <= top; y += 3) {
            const th = th0 + Math.sin(y * 0.03 + i * 2) * 0.12 + (y - ring.localY) * 0.0016 * (i % 2 ? 1 : -1);
            pts.push(world(th, y, 0.4));
          }
          ups.push({ points: pts, radius: isDegree ? 0.16 : 0.12, group: "chimney" });
        });
      }
      if (k === 2) {
        // Branching: from the 2026 nodes threads fan out up the wall and fork.
        angles.forEach((th0, i) => {
          if (i % 2) return;
          let th = th0;
          let y = ring.localY + 0.6;
          const pts: THREE.Vector3[] = [];
          const len = range(rng, 26, 70);
          for (let s = 0; s <= 24; s++) {
            const f = s / 24;
            th += range(rng, -0.03, 0.03) + (i - angles.length / 2) * 0.0009;
            y = ring.localY + 0.6 + f * len;
            pts.push(world(th, y, 0.4));
          }
          ups.push({ points: pts, radius: 0.09, group: "chimney" });
          // A fork part-way up.
          const forkAt = pts[Math.floor(pts.length * range(rng, 0.35, 0.6))];
          const fork: THREE.Vector3[] = [forkAt];
          let fth = Math.atan2(forkAt.z - TREE.z, forkAt.x - TREE.x);
          for (let s = 1; s <= 10; s++) {
            fth += (i % 4 ? 1 : -1) * 0.025;
            fork.push(world(fth, forkAt.y - TREE.y + s * 2.2, 0.4));
          }
          ups.push({ points: fork, radius: 0.07, group: "chimney" });
        });
      }
      return {
        ring: threadGeometry(threads, 8),
        ups: ups.length ? threadGeometry(ups, 5) : null,
        ringMat: createSignalMaterial({ color: stage.color, intensity: 1.9, speed: 0.03, floor: 0.7 }),
        upsMat: createSignalMaterial({ color: k === 0 ? RING_STAGES[0].color : stage.color, intensity: 1.5, speed: 0.07, floor: 0.4 }),
        wash: washGeometry(ring.localY + 0.5, 13),
        washMat: createWashMaterial(stage.color, k === 1 ? 0.16 : 0.13),
        glows,
        nodes,
      };
    });

    // 2025 — shafts of daylight slanting in through cracks just above the ring.
    const r1 = RINGS[1];
    const shaftMat = createShaftMaterial();
    shaftMat.uniforms.uColor.value.set("#ffe0a0");
    shaftMat.uniforms.uStrength.value = 0.45;
    const shafts = [0, 1, 2].map((s) => {
      // From cracks in the side walls, slanting down across the view to the far wall.
      const thTop = r1.theta + (s === 1 ? -1 : 1) * (Math.PI / 2 + 0.25) + (s === 2 ? 0.5 : 0);
      const top = world(thTop, r1.localY + 16 + s * 6, -0.5);
      const bottom = world(r1.theta + (s === 1 ? 0.35 : -0.3) + (s === 2 ? -0.4 : 0), r1.localY - 7, 1.5);
      const len = top.distanceTo(bottom);
      const g = new THREE.CylinderGeometry(1.6 + s * 0.5, 4.6, len, 24, 1, true);
      g.translate(0, -len / 2, 0);
      const m = new THREE.Matrix4().lookAt(top, bottom, new THREE.Vector3(0, 1, 0));
      const q = new THREE.Quaternion().setFromRotationMatrix(m).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
      return { geometry: g, position: top, quaternion: q };
    });

    // 2024 — embers drifting near the first ring.
    const embers: GlowPoint[] = [];
    for (let i = 0; i < 26; i++) {
      const th = RINGS[0].theta + range(rng, -1.2, 1.2);
      embers.push({ position: world(th, RINGS[0].localY + range(rng, -6, 10), range(rng, 2, 9)), size: range(rng, 0.25, 0.5), color: "#ffb35c", night: 0, pulse: rng() * 6 });
    }
    // Bead cores for every node (one instanced draw).
    const allNodes = parts.flatMap((p) => p.nodes);
    const bead = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.2, 1), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), allNodes.length);
    const mtx = new THREE.Matrix4();
    const col = new THREE.Color();
    let n = 0;
    parts.forEach((p, k) =>
      p.nodes.forEach((pos) => {
        mtx.makeTranslation(pos.x, pos.y, pos.z);
        bead.setMatrixAt(n, mtx);
        bead.setColorAt(n, col.set(RING_STAGES[k].color).multiplyScalar(3));
        n++;
      })
    );
    bead.instanceMatrix.needsUpdate = true;
    bead.computeBoundingSphere();
    return { parts, shafts, shaftMat, embers, bead, glows: [...parts.flatMap((p) => p.glows), ...embers] };
  }, []);

  useEffect(
    () => () => {
      res.parts.forEach((p) => {
        p.ring.dispose();
        p.ups?.dispose();
        p.ringMat.dispose();
        p.upsMat.dispose();
        p.wash.dispose();
        p.washMat.dispose();
      });
      res.shafts.forEach((s) => s.geometry.dispose());
      res.shaftMat.dispose();
      res.bead.geometry.dispose();
      (res.bead.material as THREE.Material).dispose();
      res.bead.dispose();
    },
    [res]
  );

  useFrame(() => {
    const p = frame.progress;
    if (group.current) group.current.visible = p > 0.74 && p < 0.97;
    // Each ring brightens as the camera reaches it.
    res.parts.forEach((part, k) => {
      const d = Math.abs(p - RINGS[k].progress);
      const reveal = 1 - THREE.MathUtils.smoothstep(d, 0.006, 0.03);
      part.washMat.uniforms.uReveal.value = reveal;
      part.ringMat.uniforms.uFocus.value = reveal * 0.8;
    });
  });

  return (
    <group ref={group}>
      {res.parts.map((part, k) => (
        <group key={k}>
          <mesh geometry={part.wash} material={part.washMat} renderOrder={3} />
          <mesh geometry={part.ring} material={part.ringMat} renderOrder={4} />
          {part.ups && <mesh geometry={part.ups} material={part.upsMat} renderOrder={4} />}
        </group>
      ))}
      {res.shafts.map((s, i) => (
        <mesh key={i} geometry={s.geometry} material={res.shaftMat} position={s.position} quaternion={s.quaternion} renderOrder={7} />
      ))}
      <primitive object={res.bead} />
      <Glows points={res.glows} />
    </group>
  );
}
