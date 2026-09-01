"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createNetworkDiagramTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#0A0F0D";
  ctx.fillRect(0, 0, size, size);
  const rand = (() => { let s = 321; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const nodes: [number, number][] = [];
  for (let i = 0; i < 20; i++) {
    const x = 50 + rand() * (size - 100);
    const y = 50 + rand() * (size - 100);
    nodes.push([x, y]);
    ctx.beginPath();
    ctx.arc(x, y, 4 + rand() * 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(29, 74, 43, 0.7)";
    ctx.fill();
    ctx.strokeStyle = "rgba(185, 151, 85, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(29, 74, 43, 0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i][0] - nodes[j][0];
      const dy = nodes[i][1] - nodes[j][1];
      if (Math.sqrt(dx * dx + dy * dy) < 120) {
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

export function ZoneUniversity() {
  const groupRef = useRef<THREE.Group>(null);
  const diagramRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "university")!;
  const diagramTexture = useMemo(() => createNetworkDiagramTexture(), []);
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
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.15;
    }
    if (diagramRef.current && diagramTexture) {
      (diagramRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = proximityRef.current * 0.25;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef}>
        <mesh ref={diagramRef} position={[0, 0, -0.3]}>
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial map={diagramTexture} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.4, 0.6, 3, 6]} />
          <meshStandardMaterial color="#0A0F0D" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.03, 8, 64]} />
          <meshStandardMaterial color="#B99755" emissive="#B99755" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.02, 8, 64]} />
          <meshStandardMaterial color="#1D4A2B" emissive="#1D4A2B" emissiveIntensity={0.5} />
        </mesh>
        <mesh ref={glowRef} position={[0, 0, 0]}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial color="#1D4A2B" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0} />
        </mesh>
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#1D4A2B]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(29,74,43,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#E3CB8A] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#0A0F0D] border border-[#E3CB8A]/70 rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE EDUCATION
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
