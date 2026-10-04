"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing";
import { EffectPass, ToneMappingMode, type EffectComposer as PPComposer } from "postprocessing";
import * as THREE from "three";
import { useWorldResources } from "./WorldResources";
import { FOG, SUN_COLOR, SUN_DIRECTION, SUN_INTENSITY, createSkyMaterial } from "@/lib/world/atmosphere";
import { CAMP } from "@/lib/world/layout";
import { FOCUS_STOPS } from "@/lib/world/journey";
import { frame } from "@/lib/world/store";
import { sharedUniforms } from "@/lib/world/materials";
import type { QualitySettings } from "@/lib/world/quality";
import { isOff } from "@/lib/world/debug";

/**
 * Light and air for the whole journey, blended by how far inside the World
 * Tree the camera is:
 *
 *   outside — low golden sun with a camera-following shadow frustum, sky
 *             image-based lighting, height fog, exposure 1
 *   inside  — sun and sky fade, warm interior IBL takes over, eyes "adapt"
 *             (exposure rises), one accent light glows on the relic in focus
 *
 * Light count never changes, so no shader ever recompiles mid-journey.
 */

const UP = new THREE.Vector3(0, 1, 0);
const LIGHT_X = new THREE.Vector3().crossVectors(UP, SUN_DIRECTION).normalize();
const LIGHT_Y = new THREE.Vector3().crossVectors(SUN_DIRECTION, LIGHT_X).normalize();
const CAMPFIRE = new THREE.Vector3(CAMP.x - 1.5, CAMP.y + 1.1, CAMP.z + 0.5);

function shadowExtent(p: number) {
  if (p < 0.15) return 46;
  if (p < 0.3) return 95;
  return 520;
}

function PostFX({ msaa }: { msaa: number }) {
  const ref = useRef<PPComposer>(null);
  useEffect(() => {
    // Dither the final 8-bit output so sky gradients never band.
    ref.current?.passes.forEach((p) => {
      if (p instanceof EffectPass) p.dithering = true;
    });
  });
  return (
    <EffectComposer ref={ref} multisampling={msaa} frameBufferType={THREE.HalfFloatType}>
      <Bloom mipmapBlur intensity={0.62} luminanceThreshold={1.0} luminanceSmoothing={0.18} radius={0.74} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.42} eskil={false} />
    </EffectComposer>
  );
}

