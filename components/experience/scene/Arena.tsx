"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { ARENA, ARENA_SPOTS } from "@/lib/world/regions";
import { RANKS, TOURNAMENTS } from "@/src/data/gaming";
import { makeLevelsPanel, makeRankPanel } from "@/lib/world/emblemCanvas";
import { makeSignTexture } from "@/lib/world/labelTexture";
import { registerTags } from "@/lib/world/tags";
import { shared } from "@/lib/world/materials";
import { frame, openRecord, ui } from "@/lib/world/store";
import { Glows, type GlowPoint } from "./Glows";

/**
 * The arena: a sealed hall away from the valley, entered through the gate at
 * the back of the hackathon district. Dark steel, strip lights, a central
 * stage under a ring of screens; three chambers for Valorant, CS:GO and
 * Mobile Legends, each with an original emblem panel and sculpture; the AMD
 * tournament trophy at the front of the stage; a wall of competitive levels;
 * and a booth where the aim trainer starts. Rendered only while the camera is
 * inside (the valley is hidden meanwhile).
 */

const O = ARENA.origin;
const at = (x: number, y: number, z: number) => new THREE.Vector3(O.x + x, O.y + y, O.z + z);

function makeMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ color: "#14161a", metalness: 0.55, roughness: 0.32 }),
    wall: new THREE.MeshStandardMaterial({ color: "#1c1f25", metalness: 0.7, roughness: 0.42 }),
    rib: new THREE.MeshStandardMaterial({ color: "#2a2e36", metalness: 0.85, roughness: 0.3 }),
    ceiling: new THREE.MeshStandardMaterial({ color: "#0d0e11", metalness: 0.3, roughness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: "#8d939c", metalness: 1, roughness: 0.25 }),
    brushed: new THREE.MeshStandardMaterial({ color: "#c7c9cc", metalness: 1, roughness: 0.18 }),
    dark: new THREE.MeshStandardMaterial({ color: "#0a0b0d", metalness: 0.4, roughness: 0.55 }),
    strip: new THREE.MeshBasicMaterial({ color: new THREE.Color("#dfe7ff").multiplyScalar(1.6), toneMapped: false }),
    red: new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8465a").multiplyScalar(2.2), toneMapped: false }),
    redSoft: new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8465a").multiplyScalar(0.7), toneMapped: false }),
    crimson: new THREE.MeshPhysicalMaterial({ color: "#c2243c", metalness: 0.1, roughness: 0.12, clearcoat: 1, emissive: new THREE.Color("#4a0812") }),
    gold: new THREE.MeshStandardMaterial({ color: "#d9b25e", metalness: 1, roughness: 0.22 }),
    blue: new THREE.MeshPhysicalMaterial({ color: "#3d57c4", metalness: 0.6, roughness: 0.2, clearcoat: 1 }),
    screen: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
  };
}
type Mats = ReturnType<typeof makeMaterials>;

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const put = (g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, p: THREE.Vector3, ry = 0) => {
  const o = new THREE.Mesh(geo, m);
  o.position.copy(p);
  o.rotation.y = ry;
  g.add(o);
  return o;
};

