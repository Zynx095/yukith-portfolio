"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMP, LAKE, lakeDistance, terrainHeight } from "@/lib/world/layout";
import { sharedUniforms } from "@/lib/world/materials";
import { createRng } from "@/lib/world/noise";
import { mergeGeometries } from "@/lib/world/geometry";

/**
 * The family at their campsite by the lake: Dad at the grill, Mom and Aunt
 * talking, Grandma resting by the fire, the brother playing fetch with Bella,
 * and the girlfriend at the water's edge. Figures are deliberately stylised
 * and faceless — silhouettes, posture and cloth, not caricature.
 */

// ─── Materials (shared) ───────────────────────────────────────────────────────

const mats = {
  skinA: new THREE.MeshPhysicalMaterial({ color: "#8a5638", roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color("#c48a6a") }),
  skinB: new THREE.MeshPhysicalMaterial({ color: "#7a4a30", roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color("#b07a5c") }),
  skinC: new THREE.MeshPhysicalMaterial({ color: "#96603f", roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color("#cf9a78") }),
  hairDark: new THREE.MeshStandardMaterial({ color: "#14100d", roughness: 0.45 }),
  hairGrey: new THREE.MeshStandardMaterial({ color: "#b9b4ac", roughness: 0.6 }),
  shoe: new THREE.MeshStandardMaterial({ color: "#1d1915", roughness: 0.6 }),
};

const cloth = (color: string, sheen = "#ffffff") => new THREE.MeshPhysicalMaterial({ color, roughness: 0.86, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color(sheen) });

// ─── Figure builder ───────────────────────────────────────────────────────────

interface FigureSpec {
  height: number;
  skin: THREE.Material;
  top: THREE.Material;
  bottom: THREE.Material;
  hair: THREE.Material;
  hairStyle: "short" | "long" | "bun" | "tied" | "kid";
  build?: number; // shoulder width factor
  dress?: boolean;
}

interface Figure {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  foreL: THREE.Group;
  foreR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  kneeL: THREE.Group;
  kneeR: THREE.Group;
}

function lathe(profile: [number, number][], segments = 24, sx = 1, sz = 0.72) {
  const g = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments
  );
  g.scale(sx, 1, sz);
  return g;
}

function limb(length: number, r0: number, r1: number, material: THREE.Material) {
  const g = new THREE.CapsuleGeometry((r0 + r1) / 2, length, 6, 12);
  g.translate(0, -length / 2, 0);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  return m;
}

