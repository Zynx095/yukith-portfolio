"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ====== CHILDHOOD ZONE ======
export function ZoneChildhood() {
  const groupRef = useRef<THREE.Group>(null);
  const fireLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (fireLightRef.current) {
      // Flickering fire light
      fireLightRef.current.intensity = 4 + Math.sin(state.clock.elapsedTime * 3) * 1 + Math.sin(state.clock.elapsedTime * 7) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[-3, -2, -50]}>
      {/* Campfire pit */}
      <group position={[0, 0, 0]}>
        <pointLight ref={fireLightRef} color="#FF8844" intensity={4} distance={25} castShadow />
        
        {/* Fire glow */}
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#FF6622" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        
        {/* Stones */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          return (
            <mesh key={`stone-${i}`} position={[Math.cos(angle) * 1.5, 0.3, Math.sin(angle) * 1.5]}>
              <dodecahedronGeometry args={[0.4, 0]} />
              <meshStandardMaterial color="#3A3530" roughness={1} flatShading />
            </mesh>
          );
        })}
      </group>

      {/* Ruined shelter */}
      <group position={[-8, 0, 4]}>
        <mesh position={[0, 2.5, 0]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[5, 5, 0.4]} />
          <meshStandardMaterial color="#2A2015" roughness={1} flatShading />
        </mesh>
        <mesh position={[3, 2, 0]}>
          <boxGeometry args={[0.4, 4, 5]} />
          <meshStandardMaterial color="#2A2015" roughness={1} flatShading />
        </mesh>
        {/* Roof beams */}
        <mesh position={[0, 5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 7, 5]} />
          <meshStandardMaterial color="#1A1510" roughness={1} flatShading />
        </mesh>
      </group>

      {/* Old desk with papers */}
      <group position={[10, 0, -2]}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[4, 0.3, 2.5]} />
          <meshStandardMaterial color="#3A2A1A" roughness={0.9} flatShading />
        </mesh>
        {/* Legs */}
        {[[-1.8, -0.5, -1], [1.8, -0.5, -1], [-1.8, -0.5, 1], [1.8, -0.5, 1]].map((pos, i) => (
          <mesh key={`leg-${i}`} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.12, 0.12, 1, 5]} />
            <meshStandardMaterial color="#3A2A1A" roughness={0.9} flatShading />
          </mesh>
        ))}
        {/* Papers */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`paper-${i}`} position={[(Math.random() - 0.5) * 3, 1.2, (Math.random() - 0.5) * 2]} rotation={[0, Math.random() * Math.PI, 0]}>
            <planeGeometry args={[0.5, 0.7]} />
            <meshStandardMaterial color="#D8C8A8" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ====== FIRST TECH ZONE ======
