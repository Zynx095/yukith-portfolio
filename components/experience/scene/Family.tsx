"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMP, terrainHeight } from "@/lib/world/layout";
import { FAMILY_MOMENTS, MEMORIES } from "@/src/data/origins";
import { createRng, range } from "@/lib/world/noise";
import { registerTags } from "@/lib/world/tags";
import { shared } from "@/lib/world/materials";
import { frame } from "@/lib/world/store";
import { useWorld } from "./WorldContext";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mergeStatic } from "@/lib/world/mergeStatic";

/**
 * Family at the home camp: an afternoon by the lake — someone at the grill,
 * two people talking, someone resting in a chair by the fire, someone playing
 * with Bella. The figures are deliberately stylised and faceless (no one is
 * identified — docs/CONTENT_VERIFICATION.md §14); each has a quiet idle motion
 * and a name tag for what is happening, never for who. Small objects around
 * the camp hold memories.
 */

const ground = (x: number, z: number) => terrainHeight(CAMP.x + x, CAMP.z + z) - CAMP.y;

interface Rig {
  root: THREE.Group;
  hips: THREE.Object3D;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  foreL: THREE.Object3D;
  foreR: THREE.Object3D;
  legL: THREE.Object3D;
  legR: THREE.Object3D;
  shinL: THREE.Object3D;
  shinR: THREE.Object3D;
}

interface Look {
  height: number;
  build: number;
  top: THREE.Material;
  bottom: THREE.Material;
  skin: THREE.Material;
  hair: THREE.Material;
  hairStyle: "short" | "long" | "bun" | "cap";
  shoes: THREE.Material;
}

const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 6, 14);

const SKIN_MATERIAL = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 });

/**
 * A jointed, faceless figure (metres). Pivots sit at the joints so poses are
 * rotations. Every part is rigidly bound to one bone of a skeleton and the
 * whole figure is a single skinned mesh with baked colours: one draw call per
 * figure in the main pass and one in the shadow pass.
 */
