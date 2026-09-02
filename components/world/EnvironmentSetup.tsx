"use client";

import { memo } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Environment } from "@react-three/drei";

export const EnvironmentSetup = memo(function EnvironmentSetup() {
  return (
    <>
            <color attach="background" args={["#4a6a8a"]} />

            <fog attach="fog" args={["#4a6a8a", 80, 600]} />

            <ambientLight color="#8ab4d4" intensity={0.35} />

            <directionalLight
        color="#ffeedd"
        position={[80, 120, -40]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-camera-near={1}
      />

            <hemisphereLight
        color="#8ab4d4"
        groundColor="#3a5a3a"
        intensity={0.5}
      />

            <Environment preset="forest" />

            <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          intensity={0.4}
        />
        <Vignette eskil={false} offset={0.4} darkness={0.5} />
      </EffectComposer>
    </>
  );
});
