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
import { REGIONS, storyToScroll } from "@/lib/world/chapters";
import { REGION_FOCUS } from "@/lib/world/regions";

/** Exhibit stops per region (for the QA scripts). */
const REGION_FOCUS_IDS = Object.fromEntries(Object.entries(REGION_FOCUS).map(([k, v]) => [k, v.map((s) => ({ id: s.focus!, t: s.t }))]));
import { fallBackToClassic } from "@/lib/view";
import { scrollPageToTop } from "@/components/view/switchView";
import { WorldContext, useWorld, type WorldContextValue } from "./scene/WorldContext";
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
import { District } from "./scene/District";
import { Family } from "./scene/Family";
import { Ecosystem } from "./scene/Ecosystem";
import { Arena } from "./scene/Arena";
import { Library } from "./scene/Library";

declare global {
  interface Window {
    __world?: {
      gl: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.Camera;
      readonly ready: boolean;
      setProgress: (p: number) => void;
      setScroll: (s: number) => void;
      setRegion: (id: string, t: number) => void;
      frame: typeof frame;
      focusIds: () => Record<string, { id: string; t: number }[]>;
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

/** A cool, dark studio for the arena: steel all round, strip lights overhead, a red accent band. */
function buildArenaEnvironment(gl: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 col = vec3(0.035, 0.04, 0.05) * (0.6 + 0.4 * smoothstep(-1.0, 1.0, d.y));
        float strips = smoothstep(0.92, 1.0, abs(sin(atan(d.z, d.x) * 6.0))) * smoothstep(0.55, 0.8, d.y);
        col += vec3(0.85, 0.9, 1.0) * strips * 2.2;
        col += vec3(0.9, 0.18, 0.25) * smoothstep(0.06, 0.0, abs(d.y - 0.12)) * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), material);
  scene.add(dome);
  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0.02, 0.1, 200, { size: 128 });
  pmrem.dispose();
  dome.geometry.dispose();
  material.dispose();
  return target;
}

/** Loads every asset, then provides them (with the generated textures) to the scene. */
function WorldLoader({ quality }: { quality: QualityTier }) {
  const gl = useThree((s) => s.gl);
  const ready = useUi((s) => s.ready);
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
        if (!alive) return;
        console.error("World assets failed to load", err);
        fallBackToClassic("error", "world assets failed to load");
        scrollPageToTop();
      });
    return () => {
      alive = false;
    };
  }, [gl]);

  const generated = useMemo(() => {
    const interior = buildInteriorEnvironment(gl);
    const arena = buildArenaEnvironment(gl);
    return { leaves: createLeafAtlas(gl), glow: createGlowTexture(), interior, arena };
  }, [gl]);
  useEffect(
    () => () => {
      generated.leaves.dispose();
      generated.glow.dispose();
      generated.interior.dispose();
      generated.arena.dispose();
    },
    [generated]
  );

  const value: WorldContextValue | null = useMemo(
    () => (assets ? { assets, leaves: generated.leaves, glow: generated.glow, interiorEnv: generated.interior.texture, arenaEnv: generated.arena.texture, quality: QUALITY[quality] } : null),
    [assets, generated, quality]
  );
  if (!value) return null;
  return (
    <WorldContext.Provider value={value}>
      <Atmosphere />
      <CameraRig />
      {/* Hidden until every program has compiled: R3F may still draw a few frames before
          then, and drawing a material whose program is still compiling blocks until it is
          done — one program after another — instead of letting them compile in parallel. */}
      <group visible={ready}>
      <Outdoors>
        {!isOff("terrain") && <Terrain />}
        {!isOff("water") && <Water />}
        {!isOff("grass") && <Grass />}
        {!isOff("forest") && <Forest />}
        {!isOff("forest") && !isOff("ecosystem") && <Ecosystem />}
        {!isOff("camp") && <Props />}
        {!isOff("camp") && <Camp />}
        {!isOff("camp") && !isOff("family") && <Family />}
        {!isOff("regions") && <District />}
      </Outdoors>
      {!isOff("regions") && <Arena />}
      <NotInPocket>
        {!isOff("signal") && <SignalNetwork />}
        {!isOff("tree") && <WorldTree />}
        {!isOff("regions") && <Library />}
      </NotInPocket>
      {!isOff("artifacts") && <ArchiveHall />}
      </group>
      <WorldReady />
    </WorldContext.Provider>
  );
}

/** The world outside the tree, skipped entirely while the camera is deep inside it. */
function Outdoors({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = !(frame.interior > 0.995 && frame.progress < 0.93) && !frame.pocket;
  });
  return <group ref={ref}>{children}</group>;
}

/** The tree and its network are skipped while the camera is in the sealed arena. */
function NotInPocket({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = !frame.pocket;
  });
  return <group ref={ref}>{children}</group>;
}

