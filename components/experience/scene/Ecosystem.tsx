"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMP, TREE, isReserved, pathInfo, terrainHeight, terrainNormal, valleyCenter } from "@/lib/world/layout";
import { buildTube, resampleCurve } from "@/lib/world/geometry";
import { createBarkMaterial, shared } from "@/lib/world/materials";
import { SimplexNoise, createRng, range } from "@/lib/world/noise";
import { frame } from "@/lib/world/store";
import { Glows, type GlowPoint } from "./Glows";
import { useWorld } from "./WorldContext";

/**
 * Life between the landmarks: fallen logs with moss and mushrooms, wildflower
 * drifts in three colours along the meadow, birds wheeling round the World
 * Tree's crown by day, fireflies over the roots at dusk. Everything is
 * instanced (one draw per kind) and placed on the terrain, away from the
 * trail, the camp, the lake, the river and the district.
 */

const N = new SimplexNoise(5150);

function fallenLog(seed: number) {
  const rng = createRng(seed);
  const len = range(rng, 5, 11);
  const r = range(rng, 0.28, 0.55);
  const ctrl = [0, 0.35, 0.7, 1].map((t) => new THREE.Vector3(t * len - len / 2, r * 0.7 + Math.sin(t * 3 + seed) * 0.08, Math.sin(t * 2.4 + seed) * 0.4));
  const pts = resampleCurve(ctrl, 18);
  const radii = pts.map((_, i) => r * (1 - 0.25 * (i / (pts.length - 1))));
  const g = buildTube({ points: pts, radii, radialSegments: 10, bumpiness: 0.12, noise: N, vScale: 3, uRepeats: 2, capEnd: true });
  return { geo: g, len, r };
}

/** A small mushroom (cap + stem), unit height. */
function mushroomGeometry() {
  const cap = new THREE.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.scale(1, 0.55, 1);
  cap.translate(0, 0.62, 0);
  const stem = new THREE.CylinderGeometry(0.14, 0.18, 0.65, 8);
  stem.translate(0, 0.32, 0);
  const g = new THREE.BufferGeometry();
  const merge = [cap, stem].map((x) => x.toNonIndexed());
  const pos = new Float32Array(merge.reduce((n, x) => n + x.attributes.position.array.length, 0));
  const nor = new Float32Array(pos.length);
  let o = 0;
  for (const x of merge) {
    pos.set(x.attributes.position.array as Float32Array, o);
    nor.set(x.attributes.normal.array as Float32Array, o);
    o += x.attributes.position.array.length;
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  // Cap vs stem colour by height.
  const col = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    const capPart = pos[i + 1] > 0.6 ? 1 : 0;
    col.set(capPart ? [1, 1, 1] : [0.92, 0.88, 0.8], i);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  cap.dispose();
  stem.dispose();
  merge.forEach((x) => x.dispose());
  return g;
}

/** A five-petal flower drawn once into a small texture. */
function flowerTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(32 + Math.cos(a) * 14, 32 + Math.sin(a) * 14, 12, 8, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#e8c24a";
  ctx.beginPath();
  ctx.arc(32, 32, 6, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A bird: two wings that flap in the vertex shader, flying a circle. */
function birdMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime, uNight: shared.uNight },
    vertexShader: /* glsl */ `
      attribute vec4 aOrbit; // centre x, z, radius, height
      attribute vec2 aSeed;  // phase, speed
      uniform float uTime;
      varying float vShade;
      void main() {
        float a = aSeed.x + uTime * aSeed.y;
        vec3 c = vec3(aOrbit.x + cos(a) * aOrbit.z, aOrbit.w + sin(a * 2.3) * 6.0, aOrbit.y + sin(a) * aOrbit.z);
        vec3 fwd = normalize(vec3(-sin(a), 0.0, cos(a)));
        vec3 side = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
        float flap = sin(uTime * 9.0 * aSeed.y * 3.0 + aSeed.x * 10.0) * 0.6;
        vec3 p = position;
        float wing = sign(p.x) * min(abs(p.x), 1.0);
        float y = abs(p.x) * flap;
        vec3 world = c + side * p.x * 1.6 + fwd * p.z * 0.9 + vec3(0.0, y, 0.0);
        vShade = 0.6 + 0.4 * abs(wing);
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      varying float vShade;
      void main() {
        gl_FragColor = vec4(vec3(0.06, 0.055, 0.05) * vShade, 1.0);
      }
    `,
  });
}

