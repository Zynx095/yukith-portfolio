"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createWaveformTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#050A10";
  ctx.fillRect(0, 0, size, canvas.height);
  ctx.strokeStyle = "rgba(165, 140, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < size; x++) {
    const t = x / size;
    const y = 64 + Math.sin(t * 20) * 20 * Math.exp(-Math.pow(t - 0.5, 2) * 8)
      + Math.sin(t * 35 + 1) * 10 * Math.exp(-Math.pow(t - 0.5, 2) * 6)
      + Math.sin(t * 50 + 2) * 5;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(165, 140, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < size; x++) {
    const t = x / size;
    const y = 64 + Math.sin(t * 15 + 3) * 15 * Math.exp(-Math.pow(t - 0.5, 2) * 10)
      + Math.sin(t * 28 + 1) * 8;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  return texture;
}

export function ZoneSugarAI() {
  const groupRef = useRef<THREE.Group>(null);
  const waveformRef = useRef<THREE.Mesh>(null);
  const micRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "sugai")!;
  const waveformTexture = useMemo(() => createWaveformTexture(), []);
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
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.35) * 0.2;
    }
    if (waveformRef.current) {
      const mat = waveformRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) mat.map.offset.y = (state.clock.elapsedTime * 0.02) % 1;
      mat.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
    if (micRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
      micRef.current.scale.setScalar(pulse);
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef} scale={[2.5, 2.5, 2.5]}>
        <mesh ref={micRef} position={[0, 0, 0]}>
          <planeGeometry args={[3, 3.5]} />
          <meshBasicMaterial color="#93C5FD" transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={waveformRef} position={[0, -2.2, 0.1]}>
          <planeGeometry args={[4, 1]} />
          <meshBasicMaterial map={waveformTexture} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.5, 0.5]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial color="#A58CFF" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0.5]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#A58CFF" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.15} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 1.5 + Math.sin(i * 2.3) * 0.4;
          return (
            <mesh key={`particle-${i}`} position={[Math.cos(angle) * radius, Math.sin(angle * 2) * 0.8, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#A58CFF" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[7, 16, 16]} />
        <meshBasicMaterial color="#A58CFF" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.06} />
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#93C5FD]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(147,197,253,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#93C5FD] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#0A1A30] border border-[#93C5FD] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE SUGAR AI
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
