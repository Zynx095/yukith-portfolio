"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createAchievementTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  const rand = (() => { let s = 555; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  for (let i = 0; i < 60; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(227, 203, 138, ${0.3 + rand() * 0.7})`;
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(227, 203, 138, 0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const x1 = rand() * size, y1 = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (rand() - 0.5) * 150, y1 + (rand() - 0.5) * 150);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneAchievement() {
  const groupRef = useRef<THREE.Group>(null);
  const constellationRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "achievements")!;
  const achievementTexture = useMemo(() => createAchievementTexture(), []);
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
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.25) * 0.3;
    }
    if (constellationRef.current) {
      constellationRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef} scale={[3, 3, 3]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.8, 1.2, 5, 6]} />
          <meshStandardMaterial color="#0A0806" roughness={1.0} flatShading />
        </mesh>
        <mesh ref={constellationRef} position={[0, 0, -0.5]}>
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial map={achievementTexture} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2;
          const radius = 2.5 + Math.sin(i * 2.1) * 0.5;
          return (
            <mesh key={`star-${i}`} position={[Math.cos(angle) * radius, Math.sin(angle * 1.5) * 1.2, Math.sin(angle) * radius]}>
              <octahedronGeometry args={[0.15, 0]} />
              <meshBasicMaterial color="#E3CB8A" transparent opacity={0.7} />
            </mesh>
          );
        })}
        {[1.5, 2.0, 2.5].map((radius, i) => (
          <mesh key={`ring-${i}`} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, 0.01, 8, 64]} />
            <meshBasicMaterial color="#E3CB8A" transparent opacity={0.15 - i * 0.04} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial color="#E3CB8A" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.06} />
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#E3CB8A]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(227,203,138,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#E3CB8A] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#1A1510] border border-[#E3CB8A] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE MILESTONES
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
