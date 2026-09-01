"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createBranchTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  const drawBranch = (x: number, y: number, angle: number, length: number, depth: number) => {
    if (depth <= 0 || length < 5) return;
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `rgba(49, 93, 57, ${0.1 + depth * 0.08})`;
    ctx.lineWidth = depth * 1.5;
    ctx.stroke();
    drawBranch(endX, endY, angle - 0.4, length * 0.7, depth - 1);
    drawBranch(endX, endY, angle + 0.4, length * 0.7, depth - 1);
    drawBranch(endX, endY, angle + 0.1, length * 0.6, depth - 1);
  };
  for (let i = 0; i < 5; i++) {
    const startX = 100 + i * 80;
    drawBranch(startX, size, -Math.PI / 2 + (Math.random() - 0.5) * 0.5, 80 + Math.random() * 40, 6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneLeadership() {
  const groupRef = useRef<THREE.Group>(null);
  const branchRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "leadership")!;
  const branchTexture = useMemo(() => createBranchTexture(), []);
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
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
    if (branchRef.current) {
      (branchRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef} scale={[3, 3, 3]}>
        <mesh ref={branchRef} position={[0, 0, -0.3]}>
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial map={branchTexture} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 3, 6]} />
          <meshStandardMaterial color="#1A2A15" roughness={0.9} flatShading />
        </mesh>
        {[{ pos: [0.8, 1, 0] as [number, number, number], rot: [0, 0, -0.5] as [number, number, number] },
          { pos: [-0.8, 0.8, 0] as [number, number, number], rot: [0, 0, 0.5] as [number, number, number] },
          { pos: [0.5, 1.8, 0] as [number, number, number], rot: [0, 0, -0.3] as [number, number, number] },
          { pos: [-0.6, 1.5, 0] as [number, number, number], rot: [0, 0, 0.4] as [number, number, number] }
        ].map((b, i) => (
          <mesh key={`branch-${i}`} position={b.pos} rotation={b.rot}>
            <cylinderGeometry args={[0.1, 0.05, 1.5, 5]} />
            <meshStandardMaterial color="#1A2A15" roughness={0.9} flatShading />
          </mesh>
        ))}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 1.5 + Math.sin(i * 1.7) * 0.5;
          return (
            <mesh key={`spore-${i}`} position={[Math.cos(angle) * radius, Math.sin(angle * 2) * 1.5 + 1, Math.sin(angle) * radius]}>
              <octahedronGeometry args={[0.08, 0]} />
              <meshBasicMaterial color="#315D39" transparent opacity={0.5} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[9, 16, 16]} />
        <meshBasicMaterial color="#315D39" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.06} />
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#315D39]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(49,93,57,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#315D39] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#0A1A0A] border border-[#315D39] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE LEADERSHIP
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
