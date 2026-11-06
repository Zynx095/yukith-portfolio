"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { ARENA_GATE, DISTRICT, DISTRICT_EXHIBITS } from "@/lib/world/regions";
import { EVENTS, type EventRecord } from "@/src/data/events";
import { terrainHeight } from "@/lib/world/layout";
import { createBarkMaterial } from "@/lib/world/materials";
import { createRng, range } from "@/lib/world/noise";
import { makeSignTexture } from "@/lib/world/labelTexture";
import { registerTags } from "@/lib/world/tags";
import { frame, openRecord, ui } from "@/lib/world/store";
import { Glows, type GlowPoint } from "./Glows";
import { useWorld } from "./WorldContext";

/**
 * The hackathon district: an open-air exhibition in a clearing beside the
 * trail. Results stand as trophies under a timber pavilion at the centre; the
 * organising roles hang as banners at the gate; every event taken part in has
 * its own artifact round the ring, shaped by its domain — a prototype bench
 * for hardware, a lattice installation for AI, a terminal for security, a
 * circuit sculpture for quantum, a data wall for a datathon. Every artifact
 * opens its record.
 */

type Mats = ReturnType<typeof makeMaterials>;

function makeMaterials(assets: ReturnType<typeof useWorld>["assets"]) {
  const stone = new THREE.MeshStandardMaterial({ map: assets.rock.color, normalMap: assets.rock.normal, color: "#b8ab9c", roughness: 0.9 });
  const paving = new THREE.MeshStandardMaterial({ map: assets.rock.color, normalMap: assets.rock.normal, color: "#8f8579", roughness: 0.95 });
  const timber = createBarkMaterial(assets, { ground: -1000, moss: 0.05, brightness: 1.25, tint: "#e8d2b4" });
  const plank = new THREE.MeshStandardMaterial({ color: "#7a5a3c", roughness: 0.8 });
  const darkWood = new THREE.MeshStandardMaterial({ color: "#3d2b1e", roughness: 0.75 });
  const gold = new THREE.MeshStandardMaterial({ color: "#d8aa52", metalness: 1, roughness: 0.28 });
  const silver = new THREE.MeshStandardMaterial({ color: "#c9ccd1", metalness: 1, roughness: 0.3 });
  const bronze = new THREE.MeshStandardMaterial({ color: "#8a6440", metalness: 1, roughness: 0.42 });
  const steel = new THREE.MeshStandardMaterial({ color: "#3b4047", metalness: 0.9, roughness: 0.38 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#cfe8ff", metalness: 0, roughness: 0.05, transmission: 0.0, transparent: true, opacity: 0.38, clearcoat: 1 });
  const pcb = new THREE.MeshStandardMaterial({ color: "#1f5a3a", roughness: 0.55, metalness: 0.2 });
  const chip = new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.4 });
  const screen = new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(1.3), toneMapped: false });
  const ember = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb066").multiplyScalar(1.6), toneMapped: false });
  const signal = new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(2.2), toneMapped: false });
  const red = new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8465a").multiplyScalar(2), toneMapped: false });
  const cloth = new THREE.MeshStandardMaterial({ color: "#efe7da", roughness: 0.9, side: THREE.DoubleSide });
  return { stone, paving, timber, plank, darkWood, gold, silver, bronze, steel, glass, pcb, chip, screen, ember, signal, red, cloth };
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
};

/** A turned trophy cup (lathe). */
function cup(mat: THREE.Material, h = 1.2) {
  const pts = [
    [0, 0],
    [0.32, 0],
    [0.32, 0.06],
    [0.12, 0.14],
    [0.07, 0.4],
    [0.1, 0.48],
    [0.32, 0.62],
    [0.38, 0.9],
    [0.36, 1.0],
    [0.3, 1.0],
  ].map(([r, y]) => new THREE.Vector2(r, y * h));
  return new THREE.LatheGeometry(pts, 40);
}

// ─── Trophies (results) ──────────────────────────────────────────────────────

