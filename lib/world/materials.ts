import * as THREE from "three";
import type { WorldTextures } from "./textures";
import { SUN_COLOR, SUN_DIRECTION } from "./atmosphere";
import { WATER_LEVEL } from "./layout";

/**
 * Natural-surface materials. Each is a MeshStandardMaterial extended through
 * `onBeforeCompile`, so they keep three's PBR lighting, shadows and fog while
 * reading the baked procedural textures.
 */

/** Shared animated uniforms (advanced once per frame by <WorldClock/>). */
export const sharedUniforms = {
  uTime: { value: 0 },
};

const SUN_V = `vec3(${SUN_DIRECTION.x.toFixed(5)}, ${SUN_DIRECTION.y.toFixed(5)}, ${SUN_DIRECTION.z.toFixed(5)})`;

const WORLD_VARYINGS_VERTEX = /* glsl */ `
  vec4 worldPos4 = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    worldPos4 = instanceMatrix * worldPos4;
  #endif
  vWorld = (modelMatrix * worldPos4).xyz;
`;

// ─── Bark ─────────────────────────────────────────────────────────────────────

export interface BarkOptions {
  deep: string;
  mid: string;
  ridge: string;
  moss: string;
  mossAmount: number;
  /** World Y of the ground the bark meets (for soil darkening and low moss). */
  ground: number;
  normalScale?: number;
  envMap?: THREE.Texture | null;
  envMapIntensity?: number;
  /** Golden light glowing from deep fissures (0 = none). */
  glow?: number;
  glowColor?: string;
  /** World Y range over which the glow ramps from 0 to full. */
  glowFrom?: number;
  glowTo?: number;
  /** Crack depth where the sap glow begins (higher = thinner veins). */
  glowEdge?: number;
  /** Frequency multiplier of a second, finer bark layer for close viewing (0 = off). */
  detail?: number;
  /** Outer bark (default) or the heartwood lining the hollow. */
  surface?: "bark" | "wood";
}

