"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { WorldResources } from "./WorldResources";
import { EnvironmentSetup } from "./EnvironmentSetup";
import { CameraChoreographer } from "./CameraChoreographer";
import { Terrain } from "./Terrain";
import { WorldTree, FallingLeaves } from "./WorldTree";
import { Ecosystem } from "./Ecosystem";
import { Forest } from "./Forest";
import { FamilyCampfire } from "./FamilyCampfire";
import { TreeInterior } from "./TreeInterior";
import { Archive } from "@/components/artifacts/Archive";
import { WorldOverlay } from "@/components/ui/WorldOverlay";
import { LoadingVeil } from "@/components/ui/LoadingVeil";
import { QUALITY, TIER_ORDER, detectInitialTier } from "@/lib/world/quality";
import { FORCED_QUALITY, PERF_MODE, isOff } from "@/lib/world/debug";
import { frame, ui, useUi, type QualityTier } from "@/lib/world/store";
import { readScroll, scrollToProgress } from "@/lib/world/scroll";
import "@/lib/world/atmosphere";

/**
 * The World Tree experience: a fixed full-screen canvas behind the page,
 * driven by the page's scroll position, plus its DOM overlays.
 */

declare global {
  interface Window {
    __world?: {
      gl: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.Camera;
      readonly ready: boolean;
      setProgress: (p: number) => void;
    };
  }
}

/** Signals readiness once every shader has compiled and a frame has been drawn. */
function WorldReady() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let cancelled = false;
    const done = () => requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && ui.set({ ready: true })));
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
  useEffect(() => setFrameloop(inWorld ? "always" : "never"), [inWorld, setFrameloop]);
  return null;
}

function Scene({ tier }: { tier: QualityTier }) {
  const quality = QUALITY[tier];
  return (
    <WorldResources>
      <CameraChoreographer />
      <EnvironmentSetup quality={quality} />
      {!isOff("terrain") && <Terrain />}
      {!isOff("water") && <Ecosystem />}
      {!isOff("forest") && <Forest quality={quality} />}
      {!isOff("family") && <FamilyCampfire />}
      {!isOff("tree") && <WorldTree />}
      {!isOff("tree") && <FallingLeaves />}
      {!isOff("tree") && <TreeInterior />}
      {!isOff("artifacts") && <Archive />}
      <WorldReady />
      <FrameloopGate />
    </WorldResources>
  );
}

export default function PortfolioWorld() {
  const ready = useUi((s) => s.ready);
  const inWorld = useUi((s) => s.inWorld);
  const [tier, setTier] = useState<QualityTier>(() => FORCED_QUALITY ?? detectInitialTier());
  // Never render above the display's own pixel density; MSAA keeps edges clean at 1x.
  const maxDpr = Math.min(QUALITY[tier].maxDpr, typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio) : 1);
  const [dpr, setDpr] = useState(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, maxDpr));

  // Keep the store's world visibility in step with the page scroll.
  useEffect(() => {
    const update = () => ui.set({ inWorld: readScroll().inWorld });
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => ui.set({ quality: tier }), [tier]);

  const camera = useMemo(() => ({ fov: 50, near: 0.5, far: 4000, position: [19, 5.2, 24] as [number, number, number] }), []);

  return (
    <>
      <div
        className="fixed inset-0 z-0 bg-[#0d0a08]"
        style={{ touchAction: "pan-y", visibility: inWorld ? "visible" : "hidden" }}
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
            <Scene tier={tier} />
          </PerformanceMonitor>
        </Canvas>
      </div>
      {!isOff("html") && <WorldOverlay quality={tier} />}
      <LoadingVeil visible={!ready} />
    </>
  );
}
