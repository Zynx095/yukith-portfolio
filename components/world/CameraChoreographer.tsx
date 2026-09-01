"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";

// ─── Camera Modes ────────────────────────────────────────────────
// Each mode defines how the camera behaves in a scroll range.

interface CameraMode {
  // Scroll offset range this mode is active
  start: number;
  end: number;
  // Look-ahead factor (how far ahead to look)
  lookAhead: number;
  // Damping strength (higher = heavier feel)
  damping: number;
  // Banking intensity (turning feel)
  banking: number;
  // FOV
  fov: number;
  // Sway amount (ambient movement)
  sway: number;
  // Speed multiplier
  speed: number;
}

const CAMERA_MODES: CameraMode[] = [
  // Intro — slow, mysterious
  { start: 0, end: 0.05, lookAhead: 0.02, damping: 1.2, banking: 0.02, fov: 55, sway: 0.08, speed: 0.8 },
  // Childhood — gentle glide
  { start: 0.05, end: 0.12, lookAhead: 0.03, damping: 1.5, banking: 0.04, fov: 58, sway: 0.12, speed: 1.0 },
  // First Tech — push toward CRT
  { start: 0.12, end: 0.18, lookAhead: 0.04, damping: 1.8, banking: 0.05, fov: 60, sway: 0.10, speed: 0.9 },
  // University — rise and reveal
  { start: 0.18, end: 0.25, lookAhead: 0.03, damping: 1.4, banking: 0.06, fov: 55, sway: 0.15, speed: 1.1 },
  // Void travel between projects
  { start: 0.25, end: 0.28, lookAhead: 0.02, damping: 2.0, banking: 0.03, fov: 52, sway: 0.05, speed: 0.7 },
  // AURA — surveillance sweep
  { start: 0.28, end: 0.34, lookAhead: 0.03, damping: 1.6, banking: 0.08, fov: 55, sway: 0.20, speed: 1.0 },
  // Void to ETTH
  { start: 0.34, end: 0.36, lookAhead: 0.02, damping: 2.0, banking: 0.03, fov: 52, sway: 0.05, speed: 0.7 },
  // ETTH — flow along network
  { start: 0.36, end: 0.42, lookAhead: 0.04, damping: 1.5, banking: 0.05, fov: 58, sway: 0.18, speed: 1.0 },
  // Void to ShadowGuard
  { start: 0.42, end: 0.44, lookAhead: 0.02, damping: 2.0, banking: 0.03, fov: 52, sway: 0.05, speed: 0.7 },
  // ShadowGuard — slow approach
  { start: 0.44, end: 0.50, lookAhead: 0.03, damping: 1.8, banking: 0.04, fov: 55, sway: 0.10, speed: 0.8 },
  // Void to Sugar AI
  { start: 0.50, end: 0.52, lookAhead: 0.02, damping: 2.0, banking: 0.03, fov: 52, sway: 0.05, speed: 0.7 },
  // Sugar AI — through waveforms
  { start: 0.52, end: 0.58, lookAhead: 0.03, damping: 1.4, banking: 0.06, fov: 60, sway: 0.25, speed: 1.1 },
  // Void to Achievements
  { start: 0.58, end: 0.60, lookAhead: 0.02, damping: 2.0, banking: 0.03, fov: 52, sway: 0.05, speed: 0.7 },
  // Achievements — pull back to reveal scale
  { start: 0.60, end: 0.66, lookAhead: 0.02, damping: 1.3, banking: 0.02, fov: 65, sway: 0.08, speed: 0.9 },
  // Void to Leadership/Experience
  { start: 0.66, end: 0.68, lookAhead: 0.02, damping: 2.0, banking: 0.03, fov: 52, sway: 0.05, speed: 0.7 },
  // Leadership — orbit branches
  { start: 0.68, end: 0.72, lookAhead: 0.03, damping: 1.5, banking: 0.07, fov: 58, sway: 0.15, speed: 1.0 },
  // Experience — look up at pillars
  { start: 0.72, end: 0.76, lookAhead: 0.04, damping: 1.6, banking: 0.05, fov: 55, sway: 0.12, speed: 0.9 },
  // Final approach — build to tree
  { start: 0.76, end: 0.85, lookAhead: 0.03, damping: 1.4, banking: 0.04, fov: 52, sway: 0.06, speed: 0.8 },
  // Root entry — dip low
  { start: 0.85, end: 0.90, lookAhead: 0.05, damping: 1.8, banking: 0.08, fov: 50, sway: 0.04, speed: 0.6 },
  // Trunk ascent — rise upward
  { start: 0.90, end: 0.95, lookAhead: 0.06, damping: 2.0, banking: 0.03, fov: 48, sway: 0.03, speed: 0.5 },
  // Canopy entry — inside the tree
  { start: 0.95, end: 0.99, lookAhead: 0.08, damping: 2.5, banking: 0.02, fov: 45, sway: 0.02, speed: 0.4 },
];

function getModeAt(offset: number): CameraMode {
  for (const mode of CAMERA_MODES) {
    if (offset >= mode.start && offset < mode.end) return mode;
  }
  return CAMERA_MODES[CAMERA_MODES.length - 1];
}

