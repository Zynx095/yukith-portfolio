"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { useWorldResources } from "@/components/world/WorldResources";
import { ARTIFACTS, type ArtifactId } from "@/lib/world/archive";
import { getSigil, type SigilTone } from "@/lib/world/sigils";
import { ARCHIVE_SLOTS, slotPosition, spine, wallPoint, type ArchiveSlot } from "@/lib/world/tree";
import { FOCUS_STOPS, RELIC_RADIUS, relicLift } from "@/lib/world/journey";
import { TREE, TREE_GROUND } from "@/lib/world/layout";
import { buildTube, resampleCurve } from "@/lib/world/geometry";
import { frame, openArtifact, ui } from "@/lib/world/store";
import { createBarkMaterial } from "@/lib/world/materials";

/**
 * The archive: one relic per body of work, rising through the hollow of the
 * World Tree. Every relic is the same clean object — a medallion with a
 * polished gold rim, a glossy enamel field in the project's own colour, and
 * the project's sigil raised in gold on both faces — resting on a mount grown
 * from the tree itself. A soft light in the project's colour glows behind it.
 * Hover lifts it; a click (optional) opens its record.
 */

const FIELD_RADIUS = RELIC_RADIUS * 0.84;
const FIELD_HALF_DEPTH = 0.07;
const TONE_DEPTH: Record<SigilTone, number> = { gold: 5.5, accent: 4.0, dark: 2.0 };

/** Extrude a sigil into geometries grouped by tone, sized to sit inside the enamel field. */
function buildSigilGeometry(id: string) {
  const sigil = getSigil(id);
  const loader = new SVGLoader();
  const byTone = new Map<SigilTone, THREE.BufferGeometry[]>();
  const fit = (FIELD_RADIUS * 1.5) / Math.max(sigil.w, sigil.h);
  sigil.paths.forEach((p, index) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sigil.w} ${sigil.h}"><path d="${p.d}" fill="#000" fill-rule="evenodd"/></svg>`;
    const data = loader.parse(svg);
    const depth = (p.raise ?? TONE_DEPTH[p.tone] / 5.5) * 5.5 + index * 0.05;
    for (const path of data.paths) {
      const shapes = path.toShapes();
      const geo = new THREE.ExtrudeGeometry(shapes, {
        depth,
        bevelEnabled: true,
        bevelThickness: 1.0,
        bevelSize: 0.6,
        bevelSegments: 3,
        curveSegments: 18,
      });
      // SVG is y-down. Turn it over about X (a rotation, so faces keep their
      // winding), centre it, scale to world units, and stand it on z = 0.
      geo.translate(-sigil.w / 2, -sigil.h / 2, 0);
      geo.rotateX(Math.PI);
      geo.scale(fit, fit, fit);
      geo.computeBoundingBox();
      geo.translate(0, 0, -geo.boundingBox!.min.z);
      const list = byTone.get(p.tone) ?? [];
      list.push(geo);
      byTone.set(p.tone, list);
    }
  });
  const out = new Map<SigilTone, THREE.BufferGeometry>();
  byTone.forEach((list, tone) => {
    const merged = mergeExtrusions(list);
    list.forEach((g) => g.dispose());
    out.set(tone, merged);
  });
  return out;
}

function mergeExtrusions(list: THREE.BufferGeometry[]) {
  const nonIndexed = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = nonIndexed.reduce((n, g) => n + g.getAttribute("position").count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  let o = 0;
  for (const g of nonIndexed) {
    pos.set(g.getAttribute("position").array as Float32Array, o * 3);
    nor.set(g.getAttribute("normal").array as Float32Array, o * 3);
    o += g.getAttribute("position").count;
  }
  nonIndexed.forEach((g, i) => g !== list[i] && g.dispose());
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return merged;
}

// ─── The medallion ────────────────────────────────────────────────────────────

/** Gold rim: a raised, bevelled ring around the field (lathe profile, axis +Z). */
function rimGeometry() {
  const R = RELIC_RADIUS;
  const F = FIELD_RADIUS;
  const profile: [number, number][] = [
    [F, FIELD_HALF_DEPTH],
    [F + 0.03, 0.15],
    [F + 0.1, 0.19],
    [R - 0.07, 0.18],
    [R, 0.1],
    [R + 0.012, 0],
    [R, -0.1],
    [R - 0.07, -0.18],
    [F + 0.1, -0.19],
    [F + 0.03, -0.15],
    [F, -FIELD_HALF_DEPTH],
    [F, FIELD_HALF_DEPTH],
  ];
  const geo = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    96
  );
  geo.rotateX(Math.PI / 2);
  return geo;
}

