"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useInteractionContext } from "@/hooks/useInteraction";

// ─── SHARED MATERIALS ────────────────────────────────────────────────────────
const matDarkMetal = new THREE.MeshStandardMaterial({ color: "#1a1a24", roughness: 0.3, metalness: 0.8 });
const matGold = new THREE.MeshStandardMaterial({ color: "#d4af37", roughness: 0.2, metalness: 1.0 });
const matSilver = new THREE.MeshStandardMaterial({ color: "#c0c0c0", roughness: 0.3, metalness: 0.9 });
const matWood = new THREE.MeshStandardMaterial({ color: "#4a2f1d", roughness: 0.9, metalness: 0.1 });

// Helper to create glowing emissive materials
function createGlowMat(color: string, intensity: number = 2) {
  return new THREE.MeshStandardMaterial({ 
    color, 
    emissive: color, 
    emissiveIntensity: intensity, 
    toneMapped: false 
  });
}

const glowCyan = createGlowMat("#00ffff");
const glowBlue = createGlowMat("#4da6ff");
const glowGreen = createGlowMat("#00ff66");
const glowOrange = createGlowMat("#ff8c00");

// ─── BASE ARTIFACT WRAPPER ────────────────────────────────────────────────────
interface ArtifactProps {
  id: string;
  position: [number, number, number];
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function ArtifactWrapper({ id, position, title, subtitle, children }: ArtifactProps) {
  const { openPanel } = useInteractionContext();
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const wrapperRef = useRef<THREE.Group>(null);

  // Subtle floating animation
  useFrame((state) => {
    if (!wrapperRef.current) return;
    const time = state.clock.elapsedTime;
    wrapperRef.current.position.y = Math.sin(time * 1.5 + position[1]) * 0.5;
    
    // Scale on hover
    const targetScale = hovered ? 1.05 : 1.0;
    wrapperRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group position={position} rotation={[Math.PI / 8, 0, 0]}>

      {/* Artifact content */}
      <group
        ref={wrapperRef}
        onClick={(e) => {
          e.stopPropagation();
          openPanel(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <group ref={groupRef}>{children}</group>
        
        {/* Subtle Label */}
        <Html transform distanceFactor={15} position={[0, 4, 0]} center className="pointer-events-none transition-opacity duration-300" style={{ opacity: hovered ? 1 : 0.6 }}>
          <div className="bg-[#0f0a05]/80 border border-[#E3CB8A]/30 px-3 py-1.5 rounded text-center backdrop-blur-md min-w-[150px]">
            <div className="text-[#E3CB8A] font-bold text-sm tracking-wider uppercase">{title}</div>
            <div className="text-[#a09c95] text-xs font-light tracking-widest mt-0.5">{subtitle}</div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── 1. AURA (Surveillance Drone) ──────────────────────────────────────────────
export function ArtifactAURA({ position }: { position: [number, number, number] }) {
  const coreRef = useRef<THREE.Group>(null);
  const scannerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!coreRef.current || !scannerRef.current) return;
    const time = state.clock.elapsedTime;
    // Slow hovering rotation
    coreRef.current.rotation.y = time * 0.2;
    // Scanner sweep
    scannerRef.current.rotation.x = Math.sin(time * 3) * 0.3;
  });

  return (
    <ArtifactWrapper id="aura" position={position} title="AURA" subtitle="Autonomous Surveillance">
      <group ref={coreRef}>
        {/* Central orb */}
        <mesh material={matDarkMetal} castShadow>
          <sphereGeometry args={[1.5, 16, 16]} />
        </mesh>
        {/* Camera Lens */}
        <mesh position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.5, 16]} />
          <meshStandardMaterial color="#000000" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh ref={scannerRef} position={[0, 0, 1.67]}>
          <circleGeometry args={[0.4, 16]} />
          <primitive object={glowCyan} attach="material" />
        </mesh>
        {/* 4 Drone Arms */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh position={[2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 2.5]} />
              <primitive object={matDarkMetal} attach="material" />
            </mesh>
            {/* Rotor guard */}
            <mesh position={[3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.05, 8, 24]} />
              <primitive object={glowCyan} attach="material" />
            </mesh>
          </group>
        ))}
      </group>
    </ArtifactWrapper>
  );
}

// ─── 2. ETTH (Network / Energy Tower) ──────────────────────────────────────────
export function ArtifactETTH({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const time = state.clock.elapsedTime;
    ringRef.current.rotation.y = time * -0.5;
    ringRef.current.position.y = Math.sin(time * 2) * 0.3;
  });

  return (
    <ArtifactWrapper id="etth" position={position} title="ETTH" subtitle="Network Infrastructure">
      <group>
        {/* Base */}
        <mesh position={[0, -1, 0]} material={matDarkMetal} castShadow>
          <cylinderGeometry args={[1.5, 2, 1, 12]} />
        </mesh>
        {/* Central Energy Core */}
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
          <primitive object={glowBlue} attach="material" />
        </mesh>
        {/* Outer structured tower */}
        <mesh position={[0, 1, 0]} material={matSilver} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 3.5, 4]} />
        </mesh>
        {/* Floating Data Rings */}
        <group ref={ringRef} position={[0, 1, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, (i - 1) * 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.8, 0.05, 8, 32]} />
              <primitive object={glowBlue} attach="material" />
            </mesh>
          ))}
        </group>
      </group>
    </ArtifactWrapper>
  );
}