function trophy(e: EventRecord, m: Mats) {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.55, 0.65, 1.05, 8), m.stone, 0, 0.52, 0));
  g.add(mesh(cyl(0.6, 0.6, 0.06, 8), m.bronze, 0, 1.07, 0));
  const top = 1.1;
  switch (e.id) {
    case "sih-2025": {
      const c = mesh(cup(m.gold, 1.15), m.gold, 0, top, 0);
      g.add(c);
      for (const s of [-1, 1]) {
        const handle = mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 24, Math.PI), m.gold, s * 0.42, top + 0.78, 0);
        handle.rotation.z = (s * Math.PI) / 2;
        g.add(handle);
      }
      break;
    }
    case "nirmith-2026": {
      g.add(mesh(cyl(0.06, 0.1, 0.9), m.silver, 0, top + 0.45, 0));
      const star = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.17 : 0.42;
        const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const s = mesh(new THREE.ExtrudeGeometry(star, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), m.silver, 0, top + 1.25, -0.04);
      g.add(s);
      break;
    }
    case "innovatex-hardware-hackathon": {
      // A gear on a column — the hardware hackathon.
      const gear = new THREE.Shape();
      const teeth = 12;
      for (let i = 0; i <= teeth * 2; i++) {
        const r = i % 2 ? 0.36 : 0.46;
        const a0 = (i / (teeth * 2)) * Math.PI * 2;
        const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
        if (i === 0) gear.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
        gear.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
        gear.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      }
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.14, 0, Math.PI * 2, true);
      gear.holes.push(hole);
      g.add(mesh(cyl(0.07, 0.12, 0.6), m.silver, 0, top + 0.3, 0));
      g.add(mesh(new THREE.ExtrudeGeometry(gear, { depth: 0.1, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }), m.silver, 0, top + 1.05, -0.05));
      break;
    }
    case "innovatex-hardware-expo": {
      // A circuit plaque on an easel — the hardware expo.
      const plaque = mesh(box(0.9, 0.62, 0.04), m.pcb, 0, top + 0.75, 0);
      plaque.rotation.x = -0.18;
      g.add(plaque);
      for (let i = 0; i < 6; i++) {
        const c = mesh(box(0.12, 0.12, 0.03), m.chip, -0.3 + (i % 3) * 0.3, top + 0.62 + Math.floor(i / 3) * 0.24, 0.04);
        c.rotation.x = -0.18;
        g.add(c);
      }
      g.add(mesh(box(0.96, 0.05, 0.08), m.silver, 0, top + 0.42, 0.04));
      g.add(mesh(box(0.05, 0.5, 0.05), m.silver, 0, top + 0.22, -0.12));
      break;
    }
    default: {
      // Prompt Wars — a cut crystal.
      g.add(mesh(cyl(0.22, 0.28, 0.16, 6), m.silver, 0, top + 0.08, 0));
      const crystal = mesh(new THREE.OctahedronGeometry(0.42, 0), m.glass, 0, top + 0.65, 0);
      crystal.scale.set(0.7, 1.25, 0.7);
      g.add(crystal);
      g.add(mesh(new THREE.OctahedronGeometry(0.12, 0), m.signal, 0, top + 0.65, 0));
    }
  }
  return g;
}

// ─── Ring artifacts (participation), by domain ──────────────────────────────

/** Low stone plinth with a timber back frame: every ring booth starts from this. */
function booth(m: Mats) {
  const g = new THREE.Group();
  g.add(mesh(box(2.2, 0.5, 1.6), m.stone, 0, 0.25, 0));
  for (const x of [-1.15, 1.15]) g.add(mesh(cyl(0.07, 0.08, 2.8, 8), m.darkWood, x, 1.4, -0.75));
  g.add(mesh(box(2.5, 0.12, 0.14), m.darkWood, 0, 2.8, -0.75));
  return g;
}