/** Signals readiness once every shader has compiled and a frame has been drawn. */
function WorldReady() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const { quality } = useWorld();
  const post = quality.postprocessing && !isOff("post");
  useEffect(() => {
    let cancelled = false;
    const done = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled) ui.set({ ready: true, loaded: 1 });
        })
      );
    ui.set({ loaded: 0.95 });
    // Compile the variants the frames will actually use. With post-processing the scene is
    // drawn into the composer's off-screen buffer, where three bakes no tone mapping and a
    // linear output into each program — compiling for the screen would compile everything
    // twice, the second time synchronously on the first frame.
    const target = post ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }) : null;
    const previous = gl.getRenderTarget();
    if (target) gl.setRenderTarget(target);
    const compiled = gl.compileAsync(scene, camera);
    gl.setRenderTarget(previous);
    target?.dispose();
    compiled.then(done, done);
    if (PERF_MODE) {
      window.__world = {
        gl,
        scene,
        camera,
        get ready() {
          return ui.get().ready;
        },
        setProgress(p: number) {
          // Story time (the original journey clock) — kept for the QA scripts.
          const s = storyToScroll(p);
          scrollToProgress(s, true);
          frame.scroll = frame.scrollTarget = s;
          frame.progress = p;
          frame.target = p;
          frame.idle = 10;
          frame.velocity = 0;
        },
        setScroll(s: number) {
          scrollToProgress(s, true);
          frame.scroll = frame.scrollTarget = s;
          frame.idle = 10;
          frame.velocity = 0;
        },
        setRegion(id: string, t: number) {
          const r = REGIONS.find((x) => x.id === id);
          if (r) this.setScroll(r.start + (r.end - r.start) * t);
        },
        setCamera(v: number[] | null) {
          debugCamera.value = v;
        },
        frame,
        focusIds: () => REGION_FOCUS_IDS,
      };
    }
    return () => {
      cancelled = true;
      if (PERF_MODE) delete window.__world;
    };
  }, [gl, scene, camera, post]);
  return null;
}

/**
 * Fatal-failure watchdog. A lost WebGL context that is not restored, or a
 * render loop that has stopped advancing while it should be running (an
 * exception inside a frame callback ends R3F's loop), sends the visitor to
 * the Classic portfolio instead of leaving a frozen or blank canvas.
 */
function Watchdog() {
  const gl = useThree((s) => s.gl);
  const last = useRef(performance.now());
  useFrame(() => {
    last.current = performance.now();
  });
  useEffect(() => {
    const canvas = gl.domElement;
    let unmounting = false;
    let restoreTimer = 0;
    const fail = (detail: string) => {
      if (unmounting) return;
      fallBackToClassic("error", detail);
      scrollPageToTop();
    };
    const onLost = (e: Event) => {
      e.preventDefault(); // allow the browser to restore it
      if (unmounting) return;
      restoreTimer = window.setTimeout(() => fail("WebGL context lost and not restored"), 3000);
    };
    const onRestored = () => window.clearTimeout(restoreTimer);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      // A long synchronous task (e.g. regenerating the tree for a lower tier) also delays
      // this timer; that is not a stalled loop.
      const blocked = now - lastTick > 2500;
      lastTick = now;
      const s = ui.get();
      const shouldRun = s.ready && s.inWorld && s.openId === null && !s.indexOpen && !s.gameOpen && document.visibilityState === "visible";
      if (!shouldRun || blocked) {
        last.current = now;
        return;
      }
      if (now - last.current > 5000) fail("render loop stopped");
    }, 1000);
    return () => {
      // R3F forces a context loss when the canvas unmounts; that one is expected.
      unmounting = true;
      window.clearTimeout(restoreTimer);
      window.clearInterval(interval);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl]);
  return null;
}

export default function WorldCanvas() {
  const inWorld = useUi((s) => s.inWorld);
  const ready = useUi((s) => s.ready);
  const [tier, setTier] = useState<QualityTier>(() => FORCED_QUALITY ?? detectInitialTier());
  const maxDpr = Math.min(QUALITY[tier].maxDpr, typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio) : 1);
  const [dpr, setDpr] = useState(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, maxDpr));
  useEffect(() => ui.set({ quality: tier }), [tier]);
  const open = useUi((s) => s.openId !== null || s.indexOpen || s.gameOpen);
  // Controlled frameloop (R3F re-applies this prop on every render). No frames until every
  // shader has compiled — a frame drawn mid-compile blocks on each program in turn and
  // defeats the driver's parallel compilation — and none while the portfolio or a dialog
  // covers the world.
  const frameloop = ready && inWorld && !open ? "always" : "never";
  // The first seconds after loading include one-off work (shadow and post programs); do not
  // let them lower the quality tier.
  const readyAt = useRef(0);
  useEffect(() => {
    if (ready) readyAt.current = performance.now();
  }, [ready]);
  const dprRef = useRef(dpr);
  dprRef.current = dpr;

  const camera = useMemo(() => ({ fov: 50, near: 0.3, far: 6000, position: [34, 20, 72] as [number, number, number] }), []);

  return (
    <div
      className="fixed inset-0 z-0 bg-ink transition-opacity duration-1000"
      style={{ touchAction: "pan-y", visibility: inWorld ? "visible" : "hidden", opacity: ready ? 1 : 0 }}
      aria-hidden="true"
    >
      <Canvas
        frameloop={frameloop}
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
            if (!readyAt.current || performance.now() - readyAt.current < 4000) return;
            // Lower resolution first, then drop a quality tier.
            if (dprRef.current > 1.01) setDpr((d) => Math.max(1, d - 0.25));
            else {
              const i = TIER_ORDER.indexOf(tier);
              if (!FORCED_QUALITY && i > 0) setTier(TIER_ORDER[i - 1]);
            }
          }}
          onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        >
          <WorldLoader quality={tier} />
          <Watchdog />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