export function Ecosystem() {
  const { assets, quality } = useWorld();
  const birds = useRef<THREE.Mesh>(null);
  const res = useMemo(() => {
    const density = 0.4 + 0.6 * quality.foliage;
    const root = new THREE.Group();
    const bark = createBarkMaterial(assets, { ground: -1000, moss: 0.9, brightness: 1.25, tint: "#e9d6bd" });
    const rng = createRng(9090);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const n = new THREE.Vector3();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();

    // Where things may grow: off the trail and out of every reserved area.
    const free = (x: number, z: number, margin = 2) => !isReserved(x, z, margin) && pathInfo(x, z).dist > 3.5;
    const forestEdge = (x: number, z: number) => {
      const d = Math.abs(x - valleyCenter(z));
      return d > 55 && d < 190;
    };
    const nearTree = (x: number, z: number) => {
      const d = Math.hypot(x - TREE.x, z - TREE.z);
      return d > 135 && d < 260;
    };
    const sample = (count: number, accept: (x: number, z: number) => boolean, area: [number, number, number, number]) => {
      const out: THREE.Vector3[] = [];
      let guard = 0;
      while (out.length < count && guard++ < count * 120) {
        const x = range(rng, area[0], area[1]);
        const z = range(rng, area[2], area[3]);
        if (accept(x, z)) out.push(new THREE.Vector3(x, terrainHeight(x, z), z));
      }
      return out;
    };

    // Fallen logs (four shapes, instanced), lying along the ground's slope.
    const logSpots = sample(Math.round(46 * density), (x, z) => free(x, z, 4) && (forestEdge(x, z) || nearTree(x, z)), [-260, 300, -1050, 40]);
    const logs = [0, 1, 2, 3].map((k) => fallenLog(31 + k));
    const mushroomSpots: { pos: THREE.Vector3; scale: number; tint: number }[] = [];
    logs.forEach((lg, k) => {
      const spots = logSpots.filter((_, i) => i % logs.length === k);
      const im = new THREE.InstancedMesh(lg.geo, bark, spots.length);
      spots.forEach((pt, i) => {
        terrainNormal(pt.x, pt.z, n);
        const yaw = rng() * Math.PI * 2;
        q.setFromUnitVectors(up, n.clone().lerp(up, 0.4).normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(up, yaw));
        p.copy(pt).add(new THREE.Vector3(0, -lg.r * 0.35, 0));
        m4.compose(p, q, s.setScalar(range(rng, 0.8, 1.2)));
        im.setMatrixAt(i, m4);
        // A cluster of mushrooms at the foot of the log.
        const count = 3 + Math.floor(rng() * 6);
        for (let c = 0; c < count; c++) {
          const off = new THREE.Vector3(range(rng, -lg.len / 2, lg.len / 2), 0, (rng() < 0.5 ? -1 : 1) * (lg.r + range(rng, 0.05, 0.5))).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(up, yaw));
          const x = pt.x + off.x;
          const z = pt.z + off.z;
          mushroomSpots.push({ pos: new THREE.Vector3(x, terrainHeight(x, z) - 0.02, z), scale: range(rng, 0.07, 0.2), tint: rng() });
        }
      });
      im.castShadow = true;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      root.add(im);
    });
    // Mushrooms round the World Tree's roots too.
    for (const pt of sample(Math.round(160 * density), (x, z) => {
      const d = Math.hypot(x - TREE.x, z - TREE.z);
      return d > 60 && d < 150 && pathInfo(x, z).dist > 5;
    }, [TREE.x - 150, TREE.x + 150, TREE.z - 150, TREE.z + 150]))
      mushroomSpots.push({ pos: pt.setY(pt.y - 0.02), scale: range(rng, 0.08, 0.26), tint: rng() });

    const mushGeo = mushroomGeometry();
    const mush = new THREE.InstancedMesh(mushGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), mushroomSpots.length);
    const capColors = ["#e8dcc4", "#b0563a", "#c9a46a", "#f1ece0"].map((c) => new THREE.Color(c));
    mushroomSpots.forEach((m, i) => {
      m4.compose(m.pos, q.setFromAxisAngle(up, m.tint * 6), s.setScalar(m.scale));
      mush.setMatrixAt(i, m4);
      mush.setColorAt(i, capColors[Math.floor(m.tint * capColors.length) % capColors.length]);
    });
    mush.computeBoundingSphere();
    root.add(mush);

    // Wildflowers: drifts of small cross-cards in white, violet and blue along the meadow.
    const ftex = flowerTexture();
    const card = new THREE.PlaneGeometry(1, 1);
    card.translate(0, 0.5, 0);
    const cross = new THREE.BufferGeometry();
    {
      const a = card.clone();
      const b = card.clone().rotateY(Math.PI / 2);
      const parts = [a, b].map((x) => x.toNonIndexed());
      const pos = new Float32Array(parts[0].attributes.position.array.length * 2);
      const uv = new Float32Array(parts[0].attributes.uv.array.length * 2);
      pos.set(parts[0].attributes.position.array as Float32Array, 0);
      pos.set(parts[1].attributes.position.array as Float32Array, parts[0].attributes.position.array.length);
      uv.set(parts[0].attributes.uv.array as Float32Array, 0);
      uv.set(parts[1].attributes.uv.array as Float32Array, parts[0].attributes.uv.array.length);
      cross.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      cross.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      cross.computeVertexNormals();
      [a, b, ...parts].forEach((x) => x.dispose());
    }
    card.dispose();
    const flowerSpots = sample(Math.round(2200 * density), (x, z) => free(x, z, 1) && pathInfo(x, z).dist < 60 && N.noise2(x * 0.04 - 7, z * 0.04) > 0.15, [-80, 160, -700, 40]);
    const flowerMat = new THREE.MeshStandardMaterial({ map: ftex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
    const flowers = new THREE.InstancedMesh(cross, flowerMat, flowerSpots.length);
    const fcols = ["#f4f0e8", "#b9a0e0", "#8fb0e8", "#f0d2e0"].map((c) => new THREE.Color(c));
    flowerSpots.forEach((pt, i) => {
      m4.compose(pt.setY(pt.y + 0.02), q.setFromAxisAngle(up, rng() * Math.PI), s.setScalar(range(rng, 0.14, 0.26)));
      flowers.setMatrixAt(i, m4);
      flowers.setColorAt(i, fcols[Math.floor(N.noise2(pt.x * 0.02, pt.z * 0.02) * 2 + 2) % fcols.length]);
    });
    flowers.computeBoundingSphere();
    root.add(flowers);

    // Birds round the crown, and a few over the valley.
    const birdGeo = new THREE.BufferGeometry();
    birdGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, 0, -0.2, 0, 0, 0.35, 0, 0, -0.3, 1, 0, -0.2, 0, 0, 0.35, 0, 0, -0.3], 3));
    const nb = 22;
    const orbit = new Float32Array(nb * 4);
    const seeds = new Float32Array(nb * 2);
    for (let i = 0; i < nb; i++) {
      const overTree = i < 15;
      orbit.set(overTree ? [TREE.x + range(rng, -40, 40), TREE.z + range(rng, -40, 40), range(rng, 380, 620), range(rng, 380, 560)] : [range(rng, -40, 80), range(rng, -420, -120), range(rng, 60, 160), range(rng, 50, 110)], i * 4);
      seeds.set([rng() * Math.PI * 2, (overTree ? 0.035 : 0.06) * (rng() < 0.5 ? -1 : 1) * range(rng, 0.8, 1.2)], i * 2);
    }
    const ig = new THREE.InstancedBufferGeometry();
    ig.index = null;
    ig.setAttribute("position", birdGeo.getAttribute("position"));
    ig.setAttribute("aOrbit", new THREE.InstancedBufferAttribute(orbit, 4));
    ig.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 2));
    ig.instanceCount = nb;
    const birdMat = birdMaterial();

    // Fireflies over the roots and the camp meadow at dusk (night-only glows).
    const fireflies: GlowPoint[] = [];
    for (const pt of sample(Math.round(140 * density), (x, z) => {
      const d = Math.hypot(x - TREE.x, z - TREE.z);
      return (d > 70 && d < 200) || Math.hypot(x - CAMP.x, z - CAMP.z) < 40;
    }, [-200, 200, -1020, 40]))
      fireflies.push({ position: pt.add(new THREE.Vector3(0, range(rng, 0.6, 2.4), 0)), size: range(rng, 0.25, 0.45), color: "#d8ff9a", night: 1, pulse: rng() * 6 });

    return { root, ig, birdMat, fireflies, materials: [bark, mush.material as THREE.Material, flowerMat], geos: [mushGeo, cross, birdGeo, ...logs.map((l) => l.geo)], ftex };
  }, [assets, quality.foliage]);

  useEffect(
    () => () => {
      res.materials.forEach((m) => m.dispose());
      res.geos.forEach((g) => g.dispose());
      res.ig.dispose();
      res.birdMat.dispose();
      res.ftex.dispose();
    },
    [res]
  );

  useFrame(() => {
    if (birds.current) birds.current.visible = frame.progress < 0.47 && !frame.region;
  });

  return (
    <group>
      <primitive object={res.root} />
      <mesh ref={birds} geometry={res.ig} material={res.birdMat} frustumCulled={false} />
      <Glows points={res.fireflies} />
    </group>
  );
}