function hardwareBench(m: Mats, g: THREE.Group) {
  g.add(mesh(box(1.5, 0.06, 0.9), m.plank, 0, 0.98, 0));
  for (const [x, z] of [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]]) g.add(mesh(box(0.06, 0.48, 0.06), m.darkWood, x, 0.74, z));
  g.add(mesh(box(0.8, 0.04, 0.55), m.pcb, -0.1, 1.03, 0));
  for (let i = 0; i < 5; i++) g.add(mesh(box(0.14, 0.05, 0.14), m.chip, -0.4 + i * 0.16, 1.07, -0.1 + (i % 2) * 0.18));
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.SphereGeometry(0.025, 8, 8), i % 2 ? m.ember : m.signal, 0.15 + i * 0.06, 1.07, 0.2));
  // A small servo arm.
  g.add(mesh(cyl(0.08, 0.1, 0.12), m.steel, 0.5, 1.08, -0.1));
  const arm = mesh(box(0.06, 0.5, 0.06), m.steel, 0.5, 1.35, -0.1);
  arm.rotation.z = 0.5;
  g.add(arm);
}

function lattice(m: Mats, g: THREE.Group, seed: number) {
  // Layers of nodes joined by thin links: an AI installation in a glass case.
  const rng = createRng(seed);
  const layers = [4, 6, 6, 3];
  const nodes: THREE.Vector3[][] = layers.map((n, li) =>
    Array.from({ length: n }, (_, i) => new THREE.Vector3(-0.6 + li * 0.4, 1.0 + (i - (n - 1) / 2) * 0.16, range(rng, -0.12, 0.12)))
  );
  const nodeGeo = new THREE.SphereGeometry(0.04, 10, 10);
  nodes.flat().forEach((p, i) => g.add(mesh(nodeGeo, i % 5 === 0 ? m.ember : m.signal, p.x, p.y + 0.4, p.z)));
  const pts: number[] = [];
  for (let l = 0; l < nodes.length - 1; l++) for (const a of nodes[l]) for (const b of nodes[l + 1]) if (rng() < 0.55) pts.push(a.x, a.y + 0.4, a.z, b.x, b.y + 0.4, b.z);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(0.9), transparent: true, opacity: 0.5 })));
  const caseMesh = mesh(box(1.7, 1.3, 0.7), m.glass, 0, 1.4, 0);
  caseMesh.castShadow = false;
  g.add(caseMesh);
  g.add(mesh(box(1.8, 0.08, 0.8), m.steel, 0, 0.74, 0));
}

function codePanels(m: Mats, g: THREE.Group) {
  for (let i = 0; i < 4; i++) {
    const p = mesh(box(0.9, 0.55, 0.03), m.steel, -0.3 + i * 0.2, 1.1 + i * 0.22, -0.2 + i * 0.12);
    p.rotation.y = -0.25;
    g.add(p);
    for (let k = 0; k < 4; k++) {
      const line = mesh(box(0.25 + ((k * 37 + i * 11) % 40) / 100, 0.025, 0.01), k % 3 ? m.screen : m.ember, -0.38 + i * 0.2 + (k % 2) * 0.05, 1.22 + i * 0.22 - k * 0.09, -0.18 + i * 0.12);
      line.rotation.y = -0.25;
      g.add(line);
    }
  }
}

function phoneReceipt(m: Mats, g: THREE.Group) {
  // FairShift: a phone on a stand, a signed receipt curling out of it, a QR tile.
  const phone = mesh(box(0.42, 0.82, 0.05), m.chip, 0, 1.45, 0);
  phone.rotation.x = -0.15;
  g.add(phone);
  const scr = mesh(box(0.36, 0.72, 0.01), m.screen, 0, 1.45, 0.03);
  scr.rotation.x = -0.15;
  g.add(scr);
  const receipt = mesh(box(0.28, 0.6, 0.008), m.cloth, 0.42, 1.18, 0.12);
  receipt.rotation.set(-0.3, -0.4, 0.1);
  g.add(receipt);
  for (let i = 0; i < 16; i++) if ((i * 7) % 3) g.add(mesh(box(0.06, 0.06, 0.02), m.chip, -0.55 + (i % 4) * 0.07, 1.05 + Math.floor(i / 4) * 0.07, 0.1));
  g.add(mesh(box(0.06, 0.6, 0.06), m.steel, 0, 0.86, -0.05));
}

