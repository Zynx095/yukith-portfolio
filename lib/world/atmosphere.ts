import * as THREE from "three";
import { clamp, lerp, smoothstep } from "./noise";

/**
 * Light and air. Time of day follows the story (docs/ART_DIRECTION.md):
 * late-afternoon gold at the arrival, sunset at the reveal of the World Tree,
 * dusk at its roots and blue hour above its crown.
 *
 * The sun keeps one azimuth (side-back light from the right of the valley, so
 * the tree is rim-lit as the camera approaches) and sinks through the journey.
 * Importing this module patches three's fog chunks once, before any material
 * compiles, so every built-in material gets the same height fog.
 */

/** Horizontal direction towards the sun (unit, y = 0). */
export const SUN_AZIMUTH = new THREE.Vector3(0.93, 0, -0.37).normalize();

export interface SkyState {
  /** Unit vector towards the sun. */
  sunDir: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  zenith: THREE.Color;
  horizon: THREE.Color;
  horizonSun: THREE.Color;
  fog: THREE.Color;
  fogDensity: number;
  /** Ambient / IBL scale for the scene environment. */
  envIntensity: number;
  /** 0 day → 1 night (stars, signal glow). */
  night: number;
}

const C = (hex: string) => new THREE.Color(hex);

/** Colour script keys: journey progress where each mood is fully reached. */
const KEYS = [
  { p: 0.0, elev: 21, sun: C("#ffe2b8"), sunI: 3.3, zen: C("#3d6aa8"), hor: C("#d9d4c2"), horSun: C("#f6cf98"), fog: C("#aab3b6"), dens: 0.0006, env: 0.75, night: 0 },
  { p: 0.17, elev: 13, sun: C("#ffd29a"), sunI: 3.2, zen: C("#3a63a0"), hor: C("#dccdb4"), horSun: C("#f7bd7c"), fog: C("#b3b0a2"), dens: 0.00065, env: 0.7, night: 0 },
  { p: 0.32, elev: 4.5, sun: C("#ffb56a"), sunI: 3.0, zen: C("#33598f"), hor: C("#d8b993"), horSun: C("#f79d52"), fog: C("#b29c84"), dens: 0.0007, env: 0.6, night: 0.05 },
  { p: 0.43, elev: -1.5, sun: C("#ff8c4a"), sunI: 1.2, zen: C("#26406f"), hor: C("#b48d7a"), horSun: C("#e0784a"), fog: C("#7a6a68"), dens: 0.00075, env: 0.42, night: 0.45 },
  { p: 0.9, elev: -6, sun: C("#ff7a45"), sunI: 0.35, zen: C("#141f3d"), hor: C("#4f4b62"), horSun: C("#8c5a52"), fog: C("#3b3a4a"), dens: 0.0009, env: 0.28, night: 0.85 },
  { p: 1.0, elev: -8, sun: C("#ff7a45"), sunI: 0.2, zen: C("#0d1530"), hor: C("#3b3c56"), horSun: C("#6f4c4f"), fog: C("#2c2e40"), dens: 0.0008, env: 0.24, night: 1 },
];

const tmpA = new THREE.Color();

/** Atmosphere for a journey progress value. Writes into `out` (allocation-free per frame). */
export function skyAt(p: number, out: SkyState) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smoothstep(a.p, b.p, clamp(p, a.p, b.p));
  const elev = THREE.MathUtils.degToRad(lerp(a.elev, b.elev, t));
  out.sunDir.copy(SUN_AZIMUTH).multiplyScalar(Math.cos(elev)).setY(Math.sin(elev)).normalize();
  out.sunColor.copy(a.sun).lerp(tmpA.copy(b.sun), t);
  out.sunIntensity = lerp(a.sunI, b.sunI, t);
  out.zenith.copy(a.zen).lerp(tmpA.copy(b.zen), t);
  out.horizon.copy(a.hor).lerp(tmpA.copy(b.hor), t);
  out.horizonSun.copy(a.horSun).lerp(tmpA.copy(b.horSun), t);
  out.fog.copy(a.fog).lerp(tmpA.copy(b.fog), t);
  out.fogDensity = lerp(a.dens, b.dens, t);
  out.envIntensity = lerp(a.env, b.env, t);
  out.night = lerp(a.night, b.night, t);
  return out;
}

export function createSkyState(): SkyState {
  return skyAt(0, {
    sunDir: new THREE.Vector3(),
    sunColor: new THREE.Color(),
    sunIntensity: 0,
    zenith: new THREE.Color(),
    horizon: new THREE.Color(),
    horizonSun: new THREE.Color(),
    fog: new THREE.Color(),
    fogDensity: 0,
    envIntensity: 0,
    night: 0,
  });
}

