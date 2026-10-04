"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useWorldResources } from "./WorldResources";
import { createWaterMaterial, sharedUniforms } from "@/lib/world/materials";
import { LAKE, RIVER_CURVE, WATER_LEVEL, WATERFALL, lakeDistance, riverHalfWidth, terrainHeight } from "@/lib/world/layout";
import { createRng } from "@/lib/world/noise";

/**
 * Water, following the geography: the plateau stream pours over the lip into
 * the plunge pool, the river runs down to the lake by the camp. Every
 * animation here runs on the GPU.
 */

/** Grid in the lake's rotated frame, a little larger than the shoreline so it meets the banks. */
function buildLake() {
  const nx = 84;
  const nz = 60;
  const ex = LAKE.rx * 1.55;
  const ez = LAKE.rz * 1.55;
  const c = Math.cos(-LAKE.rotation);
  const s = Math.sin(-LAKE.rotation);
  const pos: number[] = [];
  const uv: number[] = [];
  const depth: number[] = [];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const lx = (i / nx - 0.5) * 2 * ex;
      const lz = (j / nz - 0.5) * 2 * ez;
      const x = LAKE.x + lx * c - lz * s;
      const z = LAKE.z + lx * s + lz * c;
      pos.push(x, WATER_LEVEL, z);
      uv.push(x * 0.045, z * 0.045);
      depth.push(WATER_LEVEL - terrainHeight(x, z));
    }
  }
  return grid(pos, uv, depth, nx, nz);
}

function grid(pos: number[], uv: number[], depth: number[], nx: number, nz: number, owned?: boolean[]) {
  const index: number[] = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const d = a + nx + 1;
      const e = d + 1;
      // Skip cells that are entirely dry ground.
      if (depth[a] < -0.4 && depth[b] < -0.4 && depth[d] < -0.4 && depth[e] < -0.4) continue;
      // Skip cells another water surface already covers (no doubled transparency).
      if (owned && owned[a] && owned[b] && owned[d] && owned[e]) continue;
      index.push(a, d, b, b, d, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("aDepth", new THREE.Float32BufferAttribute(depth, 1));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 3).fill(0).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  return geo;
}

/** Ribbon down the river centreline, conforming to the carved channel. */
function buildRiver() {
  const along = 180;
  const across = 10;
  const pos: number[] = [];
  const uv: number[] = [];
  const depth: number[] = [];
  const inLake: boolean[] = [];
  const length = RIVER_CURVE.getLength();
  for (let j = 0; j <= along; j++) {
    const t = j / along;
    const p = RIVER_CURVE.getPointAt(t);
    const tan = RIVER_CURVE.getTangentAt(t);
    const nx = -tan.z;
    const nz = tan.x;
    const l = Math.hypot(nx, nz) || 1;
    const hw = riverHalfWidth(t) + 1.2;
    for (let i = 0; i <= across; i++) {
      const u = i / across - 0.5;
      const x = p.x + (nx / l) * u * 2 * hw;
      const z = p.z + (nz / l) * u * 2 * hw;
      pos.push(x, p.y, z);
      uv.push(u * 0.35, (t * length) / 9);
      depth.push(p.y - terrainHeight(x, z));
      inLake.push(lakeDistance(x, z) < 0.97);
    }
  }
  return grid(pos, uv, depth, across, along, inLake);
}

function buildPool() {
  const rings = 14;
  const segs = 56;
  const r0 = WATERFALL.poolRadius + 1.6;
  const pos: number[] = [WATERFALL.pool.x, WATERFALL.pool.y, WATERFALL.pool.z];
  const uv: number[] = [WATERFALL.pool.x * 0.045, WATERFALL.pool.z * 0.045];
  const depth: number[] = [WATERFALL.pool.y - terrainHeight(WATERFALL.pool.x, WATERFALL.pool.z)];
  for (let r = 1; r <= rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const x = WATERFALL.pool.x + Math.cos(a) * (r / rings) * r0;
      const z = WATERFALL.pool.z + Math.sin(a) * (r / rings) * r0;
      pos.push(x, WATERFALL.pool.y, z);
      uv.push(x * 0.045, z * 0.045);
      depth.push(WATERFALL.pool.y - terrainHeight(x, z));
    }
  }
  const index: number[] = [];
  for (let s = 0; s < segs; s++) index.push(0, 1 + ((s + 1) % segs), 1 + s);
  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = 1 + (r - 1) * segs + s;
      const b = 1 + (r - 1) * segs + ((s + 1) % segs);
      const c = a + segs;
      const d = b + segs;
      index.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("aDepth", new THREE.Float32BufferAttribute(depth, 1));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
  geo.setIndex(index);
  return geo;
}

