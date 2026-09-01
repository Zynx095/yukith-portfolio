"use client";

import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";

// ─── Camera lookAt interpolator ──────────────────────────────────────
function smoothLookAt(
  current: THREE.Vector3,
  target: THREE.Vector3,
  delta: number,
  damping: number
): THREE.Vector3 {
  return current.lerp(target, delta * damping);
}

export function CameraController({ onComplete }: { onComplete?: () => void }) {
  const scroll = useScroll();
  const hasCompleted = useRef(false);

  // Prefers reduced motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Cinematic path — ground-level journey through the dark void
  // Wider lateral offsets for dramatic reveals
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 2, 10),         // Start — intro title
      new THREE.Vector3(4, 1.5, -25),      // Drift toward Childhood
      new THREE.Vector3(5, 1, -40),        // Childhood linger
      new THREE.Vector3(5, 1, -50),        // Hold
      new THREE.Vector3(-4, 2, -70),       // Void travel, banking left
      new THREE.Vector3(-8, 1.5, -90),     // First Tech reveal
      new THREE.Vector3(-8, 1.5, -100),    // Linger
      new THREE.Vector3(3, 2.5, -118),     // Void travel, sweeping right
      new THREE.Vector3(12, 1.5, -140),    // University reveal
      new THREE.Vector3(12, 1.5, -148),    // Linger
      new THREE.Vector3(0, 2, -168),       // Void travel center
      new THREE.Vector3(-15, 1.5, -190),   // AURA reveal
      new THREE.Vector3(-15, 1.5, -200),   // Linger
      new THREE.Vector3(6, 2, -218),       // Void travel, sweeping right
      new THREE.Vector3(20, 1, -240),      // ETTH reveal
      new THREE.Vector3(20, 1, -250),      // Linger
      new THREE.Vector3(0, 2.5, -268),     // Void travel center
      new THREE.Vector3(-25, 1.5, -290),   // ShadowGuard reveal
      new THREE.Vector3(-25, 1.5, -300),   // Linger
      new THREE.Vector3(5, 2, -318),       // Void travel, sweeping right
      new THREE.Vector3(30, 1.5, -340),    // Sugar AI reveal
      new THREE.Vector3(30, 1.5, -350),    // Linger
      new THREE.Vector3(0, 2, -368),       // Void travel center
      new THREE.Vector3(-10, 1.5, -390),   // Achievements constellation
      new THREE.Vector3(-10, 1.5, -400),   // Linger
      new THREE.Vector3(0, 1.5, -412),     // Approach Leadership / Experience
      new THREE.Vector3(15, 1.5, -422),    // Leadership branch
      new THREE.Vector3(-15, 1.5, -422),   // Experience branch
      new THREE.Vector3(0, 1.5, -435),     // Final approach to tree
      new THREE.Vector3(0, 0, -442),       // Dip between massive roots
      new THREE.Vector3(0, 12, -446),      // Rising along trunk
      new THREE.Vector3(0, 50, -448),      // Branches overhead
      new THREE.Vector3(0, 100, -450),     // Inside the canopy
      new THREE.Vector3(0, 145, -452),     // Deep in golden foliage
    ];
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35);
  }, []);

  const cameraTarget = useRef(new THREE.Vector3());
  const cameraPosition = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!scroll) return;

    const offset = scroll.offset;

    // Check for completion
    if (offset > 0.995 && !hasCompleted.current) {
      hasCompleted.current = true;
      if (onComplete) {
        onComplete();
      }
    }

    // Evaluate curve position
    curve.getPointAt(offset, cameraPosition.current);

    // Subtle breathing sway (reduced for motion-sickness prevention)
    if (!reducedMotion) {
      const time = state.clock.elapsedTime;
      const swayX = Math.sin(time * 0.25) * 0.1;
      const swayY = Math.cos(time * 0.35) * 0.05;
      cameraPosition.current.x += swayX;
      cameraPosition.current.y += swayY;
    }

    // LookAt target — further along the curve for anticipation
    const lookAtFraction = Math.min(offset + 0.03, 0.999);
    curve.getPointAt(lookAtFraction, targetLookAt.current);

    // Additional look-at pull toward nearby landmarks
    if (!reducedMotion) {
      // Pull slightly toward the camera's forward direction
      targetLookAt.current.x += state.pointer.x * -1.2;
      targetLookAt.current.y += state.pointer.y * 0.8;
    }

    // Heavy cinematic damping — slow and deliberate
    const dampingFactor = 1.5;
    state.camera.position.lerp(cameraPosition.current, delta * dampingFactor);

    lookAtTarget.current.lerp(targetLookAt.current, delta * dampingFactor);
    state.camera.lookAt(lookAtTarget.current);

    // Subtle banking based on tangent direction
    if (!reducedMotion) {
      const tangent = curve.getTangentAt(offset);
      const banking = tangent.x * -0.06;
      state.camera.rotation.z = THREE.MathUtils.lerp(
        state.camera.rotation.z,
        banking,
        delta * dampingFactor
      );
    }
  });

  return null;
}
