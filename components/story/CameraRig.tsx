"use client";

import { useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MotionValue } from "framer-motion";

export const ZONE_POSITIONS = [
  { index: 0, z: 0, progress: 0 },
  { index: 1, z: -45, progress: 0.1 },
  { index: 2, z: -75, progress: 0.2 },
  { index: 3, z: -110, progress: 0.3 },
  { index: 4, z: -150, progress: 0.4 },
  { index: 5, z: -190, progress: 0.5 },
  { index: 6, z: -230, progress: 0.6 },
  { index: 7, z: -270, progress: 0.7 },
  { index: 8, z: -305, progress: 0.8 },
  { index: 9, z: -340, progress: 0.9 },
  { index: 10, z: -360, progress: 1.0 },
];

interface CameraRigProps {
  scrollProgress: MotionValue<number>;
}

export function CameraRig({ scrollProgress }: CameraRigProps) {
  const { camera } = useThree();
  const [reducedMotion, setReducedMotion] = useState(false);
  
  const currentPosition = useMemo(() => new THREE.Vector3(), []);
  const currentLookAt = useMemo(() => new THREE.Vector3(), []);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 10),     // Start slightly back
      new THREE.Vector3(2, 4, -15),    // Zone 0: Study
      new THREE.Vector3(-3, 5, -45),   // Zone 1: Childhood
      new THREE.Vector3(4, 3, -75),    // Zone 2: School
      new THREE.Vector3(-2, 4, -110),  // Zone 3: First Computer
      new THREE.Vector3(5, 6, -150),   // Zone 4: Discovery
      new THREE.Vector3(-4, 5, -190),  // Zone 5: University
      new THREE.Vector3(3, 4, -230),   // Zone 6: Engineering
      new THREE.Vector3(-2, 5, -270),  // Zone 7: Professional
      new THREE.Vector3(0, 4, -305),   // Zone 8: Growth
      new THREE.Vector3(0, 8, -340),   // Zone 9: Tree Climax
      new THREE.Vector3(0, 15, -380),  // End
    ], false, 'catmullrom', 0.5);
  }, []);

  useEffect(() => {
    camera.near = 0.1;
    camera.far = 500;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 55;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame((state, delta) => {
    const progress = Math.max(0, Math.min(1, scrollProgress.get()));
    
    // Evaluate position on spline
    const point = curve.getPointAt(progress);
    const lookAtPoint = curve.getPointAt(Math.min(1, progress + 0.05));
    
    // Spring-damped lerp for position (factor 0.05 as requested)
    currentPosition.lerp(point, 0.05);
    camera.position.copy(currentPosition);
    
    // Spring-damped lerp for lookAt
    currentLookAt.lerp(lookAtPoint, 0.05);
    camera.lookAt(currentLookAt);
    
    // Breathing sway and banking
    if (!reducedMotion) {
      const time = state.clock.getElapsedTime();
      
      // Sway
      camera.position.x += Math.sin(time * 0.5) * 0.1;
      camera.position.y += Math.cos(time * 0.4) * 0.1;
      
      // Banking (based on curve derivative)
      const tangent = curve.getTangentAt(progress);
      const bankAngle = tangent.x * -0.5; // Rotate based on X direction
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, bankAngle, 0.05);
    } else {
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, 0.1);
    }
  });

  return null;
}