/** The falling sheet: arcs out from the lip and drops into the pool. */
function buildFallSheet(layer: number) {
  const rows = 48;
  const cols = 16;
  const n = WATERFALL.normal;
  const side = new THREE.Vector3(-n.z, 0, n.x);
  const top = WATERFALL.lip.y + 0.4;
  const bottom = WATERFALL.pool.y - 0.2;
  const pos: number[] = [];
  const uv: number[] = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const y = THREE.MathUtils.lerp(top, bottom, t);
    const out = 0.6 + 4.2 * Math.pow(t, 1.6) + layer * 0.35;
    const width = WATERFALL.width * (0.85 + 0.35 * t) * (1 - layer * 0.12);
    for (let i = 0; i <= cols; i++) {
      const u = i / cols - 0.5;
      const bulge = (1 - 4 * u * u) * 0.5;
      const p = new THREE.Vector3(WATERFALL.lip.x, y, WATERFALL.lip.z)
        .addScaledVector(n, out + bulge)
        .addScaledVector(side, u * width);
      pos.push(p.x, p.y, p.z);
      uv.push(i / cols, t);
    }
  }
  const index: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      index.push(a, a + cols + 1, a + 1, a + 1, a + cols + 1, a + cols + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

function createFallMaterial(layer: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: { ...THREE.UniformsLib.fog, uTime: sharedUniforms.uTime, uLayer: { value: layer } },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 transformed = position;
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uLayer;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float n(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
      }
      void main() {
        float y = vUv.y; // 0 at the lip, 1 at the pool
        // sqrt(y) as the flow coordinate: features accelerate as they fall.
        float phase = sqrt(y) * 7.0 - uTime * (1.05 + uLayer * 0.3);
        float x = vUv.x + uLayer * 0.37;
        float cols = n(vec2(x * 38.0, phase * 2.2)) * 0.5 + n(vec2(x * 83.0, phase * 5.0)) * 0.3 + n(vec2(x * 11.0, phase * 0.9)) * 0.2;
        float aerated = smoothstep(0.38, 0.8, cols);
        // A smooth, glassy tongue where the water leaves the lip.
        float glassy = 1.0 - smoothstep(0.02, 0.2, y);
        aerated = mix(aerated, aerated * 0.3, glassy);
        // Ragged, breaking edges.
        float side = min(vUv.x, 1.0 - vUv.x);
        float rag = n(vec2(vUv.x * 5.0, phase * 1.3)) - 0.5;
        float edge = smoothstep(0.0, 0.16, side + rag * 0.1 * (0.3 + y));
        float foam = smoothstep(0.8, 1.0, y);
        vec3 body = mix(vec3(0.1, 0.17, 0.17), vec3(0.42, 0.5, 0.5), glassy * 0.6);
        vec3 water = mix(body, vec3(1.0, 1.0, 0.97), max(aerated, foam * 0.9));
        float alpha = mix(0.38, 0.96, max(aerated, foam)) * edge * smoothstep(0.0, 0.025, y);
        alpha *= 1.0 - uLayer * 0.45;
        gl_FragColor = vec4(water * 1.12, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
}

/** Spray and mist rising from the plunge pool. */
function createMist() {
  const rng = createRng(909);
  const count = 420;
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = WATERFALL.lip.x + WATERFALL.normal.x * 4.6;
    pos[i * 3 + 1] = WATERFALL.pool.y;
    pos[i * 3 + 2] = WATERFALL.lip.z + WATERFALL.normal.z * 4.6;
    for (let k = 0; k < 4; k++) seed[i * 4 + k] = rng();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: sharedUniforms.uTime, uScale: { value: 900 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uScale;
      attribute vec4 aSeed;
      varying float vAlpha;
      void main() {
        float life = fract(uTime * (0.16 + aSeed.x * 0.12) + aSeed.y);
        float a = aSeed.z * 6.2831;
        float r = life * (2.0 + aSeed.w * 6.0);
        vec3 p = position + vec3(cos(a) * r, life * (2.5 + aSeed.x * 5.0), sin(a) * r);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((1.2 + life * 3.4) * uScale / -mv.z, 1.0, 200.0);
        vAlpha = sin(life * 3.14159) * (0.08 + aSeed.w * 0.08);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vec3(0.92, 0.95, 0.96), a);
      }
    `,
  });
  return { geo, mat };
}

/** A small school of fish in the lake, swimming on GPU-computed loops. */
function createFish() {
  const rng = createRng(3434);
  const count = 14;
  // Body: a slender lathe with a forked tail, nose along +z.
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * 0.16 * (1 - t * 0.35), t * 0.9 - 0.45));
  }
  const body = new THREE.LatheGeometry(pts, 10);
  body.rotateX(Math.PI / 2);
  body.scale(0.7, 1, 1);
  const tail = new THREE.BufferGeometry();
  tail.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.42, 0, 0.14, -0.66, 0, -0.14, -0.66], 3));
  tail.computeVertexNormals();
  const geo = new THREE.InstancedBufferGeometry();
  const merged = mergeTwo(body, tail);
  geo.index = merged.index;
  geo.attributes = merged.attributes;
  const params = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    params[i * 4] = (rng() - 0.5) * 0.6; // centre offset (lake-normalised)
    params[i * 4 + 1] = 0.25 + rng() * 0.45; // loop radius (lake-normalised)
    params[i * 4 + 2] = 0.15 + rng() * 0.25; // speed
    params[i * 4 + 3] = rng() * 6.2831; // phase
  }
  geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(params, 4));
  geo.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: sharedUniforms.uTime,
      uLake: { value: new THREE.Vector4(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz) },
      uRot: { value: LAKE.rotation },
      uY: { value: WATER_LEVEL - 0.75 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uRot, uY;
      uniform vec4 uLake;
      attribute vec4 aParams;
      varying float vShade;
      void main() {
        float t = uTime * aParams.z + aParams.w;
        vec2 local = vec2(aParams.x, aParams.x * 0.6) + vec2(cos(t), sin(t)) * aParams.y;
        vec2 dir = normalize(vec2(-sin(t), cos(t)));
        local *= uLake.zw * 0.55;
        dir = normalize(dir * uLake.zw);
        float c = cos(-uRot), s = sin(-uRot);
        vec2 world = uLake.xy + vec2(local.x * c - local.y * s, local.x * s + local.y * c);
        vec2 wdir = vec2(dir.x * c - dir.y * s, dir.x * s + dir.y * c);
        vec3 p = position;
        p.x += sin(uTime * 7.0 + aParams.w + p.z * 6.0) * 0.06 * (0.5 - p.z);
        float ang = atan(wdir.x, wdir.y);
        float ca = cos(ang), sa = sin(ang);
        vec3 rp = vec3(p.x * ca + p.z * sa, p.y, -p.x * sa + p.z * ca);
        vShade = 0.6 + 0.4 * normal.y;
        gl_Position = projectionMatrix * viewMatrix * vec4(rp + vec3(world.x, uY + sin(t * 3.0) * 0.08, world.y), 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vShade;
      void main() { gl_FragColor = vec4(vec3(0.05, 0.06, 0.05) * vShade, 0.7); }
    `,
  });
  body.dispose();
  tail.dispose();
  return { geo, mat };
}

function mergeTwo(a: THREE.BufferGeometry, b: THREE.BufferGeometry) {
  const pa = a.getAttribute("position").array as ArrayLike<number>;
  const pb = b.getAttribute("position").array as ArrayLike<number>;
  const na = a.getAttribute("normal").array as ArrayLike<number>;
  const nb = b.getAttribute("normal").array as ArrayLike<number>;
  const ia = a.index ? Array.from(a.index.array) : [...Array(pa.length / 3).keys()];
  const offset = pa.length / 3;
  const index = [...ia, ...[...Array(pb.length / 3).keys()].map((i) => i + offset)];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...Array.from(pa), ...Array.from(pb)], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([...Array.from(na), ...Array.from(nb)], 3));
  g.setIndex(index);
  return g;
}

