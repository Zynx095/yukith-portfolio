"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Creates a path/road geometry that follows a curve
 */
export function Path() {
  const pathCurve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(3, 0, -20),
      new THREE.Vector3(-2, 0, -50),
      new THREE.Vector3(5, 0, -80),
      new THREE.Vector3(-3, 0, -110),
      new THREE.Vector3(8, 0, -140),
      new THREE.Vector3(-5, 0, -170),
      new THREE.Vector3(2, 0, -200),
      new THREE.Vector3(-8, 0, -230),
      new THREE.Vector3(4, 0, -260),
      new THREE.Vector3(-3, 0, -290),
      new THREE.Vector3(6, 0, -320),
      new THREE.Vector3(-2, 0, -350),
      new THREE.Vector3(0, 0, -380),
      new THREE.Vector3(-5, 0, -410),
      new THREE.Vector3(3, 0, -430),
      new THREE.Vector3(0, 0, -450),
    ];
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const geometry = useMemo(() => {
    const segments = 200;
    const width = 8;
    const points = pathCurve.getSpacedPoints(segments);
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    for (let i = 0; i <= segments; i++) {
      const point = points[i];
      const tangent = pathCurve.getTangentAt(i / segments);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      const left = point.clone().add(normal.clone().multiplyScalar(width / 2));
      const right = point.clone().add(normal.clone().multiplyScalar(-width / 2));
      
      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);
      uvs.push(0, i / segments * 10);
      uvs.push(1, i / segments * 10);
      
      if (i < segments) {
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
  }, [pathCurve]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -150]} receiveShadow>
      <meshStandardMaterial
        color="#4A4540"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}

// Lighting torches/lanterns along the path
export function PathLights() {
  const lights = useMemo(() => {
    const data = [];
    const rng = (() => {
      let s = 123;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    })();
    
    for (let i = 0; i < 20; i++) {
      const z = -30 - i * 22;
      const side = i % 2 === 0 ? 6 : -6;
      data.push({ x: side, z, index: i });
    }
    return data;
  }, []);

  return (
    <group>
      {lights.map((light) => (
        <group key={`torch-${light.index}`} position={[light.x, -2, light.z]}>
          {/* Torch pole */}
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.15, 3.5, 5]} />
            <meshStandardMaterial color="#5A4A35" roughness={0.9} />
          </mesh>
          
          {/* Flame */}
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshBasicMaterial color="#FFAA44" transparent opacity={0.9} />
          </mesh>
          
          {/* Light */}
          <pointLight
            color="#FFAA44"
            intensity={2.5}
            distance={18}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}
