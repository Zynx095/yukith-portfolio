"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";

interface CameraMode {
  start: number;
  end: number;
  lookAhead: number;
  damping: number;
  banking: number;
  fov: number;
  sway: number;
}

const CAMERA_MODES: CameraMode[] = [
  // 1. Opening - welcome
  { start: 0.0, end: 0.08, lookAhead: 0.03, damping: 1.5, banking: 0.03, fov: 55, sway: 0.08 },
  // 2. World introduction
  { start: 0.08, end: 0.18, lookAhead: 0.03, damping: 1.5, banking: 0.03, fov: 55, sway: 0.08 },
  // 3. Family scene - SLOW DOWN
  { start: 0.18, end: 0.32, lookAhead: 0.02, damping: 2.0, banking: 0.02, fov: 50, sway: 0.05 },
  // 4. Family support message - STILL SLOW
  { start: 0.32, end: 0.42, lookAhead: 0.02, damping: 2.0, banking: 0.02, fov: 50, sway: 0.05 },
  // 5. College life
  { start: 0.42, end: 0.55, lookAhead: 0.04, damping: 1.6, banking: 0.04, fov: 58, sway: 0.10 },
  // 6. Achievements
  { start: 0.55, end: 0.68, lookAhead: 0.04, damping: 1.6, banking: 0.05, fov: 60, sway: 0.12 },
  // 7. Transition to tree
  { start: 0.68, end: 0.78, lookAhead: 0.03, damping: 1.4, banking: 0.03, fov: 52, sway: 0.05 },
  // 8. Approach tree
  { start: 0.78, end: 0.84, lookAhead: 0.03, damping: 1.8, banking: 0.02, fov: 50, sway: 0.03 },
  // 9. Enter tree
  { start: 0.84, end: 0.88, lookAhead: 0.04, damping: 2.0, banking: 0.01, fov: 48, sway: 0.02 },
  // 10. Ascend inside tree - SLOW
  { start: 0.88, end: 0.92, lookAhead: 0.03, damping: 3.0, banking: 0.008, fov: 42, sway: 0.008 },
  // 11. Archive cards - VERY SLOW for reading
  { start: 0.92, end: 0.985, lookAhead: 0.02, damping: 3.5, banking: 0.005, fov: 40, sway: 0.005 },
  // 12. Portfolio transition
  { start: 0.995, end: 1.0, lookAhead: 0.05, damping: 3.0, banking: 0.0, fov: 40, sway: 0.0 },
];

function getModeAt(offset: number): CameraMode {
  for (const mode of CAMERA_MODES) {
    if (offset >= mode.start && offset < mode.end) return mode;
  }
  return CAMERA_MODES[CAMERA_MODES.length - 1];
}