export function Ecosystem() {
  const { textures } = useWorldResources();
  const built = useMemo(() => {
    const lake = buildLake();
    const river = buildRiver();
    const pool = buildPool();
    const still = createWaterMaterial(textures, { flow: 0, foam: 1 });
    const flowing = createWaterMaterial(textures, { flow: 0.55, foam: 0.6 });
    const churn = createWaterMaterial(textures, { flow: 0.9, foam: 1.4 });
    const sheets = [0, 1].map((l) => ({ geo: buildFallSheet(l), mat: createFallMaterial(l) }));
    const mist = createMist();
    const fish = createFish();
    return { lake, river, pool, still, flowing, churn, sheets, mist, fish };
  }, [textures]);

  useEffect(
    () => () => {
      [built.lake, built.river, built.pool, built.mist.geo, built.fish.geo].forEach((g) => g.dispose());
      [built.still, built.flowing, built.churn, built.mist.mat, built.fish.mat].forEach((m) => m.dispose());
      built.sheets.forEach((s) => {
        s.geo.dispose();
        s.mat.dispose();
      });
    },
    [built]
  );

  return (
    <group>
      <mesh geometry={built.fish.geo} material={built.fish.mat} frustumCulled={false} renderOrder={1} />
      <mesh geometry={built.lake} material={built.still} receiveShadow renderOrder={2} />
      <mesh geometry={built.river} material={built.flowing} receiveShadow renderOrder={2} />
      <mesh geometry={built.pool} material={built.churn} receiveShadow renderOrder={2} />
      {built.sheets.map((s, i) => (
        <mesh key={i} geometry={s.geo} material={s.mat} renderOrder={3 + i} />
      ))}
      <points geometry={built.mist.geo} material={built.mist.mat} frustumCulled={false} renderOrder={5} />
    </group>
  );
}