/** The hall: floor, walls with ribs and light strips, ceiling, light ring, entrance. */
function hall(root: THREE.Group, m: Mats) {
  const { halfW: W, halfD: D, height: H } = ARENA;
  put(root, box(W * 2, 0.2, D * 2), m.floor, at(0, -0.1, 0));
  put(root, box(W * 2, 0.2, D * 2), m.ceiling, at(0, H, 0));
  // Walls.
  put(root, box(W * 2, H, 0.4), m.wall, at(0, H / 2, -D));
  put(root, box(W * 2, H, 0.4), m.wall, at(0, H / 2, D));
  put(root, box(0.4, H, D * 2), m.wall, at(-W, H / 2, 0));
  put(root, box(0.4, H, D * 2), m.wall, at(W, H / 2, 0));
  // Ribs and horizontal light strips.
  const rib = box(0.5, H, 0.6);
  for (let x = -W + 3; x < W; x += 4) {
    put(root, rib, m.rib, at(x, H / 2, -D + 0.4));
    put(root, rib, m.rib, at(x, H / 2, D - 0.4));
  }
  for (let z = -D + 3; z < D; z += 4) {
    put(root, rib, m.rib, at(-W + 0.4, H / 2, z), Math.PI / 2);
    put(root, rib, m.rib, at(W - 0.4, H / 2, z), Math.PI / 2);
  }
  for (const y of [1.2, H - 1.6]) {
    put(root, box(W * 2 - 1, 0.05, 0.05), y < 2 ? m.redSoft : m.strip, at(0, y, -D + 0.75));
    put(root, box(0.05, 0.05, D * 2 - 1), y < 2 ? m.redSoft : m.strip, at(-W + 0.75, y, 0));
    put(root, box(0.05, 0.05, D * 2 - 1), y < 2 ? m.redSoft : m.strip, at(W - 0.75, y, 0));
  }
  // Ceiling light bars.
  for (const x of [-12, -6, 6, 12]) put(root, box(0.18, 0.08, D * 2 - 4), m.strip, at(x, H - 0.1, 0));
  // Floor inlay: rings round the stage and lanes to the chambers.
  const ring = new THREE.Mesh(new THREE.RingGeometry(8.6, 8.75, 96), m.red);
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(at(0, 0.01, -1));
  root.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(10.2, 10.26, 96), m.redSoft);
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.copy(at(0, 0.01, -1));
  root.add(ring2);
  // Entrance: a dark doorway with a red frame.
  put(root, box(5.2, 9.6, 0.2), m.dark, at(0, 4.8, D - 0.15));
  for (const x of [-2.6, 2.6]) put(root, box(0.06, 9.4, 0.06), m.red, at(x, 4.9, D - 0.3));
  put(root, box(5.2, 0.06, 0.06), m.red, at(0, 9.6, D - 0.3));
}

/** The stage and the ring of screens above it. */
function stage(root: THREE.Group, m: Mats, screens: THREE.Texture) {
  const c = ARENA_SPOTS.stage;
  const s = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.3, 0.6, 64), m.floor);
  s.position.copy(c).add(new THREE.Vector3(0, 0.3, 0));
  root.add(s);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(7.02, 0.04, 6, 96), m.red);
  edge.rotation.x = Math.PI / 2;
  edge.position.copy(c).add(new THREE.Vector3(0, 0.61, 0));
  root.add(edge);
  // Four curved screens hung in a ring.
  const tex = screens;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide });
  for (let k = 0; k < 4; k++) {
    const g = new THREE.CylinderGeometry(6, 6, 3.2, 32, 1, true, k * (Math.PI / 2) + 0.12, Math.PI / 2 - 0.24);
    const o = new THREE.Mesh(g, mat);
    o.position.copy(c).add(new THREE.Vector3(0, 9.6, 0));
    root.add(o);
  }
  const ringBeam = new THREE.Mesh(new THREE.TorusGeometry(6.1, 0.12, 8, 96), m.steel);
  ringBeam.rotation.x = Math.PI / 2;
  ringBeam.position.copy(c).add(new THREE.Vector3(0, 11.3, 0));
  root.add(ringBeam);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    put(root, box(0.04, 3.7, 0.04), m.steel, c.clone().add(new THREE.Vector3(Math.cos(a) * 6.1, 13.15, Math.sin(a) * 6.1)));
  }
  return mat;
}

/** The AMD tournament trophy: an original faceted trophy with its placement plate. */
function amdTrophy(root: THREE.Group, m: Mats, plate: THREE.Texture) {
  const p = ARENA_SPOTS.amd;
  const g = new THREE.Group();
  g.position.copy(p).add(new THREE.Vector3(0, -1.6, 0));
  put(g, new THREE.CylinderGeometry(0.85, 1.0, 1.1, 6), m.dark, new THREE.Vector3(0, 0.55, 0));
  put(g, new THREE.CylinderGeometry(0.9, 0.9, 0.05, 6), m.red, new THREE.Vector3(0, 1.12, 0));
  const plateMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: plate, toneMapped: false }));
  plateMesh.position.set(0, 0.58, 0.98);
  g.add(plateMesh);
  // Body: a tapered prism with a split crown.
  put(g, new THREE.CylinderGeometry(0.16, 0.28, 0.5, 6), m.brushed, new THREE.Vector3(0, 1.4, 0));
  put(g, new THREE.CylinderGeometry(0.5, 0.18, 0.9, 6), m.brushed, new THREE.Vector3(0, 2.1, 0));
  for (const s of [-1, 1]) {
    const fin = put(g, box(0.06, 0.8, 0.4), m.steel, new THREE.Vector3(s * 0.52, 2.2, 0));
    fin.rotation.z = s * 0.35;
  }
  put(g, new THREE.OctahedronGeometry(0.22, 0), m.red, new THREE.Vector3(0, 2.75, 0));
  root.add(g);
}

