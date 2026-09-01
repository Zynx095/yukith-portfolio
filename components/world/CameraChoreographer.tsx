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
  // 1. Opening - family campsite view
  { start: 0.0, end: 0.12, lookAhead: 0.03, damping: 1.5, banking: 0.03, fov: 55, sway: 0.08 },
  // 2. Lake and campsite activity
  { start: 0.12, end: 0.22, lookAhead: 0.03, damping: 1.5, banking: 0.03, fov: 55, sway: 0.08 },
  // 3. Journey through forest
  { start: 0.22, end: 0.35, lookAhead: 0.04, damping: 1.6, banking: 0.04, fov: 58, sway: 0.10 },
  // 4. Mountain and waterfall reveal
  { start: 0.35, end: 0.48, lookAhead: 0.04, damping: 1.6, banking: 0.05, fov: 60, sway: 0.12 },
  // 5. River and swimming fish
  { start: 0.48, end: 0.58, lookAhead: 0.04, damping: 1.5, banking: 0.04, fov: 55, sway: 0.08 },
  // 6. Open landscape valley
  { start: 0.58, end: 0.70, lookAhead: 0.03, damping: 1.4, banking: 0.04, fov: 55, sway: 0.06 },
  // 7. World Tree visible in distance
  { start: 0.70, end: 0.78, lookAhead: 0.03, damping: 1.4, banking: 0.03, fov: 52, sway: 0.05 },
  // 8. Approach massive roots
  { start: 0.78, end: 0.84, lookAhead: 0.03, damping: 1.8, banking: 0.02, fov: 50, sway: 0.03 },
  // 9. Enter root cavity
  { start: 0.84, end: 0.88, lookAhead: 0.04, damping: 2.0, banking: 0.01, fov: 48, sway: 0.02 },
  // 10. Ascend inside tree trunk
  { start: 0.88, end: 0.95, lookAhead: 0.05, damping: 2.5, banking: 0.01, fov: 45, sway: 0.01 },
  // 11. Project archive chambers
  { start: 0.95, end: 0.995, lookAhead: 0.05, damping: 2.5, banking: 0.01, fov: 42, sway: 0.01 },
  // 12. Emerge to portfolio transition
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
      // Start - family campsite
      new THREE.Vector3(0, 3, 12),
      new THREE.Vector3(2, 2.5, 0),
      // Lake area
      new THREE.Vector3(5, 2.0, -15),
      new THREE.Vector3(8, 2.0, -25),
      // Forest journey
      new THREE.Vector3(5, 2.5, -50),
      new THREE.Vector3(-3, 3.0, -80),
      // Mountain and waterfall approach
      new THREE.Vector3(0, 4.0, -100),
      new THREE.Vector3(-2, 5.0, -120),
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
      new THREE.Vector3(0, 4.0, -448),
      // Inside tree - ascending
      new THREE.Vector3(0, 15.0, -450),
      new THREE.Vector3(0, 30.0, -450),
      new THREE.Vector3(0, 50.0, -450),
      new THREE.Vector3(0, 70.0, -450),
      new THREE.Vector3(0, 90.0, -450),
      new THREE.Vector3(0, 110.0, -450),
      new THREE.Vector3(0, 130.0, -450),
      new THREE.Vector3(0, 150.0, -450),
      new THREE.Vector3(0, 170.0, -450),
      // Emerge to top
      new THREE.Vector3(0, 190.0, -450),
      new THREE.Vector3(0, 200.0, -450),
    ];
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  }, []);

  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const currentFOV = useRef(55);
  const currentBanking = useRef(0);
  const currentMode = useRef<CameraMode>(CAMERA_MODES[0]);

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

    const offset = scroll.offset;
    const clampedOffset = Math.min(Math.max(offset, 0), 0.995);

    if (clampedOffset > 0.99 && !hasCompleted.current) {
      hasCompleted.current = true;
      if (onComplete) onComplete();
    }

    // Get position on curve
    curve.getPointAt(clampedOffset, targetPosition.current);

    // Look ahead point
    const lookAhead = 0.02 + (currentMode.current?.lookAhead || 0);
    const lookAtFraction = Math.min(clampedOffset + lookAhead, 0.999);
    curve.getPointAt(lookAtFraction, targetLookAt.current);

    // Add subtle sway
    if (!reducedMotion) {
      const time = state.clock.elapsedTime;
      const swayAmount = currentMode.current?.sway || 0.05;
      targetPosition.current.x += Math.sin(time * 0.25) * swayAmount * 0.1;
      targetPosition.current.y += Math.cos(time * 0.35) * swayAmount * 0.05;
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