/** Enamel field: a thin disc filling the rim, faces at z = ±FIELD_HALF_DEPTH. */
function fieldGeometry() {
  const geo = new THREE.CylinderGeometry(FIELD_RADIUS + 0.01, FIELD_RADIUS + 0.01, FIELD_HALF_DEPTH * 2, 96);
  geo.rotateX(Math.PI / 2);
  return geo;
}

// ─── Mounts grown from the tree itself ───────────────────────────────────────

function lathe(profile: [number, number][], segments = 32) {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments
  );
}

/** Carved plinth: flared root foot, slender stem, capital. Height ≈ 2.4. */
function plinthGeometry() {
  return lathe([
    [0.0, 0.0],
    [1.15, 0.0],
    [1.05, 0.18],
    [0.62, 0.45],
    [0.42, 0.9],
    [0.36, 1.6],
    [0.48, 2.05],
    [0.86, 2.22],
    [0.88, 2.36],
    [0.0, 2.38],
  ]);
}

/** Bracket fungus: a stack of half-discs growing out of the wall, flat side to the wood. */
function fungusGeometry() {
  const geos: THREE.BufferGeometry[] = [];
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const r = 3.2 - i * 0.55;
    const g = new THREE.CylinderGeometry(r, r * 0.92, 0.32, 40, 1, false, -Math.PI / 2, Math.PI);
    g.translate(0, -i * 0.38, 0);
    geos.push(g);
  }
  const top = new THREE.CylinderGeometry(3.25, 3.25, 0.06, 40, 1, false, -Math.PI / 2, Math.PI);
  top.translate(0, 0.17, 0);
  geos.push(top);
  const merged = mergeExtrusions(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}

/** Roots rising from the floor and curling up around the relic like cupped fingers. */
function rootCradleGeometries(slot: ArchiveSlot) {
  const base = slotPosition(slot);
  const out: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    const from = wallPoint(slot.theta + (k - 1.5) * 0.12, slot.y - 6, -1.5);
    const mid = base.clone().add(new THREE.Vector3(Math.cos(a) * 2.2, -2.6, Math.sin(a) * 2.2));
    const to = base.clone().add(new THREE.Vector3(Math.cos(a) * 1.25, 0.45, Math.sin(a) * 1.25));
    const pts = resampleCurve([from, mid, to], 24);
    out.push(buildTube({ points: pts, radii: pts.map((_, i) => THREE.MathUtils.lerp(0.9, 0.2, i / (pts.length - 1))), radialSegments: 9, vScale: 6, uRepeats: 1 }));
  }
  return out;
}

/** Fine root strands from above, holding the relic suspended in the air. */
function hangingStrands(slot: ArchiveSlot) {
  const base = slotPosition(slot);
  const lift = relicLift(slot.mount);
  const out: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const from = wallPoint(slot.theta + (k - 1) * 0.22, slot.y + 13, -1);
    const to = base.clone().add(new THREE.Vector3(Math.cos(a) * 0.5, lift + RELIC_RADIUS + 0.05, Math.sin(a) * 0.5));
    const mid = from.clone().lerp(to, 0.6).add(new THREE.Vector3(0, -1.2, 0));
    const pts = resampleCurve([from, mid, to], 20);
    out.push(buildTube({ points: pts, radii: pts.map(() => 0.12), radialSegments: 6, vScale: 6, uRepeats: 1 }));
  }
  return out;
}

// ─── A single relic ───────────────────────────────────────────────────────────

interface SharedResources {
  gold: THREE.MeshPhysicalMaterial;
  goldHover: THREE.MeshPhysicalMaterial;
  darkMetal: THREE.MeshPhysicalMaterial;
  wood: THREE.Material;
  polished: THREE.MeshPhysicalMaterial;
  fungus: THREE.MeshStandardMaterial;
  rimGeo: THREE.BufferGeometry;
  fieldGeo: THREE.BufferGeometry;
  plinthGeo: THREE.BufferGeometry;
  fungusGeo: THREE.BufferGeometry;
  glowGeo: THREE.BufferGeometry;
}

