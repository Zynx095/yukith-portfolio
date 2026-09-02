"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";

export function DistantTreeSilhouette() {
  const scroll = useScroll();

  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const trunkGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(10, 22, 140, 8);
    geo.translate(0, 70, 0);
    return geo;
  }, []);

  const canopySpheres = useMemo(() => {
    return [
      { radius: 65, position: [0, 150, 0] as const },
      { radius: 60, position: [35, 140, 20] as const },
      { radius: 55, position: [-45, 135, -15] as const },
      { radius: 65, position: [20, 170, -25] as const },
      { radius: 50, position: [-35, 160, 30] as const },
      { radius: 75, position: [0, 135, -10] as const },
    ];
  }, []);

  const canopyGeometries = useMemo(() => {
    return canopySpheres.map((s) => new THREE.SphereGeometry(s.radius, 8, 6));
  }, [canopySpheres]);

  const currentScale = useRef(0.35);
  const currentOpacity = useRef(0.9);

  useFrame((_state, delta) => {
    if (!scroll || !groupRef.current || !materialRef.current) return;

    const offset = scroll.offset;

    const scaleTarget = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(offset, 0, 0.5, 0.35, 1.0),
      0.35,
      1.0
    );

    const opacityTarget =
      offset < 0.65
        ? 0.9
        : THREE.MathUtils.clamp(
            THREE.MathUtils.mapLinear(offset, 0.65, 0.85, 0.9, 0.0),
            0.0,
            0.9
          );

    currentScale.current = THREE.MathUtils.damp(currentScale.current, scaleTarget, 3, delta);
    currentOpacity.current = THREE.MathUtils.damp(currentOpacity.current, opacityTarget, 4, delta);

    groupRef.current.scale.setScalar(currentScale.current);
    materialRef.current.opacity = currentOpacity.current;
  });

  return (
    <group ref={groupRef} position={[0, -3, -450]} scale={0.35}>
            <mesh geometry={trunkGeometry}>
        <meshBasicMaterial ref={materialRef} color="#C8CBD0" transparent depthWrite={false} />
      </mesh>

            {canopySpheres.map((s, i) => (
        <mesh
          key={`canopy-${i}`}
          geometry={canopyGeometries[i]}
          position={[s.position[0], s.position[1], s.position[2]]}
        >
          <meshBasicMaterial color="#C8CBD0" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
