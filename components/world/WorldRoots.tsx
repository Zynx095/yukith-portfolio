"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export function WorldRoots() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Create a sprawling root spline that follows the general camera journey
  // but stays grounded and weaves randomly.
  const rootCurve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, -3, 10),         // Start
      new THREE.Vector3(4, -3.2, -30),      // Childhood
      new THREE.Vector3(-4, -3.5, -65),     // Void travel
      new THREE.Vector3(-9, -3.1, -95),     // First Tech
      new THREE.Vector3(3, -3.4, -125),     // Void travel
      new THREE.Vector3(13, -3.2, -145),    // University
      new THREE.Vector3(-2, -3.6, -170),    // Void travel
      new THREE.Vector3(-16, -3.1, -195),   // AURA
      new THREE.Vector3(4, -3.8, -225),     // Void travel
      new THREE.Vector3(21, -3.0, -245),    // ETTH
      new THREE.Vector3(-3, -3.5, -270),    // Void travel
      new THREE.Vector3(-26, -3.2, -295),   // ShadowGuard
      new THREE.Vector3(6, -3.6, -320),     // Void travel
      new THREE.Vector3(31, -3.1, -345),    // Sugar AI
      new THREE.Vector3(-4, -3.4, -370),    // Void travel
      new THREE.Vector3(-11, -3.0, -395),   // Achievement
      new THREE.Vector3(5, -3.2, -415),     // Cross
      new THREE.Vector3(14, -3.1, -425),    // Leadership
      new THREE.Vector3(-14, -3.5, -425),   // Experience
      new THREE.Vector3(0, -4.0, -440),     // Base of Tree
    ];
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  }, []);

  const secondaryCurve = useMemo(() => {
    const points = [
      new THREE.Vector3(-2, -3.5, 10),
      new THREE.Vector3(2, -3.8, -40),
      new THREE.Vector3(-12, -3.2, -100),
      new THREE.Vector3(16, -3.6, -150),
      new THREE.Vector3(-20, -3.1, -200),
      new THREE.Vector3(25, -3.5, -250),
      new THREE.Vector3(-30, -3.2, -300),
      new THREE.Vector3(35, -3.7, -350),
      new THREE.Vector3(0, -4.2, -440),
    ];
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      // Subtle pulsing of the root's emissive
      materialRef.current.emissiveIntensity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Primary Thick Root */}
      <mesh>
        <tubeGeometry args={[rootCurve, 200, 0.4, 8, false]} />
        <meshStandardMaterial 
          ref={materialRef}
          color="#C8CBD0" 
          roughness={1.0} 
          metalness={0.0} 
          emissive="#888888"
          emissiveIntensity={0.1}
          flatShading
        />
      </mesh>
      
      {/* Secondary Winding Root */}
      <mesh>
        <tubeGeometry args={[secondaryCurve, 150, 0.2, 6, false]} />
        <meshStandardMaterial 
          color="#B8BBC2" 
          roughness={1.0} 
          metalness={0.0} 
          emissive="#666666"
          emissiveIntensity={0.05}
          flatShading
        />
      </mesh>

      {/* Spores / Ambient Dust along the path */}
      <group>
        {Array.from({ length: 200 }).map((_, i) => {
          const t = i / 200;
          const pos = rootCurve.getPointAt(t);
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            Math.random() * 8,
            (Math.random() - 0.5) * 15
          );
          return (
            <mesh key={i} position={pos.add(offset)}>
              <octahedronGeometry args={[0.05 + Math.random() * 0.1, 0]} />
              <meshBasicMaterial 
                color={Math.random() > 0.5 ? "#C8CBD0" : "#B8BBC2"} 
                transparent 
                opacity={0.2 + Math.random() * 0.3} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} 
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