function glowMaterial(color: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: 0.5 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
      void main(){ float d = length(vUv * 2.0 - 1.0); float g = pow(max(0.0, 1.0 - d), 2.2); gl_FragColor = vec4(uColor * g * uStrength, 1.0); }`,
  });
}

function Relic({ id, slot, shared }: { id: ArtifactId; slot: ArchiveSlot; shared: SharedResources }) {
  const info = ARTIFACTS[id];
  const local = useMemo(() => slotPosition(slot), [slot]);
  const lift = relicLift(slot.mount);
  const sigil = useMemo(() => buildSigilGeometry(id), [id]);
  const own = useMemo(() => {
    const accent = new THREE.Color(info.accent);
    return {
      // Glossy enamel in a deep shade of the project's colour.
      enamel: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#0c0907").lerp(accent, 0.15),
        roughness: 0.32,
        metalness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMap: shared.gold.envMap,
        envMapIntensity: 1.5,
      }),
      accent: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.4, roughness: 0.3, metalness: 0.1 }),
      glow: glowMaterial(info.accent),
    };
  }, [info.accent, shared.gold.envMap]);
  const mounts = useMemo(() => {
    if (slot.mount === "roots") return rootCradleGeometries(slot);
    if (slot.mount === "suspended") return hangingStrands(slot);
    return [];
  }, [slot]);

  const group = useRef<THREE.Group>(null);
  const medallion = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const goldMeshes = useRef<THREE.Mesh[]>([]);
  const state = useMemo(() => ({ hover: 0, hovered: false, yaw: 0, toCam: new THREE.Vector3(), world: new THREE.Vector3() }), []);
  const stop = useMemo(() => FOCUS_STOPS.find((s) => s.id === id)!, [id]);

  useEffect(
    () => () => {
      sigil.forEach((g) => g.dispose());
      mounts.forEach((g) => g.dispose());
      own.enamel.dispose();
      own.accent.dispose();
      own.glow.dispose();
    },
    [sigil, mounts, own]
  );

  // Face the hall: the medallion's front looks back towards the trunk's axis.
  const baseYaw = useMemo(() => {
    const axis = spine(slot.y);
    return Math.atan2(axis.x - local.x, axis.y - local.z);
  }, [slot, local]);

  useFrame(({ camera }, dt) => {
    const g = group.current;
    if (!g || frame.progress < 0.46) return;
    const t = performance.now() / 1000;
    const near = Math.max(0, 1 - Math.abs(stop.progress - frame.progress) / 0.02);
    const focus = ui.get().focusId === id ? frame.focusNear : 0;
    state.hover += ((state.hovered ? 1 : 0) - state.hover) * (1 - Math.exp(-10 * dt));
    g.getWorldPosition(state.world);
    state.world.y += lift;
    state.toCam.copy(camera.position).sub(state.world);
    if (medallion.current) {
      medallion.current.position.y = lift + Math.sin(t * 0.9 + slot.y) * 0.08 + state.hover * 0.2;
      // Turn gently towards the camera as it settles in front of the relic.
      const camYaw = Math.atan2(state.toCam.x, state.toCam.z);
      const idle = baseYaw + Math.sin(t * 0.3 + slot.y) * 0.35;
      const target = THREE.MathUtils.lerp(idle, camYaw, Math.min(1, focus * 1.2 + near * 0.5));
      let d = target - state.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      state.yaw += d * (1 - Math.exp(-3 * dt));
      medallion.current.rotation.y = state.yaw;
      medallion.current.scale.setScalar(1 + state.hover * 0.05);
    }
    if (glowRef.current) {
      // Always just behind the medallion as seen from the camera.
      state.toCam.normalize();
      glowRef.current.position.set(-state.toCam.x * 0.35, lift - state.toCam.y * 0.35, -state.toCam.z * 0.35);
      glowRef.current.quaternion.copy(camera.quaternion);
      own.glow.uniforms.uStrength.value = 0.45 + near * 0.35 + state.hover * 0.4;
    }
    own.accent.emissiveIntensity = 2.0 + near * 1.0 + state.hover * 1.4;
    for (const m of goldMeshes.current) m.material = state.hover > 0.5 ? shared.goldHover : shared.gold;
  });

  const active = () => frame.interior > 0.5;
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!active()) return;
    e.stopPropagation();
    state.hovered = true;
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    state.hovered = false;
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!active()) return;
    e.stopPropagation();
    openArtifact(id);
  };

  const registerGold = (m: THREE.Mesh | null) => {
    if (m && !goldMeshes.current.includes(m)) goldMeshes.current.push(m);
  };
  const gold = sigil.get("gold");
  const acc = sigil.get("accent");
  const dark = sigil.get("dark");
  const sigilFace = (side: 1 | -1) => (
    <group position={[0, 0, side * FIELD_HALF_DEPTH]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
      {gold && <mesh geometry={gold} material={shared.gold} ref={registerGold} />}
      {acc && <mesh geometry={acc} material={own.accent} />}
      {dark && <mesh geometry={dark} material={shared.darkMetal} />}
    </group>
  );

  return (
    <group ref={group} position={local}>
      {slot.mount === "alcove" && <mesh geometry={shared.plinthGeo} material={shared.polished} castShadow receiveShadow />}
      {slot.mount === "fungus" && (
        <mesh geometry={shared.fungusGeo} material={shared.fungus} rotation={[0, baseYaw + Math.PI, 0]} position={[0, 0.2, 0]} receiveShadow castShadow />
      )}
      {mounts.map((g, i) => (
        <mesh key={i} geometry={g} material={shared.wood} position={[-local.x, -local.y, -local.z]} castShadow />
      ))}
      <group ref={medallion} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <mesh geometry={shared.rimGeo} material={shared.gold} ref={registerGold} castShadow />
        <mesh geometry={shared.fieldGeo} material={own.enamel} />
        {sigilFace(1)}
        {sigilFace(-1)}
      </group>
      <mesh ref={glowRef} geometry={shared.glowGeo} renderOrder={10} material={own.glow} />
    </group>
  );
}

export function Archive() {
  const { textures, interiorEnv } = useWorldResources();
  const shared = useMemo<SharedResources>(
    () => ({
      gold: new THREE.MeshPhysicalMaterial({
        color: "#e3b25a",
        metalness: 1,
        roughness: 0.2,
        envMap: interiorEnv,
        envMapIntensity: 2.4,
        // A whisper of warmth so the mark reads even where the hall is dim.
        emissive: new THREE.Color("#ffb347"),
        emissiveIntensity: 0.16,
      }),
      goldHover: new THREE.MeshPhysicalMaterial({
        color: "#f6cd73",
        metalness: 1,
        roughness: 0.14,
        envMap: interiorEnv,
        envMapIntensity: 2.8,
        emissive: new THREE.Color("#ffb347"),
        emissiveIntensity: 0.45,
      }),
      darkMetal: new THREE.MeshPhysicalMaterial({ color: "#1d1712", metalness: 0.7, roughness: 0.35, envMap: interiorEnv, envMapIntensity: 1.2 }),
      wood: createBarkMaterial(textures, {
        deep: "#1d0e06",
        mid: "#5e331a",
        ridge: "#a1683c",
        moss: "#55502a",
        mossAmount: 0.15,
        ground: TREE_GROUND,
        envMap: interiorEnv,
        envMapIntensity: 1.2,
        glow: 1.6,
        glowColor: "#ffb547",
        glowFrom: -100,
        glowTo: -99,
      }),
      // Carved, oiled heartwood for the plinths.
      polished: new THREE.MeshPhysicalMaterial({ color: "#3b2414", roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3, envMap: interiorEnv, envMapIntensity: 1.3 }),
      fungus: new THREE.MeshStandardMaterial({ color: "#c9a274", roughness: 0.78, envMap: interiorEnv, envMapIntensity: 1.1 }),
      rimGeo: rimGeometry(),
      fieldGeo: fieldGeometry(),
      plinthGeo: plinthGeometry(),
      fungusGeo: fungusGeometry(),
      glowGeo: new THREE.PlaneGeometry(RELIC_RADIUS * 3.8, RELIC_RADIUS * 3.8),
    }),
    [textures, interiorEnv]
  );

  useEffect(
    () => () => {
      Object.values(shared).forEach((m) => (m as { dispose?: () => void }).dispose?.());
    },
    [shared]
  );

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) groupRef.current.visible = frame.progress > 0.46;
  });

  return (
    <group ref={groupRef} position={[TREE.x, TREE_GROUND, TREE.z]}>
      {ARCHIVE_SLOTS.map((slot) => (
        <Relic key={slot.id} id={slot.id} slot={slot} shared={shared} />
      ))}
    </group>
  );
}
