"use client";

import { Canvas } from "@react-three/fiber";
import { ScrollControls, AdaptiveDpr } from "@react-three/drei";
import { Suspense } from "react";
import { CameraChoreographer } from "./CameraChoreographer";
import { EnvironmentSetup } from "./EnvironmentSetup";
import { WorldTree } from "./WorldTree";
import { DistantTreeSilhouette } from "./DistantTreeSilhouette";
import { WorldHUD } from "./WorldHUD";
import { InteractionProvider } from "@/hooks/useInteraction";
import { WorldInteractionLayer } from "./WorldInteractionLayer";
import { ZoneProximityTracker } from "./InteractionSystem";
import { Terrain, Mountains, EnvironmentProps, Atmosphere, Fireflies } from "./Terrain";
import { Path, PathLights } from "./Path";
import { SocialIcons } from "./SocialIcons";
import { MusicController } from "./MusicController";
import { 
  ZoneChildhood, 
  ZoneFirstTech, 
  ZoneUniversity,
  ZoneAURA,
  ZoneETTH,
  ZoneShadowGuard,
  ZoneSugarAI,
  ZoneAchievement,
  ZoneLeadership,
  ZoneExperience
} from "./Zones";

function Scene({ onComplete }: { onComplete?: () => void }) {
  return (
    <>
      <CameraChoreographer onComplete={onComplete} />
      <EnvironmentSetup />

      {/* World foundation */}
      <Terrain />
      <Mountains />
      <EnvironmentProps />
      <Path />
      <PathLights />
      <Atmosphere />
      <Fireflies />

      {/* Background elements */}
      <DistantTreeSilhouette />

      {/* Zone proximity tracker */}
      <ZoneProximityTracker />

      {/* HUD Layer */}
      <WorldHUD />

      {/* Story Zones - positioned in the world */}
      <ZoneChildhood />
      <ZoneFirstTech />
      <ZoneUniversity />
      
      {/* Project Zones */}
      <ZoneAURA />
      <ZoneETTH />
      <ZoneShadowGuard />
      <ZoneSugarAI />
      
      {/* Narrative Branches & Monuments */}
      <ZoneAchievement />
      <ZoneLeadership />
      <ZoneExperience />

      {/* World Tree — the final destination */}
      <WorldTree />
    </>
  );
}

export function PortfolioWorld({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="fixed inset-0 w-full h-full z-0 bg-[#0E0718]">
      <InteractionProvider>
        <Canvas
          camera={{ fov: 55, near: 0.1, far: 1200, position: [0, 3, 15] }}
          shadows
          gl={{ antialias: false, alpha: false }}
          dpr={[1, 1.5]}
        >
          <AdaptiveDpr pixelated />
          <Suspense fallback={null}>
            <ScrollControls pages={40} damping={0.05} distance={1}>
              <Scene onComplete={onComplete} />
            </ScrollControls>
          </Suspense>
        </Canvas>
        <WorldInteractionLayer />
        <SocialIcons />
        <MusicController />
      </InteractionProvider>
    </div>
  );
}
