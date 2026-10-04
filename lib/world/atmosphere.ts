import * as THREE from "three";

/**
 * Art direction for light and air: a late-afternoon sun low on the right of
 * the valley, a cool sky, and exponential height fog that gives atmospheric
 * perspective (the World Tree rises out of the valley haze).
 *
 * Importing this module patches three's fog shader chunks once, before any
 * material compiles, so every built-in material gets the same height fog.
 */

export const SUN_DIRECTION = new THREE.Vector3(0.74, 0.42, -0.53).normalize();
export const SUN_COLOR = new THREE.Color("#ffd3a1");
export const SUN_INTENSITY = 3.4;

export const SKY = {
  zenith: new THREE.Color("#3f6dab"),
  upper: new THREE.Color("#8aaacb"),
  horizon: new THREE.Color("#d3cdbc"),
  horizonSun: new THREE.Color("#f4c58c"),
  sunGlow: new THREE.Color("#fff0d6"),
  ground: new THREE.Color("#5b5f45"),
};

export const FOG = {
  color: new THREE.Color("#b3ad9c"),
  density: 0.00115,
  /** Fog thins with altitude: density halves roughly every ln(2)/falloff units. */
  falloff: 0.017,
  base: 0,
  interiorColor: new THREE.Color("#2a1b10"),
  interiorDensity: 0.0045,
};

const v = (x: THREE.Vector3) => `vec3(${x.x.toFixed(5)}, ${x.y.toFixed(5)}, ${x.z.toFixed(5)})`;

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
  THREE.ShaderChunk.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    vec3 fogRay = vFogWorldPos - cameraPosition;
    float fogDist = length( fogRay );
    float fogH = max( cameraPosition.y - ${FOG.base.toFixed(2)}, -20.0 );
    float fogK = ${FOG.falloff.toFixed(5)};
    float fogDy = fogRay.y * fogK;
    float fogLine = abs( fogDy ) > 1e-4 ? ( 1.0 - exp( -fogDy ) ) / fogDy : 1.0;
    float fogAmount = fogDensity * exp( -fogK * fogH ) * fogDist * fogLine;
    float fogFactor = 1.0 - exp( -max( fogAmount, 0.0 ) );
    vec3 fogDir = fogRay / max( fogDist, 1e-3 );
    float fogSun = pow( max( dot( fogDir, ${v(SUN_DIRECTION)} ), 0.0 ), 6.0 );
    vec3 fogTint = fogColor * ( 1.0 + fogSun * vec3( 0.75, 0.42, 0.08 ) );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
    vec3 fogTint = fogColor;
  #endif
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogTint, fogFactor );
#endif
`;
}

patchFogChunks();

/** Gradient sky dome with sun disc and a horizon band that matches the fog. */
export function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSun: { value: SUN_DIRECTION.clone() },
      uZenith: { value: SKY.zenith.clone() },
      uUpper: { value: SKY.upper.clone() },
      uHorizon: { value: SKY.horizon.clone() },
      uHorizonSun: { value: SKY.horizonSun.clone() },
      uSunGlow: { value: SKY.sunGlow.clone() },
      uGround: { value: SKY.ground.clone() },
      uFog: { value: FOG.color.clone() },
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
      uniform vec3 uSun, uZenith, uUpper, uHorizon, uHorizonSun, uSunGlow, uGround, uFog;
      uniform float uDim;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float y = d.y;
        float sunDot = max(dot(d, uSun), 0.0);
        // Horizon colour warms towards the sun.
        float sunSide = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0), 2.5);
        vec3 horizon = mix(uHorizon, uHorizonSun, sunSide * 0.85);
        vec3 col = mix(horizon, uUpper, smoothstep(0.0, 0.28, y));
        col = mix(col, uZenith, smoothstep(0.25, 0.85, y));
        // Haze band hugging the horizon, matching the fog so distant land dissolves into it.
        col = mix(col, mix(uFog, horizon, 0.5), (1.0 - smoothstep(-0.02, 0.12, y)) * 0.7);
        // Below the horizon: fog colour fading to a darker ground tone.
        col = mix(col, mix(uFog, uGround, 0.35), smoothstep(0.0, -0.25, y));
        // Sun: broad warm glow + tight bright disc (HDR so it blooms softly).
        col += uSunGlow * (pow(sunDot, 12.0) * 0.45 + pow(sunDot, 120.0) * 1.4);
        col += uSunGlow * smoothstep(0.9993, 0.9997, sunDot) * 6.0;
        gl_FragColor = vec4(col * uDim, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
