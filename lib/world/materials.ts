import * as THREE from "three";
import type { WorldAssets } from "./assets";
import { GLSL_HASH, GLSL_SIMPLEX3 } from "./glsl";

/**
 * Materials. Natural surfaces are MeshStandardMaterials extended through
 * `onBeforeCompile`, so they keep three's PBR lighting, shadows and the
 * height fog while reading the photo-scanned textures. Light count never
 * changes, so none of these recompile mid-journey.
 */

/** Uniforms shared by every animated material, advanced once per frame. */
export const shared = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0.5, 0.3, -0.7).normalize() },
  uSunColor: { value: new THREE.Color("#ffd29a") },
  /** 0 day → 1 night. */
  uNight: { value: 0 },
  /** Wind strength. */
  uWind: { value: 1 },
  /** 0 outside → 1 deep inside the World Tree. */
  uInterior: { value: 0 },
};

const WORLD_VARYING_VERTEX = /* glsl */ `
  vec4 wp4 = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    wp4 = instanceMatrix * wp4;
  #endif
  vWorld = (modelMatrix * wp4).xyz;
`;

// ─── Bark (World Tree trunk, roots and limbs) ───────────────────────────────

export interface BarkOptions {
  /** World Y of the ground the bark meets (soil darkening and low moss). */
  ground: number;
  /** Overall colour multiplier applied to the photo albedo. */
  tint?: string;
  /** Scalar brightness applied with the tint (the scanned bark is dark). */
  brightness?: number;
  moss?: number;
  /** Second, coarser texture scale used to break tiling (fraction of the base UV scale). */
  macro?: number;
  normalScale?: number;
}

export function createBarkMaterial(a: WorldAssets, o: BarkOptions) {
  const mat = new THREE.MeshStandardMaterial({
    map: a.bark.color,
    normalMap: a.bark.normal,
    normalScale: new THREE.Vector2(o.normalScale ?? 1.35, o.normalScale ?? 1.35),
    roughness: 1,
    metalness: 0,
  });
  const uniforms = {
    uData: { value: a.bark.data },
    uMossTex: { value: a.grass.color },
    uTint: { value: new THREE.Color(o.tint ?? "#ffffff").multiplyScalar(o.brightness ?? 1) },
    uMoss: { value: o.moss ?? 0.6 },
    uGround: { value: o.ground },
    uMacro: { value: o.macro ?? 0.27 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\n${WORLD_VARYING_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWorld;
        uniform sampler2D uData, uMossTex;
        uniform vec3 uTint;
        uniform float uMoss, uGround, uMacro;`
      )
      .replace(
        "#include <map_fragment>",
        `vec4 bd = texture2D(uData, vMapUv);
        // A second, rotated and coarser sample breaks the visible repetition.
        vec2 muv = mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * uMacro + vec2(0.37, 0.71);
        vec3 c1 = texture2D(map, vMapUv).rgb;
        vec3 c2 = texture2D(map, muv).rgb;
        float macroH = texture2D(uData, muv * 0.5).b;
        vec3 albedo = mix(c1, c1 * (c2 / max(dot(c2, vec3(0.333)), 0.05)) * 0.42, 0.45);
        albedo *= uTint * (0.82 + 0.36 * macroH);
        vec3 wN = inverseTransformDirection(normalize(vNormal), viewMatrix);
        float up = clamp(wN.y, 0.0, 1.0);
        float low = 1.0 - smoothstep(uGround + 0.5, uGround + 14.0, vWorld.y);
        float mossMask = smoothstep(0.52, 0.82, up * 0.75 + low * 0.55 + (macroH - 0.5) * 0.9 + (1.0 - bd.b) * 0.35) * uMoss;
        vec3 mossCol = texture2D(uMossTex, vMapUv * 1.7).rgb * vec3(0.78, 0.95, 0.62);
        albedo = mix(albedo, mossCol, mossMask);
        // Damp soil darkening where the bark meets the ground.
        albedo *= mix(0.55, 1.0, smoothstep(uGround - 0.6, uGround + 3.0, vWorld.y));
        diffuseColor.rgb *= albedo;`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = mix(0.72, 1.0, bd.g);
        roughnessFactor = mix(roughnessFactor, 0.95, mossMask);`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        float cavity = mix(0.35, 1.0, bd.r);
        reflectedLight.indirectDiffuse *= cavity;
        reflectedLight.indirectSpecular *= cavity;
        reflectedLight.directDiffuse *= mix(0.72, 1.0, bd.r);`
      );
  };
  mat.customProgramCacheKey = () => "bark-photo-v1";
  return mat;
}

// ─── Heartwood (the hollow inside the World Tree) ───────────────────────────

export function createHeartwoodMaterial(a: WorldAssets) {
  const mat = new THREE.MeshStandardMaterial({
    map: a.bark.color,
    normalMap: a.bark.normal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 0.85,
    metalness: 0,
  });
  const uniforms = {
    uData: { value: a.bark.data },
    uTime: shared.uTime,
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\n${WORLD_VARYING_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWorld;
        uniform sampler2D uData;
        uniform float uTime;`
      )
      .replace(
        "#include <map_fragment>",
        `// Long vertical fibres: the bark texture stretched along the grain, recoloured as heartwood.
        vec2 fuv = vMapUv * vec2(1.6, 0.35);
        vec4 fd = texture2D(uData, fuv);
        vec3 src = texture2D(map, fuv).rgb;
        float lum = dot(src, vec3(0.3, 0.55, 0.15));
        vec3 wood = mix(vec3(0.20, 0.105, 0.05), vec3(0.62, 0.38, 0.2), smoothstep(0.04, 0.4, lum));
        wood *= 0.78 + 0.32 * fd.b;
        diffuseColor.rgb *= wood;`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          vec3 mapN = texture2D(normalMap, vMapUv * vec2(1.6, 0.35)).xyz * 2.0 - 1.0;
          mapN.xy *= normalScale;
          normal = normalize(tbn * mapN);
        }`
      )
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = mix(0.6, 0.95, fd.g);")
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        reflectedLight.indirectDiffuse *= mix(0.45, 1.0, fd.r);
        reflectedLight.directDiffuse *= mix(0.6, 1.0, fd.r);`
      );
  };
  mat.customProgramCacheKey = () => "heartwood-v1";
  return mat;
}

