"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ARCHIVE, HALL_CENTER, PLINTH_HEIGHT, hallAxis } from "@/lib/world/archive";
import { createBarkMaterial, shared } from "@/lib/world/materials";
import { buildTube } from "@/lib/world/geometry";
import { SimplexNoise, createRng, range } from "@/lib/world/noise";
import { HALL_FLOOR, cavityAt } from "@/lib/world/tree";
import { TREE } from "@/lib/world/layout";
import { frame } from "@/lib/world/store";
import { Relics } from "./Relics";
import { GrowthRings } from "./GrowthRings";
import { useWorld } from "./WorldContext";

/**
 * The archive hall at the foot of the hollow: the heart node where the root
 * network converges, a stone plinth in every alcove carrying its relic, warm
 * shafts of light from cracks high in the trunk and dust turning in them.
 * The whole interior is only drawn while the camera is near or inside the tree.
 */

const N = new SimplexNoise(808);

/** Roots woven into a knot around the heart. */
function heartKnot() {
  const rng = createRng(77);
  const geos: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 7; k++) {
    const a0 = (k / 7) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 28; s++) {
      const f = s / 28;
      const a = a0 + f * Math.PI * 1.4 + range(rng, -0.05, 0.05);
      const r = 2.6 - Math.sin(f * Math.PI) * 1.5;
      const y = Math.sin(f * Math.PI) * 2.6 - 0.2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const radii = pts.map((_, i) => 0.42 * (1 - 0.6 * Math.sin((i / (pts.length - 1)) * Math.PI)) + 0.08);
    geos.push(buildTube({ points: pts, radii, radialSegments: 9, bumpiness: 0.1, noise: N, vScale: 2.5, uRepeats: 1 }));
  }
  return geos;
}

/** Shafts of light: tapered, open-ended cones with a soft additive falloff. */
export function createShaftMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime, uColor: { value: new THREE.Color("#ffcf8a") }, uStrength: { value: 0.09 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vFacing;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vFacing = abs(dot(n, normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uStrength;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vFacing;
      void main() {
        float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float flicker = 0.85 + 0.15 * sin(uTime * 0.7 + vUv.x * 12.0);
        float a = pow(vFacing, 2.0) * along * flicker * uStrength;
        gl_FragColor = vec4(uColor * a, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

function Motes({ count = 1400 }: { count?: number }) {
  const { glow } = useWorld();
  const geometry = useMemo(() => {
    const rng = createRng(4242);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const y = HALL_FLOOR + 0.5 + Math.pow(rng(), 1.6) * 60;
      const c = cavityAt(y);
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (c.radius - 1.5);
      pos.set([TREE.x + c.x + Math.cos(a) * r, TREE.y + y, TREE.z + c.z + Math.sin(a) * r], i * 3);
      seed[i] = rng();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.computeBoundingSphere();
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: shared.uTime, uMap: { value: glow }, uScale: { value: 380 } },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime, uScale;
          varying float vA;
          void main() {
            vec3 p = position;
            float t = uTime * (0.05 + 0.08 * aSeed) + aSeed * 40.0;
            p += vec3(sin(t * 1.3) * 0.8, sin(t * 0.7) * 1.4, cos(t * 1.1) * 0.8);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uScale * (0.04 + 0.05 * aSeed) / max(-mv.z, 0.5);
            vA = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 30.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          varying float vA;
          void main() {
            float a = texture2D(uMap, gl_PointCoord).a * vA;
            gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * a * 0.9, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [glow]
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  return <points geometry={geometry} material={material} renderOrder={6} />;
}

export function ArchiveHall() {
  const { assets } = useWorld();
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);

  const res = useMemo(() => {
    const plinth = new THREE.CylinderGeometry(1.15, 1.45, PLINTH_HEIGHT, 8, 1);
    plinth.translate(0, PLINTH_HEIGHT / 2, 0);
    const cap = new THREE.CylinderGeometry(1.22, 1.22, 0.08, 8, 1);
    const stone = new THREE.MeshStandardMaterial({ map: assets.rock.color, normalMap: assets.rock.normal, roughness: 0.92, color: "#a3968a" });
    const bronze = new THREE.MeshStandardMaterial({ color: "#6b5236", metalness: 1, roughness: 0.45 });
    const knotGeos = heartKnot();
    const knotMat = createBarkMaterial(assets, { ground: -1000, moss: 0.2, brightness: 1.3, tint: "#fff1e2" });
    const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ee0cf").multiplyScalar(2.6) });
    const shaftMat = createShaftMaterial();
    // Three shafts slanting in through cracks high on the sun side of the trunk.
    const shafts = [0, 1, 2].map((k) => {
      const y0 = 28 + k * 9;
      const c = cavityAt(y0);
      const a = 0.4 + k * 0.5;
      const top = new THREE.Vector3(TREE.x + c.x + Math.cos(a) * (c.radius - 1), TREE.y + y0, TREE.z + c.z + Math.sin(a) * (c.radius - 1));
      const bottom = HALL_CENTER.clone().add(new THREE.Vector3(Math.cos(a + 2.4) * 9, 0.2, Math.sin(a + 2.4) * 9));
      const len = top.distanceTo(bottom);
      const g = new THREE.CylinderGeometry(1.2 + k * 0.3, 3.2, len, 24, 1, true);
      g.translate(0, -len / 2, 0);
      const m = new THREE.Matrix4().lookAt(top, bottom, new THREE.Vector3(0, 1, 0));
      const q = new THREE.Quaternion().setFromRotationMatrix(m).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
      return { geometry: g, position: top, quaternion: q };
    });
    return { plinth, cap, stone, bronze, knotGeos, knotMat, coreMat, shaftMat, shafts };
  }, [assets]);

  useEffect(
    () => () => {
      res.plinth.dispose();
      res.cap.dispose();
      res.stone.dispose();
      res.bronze.dispose();
      res.knotGeos.forEach((g) => g.dispose());
      res.knotMat.dispose();
      res.coreMat.dispose();
      res.shaftMat.dispose();
      res.shafts.forEach((s) => s.geometry.dispose());
    },
    [res]
  );

  useFrame(() => {
    const p = frame.progress;
    if (group.current) group.current.visible = p > 0.36 && p < 0.975 && !frame.region;
    if (core.current) core.current.scale.setScalar(0.62 + 0.06 * Math.sin(shared.uTime.value * 1.6));
  });

  const heartBase = hallAxis(HALL_FLOOR + 0.2);

  return (
    <group ref={group}>
      {ARCHIVE.map((a) => (
        <group key={a.project.id} position={[a.base.x, a.base.y - PLINTH_HEIGHT, a.base.z]}>
          <mesh geometry={res.plinth} material={res.stone} castShadow receiveShadow />
          <mesh geometry={res.cap} material={res.bronze} position={[0, PLINTH_HEIGHT, 0]} />
        </group>
      ))}
      <group position={heartBase}>
        {res.knotGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={res.knotMat} castShadow receiveShadow />
        ))}
        <mesh ref={core} material={res.coreMat} position={[0, 1.8, 0]}>
          <icosahedronGeometry args={[1, 3]} />
        </mesh>
      </group>
      {res.shafts.map((s, i) => (
        <mesh key={i} geometry={s.geometry} material={res.shaftMat} position={s.position} quaternion={s.quaternion} renderOrder={7} />
      ))}
      <GrowthRings />
      <Motes />
      <Relics />
    </group>
  );
}
