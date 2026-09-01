"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { STORY_ZONES, StoryZoneConfig } from "@/src/data/storyZones";
import { useInteractionContext, notifyProximity } from "@/hooks/useInteraction";

interface ZoneProximityState {
  zoneId: string;
  proximity: number;
  activateProgress: number;
  interactProgress: number;
  config: StoryZoneConfig;
}

export let proximityStates: ZoneProximityState[] = [];

export function ZoneProximityTracker() {
  useFrame((state) => {
    if (!state.camera) return;
    const camPos = state.camera.position;

    proximityStates = STORY_ZONES.map((config) => {
      const worldPos = new THREE.Vector3(...config.worldPosition);
      const distance = camPos.distanceTo(worldPos);

      const revealProgress = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(distance, config.revealDistance, 0, 0, 1),
        0,
        1
      );
      const activateProgress = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(distance, config.activateDistance, 5, 0, 1),
        0,
        1
      );
      const interactProgress = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(distance, config.interactDistance, 5, 0, 1),
        0,
        1
      );

      return {
        zoneId: config.id,
        proximity: revealProgress,
        activateProgress,
        interactProgress,
        config,
      };
    });

    // Notify subscribers (this updates InteractionProvider's nearestZone)
    const proxData = proximityStates.map(s => ({
      zoneId: s.zoneId,
      distance: camPos.distanceTo(new THREE.Vector3(...s.config.worldPosition)),
      interactProgress: s.interactProgress,
      revealProgress: s.proximity,
      config: s.config,
    }));
    notifyProximity(proxData);
  });

  return null;
}

export function getActiveProximity(zoneId: string): {
  proximity: number;
  activateProgress: number;
  interactProgress: number;
  config: StoryZoneConfig;
} | null {
  return proximityStates.find((s) => s.zoneId === zoneId) || null;
}

export function getNearestInteractiveZone(): string | null {
  let nearest: ZoneProximityState | null = null;
  let bestScore = 0;

  for (const state of proximityStates) {
    if (!state.config.allowInteraction) continue;

    // Score based on being in the right scroll range AND close enough
    const inRange = state.interactProgress > 0.1;
    const score = state.interactProgress;

    if (inRange && score > bestScore) {
      bestScore = score;
      nearest = state;
    }
  }

  return nearest?.zoneId || null;
}

export function ZoneIndicator({ zoneId }: { zoneId: string }) {
  const { activeZone, interactionState, openPanel, isPanelOpen } = useInteractionContext();
  const state = proximityStates.find((s) => s.zoneId === zoneId);
  if (!state) return null;

  const isActive = activeZone === zoneId;
  const isAvailable = state.interactProgress > 0.15 && !isPanelOpen;
  const isCloseEnough = state.interactProgress > 0.3;

  return (
    <>
      <ZoneProximityTracker />
      {isAvailable && !isPanelOpen && (
        <Html position={[(state.config.readingOffset[0] * 0.5), state.config.worldPosition[1] + 3.5, state.config.worldPosition[2]]} zIndexRange={[50, 0]} style={{ pointerEvents: "auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: state.interactProgress, y: (1 - state.interactProgress) * 10 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => openPanel(zoneId)}
          >
            <div className="px-4 py-2 bg-[#0A0806]/90 border border-[#B99755]/40 rounded-sm backdrop-blur-md">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#E3CB8A] text-center">
                Press <span className="px-1.5 py-0.5 bg-[#1A1510] border border-[#B99755]/60 rounded text-[#F4F1EA]">SPACE</span> to explore
              </p>
            </div>
            <p className="font-serif text-[#D8C9A8] text-sm tracking-wider">{state.config.interactiveLabel}</p>
          </motion.div>
        </Html>
      )}
    </>
  );
}
