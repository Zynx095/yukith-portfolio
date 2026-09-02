"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import { MotionValue } from "framer-motion";

import { CameraRig } from "./CameraRig";
import { GrowthTree } from "../tree/GrowthTree";

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

interface StoryCanvasProps {
  scrollProgress: MotionValue<number>;
}

function AvatarBillboard() {
  const texture = useLoader(THREE.TextureLoader, '/images/avatar.png');
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <Billboard position={[0, 5, -5]}>
      <mesh ref={ref}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial 
          map={texture} 
          transparent 
          emissive="#B99755" 
          emissiveIntensity={0.2}
          side={THREE.DoubleSide} 
        />
      </mesh>
    </Billboard>
  );
}

function ZoneStudy() {
  const lightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const rand = useMemo(() => mulberry32(1), []);

  const particlesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 200;
    const positions = new Float32Array(count * 3);
    for(let i=0; i<count*3; i+=3) {
      positions[i] = (rand() - 0.5) * 10;
      positions[i+1] = rand() * 10;
      positions[i+2] = (rand() - 0.5) * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [rand]);

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 10) * 0.5;
    }
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.005;
        if (positions[i] > 10) positions[i] = 0;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[2, 0, -15]}>
            <mesh position={[0, 3, 0]}>
        <boxGeometry args={[6, 0.2, 3]} />
        <meshStandardMaterial color="#3A2417" />
      </mesh>
            <mesh position={[-2.8, 1.5, -1.3]}><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#15100C" /></mesh>
      <mesh position={[2.8, 1.5, -1.3]}><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#15100C" /></mesh>
      <mesh position={[-2.8, 1.5, 1.3]}><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#15100C" /></mesh>
      <mesh position={[2.8, 1.5, 1.3]}><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#15100C" /></mesh>
      
            <mesh position={[-1, 3.2, 0]}><boxGeometry args={[0.6, 0.1, 0.8]} /><meshStandardMaterial color="#51321E" /></mesh>
      <mesh position={[-1, 3.3, 0.1]} rotation={[0, 0.2, 0]}><boxGeometry args={[0.5, 0.1, 0.7]} /><meshStandardMaterial color="#D8C9A8" /></mesh>

            <mesh position={[2, 3.2, -0.5]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4]} />
        <meshStandardMaterial color="#F4F1EA" emissive="#F4F1EA" emissiveIntensity={0.5} />
      </mesh>
      <pointLight ref={lightRef} position={[2, 3.5, -0.5]} color="#E3CB8A" distance={15} />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={0.5} intensity={5} color="#D8C9A8" />
      
      <points ref={particlesRef} geometry={particlesGeometry}>
        <pointsMaterial size={0.05} color="#D8C9A8" transparent opacity={0.6} />
      </points>
    </group>
  );
}

function ZoneComputer() {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    const dist = camera.position.distanceTo(new THREE.Vector3(-2, 4, -110));
    const active = dist < 20;
    if (screenRef.current && lightRef.current) {
      const targetIntensity = active ? 2 : 0;
      screenRef.current.emissiveIntensity = THREE.MathUtils.lerp(screenRef.current.emissiveIntensity, targetIntensity, 0.1);
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, targetIntensity * 2, 0.1);
    }
  });

  return (
    <group position={[-2, 4, -110]}>
            <mesh position={[0, 0, -1]}>
        <boxGeometry args={[3, 2.5, 2]} />
        <meshStandardMaterial color="#15100C" />
      </mesh>
            <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.8, 2.3]} />
        <meshStandardMaterial ref={screenRef} color="#000000" emissive="#315D39" emissiveIntensity={0} />
      </mesh>
      <pointLight ref={lightRef} color="#315D39" distance={15} intensity={0} position={[0, 0, 1]} />
            <mesh position={[0, -1.2, 1]}>
        <boxGeometry args={[3, 0.1, 1]} />
        <meshStandardMaterial color="#15100C" />
      </mesh>
    </group>
  );
}

function ZoneClimax({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const [progress, setProgress] = useState(0);
  
  useFrame(() => {

    const p = Math.max(0, Math.min(1, (scrollProgress.get() - 0.8) / 0.2));
    if (Math.abs(progress - p) > 0.001) {
      setProgress(p);
    }
  });

  return (
    <group position={[0, 0, -340]}>
      <GrowthTree growthProgress={progress} />
    </group>
  );
}

function Scene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  
  useFrame(() => {
    const p = scrollProgress.get();
    const colorStart = new THREE.Color("#B99755");
    const colorEnd = new THREE.Color("#1D4A2B");
    colorStart.lerp(colorEnd, p);
    
    if (ambientLightRef.current) {
      ambientLightRef.current.color = colorStart;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#0D0A08", 10, 80]} />
      <ambientLight ref={ambientLightRef} intensity={0.5} />
      
      <CameraRig scrollProgress={scrollProgress} />
      
      <AvatarBillboard />
      <ZoneStudy />
      
            <group position={[-3, 0, -45]}>
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#15100C" /></mesh>
        <pointLight color="#E3CB8A" intensity={1} distance={20} position={[0, 5, 0]} />
      </group>

            <group position={[4, 0, -75]}>
        <mesh position={[0, 2, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#3A2417" /></mesh>
      </group>

      <ZoneComputer />
      
            <group position={[5, 6, -150]}>
        <mesh><icosahedronGeometry args={[2, 0]} /><meshBasicMaterial color="#315D39" wireframe /></mesh>
      </group>

            <group position={[-4, 5, -190]}>
        <mesh><sphereGeometry args={[3, 16, 16]} /><meshStandardMaterial color="#B99755" emissive="#B99755" emissiveIntensity={0.5} /></mesh>
      </group>

            <group position={[3, 4, -230]}>
        <mesh><boxGeometry args={[4, 2, 2]} /><meshStandardMaterial color="#1D4A2B" /></mesh>
      </group>

            <group position={[-2, 0, -270]}>
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#15100C" wireframe />
        </mesh>
      </group>

            <group position={[0, 4, -305]}>
        <mesh><cylinderGeometry args={[1, 1, 4, 16]} /><meshStandardMaterial color="#B99755" emissive="#B99755" emissiveIntensity={0.8} /></mesh>
      </group>

      <ZoneClimax scrollProgress={scrollProgress} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={1.0} />
        <Noise opacity={0.02} />
        <Vignette offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
}

export function StoryCanvas({ scrollProgress }: StoryCanvasProps) {
  return (
    <div style={{ width: "100%", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: -1 }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: false }}>
        <Scene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
