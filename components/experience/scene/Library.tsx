"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { L, LIBRARY, LIBRARY_SHELVES } from "@/lib/world/regions";
import { VOLUMES } from "@/src/data/library";
import { createBarkMaterial } from "@/lib/world/materials";
import { createRng, range } from "@/lib/world/noise";
import { makeSignTexture } from "@/lib/world/labelTexture";
import { registerTags } from "@/lib/world/tags";
import { frame, openRecord, ui } from "@/lib/world/store";
import { Glows, type GlowPoint } from "./Glows";
import { useWorld } from "./WorldContext";

/**
 * The library: a reading cabin built on the World Tree's longest limb, with
 * windows over the valley. Shelves of books (instanced), the titles the owner
 * has named shown face-out with original covers (abstract designs and their
 * titles — no cover art), a manhwa display of tall scrolling strips, a writing
 * desk, a record player and a window seat. Lamp-lit at night.
 */

type Part = { geo: THREE.BufferGeometry; mat: keyof ReturnType<typeof makeMaterials> };

function makeMaterials(assets: ReturnType<typeof useWorld>["assets"]) {
  return {
    beam: createBarkMaterial(assets, { ground: -1000, moss: 0.08, brightness: 1.1, tint: "#d9bc98" }),
    plank: new THREE.MeshStandardMaterial({ color: "#6e4b30", roughness: 0.78 }),
    floor: new THREE.MeshStandardMaterial({ color: "#5a3c26", roughness: 0.7 }),
    shelf: new THREE.MeshStandardMaterial({ color: "#3e2a1b", roughness: 0.65 }),
    roof: new THREE.MeshStandardMaterial({ color: "#3a2c22", roughness: 0.9 }),
    rug: new THREE.MeshStandardMaterial({ color: "#7a3a2a", roughness: 1 }),
    cushion: new THREE.MeshStandardMaterial({ color: "#c9b48e", roughness: 1 }),
    metal: new THREE.MeshStandardMaterial({ color: "#2a2623", metalness: 0.8, roughness: 0.35 }),
    glass: new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: new THREE.Color("#ffb45a"), emissiveIntensity: 0.55, transparent: true, opacity: 0.32 }),
    lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc27a").multiplyScalar(2.2), toneMapped: false }),
  };
}

/** A box placed in the cabin's frame (x along the limb, y up, z towards the windows). */
function slab(w: number, h: number, d: number, x: number, y: number, z: number, mat: Part["mat"]): Part {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Matrix4().makeBasis(LIBRARY.forward, new THREE.Vector3(0, 1, 0), LIBRARY.side).setPosition(L(x, y, z));
  g.applyMatrix4(m);
  return { geo: g, mat };
}

