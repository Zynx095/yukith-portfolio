"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";

function createCRTTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#0A1A0A";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = "rgba(51, 255, 87, 0.04)";
    ctx.fillRect(0, y, size, 1);
  }
  const rand = (() => { let s = 123; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  for (let i = 0; i < 12; i++) {
    const x = 30 + rand() * 50;
    const y = 40 + i * 35;
    const lineLen = 50 + rand() * 40;
    ctx.fillStyle = `rgba(51, 255, 87, ${0.3 + rand() * 0.4})`;
    ctx.fillRect(x, y, lineLen * 6, 3);
  }
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function ZoneFirstTech() {
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { openPanel } = useInteractionContext();

  const config = STORY_ZONES.find((z) => z.id === "firsttech")!;
  const crtTexture = useMemo(() => createCRTTexture(), []);

  useFrame((state) => {
    if (screenRef.current) {
      const flicker = 0.7 + Math.sin(state.clock.elapsedTime * 10) * 0.1 + Math.random() * 0.1;
      (screenRef.current.material as THREE.MeshBasicMaterial).opacity = flicker;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 5) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={config.worldPosition as [number, number, number]}>
            <group position={[0, 0, 0]}>
                <mesh position={[0, 3, -5]}>
          <boxGeometry args={[14, 7, 0.4]} />
          <meshStandardMaterial color="#2A2015" roughness={1} flatShading />
        </mesh>
        
                <group position={[0, 1.5, 0]}>
                    <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[5, 0.3, 3]} />
            <meshStandardMaterial color="#3A2A1A" roughness={0.9} flatShading />
          </mesh>
          
                    <mesh position={[0, 1.5, 0.5]}>
            <boxGeometry args={[2.5, 2, 2]} />
            <meshStandardMaterial color="#0A0A0A" roughness={0.5} metalness={0.3} />
          </mesh>
          
                    <mesh ref={screenRef} position={[0, 1.5, 1.55]} onClick={() => openPanel(config.id)}>
            <planeGeometry args={[2, 1.5]} />
            <meshBasicMaterial map={crtTexture} transparent opacity={0.8} />
          </mesh>
          
                    {Array.from({ length: 15 }).map((_, i) => (
            <mesh key={`scan-${i}`} position={[0, 1.5, 1.56]}>
              <planeGeometry args={[2, 0.03]} />
              <meshBasicMaterial color="#00FF44" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
        
                {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <mesh key={`cable-${i}`} position={[Math.cos(angle) * 4, 0.3, Math.sin(angle) * 3]} rotation={[0, angle, 0]}>
              <torusGeometry args={[0.5, 0.08, 4, 8]} />
              <meshStandardMaterial color="#2A2A2A" roughness={0.8} />
            </mesh>
          );
        })}
      </group>
      
            <pointLight ref={lightRef} color="#00FF44" intensity={2} distance={15} position={[0, 2, 2]} />
      
            <mesh position={[0, 4, 3]} onClick={() => openPanel(config.id)}>
        <planeGeometry args={[6, 1]} />
        <meshBasicMaterial color="#00FF44" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
