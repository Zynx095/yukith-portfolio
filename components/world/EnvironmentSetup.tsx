"use client";

import { memo } from "react";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";

export const EnvironmentSetup = memo(function EnvironmentSetup() {
  return (
    <>
      {/* Vibrant dark fantasy sky — deep blue-green */}
      <color attach="background" args={["#0A1A15"]} />

      {/* Atmospheric fog — forest mist */}
      <fog attach="fog" args={["#0A1A15", 30, 250]} />

      {/* Warm ambient light — sunlight through canopy */}
      <ambientLight color="#2A4A35" intensity={0.5} />

      {/* Directional sunlight — warm golden */}
      <directionalLight
        color="#D4C4A0"
        position={[30, 60, 20]}
        intensity={0.4}
        castShadow
      />

      {/* Hemisphere light — sky to ground gradient */}
      <hemisphereLight
        color="#4A7A5A"
        groundColor="#1A2A15"
        intensity={0.3}
      />

      {/* Subtle warm fill from below — firelight/ember glow */}
      <pointLight color="#8B6A4A" intensity={0.15} distance={80} position={[0, 5, -100]} />

      <EffectComposer>
        {/* Subtle bloom for atmosphere */}
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.3} />
        <Noise opacity={0.008} />
        <Vignette eskil={false} offset={0.3} darkness={0.8} />
      </EffectComposer>
    </>
  );
});
