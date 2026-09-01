"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Simple seeded PRNG ───────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Perlin-like noise for terrain ────────────────────────────────────────────
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);

  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x: number, z: number, octaves: number = 6): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, z * frequency) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }

  return value / max;
}

// ─── Terrain height function ─────────────────────────────────────────────────
interface TerrainHeightResult {
  height: number;
  color: string;
  roughness: number;
}

function getTerrainHeight(x: number, z: number): TerrainHeightResult {
  // World coordinates: camera travels from z=10 to z=-460
  // World tree is at z=-450
  
  // Scale factors for different terrain features
  const scale1 = 0.003;
  const scale2 = 0.008;
  const scale3 = 0.02;
  
  // Base rolling hills
  let height = fbm(x * scale1, z * scale1, 5) * 25;
  height += fbm(x * scale2, z * scale2, 4) * 10;
  height += fbm(x * scale3, z * scale3, 3) * 3;
  
  // Create valley along camera path (X ≈ 0)
  const distFromPath = Math.abs(x);
  if (distFromPath < 40) {
    const factor = distFromPath / 40;
    const smoothFactor = factor * factor * (3 - 2 * factor);
    height = THREE.MathUtils.lerp(0, height, smoothFactor);
  }
  
  // Create mountain range behind waterfall area (z ≈ -85)
  const waterfallZ = Math.abs(z + 85);
  if (waterfallZ < 60 && Math.abs(x) > 10) {
    const mountainNoise = fbm(x * 0.005, z * 0.005, 4);
    if (mountainNoise > 0.4) {
      const mountainHeight = (mountainNoise - 0.4) * 120;
      height = Math.max(height, mountainHeight + 15);
    }
  }
  
  // Create deep valley around waterfall basin (z ≈ -85, x ≈ 15)
  const basinDist = Math.sqrt((x - 15) * (x - 15) + (z + 85) * (z + 85));
  if (basinDist < 30) {
    const basinFactor = 1 - basinDist / 30;
    height -= basinFactor * 15;
  }
  
  // Create lake basin (z ≈ -15, x ≈ 7)
  const lakeDist = Math.sqrt((x - 7) * (x - 7) + (z + 15) * (z + 15));
  if (lakeDist < 25) {
    const lakeFactor = 1 - lakeDist / 25;
    height = Math.min(height, -2 + lakeFactor * 2);
  }
  
  // Create gentle slopes leading to lake
  if (lakeDist > 25 && lakeDist < 40) {
    const slopeFactor = (lakeDist - 25) / 15;
    height = height * (1 - slopeFactor * 0.3);
  }
  
  // Terrain near family campsite (z ≈ -65) - NEAR WATERFALL AND LAKE
  const campDist = Math.sqrt((x - 7) * (x - 7) + (z + 65) * (z + 65));
  if (campDist < 30) {
    const campFactor = 1 - campDist / 30;
    // Flatten area for campfire clearing
    height = THREE.MathUtils.lerp(height, 0, campFactor * 0.9);
  }
  
  // Determine material based on height
  let color: string;
  let roughness: number;
  
  if (height < -1) {
    // Lake bed / wet soil
    color = "#4a3f35";
    roughness = 0.9;
  } else if (height < 2) {
    // Dark forest floor
    color = "#2d4a2d";
    roughness = 0.85;
  } else if (height < 6) {
    // Grass
    color = "#3d6a3d";
    roughness = 0.8;
  } else if (height < 12) {
    // Lighter grass / meadow
    color = "#4a7a4a";
    roughness = 0.75;
  } else if (height < 20) {
    // Forest edge
    color = "#3a5a3a";
    roughness = 0.85;
  } else if (height < 35) {
    // Rocky terrain
    color = "#5a5a55";
    roughness = 0.95;
  } else {
    // Mountain rock
    color = "#6a6a65";
    roughness = 1.0;
  }
  
  return { height, color, roughness };
}

// ─── Generate terrain geometry ───────────────────────────────────────────────
function generateTerrainGeometry(): THREE.BufferGeometry {
  const segments = 150;
  const size = 800;
  const geo = new THREE.PlaneGeometry(size, size * 1.5, segments, segments * 2);
  geo.rotateX(-Math.PI / 2);
  
  const positions = geo.attributes.position.array as Float32Array;
  const colors = new Float32Array(positions.length);
  
  for (let k = 0; k < positions.length; k += 3) {
    const x = positions[k];
    const z = positions[k + 2];
    
    const result = getTerrainHeight(x, z);
    positions[k + 1] = result.height;
    
    // Parse color and set vertex colors
    const color = new THREE.Color(result.color);
    colors[k] = color.r;
    colors[k + 1] = color.g;
    colors[k + 2] = color.b;
  }
  
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  
  return geo;
}

// ─── Main Terrain Component ───────────────────────────────────────────────────
export function Terrain() {
  const geometry = useMemo(() => generateTerrainGeometry(), []);
  
  return (
    <mesh geometry={geometry} receiveShadow position={[0, 0, -150]}>
      <meshStandardMaterial 
        vertexColors 
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  );
}