export function createBarkMaterial(textures: WorldTextures, o: BarkOptions) {
  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.92,
    metalness: 0,
    normalMap: o.surface === "wood" ? textures.woodNormal : textures.barkNormal,
    normalScale: new THREE.Vector2(o.normalScale ?? 1.25, o.normalScale ?? 1.25),
    envMap: o.envMap ?? null,
    envMapIntensity: o.envMapIntensity ?? 1,
  });
  const uniforms = {
    uBarkData: { value: o.surface === "wood" ? textures.woodData : textures.barkData },
    uDeep: { value: new THREE.Color(o.deep) },
    uMid: { value: new THREE.Color(o.mid) },
    uRidge: { value: new THREE.Color(o.ridge) },
    uMossColor: { value: new THREE.Color(o.moss) },
    uMoss: { value: o.mossAmount },
    uGround: { value: o.ground },
    uGlow: { value: o.glow ?? 0 },
    uGlowColor: { value: new THREE.Color(o.glowColor ?? "#ffb347") },
    uGlowRange: { value: new THREE.Vector2(o.glowFrom ?? -1e4, o.glowTo ?? -1e4 + 1) },
    uGlowEdge: { value: o.glowEdge ?? 0.72 },
    uDetail: { value: o.detail ?? 0 },
    uTime: sharedUniforms.uTime,
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWorld;
        uniform sampler2D uBarkData;
        uniform vec3 uDeep, uMid, uRidge, uMossColor, uGlowColor;
        uniform float uMoss, uGround, uGlow, uTime, uGlowEdge, uDetail;
        uniform vec2 uGlowRange;`
      )
      .replace(
        "#include <map_fragment>",
        `vec4 bark = texture2D(uBarkData, vNormalMapUv);
        float bh = bark.r;
        float crack = bark.g;
        float macroCrack = crack;
        float bvar = bark.b;
        #ifdef BARK_DETAIL
          // A finer layer of the same bark breaks up large plates seen up close.
          vec4 bark2 = texture2D(uBarkData, vNormalMapUv * uDetail + vec2(0.37, 0.11));
          bh = mix(bh, bark2.r, 0.42);
          bvar = mix(bvar, bark2.b, 0.35);
          crack = max(crack * 0.9, bark2.g * 0.6);
        #endif
        vec3 wN = inverseTransformDirection(normalize(vNormal), viewMatrix);
        vec3 albedo = mix(uDeep, uMid, smoothstep(0.04, 0.42, bh));
        albedo = mix(albedo, uRidge, smoothstep(0.5, 0.95, bh) * (0.45 + 0.55 * bvar));
        albedo *= 0.8 + 0.4 * bvar;
        float up = clamp(wN.y, 0.0, 1.0);
        float low = 1.0 - smoothstep(uGround + 1.0, uGround + 9.0, vWorld.y);
        float moss = smoothstep(0.45, 0.85, bark.a * (0.35 + 0.75 * up + 0.55 * low)) * uMoss;
        albedo = mix(albedo, uMossColor * (0.75 + 0.5 * bvar), moss * (0.35 + 0.65 * bh));
        albedo *= mix(0.5, 1.0, smoothstep(uGround - 0.5, uGround + 2.5, vWorld.y));
        diffuseColor.rgb *= albedo;`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = roughness * (0.9 + 0.12 * crack);
        roughnessFactor = mix(roughnessFactor, 1.0, moss * 0.6);`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        float barkAO = mix(1.0, 0.3, crack * crack);
        reflectedLight.indirectDiffuse *= barkAO;
        reflectedLight.indirectSpecular *= barkAO;
        reflectedLight.directDiffuse *= mix(1.0, 0.62, crack);
        // Golden sap light in the deepest fissures, pulsing slowly upward.
        float sap = smoothstep(uGlowEdge, 0.995, macroCrack) * smoothstep(uGlowRange.x, uGlowRange.y, vWorld.y);
        float pulse = 0.62 + 0.38 * sin(vWorld.y * 0.045 - uTime * 0.55 + bvar * 6.2831);
        totalEmissiveRadiance += uGlowColor * (uGlow * sap * pulse);`
      );
  };
  if (o.detail) {
    mat.defines = { ...mat.defines, BARK_DETAIL: "" };
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader, renderer) => {
      prev.call(mat, shader, renderer);
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `{
          vec3 mapN = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
          vec3 mapN2 = texture2D(normalMap, vNormalMapUv * uDetail + vec2(0.37, 0.11)).xyz * 2.0 - 1.0;
          mapN = normalize(vec3(mapN.xy + mapN2.xy * 0.75, mapN.z));
          mapN.xy *= normalScale;
          normal = normalize(tbn * mapN);
        }`
      );
    };
  }
  mat.customProgramCacheKey = () => `bark-v3${o.detail ? "-d" : ""}`;
  return mat;
}

// ─── Rock (tri-planar) ───────────────────────────────────────────────────────

export function createRockMaterial(textures: WorldTextures, opts: { tint?: string; mossAmount?: number; scale?: number } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: opts.tint ?? "#ffffff", roughness: 0.88, metalness: 0 });
  const uniforms = {
    uRockData: { value: textures.rockData },
    uRockNormal: { value: textures.rockNormal },
    uRockScale: { value: opts.scale ?? 0.11 },
    uRockMoss: { value: opts.mossAmount ?? 0.7 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWorld;
        uniform sampler2D uRockData, uRockNormal;
        uniform float uRockScale, uRockMoss;
        vec3 triW(vec3 n) { vec3 w = pow(abs(n), vec3(4.0)); return w / (w.x + w.y + w.z); }`
      )
      .replace(
        "#include <map_fragment>",
        `vec3 rN = inverseTransformDirection(normalize(vNormal), viewMatrix);
        vec3 tw = triW(rN);
        vec3 rp = vWorld * uRockScale;
        vec4 rx = texture2D(uRockData, rp.zy);
        vec4 ry = texture2D(uRockData, rp.xz);
        vec4 rz = texture2D(uRockData, rp.xy);
        vec4 rock = rx * tw.x + ry * tw.y + rz * tw.z;
        // A second, larger scale breaks up the cell pattern of the first.
        vec3 rq = vWorld * uRockScale * 0.31 + 0.37;
        vec4 rock2 = texture2D(uRockData, rq.zy) * tw.x + texture2D(uRockData, rq.xz) * tw.y + texture2D(uRockData, rq.xy) * tw.z;
        rock = mix(rock, rock2, 0.42);
        vec3 stone = mix(vec3(0.07, 0.066, 0.06), vec3(0.24, 0.225, 0.2), smoothstep(0.1, 0.8, rock.r));
        stone *= 0.75 + 0.5 * rock2.b;
        stone = mix(stone, stone * vec3(1.12, 1.0, 0.82), rock.b * 0.8);
        float mossUp = smoothstep(0.45, 0.85, rN.y);
        float rmoss = clamp(mossUp * smoothstep(0.25, 0.7, rock.a + 0.25) * uRockMoss, 0.0, 1.0);
        stone = mix(stone, vec3(0.2, 0.25, 0.1) * (0.8 + 0.4 * rock.b), rmoss);
        float wet = 1.0 - smoothstep(${WATER_LEVEL.toFixed(2)} + 0.1, ${WATER_LEVEL.toFixed(2)} + 1.2, vWorld.y);
        stone *= mix(1.0, 0.55, wet);
        diffuseColor.rgb *= stone;`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = mix(roughness, 0.35, wet);
        roughnessFactor = mix(roughnessFactor, 1.0, rmoss);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          vec3 nx = texture2D(uRockNormal, rp.zy).xyz * 2.0 - 1.0;
          vec3 ny = texture2D(uRockNormal, rp.xz).xyz * 2.0 - 1.0;
          vec3 nz = texture2D(uRockNormal, rp.xy).xyz * 2.0 - 1.0;
          // Whiteout blend of tangent-space normals into world space.
          vec3 wx = vec3(nx.xy + rN.zy, abs(nx.z) * rN.x);
          vec3 wy = vec3(ny.xy + rN.xz, abs(ny.z) * rN.y);
          vec3 wz = vec3(nz.xy + rN.xy, abs(nz.z) * rN.z);
          vec3 wn = normalize(wx.zyx * tw.x + wy.xzy * tw.y + wz.xyz * tw.z);
          normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
        }`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        float rockAO = mix(1.0, 0.74, rock.g);
        reflectedLight.indirectDiffuse *= rockAO;
        reflectedLight.directDiffuse *= mix(1.0, 0.9, rock.g);`
      );
  };
  mat.customProgramCacheKey = () => "rock-v2";
  return mat;
}

