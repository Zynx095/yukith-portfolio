"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createNetworkTopologyTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#050A10";
  ctx.fillRect(0, 0, size, size);
  const rand = (() => { let s = 42; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const nodes: [number, number][] = [];
  for (let i = 0; i < 30; i++) {
    const x = rand() * size;
    const y = rand() * size;
    nodes.push([x, y]);
    ctx.beginPath();
    ctx.arc(x, y, 3 + rand() * 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 180, 255, 0.6)";
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(0, 180, 255, 0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i][0] - nodes[j][0];
      const dy = nodes[i][1] - nodes[j][1];
      if (Math.sqrt(dx * dx + dy * dy) < 150) {
        ctx.beginPath();
        ctx.moveTo(nodes[i][0], nodes[i][1]);
        ctx.lineTo(nodes[j][0], nodes[j][1]);
        ctx.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneETTH() {
  const groupRef = useRef<THREE.Group>(null);
  const topologyRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "etth")!;
  const topologyTexture = useMemo(() => createNetworkTopologyTexture(), []);
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
    if (topologyRef.current) {
      (topologyRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef} scale={[2.5, 2.5, 2.5]}>
        <mesh>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#050A10" roughness={0.4} metalness={0.8} wireframe />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.4, 0]} />
          <meshBasicMaterial color="#00B4FF" transparent opacity={0.4} />
        </mesh>
        <mesh ref={topologyRef} position={[0, 0, -0.5]}>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial map={topologyTexture} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 1.5 + Math.sin(i * 2.5) * 0.5;
          return (
            <mesh key={`stream-${i}`} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]} rotation={[0, angle, 0]}>
              <planeGeometry args={[0.02, 2.5]} />
              <meshBasicMaterial color="#00B4FF" transparent opacity={0.2} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[7, 16, 16]} />
        <meshBasicMaterial color="#00B4FF" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.06} />
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#00B4FF]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(0,180,255,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#00B4FF] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#0A1A30] border border-[#00B4FF] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE ETTH
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