export function EnvironmentSetup({ quality }: { quality: QualitySettings }) {
  const { scene, gl, camera } = useThree();
  const { skyEnv } = useWorldResources();
  const sky = useMemo(() => createSkyMaterial(), []);
  const skyRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const accentRef = useRef<THREE.PointLight>(null);
  const fog = useMemo(() => new THREE.FogExp2(FOG.color.clone(), FOG.density), []);
  const state = useMemo(() => ({ extent: 0, focus: new THREE.Vector3(), fwd: new THREE.Vector3(), snapped: new THREE.Vector3() }), []);
  const shadows = quality.shadowMapSize > 0 && !isOff("shadows");

  // Scene-level state must exist before materials compile (layout effects run first).
  useLayoutEffect(() => {
    scene.environment = skyEnv;
    scene.background = null;
    scene.fog = fog;
    return () => {
      scene.environment = null;
      scene.fog = null;
    };
  }, [scene, skyEnv, fog]);

  useEffect(() => () => sky.dispose(), [sky]);

  useFrame((s, dt) => {
    sharedUniforms.uTime.value += Math.min(dt, 0.1);
    const inside = frame.interior;
    const p = frame.progress;

    // Exposure: eyes adapt inside the tree; the end of the ascent floods with light.
    gl.toneMappingExposure = THREE.MathUtils.lerp(0.92, 1.65, inside) + frame.outro * 1.4;
    scene.environmentIntensity = THREE.MathUtils.lerp(0.72, 0.18, inside);
    fog.density = THREE.MathUtils.lerp(FOG.density, FOG.interiorDensity, inside);
    fog.color.copy(FOG.color).lerp(FOG.interiorColor, inside);

    if (skyRef.current) {
      skyRef.current.position.copy(camera.position);
      sky.uniforms.uDim.value = 1 - inside * 0.35;
    }

    const sun = sunRef.current;
    if (sun) {
      sun.intensity = SUN_INTENSITY * (1 - inside * 0.97);
      if (shadows) {
        const extent = shadowExtent(p);
        if (extent !== state.extent) {
          state.extent = extent;
          const cam = sun.shadow.camera;
          cam.left = -extent;
          cam.right = extent;
          cam.top = extent;
          cam.bottom = -extent;
          cam.near = 1;
          cam.far = extent * 2 + 900;
          cam.updateProjectionMatrix();
          sun.shadow.normalBias = extent * 0.0016;
          sun.shadow.bias = -0.0002;
        }
        sun.shadow.autoUpdate = inside < 0.98;
        // Centre the shadow frustum ahead of the camera, snapped to whole texels so it never shimmers.
        camera.getWorldDirection(state.fwd);
        state.focus.copy(camera.position).addScaledVector(state.fwd, state.extent * 0.55);
        const texel = (2 * state.extent) / quality.shadowMapSize;
        const fx = Math.round(state.focus.dot(LIGHT_X) / texel) * texel;
        const fy = Math.round(state.focus.dot(LIGHT_Y) / texel) * texel;
        const fz = state.focus.dot(SUN_DIRECTION);
        state.snapped.copy(LIGHT_X).multiplyScalar(fx).addScaledVector(LIGHT_Y, fy).addScaledVector(SUN_DIRECTION, fz);
        sun.position.copy(state.snapped).addScaledVector(SUN_DIRECTION, 700);
        sun.target.position.copy(state.snapped);
        sun.target.updateMatrixWorld();
      } else {
        sun.position.copy(camera.position).addScaledVector(SUN_DIRECTION, 700);
        sun.target.position.copy(camera.position);
        sun.target.updateMatrixWorld();
      }
    }

    // One accent light: the campfire outside, the relic in focus inside.
    const accent = accentRef.current;
    if (accent) {
      const t = sharedUniforms.uTime.value;
      if (inside < 0.5) {
        accent.position.copy(CAMPFIRE);
        accent.color.set("#ff8a3d");
        accent.intensity = 38 * (0.86 + 0.1 * Math.sin(t * 11.3) + 0.06 * Math.sin(t * 23.7)) * (1 - inside * 2);
        accent.distance = 26;
      } else {
        let nearest = FOCUS_STOPS[0];
        let best = Infinity;
        for (const stop of FOCUS_STOPS) {
          const d = Math.abs(stop.progress - p);
          if (d < best) {
            best = d;
            nearest = stop;
          }
        }
        // A soft key light just in front of and above the relic.
        state.fwd.copy(nearest.camera).sub(nearest.target).setY(0).normalize();
        accent.position.copy(nearest.target).addScaledVector(state.fwd, 3.2).add(new THREE.Vector3(0, 2.6, 0));
        accent.color.set("#ffcf86");
        accent.intensity = 30 * (inside - 0.5) * 2;
        accent.distance = 11;
      }
    }
  });

  return (
    <>
      <mesh ref={skyRef} material={sky} renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[1500, 64, 32]} />
      </mesh>
      <directionalLight
        ref={sunRef}
        color={SUN_COLOR}
        intensity={SUN_INTENSITY}
        castShadow={shadows}
        shadow-mapSize-width={quality.shadowMapSize || 1024}
        shadow-mapSize-height={quality.shadowMapSize || 1024}
      />
      <pointLight ref={accentRef} decay={2} />
      {quality.postprocessing && !isOff("post") && <PostFX msaa={quality.msaa} />}
    </>
  );
}