function buildFigure(spec: FigureSpec): Figure {
  const H = spec.height;
  const k = H / 1.7;
  const build = spec.build ?? 1;
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0.92 * k;
  root.add(torso);

  // Torso: hips → waist → chest → shoulders, as one smooth lathe.
  const body = new THREE.Mesh(
    lathe(
      [
        [0.0, -0.02],
        [0.15 * k, 0.0],
        [0.165 * k, 0.08 * k],
        [0.14 * k * build, 0.24 * k],
        [0.165 * k * build, 0.4 * k],
        [0.175 * k * build, 0.5 * k],
        [0.12 * k, 0.56 * k],
        [0.055 * k, 0.6 * k],
        [0.0, 0.6 * k],
      ],
      28,
      1,
      0.7
    ),
    spec.top
  );
  body.castShadow = true;
  torso.add(body);

  // Skirt or dress hem.
  if (spec.dress) {
    const skirt = new THREE.Mesh(
      lathe(
        [
          [0.15 * k, 0.12 * k],
          [0.2 * k, -0.2 * k],
          [0.27 * k, -0.62 * k],
          [0.0, -0.62 * k],
        ],
        28,
        1,
        0.85
      ),
      spec.bottom
    );
    skirt.castShadow = true;
    torso.add(skirt);
  }

  // Neck + head.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * k, 0.05 * k, 0.1 * k, 12), spec.skin);
  neck.position.y = 0.63 * k;
  torso.add(neck);
  const head = new THREE.Group();
  head.position.y = 0.76 * k;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.105 * k, 32, 24), spec.skin);
  skull.scale.set(0.92, 1.1, 1);
  skull.castShadow = true;
  head.add(skull);
  // Hair.
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.112 * k, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.6), spec.hair);
  cap.scale.set(0.95, 1.12, 1.04);
  cap.position.set(0, 0.012 * k, -0.01 * k);
  cap.rotation.x = -0.25;
  head.add(cap);
  if (spec.hairStyle === "long") {
    const fall = new THREE.Mesh(new THREE.CapsuleGeometry(0.075 * k, 0.24 * k, 6, 12), spec.hair);
    fall.scale.set(1.25, 1, 0.6);
    fall.position.set(0, -0.12 * k, -0.06 * k);
    head.add(fall);
  } else if (spec.hairStyle === "bun") {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.05 * k, 16, 12), spec.hair);
    bun.position.set(0, 0.04 * k, -0.11 * k);
    head.add(bun);
  } else if (spec.hairStyle === "tied") {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.03 * k, 0.16 * k, 4, 8), spec.hair);
    tail.position.set(0, -0.06 * k, -0.12 * k);
    tail.rotation.x = 0.35;
    head.add(tail);
  }

  // Arms (shoulder pivots).
  const shoulderY = 0.5 * k;
  const shoulderX = 0.19 * k * build;
  const makeArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * shoulderX, shoulderY, 0);
    const upper = limb(0.26 * k, 0.048 * k, 0.042 * k, spec.top);
    arm.add(upper);
    const fore = new THREE.Group();
    fore.position.y = -0.29 * k;
    arm.add(fore);
    const forearm = limb(0.24 * k, 0.038 * k, 0.032 * k, spec.skin);
    fore.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042 * k, 14, 10), spec.skin);
    hand.scale.set(0.8, 1.2, 0.6);
    hand.position.y = -0.28 * k;
    fore.add(hand);
    torso.add(arm);
    return { arm, fore };
  };
  const L = makeArm(-1);
  const R = makeArm(1);

  // Legs (hip pivots, under the torso group's origin).
  const makeLeg = (side: number) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.085 * k, 0.92 * k, 0);
    const thigh = limb(0.4 * k, 0.07 * k, 0.055 * k, spec.bottom);
    leg.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.44 * k;
    leg.add(knee);
    const shin = limb(0.4 * k, 0.05 * k, 0.04 * k, spec.dress ? spec.skin : spec.bottom);
    knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.045 * k, 0.12 * k, 4, 10), mats.shoe);
    shoe.rotation.x = Math.PI / 2;
    shoe.position.set(0, -0.44 * k, 0.04 * k);
    knee.add(shoe);
    root.add(leg);
    return { leg, knee };
  };
  const LL = makeLeg(-1);
  const LR = makeLeg(1);

  return { root, torso, head, armL: L.arm, armR: R.arm, foreL: L.fore, foreR: R.fore, legL: LL.leg, legR: LR.leg, kneeL: LL.knee, kneeR: LR.knee };
}

// ─── Bella, the Shih Tzu ──────────────────────────────────────────────────────

function buildDog() {
  const fur = new THREE.MeshPhysicalMaterial({ color: "#d8c3a2", roughness: 0.9, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color("#fff1d8") });
  const furDark = new THREE.MeshPhysicalMaterial({ color: "#8a6a48", roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color("#d9b48a") });
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.26, 8, 16), fur);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.24;
  body.castShadow = true;
  root.add(body);
  const head = new THREE.Group();
  head.position.set(0, 0.36, 0.22);
  root.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), fur);
  skull.scale.set(1.05, 0.95, 1);
  skull.castShadow = true;
  head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), fur);
  muzzle.position.set(0, -0.02, 0.09);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mats.shoe);
  nose.position.set(0, 0.0, 0.14);
  head.add(nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.1, 4, 8), furDark);
    ear.position.set(s * 0.1, -0.03, -0.01);
    ear.rotation.z = s * 0.25;
    head.add(ear);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.32, -0.2);
  const plume = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.12, 4, 8), fur);
  plume.rotation.x = -0.9;
  plume.position.set(0, 0.06, -0.03);
  tail.add(plume);
  root.add(tail);
  const legs: THREE.Mesh[] = [];
  for (const [x, z] of [
    [-0.08, 0.12],
    [0.08, 0.12],
    [-0.08, -0.12],
    [0.08, -0.12],
  ]) {
    const g = new THREE.CapsuleGeometry(0.035, 0.1, 4, 8);
    g.translate(0, -0.06, 0);
    const leg = new THREE.Mesh(g, fur);
    leg.position.set(x, 0.15, z);
    root.add(leg);
    legs.push(leg);
  }
  return { root, head, tail, legs };
}