/** A child group that turns slowly (see the frame loop). */
function spinner(g: THREE.Group) {
  const s = new THREE.Group();
  s.name = "spin";
  g.add(s);
  return s;
}

function filmLoop(m: Mats, g0: THREE.Group) {
  // AI video: a ribbon of frames turning in a loop.
  const g = spinner(g0);
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const f = mesh(box(0.34, 0.24, 0.02), i % 3 === 0 ? m.ember : m.screen, Math.cos(a) * 0.55, 1.5 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.55);
    f.lookAt(0, f.position.y, 0);
    g.add(f);
  }
  g0.add(mesh(cyl(0.05, 0.05, 0.9), m.steel, 0, 1.0, 0));
}

function globeOrbit(m: Mats, g0: THREE.Group) {
  const g = spinner(g0);
  g.add(mesh(new THREE.IcosahedronGeometry(0.38, 2), m.glass, 0, 1.55, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(0.3, 1), m.pcb, 0, 1.55, 0));
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.015, 8, 64), m.signal, 0, 1.55, 0);
  ring.rotation.set(1.2, 0.3, 0);
  g.add(ring);
  g0.add(mesh(cyl(0.05, 0.07, 0.6), m.steel, 0, 0.95, 0));
}

function agentCore(m: Mats, g0: THREE.Group) {
  // Agents: a core with orbiting agents linked to it (Fetch-A-Thon / WARDEN).
  const g = spinner(g0);
  g.add(mesh(new THREE.OctahedronGeometry(0.22, 0), m.gold, 0, 1.55, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * 0.62, 1.55 + Math.sin(a * 2) * 0.18, Math.sin(a) * 0.62);
    g.add(mesh(new THREE.SphereGeometry(0.07, 12, 12), m.signal, p.x, p.y, p.z));
    const link = mesh(cyl(0.008, 0.008, p.length() * 0.95, 4), m.signal, p.x / 2, (p.y + 1.55) / 2, p.z / 2);
    link.lookAt(0, 1.55, 0);
    link.rotateX(Math.PI / 2);
    g.add(link);
  }
  g0.add(mesh(cyl(0.06, 0.08, 0.7), m.steel, 0, 0.9, 0));
}

function quantumCircuit(m: Mats, g: THREE.Group) {
  // Qubit wires with gates, and a Bloch sphere above.
  for (let q = 0; q < 3; q++) {
    const wire = mesh(cyl(0.012, 0.012, 1.6, 6), m.silver, 0, 1.0 + q * 0.22, 0);
    wire.rotation.z = Math.PI / 2;
    g.add(wire);
    for (let k = 0; k < 3; k++) if ((q + k) % 2 === 0) g.add(mesh(box(0.14, 0.14, 0.14), k === 1 ? m.signal : m.steel, -0.5 + k * 0.5 + q * 0.06, 1.0 + q * 0.22, 0));
  }
  const sphere = mesh(new THREE.SphereGeometry(0.32, 20, 14), new THREE.MeshBasicMaterial({ color: "#9fe6d8", wireframe: true, transparent: true, opacity: 0.35 }), 0, 1.95, 0);
  sphere.castShadow = false;
  g.add(sphere);
  const arrow = mesh(cyl(0.015, 0.015, 0.32, 6), m.ember, 0.1, 2.08, 0.05);
  arrow.rotation.z = -0.6;
  g.add(arrow);
  g.add(mesh(box(1.8, 0.06, 0.4), m.steel, 0, 0.82, 0));
}

function dataWall(m: Mats, g: THREE.Group, seed: number) {
  const rng = createRng(seed);
  g.add(mesh(box(1.7, 1.3, 0.08), m.steel, 0, 1.45, -0.5));
  const bar = box(0.12, 1, 0.12);
  for (let x = 0; x < 7; x++)
    for (let z = 0; z < 3; z++) {
      const h = 0.15 + rng() * 0.75 * (0.5 + x / 12);
      const b = mesh(bar, z === 0 ? m.signal : z === 1 ? m.steel : m.ember, -0.6 + x * 0.2, 0.55 + h / 2, -0.15 + z * 0.2);
      b.scale.y = h;
      g.add(b);
    }
}