// ─── Terrain (splat of photo-scanned surfaces) ──────────────────────────────

/**
 * Ground: grass by default, blended with forest litter, the worn trail, rock
 * on steep slopes and damp earth near water. Masks come from the `aMask`
 * vertex attribute (litter, trail, rock, wet); the `uv` attribute holds world
 * XZ / tile size so three's derivative tangent frame matches the textures.
 */
export function createGroundMaterial(a: WorldAssets) {
  const mat = new THREE.MeshStandardMaterial({
    map: a.grass.color,
    normalMap: a.grass.normal,
    normalScale: new THREE.Vector2(1, 1),
    roughness: 1,
    metalness: 0,
  });
  const uniforms = {
    uGrassD: { value: a.grass.data },
    uLitter: { value: a.litter.color },
    uLitterN: { value: a.litter.normal },
    uLitterD: { value: a.litter.data },
    uTrail: { value: a.trail.color },
    uTrailN: { value: a.trail.normal },
    uTrailD: { value: a.trail.data },
    uRock: { value: a.rock.color },
    uRockN: { value: a.rock.normal },
    uMeadow: { value: new THREE.Color("#5c7a2e") },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aMask;\nvarying vec4 vMask;\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\nvMask = aMask;\n${WORLD_VARYING_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec4 vMask;
        varying vec3 vWorld;
        uniform sampler2D uGrassD, uLitter, uLitterN, uLitterD, uTrail, uTrailN, uTrailD, uRock, uRockN;
        uniform vec3 uMeadow;
        // Height-aware blend: the taller material wins at the transition, so edges look physical.
        float hb(float h1, float h2, float m) { float a = h1 + (1.0 - m), b = h2 + m; float d = 0.18; float ma = max(a, b) - d; float w1 = max(a - ma, 0.0), w2 = max(b - ma, 0.0); return w2 / (w1 + w2); }`
      )
      .replace(
        "#include <map_fragment>",
        `vec2 guv = vMapUv;
        vec2 luv = guv * 0.8 + vec2(0.31, 0.17);
        vec2 tuv = guv * 1.2;
        vec2 ruv = guv * 0.35;
        vec4 gD = texture2D(uGrassD, guv);
        vec4 lD = texture2D(uLitterD, luv);
        vec4 tD = texture2D(uTrailD, tuv);
        // Macro variation so the ground never tiles visibly from above.
        float macro = texture2D(uGrassD, guv * 0.043 + 0.5).b;
        // The scanned grass is mostly dry; keep its structure but recolour it as a living meadow.
        vec3 gTex = texture2D(map, guv).rgb;
        float gLum = dot(gTex, vec3(0.3, 0.59, 0.11));
        vec3 meadowHue = uMeadow / max(dot(uMeadow, vec3(0.3, 0.59, 0.11)), 1e-3);
        vec3 grass = mix(gTex, gLum * meadowHue * 1.15, 0.72) * mix(vec3(0.86, 0.9, 0.78), vec3(1.1, 1.04, 0.9), macro);
        vec3 litter = texture2D(uLitter, luv).rgb;
        vec3 trail = texture2D(uTrail, tuv).rgb * vec3(0.78, 0.7, 0.6);
        vec3 rock = texture2D(uRock, ruv).rgb;
        float wL = hb(gD.b, lD.b, clamp(vMask.x + (macro - 0.5) * 0.35, 0.0, 1.0));
        vec3 col = mix(grass, litter, wL);
        float hgl = mix(gD.b, lD.b, wL);
        float wT = hb(hgl, tD.b, vMask.y);
        col = mix(col, trail, wT);
        float wR = smoothstep(0.35, 0.75, vMask.z);
        col = mix(col, rock, wR);
        // Damp earth near water.
        col *= mix(1.0, 0.62, vMask.w);
        diffuseColor.rgb *= col;
        float groundAO = mix(mix(mix(gD.r, lD.r, wL), tD.r, wT), 1.0, wR);
        float groundRough = mix(mix(mix(gD.g, lD.g, wL), tD.g, wT), 0.85, wR);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          vec3 nG = texture2D(normalMap, guv).xyz * 2.0 - 1.0;
          vec3 nL = texture2D(uLitterN, luv).xyz * 2.0 - 1.0;
          vec3 nT = texture2D(uTrailN, tuv).xyz * 2.0 - 1.0;
          vec3 nR = texture2D(uRockN, ruv).xyz * 2.0 - 1.0;
          vec3 mapN = mix(mix(mix(nG, nL, wL), nT, wT), nR, wR);
          mapN.xy *= normalScale;
          normal = normalize(tbn * mapN);
        }`
      )
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = mix(groundRough, 0.35, vMask.w * 0.5);")
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        reflectedLight.indirectDiffuse *= mix(0.55, 1.0, groundAO);
        reflectedLight.directDiffuse *= mix(0.75, 1.0, groundAO);`
      );
  };
  mat.customProgramCacheKey = () => "ground-splat-v1";
  return mat;
}