// ─── 3. ShadowGuard (Cybersecurity Shield) ────────────────────────────────────
export function ArtifactShadowGuard({ position }: { position: [number, number, number] }) {
  const shieldRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!shieldRef.current) return;
    const time = state.clock.elapsedTime;
    shieldRef.current.rotation.y = Math.sin(time * 0.5) * 0.2; // Subtle pivot
    const rings = shieldRef.current.children[1] as THREE.Group;
    rings.rotation.x = time * 0.3;
    rings.rotation.z = time * 0.4;
  });

  return (
    <ArtifactWrapper id="shadowguard" position={position} title="ShadowGuard" subtitle="Cybersecurity Core">
      <group ref={shieldRef}>
        {/* Hexagonal Shield Core */}
        <mesh castShadow material={matDarkMetal}>
          <icosahedronGeometry args={[1.5, 0]} />
        </mesh>
        {/* Protective Forcefield Rings */}
        <group>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[2.2, 0.03, 8, 32]} />
            <primitive object={glowGreen} attach="material" />
          </mesh>
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <torusGeometry args={[2.2, 0.03, 8, 32]} />
            <primitive object={glowGreen} attach="material" />
          </mesh>
        </group>
        {/* Front glowing emblem */}
        <mesh position={[0, 0, 1.3]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <primitive object={glowGreen} attach="material" />
        </mesh>
      </group>
    </ArtifactWrapper>
  );
}

// ─── 4. Sugar AI (Neural Core) ─────────────────────────────────────────────────
export function ArtifactSugarAI({ position }: { position: [number, number, number] }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!coreRef.current || !wireframeRef.current) return;
    const time = state.clock.elapsedTime;
    // Pulsing core
    const scale = 1.0 + Math.sin(time * 4) * 0.05;
    coreRef.current.scale.set(scale, scale, scale);
    // Rotating neural net
    wireframeRef.current.rotation.y = time * 0.3;
    wireframeRef.current.rotation.x = time * 0.15;
  });

  return (
    <ArtifactWrapper id="sugar-ai" position={position} title="Sugar AI" subtitle="Neural Intelligence">
      <group>
        {/* Inner glowing core */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[1, 16, 16]} />
          <primitive object={glowOrange} attach="material" />
        </mesh>
        {/* Outer neural wireframe */}
        <mesh ref={wireframeRef}>
          <icosahedronGeometry args={[1.8, 1]} />
          <meshBasicMaterial color="#ffcc80" wireframe transparent opacity={0.6} />
        </mesh>
      </group>
    </ArtifactWrapper>
  );
}

// ─── 5. Achievements (Trophy) ──────────────────────────────────────────────────
export function ArtifactAchievements({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <ArtifactWrapper id="achievements" position={position} title="Achievements" subtitle="Milestones & Recognition">
      <group ref={groupRef}>
        <mesh position={[0, -0.5, 0]} material={matGold} castShadow>
          <cylinderGeometry args={[0.5, 1.2, 1, 12]} />
        </mesh>
        <mesh position={[0, 1, 0]} material={matGold} castShadow>
          <cylinderGeometry args={[1.5, 0.2, 2, 12]} />
        </mesh>
        <mesh position={[1.5, 1, 0]} rotation={[0, 0, Math.PI / 2]} material={matGold}>
          <torusGeometry args={[0.6, 0.1, 8, 16]} />
        </mesh>
        <mesh position={[-1.5, 1, 0]} rotation={[0, 0, Math.PI / 2]} material={matGold}>
          <torusGeometry args={[0.6, 0.1, 8, 16]} />
        </mesh>
      </group>
    </ArtifactWrapper>
  );
}

// ─── 6. Leadership (Compass) ───────────────────────────────────────────────────
export function ArtifactLeadership({ position }: { position: [number, number, number] }) {
  const needleRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!needleRef.current) return;
    const time = state.clock.elapsedTime;
    // Compass searching for direction
    needleRef.current.rotation.z = Math.sin(time * 0.5) * 0.5 + Math.PI / 4;
  });

  return (
    <ArtifactWrapper id="leadership" position={position} title="Leadership" subtitle="Guiding Innovation">
      <group rotation={[Math.PI / 3, 0, 0]}>
        {/* Base */}
        <mesh material={matSilver} castShadow>
          <cylinderGeometry args={[2, 2.2, 0.4, 32]} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 0.1, 32]} />
          <meshStandardMaterial color="#0f0f1a" roughness={0.5} />
        </mesh>
        {/* Needle */}
        <group ref={needleRef} position={[0, 0.4, 0]}>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.2, 1.6, 4]} />
            <primitive object={glowCyan} attach="material" />
          </mesh>
          <mesh position={[0, -0.8, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.2, 1.6, 4]} />
            <meshStandardMaterial color="#a0a0a0" />
          </mesh>
        </group>
      </group>
    </ArtifactWrapper>
  );
}

// ─── 7. Experience (Archive Scroll) ────────────────────────────────────────────
export function ArtifactExperience({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
  });

  return (
    <ArtifactWrapper id="experience" position={position} title="Experience" subtitle="Professional Journey">
      <group ref={groupRef}>
        {/* Top Roller */}
        <mesh position={[0, 1.5, 0]} material={matWood} castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 3, 16]} />
        </mesh>
        {/* Bottom Roller */}
        <mesh position={[0, -1.5, 0]} material={matWood} castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 3, 16]} />
        </mesh>
        {/* Parchment/Scroll Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <planeGeometry args={[2.6, 3]} />
          <meshStandardMaterial color="#e8dcc8" roughness={1.0} side={THREE.DoubleSide} />
        </mesh>
        {/* Glowing script lines */}
        {[0.8, 0.4, 0, -0.4, -0.8].map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]}>
            <planeGeometry args={[1.8 + Math.random() * 0.4, 0.05]} />
            <primitive object={glowGold} attach="material" />
          </mesh>
        ))}
      </group>
    </ArtifactWrapper>
  );
}

const glowGold = createGlowMat("#ffcc00", 1.5);
