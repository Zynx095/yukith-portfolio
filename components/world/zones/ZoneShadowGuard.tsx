"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createShieldTexture() {
  if (typeof window === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(size / 2, 20);
  ctx.quadraticCurveTo(size - 20, 20, size - 20, 60);
  ctx.lineTo(size - 20, 130);
  ctx.quadraticCurveTo(size / 2, size - 10, size / 2, size - 10);
  ctx.quadraticCurveTo(20, size - 10, 20, 130);
  ctx.lineTo(20, 60);
  ctx.quadraticCurveTo(20, 20, size / 2, 20);
  ctx.closePath();
  ctx.strokeStyle = "rgba(165, 180, 252, 0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size / 2, 40);
  ctx.quadraticCurveTo(size - 35, 40, size - 35, 70);
  ctx.lineTo(size - 35, 120);
  ctx.quadraticCurveTo(size / 2, size - 30, size / 2, size - 30);
  ctx.quadraticCurveTo(35, size - 30, 35, 120);
  ctx.lineTo(35, 70);
  ctx.quadraticCurveTo(35, 40, size / 2, 40);
  ctx.closePath();
  ctx.strokeStyle = "rgba(165, 180, 252, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 20, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(165, 180, 252, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneShadowGuard() {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "shadowguard")!;
  const shieldTexture = useMemo(() => createShieldTexture(), []);
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
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
    if (shieldRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
      shieldRef.current.scale.setScalar(pulse);
      (shieldRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef} scale={[2.5, 2.5, 2.5]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 1.2, 0.3]} />
          <meshStandardMaterial color="#0A0A15" roughness={0.6} metalness={0.5} />
        </mesh>
        <group>
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 1.2 + Math.sin(i * 1.7) * 0.3;
            return (
              <mesh key={`doc-${i}`} position={[Math.cos(angle) * radius, Math.sin(i * 1.3) * 0.5, Math.sin(angle) * radius]} rotation={[Math.sin(angle) * 0.3, angle, Math.cos(angle) * 0.2]}>
                <planeGeometry args={[0.6, 0.8]} />
                <meshBasicMaterial color="#A5B4FC" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            );
          })}
        </group>
        <mesh ref={shieldRef} position={[0, 0, 0.2]}>
          <planeGeometry args={[3.5, 4]} />
          <meshBasicMaterial map={shieldTexture} transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {[1.5, 1.8, 2.1].map((radius, i) => (
          <mesh key={`hex-${i}`} rotation={[Math.PI / 6, 0, 0]}>
            <octahedronGeometry args={[radius, 0]} />
            <meshBasicMaterial color="#A5B4FC" transparent opacity={0.08 - i * 0.02} wireframe depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[7, 16, 16]} />
        <meshBasicMaterial color="#A5B4FC" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.06} />
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#A5B4FC]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(165,180,252,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#A5B4FC] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#1A1A30] border border-[#A5B4FC] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE SHADOWGUARD
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
