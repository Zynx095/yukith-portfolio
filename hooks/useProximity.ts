import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/**
 * A centralized hook to calculate proximity to a target position.
 * Returns a ref holding a normalized value (0 to 1) representing how close the camera is.
 * 0 = far away, 1 = exactly at the target.
 * The value smoothly damps toward the target.
 */
export function useProximity(targetPosition: [number, number, number], activationDistance: number = 30) {
  const proximityRef = useRef(0);
  const targetVec = useMemo(() => new THREE.Vector3(...targetPosition), [targetPosition]);

  useFrame((state, delta) => {
    const distance = state.camera.position.distanceTo(targetVec);
    
    // Calculate normalized raw proximity
    // If distance >= activationDistance, raw is 0.
    // If distance <= 5, raw is 1 (max intensity).
    const rawProximity = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(distance, activationDistance, 5, 0, 1),
      0,
      1
    );

    // Apply smooth damping so it doesn't snap
    proximityRef.current = THREE.MathUtils.damp(proximityRef.current, rawProximity, 4, delta);
  });

  return proximityRef;
}