/** Height-fog falloff: density halves roughly every ln(2)/k metres of altitude. */
export const FOG_FALLOFF = 0.016;
export const INTERIOR_FOG = { color: new THREE.Color("#1d140d"), density: 0.006 };

const v3 = (x: THREE.Vector3) => `vec3(${x.x.toFixed(5)}, ${x.y.toFixed(5)}, ${x.z.toFixed(5)})`;

let patched = false;
export function patchFogChunks() {
  if (patched) return;
  patched = true;
  THREE.ShaderChunk.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorldPos;
#endif
`;
  THREE.ShaderChunk.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vec4 fogWorld = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    fogWorld = instanceMatrix * fogWorld;
  #endif
  vFogWorldPos = ( modelMatrix * fogWorld ).xyz;
#endif
`;
  THREE.ShaderChunk.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogWorldPos;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif
`;
  // Exponential height fog, integrated analytically along the view ray, with a
  // warm forward-scattering lobe towards the sun's azimuth.
  THREE.ShaderChunk.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    vec3 fogRay = vFogWorldPos - cameraPosition;
    float fogDist = length( fogRay );
    float fogH = max( cameraPosition.y, -20.0 );
    float fogK = ${FOG_FALLOFF.toFixed(5)};
    float fogDy = fogRay.y * fogK;
    float fogLine = abs( fogDy ) > 1e-4 ? ( 1.0 - exp( -fogDy ) ) / fogDy : 1.0;
    float fogAmount = fogDensity * exp( -fogK * fogH ) * fogDist * fogLine;
    float fogFactor = 1.0 - exp( -max( fogAmount, 0.0 ) );
    vec3 fogDir = fogRay / max( fogDist, 1e-3 );
    float fogSun = pow( max( dot( normalize( vec3( fogDir.x, 0.0, fogDir.z ) ), ${v3(SUN_AZIMUTH)} ), 0.0 ), 5.0 ) * ( 1.0 - abs( fogDir.y ) );
    vec3 fogTint = fogColor * ( 1.0 + fogSun * vec3( 0.55, 0.3, 0.06 ) );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
    vec3 fogTint = fogColor;
  #endif
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogTint, fogFactor );
#endif
`;
}

patchFogChunks();

/** Gradient sky dome: sun disc and glow, horizon band matching the fog, stars at night. */
export function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSun: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color() },
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uHorizonSun: { value: new THREE.Color() },
      uFog: { value: new THREE.Color() },
      uNight: { value: 0 },
      uDim: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww; // always at the far plane
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun, uSunColor, uZenith, uHorizon, uHorizonSun, uFog;
      uniform float uNight, uDim;
      varying vec3 vDir;
      float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      void main() {
        vec3 d = normalize(vDir);
        float y = d.y;
        float sunDot = max(dot(d, uSun), 0.0);
        float sunSide = pow(max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), normalize(vec3(uSun.x, 0.0, uSun.z) + 1e-5)), 0.0), 3.0);
        vec3 horizon = mix(uHorizon, uHorizonSun, sunSide * smoothstep(0.35, -0.05, uSun.y) * 0.9 + sunSide * 0.35);
        vec3 col = mix(horizon, uZenith, smoothstep(-0.02, 0.55, y));
        // Haze band hugging the horizon, matching the fog so distant land dissolves into it.
        col = mix(col, mix(uFog, horizon, 0.45), (1.0 - smoothstep(-0.03, 0.1, y)) * 0.75);
        col = mix(col, uFog * 0.85, smoothstep(0.0, -0.2, y));
        // Sun: broad warm glow + a tight disc (HDR so it blooms a little).
        float above = smoothstep(-0.06, 0.02, uSun.y);
        col += uSunColor * (pow(sunDot, 10.0) * 0.55 + pow(sunDot, 90.0) * 1.1) * mix(0.35, 1.0, above);
        col += uSunColor * smoothstep(0.9994, 0.9997, sunDot) * 7.0 * above;
        // Stars, fading in at blue hour.
        if (uNight > 0.01 && y > 0.0) {
          vec3 sp = d * 380.0;
          vec3 cell = floor(sp);
          vec3 f = fract(sp) - 0.5;
          float h = hash13(cell);
          // Distance from the cell centre perpendicular to the view ray: a round point.
          float r = length(f - dot(f, d) * d);
          float star = step(0.993, h) * smoothstep(0.16, 0.0, r) * smoothstep(0.02, 0.25, y);
          float tw = 0.65 + 0.35 * sin(h * 900.0);
          col += vec3(0.85, 0.9, 1.0) * star * tw * uNight * 1.6;
        }
        gl_FragColor = vec4(col * uDim, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
