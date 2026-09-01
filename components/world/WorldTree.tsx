"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { ArtifactAURA, ArtifactETTH, ArtifactShadowGuard, ArtifactSugarAI, ArtifactAchievements, ArtifactLeadership, ArtifactExperience } from "./Artifacts";
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
    
    vec3 ivoryBase = vec3(0.35, 0.22, 0.12); // Rich dark brown
    vec3 silverShadow = vec3(0.12, 0.08, 0.05); // Deep shadow brown
    vec3 warmHighlight = vec3(0.48, 0.32, 0.18); // Lighter warm brown
    
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

    const radius = 3 + rng() * 3; // THINNER primary branches

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
  countPerEndpoint: number = 20 // VERY DENSE
): FoliagePlacement[] {
  const placements: FoliagePlacement[] = [];

  for (const endpoint of branchEndpoints) {
    for (let i = 0; i < countPerEndpoint; i++) {
      const offset = new THREE.Vector3(
        (rng() - 0.5) * 20,
        (rng() - 0.5) * 15,
        (rng() - 0.5) * 20
      );

      const position = new THREE.Vector3().copy(endpoint).add(offset);

      const rotation = new THREE.Euler(
        (rng() - 0.5) * 1.2,
        rng() * Math.PI * 2,
        (rng() - 0.5) * 0.8
      );

      const scale = 0.5 + rng() * 1.5;

      // DENSE DARK VIBRANT GREEN - deep forest colors
      const greenIntensity = 0.3 + rng() * 0.6;
      const color = new THREE.Color(
        0.02 + rng() * 0.05,
        greenIntensity,
        0.01 + rng() * 0.03
      );

      placements.push({
        position,
        rotation,
        scale,
        color,
        leafCount: 2 + Math.floor(rng() * 4), // 2-5 leaves per cluster
      });
    }
  }

  return placements;
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
      const radius = trunkBaseRadius * 0.35 * (1 - rng() * 0.15); // Thinner strands
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
    const primaryBranches = generatePrimaryBranches(trunkHeight, 24, rng); // FEWER but elegant branches
    const primaryGeos: THREE.BufferGeometry[] = [];
    const primaryEndpoints: THREE.Vector3[] = [];

    for (const branch of primaryBranches) {
      primaryGeos.push(createBranch(branch.start, branch.end, 32, branch.radius * 0.7, branch.radius * 0.25, 0.5, rng));
      primaryEndpoints.push(branch.end);
    }

    // ─── SECONDARY BRANCHES ────────────────────────────────────────────────
    const secondaryBranches = generateSecondaryBranches(primaryEndpoints, 10, rng); // FEWER secondary
    const secondaryGeos: THREE.BufferGeometry[] = [];
    const secondaryEndpoints: THREE.Vector3[] = [];

    for (const branch of secondaryBranches) {
      secondaryGeos.push(createBranch(branch.start, branch.end, 24, branch.radius * 0.6, branch.radius * 0.2, 0.5, rng));
      secondaryEndpoints.push(branch.end);
    }

    // ─── TERTIARY BRANCHES (fine detail) ────────────────────────────────────
    const tertiaryEndpoints: THREE.Vector3[] = [];
    for (const ep of secondaryEndpoints) {
      for (let i = 0; i < 5; i++) { // FEWER tertiary branches
        const offset = new THREE.Vector3(
          (rng() - 0.5) * 10,
          5 + rng() * 10,
          (rng() - 0.5) * 10
        );
        tertiaryEndpoints.push(new THREE.Vector3().copy(ep).add(offset));
      }
    }

    // ─── FOLIAGE PLACEMENT ──────────────────────────────────────────────────
    const allEndpoints = [...primaryEndpoints, ...secondaryEndpoints, ...tertiaryEndpoints];
    const foliagePlacements = placeFoliage(allEndpoints, rng, 15); // MORE DENSE foliage clusters

    // ─── HOLLOW INTERIOR WALLS ──────────────────────────────────────────────
    // Create inner bark surface for the hollow trunk
    const interiorSegments = 40;
    const interiorHeight = trunkHeight * 0.85;
    const interiorRadius = trunkBaseRadius * 0.4; // Radius of the hollow cavity
    
    const interiorPositions: number[] = [];
    const interiorNormals: number[] = [];
    const interiorIndices: number[] = [];
    
    for (let y = 0; y <= interiorSegments; y++) {
      const progress = y / interiorSegments;
      const currentY = progress * interiorHeight;
      const radiusAtY = interiorRadius * (1 - progress * 0.25);
      
      const numRadialSegments = 20;
      for (let i = 0; i < numRadialSegments; i++) {
        const angle = (i / numRadialSegments) * Math.PI * 2;
        const nextAngle = ((i + 1) / numRadialSegments) * Math.PI * 2;
        
        // Add some irregularity
        const irregularity = 0.85 + rng() * 0.3;
        const r1 = radiusAtY * irregularity;
        const r2 = radiusAtY * (0.85 + rng() * 0.3);
        
        // Current vertex
        const x1 = Math.cos(angle) * r1;
        const z1 = Math.sin(angle) * r1;
        interiorPositions.push(x1, currentY, z1);
        
        // Normal pointing inward
        interiorNormals.push(-Math.cos(angle), 0.1, -Math.sin(angle));
        
        // Next vertex
        const x2 = Math.cos(nextAngle) * r2;
        const z2 = Math.sin(nextAngle) * r2;
        interiorPositions.push(x2, currentY, z2);
        interiorNormals.push(-Math.cos(nextAngle), 0.1, -Math.sin(nextAngle));
      }
      
      // Indices for this row
      for (let i = 0; i < numRadialSegments * 2; i += 2) {
        const base = (y * numRadialSegments + i) * 2;
        const nextBase = ((y + 1) * numRadialSegments + i) * 2;
        interiorIndices.push(base, nextBase, base + 1);
        interiorIndices.push(base + 1, nextBase, nextBase + 1);
      }
    }
    
    const interiorGeo = new THREE.BufferGeometry();
    interiorGeo.setAttribute('position', new THREE.Float32BufferAttribute(interiorPositions, 3));
    interiorGeo.setAttribute('normal', new THREE.Float32BufferAttribute(interiorNormals, 3));
    interiorGeo.setIndex(interiorIndices);
    interiorGeo.computeVertexNormals();

    return {
      trunkGeo: BufferGeometryUtils.mergeGeometries(trunkGeos),
      rootGeo: BufferGeometryUtils.mergeGeometries(rootGeos),
      primaryGeo: BufferGeometryUtils.mergeGeometries(primaryGeos),
      secondaryGeo: BufferGeometryUtils.mergeGeometries(secondaryGeos),
      interiorGeo,
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
      color: "#5c3a21", // Base rich brown
      roughness: 0.85,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = applyBarkShader;
    return mat;
  }, []);

  const trunkMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#3d2515", // Darker inner brown
      roughness: 0.9,
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
          <meshStandardMaterial color="#6b4423" roughness={0.85} />
        </mesh>
      )}

      {/* ─── SECONDARY BRANCHES ─────────────────────────────────────────────── */}
      {treeStructure.secondaryGeo && (
        <mesh geometry={treeStructure.secondaryGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#7a5230" roughness={0.8} />
        </mesh>
      )}

      {/* ─── HOLLOW INTERIOR WALLS ──────────────────────────────────────────── */}
      {treeStructure.interiorGeo && (
        <mesh geometry={treeStructure.interiorGeo} material={trunkMaterial} receiveShadow />
      )}

      {/* ─── TREE-INTERNAL LIGHTING ─────────────────────────────────────────── */}
      <pointLight position={[0, 90, 0]} color="#fff5cc" intensity={12} distance={150} />
      <pointLight position={[0, 150, 0]} color="#fff8e7" intensity={8} distance={120} />

      {/* ─── PROJECT ARCHIVE NODES (inside trunk) ───────────────────────────── */}
      <group position={[0, 20, 0]}>
        <ArtifactAURA position={[-5, 70, 0]} />
        <ArtifactETTH position={[5, 95, 0]} />
        <ArtifactShadowGuard position={[-5, 120, 0]} />
        <ArtifactSugarAI position={[5, 145, 0]} />
        <ArtifactAchievements position={[-4, 170, 0]} />
        <ArtifactLeadership position={[4, 195, 0]} />
        <ArtifactExperience position={[0, 220, 0]} />
      </group>
    </group>
  );
}
