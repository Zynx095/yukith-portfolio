"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import "@/lib/world/atmosphere";
import { loadWorldAssets, uploadTextures, type WorldAssets } from "@/lib/world/assets";
import { createGlowTexture, createLeafAtlas } from "@/lib/world/procedural";
import { QUALITY, TIER_ORDER, detectInitialTier } from "@/lib/world/quality";
import { FORCED_QUALITY, PERF_MODE, debugCamera, isOff } from "@/lib/world/debug";
import { frame, ui, useUi, type QualityTier } from "@/lib/world/store";
import { scrollToProgress } from "@/lib/world/scroll";
import { WorldContext, type WorldContextValue } from "./scene/WorldContext";
import { Atmosphere } from "./scene/Atmosphere";
import { CameraRig } from "./scene/CameraRig";
import { Terrain } from "./scene/Terrain";
import { WorldTree } from "./scene/WorldTree";
import { ArchiveHall } from "./scene/ArchiveHall";
import { Water } from "./scene/Water";
import { Grass } from "./scene/Grass";
import { Forest } from "./scene/Forest";
import { SignalNetwork } from "./scene/SignalNetwork";
import { Props } from "./scene/Props";
import { Camp } from "./scene/Camp";

declare global {
  interface Window {
    __world?: {
      gl: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.Camera;
      readonly ready: boolean;
      setProgress: (p: number) => void;
      setCamera: (v: number[] | null) => void;
    };
  }
}

/** A warm, dim cavity for image-based light inside the tree: dark wood all round, light from the crown far above. */
function buildInteriorEnvironment(gl: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 wood = vec3(0.11, 0.063, 0.033);
        vec3 col = wood * (0.55 + 0.45 * smoothstep(-1.0, 1.0, d.y));
        col += vec3(1.0, 0.84, 0.6) * smoothstep(0.88, 0.995, d.y) * 1.6;
        col += vec3(0.32, 0.6, 0.55) * smoothstep(-0.2, -0.9, d.y) * 0.18;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), material);
  scene.add(dome);
  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0.04, 0.1, 200, { size: 128 });
  pmrem.dispose();
  dome.geometry.dispose();
  material.dispose();
  return target;
}

/** Loads every asset, then provides them (with the generated textures) to the scene. */
function WorldLoader({ quality }: { quality: QualityTier }) {
  const gl = useThree((s) => s.gl);
  const [assets, setAssets] = useState<WorldAssets | null>(null);

  useEffect(() => {
    let alive = true;
    loadWorldAssets(gl, (loaded, total) => ui.set({ loaded: Math.min(0.92, (loaded / Math.max(total, 1)) * 0.92) }))
      .then((a) => {
        if (!alive) return;
        uploadTextures(gl, a);
        setAssets(a);
      })
      .catch((err) => {
        console.error("World assets failed to load", err);
        ui.set({ noWebgl: true, inWorld: false });
      });
    return () => {
      alive = false;
    };
  }, [gl]);

  const generated = useMemo(() => {
    const interior = buildInteriorEnvironment(gl);
    return { leaves: createLeafAtlas(gl), glow: createGlowTexture(), interior };
  }, [gl]);
  useEffect(
    () => () => {
      generated.leaves.dispose();
      generated.glow.dispose();
      generated.interior.dispose();
    },
    [generated]
  );

  const value: WorldContextValue | null = useMemo(
    () => (assets ? { assets, leaves: generated.leaves, glow: generated.glow, interiorEnv: generated.interior.texture, quality: QUALITY[quality] } : null),
    [assets, generated, quality]
  );
  if (!value) return null;
  return (
    <WorldContext.Provider value={value}>
      <Atmosphere />
      <CameraRig />
      <Outdoors>
        {!isOff("terrain") && <Terrain />}
        {!isOff("water") && <Water />}
        {!isOff("grass") && <Grass />}
        {!isOff("forest") && <Forest />}
        {!isOff("camp") && <Props />}
        {!isOff("camp") && <Camp />}
      </Outdoors>
      {!isOff("signal") && <SignalNetwork />}
      {!isOff("tree") && <WorldTree />}
      {!isOff("artifacts") && <ArchiveHall />}
      <WorldReady />
    </WorldContext.Provider>
  );
}

/** The world outside the tree, skipped entirely while the camera is deep inside it. */
function Outdoors({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = !(frame.interior > 0.995 && frame.progress < 0.93);
  });
  return <group ref={ref}>{children}</group>;
}

/** Signals readiness once every shader has compiled and a frame has been drawn. */
function WorldReady() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let cancelled = false;
    const done = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled) ui.set({ ready: true, loaded: 1 });
        })
      );
    ui.set({ loaded: 0.95 });
    gl.compileAsync(scene, camera).then(done, done);
    if (PERF_MODE) {
      window.__world = {
        gl,
        scene,
        camera,
        get ready() {
          return ui.get().ready;
        },
        setProgress(p: number) {
          scrollToProgress(p, true);
          frame.progress = p;
          frame.target = p;
          frame.idle = 10;
          frame.velocity = 0;
        },
        setCamera(v: number[] | null) {
          debugCamera.value = v;
        },
      };
    }
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);
  return null;
}

/** Stops rendering entirely while the portfolio covers the world. */
function FrameloopGate() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const inWorld = useUi((s) => s.inWorld);
  const open = useUi((s) => s.openId !== null || s.indexOpen);
  useEffect(() => setFrameloop(inWorld && !open ? "always" : "never"), [inWorld, open, setFrameloop]);
  return null;
}

export default function WorldCanvas() {
  const inWorld = useUi((s) => s.inWorld);
  const ready = useUi((s) => s.ready);
  const [tier, setTier] = useState<QualityTier>(() => FORCED_QUALITY ?? detectInitialTier());
  const maxDpr = Math.min(QUALITY[tier].maxDpr, typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio) : 1);
  const [dpr, setDpr] = useState(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, maxDpr));
  useEffect(() => ui.set({ quality: tier }), [tier]);

  const camera = useMemo(() => ({ fov: 50, near: 0.3, far: 6000, position: [34, 20, 72] as [number, number, number] }), []);

  return (
    <div
      className="fixed inset-0 z-0 bg-ink transition-opacity duration-1000"
      style={{ touchAction: "pan-y", visibility: inWorld ? "visible" : "hidden", opacity: ready ? 1 : 0 }}
      aria-hidden="true"
    >
      <Canvas
        dpr={dpr}
        camera={camera}
        shadows={QUALITY[tier].shadowMapSize > 0 ? "percentage" : false}
        gl={{ antialias: true, powerPreference: "high-performance", stencil: false, alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <PerformanceMonitor
          bounds={(refresh) => (refresh > 90 ? [50, 90] : [45, 58])}
          flipflops={3}
          onDecline={() => {
            // Lower resolution first, then drop a quality tier.
            setDpr((d) => {
              if (d > 1.01) return Math.max(1, d - 0.25);
              const i = TIER_ORDER.indexOf(tier);
              if (!FORCED_QUALITY && i > 0) setTier(TIER_ORDER[i - 1]);
              return d;
            });
          }}
          onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        >
          <WorldLoader quality={tier} />
          <FrameloopGate />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