function lerpMode(a: CameraMode, b: CameraMode, t: number): CameraMode {
  return {
    start: a.start,
    end: b.end,
    lookAhead: THREE.MathUtils.lerp(a.lookAhead, b.lookAhead, t),
    damping: THREE.MathUtils.lerp(a.damping, b.damping, t),
    banking: THREE.MathUtils.lerp(a.banking, b.banking, t),
    fov: THREE.MathUtils.lerp(a.fov, b.fov, t),
    sway: THREE.MathUtils.lerp(a.sway, b.sway, t),
    speed: THREE.MathUtils.lerp(a.speed, b.speed, t),
  };
}

export function CameraChoreographer({ onComplete }: { onComplete?: () => void }) {
  const scroll = useScroll();
  const hasCompleted = useRef(false);

  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 2, 10),
      new THREE.Vector3(4, 1.5, -25),
      new THREE.Vector3(5, 1, -40),
      new THREE.Vector3(5, 1, -50),
      new THREE.Vector3(-4, 2, -70),
      new THREE.Vector3(-8, 1.5, -90),
      new THREE.Vector3(-8, 1.5, -100),
      new THREE.Vector3(3, 2.5, -118),
      new THREE.Vector3(12, 1.5, -140),
      new THREE.Vector3(12, 1.5, -148),
      new THREE.Vector3(0, 2, -168),
      new THREE.Vector3(-15, 1.5, -190),
      new THREE.Vector3(-15, 1.5, -200),
      new THREE.Vector3(6, 2, -218),
      new THREE.Vector3(20, 1, -240),
      new THREE.Vector3(20, 1, -250),
      new THREE.Vector3(0, 2.5, -268),
      new THREE.Vector3(-25, 1.5, -290),
      new THREE.Vector3(-25, 1.5, -300),
      new THREE.Vector3(5, 2, -318),
      new THREE.Vector3(30, 1.5, -340),
      new THREE.Vector3(30, 1.5, -350),
      new THREE.Vector3(0, 2, -368),
      new THREE.Vector3(-10, 1.5, -390),
      new THREE.Vector3(-10, 1.5, -400),
      new THREE.Vector3(0, 1.5, -412),
      new THREE.Vector3(15, 1.5, -422),
      new THREE.Vector3(-15, 1.5, -422),
      new THREE.Vector3(0, 1.5, -435),
      new THREE.Vector3(0, 0, -442),
      new THREE.Vector3(0, 12, -446),
      new THREE.Vector3(0, 50, -448),
      new THREE.Vector3(0, 100, -450),
      new THREE.Vector3(0, 145, -452),
    ];
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35);
  }, []);

  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const currentFOV = useRef(55);
  const currentBanking = useRef(0);
  const currentMode = useRef<CameraMode>(CAMERA_MODES[0]);

  // Prefers reduced motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useFrame((state, delta) => {
    if (!scroll) return;

    const offset = scroll.offset;
    const clampedOffset = Math.min(offset, 0.995);

    // Check for completion
    if (clampedOffset > 0.99 && !hasCompleted.current) {
      hasCompleted.current = true;
      if (onComplete) onComplete();
    }

    // Evaluate curve position
    curve.getPointAt(clampedOffset, targetPosition.current);

    // Look-at target — further along the curve
    const lookAhead = 0.03 + (currentMode.current?.lookAhead || 0);
    const lookAtFraction = Math.min(clampedOffset + lookAhead, 0.999);
    curve.getPointAt(lookAtFraction, targetLookAt.current);

    // Subtle ambient sway
    if (!reducedMotion) {
      const time = state.clock.elapsedTime;
      const mode = currentMode.current;
      const swayAmount = mode.sway;
      targetPosition.current.x += Math.sin(time * 0.25) * swayAmount * 0.1;
      targetPosition.current.y += Math.cos(time * 0.35) * swayAmount * 0.05;
    }

    // Smooth interpolation with mode-specific damping
    const damping = currentMode.current?.damping || 1.5;
    currentPosition.current.lerp(targetPosition.current, delta * damping);
    currentLookAt.current.lerp(targetLookAt.current, delta * damping);

    // Apply FOV transitions
    const targetFOV = currentMode.current?.fov || 55;
    currentFOV.current = THREE.MathUtils.lerp(currentFOV.current, targetFOV, delta * 2);
    (state.camera as THREE.PerspectiveCamera).fov = currentFOV.current;

    // Banking based on curve tangent
    if (!reducedMotion) {
      const tangent = curve.getTangentAt(clampedOffset);
      const bankingTarget = tangent.x * -(currentMode.current?.banking || 0.05);
      currentBanking.current = THREE.MathUtils.lerp(currentBanking.current, bankingTarget, delta * damping);
      state.camera.rotation.z = currentBanking.current;
    } else {
      state.camera.rotation.z = 0;
    }

    // Apply camera transform
    state.camera.position.copy(currentPosition.current);
    state.camera.lookAt(currentLookAt.current);
    state.camera.updateProjectionMatrix();

    // Update mode tracking
    const newMode = getModeAt(clampedOffset);
    const prevMode = currentMode.current;
    if (newMode !== prevMode) {
      // Smoothly transition to new mode
      currentMode.current = newMode;
    }
  });

  return null;
}
