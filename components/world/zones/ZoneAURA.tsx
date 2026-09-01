"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createScanlineTexture() {
  if (typeof window === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#0A1A0A";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 4) {
    ctx.fillStyle = "rgba(0, 255, 100, 0.03)";
    ctx.fillRect(0, y, size, 2);
  }
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createTargetReticleTexture() {
  if (typeof window === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  ctx.strokeStyle = "rgba(0, 255, 100, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0, 255, 100, 0.3)";
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0, 255, 100, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 100, cy); ctx.lineTo(cx - 30, cy);
  ctx.moveTo(cx + 30, cy); ctx.lineTo(cx + 100, cy);
  ctx.moveTo(cx, cy - 100); ctx.lineTo(cx, cy - 30);
  ctx.moveTo(cx, cy + 30); ctx.lineTo(cx, cy + 100);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0, 255, 100, 0.8)";
  ctx.lineWidth = 3;
  const b = 20;
  ctx.beginPath(); ctx.moveTo(cx-80, cy-80+b); ctx.lineTo(cx-80, cy-80); ctx.lineTo(cx-80+b, cy-80); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+80-b, cy-80); ctx.lineTo(cx+80, cy-80); ctx.lineTo(cx+80, cy-80+b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-80, cy+80-b); ctx.lineTo(cx-80, cy+80); ctx.lineTo(cx-80+b, cy+80); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+80-b, cy+80); ctx.lineTo(cx+80, cy+80); ctx.lineTo(cx+80, cy-80+b); ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneAURA() {
  const groupRef = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const scanlineRef = useRef<THREE.Mesh>(null);
  const proximityRef = useRef(0);
  const [renderKey, setRenderKey] = useState(0);

  const config = STORY_ZONES.find((z) => z.id === "aura")!;
  const scanlineTexture = useMemo(() => createScanlineTexture(), []);
  const reticleTexture = useMemo(() => createTargetReticleTexture(), []);
  const { nearestZone, openPanel, isPanelOpen } = useInteractionContext();

  useFrame((state) => {
    const dist = state.camera.position.distanceTo(new THREE.Vector3(...config.worldPosition));
    const rawProgress = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, config.interactDistance, 5, 0, 1),
      0,
      1
    );
    proximityRef.current = THREE.MathUtils.damp(proximityRef.current, rawProgress, 4, state.clock.getDelta());

    const shouldRerender = Math.abs(proximityRef.current - (renderKey / 100)) > 0.05;
    if (shouldRerender && proximityRef.current > 0.01) {
      setRenderKey(Math.round(proximityRef.current * 100));
    }

    if (groupRef.current) {
      groupRef.current.position.y = config.worldPosition[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.25;
    }
    if (reticleRef.current) {
      reticleRef.current.rotation.z = state.clock.elapsedTime * 0.15;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      reticleRef.current.scale.setScalar(pulse);
    }
    if (scanlineRef.current) {
      (scanlineRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  const interactProgress = proximityRef.current;
  const isActive = nearestZone?.zoneId === config.id;
  const showPrompt = interactProgress > 0.15 && !isPanelOpen;
  const promptOpacity = Math.min(interactProgress * 2, 1);

  return (
    <group position={config.worldPosition as [number, number, number]}>
      <group ref={groupRef} scale={[2.5, 2.5, 2.5]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.8, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0D0D0D" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 0.6, 8]} />
          <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.55]}>
          <circleGeometry args={[0.25, 24]} />
          <meshBasicMaterial color="#00FF64" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.58]}>
          <torusGeometry args={[0.15, 0.02, 8, 24]} />
          <meshBasicMaterial color="#00FF64" transparent opacity={0.5} />
        </mesh>
        <group ref={reticleRef} position={[0, 0, 1.5]}>
          <mesh>
            <planeGeometry args={[3, 3]} />
            <meshBasicMaterial map={reticleTexture} transparent opacity={0.8} depthWrite={false} />
          </mesh>
        </group>
        <mesh ref={scanlineRef} position={[0, 0, 1.51]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshBasicMaterial color="#00FF64" transparent opacity={0.1} depthWrite={false} />
        </mesh>
        <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 6]} />
          <meshBasicMaterial color="#00FF64" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color="#00FF64" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.08} />
      </mesh>

      {/* Interactive prompt — always on top */}
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
              <div className="px-5 py-3 bg-[#1A0D2E]/95 border border-[#00FF64]/70 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(0,255,100,0.3)]">
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#00FF64] text-center font-bold">
                  <span className="px-2 py-0.5 bg-[#0A1A0A] border border-[#00FF64] rounded text-white text-xs">SPACE</span>{" "}
                  EXPLORE AURA
                </p>
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