function figure(o: Look, material: THREE.Material): Rig {
  const s = o.height / 1.72;
  const b = o.build;
  const bones: THREE.Bone[] = [];
  const parts: { bone: THREE.Bone; geo: THREE.BufferGeometry; color: THREE.Color; local: THREE.Matrix4 }[] = [];
  const colorOf = (m: THREE.Material) => (m as THREE.MeshStandardMaterial).color.clone();
  const joint = (parent: THREE.Object3D, x: number, y: number, z: number) => {
    const g = new THREE.Bone();
    g.position.set(x, y, z);
    parent.add(g);
    bones.push(g);
    return g;
  };
  const part = (bone: THREE.Bone, geo: THREE.BufferGeometry, mat: THREE.Material, y: number, x = 0, z = 0, scale: [number, number, number] = [1, 1, 1], rotX = 0) => {
    const local = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotX), new THREE.Vector3(...scale));
    parts.push({ bone, geo, color: colorOf(mat), local });
  };
  const root = new THREE.Group();
  const rootBone = new THREE.Bone();
  bones.push(rootBone);
  const hips = joint(rootBone, 0, 0.94 * s, 0);
  part(hips, capsule(0.15 * s * b, 0.12 * s), o.bottom, 0.02 * s, 0, 0, [1.15, 1, 0.8]);
  const torso = joint(hips, 0, 0.08 * s, 0);
  part(torso, capsule(0.165 * s * b, 0.32 * s), o.top, 0.25 * s, 0, 0, [1.12, 1, 0.72]);
  part(torso, capsule(0.05 * s, 0.06 * s), o.skin, 0.55 * s);
  const head = joint(torso, 0, 0.6 * s, 0);
  part(head, new THREE.SphereGeometry(0.105 * s, 20, 16), o.skin, 0.1 * s, 0, 0, [0.92, 1.08, 1]);
  part(head, new THREE.SphereGeometry(0.112 * s, 20, 12, 0, Math.PI * 2, 0, Math.PI * (o.hairStyle === "long" ? 0.68 : 0.52)), o.hair, 0.115 * s, 0, -0.008 * s, [1, 1, 1], -0.25);
  if (o.hairStyle === "long") part(head, capsule(0.075 * s, 0.16 * s), o.hair, -0.02 * s, 0, -0.06 * s, [1.3, 1, 0.6]);
  if (o.hairStyle === "bun") part(head, new THREE.SphereGeometry(0.05 * s, 12, 10), o.hair, 0.16 * s, 0, -0.09 * s);
  if (o.hairStyle === "cap") part(head, new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 0.02 * s, 20), o.hair, 0.15 * s, 0, 0.04 * s);
  const arm = (side: number) => {
    const a = joint(torso, side * 0.2 * s * b, 0.46 * s, 0);
    part(a, capsule(0.048 * s * b, 0.22 * s), o.top, -0.15 * s);
    const f = joint(a, 0, -0.3 * s, 0);
    part(f, capsule(0.04 * s, 0.2 * s), o.skin, -0.13 * s);
    part(f, new THREE.SphereGeometry(0.045 * s, 10, 8), o.skin, -0.27 * s);
    return { a, f };
  };
  const L = arm(-1);
  const R = arm(1);
  const leg = (side: number) => {
    const l = joint(hips, side * 0.09 * s, -0.02 * s, 0);
    part(l, capsule(0.07 * s * b, 0.32 * s), o.bottom, -0.22 * s);
    const sh = joint(l, 0, -0.44 * s, 0);
    part(sh, capsule(0.055 * s, 0.32 * s), o.bottom, -0.21 * s);
    part(sh, new THREE.BoxGeometry(0.1 * s, 0.07 * s, 0.24 * s), o.shoes, -0.44 * s, 0, 0.05 * s);
    return { l, sh };
  };
  const LL = leg(-1);
  const RL = leg(1);

  // Bake every part into the skeleton's rest space, rigidly weighted to its bone.
  rootBone.updateMatrixWorld(true);
  const baked = parts.map(({ bone, geo, color, local }) => {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(bone.matrixWorld, local));
    const n = g.attributes.position.count;
    const bi = bones.indexOf(bone);
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).fill(0).map((_, i) => (i % 4 === 0 ? bi : 0)), 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, i) => (i % 4 === 0 ? 1 : 0)), 4));
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.set([color.r, color.g, color.b], i * 3);
    g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
    for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv", "skinIndex", "skinWeight", "color"].includes(name)) g.deleteAttribute(name);
    return g;
  });
  const geometry = mergeGeometries(baked)!;
  baked.forEach((g) => g.dispose());
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.add(rootBone);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  root.add(mesh);
  return { root, hips, torso, head, armL: L.a, armR: R.a, foreL: L.f, foreR: R.f, legL: LL.l, legR: RL.l, shinL: LL.sh, shinR: RL.sh };
}

/** Seat a rig (hips down to chair height, thighs forward, shins down). */
function sit(r: Rig, seat: number) {
  r.hips.position.y = seat;
  r.legL.rotation.x = r.legR.rotation.x = -1.45;
  r.shinL.rotation.x = r.shinR.rotation.x = 1.4;
  r.torso.rotation.x = -0.22;
}

