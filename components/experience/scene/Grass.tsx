"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMP, PATH_HALF_WIDTH, TREE, lakeDistance, pathInfo, riverHalfWidth, riverInfo, terrainHeight } from "@/lib/world/layout";
import { SimplexNoise, createRng, smoothstep } from "@/lib/world/noise";
import { shared } from "@/lib/world/materials";
import { useWorld } from "./WorldContext";

/**
 * The meadow. Blades live in square patches that travel with the camera:
 * each blade's world position is `camera + mod(local − camera, size)`, so
 * blades are fixed in the world (they never swim) while only the ground near
 * the viewer is ever populated. A baked field texture supplies the ground
 * height (R), where grass may grow (G) and how lush it is (B).
 *
 * Two layers: a dense near patch and a sparse, taller far patch.
 */

const FIELD = { x0: -230, z0: -760, x1: 250, z1: 90, step: 2 };

/** The baked field data is pure CPU work; keep it for the visit so re-entering the world is fast. */
let fieldData: { data: Uint16Array; w: number; h: number } | null = null;

function bakeFieldData() {
  if (fieldData) return fieldData;
  const noise = new SimplexNoise(919);
  const w = Math.round((FIELD.x1 - FIELD.x0) / FIELD.step) + 1;
  const h = Math.round((FIELD.z1 - FIELD.z0) / FIELD.step) + 1;
  // Heights once per cell; slopes from the neighbouring cells (no extra samples).
  const heights = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) heights[j * w + i] = terrainHeight(FIELD.x0 + i * FIELD.step, FIELD.z0 + j * FIELD.step);
  const at = (i: number, j: number) => heights[Math.min(h - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))];
  const data = new Uint16Array(w * h * 4);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = FIELD.x0 + i * FIELD.step;
      const z = FIELD.z0 + j * FIELD.step;
      const y = heights[j * w + i];
      let d = 1;
      const p = pathInfo(x, z);
      const r = riverInfo(x, z);
      const camp = Math.hypot(x - CAMP.x, z - CAMP.z);
      if (p.dist < PATH_HALF_WIDTH + 0.3) d = 0;
      else d *= smoothstep(PATH_HALF_WIDTH + 0.3, PATH_HALF_WIDTH + 2.2, p.dist);
      if (r.dist < 30) d *= smoothstep(riverHalfWidth(r.t) + 0.2, riverHalfWidth(r.t) + 1.4, r.dist);
      d *= smoothstep(1.02, 1.12, lakeDistance(x, z));
      d *= smoothstep(4, 7, camp);
      d *= smoothstep(138, 170, Math.hypot(x - TREE.x, z - TREE.z));
      const gx = at(i - 1, j) - at(i + 1, j);
      const gz = at(i, j - 1) - at(i, j + 1);
      const ny = (4 * FIELD.step) / Math.hypot(gx, 4 * FIELD.step, gz);
      d *= smoothstep(0.84, 0.92, ny);
      d *= 1 - smoothstep(18, 30, y);
      // Patches and bare spots, so the meadow is not a carpet.
      d *= 0.45 + 0.55 * smoothstep(-0.45, 0.2, noise.fbm2(x * 0.035, z * 0.035, 3));
      const lush = 0.5 + 0.5 * noise.fbm2(x * 0.012 + 9, z * 0.012, 3);
      const k = (j * w + i) * 4;
      data[k] = THREE.DataUtils.toHalfFloat(y);
      data[k + 1] = THREE.DataUtils.toHalfFloat(d);
      data[k + 2] = THREE.DataUtils.toHalfFloat(lush);
      data[k + 3] = THREE.DataUtils.toHalfFloat(1);
    }
  }
  return (fieldData = { data, w, h });
}

function bakeField() {
  const { data, w, h } = bakeFieldData();
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  // Texel centres sit on the sample points.
  const rect = new THREE.Vector4(FIELD.x0 - FIELD.step / 2, FIELD.z0 - FIELD.step / 2, w * FIELD.step, h * FIELD.step);
  return { tex, rect };
}

/** Blade template: a tapered, slightly cupped strip, unit height. */
function bladeGeometry(count: number, size: number, seed: number) {
  const levels = [0, 0.35, 0.7];
  const pos: number[] = [];
  const uv: number[] = [];
  for (const y of levels) {
    const hw = 0.5 * (1 - y * 0.78);
    pos.push(-hw, y, 0.04 * (1 - y), hw, y, 0.04 * (1 - y));
    uv.push(0, y, 1, y);
  }
  pos.push(0, 1, 0);
  uv.push(0.5, 1);
  const index: number[] = [];
  for (let i = 0; i < levels.length - 1; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const tip = levels.length * 2;
  index.push(tip - 2, tip - 1, tip);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length).fill(0), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);

  const rng = createRng(seed);
  const local = new Float32Array(count * 2);
  const rand = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    local[i * 2] = rng() * size;
    local[i * 2 + 1] = rng() * size;
    rand[i * 4] = rng() * Math.PI * 2; // rotation
    rand[i * 4 + 1] = rng(); // height
    rand[i * 4 + 2] = rng(); // stiffness / colour
    rand[i * 4 + 3] = rng(); // keep threshold (against density)
  }
  g.setAttribute("aLocal", new THREE.InstancedBufferAttribute(local, 2));
  g.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 4));
  g.instanceCount = count;
  return g;
}