export function ZoneFirstTech() {
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const screenLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (screenRef.current) {
      const flicker = 0.7 + Math.sin(state.clock.elapsedTime * 10) * 0.1 + Math.random() * 0.1;
      (screenRef.current.material as THREE.MeshBasicMaterial).opacity = flicker;
    }
    if (screenLightRef.current) {
      screenLightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 5) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[8, -2, -100]}>
      {/* Workshop shell */}
      <group position={[0, 0, 0]}>
        {/* Back wall */}
        <mesh position={[0, 3, -5]} rotation={[0, 0, 0]}>
          <boxGeometry args={[14, 7, 0.4]} />
          <meshStandardMaterial color="#1A1510" roughness={1} flatShading />
        </mesh>
        
        {/* CRT Monitor on workbench */}
        <group position={[0, 1.5, 0]}>
          {/* Workbench */}
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[5, 0.3, 3]} />
            <meshStandardMaterial color="#3A2A1A" roughness={0.9} flatShading />
          </mesh>
          
          {/* CRT casing */}
          <mesh position={[0, 1.5, 0.5]}>
            <boxGeometry args={[2.5, 2, 2]} />
            <meshStandardMaterial color="#0A0A0A" roughness={0.5} metalness={0.3} />
          </mesh>
          
          {/* Screen */}
          <mesh ref={screenRef} position={[0, 1.5, 1.55]}>
            <planeGeometry args={[2, 1.5]} />
            <meshBasicMaterial color="#00FF44" transparent opacity={0.8} />
          </mesh>
          
          {/* Scanlines */}
          {Array.from({ length: 15 }).map((_, i) => (
            <mesh key={`scan-${i}`} position={[0, 1.5, 1.56]} rotation={[0, 0, 0]}>
              <planeGeometry args={[2, 0.03]} />
              <meshBasicMaterial color="#00FF44" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
        
        {/* Cables and scraps */}
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
      
      {/* Green screen glow */}
      <pointLight ref={screenLightRef} color="#00FF44" intensity={2} distance={15} position={[0, 2, 2]} />
    </group>
  );
}

// ====== UNIVERSITY ZONE ======
export function ZoneUniversity() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[-12, -2, -150]}>
      {/* Academy towers */}
      <group>
        {/* Left tower */}
        <mesh position={[-7, 10, 0]}>
          <cylinderGeometry args={[2.5, 3, 20, 6]} />
          <meshStandardMaterial color="#2A2520" roughness={1} flatShading />
        </mesh>
        
        {/* Right tower */}
        <mesh position={[7, 10, 0]}>
          <cylinderGeometry args={[2.5, 3, 20, 6]} />
          <meshStandardMaterial color="#2A2520" roughness={1} flatShading />
        </mesh>
        
        {/* Archway */}
        <mesh position={[0, 18, 0]}>
          <boxGeometry args={[14, 2, 4]} />
          <meshStandardMaterial color="#2A2520" roughness={1} flatShading />
        </mesh>
        
        {/* Ground */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[20, 0.2, 30]} />
          <meshStandardMaterial color="#3A3530" roughness={0.9} flatShading />
        </mesh>
      </group>
      
      {/* Floating manuscripts */}
      {Array.from({ length: 15 }).map((_, i) => {
        const angle = (i / 15) * Math.PI * 2;
        const radius = 10 + Math.sin(i * 2) * 4;
        return (
          <mesh
            key={`manuscript-${i}`}
            position={[Math.cos(angle) * radius, 8 + Math.sin(i * 1.5) * 4, Math.sin(angle) * radius]}
            rotation={[Math.sin(i) * 0.5, angle, Math.cos(i) * 0.3]}
          >
            <planeGeometry args={[2, 2.5]} />
            <meshStandardMaterial color="#D8C8A8" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

// ====== AURA ZONE ======
export function ZoneAURA() {
  const groupRef = useRef<THREE.Group>(null);
  const cameraTarget = useRef<THREE.Object3D>(null);

  useFrame((state) => {
    if (cameraTarget.current) {
      // Slow rotation
      cameraTarget.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[18, -2, -200]}>
      {/* Fortress walls */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[25, 8, 2]} />
        <meshStandardMaterial color="#1A2015" roughness={1} flatShading />
      </mesh>
      
      {/* Watchtowers */}
      {[[-10, 0], [10, 0]].map((pos, i) => (
        <mesh key={`tower-${i}`} position={[pos[0], 6, 0]}>
          <cylinderGeometry args={[1.5, 2, 12, 6]} />
          <meshStandardMaterial color="#1A2015" roughness={1} flatShading />
        </mesh>
      ))}
      
      {/* Central surveillance dome */}
      <group position={[0, 5, 3]}>
        <mesh ref={cameraTarget}>
          <sphereGeometry args={[2.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0D100A" roughness={0.3} metalness={0.8} />
        </mesh>
        
        {/* Lens glow */}
        <mesh position={[0, 0, 2.6]}>
          <circleGeometry args={[0.8, 16]} />
          <meshBasicMaterial color="#00FF64" transparent opacity={0.9} />
        </mesh>
      </group>
      
      {/* Green atmospheric light */}
      <pointLight color="#00FF64" intensity={4} distance={25} position={[0, 5, 3]} />
    </group>
  );
}

// ====== ETTH ZONE ======
export function ZoneETTH() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[-15, -2, -250]}>
      {/* Network facility */}
      <group>
        {/* Pillars */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 10;
          return (
            <mesh key={`pillar-${i}`} position={[Math.cos(angle) * radius, 5, Math.sin(angle) * radius]}>
              <cylinderGeometry args={[0.8, 1.2, 10, 6]} />
              <meshStandardMaterial color="#1A2030" roughness={1} flatShading />
            </mesh>
          );
        })}
        
        {/* Central core */}
        <mesh position={[0, 4, 0]}>
          <icosahedronGeometry args={[2.5, 1]} />
          <meshStandardMaterial color="#0A1520" wireframe roughness={1} />
        </mesh>
        
        {/* Connection beams */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={`beam-${i}`} position={[Math.cos(angle) * 5, 4, Math.sin(angle) * 5]} rotation={[0, angle, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 5, 4]} />
              <meshStandardMaterial color="#00B4FF" transparent opacity={0.4} />
            </mesh>
          );
        })}
      </group>
      
      {/* Cyan glow */}
      <pointLight color="#00B4FF" intensity={3} distance={25} position={[0, 4, 0]} />
    </group>
  );
}

