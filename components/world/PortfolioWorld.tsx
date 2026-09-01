"use client";

import { Canvas } from "@react-three/fiber";
import { ScrollControls, AdaptiveDpr } from "@react-three/drei";
import { Suspense } from "react";
import { CameraChoreographer } from "./CameraChoreographer";
import { EnvironmentSetup } from "./EnvironmentSetup";
import { WorldTree } from "./WorldTree";
import { Ecosystem } from "./Ecosystem";
import { FamilyCampfire } from "./FamilyCampfire";
import { InteractionProvider } from "@/hooks/useInteraction";
import { WorldInteractionLayer } from "./WorldInteractionLayer";
import { Terrain, Mountains, EnvironmentProps, Atmosphere, Fireflies } from "./Terrain";
import { Path, PathLights } from "./Path";
import { SocialIcons } from "./SocialIcons";
import { MusicController } from "./MusicController";
import { CinematicNarration } from "./CinematicNarration";
import { DetailPanel, useZoneExplorer } from "./DetailPanel";

function Scene({ onComplete }: { onComplete?: () => void }) {
  return (
    <>
      <CameraChoreographer onComplete={onComplete} />
      <EnvironmentSetup />
      <CinematicNarration />

      {/* World Foundation */}
      <Terrain />
      <Mountains />
      <EnvironmentProps />
      <Path />
      <PathLights />
      <Atmosphere />
      <Fireflies />

      {/* Personal Story & Ecosystem (Family Campsite, River, Waterfall, Swimming Fish) */}
      <FamilyCampfire />
      <Ecosystem />

      {/* World Tree — The Central Archive for Projects & Milestones */}
      <WorldTree />
    </>
  );
}

function UIOverlay() {
  const { activeZone, isPanelOpen, closePanel } = useZoneExplorer();

  return (
    <>
      <SocialIcons />
      <MusicController />
      {isPanelOpen && activeZone && (
        <DetailPanel zoneId={activeZone} onClose={closePanel} />
      )}
    </>
  );
}

export function PortfolioWorld({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="fixed inset-0 w-full h-full z-0 bg-[#a1c4fd]">
      <InteractionProvider>
        <Canvas
          camera={{ fov: 55, near: 0.1, far: 1200, position: [0, 3, 15] }}
          shadows
          gl={{ antialias: false, alpha: false }}
          dpr={[1, 1.5]}
        >
          <AdaptiveDpr pixelated />
          <Suspense fallback={null}>
            <ScrollControls pages={30} damping={0.25} distance={1}>
              <Scene onComplete={onComplete} />
            </ScrollControls>
          </Suspense>
        </Canvas>
        <WorldInteractionLayer />
        <UIOverlay />
      </InteractionProvider>
    </div>
  );
}