function terminal(m: Mats, g: THREE.Group, seed: number) {
  // Security: a terminal kiosk with a padlock beside it.
  const rng = createRng(seed);
  g.add(mesh(box(0.5, 0.7, 0.4), m.steel, 0, 0.85, 0));
  const mon = mesh(box(1.0, 0.62, 0.06), m.chip, 0, 1.6, 0.02);
  mon.rotation.x = -0.1;
  g.add(mon);
  for (let i = 0; i < 7; i++) {
    const l = mesh(box(0.25 + rng() * 0.5, 0.025, 0.01), i === 3 ? m.red : m.screen, -0.4 + (0.25 + rng() * 0.5) / 2, 1.82 - i * 0.065, 0.06);
    l.rotation.x = -0.1;
    g.add(l);
  }
  const lock = new THREE.Group();
  lock.add(mesh(box(0.3, 0.26, 0.12), m.gold, 0, 0, 0));
  const shackle = mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 20, Math.PI), m.silver, 0, 0.13, 0);
  lock.add(shackle);
  lock.position.set(0.75, 1.0, 0.2);
  g.add(lock);
}

function showcase(m: Mats, g: THREE.Group, seed: number) {
  // General hackathon: a laptop on a lectern and a pinboard of cards.
  const rng = createRng(seed);
  const lectern = mesh(box(0.7, 0.6, 0.5), m.plank, -0.45, 0.8, 0.1);
  g.add(lectern);
  const base = mesh(box(0.5, 0.025, 0.34), m.steel, -0.45, 1.12, 0.1);
  g.add(base);
  const lid = mesh(box(0.5, 0.32, 0.02), m.steel, -0.45, 1.28, -0.06);
  lid.rotation.x = -0.25;
  g.add(lid);
  const scr = mesh(box(0.44, 0.27, 0.005), m.screen, -0.45, 1.28, -0.045);
  scr.rotation.x = -0.25;
  g.add(scr);
  g.add(mesh(box(1.0, 0.8, 0.04), m.cloth, 0.55, 1.55, -0.6));
  const colors = [m.ember, m.signal, m.cloth, m.red];
  for (let i = 0; i < 6; i++) g.add(mesh(box(0.2, 0.15, 0.01), colors[Math.floor(rng() * colors.length)], 0.25 + (i % 3) * 0.3, 1.75 - Math.floor(i / 3) * 0.3, -0.57));
}

function artifact(e: EventRecord, m: Mats, i: number) {
  const g = booth(m);
  switch (e.id) {
    case "altronix":
      hardwareBench(m, g);
      break;
    case "genai-promptwars":
      lattice(m, g, 31 + i);
      break;
    case "codex-promptwars":
      codePanels(m, g);
      break;
    case "promptwars-acm":
      phoneReceipt(m, g);
      break;
    case "ai-video":
      filmLoop(m, g);
      break;
    case "solution-challenge":
      globeOrbit(m, g);
      break;
    case "fetchathon-3":
      agentCore(m, g);
      break;
    case "qiskit-fall-fest":
      quantumCircuit(m, g);
      break;
    case "ibm-z-datathon":
      dataWall(m, g, 71);
      break;
    default:
      if (e.domain === "security") terminal(m, g, 50 + i);
      else showcase(m, g, 90 + i);
  }
  return g;
}

// ─── The district ────────────────────────────────────────────────────────────