// ====== SHADOWGUARD ZONE ======
export function ZoneShadowGuard() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[20, -2, -300]}>
      {/* Vault entrance */}
      <group>
        {/* Main structure */}
        <mesh position={[0, 6, 0]}>
          <boxGeometry args={[16, 12, 8]} />
          <meshStandardMaterial color="#1A1520" roughness={1} flatShading />
        </mesh>
        
        {/* Shield emblem */}
        <mesh position={[0, 8, 4.1]}>
          <planeGeometry args={[6, 8]} />
          <meshStandardMaterial color="#2A2A3A" roughness={0.5} metalness={0.3} />
        </mesh>
        
        {/* Document silhouettes around */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 8;
          return (
            <mesh key={`doc-${i}`} position={[Math.cos(angle) * radius, 5, Math.sin(angle) * radius]} rotation={[0, angle, 0]}>
              <planeGeometry args={[2, 3]} />
              <meshStandardMaterial color="#2A2A3A" roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      </group>
      
      {/* Purple glow */}
      <pointLight color="#A5B4FC" intensity={3} distance={25} position={[0, 6, 0]} />
    </group>
  );
}

// ====== SUGAR AI ZONE ======
export function ZoneSugarAI() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle rotation of wave rings
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[-18, -2, -350]}>
      {/* Sound chamber */}
      <group>
        {/* Concentric wave rings */}
        {Array.from({ length: 6 }).map((_, i) => {
          const radius = 3 + i * 2.5;
          return (
            <mesh key={`ring-${i}`} position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius, 0.08, 8, 64]} />
              <meshStandardMaterial color="#93C5FD" transparent opacity={0.5 - i * 0.05} />
            </mesh>
          );
        })}
        
        {/* Central mic structure */}
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[1, 1.5, 4, 8]} />
          <meshStandardMaterial color="#1A1A2A" roughness={0.5} metalness={0.5} />
        </mesh>
        
        {/* Mic head */}
        <mesh position={[0, 5.5, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#2A2A3A" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
      
      {/* Lavender glow */}
      <pointLight color="#93C5FD" intensity={4} distance={25} position={[0, 4, 0]} />
    </group>
  );
}