function cabin(): Part[] {
  const p: Part[] = [];
  const Lh = LIBRARY.length / 2;
  const Wh = LIBRARY.width / 2;
  const H = LIBRARY.height;
  // Deck and its posts down to the limb.
  p.push(slab(LIBRARY.length + 2.4, 0.3, LIBRARY.width + 2.2, 0, -0.15, 0, "floor"));
  for (const x of [-Lh - 1, 0, Lh + 1]) for (const z of [-Wh - 0.9, Wh + 0.9]) p.push(slab(0.34, 4.5, 0.34, x, -2.4, z, "beam"));
  for (const z of [-Wh - 0.9, Wh + 0.9]) p.push(slab(LIBRARY.length + 2.4, 0.3, 0.3, 0, -0.45, z, "beam"));
  for (const x of [-Lh - 1, 0, Lh + 1]) p.push(slab(0.25, 1.0, LIBRARY.width + 2.2, x, 0.5, Wh + 1.0, "beam"));
  // Back wall (shelves inside).
  p.push(slab(LIBRARY.length, H, 0.18, 0, H / 2, -Wh, "plank"));
  // Window wall: sill, head and mullions round three openings.
  p.push(slab(LIBRARY.length, 0.9, 0.18, 0, 0.45, Wh, "plank"));
  p.push(slab(LIBRARY.length, H - 2.7, 0.18, 0, 2.7 + (H - 2.7) / 2, Wh, "plank"));
  for (const x of [-Lh + 0.3, -1.6, 1.6, Lh - 0.3]) p.push(slab(0.6, 1.8, 0.2, x, 1.8, Wh, "beam"));
  // End walls; the far end has the door (towards the window side).
  p.push(slab(0.18, H, LIBRARY.width, -Lh, H / 2, 0, "plank"));
  p.push(slab(0.18, H, LIBRARY.width - 2.4, Lh, H / 2, -1.2, "plank"));
  p.push(slab(0.18, H - 2.4, 1.4, Lh, 2.4 + (H - 2.4) / 2, Wh - 0.7, "plank"));
  // Frame posts.
  for (const x of [-Lh, Lh]) for (const z of [-Wh, Wh]) p.push(slab(0.32, H + 0.2, 0.32, x, H / 2, z, "beam"));
  // Roof: two pitched planes and a ridge.
  const pitch = 0.42;
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(LIBRARY.length + 1.4, 0.18, Wh / Math.cos(pitch) + 0.9);
    g.rotateX(s * pitch);
    g.translate(0, H + 0.95, s * (Wh / 2 + 0.25));
    g.applyMatrix4(new THREE.Matrix4().makeBasis(LIBRARY.forward, new THREE.Vector3(0, 1, 0), LIBRARY.side).setPosition(LIBRARY.origin));
    p.push({ geo: g, mat: "roof" });
  }
  p.push(slab(LIBRARY.length + 1.6, 0.3, 0.3, 0, H + 1.85, 0, "beam"));
  // Shelving along the back wall: uprights and boards.
  for (const x of [-4.6, -2.2, 0, 2.0, 3.8]) p.push(slab(0.08, 3.2, 0.6, x, 1.6, -Wh + 0.35, "shelf"));
  for (const y of [0.25, 0.95, 1.65, 2.35, 3.05]) p.push(slab(8.5, 0.05, 0.6, -0.4, y, -Wh + 0.35, "shelf"));
  // End-wall shelf (series and games).
  for (const z of [-3.1, -1.6, 0.0]) p.push(slab(0.6, 3.0, 0.08, Lh - 0.35, 1.5, z, "shelf"));
  for (const y of [0.4, 1.1, 1.8, 2.5]) p.push(slab(0.6, 0.05, 3.1, Lh - 0.35, y, -1.55, "shelf"));
  // Furniture: reading chair, side table, writing desk, record cabinet, window seat, rug.
  p.push(slab(4.2, 0.02, 2.8, -0.6, 0.02, 0.2, "rug"));
  p.push(slab(1.0, 0.45, 0.95, -1.9, 0.25, 0.5, "cushion"));
  p.push(slab(1.0, 0.9, 0.18, -1.9, 0.7, 0.05, "cushion"));
  p.push(slab(0.6, 0.55, 0.6, -0.9, 0.28, 0.8, "shelf"));
  p.push(slab(1.6, 0.06, 0.8, -3.6, 0.82, 2.7, "shelf"));
  for (const x of [-4.3, -2.9]) p.push(slab(0.06, 0.8, 0.7, x, 0.4, 2.7, "shelf"));
  p.push(slab(1.1, 0.9, 0.55, 2.6, 0.45, 2.85, "shelf"));
  p.push(slab(2.6, 0.45, 0.8, -0.5, 0.52, 2.9, "cushion"));
  // Lamp stand and shade.
  p.push(slab(0.05, 1.8, 0.05, -1.6, 0.95, 0.4, "metal"));
  p.push(slab(0.4, 0.25, 0.4, -1.6, 2.0, 0.4, "lamp"));
  p.push(slab(0.25, 0.18, 0.25, -3.2, 0.95, 2.85, "lamp"));
  // Window panes.
  for (const x of [-3.2, 0, 3.2]) p.push(slab(2.6, 1.8, 0.03, x, 1.8, Wh - 0.02, "glass"));
  return p;
}

