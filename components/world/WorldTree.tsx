"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { Html } from "@react-three/drei";
import { useInteractionContext } from "@/hooks/useInteraction";
import { PROJECTS } from "@/src/data/projects";
import { personalStory } from "@/src/data/personal";

// ─── Seeded PRNG ──────────────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Noise function for bark displacement ──────────────────────────────────────
function makeNoiseShader() {
  return `
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
  `;
}

// ─── Bark shader modifier ──────────────────────────────────────────────────────
function applyBarkShader(shader: any) {
  const noise = makeNoiseShader();
  
  shader.vertexShader = noise + "\n" + shader.vertexShader;
  
  // Add varying declaration
  shader.vertexShader = "varying float vBarkDisplacement;\n" + shader.vertexShader;
  
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
    vec3 transformed = vec3(position);
    
    // Multi-octave bark noise for grooves and ridges
    float barkNoise = snoise(vec3(position.x * 0.15, position.y * 0.02, position.z * 0.15));
    float microNoise = snoise(vec3(position.x * 0.8, position.y * 0.1, position.z * 0.8));
    float detailNoise = snoise(vec3(position.x * 3.0, position.y * 0.5, position.z * 3.0));
    
    float totalDisplacement = (barkNoise * 1.2) + (microNoise * 0.3) + (detailNoise * 0.1);
    vBarkDisplacement = totalDisplacement;
    
    // Displace along normal for bark texture
    transformed += normal * totalDisplacement;
    `
  );
  
  shader.fragmentShader = "varying float vBarkDisplacement;\n" + shader.fragmentShader;
  
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <color_fragment>",
    `
    #include <color_fragment>
    
    vec3 ivoryBase = vec3(0.48, 0.33, 0.20); // Medium warm brown
    vec3 silverShadow = vec3(0.18, 0.12, 0.08); // Deep dark brown grooves
    vec3 warmHighlight = vec3(0.55, 0.38, 0.25); // Slightly lighter raised bark
    
    float barkLevel = smoothstep(-1.0, 1.0, vBarkDisplacement);
    vec3 barkColor = mix(silverShadow, ivoryBase, barkLevel);
    
    // Add subtle warmth on ridges
    if (barkLevel > 0.5) {
      float ridgeFactor = (barkLevel - 0.5) * 2.0;
      barkColor = mix(barkColor, warmHighlight, ridgeFactor * 0.3);
    }
    
    diffuseColor.rgb = barkColor;
    `
  );
}

// ─── Realistic Leaf Geometry ──────────────────────────────────────────────────
// Creates actual leaf shapes instead of balls
function createLeafGeometry(width: number, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  
  // Teardrop/oval leaf shape
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.5, length * 0.2, width * 0.6, length * 0.6, 0, length);
  shape.bezierCurveTo(-width * 0.6, length * 0.6, -width * 0.5, length * 0.2, 0, 0);
  
  const extrudeSettings = {
    steps: 1,
    depth: 0.02,
    bevelEnabled: false
  };
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  
  // Add slight curve to leaf
  const posAttr = geometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    
    // Curve along length
    const curve = Math.sin((y / length + 0.5) * Math.PI) * 0.15;
    posAttr.setZ(i, z + curve);
  }
  geometry.computeVertexNormals();
  
  return geometry;
}

// ─── Leaf Cluster (group of leaves) ────────────────────────────────────────────
interface LeafCluster {
  leaves: Array<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: number;
    color: THREE.Color;
    geometry: THREE.BufferGeometry;
  }>;
}

function createLeafCluster(position: THREE.Vector3, count: number, rng: () => number): LeafCluster {
  const leaves = [];
  const baseWidth = 0.8 + rng() * 0.6;
  const baseLength = 1.5 + rng() * 1.0;
  const geometry = createLeafGeometry(baseWidth, baseLength);
  
  for (let i = 0; i < count; i++) {
    const offset = new THREE.Vector3(
      (rng() - 0.5) * 4,
      (rng() - 0.5) * 3,
      (rng() - 0.5) * 4
    );
    
    const leafPos = new THREE.Vector3().copy(position).add(offset);
    
    const rotation = new THREE.Euler(
      (rng() - 0.5) * 0.8,
      rng() * Math.PI * 2,
      (rng() - 0.5) * 0.5
    );
    
    const scale = 0.6 + rng() * 0.8;
    
    // Natural green variation
    const greenVar = 0.2 + rng() * 0.5;
    const color = new THREE.Color(
      0.02 + rng() * 0.08,
      greenVar,
      0.01 + rng() * 0.05
    );
    
    leaves.push({ position: leafPos, rotation, scale, color, geometry });
  }
  
  return { leaves };
}

// ─── Branch creation helper ────────────────────────────────────────────────────
function createBranch(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments: number = 32,
  baseRadius: number,
  tipRadius: number,
  curveTension: number = 0.5,
  rng: () => number
): THREE.TubeGeometry {
  // Create curved path between start and end
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
  mid.x += (rng() - 0.5) * baseRadius * 0.5;
  mid.y += (rng() - 0.5) * (end.y - start.y) * 0.1;
  mid.z += (rng() - 0.5) * baseRadius * 0.5;
  
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  return new THREE.TubeGeometry(curve, segments, baseRadius, 8, false);
}

// ─── Primary Branch Generator ──────────────────────────────────────────────────
function generatePrimaryBranches(height: number, count: number, rng: () => number): Array<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
}> {
  const branches: Array<{
    start: THREE.Vector3;
    end: THREE.Vector3;
    radius: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.3;
    const heightRatio = 0.3 + rng() * 0.5; // Start between 30-80% up trunk
    const startHeight = height * heightRatio;

    const start = new THREE.Vector3(
      Math.cos(angle) * 12,
      startHeight,
      Math.sin(angle) * 12
    );

    // BRANCHES SOAR ACROSS ENTIRE SKY - MASSIVE reach
    const reach = 120 + rng() * 200; // 120-320 units reach - EXTREMELY LONG
    const endHeight = startHeight + 20 + rng() * 50; // Higher elevation

    const end = new THREE.Vector3(
      Math.cos(angle) * reach,
      endHeight,
      Math.sin(angle) * reach
    );

    const radius = 5 + rng() * 5; // THICKER primary branches

    branches.push({ start, end, radius });
  }

  return branches;
}

// ─── Secondary Branch Generator ────────────────────────────────────────────────
function generateSecondaryBranches(
  primaryEndpoints: THREE.Vector3[],
  countPerEndpoint: number,
  rng: () => number
): Array<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
}> {
  const branches: Array<{
    start: THREE.Vector3;
    end: THREE.Vector3;
    radius: number;
  }> = [];

  for (const endpoint of primaryEndpoints) {
    for (let i = 0; i < countPerEndpoint; i++) {
      const angle = Math.atan2(endpoint.z, endpoint.x) + (rng() - 0.5) * Math.PI * 0.8;
      const heightRatio = 0.15 + rng() * 0.35;

      const start = new THREE.Vector3(
        endpoint.x * (1 - heightRatio) + endpoint.x * 0.4 * Math.cos(angle),
        endpoint.y + 8 + rng() * 12,
        endpoint.z * (1 - heightRatio) + endpoint.x * 0.4 * Math.sin(angle)
      );

      // Secondary branches also extend far
      const reach = 40 + rng() * 80;
      const end = new THREE.Vector3(
        start.x + Math.cos(angle) * reach,
        start.y + 12 + rng() * 25,
        start.z + Math.sin(angle) * reach
      );

      const radius = 1.5 + rng() * 2.5;

      branches.push({ start, end, radius });
    }
  }

  return branches;
}

// ─── Foliage Placement ─────────────────────────────────────────────────────────
interface FoliagePlacement {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  color: THREE.Color;
  leafCount: number;
}

function placeFoliage(
  branchEndpoints: THREE.Vector3[],
  rng: () => number,
  countPerEndpoint: number = 40 // EXTREMELY DENSE
): FoliagePlacement[] {
  const placements: FoliagePlacement[] = [];

  for (const endpoint of branchEndpoints) {
    for (let i = 0; i < countPerEndpoint; i++) {
      const offset = new THREE.Vector3(
        (rng() - 0.5) * 28,
        (rng() - 0.5) * 20,
        (rng() - 0.5) * 28
      );

      const position = new THREE.Vector3().copy(endpoint).add(offset);

      const rotation = new THREE.Euler(
        (rng() - 0.5) * 1.5,
        rng() * Math.PI * 2,
        (rng() - 0.5) * 1.0
      );

      const scale = 0.4 + rng() * 1.4;

      // DENSE DARK VIBRANT GREEN - deep forest colors
      const greenIntensity = 0.3 + rng() * 0.6;
      const color = new THREE.Color(
        0.05 + rng() * 0.05,
        greenIntensity,
        0.02 + rng() * 0.05
      );

      placements.push({
        position,
        rotation,
        scale,
        color,
        leafCount: 1 + Math.floor(rng() * 3), // 1-3 leaves per cluster (down from 4-7)
      });
    }
  }

  return placements;
}

// ─── Tree Project Node (interactive element inside tree) ──────────────────────
function ProjectArchiveCard({
  id,
  position,
  rotation = [0, 0, 0],
}: {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { openPanel } = useInteractionContext();

  const project: any = PROJECTS.find(p => p.title.toLowerCase() === id.toLowerCase() || p.id === id) || 
                  personalStory.internships.find(e => e.company.toLowerCase().includes(id.toLowerCase())) || 
                  personalStory.hackathons.find(a => a.name.toLowerCase().includes(id.toLowerCase())) || 
                  personalStory.leadership.find(l => l.organization.toLowerCase().includes(id.toLowerCase())) ||
                  { title: id, summary: "Information Record", technologies: [] };

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    // Subtle float
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5 + position[0]) * 0.4;
  });

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        openPanel(id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {/* Physical Backing Plaque (Ancient Wood) */}
      <mesh receiveShadow castShadow position={[0, 0, -0.2]}>
        <boxGeometry args={[14, 8, 0.4]} />
        <meshStandardMaterial color="#2d1c10" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Glass Face Plate */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[13.5, 7.5, 0.1]} />
        <meshPhysicalMaterial 
          color="#111111" 
          transmission={0.4} 
          roughness={0.1} 
          metalness={0.8}
          transparent={false}
        />
      </mesh>

      {/* HTML Content Overlay */}
      <Html
        transform
        distanceFactor={22}
        position={[0, 0, 0.15]}
        className="w-[380px] pointer-events-none select-none" 
      >
        <div className="flex flex-col bg-transparent text-[#e8e4dc] p-5 font-sans antialiased border border-[#E3CB8A]/20 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" style={{ backgroundColor: 'rgba(15, 10, 5, 0.6)' }}>
          <h3 className="text-4xl font-bold tracking-tight mb-2 text-[#E3CB8A]">
            {project.title || project.company || project.name || project.organization || id}
          </h3>
          <p className="text-md font-light leading-relaxed mb-4 text-[#d8d4cc]">
            {project.summary || project.subtitle || project.description || project.role || project.result}
          </p>
          {project.technologies && (
            <div className="flex flex-wrap gap-2">
              {project.technologies.slice(0, 4).map((tech: string, i: number) => (
                <span key={i} className="text-xs uppercase tracking-widest bg-black/60 px-2 py-1 rounded text-[#E3CB8A]/80 border border-[#E3CB8A]/10">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ─── Main World Tree Component ─────────────────────────────────────────────────
export function WorldTree() {
  const treeGroupRef = useRef<THREE.Group>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);

  // Animation for gentle tree sway
  useFrame((state) => {
    if (treeGroupRef.current) {
      const time = state.clock.elapsedTime;
      // Very subtle overall sway
      treeGroupRef.current.rotation.z = Math.sin(time * 0.1) * 0.003;
    }
    if (foliageRef.current) {
      const time = state.clock.elapsedTime;
      // Subtle canopy drift
      foliageRef.current.rotation.y = Math.sin(time * 0.05) * 0.02;
    }
  });

  // Create leaf geometry once
  const leafGeometry = useMemo(() => {
    return createLeafGeometry(1, 2);
  }, []);

  const treeStructure = useMemo(() => {
    const rng = seededRandom(12345);

    // ─── TRUNK CONFIGURATION ────────────────────────────────────────────────
    const trunkHeight = 220; // Increased to ensure the cavity is tall enough
    const trunkBaseRadius = 35; // Increased to create a massive hollow interior
    const trunkTopRadius = 12;
    const trunkStrands = 7;

    // Build multi-strand twisting trunk
    const trunkGeos: THREE.BufferGeometry[] = [];
    
    for (let s = 0; s < trunkStrands; s++) {
      const strandAngle = (s / trunkStrands) * Math.PI * 2;
      const strandOffset = new THREE.Vector3(
        Math.cos(strandAngle) * trunkBaseRadius * 0.6,
        0,
        Math.sin(strandAngle) * trunkBaseRadius * 0.6
      );

      const curvePoints: THREE.Vector3[] = [];
      const segments = 30;
      
      for (let y = 0; y <= trunkHeight; y += trunkHeight / segments) {
        const progress = y / trunkHeight;
        const radius = trunkBaseRadius * (1 - progress * 0.6) * (0.7 + rng() * 0.3);
        const twist = y * 0.02 + strandAngle;
        
        curvePoints.push(new THREE.Vector3(
          strandOffset.x + Math.cos(twist) * radius * 0.3,
          y,
          strandOffset.z + Math.sin(twist) * radius * 0.3
        ));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const radius = trunkBaseRadius * 0.4 * (1 - rng() * 0.2); // Thicker strands to enclose cavity
      trunkGeos.push(new THREE.TubeGeometry(curve, 40, radius, 10, false));
    }

    // ─── BUTTRESS ROOTS ─────────────────────────────────────────────────────
    const rootGeos: THREE.BufferGeometry[] = [];
    const numRoots = 12;
    
    for (let r = 0; r < numRoots; r++) {
      const angle = (r / numRoots) * Math.PI * 2 + rng() * 0.2;
      const spread = 15 + rng() * 20;
      
      const points: THREE.Vector3[] = [
        new THREE.Vector3(Math.cos(angle) * 20, 0, Math.sin(angle) * 20),
        new THREE.Vector3(Math.cos(angle) * (20 + spread * 0.3), 8, Math.sin(angle) * (20 + spread * 0.3)),
        new THREE.Vector3(Math.cos(angle) * (20 + spread * 0.7), -2, Math.sin(angle) * (20 + spread * 0.7)),
        new THREE.Vector3(Math.cos(angle) * spread, -8, Math.sin(angle) * spread),
      ];
      
      const rootCurve = new THREE.CatmullRomCurve3(points);
      const rootRadius = 3 + rng() * 3;
      rootGeos.push(new THREE.TubeGeometry(rootCurve, 20, rootRadius, 8, false));
    }

    // ─── PRIMARY BRANCHES ──────────────────────────────────────────────────
    const primaryBranches = generatePrimaryBranches(trunkHeight, 32, rng); // EVEN MORE branches
    const primaryGeos: THREE.BufferGeometry[] = [];
    const primaryEndpoints: THREE.Vector3[] = [];

    for (const branch of primaryBranches) {
      primaryGeos.push(createBranch(branch.start, branch.end, 40, branch.radius, branch.radius * 0.3, 0.5, rng));
      primaryEndpoints.push(branch.end);
    }

    // ─── SECONDARY BRANCHES ────────────────────────────────────────────────
    const secondaryBranches = generateSecondaryBranches(primaryEndpoints, 16, rng); // MORE per endpoint
    const secondaryGeos: THREE.BufferGeometry[] = [];
    const secondaryEndpoints: THREE.Vector3[] = [];

    for (const branch of secondaryBranches) {
      secondaryGeos.push(createBranch(branch.start, branch.end, 32, branch.radius, branch.radius * 0.3, 0.5, rng));
      secondaryEndpoints.push(branch.end);
    }

    // ─── TERTIARY BRANCHES (fine detail) ────────────────────────────────────
    const tertiaryEndpoints: THREE.Vector3[] = [];
    for (const ep of secondaryEndpoints) {
      for (let i = 0; i < 8; i++) { // MORE tertiary branches
        const offset = new THREE.Vector3(
          (rng() - 0.5) * 15,
          8 + rng() * 15,
          (rng() - 0.5) * 15
        );
        tertiaryEndpoints.push(new THREE.Vector3().copy(ep).add(offset));
      }
    }

    // ─── FOLIAGE PLACEMENT ──────────────────────────────────────────────────
    const allEndpoints = [...primaryEndpoints, ...secondaryEndpoints, ...tertiaryEndpoints];
    const foliagePlacements = placeFoliage(allEndpoints, rng, 8); 

    return {
      trunkGeo: BufferGeometryUtils.mergeGeometries(trunkGeos),
      rootGeo: BufferGeometryUtils.mergeGeometries(rootGeos),
      primaryGeo: BufferGeometryUtils.mergeGeometries(primaryGeos),
      secondaryGeo: BufferGeometryUtils.mergeGeometries(secondaryGeos),
      foliagePlacements,
      primaryEndpoints,
    };
  }, []);

  // Initialize instanced mesh with leaf geometry
  useEffect(() => {
    if (!foliageRef.current) return;

    const { foliagePlacements } = treeStructure;
    const dummy = new THREE.Object3D();
    let instanceIndex = 0;

    foliagePlacements.forEach((foliage) => {
      // Create multiple leaf instances per placement
      for (let i = 0; i < foliage.leafCount && instanceIndex < foliageRef.current!.count; i++) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 2
        );

        dummy.position.copy(foliage.position).add(offset);
        dummy.rotation.copy(foliage.rotation);
        dummy.rotation.x += (Math.random() - 0.5) * 0.5;
        dummy.rotation.z += (Math.random() - 0.5) * 0.5;
        // Increase scale to compensate for lower instance count, keeping volumetric feel
        dummy.scale.setScalar(foliage.scale * (1.2 + Math.random() * 0.8));
        dummy.updateMatrix();

        foliageRef.current!.setMatrixAt(instanceIndex, dummy.matrix);
        foliageRef.current!.setColorAt(instanceIndex, foliage.color);
        instanceIndex++;
      }
    });

    foliageRef.current.instanceMatrix.needsUpdate = true;
    foliageRef.current.instanceColor!.needsUpdate = true;
  }, [treeStructure]);

  const barkMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#5c3a21", // Base natural brown
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = applyBarkShader;
    return mat;
  }, []);

  const trunkMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#4a2d19", // Darker inner brown
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide, // Essential for rendering the hollow interior

    });
    mat.onBeforeCompile = applyBarkShader;
    return mat;
  }, []);

  return (
    <group ref={treeGroupRef} position={[0, 0, -450]}>
      {/* ─── MASSIVE TWISTING TRUNK ─────────────────────────────────────────── */}
      {treeStructure.trunkGeo && (
        <mesh geometry={treeStructure.trunkGeo} material={trunkMaterial} castShadow receiveShadow />
      )}

      {/* ─── BUTTRESS ROOTS ─────────────────────────────────────────────────── */}
      {treeStructure.rootGeo && (
        <mesh geometry={treeStructure.rootGeo} material={barkMaterial} castShadow receiveShadow />
      )}

      {/* ─── PRIMARY BRANCHES ───────────────────────────────────────────────── */}
      {treeStructure.primaryGeo && (
        <mesh geometry={treeStructure.primaryGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d4d0c8" roughness={0.7} />
        </mesh>
      )}

      {/* ─── SECONDARY BRANCHES ─────────────────────────────────────────────── */}
      {treeStructure.secondaryGeo && (
        <mesh geometry={treeStructure.secondaryGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#c8c4bc" roughness={0.75} />
        </mesh>
      )}

      {/* ─── DENSE ORGANIC LEAF FOLIAGE ─────────────────────────────────────── */}
      <instancedMesh
        ref={foliageRef}
        args={[null as any, null as any, treeStructure.foliagePlacements.length * 3]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial
          color="#a3c4a8"
          transparent={false}
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={0.8}
        />
      </instancedMesh>

      {/* ─── TREE-INTERNAL LIGHTING ─────────────────────────────────────────── */}
      <pointLight position={[0, 90, 0]} color="#fff5cc" intensity={12} distance={150} />
      <pointLight position={[0, 150, 0]} color="#fff8e7" intensity={8} distance={120} />

      {/* ─── PROJECT ARCHIVE NODES (inside trunk) ───────────────────────────── */}
      <group position={[0, 20, 0]}>
        {/* Carved chamber walls */}
        <mesh position={[0, 40, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[8, 1.5, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#3a2a1a" roughness={1} side={THREE.DoubleSide} />
        </mesh>
        
        <ProjectArchiveCard
          id="aura"
          position={[-6, 35, 0]}
          rotation={[-Math.PI / 2 + 0.2, 0, 0]}
        />
        <ProjectArchiveCard
          id="etth"
          position={[6, 65, 0]}
          rotation={[-Math.PI / 2 + 0.2, 0, 0]}
        />
        <ProjectArchiveCard
          id="shadowguard"
          position={[-5, 95, 0]}
          rotation={[-Math.PI / 2 + 0.2, 0, 0]}
        />
        <ProjectArchiveCard
          id="sugar-ai"
          position={[5, 125, 0]}
          rotation={[-Math.PI / 2 + 0.2, 0, 0]}
        />
        <ProjectArchiveCard
          id="achievements"
          position={[-4, 155, 0]}
          rotation={[-Math.PI / 2 + 0.2, 0, 0]}
        />
        <ProjectArchiveCard
          id="leadership"
          position={[4, 185, 0]}
          rotation={[-Math.PI / 2 + 0.2, 0, 0]}
        />
        <ProjectArchiveCard
          id="experience"
          position={[0, 215, 0]}
          rotation={[-Math.PI / 2 + 0.2, 0, 0]}
        />
        
        {/* Tree ring archive platforms */}
        {Array.from({ length: 7 }).map((_, i) => {
          const y = 20 + i * 28;
          return (
            <mesh key={`platform-${i}`} position={[0, y, 0]} receiveShadow>
              <cylinderGeometry args={[6, 7, 0.5, 12]} />
              <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