function paving(m: Mats) {
  // A paved plaza conformed to the ground.
  const segs = 96;
  const rings = 14;
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const R = DISTRICT.ringRadius + 6;
  for (let r = 0; r <= rings; r++) {
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const rr = (r / rings) * R;
      const x = DISTRICT.center.x + Math.cos(a) * rr;
      const z = DISTRICT.center.z + Math.sin(a) * rr;
      pos.push(x, terrainHeight(x, z) + 0.06 + (1 - r / rings) * 0.04, z);
      uv.push(x / 3, z / 3);
    }
  }
  for (let r = 0; r < rings; r++)
    for (let s = 0; s < segs; s++) {
      const a = r * (segs + 1) + s;
      index.push(a, a + segs + 1, a + 1, a + 1, a + segs + 1, a + segs + 2);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  const o = new THREE.Mesh(g, m.paving);
  o.receiveShadow = true;
  return o;
}

function pavilion(m: Mats) {
  const g = new THREE.Group();
  const R = DISTRICT.pavilionRadius;
  const c = DISTRICT.center;
  g.position.copy(c);
  g.add(mesh(cyl(R + 0.6, R + 0.9, 0.35, 32), m.stone, 0, 0.17, 0));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(mesh(cyl(0.22, 0.28, 5.2, 10), m.timber, Math.cos(a) * R, 2.95, Math.sin(a) * R));
  }
  const beam = mesh(new THREE.TorusGeometry(R, 0.22, 8, 48), m.timber, 0, 5.5, 0);
  beam.rotation.x = Math.PI / 2;
  g.add(beam);
  const roof = mesh(new THREE.ConeGeometry(R + 1.8, 2.6, 40, 1, true), m.plank, 0, 6.85, 0);
  (roof.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  g.add(roof);
  // Rafters.
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const r = mesh(box(0.12, 0.12, R + 1.6), m.darkWood, Math.cos(a) * (R / 2 + 0.6), 6.75, Math.sin(a) * (R / 2 + 0.6));
    r.lookAt(c.x, c.y + 8.1, c.z);
    g.add(r);
  }
  return g;
}

function gate(m: Mats, signs: THREE.Texture[]) {
  const g = new THREE.Group();
  const e = DISTRICT.entrance;
  const R = DISTRICT.ringRadius + 3;
  const center = new THREE.Vector3(DISTRICT.center.x + Math.cos(e) * R, 0, DISTRICT.center.z + Math.sin(e) * R);
  center.y = terrainHeight(center.x, center.z);
  g.position.copy(center);
  g.rotation.y = -e + Math.PI / 2;
  for (const x of [-6.2, 6.2]) g.add(mesh(cyl(0.3, 0.36, 6.4, 10), m.timber, x, 3.2, 0));
  g.add(mesh(box(13.4, 0.42, 0.5), m.timber, 0, 6.3, 0));
  g.add(mesh(box(12.4, 0.2, 0.3), m.darkWood, 0, 5.8, 0));
  // Banners for the organising roles, hung from the lintel.
  // Readable from both sides: two faces back to back.
  signs.forEach((tex, i) => {
    for (const face of [0, 1]) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
      b.position.set(i ? 3.2 : -3.2, 3.9, face ? -0.02 : 0.02);
      b.rotation.y = face ? Math.PI : 0;
      b.castShadow = true;
      g.add(b);
    }
  });
  return g;
}

function arenaGate(m: Mats) {
  const g = new THREE.Group();
  g.position.copy(ARENA_GATE.position);
  g.rotation.y = -ARENA_GATE.facing + Math.PI / 2;
  const slab = new THREE.MeshStandardMaterial({ color: "#1b1d21", metalness: 0.6, roughness: 0.45 });
  for (const x of [-3.4, 3.4]) g.add(mesh(box(1.6, 11, 2.2), slab, x, 5.5, 0));
  g.add(mesh(box(8.4, 1.6, 2.2), slab, 0, 11.2, 0));
  g.add(mesh(box(5.2, 9.6, 0.2), new THREE.MeshStandardMaterial({ color: "#07080a", roughness: 1 }), 0, 4.8, -0.5));
  for (const x of [-2.55, 2.55]) g.add(mesh(box(0.06, 9.4, 0.06), m.red, x, 4.9, 1.12));
  g.add(mesh(box(5.2, 0.06, 0.06), m.red, 0, 10.3, 1.12));
  g.add(mesh(box(9, 0.3, 4), m.stone, 0, 0.15, 0.6));
  return g;
}