// ─── Foliage ──────────────────────────────────────────────────────────────────

export interface FoliageOptions {
  /** Atlas cell when instances don't carry their own (`aCell` attribute). */
  cell?: number;
  perInstanceCell?: boolean;
  /** Multiply by the geometry's per-card colour attribute (breaks up uniform masses). */
  vertexColors?: boolean;
  wind?: number;
  translucency?: number;
  envMap?: THREE.Texture | null;
  /** Self-illumination as a fraction of albedo (the World Tree's luminous crown). */
  selfGlow?: number;
}

function foliageVertexPatch(shader: { vertexShader: string }, o: FoliageOptions) {
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
      uniform float uTime;
      uniform float uWind;
      ${o.perInstanceCell ? "attribute float aCell;" : ""}
      varying float vClumpAO;`
    )
    .replace(
      "#include <uv_vertex>",
      `#include <uv_vertex>
      {
        // Atlas cells are numbered row-major from the canvas' top-left; UV v runs bottom-up.
        float cell = ${o.perInstanceCell ? "aCell" : (o.cell ?? 0).toFixed(1)};
        vec2 offs = vec2(mod(cell, 2.0), 1.0 - floor(cell / 2.0)) * 0.5;
        #ifdef USE_MAP
          // Inset slightly so mip levels don't bleed between cells.
          vMapUv = mix(offs + vec2(0.004), offs + vec2(0.496), vMapUv);
        #endif
      }`
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vClumpAO = clamp(length(position) * 0.85, 0.25, 1.0);
      {
        vec3 anchor = vec3(0.0);
        #ifdef USE_INSTANCING
          anchor = instanceMatrix[3].xyz;
        #endif
        anchor = (modelMatrix * vec4(anchor, 1.0)).xyz;
        float phase = dot(anchor, vec3(0.071, 0.0, 0.053));
        float sway = sin(uTime * 0.9 + phase) * 0.6 + sin(uTime * 2.3 + phase * 2.7) * 0.25;
        float flutter = sin(uTime * 6.0 + dot(position, vec3(3.1, 2.3, 4.7)) + phase) * 0.12;
        transformed += vec3(sway, sway * 0.25, sway * 0.6) * uWind * (0.4 + 0.6 * vClumpAO);
        transformed += normal * flutter * uWind;
      }`
    );
}

