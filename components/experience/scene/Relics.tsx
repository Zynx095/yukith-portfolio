"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { ARCHIVE, type RelicPlacement } from "@/lib/world/archive";
import type { RelicKind } from "@/src/data/projects";
import { openRecord, ui, useUi } from "@/lib/world/store";
import { shared } from "@/lib/world/materials";
import { useWorld } from "./WorldContext";

/**
 * The nine relics of the archive. Each is a small sculpture whose form follows
 * what the project actually does (see RelicKind in src/data/projects.ts):
 * a gatehouse that checks before it lets anything through (WARDEN), six trust
 * arcs weighted 25/20/15/15/15/10 % (Q-SHIELD), four role nodes on one event
 * bus (JIVA), a sealed crystal read only from outside (ETTH), a lens whose
 * tracking bracket walks NORMAL → OBSERVED → SUSPICIOUS (AURA), a case file
 * under a magnifier with six baseline ribbons (ALIAS), a page whose sensitive
 * lines are redacted as it passes a screen (ShadowGuard), a listening glass
 * orb (Sugar AI) and the auger robot itself (STP BOT).
 *
 * Shared materials keep the whole archive to a handful of programs.
 * Clicking (or tapping) a relic opens its record.
 */

type Mats = ReturnType<typeof makeMaterials>;

function makeMaterials(env: THREE.Texture, rock: THREE.Texture) {
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ envMap: env, envMapIntensity: 1.3, ...o });
  return {
    brass: std({ color: "#b08a50", metalness: 1, roughness: 0.34 }),
    bronze: std({ color: "#5d4a34", metalness: 1, roughness: 0.52 }),
    iron: std({ color: "#3b3936", metalness: 0.9, roughness: 0.6 }),
    stone: std({ color: "#8b8174", map: rock, roughness: 0.9, metalness: 0, envMapIntensity: 0.6 }),
    wood: std({ color: "#6a4a2e", roughness: 0.8, metalness: 0, envMapIntensity: 0.5 }),
    paper: std({ color: "#d9cdb3", roughness: 0.9, metalness: 0, envMapIntensity: 0.6, side: THREE.DoubleSide }),
    ink: std({ color: "#2a2520", roughness: 0.9, metalness: 0 }),
    glass: std({ color: "#0d1416", metalness: 0.1, roughness: 0.06, envMapIntensity: 2.2, transparent: true, opacity: 0.55 }),
    obsidian: std({ color: "#0b0f12", metalness: 0.3, roughness: 0.12, envMapIntensity: 1.8, flatShading: true }),
    signal: new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(2.2), toneMapped: true }),
    warm: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb35a").multiplyScalar(2.4), toneMapped: true }),
    status: new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee08a").multiplyScalar(2), toneMapped: true }),
  };
}

const STATUS = [new THREE.Color("#6fe08a").multiplyScalar(2.2), new THREE.Color("#ffbf4a").multiplyScalar(2.2), new THREE.Color("#ff5a4a").multiplyScalar(2.2)];

/** Which of three phases a looping cycle is in (0, 1, 2) — e.g. NORMAL → OBSERVED → SUSPICIOUS. */
const phase3 = (t: number, period = 6) => Math.floor(((t % period) / period) * 3);

// ─── Individual relics (local space: base at y = 0, about 3 units tall) ──────

function Gate({ m, active }: { m: Mats; active: boolean }) {
  const lantern = useRef<THREE.MeshBasicMaterial>(null);
  const bar = useRef<THREE.Group>(null);
  const status = useMemo(() => m.status.clone(), [m]);
  useFrame(() => {
    const t = shared.uTime.value;
    const ph = phase3(t, 7.5);
    status.color.lerp(STATUS[ph === 0 ? 0 : ph === 1 ? 1 : 2], 0.08);
    // The barrier lowers while an action awaits approval or is blocked.
    if (bar.current) bar.current.rotation.z += ((ph === 0 ? -1.2 : 0) - bar.current.rotation.z) * 0.06;
    void lantern;
  });
  useEffect(() => () => status.dispose(), [status]);
  return (
    <group scale={1.05}>
      {[-1.05, 1.05].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh material={m.stone} position={[0, 1.35, 0]} castShadow>
            <boxGeometry args={[0.42, 2.7, 0.42]} />
          </mesh>
          <mesh material={m.bronze} position={[0, 2.78, 0]}>
            <boxGeometry args={[0.6, 0.16, 0.6]} />
          </mesh>
        </group>
      ))}
      <mesh material={m.bronze} position={[0, 2.98, 0]} castShadow>
        <boxGeometry args={[2.9, 0.22, 0.5]} />
      </mesh>
      {/* Three seals on the lintel: policy, approval, audit. */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={x} material={i === 1 ? m.signal : m.brass} position={[x, 2.98, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 20]} />
        </mesh>
      ))}
      <mesh material={m.iron} position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
      </mesh>
      <group position={[0, 2.05, 0]}>
        <mesh material={m.brass}>
          <cylinderGeometry args={[0.2, 0.24, 0.48, 6, 1, true]} />
        </mesh>
        <mesh material={status}>
          <sphereGeometry args={[0.13, 20, 12]} />
        </mesh>
      </group>
      <group ref={bar} position={[-0.86, 1.0, 0.12]}>
        <mesh material={m.brass} position={[0.86, 0, 0]}>
          <boxGeometry args={[1.72, 0.08, 0.08]} />
        </mesh>
      </group>
      {active && <pointLight color="#ffd9a0" intensity={3} distance={4} position={[0, 2.05, 0.3]} />}
    </group>
  );
}