// ─── Foliage (leaf-cluster cards) ───────────────────────────────────────────

export interface FoliageOptions {
  /** Base tint multiplied into the leaf atlas. */
  color?: string;
  /** Second tint for per-instance variation. */
  color2?: string;
  /** Wind amplitude (world units at the cluster's edge). */
  sway?: number;
  /** Strength of light through the leaves when looking towards the sun. */
  translucency?: number;
  alphaTest?: number;
  /** Use the per-vertex `color` attribute. */
  vertexColors?: boolean;
  /** 0..1 blend of the geometry's normals towards the per-instance `aBlobN` (canopy-scale volume shading). */
  blob?: number;
}

const BLOB_NORMAL = /* glsl */ `
  #ifdef USE_BLOB
    #ifdef USE_INSTANCING
      vec3 blobN = transpose(mat3(instanceMatrix)) * aBlobN;
    #else
      vec3 blobN = aBlobN;
    #endif
    objectNormal = normalize(mix(normalize(objectNormal), normalize(blobN), uBlob));
  #endif
`;

const FOLIAGE_VERTEX = /* glsl */ `
  // Wind: a slow sway of the whole cluster plus a faster flutter of each card.
  vec4 fw4 = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    fw4 = instanceMatrix * fw4;
    vec3 iOrigin = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #else
    vec3 iOrigin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #endif
  vec3 fWorld = (modelMatrix * fw4).xyz;
  float fPhase = dot(iOrigin, vec3(0.071, 0.013, 0.053));
  float fEdge = clamp(length(position) * 0.6, 0.0, 1.0);
  vec3 fSway = vec3(sin(uTime * 0.9 + fPhase), 0.0, cos(uTime * 0.7 + fPhase * 1.3)) * 0.35;
  fSway += vec3(sin(uTime * 3.7 + fWorld.y * 0.8 + fPhase * 4.0), sin(uTime * 4.3 + fWorld.x * 0.7), cos(uTime * 3.1 + fWorld.z * 0.9)) * 0.12;
  transformed += fSway * uSway * uWind * fEdge;
`;

