"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldResources } from "./WorldResources";
import { buildHallFloor, generateWorldTree, type LeafAnchor } from "@/lib/world/tree";
import { TREE, TREE_GROUND } from "@/lib/world/layout";
import { createBarkMaterial, createFoliageDepthMaterial, createFoliageMaterial, sharedUniforms } from "@/lib/world/materials";
import { buildLeafMass, mergeGeometries } from "@/lib/world/geometry";
import { createRng, range } from "@/lib/world/noise";
import { frame } from "@/lib/world/store";

/**
 * The World Tree: a braid of great stems in deeply furrowed bark with golden
 * sap-light in its fissures, carrying a vast luminous crown — volumetric
 * leaf masses, a haze of light inside the canopy, glints among the leaves,
 * a halo across the sky behind it, and golden leaves forever drifting down.
 */

const GOLD_TINTS = ["#e09a22", "#f0b02e", "#c9811a", "#ffc43f", "#d8901f", "#b56d12", "#f5ba38", "#ffd05a"];

/** Leaf-mass radius as a fraction of an anchor's scale. */
const MASS_RADIUS = 0.6;

/** Huge soft glow behind the crown, always facing the camera. */
function CrownHalo() {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: { uOpacity: { value: 1 }, uTime: sharedUniforms.uTime },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacity, uTime;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            p.y *= 1.25;
            float d = length(p);
            // Faint, slowly turning rays of light radiating from the crown.
            float a = atan(p.y, p.x);
            float rays = (0.5 + 0.5 * sin(a * 11.0 + uTime * 0.04)) * (0.5 + 0.5 * sin(a * 7.0 - uTime * 0.027 + 1.7));
            float fall = max(0.0, 1.0 - d);
            float glow = pow(fall, 2.0) * (0.34 + 0.3 * rays) + pow(fall, 5.0) * 0.6;
            gl_FragColor = vec4(vec3(1.0, 0.64, 0.24) * glow * uOpacity, 1.0);
          }
        `,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    ref.current.quaternion.copy(camera.quaternion);
    material.uniforms.uOpacity.value = 1.0 * (1 - frame.interior);
    ref.current.visible = frame.interior < 0.99;
  });
  return (
    <mesh ref={ref} material={material} position={[0, 480, -80]} renderOrder={-500} frustumCulled={false}>
      <planeGeometry args={[1900, 1900]} />
    </mesh>
  );
}

/** Golden leaves drifting down around the crown and through the air near the camera. GPU-animated. */
function FallingLeaves() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: {
          uTime: sharedUniforms.uTime,
          uCamera: { value: new THREE.Vector3() },
          uFade: { value: 0 },
          uScale: { value: 1000 },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uCamera;
          uniform float uScale;
          attribute vec4 aSeed;
          varying float vAlpha;
          varying float vSpin;
          void main() {
            // Each leaf lives in a box that wraps around the camera, so the air is never empty.
            vec3 box = vec3(140.0, 90.0, 140.0);
            vec3 p = position;
            float fall = uTime * (2.2 + aSeed.x * 2.4);
            p.y -= fall;
            p.x += sin(uTime * (0.5 + aSeed.y) + aSeed.z * 6.28) * 3.5;
            p.z += cos(uTime * (0.4 + aSeed.x) + aSeed.w * 6.28) * 3.5;
            vec3 rel = mod(p - uCamera + box * 0.5, box) - box * 0.5;
            vec3 world = uCamera + rel;
            vec4 mv = modelViewMatrix * vec4(world, 1.0);
            float dist = -mv.z;
            gl_PointSize = clamp((0.09 + aSeed.w * 0.08) * uScale / max(dist, 1.0), 1.0, 15.0);
            vAlpha = smoothstep(70.0, 25.0, length(rel)) * smoothstep(1.5, 6.0, dist);
            vSpin = uTime * (1.0 + aSeed.y * 2.0) + aSeed.z * 6.28;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uFade;
          varying float vAlpha;
          varying float vSpin;
          void main() {
            vec2 c = gl_PointCoord * 2.0 - 1.0;
            float s = sin(vSpin), co = cos(vSpin);
            c = mat2(co, -s, s, co) * c;
            c.x *= 1.9 + 0.8 * sin(vSpin * 0.7); // leaf turning edge-on as it tumbles
            float leaf = smoothstep(1.0, 0.55, length(c));
            if (leaf < 0.01) discard;
            gl_FragColor = vec4(vec3(1.0, 0.58, 0.16) * 1.15, leaf * vAlpha * uFade);
          }
        `,
      }),
    []
  );
  const geometry = useMemo(() => {
    const rng = createRng(2027);
    const count = 900;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rng() - 0.5) * 140;
      pos[i * 3 + 1] = (rng() - 0.5) * 90;
      pos[i * 3 + 2] = (rng() - 0.5) * 140;
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = rng();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    return g;
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  useFrame(({ camera, gl }) => {
    material.uniforms.uCamera.value.copy(camera.position);
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    material.uniforms.uScale.value = gl.domElement.height / (2 * Math.tan(fov / 2));
    // Leaves appear once the tree dominates the view, and stay out of the hollow.
    material.uniforms.uFade.value = THREE.MathUtils.smoothstep(frame.progress, 0.27, 0.36) * (1 - frame.interior);
  });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export { FallingLeaves };

/**
 * Light living inside the crown: large soft billboards of golden haze set
 * among the leaf masses (occluded by the leaves in front of them, so the
 * glow seems to come from within), plus thousands of twinkling glints on
 * the skin of the canopy. Both fade away once the camera is inside the trunk.
 */
function CrownLight({ anchors }: { anchors: LeafAnchor[] }) {
  const haze = useMemo(() => {
    const rng = createRng(4040);
    const plane = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute("position", plane.getAttribute("position"));
    geo.setAttribute("uv", plane.getAttribute("uv"));
    const picks = anchors.filter((_, i) => i % 2 === 0);
    const offset = new Float32Array(picks.length * 3);
    const size = new Float32Array(picks.length);
    const seed = new Float32Array(picks.length);
    picks.forEach((a, i) => {
      offset[i * 3] = a.position.x + range(rng, -10, 10);
      offset[i * 3 + 1] = a.position.y + range(rng, -4, 12);
      offset[i * 3 + 2] = a.position.z + range(rng, -10, 10);
      size[i] = a.scale * range(rng, 2.4, 3.6);
      seed[i] = rng();
    });
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offset, 3));
    geo.setAttribute("aSize", new THREE.InstancedBufferAttribute(size, 1));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 1));
    geo.instanceCount = picks.length;
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: sharedUniforms.uTime, uIntensity: { value: 0.16 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute vec3 aOffset;
        attribute float aSize, aSeed;
        varying vec2 vUv;
        varying float vFade;
        void main() {
          vUv = uv;
          vec3 center = (modelMatrix * vec4(aOffset, 1.0)).xyz;
          vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          float s = aSize * (1.0 + 0.07 * sin(uTime * 0.3 + aSeed * 6.283));
          vec3 world = center + (right * position.x + up * position.y) * s;
          // Never let a sprite fill the screen when the camera passes close.
          vFade = smoothstep(aSize * 0.45, aSize * 1.5, distance(cameraPosition, center));
          gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uIntensity;
        varying vec2 vUv;
        varying float vFade;
        void main() {
          float d = length(vUv * 2.0 - 1.0);
          float g = pow(max(0.0, 1.0 - d), 2.6);
          gl_FragColor = vec4(vec3(1.0, 0.62, 0.2) * g * uIntensity * vFade, 1.0);
        }
      `,
    });
    plane.dispose();
    return { geo, mat };
  }, [anchors]);

  const glints = useMemo(() => {
    const rng = createRng(5151);
    const count = 5200;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const dir = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const a = anchors[Math.floor(rng() * anchors.length)];
      const u = rng() * 2 - 1;
      const t = rng() * Math.PI * 2;
      const ring = Math.sqrt(1 - u * u);
      dir.set(Math.cos(t) * ring, u * 0.85, Math.sin(t) * ring);
      const r = a.scale * MASS_RADIUS * range(rng, 0.85, 1.12);
      pos[i * 3] = a.position.x + dir.x * r;
      pos[i * 3 + 1] = a.position.y + dir.y * r;
      pos[i * 3 + 2] = a.position.z + dir.z * r;
      seed[i] = rng();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: sharedUniforms.uTime, uScale: { value: 1000 }, uFade: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uTime, uScale;
        attribute float aSeed;
        varying float vTwinkle;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vTwinkle = pow(0.5 + 0.5 * sin(uTime * (0.5 + aSeed * 1.3) + aSeed * 61.0), 8.0);
          gl_PointSize = clamp((0.7 + aSeed * 0.9) * uScale / -mv.z * (0.5 + vTwinkle), 1.0, 7.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uFade;
        varying float vTwinkle;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * a * (0.25 + vTwinkle * 2.6) * uFade, 1.0);
        }
      `,
    });
    return { geo, mat };
  }, [anchors]);

  useEffect(
    () => () => {
      haze.geo.dispose();
      haze.mat.dispose();
      glints.geo.dispose();
      glints.mat.dispose();
    },
    [haze, glints]
  );

  const group = useRef<THREE.Group>(null);
  useFrame(({ camera, gl }) => {
    const outside = 1 - frame.interior;
    if (group.current) group.current.visible = outside > 0.01;
    haze.mat.uniforms.uIntensity.value = 0.16 * outside;
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    glints.mat.uniforms.uScale.value = gl.domElement.height / (2 * Math.tan(fov / 2));
    glints.mat.uniforms.uFade.value = outside;
  });

  return (
    <group ref={group}>
      <mesh geometry={haze.geo} material={haze.mat} frustumCulled={false} renderOrder={5} />
      <points geometry={glints.geo} material={glints.mat} frustumCulled={false} renderOrder={6} />
    </group>
  );
}