// ====== ACHIEVEMENTS ZONE ======
export function ZoneAchievement() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[10, -2, -400]}>
      {/* Monument wall */}
      <group>
        {/* Main wall */}
        <mesh position={[0, 10, 0]}>
          <boxGeometry args={[30, 20, 2]} />
          <meshStandardMaterial color="#2A2520" roughness={1} flatShading />
        </mesh>
        
        {/* Gold accent stripe */}
        <mesh position={[0, 10, 1.05]}>
          <boxGeometry args={[28, 0.5, 0.1]} />
          <meshStandardMaterial color="#B99755" roughness={0.3} metalness={0.5} />
        </mesh>
        
        {/* Achievement markers */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 4 + i * 3;
          return (
            <mesh key={`marker-${i}`} position={[0, y, 1.1]}>
              <octahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial color="#E3CB8A" emissive="#B99755" emissiveIntensity={0.3} />
            </mesh>
          );
        })}
        
        {/* Side pillars */}
        <mesh position={[-15, 10, 0]}>
          <boxGeometry args={[2, 22, 2]} />
          <meshStandardMaterial color="#2A2520" roughness={1} flatShading />
        </mesh>
        <mesh position={[15, 10, 0]}>
          <boxGeometry args={[2, 22, 2]} />
          <meshStandardMaterial color="#2A2520" roughness={1} flatShading />
        </mesh>
      </group>
      
      {/* Golden glow */}
      <pointLight color="#E3CB8A" intensity={3} distance={30} position={[0, 10, 5]} />
    </group>
  );
}

// ====== LEADERSHIP ZONE ======
export function ZoneLeadership() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[-12, -2, -425]}>
      {/* Guild hall structure */}
      <group>
        {/* Main pillar */}
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[1.5, 2, 12, 6]} />
          <meshStandardMaterial color="#1A2A15" roughness={1} flatShading />
        </mesh>
        
        {/* Branches */}
        {[
          { pos: [4, 8, 0] as [number, number, number], rot: [0, 0, -0.4] as [number, number, number] },
          { pos: [-4, 7, 0] as [number, number, number], rot: [0, 0, 0.4] as [number, number, number] },
          { pos: [3, 10, 0] as [number, number, number], rot: [0, 0, -0.2] as [number, number, number] },
          { pos: [-3, 9, 0] as [number, number, number], rot: [0, 0, 0.3] as [number, number, number] },
        ].map((b, i) => (
          <mesh key={`branch-${i}`} position={b.pos} rotation={b.rot}>
            <cylinderGeometry args={[0.4, 0.3, 5, 5]} />
            <meshStandardMaterial color="#1A2A15" roughness={1} flatShading />
          </mesh>
        ))}
      </group>
      
      {/* Forest green glow */}
      <pointLight color="#315D39" intensity={3} distance={20} position={[0, 6, 0]} />
    </group>
  );
}

// ====== EXPERIENCE ZONE ======
export function ZoneExperience() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[12, -2, -425]}>
      {/* Experience pillars */}
      <group>
        {/* Left pillar */}
        <mesh position={[-5, 8, 0]}>
          <cylinderGeometry args={[2, 2.5, 16, 6]} />
          <meshStandardMaterial color="#2A2015" roughness={1} flatShading />
        </mesh>
        
        {/* Right pillar */}
        <mesh position={[5, 8, 0]}>
          <cylinderGeometry args={[2, 2.5, 16, 6]} />
          <meshStandardMaterial color="#2A2015" roughness={1} flatShading />
        </mesh>
        
        {/* Connecting beam */}
        <mesh position={[0, 15, 0]}>
          <boxGeometry args={[12, 1.5, 2]} />
          <meshStandardMaterial color="#2A2015" roughness={1} flatShading />
        </mesh>
        
        {/* Gold accents */}
        <mesh position={[-5, 15, 1.1]}>
          <boxGeometry args={[0.3, 1, 0.3]} />
          <meshStandardMaterial color="#B99755" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[5, 15, 1.1]}>
          <boxGeometry args={[0.3, 1, 0.3]} />
          <meshStandardMaterial color="#B99755" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>
      
      {/* Warm golden glow */}
      <pointLight color="#B99755" intensity={4} distance={25} position={[0, 10, 0]} />
    </group>
  );
}