export function createFoliageMaterial(atlas: THREE.Texture, o: FoliageOptions = {}) {
  const mat = new THREE.MeshStandardMaterial({
    map: atlas,
    alphaTest: o.alphaTest ?? 0.42,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0,
    color: o.color ?? "#ffffff",
    vertexColors: o.vertexColors ?? false,
  });
  if (o.blob) mat.defines = { USE_BLOB: "" };
  const uniforms = {
    uBlob: { value: o.blob ?? 0 },
    uTime: shared.uTime,
    uWind: shared.uWind,
    uSunDir: shared.uSunDir,
    uSunColor: shared.uSunColor,
    uSway: { value: o.sway ?? 0.25 },
    uTrans: { value: o.translucency ?? 0.9 },
    uColor2: { value: new THREE.Color(o.color2 ?? o.color ?? "#ffffff") },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uTime, uWind, uSway, uBlob;\nvarying float vVar;\nvarying vec3 vFoliageWorld;\n#ifdef USE_BLOB\nattribute vec3 aBlobN;\n#endif"
      )
      .replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>\n${BLOB_NORMAL}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${FOLIAGE_VERTEX}`)
      .replace(
        "#include <fog_vertex>",
        `#include <fog_vertex>
        vec4 vw4 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          vw4 = instanceMatrix * vw4;
        #endif
        vFoliageWorld = (modelMatrix * vw4).xyz;
        vVar = fract(sin(dot(iOrigin.xz, vec2(12.9898, 78.233))) * 43758.5453);`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uSunDir, uSunColor, uColor2;
        uniform float uTrans;
        varying float vVar;
        varying vec3 vFoliageWorld;`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        diffuseColor.rgb *= mix(vec3(1.0), uColor2 / max(diffuse, vec3(0.01)), vVar);`
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
        // Light through the leaves when the sun is behind them.
        vec3 vDir = normalize(vFoliageWorld - cameraPosition);
        float back = pow(max(dot(vDir, uSunDir), 0.0), 3.0);
        float sunUp = smoothstep(-0.08, 0.05, uSunDir.y);
        reflectedLight.directDiffuse += diffuseColor.rgb * uSunColor * back * uTrans * 1.3 * sunUp;`
      );
  };
  mat.customProgramCacheKey = () => "foliage-v2";
  return mat;
}

