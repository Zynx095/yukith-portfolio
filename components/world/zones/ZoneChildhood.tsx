"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createCandlelightTexture() {
  if (typeof window === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(227, 203, 138, 0.4)");
  gradient.addColorStop(0.3, "rgba(227, 203, 138, 0.15)");
  gradient.addColorStop(0.6, "rgba(185, 151, 85, 0.05)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneChildhood() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "childhood")!;
  const lightTexture = useMemo(() => createCandlelightTexture(), []);
  const { nearestZone, openPanel, isPanelOpen } = useInteractionContext();

  useFrame((state) => {
    const dist = state.camera.position.distanceTo(new THREE.Vector3(...config.worldPosition));
    const rawProgress = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, config.interactDistance, 5, 0, 1),
      0,
      1
    );
    proximityRef.current = THREE.MathUtils.damp(proximityRef.current, rawProgress, 4, state.clock.getDelta());

    if (Math.abs(proximityRef.current - renderKey / 100) > 0.05 && proximityRef.current > 0.01) {
      setRenderKey(Math.round(proximityRef.current * 100));
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    }
    if (glowRef.current && lightTexture) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.offset.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
        mat.map.offset.y = Math.cos(state.clock.elapsedTime * 0.3) * 0.02;
      }
      mat.opacity = proximityRef.current * 0.5;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef}>
        <mesh ref={glowRef}>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial map={lightTexture} transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#B99755" emissive="#8B7340" emissiveIntensity={0.5} roughness={0.6} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 1.2 + Math.sin(i * 2.3) * 0.3;
          return (
            <mesh key={`particle-${i}`} position={[Math.cos(angle) * radius, Math.sin(angle * 1.5) * 0.5, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#E3CB8A" transparent opacity={0.4} />
            </mesh>
          );
        })}
      </group>

      <AnimatePresence>
        {showPrompt && (
          <Html
            position={[config.worldPosition[0], config.worldPosition[1] + 4, config.worldPosition[2]]}
            zIndexRange={[200, 0]}
            style={{ pointerEvents: "auto", cursor: "pointer", opacity: promptOpacity, transform: "translateZ(0)" }}
            transform
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: promptOpacity, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="flex flex-col items-center gap-2"
              onClick={() => openPanel(config.id)}
            >
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#E3CB8A]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(227,203,138,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#E3CB8A] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#0A0806] border border-[#E3CB8A] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE ORIGIN
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
