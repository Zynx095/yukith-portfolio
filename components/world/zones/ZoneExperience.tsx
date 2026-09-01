"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createRingTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2;
  for (let r = 10; r < 250; r += 12) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(227, 203, 138, ${0.05 + Math.random() * 0.1})`;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(227, 203, 138, 0.3)";
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneExperience() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "experience")!;
  const ringTexture = useMemo(() => createRingTexture(), []);
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
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.05;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef} scale={[3, 3, 3]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.9, 5, 8]} />
          <meshStandardMaterial color="#0A0806" roughness={1.0} flatShading />
        </mesh>
        <mesh ref={ringRef} position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
          <circleGeometry args={[1.8, 32]} />
          <meshBasicMaterial map={ringTexture} transparent opacity={0.4} depthWrite={false} />
        </mesh>
        {[1.2, 1.5, 1.8].map((radius, i) => (
          <mesh key={`glow-ring-${i}`} position={[0, 0, 0.52]} rotation={[0, 0, 0]}>
            <torusGeometry args={[radius, 0.015, 8, 64]} />
            <meshBasicMaterial color="#E3CB8A" transparent opacity={0.2 - i * 0.05} depthWrite={false} />
          </mesh>
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const radius = 2.2 + Math.sin(i * 1.3) * 0.3;
          return (
            <mesh key={`particle-${i}`} position={[Math.cos(angle) * radius, Math.sin(angle * 1.5) * 1.2, Math.sin(angle) * radius]}>
              <octahedronGeometry args={[0.06, 0]} />
              <meshBasicMaterial color="#E3CB8A" transparent opacity={0.4} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial color="#B99755" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.06} />
      </mesh>

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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#B99755]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(185,151,85,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#B99755] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#1A1510] border border-[#B99755] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE EXPERIENCE
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