export function District() {
  const { assets } = useWorld();
  const group = useRef<THREE.Group>(null);
  const pulses = useRef<THREE.Group[]>([]);

  const res = useMemo(() => {
    const m = makeMaterials(assets);
    const root = new THREE.Group();
    root.add(paving(m));
    root.add(pavilion(m));
    const organising = DISTRICT_EXHIBITS.filter((x) => x.zone === "gate").map((x) => EVENTS.find((e) => e.id === x.id)!);
    const signs = organising.map((e) => makeSignTexture(e.name, e.role, { width: 512, height: 768, paper: "#2a2018" }));
    root.add(gate(m, signs));
    root.add(arenaGate(m));
    const clickables: { id: string; obj: THREE.Object3D }[] = [];
    const animated: THREE.Group[] = [];
    DISTRICT_EXHIBITS.forEach((x, i) => {
      const e = EVENTS.find((ev) => ev.id === x.id)!;
      let obj: THREE.Group;
      if (x.zone === "trophy") obj = trophy(e, m);
      else if (x.zone === "gate") {
        // The banner itself is the exhibit; a small hit target sits in front of it.
        obj = new THREE.Group();
        const hit = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 2.6;
        obj.add(hit);
      } else {
        obj = artifact(e, m, i);
        const spin = obj.getObjectByName("spin");
        if (spin) animated.push(spin as THREE.Group);
      }
      obj.position.copy(x.base);
      obj.rotation.y = -x.facing + Math.PI / 2;
      if (x.zone === "gate") obj.position.y = x.base.y;
      obj.userData.id = x.id;
      root.add(obj);
      clickables.push({ id: x.id, obj });
    });
    // Lanterns round the ring.
    const glows: GlowPoint[] = [];
    const rng = createRng(4404);
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2 + 0.06;
      const r = DISTRICT.ringRadius + 2.2;
      const x = DISTRICT.center.x + Math.cos(a) * r;
      const z = DISTRICT.center.z + Math.sin(a) * r;
      const y = terrainHeight(x, z);
      const post = mesh(cyl(0.05, 0.06, 2.4, 6), m.darkWood, x, y + 1.2, z);
      root.add(post);
      root.add(mesh(box(0.22, 0.28, 0.22), m.ember, x, y + 2.5, z));
      glows.push({ position: new THREE.Vector3(x, y + 2.5, z), size: 1.3, color: "#ffb066", night: 0.9, pulse: rng() * 6 });
    }
    // A thread of signal under the paving, from the trail to the pavilion.
    return { m, root, clickables, animated, glows, signs };
  }, [assets]);

  useEffect(() => {
    pulses.current = res.animated;
    const anchors = DISTRICT_EXHIBITS.map((x) => {
      const e = EVENTS.find((ev) => ev.id === x.id)!;
      return { id: x.id, title: e.name, position: x.base.clone().add(new THREE.Vector3(0, x.zone === "gate" ? 4.8 : 3.1, 0)), near: 22, region: "district" as const };
    });
    const unregister = registerTags(anchors);
    return () => {
      unregister();
      res.root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((mm: THREE.Material) => mm.dispose());
        }
      });
      Object.values(res.m).forEach((mm) => mm.dispose());
      res.signs.forEach((t) => t.dispose());
    };
  }, [res]);

  useFrame((_, dt) => {
    const p = frame.progress;
    // Visible from the trail and the reveal, and in the district itself.
    if (group.current) group.current.visible = !frame.pocket && (frame.region === "district" || (p > 0.17 && p < 0.42 && !frame.region));
    if (frame.region === "district") pulses.current.forEach((g, i) => (g.rotation.y += dt * (0.25 + i * 0.08)));
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
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (frame.region !== "district") return;
        const id = findId(e.object);
        if (id) {
          e.stopPropagation();
          openRecord(id);
        }
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (frame.region !== "district") return;
        const id = findId(e.object);
        if (id) {
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
