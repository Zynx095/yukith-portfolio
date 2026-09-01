"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";

// ─── Helper: seeded pseudo-random ────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Procedural Bark Shader Modification
 * Injects noise and displacement into the standard material for the trunk and roots.
 */
function applyBarkShader(shader: any) {
  // Add noise functions
  shader.vertexShader = `
    // Simple 3D noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) { 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    varying float vNoise;
  ` + shader.vertexShader;

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    vec3 transformed = vec3(position);
    
    // Stretch noise vertically so it looks like bark grooves
    float noiseVal = snoise(vec3(position.x * 0.5, position.y * 0.05, position.z * 0.5));
    // Add micro detail
    float noiseVal2 = snoise(vec3(position.x * 2.0, position.y * 0.2, position.z * 2.0));
    
    float totalNoise = (noiseVal * 0.8) + (noiseVal2 * 0.2);
    vNoise = totalNoise;
    
    // Displace along normal to create deep grooves
    transformed += normal * (totalNoise * 1.5);
    `
  );

  shader.fragmentShader = `
    varying float vNoise;
  ` + shader.fragmentShader;

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `
    #include <color_fragment>
    
    // White/ivory base for Yggdrasil cosmic tree
    vec3 baseColor = diffuseColor.rgb;
    // Silver shadows in cracks
    vec3 darkColor = vec3(0.55, 0.58, 0.62);
    // Cool silver highlights on ridges
    vec3 highlightColor = vec3(0.88, 0.90, 0.92);
    // Subtle blue-white luminescence in deep fissures
    vec3 deepGlow = vec3(0.75, 0.78, 0.85);
    
    // Mix based on displacement (vNoise)
    float mixFactor = smoothstep(-1.0, 1.0, vNoise);
    vec3 finalColor = mix(darkColor, baseColor, mixFactor);
    
    // Add silver highlights to the outermost ridges
    if (vNoise > 0.5) {
      float hlFactor = smoothstep(0.5, 1.0, vNoise);
      finalColor = mix(finalColor, highlightColor, hlFactor * 0.4);
    }
    
    // Subtle deep glow in the deepest cracks
    if (vNoise < -0.3) {
      float glowFactor = smoothstep(-1.0, -0.3, vNoise);
      finalColor = mix(finalColor, deepGlow, glowFactor * 0.3);
    }
    
    diffuseColor.rgb = finalColor;
    `
  );
}

/**
 * Procedural Leaf Texture Generator
 * Creates an opaque, sharp-edged leaf cluster for alpha testing (physical leaves).
 */
function createPhysicalLeafTexture() {
  if (typeof window === 'undefined') return null;
  const size = 512; // High res for sharp edges
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);

  const rng = seededRandom(12345);
  const center = size / 2;
  const maxRadius = size * 0.45;

  // Draw 80 sharp overlapping leaf shapes to form a dense cluster card
  for (let i = 0; i < 80; i++) {
    const angle = rng() * Math.PI * 2;
    // Bias toward center for density
    const dist = Math.pow(rng(), 1.5) * maxRadius; 
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    
    const w = 20 + rng() * 40;
    const h = 10 + rng() * 20;
    const rot = rng() * Math.PI * 2;

    // Forest green, deep emerald, moss green, dark gold, warm highlights
    const colorChoice = rng();
    let r, g, b;
    if (colorChoice < 0.3) {
      // Dark Forest
      r = 15 + rng()*10; g = 35 + rng()*15; b = 15 + rng()*10;
    } else if (colorChoice < 0.6) {
      // Deep Emerald
      r = 20 + rng()*10; g = 45 + rng()*20; b = 25 + rng()*15;
    } else if (colorChoice < 0.8) {
      // Moss/Sage
      r = 45 + rng()*15; g = 65 + rng()*15; b = 35 + rng()*10;
    } else {
      // Golden highlight (rare)
      r = 120 + rng()*30; g = 100 + rng()*30; b = 40 + rng()*20;
    }

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    
    // Draw leaf shape
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -h/2);
    ctx.quadraticCurveTo(w/2, -h/2, w/2, 0);
    ctx.quadraticCurveTo(w/2, h/2, 0, h/2);
    ctx.quadraticCurveTo(-w/2, h/2, -w/2, 0);
    ctx.quadraticCurveTo(-w/2, -h/2, 0, -h/2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  // Important for alpha testing
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export function WorldTree() {
  const scroll = useScroll();
  
  const rootGroupRef = useRef<THREE.Group>(null);
  const trunkRef = useRef<THREE.Group>(null);
  const branchesRef = useRef<THREE.Group>(null);
  const coreCanopyRef = useRef<THREE.Group>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.SpotLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);

  const leafTexture = useMemo(() => createPhysicalLeafTexture(), []);

  // ====== TRUNK — Massive, intertwined organic splines ======
  const trunkData = useMemo(() => {
    const rng = seededRandom(999);
    const geos = [];
    const strands = 15; // Increased strands for thicker, more organic trunk
    const height = 180; 

    for (let i = 0; i < strands; i++) {
      const angle = (i / strands) * Math.PI * 2;
      const points = [];
      const steps = 20;
      
      for (let j = 0; j <= steps; j++) {
        const t = j / steps; 
        const y = t * height;
        
        const radius = Math.max(3, (1 - t) * 18 + rng() * 6);
        const twist = angle + t * Math.PI * 1.2; // Less aggressive twist
        
        const x = Math.cos(twist) * radius;
        const z = Math.sin(twist) * radius;
        
        const noiseX = (rng() - 0.5) * 5 * (1 - t);
        const noiseZ = (rng() - 0.5) * 5 * (1 - t);
        
        points.push(new THREE.Vector3(x + noiseX, y, z + noiseZ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 32, 4 + rng() * 3, 12, false);
      geos.push(geo);
    }
    return geos;
  }, []);

  // ====== ROOTS — Massive structural anchors ======
  const rootData = useMemo(() => {
    const rng = seededRandom(100);
    const roots = [];
    const rootCount = 25;
    
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2 + (rng() - 0.5) * 0.4;
      const length = 60 + rng() * 100; // Enormous spread
      const thickness = 4 + rng() * 5; // Very thick roots
      const rise = 4 + rng() * 8;
      
      const points = [
        new THREE.Vector3(Math.cos(angle)*8, rise, Math.sin(angle)*8),
        new THREE.Vector3(
          Math.cos(angle) * length * 0.3,
          rise * 0.8,
          Math.sin(angle) * length * 0.3
        ),
        new THREE.Vector3(
          Math.cos(angle) * length * 0.6 + (rng()-0.5)*15,
          -1,
          Math.sin(angle) * length * 0.6 + (rng()-0.5)*15
        ),
        new THREE.Vector3(
          Math.cos(angle) * length + (rng()-0.5)*30,
          -8, // Digs deep into ground
          Math.sin(angle) * length + (rng()-0.5)*30
        ),
      ];
      
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 32, thickness, 8, false);
      roots.push(geo);
    }
    return roots;
  }, []);

  // ====== BRANCHES — Hierarchical and Structural ======
  const branchData = useMemo(() => {
    const rng = seededRandom(888);
    const branches = [];
    const primaryCount = 30;
    const trunkHeight = 160;
    
    for (let i = 0; i < primaryCount; i++) {
      const yStart = 80 + rng() * (trunkHeight - 80);
      const angle = rng() * Math.PI * 2;
      const length = 50 + rng() * 70;
      const upAngle = 0.3 + rng() * 0.5;
      
      const points = [];
      const steps = 5;
      let currentPos = new THREE.Vector3(
        Math.cos(angle) * 10,
        yStart,
        Math.sin(angle) * 10
      );
      points.push(currentPos.clone());
      
      let currentAngle = angle;
      let currentUp = upAngle;
      
      for(let j=1; j<=steps; j++) {
        const segLen = length / steps;
        currentAngle += (rng() - 0.5) * 0.6;
        currentUp -= 0.15; // Branches droop
        
        currentPos.x += Math.cos(currentAngle) * segLen;
        currentPos.y += Math.sin(currentUp) * segLen;
        currentPos.z += Math.sin(currentAngle) * segLen;
        
        points.push(currentPos.clone());
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const thickness = 2.5 + (1 - yStart/trunkHeight) * 4; 
      const geo = new THREE.TubeGeometry(curve, 24, thickness, 8, false);
      branches.push(geo);
    }
    return branches;
  }, []);

  // ====== CANOPY LAYER 1: Core Shadow Masses (Opaque) ======
  const coreCanopyData = useMemo(() => {
    const rng = seededRandom(555);
    const cores = [];
    for(let i=0; i<40; i++) {
      const radius = 30 + rng() * 60;
      const theta = rng() * Math.PI * 2;
      const phi = rng() * Math.PI * 0.5; // Upper hemisphere bias
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.7 + 130 + rng() * 60; 
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      const geo = new THREE.IcosahedronGeometry(15 + rng() * 25, 1);
      cores.push({ geo, position: new THREE.Vector3(x, y, z) });
    }
    return cores;
  }, []);

  // ====== CANOPY LAYER 2 & 3: Physical Leaf Cards (AlphaTest) ======
  const leafCount = 4000;
  // Use a cross-plane (two intersecting planes) for volumetric cards without tracking camera
  const foliageGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const plane1 = new THREE.PlaneGeometry(25, 25);
    const plane2 = new THREE.PlaneGeometry(25, 25);
    plane2.rotateY(Math.PI / 2);
    plane1.rotateX(Math.PI / 8); // slight tilt
    plane2.rotateZ(Math.PI / 8); // slight tilt
    
    // Merge planes manually for efficiency
    const positions = new Float32Array([...plane1.attributes.position.array, ...plane2.attributes.position.array]);
    const normals = new Float32Array([...plane1.attributes.normal.array, ...plane2.attributes.normal.array]);
    const uvs = new Float32Array([...plane1.attributes.uv.array, ...plane2.attributes.uv.array]);
    
    const indices = [];
    const p1Idx = plane1.index!.array;
    for(let i=0; i<p1Idx.length; i++) indices.push(p1Idx[i]);
    const p2Idx = plane2.index!.array;
    const offset = plane1.attributes.position.count;
    for(let i=0; i<p2Idx.length; i++) indices.push(p2Idx[i] + offset);
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }, []);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const leavesData = useMemo(() => {
    const rng = seededRandom(777);
    const data = [];
    
    for (let i = 0; i < leafCount; i++) {
      // Layer 2 & 3: densely clustered around the core and extending outward
      const radius = 10 + rng() * 140; // Wide canopy
      const theta = rng() * Math.PI * 2;
      const phi = rng() * Math.PI * 0.65;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.9 + 110 + rng() * 100;
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Outer leaves are slightly smaller
      const scale = (1.5 - (radius / 150) * 0.5) + rng() * 1.5;
      
      data.push({ position: new THREE.Vector3(x, y, z), scale });
    }
    return data;
  }, []);

  useEffect(() => {
    if (!foliageRef.current) return;
    
    leavesData.forEach((leaf, i) => {
      dummy.position.copy(leaf.position);
      dummy.scale.setScalar(leaf.scale);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.updateMatrix();
      foliageRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    foliageRef.current.instanceMatrix.needsUpdate = true;
  }, [leavesData, dummy]);

  // ====== CANOPY LAYER 4: Magical Atmospheric Particles ======
  const particleCount = 400; // Small minority, not the whole canopy
  const particleGeo = useMemo(() => new THREE.PlaneGeometry(3, 3), []);
  const particleData = useMemo(() => {
    const rng = seededRandom(111);
    const data = [];
    for (let i = 0; i < particleCount; i++) {
      const radius = rng() * 120;
      const theta = rng() * Math.PI * 2;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      const y = 100 + rng() * 150;
      data.push({ position: new THREE.Vector3(x, y, z), speed: 0.1 + rng() * 0.2, offset: rng() * 100 });
    }
    return data;
  }, []);
  
  useEffect(() => {
    if (!particlesRef.current) return;
    particleData.forEach((p, i) => {
      dummy.position.copy(p.position);
      dummy.scale.setScalar(0.5 + Math.random());
      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(i, dummy.matrix);
    });
    particlesRef.current.instanceMatrix.needsUpdate = true;
  }, [particleData, dummy]);


  // ====== RIM LIGHT FOR BRANCHES ======
  const branchRimMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#D8D8D4",
      roughness: 0.85,
      emissive: "#1A1A1A",
      emissiveIntensity: 0.0,
    });
    mat.onBeforeCompile = applyBarkShader;
    return mat;
  }, []);

  // ====== ANIMATION ======
  useFrame((state, delta) => {
    if (!scroll) return;
    const offset = scroll.offset;

// Root growth: 0.0 → 0.25 (starts early, overlaps with silhouette)
    const rootTarget = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(offset, 0.0, 0.25, 0, 1), 0, 1
    );

    // Trunk growth: 0.15 → 0.35
    const trunkTarget = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(offset, 0.15, 0.35, 0, 1), 0, 1
    );

    // Branches & Core: 0.30 → 0.55
    const branchTarget = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(offset, 0.30, 0.55, 0, 1), 0, 1
    );

    // Physical Foliage: 0.45 → 0.75
    const canopyTarget = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(offset, 0.45, 0.75, 0, 1), 0, 1
    );

    // Apply smooth damping
    if (rootGroupRef.current) {
      // Ensure the group is fully scaled so the draw range animation works natively in space
      rootGroupRef.current.scale.set(1, 1, 1);
      
      rootData.forEach((geo, i) => {
        // Stagger the growth slightly based on index
        const delay = (i / rootData.length) * 0.2; 
        let progress = THREE.MathUtils.clamp((rootTarget - delay) / 0.8, 0, 1);
        
        // Non-linear easing for organic crawling effect
        progress = Math.pow(progress, 1.2);
        
        const indexCount = geo.index ? geo.index.count : geo.attributes.position.count;
        const drawCount = Math.floor(indexCount * progress);
        geo.setDrawRange(0, drawCount);
      });
    }

    if (trunkRef.current) {
      const yScale = THREE.MathUtils.damp(trunkRef.current.scale.y, trunkTarget, 3, delta);
      const xzScale = THREE.MathUtils.damp(trunkRef.current.scale.x, trunkTarget > 0.01 ? trunkTarget : 0.01, 3, delta);
      trunkRef.current.scale.set(xzScale, yScale, xzScale);
    }
    
    if (branchesRef.current) {
      const s = THREE.MathUtils.damp(branchesRef.current.scale.x, branchTarget, 3, delta);
      branchesRef.current.scale.set(s, s, s);
    }
    
    if (coreCanopyRef.current) {
      const s = THREE.MathUtils.damp(coreCanopyRef.current.scale.x, branchTarget, 3, delta);
      coreCanopyRef.current.scale.set(s, s, s);
    }

    if (foliageRef.current) {
      const s = THREE.MathUtils.damp(foliageRef.current.scale.x, canopyTarget, 3, delta);
      foliageRef.current.scale.set(s, s, s);
    }

    // Floating particles inside canopy
    if (particlesRef.current && canopyTarget > 0.1) {
      const time = state.clock.elapsedTime;
      particlesRef.current.scale.setScalar(canopyTarget);
      particleData.forEach((p, i) => {
        // Particles drift upward and sway
        const yOffset = ((time * p.speed * 20) + p.offset) % 150;
        dummy.position.set(
          p.position.x + Math.sin(time + p.offset) * 5,
          100 + yOffset,
          p.position.z + Math.cos(time + p.offset) * 5
        );
        // Face camera
        dummy.rotation.copy(state.camera.rotation);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Lighting — subtle natural sunlight, no artificial glow
    const lightIntensity = canopyTarget * 30;
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.damp(
        lightRef.current.intensity, lightIntensity, 3, delta
      );
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(
        fillLightRef.current.intensity, canopyTarget * 10, 3, delta
      );
    }

    // No branch rim light — tree stays white/ivory
  });

  // Reusable bark material injected with noise displacement — white/ivory
  const barkMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#E7E4DC",
      roughness: 0.9,
    });
    mat.onBeforeCompile = applyBarkShader;
    return mat;
  }, []);

  return (
    <group position={[0, -3, -450]}>
      {/* ====== NATURAL LIGHTING ====== */}
      {/* Subtle warm sunlight from above — illuminates white bark */}
      <spotLight 
        ref={lightRef}
        position={[0, 250, 0]} 
        color="#FFF5E8"
        intensity={0}
        angle={Math.PI / 1.5}
        penumbra={1}
        distance={500}
        castShadow
      />
      {/* Cool purple fill from below — contrasts with white trunk */}
      <pointLight 
        ref={fillLightRef}
        position={[0, 40, 40]} 
        color="#4A2D6A" 
        intensity={0}
        distance={350}
      />
      {/* Subtle purple backlight for silhouette depth */}
      <pointLight position={[0, 150, -30]} color="#6A3A9A" intensity={20} distance={400} />

      {/* ====== ROOTS ====== */}
      <group ref={rootGroupRef} scale={0}>
        {rootData.map((geo, i) => (
          <mesh key={`root-${i}`} geometry={geo} material={barkMaterial} castShadow receiveShadow />
        ))}
      </group>

      {/* ====== TRUNK ====== */}
      <group ref={trunkRef} scale={[0.01, 0, 0.01]}>
        {trunkData.map((geo, i) => (
          <mesh key={`trunk-${i}`} geometry={geo} material={barkMaterial} castShadow receiveShadow />
        ))}
      </group>

      {/* ====== BRANCHES ====== */}
      <group ref={branchesRef} scale={0}>
        {branchData.map((geo, i) => (
          <mesh key={`branch-${i}`} geometry={geo} material={branchRimMaterial} castShadow receiveShadow />
        ))}
      </group>

      {/* ====== CANOPY LAYER 1: Core Masses (Opaque shadow casters) ====== */}
      <group ref={coreCanopyRef} scale={0}>
        {coreCanopyData.map((data, i) => (
          <mesh key={`core-${i}`} geometry={data.geo} position={data.position} castShadow receiveShadow>
            <meshStandardMaterial color="#9098A0" roughness={1} />
          </mesh>
        ))}
      </group>

      {/* ====== CANOPY LAYER 2 & 3: Physical Foliage (AlphaTest) ====== */}
      <instancedMesh 
        ref={foliageRef} 
        args={[foliageGeo, undefined, leafCount]} 
        scale={0}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          map={leafTexture}
          color="#D0D8E0" // Pale silver-white foliage
          transparent={true}
          alphaTest={0.4}
          side={THREE.DoubleSide}
          roughness={0.8}
        />
      </instancedMesh>
    </group>
  );
}
