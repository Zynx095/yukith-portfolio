"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STORY_ZONES, StoryZoneConfig } from "@/src/data/storyZones";

interface ZoneProximity {
  zoneId: string;
  proximity: number;
  revealProgress: number;
  activateProgress: number;
  interactProgress: number;
  hideProgress: number;
  config: StoryZoneConfig;
  cameraOffset: number;
}

export function useZoneProximity() {
  const zonesRef = useRef<ZoneProximity[]>([]);

  useFrame((state) => {
    if (!state.camera) return;

    const cameraPos = state.camera.position;
    const scrollOffset = 0; // We'll compute from camera position relative to world

    zonesRef.current = STORY_ZONES.map((config) => {
      const worldPos = new THREE.Vector3(...config.worldPosition);
      const distance = cameraPos.distanceTo(worldPos);

      // Compute how far the camera is through the zone's timeline
      const zoneSpan = config.cameraEnd - config.cameraStart;
      const zoneCenter = (config.cameraStart + config.cameraEnd) / 2;

      // Map camera Z position to a rough scroll offset
      const camZ = cameraPos.z;
      const worldZStart = 10;
      const worldZEnd = -460;
      const globalOffset = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camZ, worldZStart, worldZEnd, 0, 1),
        0,
        1
      );

      // Zone-specific progress (0 = just arrived, 1 = just left)
      const zoneProgress = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(globalOffset, config.cameraStart, config.cameraEnd, 1, -1),
        -1,
        1
      );

      // Different proximity tiers
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

      const hideProgress = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(distance, config.hideDistance, -5, 1, 0),
        0,
        1
      );

      return {
        zoneId: config.id,
        proximity: revealProgress,
        revealProgress,
        activateProgress,
        interactProgress,
        hideProgress,
        config,
        cameraOffset: globalOffset,
      };
    });
  });

  return zonesRef;
}

export function getNearestInteractiveZone(zonesRef: React.MutableRefObject<ZoneProximity[]>, minInteractDistance: number = 18): string | null {
  const zones = zonesRef.current;
  let nearest: ZoneProximity | null = null;
  let nearestDist = Infinity;

  for (const zone of zones) {
    if (!zone.config.allowInteraction) continue;
    if (zone.interactProgress < 0.1) continue;
    if (zone.cameraOffset < zone.config.cameraStart - 0.02 || zone.cameraOffset > zone.config.cameraEnd + 0.02) continue;

    const dist = new THREE.Vector3(...zone.config.worldPosition).distanceTo(
      new THREE.Vector3(zonesRef.current[0]?.config.worldPosition[0] || 0, 0, 0)
    );

    if (zone.interactProgress > nearestDist * 0.1) continue;

    nearestDist = 1 / (zone.interactProgress + 0.001);
    nearest = zone;
  }

  return nearest?.zoneId || null;
}
