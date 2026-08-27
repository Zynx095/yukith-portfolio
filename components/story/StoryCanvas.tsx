"use client";

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Environment, Float, Html, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

type StoryCanvasProps = {
  scrollYProgress: any; // Framer motion MotionValue
};

// Abstract procedural 3D elements for the story

const HolographicFace = ({ scrollProgress }: { scrollProgress: number }) => {
  const headRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!headRef.current) return;
    
    // Position the head slightly below and in front of the camera
    const cameraPos = state.camera.position;
    
    // Calculate a target position relative to the camera
    // Camera looks towards negative Z. We place the head at Z - 3
    const targetZ = cameraPos.z - 3;
    const targetY = cameraPos.y - 1.5;
    const targetX = cameraPos.x;
    
    // Smoothly follow the camera
    headRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.1);
    
    // Slowly rotate to look holographic and mystical
    headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    headRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
  });
  
  return (
    <group ref={headRef as any}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh>
          <icosahedronGeometry args={[0.5, 2]} />
          <meshStandardMaterial color="#B99755" wireframe transparent opacity={0.6} emissive="#B99755" emissiveIntensity={0.5} toneMapped={false} />
        </mesh>
        <mesh scale={0.8}>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial color="#315D39" wireframe transparent opacity={0.3} emissive="#12351F" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        
        {/* Glowing eyes/core */}
        <mesh position={[-0.15, 0.1, 0.4]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#F4F1EA" />
        </mesh>
        <mesh position={[0.15, 0.1, 0.4]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#F4F1EA" />
        </mesh>
      </Float>
    </group>
  );
};

// Procedural Tree Climax
const MassiveTree = ({ scrollProgress }: { scrollProgress: number }) => {
  const trunkRef = useRef<THREE.Mesh>(null);
  const canopy1Ref = useRef<THREE.Mesh>(null);
  const canopy2Ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = Math.max(0, (scrollProgress - 0.85) / 0.15); // Progress from 85% to 100%
    if (trunkRef.current) {
      trunkRef.current.scale.set(1 + p * 5, p * 15, 1 + p * 5); // Huge growth
      trunkRef.current.position.y = -10 + (p * 15) / 2;
    }
    if (canopy1Ref.current && canopy2Ref.current) {
      canopy1Ref.current.scale.setScalar(p * 20);
      canopy1Ref.current.position.y = -10 + p * 15 + p * 5;
      canopy1Ref.current.rotation.y += 0.005;

      canopy2Ref.current.scale.setScalar(p * 15);
      canopy2Ref.current.position.y = -10 + p * 15 + p * 10;
      canopy2Ref.current.rotation.y -= 0.003;
    }
  });

  return (
    <group position={[0, -10, -320]}>
      {/* Trunk */}
      <mesh ref={trunkRef as any}>
        <cylinderGeometry args={[1, 1.2, 1, 8, 1, true]} />
        <meshStandardMaterial color="#0B2116" roughness={1} wireframe={true} />
      </mesh>
      
      {/* Canopy Layers */}
      <mesh ref={canopy1Ref as any}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#12351F" roughness={0.8} transparent opacity={0.8} wireframe />
      </mesh>
      <mesh ref={canopy2Ref as any}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#315D39" roughness={0.6} transparent opacity={0.6} wireframe />
      </mesh>
    </group>
  );
};

const Scene = ({ scrollYProgress }: { scrollYProgress: any }) => {
  const [scrollP, setScrollP] = useState(0);

  useEffect(() => {
    return scrollYProgress.onChange((v: number) => setScrollP(v));
  }, [scrollYProgress]);

  useFrame((state) => {
    // Scroll progress maps from 0 to 1
    // Camera travels from Z = 10 down to Z = -330
    const targetZ = 10 - scrollP * 340; 
    
    // Smooth camera interpolation
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    
    // Add subtle cinematic sway (wobble based on time and scroll)
    const swayX = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    const swayY = Math.cos(state.clock.elapsedTime * 0.3) * 0.5;
    
    // Camera look target shifts slightly as you scroll (to simulate looking around)
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, swayX + Math.sin(scrollP * Math.PI * 4) * 5, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, swayY + Math.cos(scrollP * Math.PI * 2) * 2, 0.05);
    
    // Camera always looks ahead, but slightly off-center for cinematic feel
    const lookAtZ = state.camera.position.z - 20;
    state.camera.lookAt(
      swayX * 0.5 + Math.sin(scrollP * Math.PI * 4) * 2,
      swayY * 0.5,
      lookAtZ
    );
  });

  return (
    <>
      <ambientLight intensity={Math.max(0.2, 1 - scrollP * 2)} color="#B99755" />
      <directionalLight position={[10, 20, 5]} intensity={1} color="#315D39" />
      <pointLight position={[0, 0, -50]} intensity={2} color="#E3CB8A" distance={30} />
      <pointLight position={[0, 0, -150]} intensity={3} color="#1D4A2B" distance={50} />
      <pointLight position={[0, 0, -310]} intensity={5} color="#F4F1EA" distance={100} />

      <fog attach="fog" args={['#0D0A08', 5, 40]} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* The new Holographic Narrator */}
      <HolographicFace scrollProgress={scrollP} />

      {/* Zone 1-2: Childhood & School (Z: -20 to -40) */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <group position={[3, 0, -30]}>
           <mesh rotation={[0.2, 0.5, 0]}>
             <boxGeometry args={[4, 0.5, 3]} />
             <meshStandardMaterial color="#51321E" roughness={0.8} />
           </mesh>
           <mesh position={[-1, 1, 0]} rotation={[0, 0.2, 0.1]}>
             <boxGeometry args={[1.5, 0.2, 2]} />
             <meshStandardMaterial color="#D8C9A8" roughness={1} />
           </mesh>
        </group>
      </Float>

      {/* Zone 4: First Computer (Z: -80) */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[-4, 1, -80]}>
           <mesh>
             <boxGeometry args={[3, 3, 3]} />
             <meshStandardMaterial color="#1E150F" />
           </mesh>
           <mesh position={[0, 0, 1.6]}>
             <planeGeometry args={[2.5, 2.5]} />
             <meshBasicMaterial color="#315D39" toneMapped={false} />
           </mesh>
        </group>
      </Float>

      {/* Zone 6-7: University & Engineering (Z: -120 to -160) */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={`node-${i}`} position={[(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, -120 - Math.random() * 40]}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#B99755" wireframe />
        </mesh>
      ))}

      {/* Zone 8: Projects (Z: -180 to -220) */}
      <Float speed={3} rotationIntensity={2} floatIntensity={2}>
        <group position={[5, -2, -190]}>
           <mesh>
             <torusGeometry args={[2, 0.1, 16, 100]} />
             <meshStandardMaterial color="#1D4A2B" emissive="#315D39" emissiveIntensity={5} toneMapped={false} />
           </mesh>
           <mesh rotation={[Math.PI / 2, 0, 0]}>
             <torusGeometry args={[2, 0.1, 16, 100]} />
             <meshStandardMaterial color="#12351F" emissive="#1D4A2B" emissiveIntensity={2} toneMapped={false} />
           </mesh>
        </group>
      </Float>

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      {/* The Final Climax Tree (Z: -320) */}
      <MassiveTree scrollProgress={scrollP} />
    </>
  );
};

export function StoryCanvas({ scrollYProgress }: StoryCanvasProps) {
  return (
    <div className="absolute inset-0 z-0 bg-[#0D0A08]">
      <Canvas camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 100 }}>
        <Scene scrollYProgress={scrollYProgress} />
      </Canvas>
    </div>
  );
}