/** A chamber: back panel with the rank display, side fins, and a sculpture of the emblem. */
function chamber(root: THREE.Group, m: Mats, center: THREE.Vector3, facing: number, panel: THREE.Texture, kind: "immortal" | "eagle" | "grandmaster") {
  const g = new THREE.Group();
  g.position.copy(center).add(new THREE.Vector3(0, -3.6, 0));
  g.rotation.y = facing;
  put(g, box(7, 9, 0.5), m.wall, new THREE.Vector3(0, 4.5, -1.2));
  for (const x of [-3.6, 3.6]) put(g, box(0.4, 9, 3.2), m.rib, new THREE.Vector3(x, 4.5, 0.2));
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 5.75), new THREE.MeshBasicMaterial({ map: panel, toneMapped: false }));
  disp.position.set(0, 5.1, -0.9);
  g.add(disp);
  put(g, box(5, 0.06, 0.06), kind === "immortal" ? m.red : m.strip, new THREE.Vector3(0, 8.2, -0.85));
  // Sculpture on a pedestal in front.
  put(g, new THREE.CylinderGeometry(0.55, 0.65, 1.0, 24), m.dark, new THREE.Vector3(0, 0.5, 1.6));
  const sculpt = new THREE.Group();
  sculpt.position.set(0, 1.7, 1.6);
  sculpt.name = "spin";
  if (kind === "immortal") {
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), m.crimson);
    c.scale.set(0.8, 1.3, 0.8);
    sculpt.add(c);
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), m.crimson);
      const a = (i / 5) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.55, 0.45, Math.sin(a) * 0.55);
      s.scale.set(0.6, 1.6, 0.6);
      sculpt.add(s);
    }
  } else if (kind === "eagle") {
    const wing = new THREE.Shape();
    wing.moveTo(0, 0);
    wing.bezierCurveTo(-0.4, 0.4, -0.9, 0.5, -1.4, 0.4);
    wing.bezierCurveTo(-1.0, 0.2, -0.9, 0.0, -0.8, -0.2);
    wing.bezierCurveTo(-1.1, -0.2, -1.3, -0.3, -1.4, -0.4);
    wing.bezierCurveTo(-0.9, -0.5, -0.5, -0.5, -0.2, -0.6);
    wing.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(wing, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(geo, m.gold);
      w.scale.set(s * 0.55, 0.55, 1);
      sculpt.add(w);
    }
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), m.brushed);
    star.position.y = -0.05;
    sculpt.add(star);
  } else {
    const shield = new THREE.Shape();
    shield.moveTo(0, 0.6);
    shield.lineTo(0.5, 0.42);
    shield.lineTo(0.45, -0.1);
    shield.quadraticCurveTo(0.35, -0.45, 0, -0.65);
    shield.quadraticCurveTo(-0.35, -0.45, -0.45, -0.1);
    shield.lineTo(-0.5, 0.42);
    shield.lineTo(0, 0.6);
    const s = new THREE.Mesh(new THREE.ExtrudeGeometry(shield, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }), m.blue);
    s.position.z = -0.06;
    sculpt.add(s);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.03, 8, 48, Math.PI * 1.2), m.gold);
    rim.rotation.z = -Math.PI * 0.1 - Math.PI;
    sculpt.add(rim);
  }
  g.add(sculpt);
  root.add(g);
  return sculpt;
}