// ─── Distant Mountains ────────────────────────────────────────────────────────
export function Mountains() {
  const mountRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mountCount = 60;

  const mountains = useMemo(() => {
    const data: Array<{ x: number; z: number; height: number; width: number; colorIndex: number; sides: number }> = [];
    const rng = seededRandom(999);
    
    for (let i = 0; i < mountCount; i++) {
      const z = -100 + rng() * -500;
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (150 + rng() * 200);
      const height = 80 + rng() * 160;
      const width = 60 + rng() * 120;
      const sides = 6 + Math.floor(rng() * 3);
      data.push({ x, z, height, width, colorIndex: i % 3, sides });
    }
    return data;
  }, []);
  
  useEffect(() => {
    if (!mountRef.current) return;

    const colors = ["#4a5a6a", "#5a6a5a", "#4a4a5a"];

    mountains.forEach((m, i) => {
      dummy.position.set(m.x, m.height / 2 - 20, m.z);
      dummy.scale.set(m.width / 2, m.height, m.width / 2);
      dummy.updateMatrix();
      mountRef.current!.setMatrixAt(i, dummy.matrix);

      const mColor = new THREE.Color(colors[m.colorIndex]);
      mountRef.current!.setColorAt(i, mColor);
    });

    mountRef.current.instanceMatrix.needsUpdate = true;
    if (mountRef.current.instanceColor) mountRef.current.instanceColor.needsUpdate = true;
  }, [mountains, dummy]);

  return (
    <group position={[0, 0, -200]}>
      <instancedMesh ref={mountRef} args={[new THREE.ConeGeometry(1, 1, 6), undefined, mountCount]} castShadow>
        <meshStandardMaterial roughness={0.9} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}

// ─── Environment Props (trees, rocks, vegetation) ─────────────────────────────
export function EnvironmentProps() {
  const treeCount = 40;
  
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);

  const { treeData } = useMemo(() => {
    const tData: any[] = [];
    const rng = seededRandom(1111);
    
    // Create a clear corridor down the Z axis (X from -10 to +10 is clear)
    // Avoid Z = -15 to Z = -20 for the family campsite
    
    for (let i = 0; i < treeCount; i++) {
      let x = 0;
      let z = 0;
      let valid = false;
      let attempts = 0;
      
      while (!valid && attempts < 50) {
        attempts++;
        z = -30 + rng() * -380; // From lake to tree
        const side = rng() > 0.5 ? 1 : -1;
        x = side * (20 + rng() * 60); // Keep corridor clear
        
        // Exclude family campsite area (z ≈ -65, x ≈ 7) - WIDER CLEARING
        const distToFamily = Math.hypot(x - 7, z - (-65));
        if (distToFamily < 40) continue; // Increased to 40 for bigger clearing
        
        valid = true;
      }
      
      if (valid) {
        tData.push({ 
          x, 
          z, 
          height: 35 + rng() * 40, // Taller, majestic trees
          rotation: rng() * Math.PI * 2, 
          scale: 1.2 + rng() * 1.5 
        });
      }
    }
    return { treeData: tData };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!trunkRef.current || !foliageRef.current) return;

    treeData.forEach((prop, i) => {
      const terrainY = getTerrainHeight(prop.x, prop.z).height;
      const h = prop.height * prop.scale;
      const trunkRadius = 1.5 * prop.scale;

      // Trunk
      dummy.position.set(prop.x, terrainY + h * 0.4, prop.z);
      dummy.rotation.set(0, prop.rotation, 0);
      dummy.scale.set(trunkRadius, h * 0.8, trunkRadius);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      // Single large foliage canopy (simplified high-quality look)
      dummy.position.set(prop.x, terrainY + h * 0.85, prop.z);
      dummy.rotation.set(0, prop.rotation, 0);
      dummy.scale.set(12 * prop.scale, h * 0.4, 12 * prop.scale);
      dummy.updateMatrix();
      foliageRef.current!.setMatrixAt(i, dummy.matrix);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    foliageRef.current.instanceMatrix.needsUpdate = true;
  }, [treeData, dummy]);

  return (
    <group position={[0, 0, 0]}>
      {/* Detailed Trunk */}
      <instancedMesh ref={trunkRef} args={[new THREE.CylinderGeometry(0.7, 1, 1, 8), undefined, treeData.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#423121" roughness={0.9} />
      </instancedMesh>

      {/* Layered Foliage Canopy */}
      <instancedMesh ref={foliageRef} args={[new THREE.DodecahedronGeometry(1, 1), undefined, treeData.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#2d4a22" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// ─── Helper to get terrain height for positioning ─────────────────────────────
export function getTerrainYAt(x: number, z: number): number {
  return getTerrainHeight(x, z).height;
}

// ─── Atmospheric mist (subtle, not blocking) ──────────────────────────────────
export function Atmosphere() {
  return (
    <>
      {/* Subtle ground mist */}
      {Array.from({ length: 8 }).map((_, i) => {
        const z = -40 - i * 55;
        return (
          <mesh
            key={`mist-${i}`}
            position={[0, -4, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[200, 80]} />
            <meshBasicMaterial
              color="#4A7A55"
              transparent
              opacity={0.06}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

// ─── Fireflies / atmospheric particles ─────────────────────────────────────────
export function Fireflies() {
  const pointsRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const z = -Math.random() * 500;
      const x = (Math.random() - 0.5) * 120;
      const y = 1 + Math.random() * 18;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Warm amber/golden colors
      colors[i * 3] = 0.85 + Math.random() * 0.15;
      colors[i * 3 + 1] = 0.65 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.25 + Math.random() * 0.15;
    }
    return { positions, colors, count };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      pointsRef.current.position.y = Math.sin(time * 0.15) * 0.8;
      pointsRef.current.rotation.y = time * 0.008;
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
        size={0.5}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}
