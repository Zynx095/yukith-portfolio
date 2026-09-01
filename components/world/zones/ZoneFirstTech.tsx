"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createCRTTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#0A1A0A";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = "rgba(51, 255, 87, 0.04)";
    ctx.fillRect(0, y, size, 1);
  }
  const rand = (() => { let s = 123; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  for (let i = 0; i < 12; i++) {
    const x = 30 + rand() * 50;
    const y = 40 + i * 35;
    const lineLen = 50 + rand() * 40;
    ctx.fillStyle = `rgba(51, 255, 87, ${0.3 + rand() * 0.4})`;
    ctx.fillRect(x, y, lineLen * 6, 3);
  }
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneFirstTech() {
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "firsttech")!;
  const crtTexture = useMemo(() => createCRTTexture(), []);
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
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
    if (screenRef.current && crtTexture) {
      const flicker = 0.85 + Math.random() * 0.15;
      (screenRef.current.material as THREE.MeshBasicMaterial).opacity = flicker;
      crtTexture.offset.x = state.clock.elapsedTime * 0.01;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = proximityRef.current * 0.3;
    }
  });

  const interactProgress = proximityRef.current;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef}>
        <mesh position={[0, 0, -0.3]}>
          <boxGeometry args={[2, 1.6, 0.8]} />
          <meshStandardMaterial color="#0A0A0A" roughness={0.9} />
        </mesh>
        <mesh ref={screenRef} position={[0, 0, 0.1]}>
          <planeGeometry args={[1.8, 1.3]} />
          <meshBasicMaterial map={crtTexture} transparent opacity={0.8} />
        </mesh>
        <mesh ref={glowRef} position={[0, 0, 0.15]}>
          <planeGeometry args={[2.5, 2]} />
          <meshBasicMaterial color="#33FF57" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, -1, 0.5]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[2.2, 0.05, 0.8]} />
          <meshStandardMaterial color="#0A0A0A" roughness={0.95} />
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#33FF57]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(51,255,87,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#33FF57] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#0A1A0A] border border-[#33FF57] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE SPARK
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