/** The aim-trainer booth: desk, monitor, chair and a sign. */
function booth(root: THREE.Group, m: Mats, monitor: THREE.Texture, sign: THREE.Texture) {
  const p = ARENA_SPOTS.booth;
  const g = new THREE.Group();
  g.position.copy(p).add(new THREE.Vector3(0, -1.5, 0));
  g.rotation.y = -Math.PI / 2 + 0.35;
  put(g, box(2.6, 0.08, 1.2), m.dark, new THREE.Vector3(0, 0.95, 0));
  for (const x of [-1.2, 1.2]) put(g, box(0.08, 0.95, 1.0), m.steel, new THREE.Vector3(x, 0.47, 0));
  put(g, box(1.5, 0.86, 0.05), m.dark, new THREE.Vector3(0, 1.75, -0.35));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.8), new THREE.MeshBasicMaterial({ map: monitor, toneMapped: false }));
  scr.position.set(0, 1.75, -0.32);
  g.add(scr);
  put(g, box(0.1, 0.4, 0.1), m.steel, new THREE.Vector3(0, 1.18, -0.38));
  put(g, box(0.45, 0.03, 0.15), m.dark, new THREE.Vector3(0.1, 1.0, 0.15));
  put(g, box(0.07, 0.03, 0.11), m.steel, new THREE.Vector3(0.6, 1.0, 0.2));
  // Chair.
  put(g, box(0.6, 0.08, 0.6), m.dark, new THREE.Vector3(0, 0.55, 0.9));
  put(g, box(0.6, 0.8, 0.08), m.dark, new THREE.Vector3(0, 1.0, 1.2));
  put(g, new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), m.steel, new THREE.Vector3(0, 0.27, 0.9));
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: sign, toneMapped: false }));
  signMesh.position.set(0, 3.1, -0.6);
  g.add(signMesh);
  root.add(g);
}

/** Animated canvas for the screen ring: slow bars and sweeping lines (no logos). */
function makeScreenTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  const draw = (t: number) => {
    ctx.fillStyle = "#06070a";
    ctx.fillRect(0, 0, 1024, 256);
    for (let i = 0; i < 64; i++) {
      const h = 40 + 80 * (0.5 + 0.5 * Math.sin(i * 0.7 + t * 1.3));
      ctx.fillStyle = i % 9 === 0 ? "rgba(232,70,90,0.9)" : "rgba(170,190,230,0.35)";
      ctx.fillRect(i * 16 + 2, 256 - h - 20, 10, h);
    }
    ctx.fillStyle = "rgba(232,70,90,0.8)";
    ctx.fillRect(((t * 140) % 1200) - 100, 0, 3, 256);
    ctx.fillStyle = "rgba(239,231,218,0.9)";
    ctx.font = "600 44px ui-monospace, monospace";
    ctx.fillText("ARENA", 40, 70);
    tex.needsUpdate = true;
  };
  draw(0);
  return { tex, draw };
}