// ─── Props ────────────────────────────────────────────────────────────────────

const propMats = {
  stone: new THREE.MeshStandardMaterial({ color: "#5e5a54", roughness: 0.9 }),
  log: new THREE.MeshStandardMaterial({ color: "#3b2a1c", roughness: 0.95 }),
  charcoal: new THREE.MeshStandardMaterial({ color: "#16110e", roughness: 1 }),
  ember: new THREE.MeshStandardMaterial({ color: "#3a1a0c", roughness: 0.8, emissive: new THREE.Color("#ff6a1f"), emissiveIntensity: 2.2 }),
  food: new THREE.MeshStandardMaterial({ color: "#7a3a1e", roughness: 0.55 }),
  metal: new THREE.MeshStandardMaterial({ color: "#2a2b2d", roughness: 0.42, metalness: 0.85 }),
  tent: new THREE.MeshPhysicalMaterial({ color: "#c98f4e", roughness: 0.8, sheen: 0.4, sheenColor: new THREE.Color("#ffd9a8"), side: THREE.DoubleSide }),
  tentDark: new THREE.MeshStandardMaterial({ color: "#2c241c", roughness: 0.9, side: THREE.DoubleSide }),
  chair: new THREE.MeshPhysicalMaterial({ color: "#2f4a3a", roughness: 0.8, sheen: 0.3, side: THREE.DoubleSide }),
  blanket: new THREE.MeshPhysicalMaterial({ color: "#8e3b2e", roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color("#e8a090") }),
  ball: new THREE.MeshStandardMaterial({ color: "#e6d24a", roughness: 0.6 }),
  lantern: new THREE.MeshStandardMaterial({ color: "#ffcf7a", emissive: new THREE.Color("#ffb347"), emissiveIntensity: 3 }),
};

function flameMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: sharedUniforms.uTime },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float sway = sin(uTime * 7.0 + p.y * 5.0) * 0.05 * uv.y;
        p.x += sway;
        p.z += cos(uTime * 6.0 + p.y * 4.0) * 0.04 * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        float t = uTime * 2.4;
        float flick = n(vec2(vUv.x * 6.0, vUv.y * 4.0 - t)) * 0.6 + n(vec2(vUv.x * 13.0, vUv.y * 9.0 - t * 1.7)) * 0.4;
        float shape = smoothstep(1.0, 0.25, vUv.y + flick * 0.45) * smoothstep(0.0, 0.08, vUv.y);
        vec3 core = vec3(1.0, 0.86, 0.5);
        vec3 edge = vec3(1.0, 0.36, 0.06);
        vec3 col = mix(edge, core, smoothstep(0.35, 0.9, shape)) * (2.2 + 1.6 * shape);
        gl_FragColor = vec4(col * shape, shape);
      }
    `,
  });
}

function buildCampfire() {
  const g = new THREE.Group();
  const rng = createRng(55);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + rng() * 0.08, 1), propMats.stone);
    s.position.set(Math.cos(a) * 0.72, 0.08, Math.sin(a) * 0.72);
    s.scale.set(1.2, 0.75, 1);
    s.rotation.set(rng(), rng() * 6, rng());
    s.castShadow = true;
    g.add(s);
  }
  for (let i = 0; i < 4; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 8), propMats.log);
    l.rotation.z = Math.PI / 2 - 0.35;
    l.rotation.y = (i / 4) * Math.PI * 2;
    l.position.y = 0.16;
    g.add(l);
  }
  const coals = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.08, 16), propMats.charcoal);
  coals.position.y = 0.05;
  g.add(coals);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 16, 8, true), flameMaterial());
  flame.position.y = 0.72;
  g.add(flame);
  const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 16, 6, true), flameMaterial());
  flame2.position.set(0.12, 0.55, -0.08);
  flame2.rotation.y = 1.3;
  g.add(flame2);
  return g;
}

function buildGrill() {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), propMats.metal);
  bowl.position.y = 0.82;
  bowl.castShadow = true;
  g.add(bowl);
  // A bed of charcoal with embers glowing between the lumps.
  const coals = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), propMats.charcoal);
  coals.rotation.x = -Math.PI / 2;
  coals.position.y = 0.76;
  g.add(coals);
  const rng = createRng(4545);
  const lumps: THREE.BufferGeometry[] = [];
  const embers: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 46; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * 0.26;
    const lump = new THREE.IcosahedronGeometry(0.028 + rng() * 0.02, 0);
    lump.translate(Math.cos(a) * r, 0.775 + rng() * 0.02, Math.sin(a) * r);
    (rng() < 0.35 ? embers : lumps).push(lump);
  }
  const lumpMesh = new THREE.Mesh(mergeGeometries(lumps), propMats.charcoal);
  const emberMesh = new THREE.Mesh(mergeGeometries(embers), propMats.ember);
  g.add(lumpMesh, emberMesh);
  [...lumps, ...embers].forEach((x) => x.dispose());
  // Cooking grate: a rim and parallel bars.
  const grate = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.012, 6, 32), propMats.metal);
  grate.rotation.x = Math.PI / 2;
  grate.position.y = 0.83;
  g.add(grate);
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.085;
    const len = 2 * Math.sqrt(Math.max(0, 0.33 * 0.33 - x * x));
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 5), propMats.metal);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(x, 0.83, 0);
    g.add(bar);
  }
  // Something on the grill.
  for (let i = 0; i < 3; i++) {
    const item = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.16, 4, 10), propMats.food);
    item.rotation.z = Math.PI / 2;
    item.rotation.y = 0.15 * (i - 1);
    item.position.set(0.02 * (i - 1), 0.855, -0.09 + i * 0.09);
    item.castShadow = true;
    g.add(item);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6), propMats.metal);
    leg.position.set(Math.cos(a) * 0.22, 0.42, Math.sin(a) * 0.22);
    leg.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18);
    g.add(leg);
  }
  return g;
}

function buildTent() {
  const g = new THREE.Group();
  // A-frame: two sloped panels and a dark opening.
  const w = 2.6;
  const d = 3.0;
  const h = 1.8;
  const shape = new THREE.BufferGeometry();
  const v = [
    -w / 2, 0, -d / 2, 0, h, -d / 2, 0, h, d / 2, -w / 2, 0, -d / 2, 0, h, d / 2, -w / 2, 0, d / 2,
    w / 2, 0, -d / 2, w / 2, 0, d / 2, 0, h, d / 2, w / 2, 0, -d / 2, 0, h, d / 2, 0, h, -d / 2,
  ];
  shape.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  shape.computeVertexNormals();
  const panels = new THREE.Mesh(shape, propMats.tent);
  panels.castShadow = true;
  panels.receiveShadow = true;
  g.add(panels);
  const back = new THREE.BufferGeometry();
  back.setAttribute("position", new THREE.Float32BufferAttribute([-w / 2, 0, -d / 2, w / 2, 0, -d / 2, 0, h, -d / 2], 3));
  back.computeVertexNormals();
  g.add(new THREE.Mesh(back, propMats.tent));
  const door = new THREE.BufferGeometry();
  door.setAttribute("position", new THREE.Float32BufferAttribute([-w / 2 + 0.25, 0, d / 2 - 0.02, w / 2 - 0.25, 0, d / 2 - 0.02, 0, h - 0.18, d / 2 - 0.02], 3));
  door.computeVertexNormals();
  g.add(new THREE.Mesh(door, propMats.tentDark));
  return g;
}

function buildChair(withBlanket = false) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.5), propMats.chair);
  seat.position.y = 0.42;
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.04), propMats.chair);
  back.position.set(0, 0.72, -0.25);
  back.rotation.x = -0.18;
  g.add(back);
  for (const [x, z] of [
    [-0.26, 0.22],
    [0.26, 0.22],
    [-0.26, -0.22],
    [0.26, -0.22],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.44, 6), propMats.metal);
    leg.position.set(x, 0.21, z);
    g.add(leg);
  }
  if (withBlanket) {
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.55), propMats.blanket);
    blanket.position.set(0, 0.5, 0.12);
    blanket.rotation.x = 0.35;
    g.add(blanket);
  }
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

// ─── Scene composition ────────────────────────────────────────────────────────

const ground = (x: number, z: number) => terrainHeight(x, z);
const faceTowards = (obj: THREE.Object3D, x: number, z: number) => {
  obj.rotation.y = Math.atan2(x - obj.position.x, z - obj.position.z);
};
const place = (obj: THREE.Object3D, x: number, z: number, lift = 0) => obj.position.set(x, ground(x, z) + lift, z);

/** The water's edge on the lake's north shore, a short walk west of the camp. */
function shorePoint() {
  const dir = new THREE.Vector2(-8 - LAKE.x, -12 - LAKE.z).normalize();
  for (let s = 0; s < 80; s += 0.05) {
    const p = new THREE.Vector2(LAKE.x + dir.x * s, LAKE.z + dir.y * s);
    if (lakeDistance(p.x, p.y) > 1.07) return p;
  }
  return new THREE.Vector2(-8, -12);
}

export function FamilyCampfire() {
  const scene = useMemo(() => {
    const root = new THREE.Group();
    const fire = buildCampfire();
    place(fire, CAMP.x - 1.5, CAMP.z + 0.5);
    root.add(fire);

    const tent = buildTent();
    place(tent, CAMP.x + 5.5, CAMP.z - 5.2);
    faceTowards(tent, fire.position.x, fire.position.z);
    root.add(tent);

    const grill = buildGrill();
    place(grill, CAMP.x + 3.6, CAMP.z + 3.6);
    root.add(grill);

    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.2, 10), propMats.lantern);
    place(lantern, CAMP.x + 4.2, CAMP.z - 3.4, 0.1);
    root.add(lantern);

    // Dad — at the grill, turning food.
    const dad = buildFigure({ height: 1.76, skin: mats.skinB, top: cloth("#2f4f6e", "#a9c6e8"), bottom: cloth("#3b3833"), hair: mats.hairDark, hairStyle: "short", build: 1.12 });
    place(dad.root, CAMP.x + 4.35, CAMP.z + 4.35);
    faceTowards(dad.root, grill.position.x, grill.position.z);
    dad.torso.rotation.x = 0.12;
    dad.armR.rotation.set(-0.9, 0, 0.15);
    dad.foreR.rotation.x = -0.9;
    dad.armL.rotation.set(-0.45, 0, -0.1);
    dad.foreL.rotation.x = -0.8;
    root.add(dad.root);
    const spatula = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.01), propMats.metal);
    spatula.position.set(0, -0.36, 0.06);
    spatula.rotation.x = -0.6;
    dad.foreR.add(spatula);

    // Mom and Aunt — in conversation.
    const mom = buildFigure({ height: 1.6, skin: mats.skinA, top: cloth("#7a3b52", "#f0b7c8"), bottom: cloth("#5c2a3e"), hair: mats.hairDark, hairStyle: "long", dress: true });
    const aunt = buildFigure({ height: 1.62, skin: mats.skinC, top: cloth("#3f6f63", "#b9e6d8"), bottom: cloth("#2e4d45"), hair: mats.hairDark, hairStyle: "bun", dress: true });
    place(mom.root, CAMP.x + 0.6, CAMP.z - 2.9);
    place(aunt.root, CAMP.x - 0.6, CAMP.z - 3.6);
    faceTowards(mom.root, aunt.root.position.x, aunt.root.position.z);
    faceTowards(aunt.root, mom.root.position.x, mom.root.position.z);
    mom.armR.rotation.set(-0.5, 0, 0.25);
    mom.foreR.rotation.x = -1.2;
    aunt.armL.rotation.set(-0.2, 0, -0.1);
    aunt.foreL.rotation.x = -1.4;
    root.add(mom.root, aunt.root);

    // Grandma — resting in a chair by the fire.
    const chair = buildChair(true);
    place(chair, CAMP.x - 3.6, CAMP.z + 2.3);
    faceTowards(chair, fire.position.x, fire.position.z);
    root.add(chair);
    const grandma = buildFigure({ height: 1.55, skin: mats.skinB, top: cloth("#6d5a7a", "#d9c6e8"), bottom: cloth("#4d3f58"), hair: mats.hairGrey, hairStyle: "bun", dress: true });
    grandma.root.position.copy(chair.position);
    grandma.root.rotation.y = chair.rotation.y;
    grandma.torso.position.y = 0.46;
    grandma.torso.rotation.x = -0.12;
    grandma.legL.position.y = 0.46;
    grandma.legR.position.y = 0.46;
    grandma.legL.rotation.x = -1.45;
    grandma.legR.rotation.x = -1.45;
    grandma.kneeL.rotation.x = 1.5;
    grandma.kneeR.rotation.x = 1.5;
    grandma.armL.rotation.set(-0.5, 0, -0.1);
    grandma.armR.rotation.set(-0.5, 0, 0.1);
    grandma.foreL.rotation.x = -0.9;
    grandma.foreR.rotation.x = -0.9;
    root.add(grandma.root);

    // Brother — playing fetch with Bella.
    const brother = buildFigure({ height: 1.42, skin: mats.skinC, top: cloth("#c4632d", "#ffc49a"), bottom: cloth("#2e3a52"), hair: mats.hairDark, hairStyle: "kid" });
    place(brother.root, CAMP.x + 6.8, CAMP.z + 0.8);
    root.add(brother.root);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), propMats.ball);
    ball.castShadow = true;
    root.add(ball);
    const dog = buildDog();
    root.add(dog.root);

    // Girlfriend — at the lake's edge.
    const shore = shorePoint();
    const gf = buildFigure({ height: 1.6, skin: mats.skinA, top: cloth("#d9c7a6", "#fff3dc"), bottom: cloth("#c2ad8b"), hair: mats.hairDark, hairStyle: "long", dress: true });
    place(gf.root, shore.x, shore.y);
    faceTowards(gf.root, LAKE.x, LAKE.z);
    gf.armL.rotation.set(0.25, 0, -0.08);
    gf.armR.rotation.set(0.25, 0, 0.08);
    gf.foreL.rotation.x = -0.4;
    gf.foreR.rotation.x = -0.4;
    root.add(gf.root);

    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.receiveShadow = true;
    });

    const throwFrom = brother.root.position.clone();
    // Open, dry ground east of the camp.
    const throwTo = new THREE.Vector3(CAMP.x + 12.5, 0, CAMP.z + 6.5);
    throwTo.y = ground(throwTo.x, throwTo.z);
    faceTowards(brother.root, throwTo.x, throwTo.z);
    return { root, fire, dad, mom, aunt, grandma, brother, gf, dog, ball, throwFrom, throwTo };
  }, []);

  useEffect(
    () => () => {
      scene.root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
    },
    [scene]
  );

  useFrame(() => {
    const t = sharedUniforms.uTime.value;
    const { dad, mom, aunt, grandma, brother, gf, dog, ball, throwFrom, throwTo } = scene;
    // Breathing and small life-like motion.
    for (const [f, ph] of [
      [dad, 0],
      [mom, 1.3],
      [aunt, 2.1],
      [gf, 0.7],
      [grandma, 3.3],
    ] as const) {
      f.torso.scale.y = 1 + Math.sin(t * 1.6 + ph) * 0.006;
    }
    dad.foreR.rotation.x = -0.9 + Math.max(0, Math.sin(t * 2.2)) * 0.5;
    mom.foreR.rotation.x = -1.2 + Math.sin(t * 1.4) * 0.25;
    mom.head.rotation.y = Math.sin(t * 0.7) * 0.12;
    aunt.head.rotation.x = Math.sin(t * 1.1) * 0.06;
    gf.head.rotation.y = Math.sin(t * 0.25) * 0.2;
    grandma.head.rotation.x = 0.15 + Math.sin(t * 0.5) * 0.05;

    // Fetch loop (8 s): wind-up, throw, Bella runs out, brings the ball back.
    const T = 8;
    const c = (t % T) / T;
    const toward = new THREE.Vector3().subVectors(throwTo, throwFrom);
    const dist = toward.length();
    toward.normalize();
    brother.armR.rotation.x = c < 0.08 ? -2.6 * (c / 0.08) : c < 0.12 ? -2.6 + 3.4 * ((c - 0.08) / 0.04) : -0.2 * Math.max(0, 1 - (c - 0.12) * 4);
    const hand = throwFrom.clone().add(new THREE.Vector3(0, 1.25, 0));
    let dogPos: THREE.Vector3;
    let carrying = false;
    if (c < 0.12) {
      ball.position.copy(hand);
      dogPos = throwFrom.clone().addScaledVector(toward, 0.9);
    } else if (c < 0.3) {
      const k = (c - 0.12) / 0.18;
      ball.position.copy(hand).lerp(throwTo, k);
      ball.position.y = THREE.MathUtils.lerp(hand.y, throwTo.y + 0.06, k) + Math.sin(k * Math.PI) * 3.2;
      dogPos = throwFrom.clone().addScaledVector(toward, 0.9 + (dist - 1.2) * Math.min(1, (c - 0.14) / 0.2));
    } else if (c < 0.42) {
      ball.position.copy(throwTo).setY(throwTo.y + 0.06);
      dogPos = throwFrom.clone().addScaledVector(toward, 0.9 + (dist - 1.2) * Math.min(1, (c - 0.14) / 0.2));
    } else if (c < 0.78) {
      carrying = true;
      const k = (c - 0.42) / 0.36;
      dogPos = throwTo.clone().addScaledVector(toward, -k * (dist - 0.9));
    } else {
      dogPos = throwFrom.clone().addScaledVector(toward, 0.9);
      ball.position.copy(dogPos).addScaledVector(toward, 0.3).setY(ground(dogPos.x, dogPos.z) + 0.06);
    }
    dogPos.y = ground(dogPos.x, dogPos.z);
    const moving = (c > 0.14 && c < 0.42) || (c > 0.42 && c < 0.78);
    const heading = c > 0.42 && c < 0.78 ? Math.atan2(-toward.x, -toward.z) : Math.atan2(toward.x, toward.z);
    dog.root.position.copy(dogPos);
    dog.root.rotation.y = heading;
    dog.root.position.y += moving ? Math.abs(Math.sin(t * 14)) * 0.05 : 0;
    dog.legs.forEach((leg, i) => (leg.rotation.x = moving ? Math.sin(t * 14 + (i % 2) * Math.PI + (i > 1 ? Math.PI / 2 : 0)) * 0.7 : 0));
    dog.tail.rotation.z = Math.sin(t * (moving ? 14 : 9)) * 0.5;
    if (carrying) {
      const mouth = new THREE.Vector3(0, 0.33, 0.36).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading).add(dog.root.position);
      ball.position.copy(mouth);
    }
  });

  return <primitive object={scene.root} />;
}