export function CameraChoreographer({ onComplete }: { onComplete?: () => void }) {
  const scroll = useScroll();
  const hasCompleted = useRef(false);

  // Cinematic camera path
  const curve = useMemo(() => {
    const points = [
      // Start - welcome
      new THREE.Vector3(0, 3, 12),
      new THREE.Vector3(2, 2.5, 0),
      // Moving towards family area
      new THREE.Vector3(5, 2.0, -25),
      new THREE.Vector3(8, 2.0, -40),
      // Family campsite near waterfall (z ≈ -65)
      new THREE.Vector3(5, 2.5, -55),
      new THREE.Vector3(7, 2.0, -65),
      // Past family, towards waterfall
      new THREE.Vector3(5, 3.0, -75),
      new THREE.Vector3(0, 4.0, -85),
      // Waterfall area
      new THREE.Vector3(-2, 5.0, -100),
      // River and fish
      new THREE.Vector3(3, 3.0, -150),
      new THREE.Vector3(0, 2.5, -180),
      // Open valley
      new THREE.Vector3(-5, 3.0, -220),
      new THREE.Vector3(2, 3.5, -260),
      // Distant tree view
      new THREE.Vector3(0, 8.0, -320),
      new THREE.Vector3(0, 10.0, -360),
      // Approach tree
      new THREE.Vector3(0, 8.0, -400),
      new THREE.Vector3(0, 6.0, -430),
      // Enter root cavity
      new THREE.Vector3(0, 4.0, -447),
      // Inside tree - ascending
      new THREE.Vector3(0, 15.0, -447),
      new THREE.Vector3(0, 30.0, -447),
      new THREE.Vector3(0, 50.0, -447),
      new THREE.Vector3(0, 70.0, -447),
      new THREE.Vector3(0, 90.0, -447),
      new THREE.Vector3(0, 110.0, -447),
      new THREE.Vector3(0, 130.0, -447),
      new THREE.Vector3(0, 150.0, -447),
      new THREE.Vector3(0, 170.0, -447),
      new THREE.Vector3(0, 190.0, -447),
      new THREE.Vector3(0, 210.0, -447),
      new THREE.Vector3(0, 230.0, -447),
      // Emerge to top
      new THREE.Vector3(0, 250.0, -447),
    ];
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  }, []);

  const focusData = useMemo(() => {
    // Artifacts are at world Y: 90, 115, 140, 165, 190, 215, 240
    const targets = [
      { y: 90, x: -5 },
      { y: 115, x: 5 },
      { y: 140, x: -5 },
      { y: 165, x: 5 },
      { y: 190, x: -4 },
      { y: 215, x: 4 },
      { y: 240, x: 0 },
    ];
    
    // We want the camera to be slightly below the artifact (targetY - 2)
    return targets.map(t => {
      let bestOffset = 0;
      let minDiff = Infinity;
      // Search the last 20% of the curve where the tree ascent happens
      for (let i = 0.8; i <= 1.0; i += 0.001) {
        const pt = curve.getPointAt(i);
        const diff = Math.abs(pt.y - (t.y - 2));
        if (diff < minDiff) {
          minDiff = diff;
          bestOffset = i;
        }
      }
      return { offset: bestOffset, x: t.x };
    });
  }, [curve]);

  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const currentFOV = useRef(55);
  const currentBanking = useRef(0);
  const currentMode = useRef<CameraMode>(CAMERA_MODES[0]);

  // Magnet state
  const effectiveProgress = useRef(0);
  const effectiveXOffset = useRef(0);
  const lastScrollOffset = useRef(0);
  const timeSinceLastScroll = useRef(0);
  const currentFocusIndex = useRef<number | null>(null);

  const [reducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    currentPosition.current.copy(new THREE.Vector3(0, 3, 12));
    currentLookAt.current.copy(new THREE.Vector3(0, 2, 0));
  }, []);

  useFrame((state, delta) => {
    if (!scroll) return;

    const rawOffset = scroll.offset;
    const scrollDelta = Math.abs(rawOffset - lastScrollOffset.current);

    // ─── MAGNET / AUTO-STOP LOGIC ──────────────────────────────────────────
    if (scrollDelta > 0.0001) {
      // User is actively scrolling: immediately release focus
      timeSinceLastScroll.current = 0;
      currentFocusIndex.current = null;
    } else {
      timeSinceLastScroll.current += delta;
    }
    lastScrollOffset.current = rawOffset;

    let targetOffset = rawOffset;
    let targetXOffset = 0;

    // If user stopped scrolling for a moment, check for nearby artifacts
    if (timeSinceLastScroll.current > 0.15) {
      if (currentFocusIndex.current === null) {
        for (let i = 0; i < focusData.length; i++) {
          if (Math.abs(rawOffset - focusData[i].offset) < 0.015) { // Capture threshold
            currentFocusIndex.current = i;
            break;
          }
        }
      }
      if (currentFocusIndex.current !== null) {
        targetOffset = focusData[currentFocusIndex.current].offset;
        targetXOffset = focusData[currentFocusIndex.current].x;
      }
    }

    // Lerp effective progress towards targetOffset
    // Fast resume when scrolling manually, slow cinematic ease when focusing
    const progressLerpSpeed = currentFocusIndex.current !== null ? 2.5 : 12.0;
    effectiveProgress.current = THREE.MathUtils.lerp(effectiveProgress.current, targetOffset, delta * progressLerpSpeed);

    // Lerp X offset for looking at the specific artifact
    const xLerpSpeed = currentFocusIndex.current !== null ? 3.0 : 8.0;
    effectiveXOffset.current = THREE.MathUtils.lerp(effectiveXOffset.current, targetXOffset, delta * xLerpSpeed);

    const clampedOffset = Math.min(Math.max(effectiveProgress.current, 0), 0.995);

    if (clampedOffset > 0.99 && !hasCompleted.current) {
      hasCompleted.current = true;
      if (onComplete) onComplete();
    }

    // Get position on curve using effective (magnetized) offset
    curve.getPointAt(clampedOffset, targetPosition.current);

    // Look ahead point (always calculated relative to effective progress)
    const lookAhead = 0.02 + (currentMode.current?.lookAhead || 0);
    const lookAtFraction = Math.min(clampedOffset + lookAhead, 0.999);
    curve.getPointAt(lookAtFraction, targetLookAt.current);

    // Prevent vertical gimbal lock inside the tree by pushing the lookAt target inward!
    if (clampedOffset > 0.85) {
      const blend = Math.min((clampedOffset - 0.85) * 10, 1.0);
      targetLookAt.current.z = THREE.MathUtils.lerp(targetLookAt.current.z, -450, blend);
      targetLookAt.current.x = THREE.MathUtils.lerp(targetLookAt.current.x, effectiveXOffset.current, blend);
    }

    // Add subtle sway
    if (!reducedMotion) {
      const time = state.clock.elapsedTime;
      const swayAmount = currentMode.current?.sway || 0.05;
      
      // Reduce sway heavily when focusing on an artifact for readability
      const focusMultiplier = currentFocusIndex.current !== null ? 0.2 : 1.0;
      
      targetPosition.current.x += Math.sin(time * 0.25) * swayAmount * 0.1 * focusMultiplier;
      targetPosition.current.y += Math.cos(time * 0.35) * swayAmount * 0.05 * focusMultiplier;
    }

    // Smooth interpolation
    const damping = currentMode.current?.damping || 1.5;
    currentPosition.current.lerp(targetPosition.current, delta * damping);
    currentLookAt.current.lerp(targetLookAt.current, delta * damping);

    // FOV transitions
    const targetFOV = currentMode.current?.fov || 55;
    currentFOV.current = THREE.MathUtils.lerp(currentFOV.current, targetFOV, delta * 2);
    (state.camera as THREE.PerspectiveCamera).fov = currentFOV.current;

    // Banking
    if (!reducedMotion) {
      const tangent = curve.getTangentAt(clampedOffset);
      const bankingTarget = tangent.x * -(currentMode.current?.banking || 0.04);
      currentBanking.current = THREE.MathUtils.lerp(currentBanking.current, bankingTarget, delta * damping);
      state.camera.rotation.z = currentBanking.current;
    } else {
      state.camera.rotation.z = 0;
    }

    // Apply camera transform
    state.camera.position.copy(currentPosition.current);
    state.camera.lookAt(currentLookAt.current);
    state.camera.updateProjectionMatrix();

    // Update mode
    const newMode = getModeAt(clampedOffset);
    if (newMode !== currentMode.current) {
      currentMode.current = newMode;
    }
  });

  return null;
}
