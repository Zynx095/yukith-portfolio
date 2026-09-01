"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Shih Tzu Dog (Bella) - More Detailed ─────────────────────────────────────
function Bella() {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(3, 0, -65));
  const targetRef = useRef(new THREE.Vector3(-3, 0, -68));
  const isAtTarget = useRef(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    const currentPos = groupRef.current.position;
    const target = isAtTarget.current ? posRef.current : targetRef.current;

    currentPos.lerp(target, delta * 2);

    // Walking bounce
    const bounce = Math.abs(Math.sin(time * 10)) * 0.12;
    currentPos.y = bounce;

    // Tail wag
    const tail = groupRef.current.children[6] as THREE.Mesh;
    if (tail) {
      tail.rotation.z = Math.sin(time * 8) * 0.5;
    }

    // Direction
    const dir = new THREE.Vector3().subVectors(target, currentPos);
    if (dir.length() > 0.1) {
      groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
    }

    if (currentPos.distanceTo(target) < 0.3) {
      isAtTarget.current = !isAtTarget.current;
      setTimeout(() => {}, 1500 + Math.random() * 2000);
    }
  });

  return (
    <group ref={groupRef} position={[3, 0, -65]} scale={0.85}>
      {/* Body - fluffy shih tzu */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.2, 0.45, 4, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.95} />
      </mesh>

      {/* Chest fluff */}
      <mesh castShadow position={[0, 0.4, 0.15]}>
        <sphereGeometry args={[0.18, 6, 6]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.9} />
      </mesh>

      {/* Head - round fluffy head */}
      <mesh castShadow position={[0, 0.7, 0.2]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.9} />
      </mesh>

      {/* Fluffy ears - droopy */}
      <mesh position={[-0.2, 0.82, 0.15]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.08, 0.18, 4, 6]} />
        <meshStandardMaterial color="#c49464" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.82, 0.15]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.08, 0.18, 4, 6]} />
        <meshStandardMaterial color="#c49464" roughness={0.9} />
      </mesh>

      {/* Face - dark mask around eyes */}
      <mesh position={[-0.08, 0.68, 0.32]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, 0.68, 0.32]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.08, 0.72, 0.38]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.08, 0.72, 0.38]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.62, 0.4]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Mouth line */}
      <mesh position={[0, 0.56, 0.38]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>

      {/* Tail - curled up */}
      <mesh position={[0, 0.6, -0.22]} rotation={[0.6, 0, 0]}>
        <capsuleGeometry args={[0.07, 0.22, 4, 6]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.9} />
      </mesh>

      {/* Legs - with paws */}
      {[[-0.12, 0.12, 0.14], [0.12, 0.12, 0.14], [-0.12, 0.12, -0.14], [0.12, 0.12, -0.14]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <capsuleGeometry args={[0.06, 0.18, 4, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#f5e6d3" : "#d4a574"} roughness={0.9} />
        </mesh>
      ))}

      {/* Paw pads */}
      {[[-0.12, 0.02, 0.18], [0.12, 0.02, 0.18], [-0.12, 0.02, -0.18], [0.12, 0.02, -0.18]].map((pos, i) => (
        <mesh key={`paw-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#c49464" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Dad Character - More Detailed ─────────────────────────────────────────────
function DadCharacter() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(time * 1.5) * 0.015;
  });

  return (
    <group position={[5, 0, -63]} scale={1.15}>
      {/* torso - broad shoulders */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.32, 0.75, 4, 8]} />
        <meshStandardMaterial color="#3a5a7a" roughness={0.8} />
      </mesh>

      {/* Chest definition */}
      <mesh castShadow position={[0, 1.0, 0.18]}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshStandardMaterial color="#3a5a7a" roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.26, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Jawline */}
      <mesh position={[0, 1.38, 0.05]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Short hair - crew cut */}
      <mesh position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.27, 8, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.09, 1.55, 0.22]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.1, 0.02, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.09, 1.55, 0.22]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.1, 0.02, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.09, 1.52, 0.24]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.09, 1.52, 0.24]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.09, 1.52, 0.27]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      <mesh position={[0.09, 1.52, 0.27]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.45, 0.26]}>
        <capsuleGeometry args={[0.035, 0.04, 4, 6]} />
        <meshStandardMaterial color="#c49464" roughness={0.7} />
      </mesh>

      {/* Mouth - slight smile */}
      <mesh position={[0, 1.38, 0.24]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.02]} />
        <meshStandardMaterial color="#8a4a3a" />
      </mesh>

      {/* Neck */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.2, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Arms - muscular */}
      <mesh position={[0.4, 0.85, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3a5a7a" roughness={0.8} />
      </mesh>
      <mesh position={[-0.4, 0.85, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3a5a7a" roughness={0.8} />
      </mesh>

      {/* Forearms */}
      <mesh position={[0.45, 0.55, 0.1]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh position={[-0.45, 0.55, 0.1]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Hands */}
      <mesh position={[0.48, 0.35, 0.15]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh position={[-0.48, 0.35, 0.15]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Legs - sturdy */}
      {[[-0.18, 0.22, 0], [0.18, 0.22, 0]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <capsuleGeometry args={[0.12, 0.45, 4, 8]} />
          <meshStandardMaterial color="#2a3a4a" roughness={0.9} />
        </mesh>
      ))}

      {/* Shoes */}
      {[[-0.18, 0.02, 0.05], [0.18, 0.02, 0.05]].map((pos, i) => (
        <mesh key={`shoe-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.14, 0.08, 0.22]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Mom Character - More Detailed ─────────────────────────────────────────────
function MomCharacter() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(time * 1.2 + 1) * 0.015;
  });

  return (
    <group position={[2, 0, -67]} scale={1.0}>
      {/* Body - elegant */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.26, 0.65, 4, 8]} />
        <meshStandardMaterial color="#8a4a6a" roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.23, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.08, 1.4, 0.2]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.08, 1.4, 0.2]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.08, 1.4, 0.23]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh position={[0.08, 1.4, 0.23]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>

      {/* Eyelashes */}
      <mesh position={[-0.08, 1.43, 0.24]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.04, 0.008, 0.01]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.08, 1.43, 0.24]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.04, 0.008, 0.01]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.32, 0.22]}>
        <capsuleGeometry args={[0.03, 0.03, 4, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Lips - smiling */}
      <mesh position={[0, 1.26, 0.22]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.06, 0.02, 4, 6]} />
        <meshStandardMaterial color="#c45a5a" roughness={0.5} />
      </mesh>

      {/* Long hair - flowing */}
      <mesh position={[0, 1.5, -0.08]}>
        <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, -0.25]}>
        <capsuleGeometry args={[0.18, 0.4, 4, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.2, 1.3, -0.15]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.12, 0.35, 4, 6]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 1.3, -0.15]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.12, 0.35, 4, 6]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>

      {/* Arms - graceful */}
      <mesh position={[0.32, 0.75, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 6]} />
        <meshStandardMaterial color="#8a4a6a" roughness={0.8} />
      </mesh>
      <mesh position={[-0.32, 0.75, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 6]} />
        <meshStandardMaterial color="#8a4a6a" roughness={0.8} />
      </mesh>

      {/* Forearms */}
      <mesh position={[0.38, 0.45, 0.08]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.06, 0.35, 4, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh position={[-0.38, 0.45, 0.08]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.06, 0.35, 4, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Hands */}
      <mesh position={[0.4, 0.28, 0.12]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh position={[-0.4, 0.28, 0.12]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Legs - slender */}
      {[[-0.13, 0.18, 0], [0.13, 0.18, 0]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <capsuleGeometry args={[0.08, 0.38, 4, 6]} />
          <meshStandardMaterial color="#7a3a5a" roughness={0.9} />
        </mesh>
      ))}

      {/* Shoes */}
      {[[-0.13, 0.02, 0.04], [0.13, 0.02, 0.04]].map((pos, i) => (
        <mesh key={`shoe-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[0.1, 0.06, 0.18]} />
          <meshStandardMaterial color="#5a2a3a" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Aunt Character - More Detailed ────────────────────────────────────────────
function AuntCharacter() {
  return (
    <group position={[-2, 0, -66]} scale={0.95}>
      {/* Body */}
      <mesh castShadow position={[0, 0.72, 0]}>
        <capsuleGeometry args={[0.24, 0.58, 4, 8]} />
        <meshStandardMaterial color="#5a7a6a" roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.21, 8, 8]} />
        <meshStandardMaterial color="#c49464" roughness={0.7} />
      </mesh>

      {/* Eyes behind glasses */}
      <mesh position={[-0.07, 1.32, 0.18]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.07, 1.32, 0.18]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.07, 1.32, 0.21]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
      <mesh position={[0.07, 1.32, 0.21]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>

      {/* Glasses frames */}
      <mesh position={[-0.07, 1.32, 0.22]}>
        <torusGeometry args={[0.05, 0.008, 4, 12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.07, 1.32, 0.22]}>
        <torusGeometry args={[0.05, 0.008, 4, 12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.32, 0.23]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
      </mesh>
      <mesh position={[-0.12, 1.32, 0.2]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.005, 0.005, 0.15, 4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
      </mesh>
      <mesh position={[0.12, 1.32, 0.2]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.005, 0.005, 0.15, 4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.26, 0.2]}>
        <capsuleGeometry args={[0.028, 0.02, 4, 6]} />
        <meshStandardMaterial color="#c49464" roughness={0.7} />
      </mesh>

      {/* Gentle smile */}
      <mesh position={[0, 1.2, 0.19]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.08, 0.015, 0.015]} />
        <meshStandardMaterial color="#a46a5a" />
      </mesh>

      {/* Hair - ponytail */}
      <mesh position={[0, 1.42, -0.06]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.28, -0.22]}>
        <capsuleGeometry args={[0.1, 0.28, 4, 6]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>

      {/* Arms */}
      <mesh position={[0.3, 0.7, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.065, 0.42, 4, 6]} />
        <meshStandardMaterial color="#5a7a6a" roughness={0.8} />
      </mesh>
      <mesh position={[-0.3, 0.7, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.065, 0.42, 4, 6]} />
        <meshStandardMaterial color="#5a7a6a" roughness={0.8} />
      </mesh>

      {/* Legs */}
      {[[-0.11, 0.18, 0], [0.11, 0.18, 0]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <capsuleGeometry args={[0.07, 0.35, 4, 6]} />
          <meshStandardMaterial color="#4a6a5a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Grandma Character (sitting) - More Detailed ───────────────────────────────
function GrandmaCharacter() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(time * 0.8) * 0.02;
  });

  return (
    <group position={[-4, 0, -63]} scale={0.9}>
      {/* Sitting body - hunched */}
      <mesh castShadow position={[0, 0.4, 0]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.24, 0.45, 4, 8]} />
        <meshStandardMaterial color="#7a6a8a" roughness={0.8} />
      </mesh>

      {/* Head - tilted slightly */}
      <mesh castShadow position={[0.05, 0.88, 0.05]} rotation={[-0.1, 0.1, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#d4b090" roughness={0.7} />
      </mesh>

      {/* Eyes - closed/peaceful */}
      <mesh position={[-0.07, 0.92, 0.2]}>
        <boxGeometry args={[0.05, 0.008, 0.01]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
      <mesh position={[0.07, 0.92, 0.2]}>
        <boxGeometry args={[0.05, 0.008, 0.01]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>

      {/* Wrinkles */}
      <mesh position={[0, 0.85, 0.22]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 0.005, 0.005]} />
        <meshStandardMaterial color="#b49a7a" />
      </mesh>
      <mesh position={[0, 0.82, 0.22]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.06, 0.005, 0.005]} />
        <meshStandardMaterial color="#b49a7a" />
      </mesh>

      {/* White hair - bun */}
      <mesh position={[0, 1.02, -0.04]}>
        <sphereGeometry args={[0.21, 8, 8]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.92, -0.18]}>
        <sphereGeometry args={[0.13, 6, 6]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.9} />
      </mesh>

      {/* Blanket over lap */}
      <mesh position={[0, 0.22, 0.18]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.5]} />
        <meshStandardMaterial color="#9a7a6a" roughness={1} />
      </mesh>

      {/* Walking stick */}
      <mesh position={[0.38, 0.55, 0.05]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.03, 0.035, 1.1, 6]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0.38, 0.05, 0.05]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
      </mesh>

      {/* Feet under blanket */}
      <mesh position={[-0.12, 0.08, 0.2]}>
        <boxGeometry args={[0.1, 0.06, 0.18]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.08, 0.2]}>
        <boxGeometry args={[0.1, 0.06, 0.18]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Girlfriend Character - More Detailed ──────────────────────────────────────
function GirlfriendCharacter() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(time * 1.0 + 2) * 0.015;
  });

  return (
    <group position={[0, 0, -70]} scale={0.95}>
      {/* Body - slimmer figure */}
      <mesh castShadow position={[0, 0.68, 0]}>
        <capsuleGeometry args={[0.22, 0.58, 4, 8]} />
        <meshStandardMaterial color="#d86c8f" roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.21, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Eyes - looking to side */}
      <mesh position={[-0.07, 1.32, 0.18]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.07, 1.32, 0.18]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.05, 1.32, 0.21]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      <mesh position={[0.09, 1.32, 0.21]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.07, 1.36, 0.2]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.08, 0.012, 0.015]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      <mesh position={[0.07, 1.36, 0.2]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.08, 0.012, 0.015]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.26, 0.2]}>
        <capsuleGeometry args={[0.025, 0.025, 4, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Lips - fuller */}
      <mesh position={[0, 1.2, 0.21]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.07, 0.02, 4, 6]} />
        <meshStandardMaterial color="#c45a6a" roughness={0.4} />
      </mesh>

      {/* Long flowing hair */}
      <mesh position={[0, 1.42, -0.06]}>
        <capsuleGeometry args={[0.23, 0.45, 4, 8]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.15, -0.28]}>
        <capsuleGeometry args={[0.14, 0.4, 4, 6]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.18, 1.25, -0.18]} rotation={[0, 0, 0.25]}>
        <capsuleGeometry args={[0.1, 0.35, 4, 6]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 1.25, -0.18]} rotation={[0, 0, -0.25]}>
        <capsuleGeometry args={[0.1, 0.35, 4, 6]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>

      {/* Arms - holding something */}
      <mesh position={[0.28, 0.65, 0.12]} rotation={[0, 0, -0.25]}>
        <capsuleGeometry args={[0.055, 0.38, 4, 6]} />
        <meshStandardMaterial color="#d86c8f" roughness={0.8} />
      </mesh>
      <mesh position={[-0.28, 0.65, 0.12]} rotation={[0, 0, 0.25]}>
        <capsuleGeometry args={[0.055, 0.38, 4, 6]} />
        <meshStandardMaterial color="#d86c8f" roughness={0.8} />
      </mesh>

      {/* Hands */}
      <mesh position={[0.32, 0.48, 0.18]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh position={[-0.32, 0.48, 0.18]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Legs */}
      {[[-0.1, 0.18, 0], [0.1, 0.18, 0]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <capsuleGeometry args={[0.065, 0.35, 4, 6]} />
          <meshStandardMaterial color="#c85c7f" roughness={0.9} />
        </mesh>
      ))}

      {/* Sandals */}
      {[[-0.1, 0.03, 0.04], [0.1, 0.03, 0.04]].map((pos, i) => (
        <mesh key={`sandal-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[0.08, 0.03, 0.16]} />
          <meshStandardMaterial color="#8a4a5a" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Brother Character (chunky boy) - More Detailed ────────────────────────────
function BrotherCharacter() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    groupRef.current.position.y = Math.abs(Math.sin(time * 3.5)) * 0.25;
    groupRef.current.rotation.y = Math.sin(time * 2.5) * 0.4;
  });

  return (
    <group position={[-1, 0, -69]} scale={0.85}>
      {/* Chunky body */}
      <mesh castShadow position={[0, 0.58, 0]}>
        <capsuleGeometry args={[0.34, 0.52, 4, 8]} />
        <meshStandardMaterial color="#cc6633" roughness={0.8} />
      </mesh>

      {/* Belly */}
      <mesh castShadow position={[0, 0.45, 0.18]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#cc6633" roughness={0.8} />
      </mesh>

      {/* Head - slightly larger for child */}
      <mesh castShadow position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.27, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Eyes - big and round */}
      <mesh position={[-0.09, 1.18, 0.22]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.09, 1.18, 0.22]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.09, 1.18, 0.26]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      <mesh position={[0.09, 1.18, 0.26]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>

      {/* Cheeks - rosy */}
      <mesh position={[-0.18, 1.1, 0.18]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#e8a0a0" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.18, 1.1, 0.18]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#e8a0a0" transparent opacity={0.6} />
      </mesh>

      {/* Mouth - big smile */}
      <mesh position={[0, 1.02, 0.24]} rotation={[0.2, 0, 0]}>
        <sphereGeometry args={[0.06, 6, 4, 0, Math.PI]} />
        <meshStandardMaterial color="#a44a3a" />
      </mesh>

      {/* Messy hair */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 1.35, 0.08]} rotation={[0.3, 0, 0.2]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.1, 1.38, -0.05]} rotation={[-0.2, 0, -0.15]}>
        <sphereGeometry args={[0.09, 6, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>

      {/* Big arms - excited */}
      <mesh position={[0.45, 0.7, 0]} rotation={[0, 0, -0.7]}>
        <capsuleGeometry args={[0.09, 0.38, 4, 6]} />
        <meshStandardMaterial color="#cc6633" roughness={0.8} />
      </mesh>
      <mesh position={[-0.45, 0.7, 0]} rotation={[0, 0, 0.7]}>
        <capsuleGeometry args={[0.09, 0.38, 4, 6]} />
        <meshStandardMaterial color="#cc6633" roughness={0.8} />
      </mesh>

      {/* Hands */}
      <mesh position={[0.52, 0.48, 0.12]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh position={[-0.52, 0.48, 0.12]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Chunky legs */}
      {[[-0.2, 0.2, 0], [0.2, 0.2, 0]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <capsuleGeometry args={[0.11, 0.35, 4, 6]} />
          <meshStandardMaterial color="#bb5522" roughness={0.9} />
        </mesh>
      ))}

      {/* Sneakers */}
      {[[-0.2, 0.04, 0.06], [0.2, 0.04, 0.06]].map((pos, i) => (
        <mesh key={`shoe-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.14, 0.08, 0.22]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#ff6633" : "#3366ff"} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Campfire ──────────────────────────────────────────────────────────────────
function Campfire() {
  const fireRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!fireRef.current) return;
    const time = state.clock.elapsedTime * 7;

    fireRef.current.scale.set(
      1 + Math.sin(time) * 0.12,
      1 + Math.sin(time * 1.4) * 0.18,
      1 + Math.cos(time) * 0.12
    );
  });

  return (
    <group position={[0, 0, -66]}>
      {/* Stone ring */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={`stone-${i}`}
            position={[Math.cos(angle) * 1.1, 0.14, Math.sin(angle) * 1.1]}
            rotation={[Math.random() * 0.4, angle, 0]}
          >
            <dodecahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color="#4a4a45" roughness={1} />
          </mesh>
        );
      })}

      {/* Logs */}
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.13, 1.5, 6]} />
        <meshStandardMaterial color="#3a2510" roughness={1} />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 1.5, 6]} />
        <meshStandardMaterial color="#3a2510" roughness={1} />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.4, 6]} />
        <meshStandardMaterial color="#4a3020" roughness={1} />
      </mesh>

      {/* Fire glow */}
      <group ref={fireRef} position={[0, 0.55, 0]}>
        <mesh>
          <coneGeometry args={[0.55, 1.3, 6]} />
          <meshStandardMaterial
            color="#ff6622"
            emissive="#ff4400"
            emissiveIntensity={2.5}
            transparent
            opacity={0.9}
          />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.35, 0.9, 6]} />
          <meshStandardMaterial
            color="#ffaa33"
            emissive="#ff8800"
            emissiveIntensity={3}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <coneGeometry args={[0.2, 0.6, 6]} />
          <meshStandardMaterial
            color="#ffdd44"
            emissive="#ffaa00"
            emissiveIntensity={3.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* Fire light */}
      <pointLight color="#ff8844" intensity={12} distance={30} castShadow />
    </group>
  );
}

// ─── Main Family Campfire Scene ────────────────────────────────────────────────
export function FamilyCampfire() {
  return (
    <group>
      <Campfire />
      <DadCharacter />
      <MomCharacter />
      <AuntCharacter />
      <GrandmaCharacter />
      <GirlfriendCharacter />
      <BrotherCharacter />
      <Bella />
    </group>
  );
}
