"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { STORY_ZONES } from "@/src/data/storyZones";
import { useInteractionContext } from "@/hooks/useInteraction";

interface ZoneProps {
  zoneId: string;
  children: React.ReactNode;
  proximityThreshold?: number;
}

export function useZoneProximity(zoneId: string, proximityThreshold: number = 75) {
  const [proximity, setProximity] = useState(0);
  const [activateProgress, setActivateProgress] = useState(0);
  const [interactProgress, setInteractProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const targetPos = useMemo(() => {
    const zone = STORY_ZONES.find((z) => z.id === zoneId);
    return zone ? new THREE.Vector3(...zone.worldPosition) : new THREE.Vector3();
  }, [zoneId]);

  useFrame((state) => {
    const dist = state.camera.position.distanceTo(targetPos);
    const config = STORY_ZONES.find((z) => z.id === zoneId);
    if (!config) return;

    const rawProximity = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, config.revealDistance, 5, 0, 1),
      0,
      1
    );
    const rawActivate = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, config.activateDistance, 5, 0, 1),
      0,
      1
    );
    const rawInteract = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, config.interactDistance, 5, 0, 1),
      0,
      1
    );

    setProximity((prev) => THREE.MathUtils.lerp(prev, rawProximity, 0.08));
    setActivateProgress((prev) => THREE.MathUtils.lerp(prev, rawActivate, 0.08));
    setInteractProgress((prev) => THREE.MathUtils.lerp(prev, rawInteract, 0.08));
    setIsVisible(rawProximity > 0.1);
  });

  return { proximity, activateProgress, interactProgress, isVisible };
}

export function ZoneContainer({ zoneId, children, proximityThreshold = 75 }: ZoneProps) {
  const { proximity, activateProgress, interactProgress, isVisible } = useZoneProximity(zoneId, proximityThreshold);
  const { activeZone, isPanelOpen } = useInteractionContext();
  const config = STORY_ZONES.find((z) => z.id === zoneId);
  if (!config) return null;

  const isActive = activeZone === zoneId;
  const showHint = interactProgress > 0.2 && !isPanelOpen && !isActive;

  return (
    <group position={config.worldPosition as [number, number, number]}>
      {children}
      <AnimatePresence>
        {showHint && (
          <Html
            position={[(config.panelSide === "right" ? 3.5 : -3.5), 3.5, 0]}
            zIndexRange={[50, 0]}
            style={{ pointerEvents: "auto", cursor: "pointer" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: interactProgress, y: (1 - interactProgress) * 15, filter: `blur(${(1 - interactProgress) * 4}px)` }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="flex flex-col items-center gap-2"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("explore-zone", { detail: zoneId }));
              }}
            >
              <div className="px-5 py-3 bg-[#0A0806]/95 border border-[#B99755]/50 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(185,151,85,0.15)]">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#E3CB8A] text-center">
                  Press <span className="px-2 py-1 bg-[#1A1510] border border-[#B99755]/70 rounded text-[#F4F1EA] font-bold">SPACE</span> to explore
                </p>
              </div>
              <p className="font-serif text-[#D8C9A8]/80 text-sm tracking-widest uppercase">{config.title}</p>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