export function createFoliageMaterial(textures: WorldTextures, o: FoliageOptions = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: textures.leaves,
    vertexColors: o.vertexColors ?? false,
    alphaTest: 0.42,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0,
    envMap: o.envMap ?? null,
  });
  const uniforms = {
    uTime: sharedUniforms.uTime,
    uWind: { value: o.wind ?? 0.08 },
    uTranslucency: { value: o.translucency ?? 0.55 },
    uSelfGlow: { value: o.selfGlow ?? 0 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    foliageVertexPatch(shader, o);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTranslucency, uSelfGlow;
        varying float vClumpAO;`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        // Keep alpha coverage as the atlas mips down so distant foliage doesn't thin out.
        {
          vec2 texSize = vec2(textureSize(map, 0));
          vec2 dx = dFdx(vMapUv * texSize);
          vec2 dy = dFdy(vMapUv * texSize);
          float mip = max(0.0, 0.5 * log2(max(dot(dx, dx), dot(dy, dy))));
          diffuseColor.a *= 1.0 + mip * 0.28;
        }`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        float leafAO = mix(0.45, 1.0, vClumpAO);
        reflectedLight.indirectDiffuse *= leafAO;
        reflectedLight.directDiffuse *= mix(0.7, 1.0, vClumpAO);
        vec3 sunView = normalize((viewMatrix * vec4(${SUN_V}, 0.0)).xyz);
        float through = pow(clamp(dot(-geometryViewDir, sunView), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += diffuseColor.rgb * vec3(${SUN_COLOR.r.toFixed(3)}, ${SUN_COLOR.g.toFixed(3)}, ${SUN_COLOR.b.toFixed(3)}) * through * uTranslucency * vClumpAO;
        totalEmissiveRadiance += diffuseColor.rgb * uSelfGlow * mix(0.55, 1.0, vClumpAO);`
      );
  };
  mat.customProgramCacheKey = () => `foliage-v3-${o.perInstanceCell ? "i" : o.cell ?? 0}${o.vertexColors ? "-vc" : ""}`;
  return mat;
}

/** Shadow-casting depth material matching the foliage cut-outs and wind. */
export function createFoliageDepthMaterial(textures: WorldTextures, o: FoliageOptions = {}) {
  const mat = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: textures.leaves,
    alphaTest: 0.42,
    side: THREE.DoubleSide,
  });
  const uniforms = { uTime: sharedUniforms.uTime, uWind: { value: o.wind ?? 0.08 } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    foliageVertexPatch(shader, o);
  };
  mat.customProgramCacheKey = () => `foliage-depth-v1-${o.perInstanceCell ? "i" : o.cell ?? 0}`;
  return mat;
}

// ─── Terrain ──────────────────────────────────────────────────────────────────

/**
 * Splatted ground: grass with dry patches, packed dirt, wet banks, forest
 * humus and rock on steep slopes. Per-vertex masks (attribute `aMask`:
 * dirt, wet, humus, rockiness) come from the layout so paths and shores sit
 * exactly where the geography says they are.
 */
export function createTerrainMaterial(textures: WorldTextures) {
  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.95,
    metalness: 0,
    normalMap: textures.groundNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
  });
  const uniforms = {
    uGround: { value: textures.groundData },
    uRockData: { value: textures.rockData },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aMask;\nvarying vec4 vMask;\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\nvMask = aMask;\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec4 vMask;
        varying vec3 vWorld;
        uniform sampler2D uGround, uRockData;`
      )
      .replace(
        "#include <map_fragment>",
        `vec2 gUv = vWorld.xz / 7.0;
        vec4 g1 = texture2D(uGround, gUv);
        vec4 g2 = texture2D(uGround, vWorld.xz / 41.0 + 0.37);
        vec4 g3 = texture2D(uGround, vWorld.xz / 173.0 + 0.71);
        float macro = g2.a * 0.6 + g3.a * 0.4;
        vec3 tN = inverseTransformDirection(normalize(vNormal), viewMatrix);
        float slope = 1.0 - tN.y;

        vec3 grassDark = vec3(0.105, 0.135, 0.05);
        vec3 grassLight = vec3(0.24, 0.27, 0.1);
        vec3 grassDry = vec3(0.36, 0.32, 0.15);
        vec3 grass = mix(grassDark, grassLight, smoothstep(0.25, 0.85, g1.r * 0.55 + macro * 0.6));
        // Dry patches only on gentle ground: planar sampling would streak down steep slopes.
        float gentle = 1.0 - smoothstep(0.12, 0.32, slope);
        grass = mix(grass, grassDry, smoothstep(0.35, 0.8, g2.b * 0.7 + g3.b * 0.5) * 0.75 * gentle);

        vec3 dirt = mix(vec3(0.2, 0.14, 0.085), vec3(0.32, 0.24, 0.15), g1.g * 0.6 + macro * 0.4);
        vec3 wet = mix(vec3(0.12, 0.1, 0.075), vec3(0.2, 0.17, 0.12), g1.g);
        vec3 humus = mix(vec3(0.07, 0.05, 0.035), vec3(0.15, 0.1, 0.06), g1.r * 0.5 + g1.g * 0.5);

        vec3 rkW = pow(abs(tN), vec3(4.0));
        rkW /= rkW.x + rkW.y + rkW.z;
        vec4 rk = texture2D(uRockData, vWorld.zy * 0.06) * rkW.x + texture2D(uRockData, vWorld.xz * 0.06) * rkW.y + texture2D(uRockData, vWorld.xy * 0.06) * rkW.z;
        vec3 rockC = mix(vec3(0.17, 0.16, 0.14), vec3(0.4, 0.38, 0.34), rk.r) * (0.8 + 0.4 * rk.b);

        vec3 col = grass;
        float dirtAmt = clamp(vMask.x + (g1.g - 0.5) * 0.5 * vMask.x, 0.0, 1.0);
        col = mix(col, dirt, smoothstep(0.15, 0.75, dirtAmt));
        col = mix(col, humus, smoothstep(0.2, 0.8, vMask.z));
        col = mix(col, wet, smoothstep(0.1, 0.9, vMask.y));
        // Outcrops break through the grass on the higher hillsides.
        float outcrop = smoothstep(0.58, 0.74, g3.a * 0.7 + g2.a * 0.3) * smoothstep(16.0, 34.0, vWorld.y) * smoothstep(0.1, 0.28, slope);
        float rockAmt = clamp(smoothstep(0.32, 0.55, slope) + vMask.w + outcrop, 0.0, 1.0);
        col = mix(col, rockC, rockAmt);
        // Underwater bed reads darker and greener.
        float under = 1.0 - smoothstep(${WATER_LEVEL.toFixed(2)} - 0.6, ${WATER_LEVEL.toFixed(2)} + 0.05, vWorld.y);
        col = mix(col, vec3(0.06, 0.07, 0.045), under * 0.75);
        diffuseColor.rgb *= col;`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = roughness;
        roughnessFactor = mix(roughnessFactor, 0.55, smoothstep(0.3, 0.9, vMask.y));
        roughnessFactor = mix(roughnessFactor, 0.85, rockAmt);`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        float gAO = mix(0.55, 1.0, g1.r * 0.5 + 0.5) * mix(1.0, 0.65, vMask.z);
        reflectedLight.indirectDiffuse *= gAO;`
      );
  };
  mat.customProgramCacheKey = () => "terrain-v2";
  return mat;
}

// ─── Water ────────────────────────────────────────────────────────────────────

/**
 * Lake / river / pool surface. PBR (sky reflections with Fresnel, sun glints)
 * with two scrolling ripple normal maps, depth-based colour and opacity from
 * the per-vertex `aDepth` attribute (computed from the terrain), shore foam,
 * and optional downstream flow along the mesh's v coordinate.
 */
export function createWaterMaterial(textures: WorldTextures, opts: { flow?: number; foam?: number } = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
  });
  const uniforms = {
    uTime: sharedUniforms.uTime,
    uFlow: { value: opts.flow ?? 0 },
    uFoam: { value: opts.foam ?? 1 },
    uGround: { value: textures.groundData },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aDepth;\nvarying float vDepth;\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\nvDepth = aDepth;\n${WORLD_VARYINGS_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime, uFlow, uFoam;
        uniform sampler2D uGround;
        varying float vDepth;
        varying vec3 vWorld;`
      )
      .replace(
        "#include <map_fragment>",
        `float depth = max(vDepth, 0.0);
        vec3 shallow = vec3(0.16, 0.22, 0.15);
        vec3 deep = vec3(0.012, 0.045, 0.05);
        diffuseColor.rgb = mix(shallow, deep, smoothstep(0.0, 2.6, depth));
        diffuseColor.a = mix(0.35, 0.94, smoothstep(0.0, 1.4, depth));
        // Shore foam: a thin broken line where the water meets the ground.
        float foamNoise = texture2D(uGround, vWorld.xz * 0.35 + vec2(uTime * 0.02, 0.0)).g;
        float foam = (1.0 - smoothstep(0.02, 0.22 + foamNoise * 0.25, depth)) * uFoam;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.8, 0.76), foam * 0.75);
        diffuseColor.a = max(diffuseColor.a, foam * 0.85);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          vec2 flowUv = vec2(0.0, -uTime * uFlow);
          vec3 n1 = texture2D(normalMap, vNormalMapUv + flowUv + vec2(uTime * 0.012, uTime * 0.008)).xyz * 2.0 - 1.0;
          vec3 n2 = texture2D(normalMap, vNormalMapUv * 1.7 + flowUv * 1.3 - vec2(uTime * 0.01, -uTime * 0.014)).xyz * 2.0 - 1.0;
          vec3 mapN = normalize(vec3(n1.xy + n2.xy, n1.z * n2.z));
          mapN.xy *= normalScale;
          normal = normalize(tbn * mapN);
        }`
      );
  };
  mat.customProgramCacheKey = () => "water-v1";
  return mat;
}