function TrustRing({ m }: { m: Mats }) {
  const ring = useRef<THREE.Group>(null);
  const cage = useRef<THREE.Mesh>(null);
  const weights = [25, 20, 15, 15, 15, 10];
  const arcs = useMemo(() => {
    let a = 0;
    return weights.map((w) => {
      const len = (w / 100) * Math.PI * 2 - 0.08;
      const g = new THREE.TorusGeometry(1.15, 0.05, 8, 48, len);
      g.rotateZ(a);
      a += (w / 100) * Math.PI * 2;
      return g;
    });
  }, []);
  const cageMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff6a4a").multiplyScalar(1.6), wireframe: true, transparent: true, opacity: 0, depthWrite: false }), []);
  useEffect(() => () => {
    arcs.forEach((g) => g.dispose());
    cageMat.dispose();
  }, [arcs, cageMat]);
  useFrame(() => {
    const t = shared.uTime.value;
    if (ring.current) ring.current.rotation.z = t * 0.15;
    // Every so often the evidence turns: the device is caged (quarantined), then earns trust back.
    const q = Math.max(0, Math.sin(t * 0.5)) ** 6;
    cageMat.opacity = q * 0.7;
    if (cage.current) cage.current.rotation.y = t * 0.3;
  });
  return (
    <group position={[0, 1.7, 0]}>
      <mesh material={m.obsidian} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.32]} />
      </mesh>
      <mesh material={m.signal} position={[0, 0.2, 0.17]}>
        <boxGeometry args={[0.32, 0.05, 0.01]} />
      </mesh>
      <mesh material={m.brass} position={[0, -0.25, 0.17]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
      </mesh>
      <group ref={ring}>
        {arcs.map((g, i) => (
          <mesh key={i} geometry={g} material={i % 2 === 0 ? m.signal : m.brass} />
        ))}
      </group>
      <mesh material={m.bronze}>
        <torusGeometry args={[1.35, 0.03, 6, 64]} />
      </mesh>
      <mesh ref={cage} material={cageMat}>
        <icosahedronGeometry args={[0.85, 1]} />
      </mesh>
      <mesh material={m.bronze} position={[0, -1.15, 0]}>
        <cylinderGeometry args={[0.08, 0.18, 0.9, 12]} />
      </mesh>
    </group>
  );
}

function Mesh4({ m }: { m: Mats }) {
  const orbit = useRef<THREE.Group>(null);
  useFrame(() => {
    if (orbit.current) orbit.current.rotation.z = shared.uTime.value * 0.2;
  });
  // Management, ambulance, hospital, patient — four roles on one event bus, facing the hall.
  const roles = [0, 1, 2, 3].map((i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    return new THREE.Vector3(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0);
  });
  return (
    <group position={[0, 1.9, 0]} rotation={[-0.15, 0, 0]}>
      <mesh material={m.brass}>
        <torusGeometry args={[0.5, 0.08, 14, 48]} />
      </mesh>
      <mesh material={m.signal} position={[0, 0, 0.06]}>
        <torusGeometry args={[0.5, 0.025, 8, 48]} />
      </mesh>
      <mesh material={m.obsidian}>
        <circleGeometry args={[0.42, 40]} />
      </mesh>
      <group ref={orbit}>
        {roles.map((p, i) => {
          const len = p.length() - 0.55;
          const mid = p.clone().normalize().multiplyScalar(0.55 + len / 2);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
          return (
            <group key={i}>
              <mesh material={m.signal} position={mid} quaternion={q}>
                <cylinderGeometry args={[0.018, 0.018, len, 6]} />
              </mesh>
              <mesh material={i === 2 ? m.warm : m.brass} position={p} castShadow>
                {i === 0 ? <boxGeometry args={[0.32, 0.32, 0.32]} /> : i === 1 ? <capsuleGeometry args={[0.13, 0.3, 6, 12]} /> : i === 2 ? <octahedronGeometry args={[0.22, 0]} /> : <sphereGeometry args={[0.18, 20, 12]} />}
              </mesh>
            </group>
          );
        })}
      </group>
      <mesh material={m.bronze} position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.2, 1.1, 12]} />
      </mesh>
    </group>
  );
}

