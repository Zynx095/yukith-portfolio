"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainYAt } from "./Terrain";

// ─── Waterfall Cliff & Mountain ───────────────────────────────────────────────
function WaterfallCliff() {
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const cliffData = useMemo(() => {
    const rocks: Array<{
      position: [number, number, number];
      scale: [number, number, number];
      rotation: [number, number, number];
      color: string;
    }> = [];

    // Main cliff face - positioned behind waterfall, avoiding center
    for (let i = 0; i < 25; i++) {
      // Place rocks on LEFT and RIGHT sides only, not in center
      const side = i % 2 === 0 ? -1 : 1;
      const angle = Math.random() * Math.PI * 0.6 + Math.PI * 0.2; // Avoid center
      const dist = 20 + Math.random() * 20;
      const x = side * (15 + Math.random() * 25);
      const z = -85 + (Math.random() - 0.5) * 20;
      const y = -15 + Math.random() * 55;

      rocks.push({
        position: [x, y, z],
        scale: [
          6 + Math.random() * 10,
          4 + Math.random() * 12,
          5 + Math.random() * 7
        ],
        rotation: [
          (Math.random() - 0.5) * 0.2,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.15
        ],
        color: i % 3 === 0 ? "#4a4a45" : i % 3 === 1 ? "#5a5550" : "#6a6560"
      });
    }

    // Layered rock ledges on sides
    for (let layer = 0; layer < 6; layer++) {
      const y = -10 + layer * 10;
      // Left side rocks
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 0.3 + (i / 8) * Math.PI * 0.5;
        rocks.push({
          position: [
            -15 - Math.cos(angle) * (8 + Math.random() * 6),
            y + Math.random() * 2,
            -85 + (Math.random() - 0.5) * 10
          ],
          scale: [
            2.5 + Math.random() * 4,
            1.5 + Math.random() * 2,
            3 + Math.random() * 4
          ],
          rotation: [
            (Math.random() - 0.5) * 0.15,
            angle + Math.random() * 0.2,
            (Math.random() - 0.5) * 0.1
          ],
          color: "#5a5550"
        });
      }
      // Right side rocks
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 0.5 + (i / 8) * Math.PI * 0.5;
        rocks.push({
          position: [
            15 + Math.cos(angle) * (8 + Math.random() * 6),
            y + Math.random() * 2,
            -85 + (Math.random() - 0.5) * 10
          ],
          scale: [
            2.5 + Math.random() * 4,
            1.5 + Math.random() * 2,
            3 + Math.random() * 4
          ],
          rotation: [
            (Math.random() - 0.5) * 0.15,
            angle + Math.random() * 0.2,
            (Math.random() - 0.5) * 0.1
          ],
          color: "#6a6560"
        });
      }
    }

    // Riverside rocks - along the river banks
    for (let i = 0; i < 20; i++) {
      const z = -85 + i * 4;
      const side = i % 2 === 0 ? -1 : 1;
      rocks.push({
        position: [
          side * (5 + Math.random() * 4),
          -28 + Math.random() * 2,
          z
        ],
        scale: [
          1.5 + Math.random() * 2,
          1 + Math.random() * 1.5,
          1.5 + Math.random() * 2
        ],
        rotation: [
          (Math.random() - 0.5) * 0.3,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.2
        ],
        color: "#5a5a55"
      });
    }

    return rocks;
  }, []);

  return (
    <group>
      {cliffData.map((rock, idx) => (
        <mesh
          key={`cliff-${idx}`}
          position={rock.position}
          rotation={rock.rotation}
          scale={rock.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={rock.color}
            roughness={0.95}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Animated Waterfall ───────────────────────────────────────────────────────
function AnimatedWaterfall() {
  const waterfallMatRef = useRef<THREE.ShaderMaterial>(null);
  const splashMatRef = useRef<THREE.ShaderMaterial>(null);
  const mistRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8; // x
      positions[i * 3 + 1] = 0; 
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4; // z
      
      speeds[i] = 30.0 + Math.random() * 40.0;
      offsets[i] = Math.random() * 80.0;
      scales[i] = 1.0 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, offsets, scales, phases };
  }, []);

  const splashData = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      
      speeds[i] = 10.0 + Math.random() * 15.0;
      offsets[i] = Math.random() * 30.0;
    }
    return { positions, speeds, offsets };
  }, []);

  const mistData = useMemo(() => {
    const positions = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = -28 + Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return { positions, count: 150 };
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (waterfallMatRef.current) waterfallMatRef.current.uniforms.uTime.value = time;
    if (splashMatRef.current) splashMatRef.current.uniforms.uTime.value = time;

    // Animate mist
    if (mistRef.current) {
      mistRef.current.position.y = Math.sin(time * 0.2) * 0.5;
      mistRef.current.rotation.y = time * 0.01;
    }
  });

  return (
    <group position={[0, 0, -85]}>
      {/* Main waterfall sheet - centered */}
      <mesh position={[0, 12, 0]} receiveShadow>
        <planeGeometry args={[10, 65, 10, 65]} />
        <meshStandardMaterial
          color="#5aa5c5"
          transparent
          opacity={0.75}
          roughness={0.05}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary water sheets on sides */}
      <mesh position={[-4, 8, -1]} receiveShadow>
        <planeGeometry args={[4, 50, 4, 50]} />
        <meshStandardMaterial
          color="#6ab5d5"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[4, 6, 1]} receiveShadow>
        <planeGeometry args={[3, 45, 4, 45]} />
        <meshStandardMaterial
          color="#5aa5c5"
          transparent
          opacity={0.65}
          roughness={0.08}
          metalness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Particle waterfall (GPU Driven) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particleData.positions, 3]} />
          <bufferAttribute attach="attributes-aSpeed" args={[particleData.speeds, 1]} />
          <bufferAttribute attach="attributes-aOffset" args={[particleData.offsets, 1]} />
          <bufferAttribute attach="attributes-aScale" args={[particleData.scales, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[particleData.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={waterfallMatRef}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#9ce5f5") }
          }}
          vertexShader={`
            uniform float uTime;
            attribute float aSpeed;
            attribute float aOffset;
            attribute float aScale;
            attribute float aPhase;
            void main() {
              vec3 pos = position;
              // Fall from y=45 to y=-30 (range 75)
              float currentY = 45.0 - mod(aOffset + uTime * aSpeed, 75.0);
              pos.y = currentY;
              // Add subtle sway
              pos.x += sin(uTime * 1.5 + aPhase) * 0.3;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = (15.0 * aScale) * (100.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float alpha = (0.5 - dist) * 2.0;
              gl_FragColor = vec4(uColor, alpha * 0.7);
            }
          `}
        />
      </points>

      {/* Splash particles (GPU Driven) */}
      <points position={[0, -30, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[splashData.positions, 3]} />
          <bufferAttribute attach="attributes-aSpeed" args={[splashData.speeds, 1]} />
          <bufferAttribute attach="attributes-aOffset" args={[splashData.offsets, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={splashMatRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#ffffff") }
          }}
          vertexShader={`
            uniform float uTime;
            attribute float aSpeed;
            attribute float aOffset;
            varying float vAlpha;
            void main() {
              vec3 pos = position;
              float currentY = mod(aOffset + uTime * aSpeed, 10.0);
              pos.y = currentY;
              vAlpha = 1.0 - (currentY / 10.0);
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = (25.0 * vAlpha) * (100.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying float vAlpha;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float alpha = (0.5 - dist) * 2.0 * vAlpha;
              gl_FragColor = vec4(uColor, alpha * 0.5);
            }
          `}
        />
      </points>

      {/* Mist particles */}
      <points ref={mistRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[mistData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={2.5}
          sizeAttenuation
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#c0e5f5"
        />
      </points>

      {/* Basin pool at bottom */}
      <mesh position={[0, -30, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8, 24]} />
        <meshStandardMaterial
          color="#2a7a9a"
          transparent
          opacity={0.85}
          roughness={0.05}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

// ─── River ────────────────────────────────────────────────────────────────────
function River() {
  const riverCurve = useMemo(() => {
    // River flows straight down the CENTER
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -30, -85),
      new THREE.Vector3(0, -28, -70),
      new THREE.Vector3(0, -26, -55),
      new THREE.Vector3(0, -24, -45),
      new THREE.Vector3(0, -22, -35),
      new THREE.Vector3(0, -20, -25),
      new THREE.Vector3(0, -18, -15),
    ]);
  }, []);

  const geometry = useMemo(() => {
    const curve = riverCurve;
    const points = curve.getSpacedPoints(60);

    const vertices = [];
    const indices = [];
    const uvs = [];
    const width = 5; // Wider river in center

    for (let i = 0; i <= 60; i++) {
      const point = points[i];
      const tangent = curve.getTangentAt(i / 60);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = point.clone().add(normal.clone().multiplyScalar(width / 2));
      const right = point.clone().add(normal.clone().multiplyScalar(-width / 2));

      vertices.push(left.x, left.y + 0.1, left.z);
      vertices.push(right.x, right.y + 0.1, right.z);
      uvs.push(0, i / 60 * 10);
      uvs.push(1, i / 60 * 10);

      if (i < 60) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [riverCurve]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#3a8ab0"
        transparent
        opacity={0.8}
        roughness={0.05}
        metalness={0.5}
      />
    </mesh>
  );
}

// ─── Lake ─────────────────────────────────────────────────────────────────────
function Lake() {
  return (
    <group position={[7, 0, -15]}>
      {/* Lake surface */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[18, 32]} />
        <meshStandardMaterial
          color="#2a7a9a"
          transparent
          opacity={0.85}
          roughness={0.05}
          metalness={0.6}
        />
      </mesh>
      
      {/* Lake edge rocks */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 17 + Math.random() * 3;
        return (
          <mesh
            key={`lake-rock-${i}`}
            position={[
              Math.cos(angle) * dist,
              -2.5 + Math.random() * 0.5,
              Math.sin(angle) * dist
            ]}
            rotation={[Math.random() * 0.3, angle, Math.random() * 0.3]}
          >
            <dodecahedronGeometry args={[0.8 + Math.random() * 1.2, 0]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#5a5a55" : "#6a6560"}
              roughness={0.95}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Swimming Fish ────────────────────────────────────────────────────────────
function SwimmingFish() {
  const fishRef = useRef<THREE.InstancedMesh>(null);
  const count = 30;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const fishData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        baseX: 5 + Math.random() * 10,
        baseZ: -50 - Math.random() * 40,
        baseY: -4 - Math.random() * 2,
        speed: 0.8 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        radius: 3 + Math.random() * 5,
        scale: 0.4 + Math.random() * 0.4
      });
    }
    return data;
  }, []);
  
  const fishGeometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.15, 0.6, 4);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);
  
  useFrame((state) => {
    if (!fishRef.current) return;
    const time = state.clock.elapsedTime;
    
    fishData.forEach((f, i) => {
      const t = time * f.speed + f.phase;
      
      // Swim in circular paths
      const angle = t * 0.3;
      const x = f.baseX + Math.cos(angle) * f.radius;
      const z = f.baseZ + Math.sin(angle) * f.radius;
      const y = f.baseY + Math.sin(t * 0.5) * 0.3;
      
      // Face direction of movement
      const nextAngle = (t + 0.1) * 0.3;
      const nextX = f.baseX + Math.cos(nextAngle) * f.radius;
      const nextZ = f.baseZ + Math.sin(nextAngle) * f.radius;
      const lookDir = Math.atan2(nextX - x, nextZ - z);
      
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, lookDir, 0);
      dummy.scale.setScalar(f.scale);
      dummy.updateMatrix();
      
      fishRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    fishRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={fishRef} args={[fishGeometry, undefined, count]}>
      <meshStandardMaterial color="#e07a5f" roughness={0.3} metalness={0.5} />
    </instancedMesh>
  );
}

// ─── Birds ────────────────────────────────────────────────────────────────────
function BirdFlock() {
  const birdsRef = useRef<THREE.Group>(null);
  const birdGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0.5,
      -0.8, 0, -0.3,
      0.8, 0, -0.3,
      0, -0.1, -0.1
    ]);
    const indices = [0, 1, 3, 0, 3, 2];
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);
  
  const birdsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        x: (Math.random() - 0.5) * 80,
        y: 25 + Math.random() * 20,
        z: -40 - Math.random() * 200,
        speed: 1.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, []);
  
  useFrame((state) => {
    if (!birdsRef.current) return;
    const time = state.clock.elapsedTime;
    
    birdsRef.current.children.forEach((bird, i) => {
      const data = birdsData[i];
      const t = time * data.speed * 0.2 + data.phase;
      
      bird.position.x = data.x + Math.sin(t) * 20;
      bird.position.z = data.z + Math.cos(t * 0.7) * 15;
      bird.position.y = data.y + Math.sin(t * 1.5) * 3;
      
      const wingFlap = Math.sin(time * 8 + data.phase) * 0.5;
      bird.rotation.z = wingFlap;
      bird.rotation.y = Math.atan2(
        Math.cos(t) * 20,
        -Math.sin(t * 0.7) * 15
      );
    });
  });
  
  return (
    <group ref={birdsRef}>
      {birdsData.map((_, i) => (
        <mesh key={i} geometry={birdGeo} scale={0.8}>
          <meshBasicMaterial color="#2d3748" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Main Ecosystem Component ─────────────────────────────────────────────────
export function Ecosystem() {
  return (
    <group>
      <WaterfallCliff />
      <AnimatedWaterfall />
      <River />
      <Lake />
      <SwimmingFish />
      <BirdFlock />
    </group>
  );
}