/** Books on the shelves (one instanced draw), leaving room for the face-out titles. */
function books() {
  const rng = createRng(1717);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mats: THREE.Matrix4[] = [];
  const cols: THREE.Color[] = [];
  const palette = ["#3c5a8a", "#5b3a6b", "#7a3328", "#8a6a2e", "#2e3b38", "#4e5a3a", "#6a3a4e", "#9a8a6a", "#2f2a26", "#a2643a"];
  const basis = new THREE.Matrix4().makeBasis(LIBRARY.forward, new THREE.Vector3(0, 1, 0), LIBRARY.side);
  const q = new THREE.Quaternion().setFromRotationMatrix(basis);
  const add = (x: number, y: number, z: number, w: number, h: number, d: number) => {
    const m = new THREE.Matrix4().compose(L(x, y, z), q, new THREE.Vector3(w, h, d));
    mats.push(m);
    cols.push(new THREE.Color(palette[Math.floor(rng() * palette.length)]).multiplyScalar(range(rng, 0.7, 1.05)));
  };
  const Wh = LIBRARY.width / 2;
  for (const y of [0.25, 0.95, 1.65, 2.35]) {
    let x = -4.55;
    while (x < 3.75) {
      // Keep the face-out spots clear at eye level.
      const nearFeature = y === 1.65 && LIBRARY_SHELVES.some((s) => s.center.distanceTo(L(x, 1.65, -Wh + 0.35)) < 0.55);
      const w = range(rng, 0.03, 0.06);
      const h = range(rng, 0.22, 0.32);
      if (!nearFeature && rng() > 0.06) add(x + w / 2, y + 0.025 + h / 2, -Wh + 0.35, w, h, range(rng, 0.17, 0.24));
      x += w + 0.006;
    }
  }
  for (const y of [0.4, 1.1, 1.8]) {
    let z = -3.05;
    while (z < 0.0) {
      const w = range(rng, 0.03, 0.06);
      const h = range(rng, 0.22, 0.3);
      const nearFeature = y === 1.8 && LIBRARY_SHELVES.some((s) => s.center.distanceTo(L(LIBRARY.length / 2 - 0.35, 1.65, z)) < 0.5);
      if (!nearFeature) add(LIBRARY.length / 2 - 0.35, y + 0.025 + h / 2, z + w / 2, range(rng, 0.17, 0.24), h, w);
      z += w + 0.006;
    }
  }
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.75 }), mats.length);
  mats.forEach((m, i) => {
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, cols[i]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** An original face-out cover: colour, a few abstract strokes, the title. */
function coverTexture(title: string, color: string, seed: number) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 384);
  const rng = createRng(seed);
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? "#000000" : "#ffffff";
    ctx.beginPath();
    ctx.arc(rng() * 256, rng() * 384, 30 + rng() * 90, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = makeSignTexture(title, "", { width: 256, height: 384, paper: "#00000000", ink: "#f6efe4", accent: "#00000000" });
  ctx.drawImage(tex.image as HTMLCanvasElement, 0, 60, 256, 384);
  tex.dispose();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Library() {
  const { assets } = useWorld();
  const group = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const m = makeMaterials(assets);
    const root = new THREE.Group();
    const parts = cabin();
    const byMat = new Map<Part["mat"], THREE.BufferGeometry[]>();
    for (const p of parts) byMat.set(p.mat, [...(byMat.get(p.mat) ?? []), p.geo]);
    const merged: THREE.BufferGeometry[] = [];
    for (const [mat, geos] of byMat) {
      const g = mergeGeometries(geos)!;
      geos.forEach((x) => x.dispose());
      merged.push(g);
      const o = new THREE.Mesh(g, m[mat]);
      o.castShadow = mat !== "glass" && mat !== "lamp";
      o.receiveShadow = true;
      root.add(o);
    }
    root.add(books());
    // Face-out covers for the titles the owner named, each clickable.
    const basis = new THREE.Matrix4().makeBasis(LIBRARY.forward, new THREE.Vector3(0, 1, 0), LIBRARY.side);
    const q = new THREE.Quaternion().setFromRotationMatrix(basis);
    const covers: THREE.Texture[] = [];
    LIBRARY_SHELVES.forEach((s, i) => {
      const v = VOLUMES.find((x) => x.id === s.id)!;
      const tex = coverTexture(v.title, v.color, 300 + i);
      covers.push(tex);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
      const o = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.44, 0.03), mat);
      o.position.copy(s.center);
      o.quaternion.copy(q);
      // Facing into the room: covers on the back wall face +z, on the end wall face −x.
      const onEndWall = s.id === "lib-dark" || s.id === "lib-elden";
      if (onEndWall) o.rotateY(-Math.PI / 2);
      if (s.id === "lib-writing") {
        o.scale.set(0.9, 0.06, 1.4);
        o.rotateX(-Math.PI / 2 + 0.02);
      }
      if (s.id === "lib-rnb") {
        // A record sleeve leaning on the cabinet.
        o.scale.set(1.15, 0.8, 1);
        o.rotateX(-0.25);
      }
      o.userData.id = s.id;
      o.castShadow = true;
      root.add(o);
    });
    // The record player.
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32), m.metal);
    deck.position.copy(L(2.75, 0.92, 2.85));
    root.add(deck);
    // The manhwa display: three tall vertical strips beside the first bay.
    const stripTex = makeSignTexture("Manhwa", "read top to bottom", { width: 256, height: 1024, paper: "#1c2433", accent: "#7ea0e0" });
    covers.push(stripTex);
    for (let k = 0; k < 3; k++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.9), new THREE.MeshStandardMaterial({ map: stripTex, roughness: 0.8 }));
      strip.position.copy(L(-4.1 + k * 0.42, 1.95, -LIBRARY.width / 2 + 0.68));
      strip.quaternion.copy(q);
      strip.userData.id = "lib-lookism";
      root.add(strip);
    }
    const glows: GlowPoint[] = [
      { position: L(-1.6, 2.0, 0.4), size: 1.6, color: "#ffb45a", night: 0, pulse: -1 },
      { position: L(-3.2, 1.0, 2.85), size: 0.9, color: "#ffb45a", night: 0, pulse: -1 },
      ...[-3.2, 0, 3.2].map((x) => ({ position: L(x, 1.8, LIBRARY.width / 2 + 0.2), size: 2.6, color: new THREE.Color("#ffb45a").multiplyScalar(0.35), night: 1, pulse: -1 })),
    ];
    return { m, root, merged, covers, glows };
  }, [assets]);

  useEffect(() => {
    const unregister = registerTags(
      LIBRARY_SHELVES.map((s) => ({ id: s.id, title: VOLUMES.find((v) => v.id === s.id)!.title, position: s.center.clone().add(new THREE.Vector3(0, 0.45, 0)), near: 5.5, region: "library" as const }))
    );
    return () => {
      unregister();
      res.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => mm.dispose());
        }
      });
      Object.values(res.m).forEach((mm) => mm.dispose());
      res.covers.forEach((t) => t.dispose());
    };
  }, [res]);

  useFrame(() => {
    const p = frame.progress;
    // On the limb it is visible from below during the reveal, and of course inside.
    if (group.current) group.current.visible = !frame.pocket && (frame.region === "library" || (!frame.region && p > 0.25 && p < 0.46));
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
        const id = findId(e.object);
        if (id && frame.region === "library") {
          e.stopPropagation();
          openRecord(id);
        }
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        const id = findId(e.object);
        if (id && frame.region === "library") {
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