function Geode({ m }: { m: Mats }) {
  const beads = useRef<THREE.InstancedMesh>(null);
  const crystal = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3() }), []);
  const N = 28;
  useFrame(() => {
    const t = shared.uTime.value;
    if (crystal.current) crystal.current.rotation.y = t * 0.12;
    const b = beads.current;
    if (!b) return;
    // Two streams of packets circle the crystal — analysed from outside, never entering.
    for (let i = 0; i < N; i++) {
      const stream = i % 2;
      const f = i / N + t * 0.08 * (stream ? 1 : -1.3);
      const a = f * Math.PI * 2;
      const r = 1.05 + 0.08 * Math.sin(a * 3);
      tmp.p.set(Math.cos(a) * r, Math.sin(a * 2 + stream) * 0.35, Math.sin(a) * r);
      if (stream) tmp.p.set(tmp.p.x, tmp.p.z * 0.6, tmp.p.z * 0.8 - tmp.p.y * 0.3);
      tmp.m.makeTranslation(tmp.p.x, tmp.p.y, tmp.p.z);
      b.setMatrixAt(i, tmp.m);
    }
    b.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={[0, 1.75, 0]}>
      <mesh ref={crystal} material={m.obsidian} scale={[0.62, 0.9, 0.62]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
      <mesh material={m.signal} scale={[0.18, 0.28, 0.18]}>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
      <instancedMesh ref={beads} args={[undefined, m.signal, N]}>
        <sphereGeometry args={[0.045, 10, 6]} />
      </instancedMesh>
      <mesh material={m.bronze} position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.25, 8]} />
      </mesh>
    </group>
  );
}

function Lens({ m }: { m: Mats }) {
  const bracket = useMemo(() => m.status.clone(), [m]);
  const head = useRef<THREE.Group>(null);
  const brk = useRef<THREE.Group>(null);
  useEffect(() => () => bracket.dispose(), [bracket]);
  useFrame(() => {
    const t = shared.uTime.value;
    bracket.color.lerp(STATUS[phase3(t, 6)], 0.08);
    if (head.current) head.current.rotation.y = Math.sin(t * 0.4) * 0.35;
    if (brk.current) brk.current.position.x = Math.sin(t * 0.7) * 0.25;
  });
  const corner = (sx: number, sy: number) => (
    <group position={[sx * 0.42, sy * 0.42, 0]} key={`${sx}${sy}`}>
      <mesh material={bracket} position={[-sx * 0.09, 0, 0]}>
        <boxGeometry args={[0.2, 0.035, 0.035]} />
      </mesh>
      <mesh material={bracket} position={[0, -sy * 0.09, 0]}>
        <boxGeometry args={[0.035, 0.2, 0.035]} />
      </mesh>
    </group>
  );
  return (
    <group position={[0, 1.7, 0]}>
      <group ref={head}>
        <mesh material={m.brass} castShadow>
          <torusGeometry args={[0.62, 0.12, 16, 64]} />
        </mesh>
        <mesh material={m.glass}>
          <circleGeometry args={[0.6, 48]} />
        </mesh>
        <mesh material={m.signal} position={[0, 0, 0.02]}>
          <circleGeometry args={[0.16, 32]} />
        </mesh>
        <mesh material={m.ink} position={[0, 0, 0.025]}>
          <circleGeometry args={[0.07, 24]} />
        </mesh>
        <mesh material={m.bronze} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.85, 0.035, 8, 64, Math.PI]} />
        </mesh>
      </group>
      <group ref={brk} position={[0, 0, 0.75]}>
        {corner(-1, 1)}
        {corner(1, 1)}
        {corner(-1, -1)}
        {corner(1, -1)}
      </group>
      <mesh material={m.bronze} position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.07, 0.2, 0.95, 12]} />
      </mesh>
    </group>
  );
}

