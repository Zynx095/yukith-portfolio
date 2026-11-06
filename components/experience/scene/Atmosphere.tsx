"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing";
import { EffectPass, ToneMappingMode, type EffectComposer as PPComposer } from "postprocessing";
import * as THREE from "three";
import { INTERIOR_FOG, createSkyMaterial, createSkyState, skyAt } from "@/lib/world/atmosphere";
import { shared } from "@/lib/world/materials";
import { frame } from "@/lib/world/store";
import { CAMP, TREE, TREE_ENTRANCE_ANGLE } from "@/lib/world/layout";
import { cavityAt, spine } from "@/lib/world/tree";
import { ARENA_SPOTS, L, exhibitById } from "@/lib/world/regions";
import { ui } from "@/lib/world/store";
import { HALL_CENTER, hallAxis } from "@/lib/world/archive";
import { FOCUS_STOPS, RINGS } from "@/lib/world/journey";
import { RING_STAGES } from "@/lib/world/rings";
import { isOff } from "@/lib/world/debug";
import { useWorld } from "./WorldContext";

/**
 * Light and air for the whole journey: the sky dome, one sun with a
 * camera-following shadow frustum, image-based light rebuilt from the sky as
 * the day ends, height fog, exposure and the final image (bloom, ACES, vignette).
 *
 * Light count never changes (one directional, two point lights), so no shader
 * recompiles mid-journey.
 */

const UP = new THREE.Vector3(0, 1, 0);
/** After sunset the same directional light becomes a cool, high moon. */
const MOON_DIR = new THREE.Vector3(-0.35, 0.72, 0.6).normalize();
const MOON_COLOR = new THREE.Color("#9db4e0");
export const CAMPFIRE = new THREE.Vector3(CAMP.x - 1.2, CAMP.y + 0.9, CAMP.z + 0.4);
const ENTRANCE_LIGHT = (() => {
  const a = TREE_ENTRANCE_ANGLE;
  const sp = spine(0);
  return new THREE.Vector3(TREE.x + sp.x + Math.cos(a) * 44, TREE.y + 6, TREE.z + sp.y + Math.sin(a) * 44);
})();

function shadowExtent(p: number) {
  if (p < 0.17) return 55;
  if (p < 0.29) return 90;
  if (p < 0.46) return 420;
  return 140;
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
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1.05} luminanceSmoothing={0.2} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.38} eskil={false} />
    </EffectComposer>
  );
}

