"use client";

import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GrowthTreeProps {
  growthProgress: number; // 0 to 1
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function GrowthTree({ growthProgress }: GrowthTreeProps) {
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const rand = useMemo(() => mulberry32(12345), []);

  const trunkScale = Math.max(0, Math.min(1, (growthProgress - 0.3) / 0.2));
  const branchScale = Math.max(0, Math.min(1, (growthProgress - 0.5) / 0.2));
  const leavesScale = Math.max(0, Math.min(1, (growthProgress - 0.7) / 0.15));
  
  const LEAF_COUNT = 300;
  
  const leafData = useMemo(() => {
    const data = [];
    for (let i = 0; i < LEAF_COUNT; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos((rand() * 2) - 1);
      const radius = 5 + rand() * 10; // Canopy spread ~30 (15 radius)
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(radius * Math.sin(phi) * Math.sin(theta)) + 15; // Centered near top of trunk
      const z = radius * Math.cos(phi);
      
      const rotX = rand() * Math.PI;
      const rotY = rand() * Math.PI;
      const rotZ = rand() * Math.PI;
      
      const scale = 0.5 + rand() * 0.5;
      const speedOffset = rand() * Math.PI * 2;

      const colorChoices = ["#12351F", "#1D4A2B", "#315D39"];
      const color = new THREE.Color(colorChoices[Math.floor(rand() * colorChoices.length)]);
      
      data.push({ x, y, z, rotX, rotY, rotZ, scale, speedOffset, color });
    }
    return data;
  }, [rand]);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!leavesRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const windIntensity = Math.max(0, (growthProgress - 0.85) / 0.15);
    
    for (let i = 0; i < LEAF_COUNT; i++) {
      const leaf = leafData[i];

      const swayX = Math.sin(time * 2 + leaf.speedOffset) * 0.5 * windIntensity;
      const swayY = Math.cos(time * 1.5 + leaf.speedOffset) * 0.5 * windIntensity;
      
      dummy.position.set(leaf.x + swayX, leaf.y + swayY, leaf.z);
      dummy.rotation.set(
        leaf.rotX + swayX * 0.2, 
        leaf.rotY + swayY * 0.2, 
        leaf.rotZ
      );
      
      const finalScale = leaf.scale * leavesScale;
      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.updateMatrix();
      
      leavesRef.current.setMatrixAt(i, dummy.matrix);
      leavesRef.current.setColorAt(i, leaf.color);
    }
    leavesRef.current.instanceMatrix.needsUpdate = true;
    if (leavesRef.current.instanceColor) {
        leavesRef.current.instanceColor.needsUpdate = true;
    }
  });

  const trunkRadius = 0.5 + trunkScale * 2.5;
  const trunkHeight = trunkScale * 20;
  
  return (
    <group>
            {growthProgress < 0.2 && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.5 + growthProgress * 2, 16, 16]} />
          <meshStandardMaterial color="#B99755" emissive="#B99755" emissiveIntensity={0.5} />
        </mesh>
      )}

            {growthProgress >= 0.3 && (
        <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[trunkRadius * 0.8, trunkRadius, trunkHeight, 16]} />
          <meshStandardMaterial color="#51321E" roughness={0.9} />
        </mesh>
      )}

            {growthProgress >= 0.5 && (
        <group position={[0, 15 * trunkScale, 0]}>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const bLength = 15 * branchScale;
            return (
              <mesh 
                key={i} 
                rotation={[Math.PI / 4, angle, 0]} 
                position={[
                  Math.sin(angle) * 2, 
                  2 + (i % 3), 
                  Math.cos(angle) * 2
                ]}
              >
                <cylinderGeometry args={[0.2, 0.8, bLength, 8]} />
                <meshStandardMaterial color="#3A2417" roughness={0.9} />
              </mesh>
            )
          })}
        </group>
      )}

            {growthProgress >= 0.7 && (
        <instancedMesh ref={leavesRef} args={[undefined, undefined, LEAF_COUNT]} castShadow>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial roughness={0.6} />
        </instancedMesh>
      )}

            {growthProgress >= 0.85 && (
        <spotLight 
          position={[0, 40, 0]} 
          angle={0.5} 
          penumbra={0.5} 
          intensity={(growthProgress - 0.85) * 10 * 10} 
          color="#E3CB8A"
          castShadow
        />
      )}
    </group>
  );
}