function Ledger({ m }: { m: Mats }) {
  const glass = useRef<THREE.Group>(null);
  const ribbons = ["#7ee0cf", "#ffb35a", "#a5b4fc", "#f47c7c", "#9ed36a", "#e8d48a"];
  const ribbonMats = useMemo(() => ribbons.map((c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.2) })), []);
  useEffect(() => () => ribbonMats.forEach((r) => r.dispose()), [ribbonMats]);
  useFrame(() => {
    const t = shared.uTime.value;
    if (glass.current) glass.current.position.set(Math.sin(t * 0.5) * 0.35, 0.55 + Math.sin(t * 0.9) * 0.05, Math.cos(t * 0.4) * 0.15);
  });
  return (
    <group position={[0, 1.15, 0]}>
      {/* Lectern */}
      <mesh material={m.wood} position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.3, 1.05, 10]} />
      </mesh>
      <group rotation={[0.5, 0, 0]}>
        <mesh material={m.wood} position={[0, 0.05, 0]}>
          <boxGeometry args={[1.5, 0.06, 1.0]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.36, 0.11, 0]} rotation={[0, 0, -s * 0.08]}>
            <mesh material={m.paper}>
              <boxGeometry args={[0.7, 0.02, 0.9]} />
            </mesh>
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} material={m.ink} position={[0, 0.015, -0.3 + k * 0.15]}>
                <boxGeometry args={[0.5 - (k % 2) * 0.12, 0.002, 0.03]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Six baseline ribbons hanging from the spine. */}
        {ribbonMats.map((rm, i) => (
          <mesh key={i} material={rm} position={[-0.12 + i * 0.05, -0.05, 0.62]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.03, 0.005, 0.5]} />
          </mesh>
        ))}
      </group>
      <group ref={glass}>
        <mesh material={m.brass} rotation={[Math.PI / 2 - 0.5, 0, 0]}>
          <torusGeometry args={[0.24, 0.035, 10, 40]} />
        </mesh>
        <mesh material={m.glass} rotation={[-0.5 - Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.23, 32]} />
        </mesh>
        <mesh material={m.wood} position={[0.28, -0.14, 0.18]} rotation={[0.5, 0, -0.9]}>
          <cylinderGeometry args={[0.03, 0.035, 0.32, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function Veil({ m }: { m: Mats }) {
  const page = useRef<THREE.Group>(null);
  const lines = useRef<THREE.Mesh[]>([]);
  const redact = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#e0503a").multiplyScalar(1.4) }), []);
  useEffect(() => () => redact.dispose(), [redact]);
  const sensitive = [1, 4, 6];
  useFrame(() => {
    const t = shared.uTime.value;
    const y = ((t * 0.25) % 1.6) - 0.55;
    if (page.current) page.current.position.y = y;
    // Lines above the screen that carried sensitive data are redacted.
    lines.current.forEach((l, i) => {
      if (!l) return;
      const worldY = y + 0.5 - i * 0.12;
      l.material = sensitive.includes(i) && worldY > 0.55 ? redact : m.ink;
    });
  });
  return (
    <group position={[0, 1.2, 0]}>
      {/* The screen: a fine lattice the page passes through. */}
      <group position={[0, 0.55, 0]}>
        <mesh material={m.brass}>
          <boxGeometry args={[1.5, 0.06, 0.5]} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} material={m.signal} position={[-0.6 + i * 0.15, 0.04, 0]}>
            <boxGeometry args={[0.012, 0.02, 0.46]} />
          </mesh>
        ))}
      </group>
      <group ref={page}>
        <mesh material={m.paper}>
          <boxGeometry args={[0.9, 1.15, 0.01]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} ref={(el) => void (el && (lines.current[i] = el))} material={m.ink} position={[-0.05 + (i % 3) * 0.03, 0.42 - i * 0.12, 0.008]}>
            <boxGeometry args={[0.62 - (i % 3) * 0.1, 0.035, 0.002]} />
          </mesh>
        ))}
      </group>
      <mesh material={m.bronze} position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.1, 0.22, 0.6, 12]} />
      </mesh>
      {/* Side frames of the shield. */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.bronze} position={[s * 0.78, 0.2, 0]}>
          <boxGeometry args={[0.06, 1.6, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

function VoiceOrb({ m }: { m: Mats }) {
  const core = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Mesh[]>([]);
  const ringMat = useMemo(() => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(1.6), transparent: true, depthWrite: false })), []);
  useEffect(() => () => ringMat.forEach((r) => r.dispose()), [ringMat]);
  useFrame(() => {
    const t = shared.uTime.value;
    // Listening, then speaking: the core breathes, sound rings expand.
    const speak = 0.5 + 0.5 * Math.sin(t * 0.8);
    if (core.current) core.current.scale.setScalar(0.32 + 0.06 * Math.sin(t * 7) * speak + 0.03 * Math.sin(t * 2));
    rings.current.forEach((r, i) => {
      if (!r) return;
      const f = (t * 0.45 + i / 3) % 1;
      r.scale.setScalar(0.75 + f * 0.9);
      ringMat[i].opacity = (1 - f) * 0.8 * speak;
    });
  });
  return (
    <group position={[0, 1.8, 0]}>
      <mesh material={m.glass} castShadow>
        <sphereGeometry args={[0.7, 48, 32]} />
      </mesh>
      <mesh ref={core} material={m.signal}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => void (el && (rings.current[i] = el))} material={ringMat[i]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.8, 0.012, 6, 64]} />
        </mesh>
      ))}
      <mesh material={m.brass} position={[0, -0.78, 0]}>
        <torusGeometry args={[0.3, 0.05, 10, 36]} />
      </mesh>
      <mesh material={m.bronze} position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.22, 0.85, 12]} />
      </mesh>
    </group>
  );
}