interface LayerOptions {
  size: number;
  height: number;
  width: number;
  /** Radius around the camera left to the denser layer. */
  inner: number;
}

function createGrassMaterial(field: { tex: THREE.Texture; rect: THREE.Vector4 }, o: LayerOptions) {
  const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8, metalness: 0 });
  const uniforms = {
    uTime: shared.uTime,
    uWind: shared.uWind,
    uSunDir: shared.uSunDir,
    uSunColor: shared.uSunColor,
    uField: { value: field.tex },
    uRect: { value: field.rect },
    uCam: { value: new THREE.Vector2() },
    uSize: { value: o.size },
    uInner: { value: o.inner },
    uShape: { value: new THREE.Vector2(o.height, o.width) },
    uRoot: { value: new THREE.Color("#1d2a0e") },
    uTip: { value: new THREE.Color("#6f9134") },
    uDry: { value: new THREE.Color("#93944c") },
  };
  mat.userData.uniforms = uniforms;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute vec2 aLocal;
        attribute vec4 aRand;
        uniform sampler2D uField;
        uniform vec4 uRect;
        uniform vec2 uCam, uShape;
        uniform float uSize, uInner, uTime, uWind;
        varying float vH;
        varying float vSeed;
        varying float vLush;`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `float gc = cos(aRand.x), gs = sin(aRand.x);
        vec3 objectNormal = normalize(mix(vec3(gs, 0.0, gc), vec3(0.0, 1.0, 0.0), 0.7));`
      )
      .replace(
        "#include <begin_vertex>",
        `vec2 wxz = uCam + mod(aLocal - uCam, uSize) - 0.5 * uSize;
        vec2 muv = (wxz - uRect.xy) / uRect.zw;
        vec4 fld = (muv.x > 0.0 && muv.y > 0.0 && muv.x < 1.0 && muv.y < 1.0) ? textureLod(uField, muv, 0.0) : vec4(0.0);
        float dist = length(wxz - uCam);
        float keep = step(aRand.w, fld.g) * (1.0 - smoothstep(uSize * 0.3, uSize * 0.47, dist)) * smoothstep(uInner * 0.8, uInner, dist);
        float bh = uShape.x * (0.55 + 0.75 * aRand.y) * (0.65 + 0.6 * fld.b) * keep;
        float yy = position.y;
        vec3 p = vec3(position.x * uShape.y * (0.8 + 0.5 * aRand.z), position.y * bh, position.z * bh);
        vec3 transformed = vec3(p.x * gc + p.z * gs, p.y, -p.x * gs + p.z * gc);
        // Gusts travel across the meadow; each blade has its own stiffness.
        float gust = sin(uTime * 1.05 + wxz.x * 0.08 + wxz.y * 0.05) * 0.5 + 0.5;
        gust = gust * 0.75 + 0.25 * sin(uTime * 2.6 + wxz.x * 0.55 + wxz.y * 0.37);
        float bend = (0.15 + 0.45 * aRand.z + gust * 0.6 * uWind) * yy * yy;
        transformed.xz += vec2(0.9, 0.42) * bend * bh * 0.55;
        transformed.y -= bend * bend * bh * 0.2;
        transformed += vec3(wxz.x, fld.r - 0.04, wxz.y);
        vH = yy;
        vSeed = aRand.z;
        vLush = fld.b;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uRoot, uTip, uDry, uSunDir, uSunColor;
        varying float vH;
        varying float vSeed;
        varying float vLush;`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 tip = mix(uDry, uTip, smoothstep(0.25, 0.7, vLush)) * (0.82 + 0.36 * vSeed);
        diffuseColor.rgb *= mix(uRoot, tip, smoothstep(0.0, 1.0, vH));`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        float gao = mix(0.3, 1.0, smoothstep(0.0, 0.75, vH));
        reflectedLight.indirectDiffuse *= gao;
        reflectedLight.directDiffuse *= gao;`
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
        vec3 gv = normalize(vViewPosition);
        float through = pow(max(dot(-gv, (viewMatrix * vec4(uSunDir, 0.0)).xyz), 0.0), 5.0);
        reflectedLight.directDiffuse += diffuseColor.rgb * uSunColor * through * vH * 1.1 * smoothstep(-0.05, 0.05, uSunDir.y);`
      );
  };
  mat.customProgramCacheKey = () => "grass-field-v1";
  return mat;
}

export function Grass() {
  const { quality } = useWorld();
  const field = useMemo(() => bakeField(), []);
  const layers = useMemo(() => {
    const f = quality.foliage;
    const near = { size: 72, height: 0.42, width: 0.11, inner: 0 };
    const far = { size: 220, height: 0.7, width: 0.2, inner: 24 };
    return [
      { geometry: bladeGeometry(Math.round(150000 * f), near.size, 11), material: createGrassMaterial(field, near) },
      { geometry: bladeGeometry(Math.round(50000 * f), far.size, 23), material: createGrassMaterial(field, far) },
    ];
  }, [field, quality.foliage]);
  useEffect(
    () => () => {
      field.tex.dispose();
      layers.forEach((l) => {
        l.geometry.dispose();
        l.material.dispose();
      });
    },
    [field, layers]
  );
  useFrame(({ camera }) => {
    for (const l of layers) (l.material.userData.uniforms.uCam.value as THREE.Vector2).set(camera.position.x, camera.position.z);
  });
  return (
    <group>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.geometry} material={l.material} receiveShadow frustumCulled={false} />
      ))}
    </group>
  );
}