/** Depth material so leaf cards cast leaf-shaped (not card-shaped) shadows. */
export function createFoliageDepthMaterial(atlas: THREE.Texture, o: FoliageOptions = {}) {
  const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: atlas, alphaTest: o.alphaTest ?? 0.42 });
  const uniforms = { uTime: shared.uTime, uWind: shared.uWind, uSway: { value: o.sway ?? 0.25 } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime, uWind, uSway;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${FOLIAGE_VERTEX}`);
  };
  mat.customProgramCacheKey = () => "foliage-depth-v2";
  return mat;
}

// ─── Water ──────────────────────────────────────────────────────────────────

/**
 * River and lake: a dark, glossy surface whose ripples come from animated
 * noise; reflections come from the sky environment, and the `aDepth`
 * attribute (water depth) tints shallows and the shoreline.
 */
export function createWaterMaterial() {
  const mat = new THREE.MeshStandardMaterial({ color: "#0d2124", roughness: 0.04, metalness: 0, envMapIntensity: 1.5, transparent: true });
  const uniforms = { uTime: shared.uTime, uNight: shared.uNight };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aDepth;\nattribute vec2 aFlow;\nvarying float vDepth;\nvarying vec2 vFlow;\nvarying vec3 vWorld;")
      .replace("#include <fog_vertex>", `#include <fog_vertex>\nvDepth = aDepth;\nvFlow = aFlow;\n${WORLD_VARYING_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime, uNight;
        varying float vDepth;
        varying vec2 vFlow;
        varying vec3 vWorld;
        ${GLSL_HASH}
        ${GLSL_SIMPLEX3}
        vec2 rippleGrad(vec2 p, float t) {
          float e = 0.08;
          float h0 = snoise3(vec3(p, t));
          float hx = snoise3(vec3(p + vec2(e, 0.0), t));
          float hz = snoise3(vec3(p + vec2(0.0, e), t));
          return vec2(hx - h0, hz - h0) / e;
        }`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float shallow = 1.0 - smoothstep(0.0, 1.6, vDepth);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.16, 0.1), shallow * 0.6);
        // The shoreline dissolves instead of ending on terrain triangles.
        diffuseColor.a = smoothstep(0.0, 0.35, vDepth);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          vec2 p = vWorld.xz * 0.9 - vFlow * uTime * 1.6;
          vec2 g = rippleGrad(p, uTime * 0.35) * 0.5 + rippleGrad(p * 2.9 + 3.1, uTime * 0.6) * 0.3;
          // Ripples flatten with distance so far water mirrors the sky cleanly.
          float rippleFade = 1.0 - smoothstep(30.0, 160.0, length(vWorld - cameraPosition));
          vec3 nW = normalize(vec3(-g.x * 0.07 * rippleFade, 1.0, -g.y * 0.07 * rippleFade));
          normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
        }`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        // Soft foam line where the water meets the shore.
        float foam = (1.0 - smoothstep(0.0, 0.18, vDepth)) * (0.55 + 0.45 * snoise3(vec3(vWorld.xz * 1.3, uTime * 0.6)));
        reflectedLight.directDiffuse += vec3(0.7, 0.72, 0.68) * foam * 0.25 * (1.0 - uNight * 0.8);`
      );
  };
  mat.customProgramCacheKey = () => "water-v2";
  return mat;
}

// ─── Signal (the root network) ──────────────────────────────────────────────

/**
 * The network's light: thin tubes whose `uv.x` runs along their length.
 * Pulses travel outward like packets; `aSeed` desynchronises threads. Additive,
 * HDR (so bloom picks it up), stronger as night falls.
 */
export function createSignalMaterial(opts: { color?: string; intensity?: number; speed?: number; floor?: number } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
    uniforms: {
      ...THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uColor: { value: new THREE.Color(opts.color ?? "#7ee0cf") },
          uIntensity: { value: opts.intensity ?? 1 },
          uSpeed: { value: opts.speed ?? 0.12 },
          uFocus: { value: 0 },
          uFloor: { value: opts.floor ?? 0.18 },
        },
      ]),
      uTime: shared.uTime,
      uNight: shared.uNight,
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      attribute float aSeed;
      varying vec2 vUv;
      varying float vSeed;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vSeed = aSeed;
        vec3 transformed = position;
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uIntensity, uSpeed, uFocus, uFloor;
      uniform float uTime, uNight;
      varying vec2 vUv;
      varying float vSeed;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        // Bright core, soft rim — reads as a glowing filament from every angle.
        float rim = pow(clamp(dot(vN, vV), 0.0, 1.0), 0.6);
        float s = vUv.x * 9.0 - uTime * uSpeed * 9.0 + vSeed * 17.0;
        float pulse = pow(0.5 + 0.5 * sin(s), 18.0) + pow(0.5 + 0.5 * sin(s * 0.37 + 1.7), 30.0) * 0.7;
        float base = 0.12 + 0.88 * mix(0.25, 1.0, uNight);
        float a = (uFloor * base + pulse * (0.9 + uFocus)) * rim * uIntensity;
        vec3 glow = uColor * a;
        gl_FragColor = vec4(glow, 1.0);
        #include <fog_fragment>
        #ifdef USE_FOG
          // Additive light fades into the haze instead of adding fog colour.
          gl_FragColor.rgb = glow * (1.0 - fogFactor);
        #endif
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