function Rover({ m }: { m: Mats }) {
  const auger = useRef<THREE.Group>(null);
  const helix = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2 * 5;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.17, Math.sin(a) * 0.17, (i / 120) * 0.9 - 0.45));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.025, 6, false);
  }, []);
  useEffect(() => () => helix.dispose(), [helix]);
  useFrame(() => {
    if (auger.current) auger.current.rotation.z = shared.uTime.value * 2.4;
  });
  return (
    <group position={[0, 0.3, 0]} rotation={[0, -0.35, 0]}>
      <mesh material={m.iron} position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.9, 0.32, 1.25]} />
      </mesh>
      <mesh material={m.brass} position={[0, 0.52, -0.15]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
      </mesh>
      {[-0.52, 0.52].map((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh key={`${x}${z}`} material={m.ink} position={[x, 0.18, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.14, 20]} />
          </mesh>
        ))
      )}
      {/* The auger, turning at the front. */}
      <group ref={auger} position={[0, 0.28, 0.95]} rotation={[0, 0, 0]}>
        <mesh material={m.brass} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.95, 10]} />
        </mesh>
        <mesh geometry={helix} material={m.brass} />
      </group>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} material={m.iron} position={[x, 0.3, 0.75]}>
          <boxGeometry args={[0.05, 0.08, 0.5]} />
        </mesh>
      ))}
      {/* Camera mast and ultrasonic "eyes". */}
      <mesh material={m.iron} position={[0, 0.9, -0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.75, 8]} />
      </mesh>
      <mesh material={m.obsidian} position={[0, 1.3, -0.35]}>
        <boxGeometry args={[0.24, 0.16, 0.18]} />
      </mesh>
      <mesh material={m.signal} position={[0, 1.3, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} material={m.brass} position={[x, 0.36, 0.64]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
        </mesh>
      ))}
    </group>
  );
}

const SCULPTURE: Record<RelicKind, (p: { m: Mats; active: boolean }) => React.ReactElement> = {
  gate: Gate,
  "trust-ring": TrustRing,
  mesh: Mesh4,
  geode: Geode,
  lens: Lens,
  ledger: Ledger,
  veil: Veil,
  "voice-orb": VoiceOrb,
  rover: Rover,
};

function Relic({ a, m, hovered, onHover }: { a: RelicPlacement; m: Mats; hovered: boolean; onHover: (id: string | null) => void }) {
  const focusId = useUi((s) => s.focusId);
  const active = focusId === a.project.id || hovered;
  const Sculpture = SCULPTURE[a.project.relic ?? "geode"];
  const rotY = Math.atan2(a.facing.x, a.facing.z);
  return (
    <group position={a.base} rotation={[0, rotY, 0]} scale={1.3}>
      <Sculpture m={m} active={active} />
      {/* Generous invisible hit volume, so the relic is easy to click or tap. */}
      <mesh
        position={[0, 1.7, 0]}
        visible={false}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          openRecord(a.project.id);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(a.project.id);
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[1.9, 12, 8]} />
      </mesh>
    </group>
  );
}

export function Relics() {
  const { interiorEnv, assets } = useWorld();
  const m = useMemo(() => makeMaterials(interiorEnv, assets.rock.color), [interiorEnv, assets]);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => () => Object.values(m).forEach((x) => x.dispose()), [m]);
  useEffect(() => {
    ui.set({ hoverId: hover });
    document.body.style.cursor = hover ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);
  return (
    <group>
      {ARCHIVE.map((a) => (
        <Relic key={a.project.id} a={a} m={m} hovered={hover === a.project.id} onHover={setHover} />
      ))}
    </group>
  );
}