export function WorldTree() {
  const { textures, interiorEnv } = useWorldResources();
  const data = useMemo(() => generateWorldTree(), []);

  const materials = useMemo(() => {
    const ground = TREE_GROUND;
    const outer = createBarkMaterial(textures, {
      deep: "#24170e",
      mid: "#56391f",
      ridge: "#8a6a49",
      moss: "#4b5a2a",
      mossAmount: 0.45,
      ground,
      glow: 1.8,
      glowColor: "#ffae3a",
      glowFrom: ground + 30,
      glowTo: ground + 300,
      detail: 2.7,
    });
    const limbs = createBarkMaterial(textures, {
      deep: "#2a190d",
      mid: "#5f3f22",
      ridge: "#9b774f",
      moss: "#4b5a2a",
      mossAmount: 0.25,
      ground,
      glow: 3.2,
      glowColor: "#ffb847",
      glowFrom: ground + 150,
      glowTo: ground + 360,
    });
    const inner = createBarkMaterial(textures, {
      surface: "wood",
      deep: "#1a0d06",
      mid: "#4a2915",
      ridge: "#7d5232",
      moss: "#4b4524",
      mossAmount: 0.08,
      ground,
      envMap: interiorEnv,
      envMapIntensity: 1.2,
      glow: 1.9,
      glowColor: "#ffb547",
      glowFrom: ground - 5,
      glowTo: ground + 60,
      glowEdge: 0.86,
      detail: 2.2,
    });
    const innerRoots = createBarkMaterial(textures, {
      deep: "#1d0e06",
      mid: "#5e331a",
      ridge: "#a1683c",
      moss: "#55502a",
      mossAmount: 0.12,
      ground,
      envMap: interiorEnv,
      envMapIntensity: 1.2,
      glow: 1.6,
      glowColor: "#ffb547",
      glowFrom: ground - 5,
      glowTo: ground + 60,
      glowEdge: 0.9,
    });
    const floor = createBarkMaterial(textures, {
      deep: "#140b06",
      mid: "#2f1d10",
      ridge: "#5b3b22",
      moss: "#3a3518",
      mossAmount: 0.15,
      ground,
      envMap: interiorEnv,
      envMapIntensity: 1.0,
      glow: 1.4,
      glowColor: "#ffb547",
      glowFrom: ground - 5,
      glowTo: ground + 8,
      glowEdge: 0.9,
      detail: 3.3,
    });
    const canopy = createFoliageMaterial(textures, { cell: 3, wind: 0.16, translucency: 1.3, selfGlow: 1.6, vertexColors: true });
    const canopyDepth = createFoliageDepthMaterial(textures, { cell: 3, wind: 0.16 });
    return { outer, limbs, inner, innerRoots, floor, canopy, canopyDepth };
  }, [textures, interiorEnv]);

  const merged = useMemo(
    () => ({
      roots: mergeGeometries(data.roots),
      limbs: mergeGeometries(data.branches[0]),
      branches: mergeGeometries([...data.branches[1], ...data.branches[2]]),
      interior: mergeGeometries(data.interior),
      floor: buildHallFloor(),
    }),
    [data]
  );

  const clump = useMemo(() => buildLeafMass(56, 3, 0.25), []);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = canopyRef.current;
    if (!mesh) return;
    const rng = createRng(77);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const color = new THREE.Color();
    data.anchors.forEach((a, i) => {
      // Masses stay upright (their flattening is vertical); only spin and a slight lean vary.
      e.set(range(rng, -0.25, 0.25), rng() * Math.PI * 2, range(rng, -0.25, 0.25));
      q.setFromEuler(e);
      const s = a.scale * MASS_RADIUS;
      m.compose(a.position, q, new THREE.Vector3(s, s * 0.86, s));
      mesh.setMatrixAt(i, m);
      color.set(GOLD_TINTS[Math.floor(a.tint * GOLD_TINTS.length) % GOLD_TINTS.length]);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [data]);

  useEffect(
    () => () => {
      Object.values(merged).forEach((g) => g.dispose());
      [data.outerShell, data.innerShell, data.crownRim, data.tunnel].forEach((g) => g.dispose());
      clump.dispose();
      Object.values(materials).forEach((mat) => mat.dispose());
    },
    [merged, data, clump, materials]
  );

  // Draw only what can be seen: the hollow from inside, the exterior from outside.
  const outsideRef = useRef<THREE.Group>(null);
  const insideRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (outsideRef.current) outsideRef.current.visible = frame.interior < 0.995;
    if (insideRef.current) insideRef.current.visible = frame.progress > 0.43;
  });

  return (
    <group position={[TREE.x, TREE_GROUND, TREE.z]}>
      <group ref={outsideRef}>
        <mesh geometry={data.outerShell} material={materials.outer} castShadow receiveShadow />
        <mesh geometry={merged.roots} material={materials.outer} castShadow receiveShadow />
        <mesh geometry={data.tunnel} material={materials.outer} receiveShadow />
        <mesh geometry={merged.limbs} material={materials.limbs} castShadow receiveShadow />
        <mesh geometry={merged.branches} material={materials.limbs} castShadow />
        <instancedMesh
          ref={canopyRef}
          args={[clump, materials.canopy, data.anchors.length]}
          customDepthMaterial={materials.canopyDepth}
          castShadow
        />
      </group>
      <group ref={insideRef}>
        <mesh geometry={data.innerShell} material={materials.inner} receiveShadow />
        <mesh geometry={data.crownRim} material={materials.inner} />
        <mesh geometry={merged.interior} material={materials.innerRoots} />
        <mesh geometry={merged.floor} material={materials.floor} receiveShadow />
      </group>
      <CrownHalo />
      <CrownLight anchors={data.anchors} />
    </group>
  );
}
