"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Seeded random for consistent terrain
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Simple noise function for terrain
function simpleNoise(x: number, z: number): number {
  const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  
  const a = simpleNoise(ix, iz);
  const b = simpleNoise(ix + 1, iz);
  const c = simpleNoise(ix, iz + 1);
  const d = simpleNoise(ix + 1, iz + 1);
  
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function getTerrainHeight(x: number, z: number): number {
  let height = 0;
  height += smoothNoise(x * 0.01, z * 0.01) * 20;
  height += smoothNoise(x * 0.03, z * 0.03) * 8;
  height += smoothNoise(x * 0.1, z * 0.1) * 2;
  
  // Create a valley/path along the center
  const pathWidth = 30;
  const pathOffset = Math.sin(z * 0.005) * 20;
  const distFromPath = Math.abs(x - pathOffset);
  
  if (distFromPath < pathWidth) {
    const factor = distFromPath / pathWidth;
    height = height * factor + (-5) * (1 - factor);
  }
  
  return height - 5; // Lower overall
}

export function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const segments = 200;
    const size = 600;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    
    const positions = geo.attributes.position.array as Float32Array;
    const rng = seededRandom(42);
    
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const idx = (i * (segments + 1) + j) * 3;
        const x = (i / segments - 0.5) * size;
        const z = (j / segments - 0.5) * size - 200; // Center around journey
        
        const y = getTerrainHeight(x, z);
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
      }
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow position={[0, -5, -200]}>
      <meshStandardMaterial 
        color="#2A3A25" 
        roughness={0.9} 
        metalness={0.1}
        flatShading
      />
    </mesh>
  );
}

// Distant mountains
export function Mountains() {
  const groupRef = useRef<THREE.Group>(null);

  const mountains = useMemo(() => {
    const data = [];
    const rng = seededRandom(999);
    
    for (let i = 0; i < 50; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 200 + rng() * 150;
      const x = Math.cos(angle) * dist;
      const z = -200 + (rng() - 0.5) * 400;
      const height = 50 + rng() * 100;
      const width = 40 + rng() * 60;
      
      data.push({ x, z, height, width });
    }
    return data;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle parallax based on camera
      groupRef.current.rotation.y = state.camera.position.x * 0.0003;
    }
  });

  return (
    <group ref={groupRef}>
      {mountains.map((m, i) => (
        <mesh
          key={`mount-${i}`}
          position={[m.x, m.height / 2, m.z]}
          castShadow
        >
          <coneGeometry args={[m.width / 2, m.height, 4]} />
          <meshStandardMaterial
            color="#1A2A15"
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

// Forest elements (dead trees, rocks)
export function EnvironmentProps() {
  const groupRef = useRef<THREE.Group>(null);

  const props = useMemo(() => {
    const data: any[] = [];
    const rng = seededRandom(777);
    
    // Trees along the path
    for (let i = 0; i < 100; i++) {
      const z = -50 + rng() * -400;
      const side = rng() > 0.5 ? 1 : -1;
      const offset = 20 + rng() * 80;
      const x = side * offset;
      const height = 8 + rng() * 20;
      
      data.push({
        type: 'tree',
        x, z, height,
        rotation: rng() * Math.PI * 2,
        scale: 0.5 + rng() * 1
      });
    }
    
    // Rocks
    for (let i = 0; i < 60; i++) {
      const z = -50 + rng() * -400;
      const side = rng() > 0.5 ? 1 : -1;
      const offset = 15 + rng() * 60;
      const x = side * offset;
      const size = 1 + rng() * 4;
      
      data.push({
        type: 'rock',
        x, z, size,
        rotation: rng() * Math.PI * 2
      });
    }
    
    // Distant pillars/ruins
    for (let i = 0; i < 30; i++) {
      const z = -80 + rng() * -350;
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (50 + rng() * 100);
      const height = 8 + rng() * 20;
      
      data.push({
        type: 'pillar',
        x, z, height,
        scale: 0.5 + rng() * 0.8
      });
    }
    
    return data;
  }, []);

  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      {props.map((prop, i) => {
        if (prop.type === 'tree') {
          return (
            <group key={`tree-${i}`} position={[prop.x, prop.height * prop.scale / 2, prop.z]} rotation={[0, prop.rotation, 0]}>
              {/* Trunk */}
              <mesh castShadow>
                <cylinderGeometry args={[0.3 * prop.scale, 0.5 * prop.scale, prop.height * prop.scale, 5]} />
                <meshStandardMaterial color="#4A3A25" roughness={1} flatShading />
              </mesh>
              {/* Foliage */}
              <mesh position={[0, prop.height * prop.scale * 0.6, 0]}>
                <coneGeometry args={[3 * prop.scale, prop.height * prop.scale * 0.5, 6]} />
                <meshStandardMaterial color="#2A5A25" roughness={1} flatShading />
              </mesh>
            </group>
          );
        }
        
        if (prop.type === 'rock') {
          return (
            <mesh
              key={`rock-${i}`}
              position={[prop.x, prop.size * prop.scale / 2, prop.z]}
              rotation={[prop.rotation, prop.rotation * 0.5, 0]}
            >
              <dodecahedronGeometry args={[prop.size * prop.scale, 0]} />
              <meshStandardMaterial color="#5A5A55" roughness={0.9} flatShading />
            </mesh>
          );
        }
        
        if (prop.type === 'pillar') {
          return (
            <mesh
              key={`pillar-${i}`}
              position={[prop.x, prop.height * prop.scale / 2, prop.z]}
            >
              <boxGeometry args={[2 * prop.scale, prop.height * prop.scale, 2 * prop.scale]} />
              <meshStandardMaterial color="#4A4540" roughness={0.95} flatShading />
            </mesh>
          );
        }
        
        return null;
      })}
    </group>
  );
}

// Fog layers for atmosphere
export function Atmosphere() {
  return (
    <>
      {/* Ground fog planes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`fog-${i}`}
          position={[0, -2, -30 - i * 35]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[350, 120]} />
          <meshBasicMaterial
            color="#3A5A35"
            transparent
            opacity={0.1 + (i / 12) * 0.1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

// Fireflies / atmospheric particles
export function Fireflies() {
  const pointsRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const z = -Math.random() * 450;
      const x = (Math.random() - 0.5) * 80;
      const y = 2 + Math.random() * 15;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Warm amber/golden colors
      colors[i * 3] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.2;
    }
    return { positions, colors, count };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      pointsRef.current.position.y = Math.sin(time * 0.2) * 0.5;
      pointsRef.current.rotation.y = time * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particleData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particleData.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}