export function Family() {
  const { glow } = useWorld();
  const group = useRef<THREE.Group>(null);
  const smoke = useRef<THREE.Points>(null);
  const res = useMemo(() => {
    const std = (c: string, rough = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: rough });
    const skins = [std("#8d5a3c", 0.6), std("#7a4a30", 0.6), std("#a06a48", 0.6), std("#6e4329", 0.6), std("#94603f", 0.6)];
    const hairDark = std("#1d1511", 0.7);
    const hairGrey = std("#8f8a84", 0.7);
    const shoes = std("#2a2420", 0.7);
    const looks: Look[] = [
      { height: 1.76, build: 1.1, top: std("#2f4f6e"), bottom: std("#3b3833"), skin: skins[0], hair: hairDark, hairStyle: "short", shoes },
      { height: 1.62, build: 0.95, top: std("#7a3b52"), bottom: std("#4a2a3a"), skin: skins[1], hair: hairDark, hairStyle: "long", shoes },
      { height: 1.64, build: 0.95, top: std("#3f6f63"), bottom: std("#2e4d45"), skin: skins[2], hair: hairDark, hairStyle: "bun", shoes },
      { height: 1.58, build: 1.0, top: std("#a88a5a"), bottom: std("#5a4a3a"), skin: skins[3], hair: hairGrey, hairStyle: "bun", shoes },
      { height: 1.68, build: 1.0, top: std("#c9c2b4"), bottom: std("#2c3a52"), skin: skins[4], hair: hairDark, hairStyle: "cap", shoes },
    ];
    const root = new THREE.Group();
    const place = (r: Rig, x: number, z: number, faceX: number, faceZ: number) => {
      r.root.position.set(x, ground(x, z), z);
      r.root.rotation.y = Math.atan2(faceX - x, faceZ - z);
      root.add(r.root);
    };
    const fire = new THREE.Vector3(-1.2, 0, 0.4);

    // The grill: a kettle on legs, glowing coals, a small side table.
    const grillPos = new THREE.Vector3(4.4, 0, 3.4);
    const grill = new THREE.Group();
    grill.position.set(grillPos.x, ground(grillPos.x, grillPos.z), grillPos.z);
    const steel = std("#2b2b2d", 0.4);
    (steel as THREE.MeshStandardMaterial).metalness = 0.7;
    const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steel);
    kettle.position.y = 0.86;
    kettle.castShadow = true;
    grill.add(kettle);
    const coals = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff6a2a").multiplyScalar(2.2), toneMapped: false }));
    coals.rotation.x = -Math.PI / 2;
    coals.position.y = 0.84;
    grill.add(coals);
    const grate = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.012, 6, 32), steel);
    grate.rotation.x = Math.PI / 2;
    grate.position.y = 0.87;
    grill.add(grate);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), steel);
      leg.position.set(Math.cos(a) * 0.22, 0.42, Math.sin(a) * 0.22);
      leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25);
      grill.add(leg);
    }
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.45), std("#7a5a3c"));
    table.position.set(0.75, 0.75, 0);
    grill.add(table);
    for (const [x, z] of [[0.45, -0.18], [1.05, -0.18], [0.45, 0.18], [1.05, 0.18]]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 6), steel);
      l.position.set(x, 0.375, z);
      grill.add(l);
    }
    root.add(grill);

    const skin = SKIN_MATERIAL();
    const rigs: Rig[] = looks.map((l) => figure(l, skin));
    // Grill: standing over the kettle, one arm working.
    place(rigs[0], grillPos.x, grillPos.z + 0.75, grillPos.x, grillPos.z);
    rigs[0].torso.rotation.x = 0.12;
    rigs[0].armR.rotation.set(-0.9, 0, 0.12);
    rigs[0].foreR.rotation.x = -0.8;
    rigs[0].armL.rotation.set(-0.4, 0, -0.1);
    rigs[0].foreL.rotation.x = -0.9;
    const spatula = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.3), steel);
    spatula.position.set(0, -0.3, 0.12);
    rigs[0].foreR.add(spatula);
    // Two people talking near the tent.
    place(rigs[1], -6.0, 3.4, -5.0, 4.4);
    place(rigs[2], -5.0, 4.4, -6.0, 3.4);
    rigs[1].armL.rotation.set(-0.2, 0, 0.15);
    rigs[2].armR.rotation.set(-0.5, 0, -0.2);
    rigs[2].foreR.rotation.x = -1.1;
    // Resting in the chair nearest the tent, facing the fire.
    const ca = 3.7;
    const cx = fire.x + Math.cos(ca) * 2.3;
    const cz = fire.z + Math.sin(ca) * 2.3;
    place(rigs[3], cx, cz, fire.x, fire.z);
    sit(rigs[3], 0.5);
    rigs[3].armL.rotation.set(-0.5, 0, -0.25);
    rigs[3].armR.rotation.set(-0.5, 0, 0.25);
    rigs[3].foreL.rotation.x = rigs[3].foreR.rotation.x = -0.6;
    // Crouched by Bella with a stick.
    place(rigs[4], 2.7, 3.1, 1.4, 1.9);
    rigs[4].hips.position.y = 0.52;
    rigs[4].legL.rotation.x = -1.7;
    rigs[4].shinL.rotation.x = 2.2;
    rigs[4].legR.rotation.x = -0.7;
    rigs[4].shinR.rotation.x = 1.9;
    rigs[4].torso.rotation.x = 0.35;
    rigs[4].armR.rotation.set(-1.2, 0, 0.1);
    rigs[4].foreR.rotation.x = -0.3;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.5, 6), std("#6b4a2e"));
    stick.rotation.z = Math.PI / 2;
    stick.position.set(0, -0.3, 0.05);
    rigs[4].foreR.add(stick);

    // Memory objects: a framed photo on a camp table, the scrap-built PC by the blanket.
    const memoryObjects = new THREE.Group();
    const tableM = std("#6e4b30");
    const ct = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), tableM);
    ct.position.set(-3.2, ground(-3.2, 2.8) + 0.62, 2.8);
    ct.castShadow = true;
    memoryObjects.add(ct);
    for (const [dx, dz] of [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.62, 6), steel);
      l.position.set(-3.2 + dx, ground(-3.2, 2.8) + 0.31, 2.8 + dz);
      memoryObjects.add(l);
    }
    const frameM = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, 0.02), std("#c9a45a", 0.4));
    frameM.position.set(-3.2, ground(-3.2, 2.8) + 0.73, 2.78);
    frameM.rotation.set(-0.2, 0.6, 0);
    memoryObjects.add(frameM);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.12), new THREE.MeshStandardMaterial({ color: "#e8d2b0", emissive: new THREE.Color("#3a2a18"), roughness: 0.6 }));
    photo.position.copy(frameM.position).add(new THREE.Vector3(Math.sin(0.6) * 0.012, 0, Math.cos(0.6) * 0.012));
    photo.rotation.copy(frameM.rotation);
    memoryObjects.add(photo);
    const pc = new THREE.Group();
    pc.position.set(3.4, ground(3.4, 0.0), 0.0);
    pc.rotation.y = -0.7;
    const caseM = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.44), std("#3a3d42", 0.5));
    caseM.position.y = 0.23;
    caseM.castShadow = true;
    pc.add(caseM);
    const fan = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(1.6), toneMapped: false }));
    fan.position.set(0.112, 0.3, 0.08);
    fan.rotation.y = Math.PI / 2;
    pc.add(fan);
    memoryObjects.add(pc);
    root.add(memoryObjects);

    // Smoke from the grill: soft sprites rising and drifting.
    const N = 26;
    const rng = createRng(77);
    const seeds = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) seeds.set([rng(), range(rng, 0.6, 1.4)], i * 2);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    sg.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 2));
    sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(grillPos.x, 2, grillPos.z), 4);
    const sm = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: shared.uTime, uMap: { value: glow }, uBase: { value: new THREE.Vector3(grillPos.x, ground(grillPos.x, grillPos.z) + 1.0, grillPos.z) } },
      vertexShader: /* glsl */ `
        attribute vec2 aSeed;
        uniform float uTime;
        uniform vec3 uBase;
        varying float vA;
        void main() {
          float t = fract(uTime * 0.12 * aSeed.y + aSeed.x);
          vec3 p = uBase + vec3(sin(t * 6.0 + aSeed.x * 20.0) * 0.25 + t * 0.9, t * 3.2, cos(t * 5.0 + aSeed.x * 13.0) * 0.2 - t * 0.4);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (60.0 + 140.0 * t) / max(-mv.z, 1.0);
          vA = smoothstep(0.0, 0.15, t) * (1.0 - t);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying float vA;
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a * vA * 0.22;
          gl_FragColor = vec4(vec3(0.78, 0.76, 0.72), a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const smokePts = new THREE.Points(sg, sm);
    // The grill, tables and memory objects are static: merge them by material.
    const statics = mergeStatic(root, (o) => o instanceof THREE.SkinnedMesh || o.type === "Bone" || rigs.some((r) => r.root === o));
    return { root: statics, rigs, smokePts, materials: [...skins, hairDark, hairGrey, shoes, steel, tableM, sm, skin] };
  }, [glow]);

  useEffect(() => {
    const at = (x: number, y: number, z: number) => new THREE.Vector3(CAMP.x + x, CAMP.y + ground(x, z) + y, CAMP.z + z);
    const unique = FAMILY_MOMENTS.filter((m, i, all) => all.findIndex((x) => x.title === m.title) === i);
    const familyPos: Record<string, THREE.Vector3> = {
      "family-grill": at(4.4, 2.15, 4.15),
      "family-talk": at(-5.5, 2.1, 3.9),
      "family-rest": at(-3.15, 1.6, -0.82),
      "family-play": at(2.7, 1.45, 3.1),
    };
    const memoryPos: Record<string, THREE.Vector3> = {
      "memory-birthday": at(-3.2, 1.0, 2.8),
      "memory-pc": at(3.4, 0.75, 0.0),
      "memory-games": at(1.9, 0.35, 1.3),
      "memory-turning-point": at(2.35, 0.3, 1.45),
      "memory-lock-in": at(-4.6, 2.2, -1.2),
    };
    const unregister = registerTags([
      ...unique.map((m) => ({ id: m.id, title: m.title, position: familyPos[m.id], near: 30, region: null, story: [0.06, 0.17] as [number, number] })),
      ...MEMORIES.map((m) => ({ id: m.id, title: m.title, position: memoryPos[m.id], near: 11, region: null, story: [0.06, 0.17] as [number, number] })),
    ]);
    return () => {
      unregister();
      res.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => mm.dispose());
        }
      });
      res.smokePts.geometry.dispose();
      res.materials.forEach((m) => m.dispose());
    };
  }, [res]);

  useFrame(() => {
    const p = frame.progress;
    const visible = !frame.region && p < 0.2;
    if (group.current) group.current.visible = visible;
    if (!visible) return;
    const t = shared.uTime.value;
    const [grill, talkA, talkB, rest, play] = res.rigs;
    // Small, unhurried motions: breathing, a head turning, the grill hand working, a gesture.
    for (const r of res.rigs) r.torso.scale.y = 1 + Math.sin(t * 1.6 + r.root.position.x) * 0.006;
    grill.foreR.rotation.x = -0.8 + Math.sin(t * 2.4) * 0.18;
    grill.head.rotation.y = Math.sin(t * 0.4) * 0.25;
    talkA.head.rotation.y = Math.sin(t * 0.7) * 0.15;
    talkB.armR.rotation.x = -0.5 + Math.sin(t * 1.3) * 0.18;
    talkB.foreR.rotation.x = -1.1 + Math.sin(t * 1.9 + 1) * 0.2;
    rest.head.rotation.x = 0.15 + Math.sin(t * 0.3) * 0.05;
    play.armR.rotation.x = -1.2 + Math.sin(t * 2.1) * 0.25;
    play.head.rotation.y = Math.sin(t * 0.9) * 0.2;
  });

  return (
    <group ref={group} position={CAMP}>
      <primitive object={res.root} />
      <primitive object={res.smokePts} ref={smoke} />
    </group>
  );
}