export function Atmosphere() {
  const { scene, gl, camera } = useThree();
  const { interiorEnv, arenaEnv, quality } = useWorld();
  const sky = useMemo(() => createSkyMaterial(), []);
  const state = useMemo(() => createSkyState(), []);
  const skyRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fireRef = useRef<THREE.PointLight>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const fog = useMemo(() => new THREE.FogExp2(state.fog.getHex(), state.fogDensity), [state]);
  const shadows = quality.shadowMapSize > 0 && !isOff("shadows");

  // Image-based light from the sky, rebuilt as the colour script advances.
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    const envSky = createSkyMaterial();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), envSky));
    const target = pmrem.fromScene(envScene, 0.04, 0.1, 200, { size: 128 });
    return { pmrem, envScene, envSky, target, lastP: -1 };
  }, [gl]);
  useEffect(
    () => () => {
      env.pmrem.dispose();
      env.target.dispose();
      env.envSky.dispose();
      sky.dispose();
    },
    [env, sky]
  );

  const tmp = useMemo(
    () => ({
      extent: 0,
      fwd: new THREE.Vector3(),
      focus: new THREE.Vector3(),
      snapped: new THREE.Vector3(),
      lx: new THREE.Vector3(),
      ly: new THREE.Vector3(),
      lightDir: new THREE.Vector3(),
      fogCol: new THREE.Color(),
    }),
    []
  );

  // Scene-level state must exist before materials compile (layout effects run first).
  useLayoutEffect(() => {
    scene.environment = env.target.texture;
    scene.background = null;
    scene.fog = fog;
    return () => {
      scene.environment = null;
      scene.fog = null;
    };
  }, [scene, env, fog]);

  const applySky = (m: THREE.ShaderMaterial) => {
    m.uniforms.uSun.value.copy(state.sunDir);
    m.uniforms.uSunColor.value.copy(state.sunColor);
    m.uniforms.uZenith.value.copy(state.zenith);
    m.uniforms.uHorizon.value.copy(state.horizon);
    m.uniforms.uHorizonSun.value.copy(state.horizonSun);
    m.uniforms.uFog.value.copy(state.fog);
    m.uniforms.uNight.value = state.night;
  };

  useFrame((s, dt) => {
    const p = frame.progress;
    const inside = frame.interior;
    skyAt(p, state);
    shared.uTime.value += Math.min(dt, 0.1);
    shared.uSunDir.value.copy(state.sunDir);
    shared.uSunColor.value.copy(state.sunColor);
    shared.uNight.value = state.night;
    shared.uInterior.value = inside;
    frame.dusk = state.night;

    applySky(sky);
    if (skyRef.current) skyRef.current.position.copy(camera.position);

    // Rebuild the sky's image-based light only when the sky has visibly changed.
    if (inside < 0.98 && Math.abs(p - env.lastP) > 0.012) {
      env.lastP = p;
      applySky(env.envSky);
      const next = env.pmrem.fromScene(env.envScene, 0.04, 0.1, 200, { size: 128 });
      const prev = env.target;
      env.target = next;
      if (scene.environment === prev.texture) scene.environment = next.texture;
      prev.dispose();
    }
    const pocket = frame.pocket > 0.5;
    const wantEnv = pocket ? arenaEnv : inside > 0.5 ? interiorEnv : env.target.texture;
    if (scene.environment !== wantEnv) scene.environment = wantEnv;
    // Inside, the hollow brightens towards the open crown as the camera climbs.
    const climb = THREE.MathUtils.smoothstep(p, 0.8, 0.93);
    scene.environmentIntensity = THREE.MathUtils.lerp(state.envIntensity, 0.62 + climb * 0.5, inside);

    // Exposure: eyes adapt inside the tree; night is allowed to be dark but readable.
    gl.toneMappingExposure = THREE.MathUtils.lerp(1.0 + state.night * 0.9, 1.75, inside);
    fog.density = THREE.MathUtils.lerp(state.fogDensity, INTERIOR_FOG.density, inside);
    tmp.fogCol.copy(state.fog).lerp(INTERIOR_FOG.color, inside);
    fog.color.copy(tmp.fogCol);
    if (pocket) {
      // The arena: a sealed, cool hall lit by its own fixtures.
      scene.environmentIntensity = 1.7;
      gl.toneMappingExposure = 1.5;
      fog.density = 0.012;
      fog.color.set("#0b0d11");
    }

    const sun = sunRef.current;
    if (sun) {
      const day = THREE.MathUtils.smoothstep(state.sunDir.y, -0.06, 0.03);
      const moon = THREE.MathUtils.smoothstep(state.night, 0.35, 0.8);
      tmp.lightDir.copy(day > 0.02 || moon < 0.02 ? state.sunDir : MOON_DIR);
      if (day > 0.02) {
        sun.color.copy(state.sunColor);
        sun.intensity = state.sunIntensity * day;
      } else {
        sun.color.copy(MOON_COLOR);
        sun.intensity = 0.95 * moon;
      }
      sun.intensity *= 1 - inside * 0.97;
      if (pocket) sun.intensity = 0;
      const extent = shadowExtent(p);
      if (shadows && extent !== tmp.extent) {
        tmp.extent = extent;
        const cam = sun.shadow.camera;
        cam.left = -extent;
        cam.right = extent;
        cam.top = extent;
        cam.bottom = -extent;
        cam.near = 1;
        cam.far = extent * 2 + 1600;
        cam.updateProjectionMatrix();
        sun.shadow.normalBias = extent * 0.0015;
        sun.shadow.bias = -0.0002;
      }
      // Centre the shadow frustum ahead of the camera, snapped to whole texels so it never shimmers.
      tmp.lx.crossVectors(UP, tmp.lightDir).normalize();
      tmp.ly.crossVectors(tmp.lightDir, tmp.lx).normalize();
      camera.getWorldDirection(tmp.fwd);
      tmp.focus.copy(camera.position).addScaledVector(tmp.fwd, (tmp.extent || 60) * 0.55);
      const texel = (2 * (tmp.extent || 60)) / Math.max(quality.shadowMapSize, 1);
      const fx = Math.round(tmp.focus.dot(tmp.lx) / texel) * texel;
      const fy = Math.round(tmp.focus.dot(tmp.ly) / texel) * texel;
      const fz = tmp.focus.dot(tmp.lightDir);
      tmp.snapped.copy(tmp.lx).multiplyScalar(fx).addScaledVector(tmp.ly, fy).addScaledVector(tmp.lightDir, fz);
      sun.position.copy(tmp.snapped).addScaledVector(tmp.lightDir, 900);
      sun.target.position.copy(tmp.snapped);
      sun.target.updateMatrixWorld();
      if (shadows) sun.shadow.autoUpdate = inside < 0.98;
    }

    const t = shared.uTime.value;
    // Campfire outside (it brightens as the day fades); the heart node inside.
    const fire = fireRef.current;
    if (fire && pocket) {
      // Arena: a cool key over the stage.
      fire.position.copy(ARENA_SPOTS.stage).add(tmp.lx.set(0, 9, 4));
      fire.color.set("#dfe7ff");
      fire.intensity = 260;
      fire.distance = 46;
    } else if (fire && frame.region === "library") {
      // Library: the reading lamp.
      fire.position.copy(L(-1.6, 2.1, 0.4));
      fire.color.set("#ffb46a");
      fire.intensity = 26 * (0.96 + 0.04 * Math.sin(t * 2.3));
      fire.distance = 16;
    } else if (fire) {
      if (inside < 0.5 && p < 0.33) {
        fire.position.copy(CAMPFIRE);
        fire.color.set("#ff8a3d");
        fire.intensity = (14 + 40 * Math.min(1, state.night * 2 + 0.3)) * (0.86 + 0.1 * Math.sin(t * 11.3) + 0.06 * Math.sin(t * 23.7)) * (1 - inside * 2);
        fire.distance = 30;
      } else if (inside < 0.5) {
        // At the roots, the same light warms the entrance between the lanterns.
        fire.position.copy(ENTRANCE_LIGHT);
        fire.color.set("#ffb066");
        fire.intensity = 160 * (1 - inside * 2) * (0.92 + 0.08 * Math.sin(t * 3.1));
        fire.distance = 60;
      } else {
        fire.position.copy(HALL_CENTER).add(UP).add(UP);
        fire.color.set("#9fe6d8");
        fire.intensity = 22 * (inside - 0.5) * 2 * (0.9 + 0.1 * Math.sin(t * 1.3));
        fire.distance = 34;
      }
    }
    // A warm key over the relic nearest the camera (inside only) — or, in the rings
    // chapter, the light of the ring in view, from across the hollow.
    const key = keyRef.current;
    let nearRing = -1;
    let ringDist = Infinity;
    RINGS.forEach((r, i) => {
      const d = Math.abs(r.progress - p);
      if (d < ringDist) {
        ringDist = d;
        nearRing = i;
      }
    });
    const focusEx = frame.region ? exhibitById(ui.get().focusId ?? "") : undefined;
    if (key && frame.region && focusEx) {
      // In a region, the key light picks out the exhibit in focus.
      tmp.fwd.copy(camera.position).sub(focusEx.center).setY(0).normalize();
      key.position.copy(focusEx.center).addScaledVector(tmp.fwd, 2.2 + focusEx.radius);
      key.position.y += 2.4;
      key.color.set(frame.region === "library" ? "#ffd7a1" : frame.region === "arena" ? "#ffffff" : "#fff1dc");
      key.distance = 10 + focusEx.radius * 4;
      key.intensity = (frame.region === "district" ? 30 : 46) * frame.focusNear;
    } else if (key && frame.region) {
      key.intensity = 0;
    } else if (key && ringDist < 0.035 && inside > 0.5) {
      const r = RINGS[nearRing];
      const c = cavityAt(r.localY);
      hallAxis(r.localY - 2.5, tmp.focus);
      tmp.fwd.set(Math.cos(r.theta), 0, Math.sin(r.theta));
      key.position.copy(tmp.focus).addScaledVector(tmp.fwd, -c.radius * 0.2);
      key.color.set(RING_STAGES[nearRing].color);
      key.distance = 48;
      key.intensity = 95 * (1 - THREE.MathUtils.smoothstep(ringDist, 0.01, 0.035));
    } else if (key) {
      key.color.set("#ffd29a");
      key.distance = 16;
      let nearest = FOCUS_STOPS[0];
      let best = Infinity;
      for (const stop of FOCUS_STOPS) {
        const d = Math.abs(stop.progress - p);
        if (d < best) {
          best = d;
          nearest = stop;
        }
      }
      tmp.fwd.copy(nearest.camera).sub(nearest.target).setY(0).normalize();
      key.position.copy(nearest.target).addScaledVector(tmp.fwd, 3.4);
      key.position.y += 3.2;
      key.intensity = 34 * Math.max(0, inside - 0.5) * 2 * (1 - THREE.MathUtils.smoothstep(best, 0.02, 0.05));
    }
  });

  return (
    <>
      <mesh ref={skyRef} material={sky} renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[3000, 64, 32]} />
      </mesh>
      <directionalLight
        ref={sunRef}
        castShadow={shadows}
        shadow-mapSize-width={quality.shadowMapSize || 1024}
        shadow-mapSize-height={quality.shadowMapSize || 1024}
      />
      <pointLight ref={fireRef} decay={2} />
      <pointLight ref={keyRef} decay={2} distance={16} color="#ffd29a" />
      {quality.postprocessing && !isOff("post") && <PostFX msaa={quality.msaa} />}
    </>
  );
}
