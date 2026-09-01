"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function createNebulaTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Deep purple base
  ctx.fillStyle = "#12091F";
  ctx.fillRect(0, 0, size, size);

  // Nebula clouds
  const rand = (() => {
    let s = 42;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  })();

  for (let i = 0; i < 20; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 60 + rand() * 120;
    const colors = [
      "rgba(48, 22, 77, 0.15)",
      "rgba(59, 29, 94, 0.12)",
      "rgba(36, 16, 61, 0.18)",
      "rgba(75, 42, 120, 0.1)",
      "rgba(90, 50, 140, 0.08)",
      "rgba(25, 60, 100, 0.1)",
    ];
    const color = colors[Math.floor(rand() * colors.length)];
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createStarTexture() {
  if (typeof window === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  const rand = (() => {
    let s = 99;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  })();

  for (let i = 0; i < 200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.3 + rand() * 1.2;
    const brightness = 0.3 + rand() * 0.7;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 180, 255, ${brightness})`;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function CosmicBackground() {
  const nebulaRef = useRef<THREE.Mesh>(null);
  const starsFarRef = useRef<THREE.Points>(null);
  const starsMidRef = useRef<THREE.Points>(null);
  const starsNearRef = useRef<THREE.Points>(null);

  const nebulaTexture = useMemo(() => createNebulaTexture(), []);
  const starTexture = useMemo(() => createStarTexture(), []);

  // Generate star positions for multiple layers
  const starLayers = useMemo(() => {
    const layers = [];
    const counts = [800, 400, 150];
    const distances = [300, 200, 120];

    for (let l = 0; l < 3; l++) {
      const positions = new Float32Array(counts[l] * 3);
      const sizes = new Float32Array(counts[l]);
      for (let i = 0; i < counts[l]; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = distances[l] + (Math.random() - 0.5) * 80;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        sizes[i] = l === 0 ? 0.5 + Math.random() * 1 : l === 1 ? 1 + Math.random() * 1.5 : 1.5 + Math.random() * 2;
      }
      layers.push({ positions, sizes, counts: counts[l] });
    }
    return layers;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Slow nebula rotation
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z = time * 0.003;
    }

    // Subtle star drift
    if (starsFarRef.current) {
      starsFarRef.current.rotation.y = time * 0.002;
      starsFarRef.current.rotation.x = Math.sin(time * 0.001) * 0.02;
    }
    if (starsMidRef.current) {
      starsMidRef.current.rotation.y = time * 0.004;
      starsMidRef.current.rotation.x = Math.cos(time * 0.0015) * 0.03;
    }
    if (starsNearRef.current) {
      starsNearRef.current.rotation.y = time * 0.006;
    }
  });

  return (
    <group>
      {/* Nebula backdrop - large plane far behind everything */}
      <mesh ref={nebulaRef} position={[0, 0, -400]}>
        <planeGeometry args={[800, 600]} />
        <meshBasicMaterial
          map={nebulaTexture}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>

      {/* Secondary nebula layer for depth */}
      <mesh position={[-100, 50, -350]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[400, 300]} />
        <meshBasicMaterial
          map={nebulaTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Star layers */}
      {starLayers.map((layer, i) => (
        <points
          key={`stars-${i}`}
          ref={i === 0 ? starsFarRef : i === 1 ? starsMidRef : starsNearRef}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[layer.positions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            map={starTexture}
            size={i === 0 ? 1.5 : i === 1 ? 2.5 : 3.5}
            sizeAttenuation
            transparent
            opacity={i === 0 ? 0.6 : i === 1 ? 0.8 : 1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            color={i === 0 ? "#8877AA" : i === 1 ? "#AA99CC" : "#CCBBEE"}
          />
        </points>
      ))}

      {/* Cosmic dust particles */}
      <CosmicDust />
    </group>
  );
}

function CosmicDust() {
  const dustRef = useRef<THREE.Points>(null);

  const dustData = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = -50 - Math.random() * 200;
    }
    return { positions, count };
  }, []);

  useFrame((state) => {
    if (dustRef.current) {
      dustRef.current.rotation.z = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[dustData.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#7755AA"
      />
    </points>
  );
}