export function Arena() {
  const group = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const m = makeMaterials();
    const root = new THREE.Group();
    hall(root, m);
    const screens = makeScreenTexture();
    stage(root, m, screens.tex);
    const amd = TOURNAMENTS.find((t) => t.id === "amd-valorant")!;
    const plate = makeSignTexture("4th place", amd.title, { width: 512, height: 256, paper: "#0a0b0d", accent: "#e8465a" });
    amdTrophy(root, m, plate);
    const panels = RANKS.map((r) => makeRankPanel(r.emblem, r.game, r.rank, r.note, r.accent));
    const sculptures = [
      chamber(root, m, ARENA_SPOTS.valorant, 0, panels[0], "immortal"),
      chamber(root, m, ARENA_SPOTS.csgo, Math.PI / 2 - 0.55, panels[1], "eagle"),
      chamber(root, m, ARENA_SPOTS.mlbb, -Math.PI / 2 + 0.55, panels[2], "grandmaster"),
    ];
    const levels = makeLevelsPanel("Competitive levels — not a timeline", [
      { title: "School", line: "Tournaments won" },
      { title: "College", line: "Tournaments won" },
      { title: "AMD", line: "4th · Valorant" },
      { title: "Ranked", line: "Immortal 1 · LE · GM" },
    ]);
    const levelsMesh = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.9), new THREE.MeshBasicMaterial({ map: levels, toneMapped: false }));
    levelsMesh.position.copy(ARENA_SPOTS.wall).add(new THREE.Vector3(0.3, 0, 1.5));
    levelsMesh.rotation.y = Math.PI / 2;
    root.add(levelsMesh);
    const monitor = makeSignTexture("Aim trainer", "Click to play", { width: 768, height: 432, paper: "#0b0c10", accent: "#e8465a" });
    const sign = makeSignTexture("Training booth", "Portfolio mini-game", { width: 768, height: 384, paper: "#0b0c10", accent: "#e8465a" });
    booth(root, m, monitor, sign);
    // Hit targets for clicks (invisible), one per exhibit.
    const hits: [string, THREE.Vector3, [number, number, number]][] = [
      ["amd-valorant", ARENA_SPOTS.amd, [2, 3.4, 2]],
      ["valorant-rank", ARENA_SPOTS.valorant, [5, 7, 3]],
      ["csgo-rank", ARENA_SPOTS.csgo, [5, 7, 3]],
      ["mlbb-rank", ARENA_SPOTS.mlbb, [5, 7, 3]],
      ["school-valorant", ARENA_SPOTS.wall.clone().add(new THREE.Vector3(0.4, 0, 4.5)), [0.5, 4, 3.2]],
      ["college-valorant", ARENA_SPOTS.wall.clone().add(new THREE.Vector3(0.4, 0, -1.5)), [0.5, 4, 3.2]],
      ["aim", ARENA_SPOTS.booth.clone().add(new THREE.Vector3(0, 0.5, 0)), [3, 3.2, 3]],
    ];
    const invisible = new THREE.MeshBasicMaterial({ visible: false });
    for (const [id, p, [w, h, d]] of hits) {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), invisible);
      o.position.copy(p);
      o.userData.id = id;
      root.add(o);
    }
    const glows: GlowPoint[] = [
      { position: ARENA_SPOTS.amd.clone().add(new THREE.Vector3(0, 1.2, 0)), size: 2.2, color: "#e8465a", night: 0, pulse: 0.3 },
      ...[ARENA_SPOTS.valorant, ARENA_SPOTS.csgo, ARENA_SPOTS.mlbb].map((p, i) => ({ position: p.clone().add(new THREE.Vector3(0, -1.9, 0)), size: 3.2, color: RANKS[i].accent, night: 0, pulse: i })),
    ];
    return { m, root, screens, sculptures, glows, textures: [screens.tex, plate, ...panels, levels, monitor, sign] };
  }, []);

  useEffect(() => {
    const unregister = registerTags([
      ...RANKS.map((r, i) => ({ id: r.id, title: `${r.game} · ${r.rank}`, position: [ARENA_SPOTS.valorant, ARENA_SPOTS.csgo, ARENA_SPOTS.mlbb][i].clone().add(new THREE.Vector3(0, 4.4, 0)), near: 26, region: "arena" as const })),
      { id: "amd-valorant", title: "AMD Valorant tournament · 4th", position: ARENA_SPOTS.amd.clone().add(new THREE.Vector3(0, 1.8, 0)), near: 24, region: "arena" },
      { id: "aim", title: "Aim trainer · play", position: ARENA_SPOTS.booth.clone().add(new THREE.Vector3(0, 2.6, 0)), near: 26, region: "arena" },
    ]);
    return () => {
      unregister();
      res.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => mm.dispose());
        }
      });
      Object.values(res.m).forEach((mm) => mm.dispose());
      res.textures.forEach((t) => t.dispose());
    };
  }, [res]);

  const acc = useRef(0);
  useFrame((_, dt) => {
    const inside = frame.pocket > 0.5;
    if (group.current) group.current.visible = inside;
    if (!inside) return;
    res.sculptures.forEach((s, i) => (s.rotation.y += dt * (0.35 + i * 0.05)));
    acc.current += dt;
    if (acc.current > 1 / 20) {
      acc.current = 0;
      res.screens.draw(shared.uTime.value);
    }
  });

  const findId = (o: THREE.Object3D | null): string | undefined => {
    while (o) {
      if (o.userData.id) return o.userData.id as string;
      o = o.parent;
    }
    return undefined;
  };

  return (
    <group
      ref={group}
      visible={false}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        const id = findId(e.object);
        if (id && frame.pocket) {
          e.stopPropagation();
          openRecord(id);
        }
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        const id = findId(e.object);
        if (id && frame.pocket) {
          e.stopPropagation();
          ui.set({ hoverId: id });
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        ui.set({ hoverId: null });
        document.body.style.cursor = "";
      }}
    >
      <primitive object={res.root} />
      <Glows points={res.glows} />
    </group>
  );
}
