"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Creates atmospheric depth layers that enhance the cosmic environment.
 * These are static parallax layers that add depth without performance cost.
 */
export function EnvironmentDepth() {
  const dustRef = useRef<THREE.Points>(null);
  const mistRef = useRef<THREE.Group>(null);

  const dustData = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {

      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 80 - 10;
      positions[i * 3 + 2] = -Math.random() * 500;

      const isPurple = Math.random() > 0.5;
      colors[i * 3] = isPurple ? 0.3 + Math.random() * 0.2 : 0.7 + Math.random() * 0.2;
      colors[i * 3 + 1] = isPurple ? 0.2 + Math.random() * 0.1 : 0.6 + Math.random() * 0.2;
      colors[i * 3 + 2] = isPurple ? 0.5 + Math.random() * 0.3 : 0.8 + Math.random() * 0.2;
    }
    return { positions, colors, count };
  }, []);

  const mistMeshes = useMemo(() => {
    const meshes = [];
    const count = 15;
    for (let i = 0; i < count; i++) {
      meshes.push({
        position: [
          (Math.random() - 0.5) * 100,
          Math.random() * 30 - 5,
          -Math.random() * 450 - 50
        ],
        scale: 30 + Math.random() * 50,
        opacity: 0.02 + Math.random() * 0.04,
      });
    }
    return meshes;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (dustRef.current) {
      dustRef.current.rotation.y = time * 0.005;
      dustRef.current.position.x = Math.sin(time * 0.1) * 2;
    }
  });

  return (
    <group>
            <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[dustData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.8}
          sizeAttenuation
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
        />
      </points>

            {mistMeshes.map((mist, i) => (
        <mesh
          key={`mist-${i}`}
          position={mist.position as [number, number, number]}
        >
          <planeGeometry args={[mist.scale, mist.scale * 0.4]} />
          <meshBasicMaterial
            color="#4A2D6A"
            transparent
            opacity={mist.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

            <DistantSilhouettes />
    </group>
  );
}

function DistantSilhouettes() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {

      groupRef.current.rotation.y = state.clock.elapsedTime * 0.001;
    }
  });

  const silhouetteData = useMemo(() => {
    const data = [];
    const count = 20;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = -50 - Math.random() * 400;
      const height = 20 + Math.random() * 60;
      const width = 30 + Math.random() * 50;
      data.push({ x, z, height, width });
    }
    return data;
  }, []);

  return (
    <group ref={groupRef} position={[0, -20, -200]}>
      {silhouetteData.map((s, i) => (
        <mesh
          key={`sil-${i}`}
          position={[s.x, s.height / 2, s.z]}
        >
          <coneGeometry args={[s.width / 2, s.height, 4]} />
          <meshBasicMaterial
            color="#0A0510"
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
