"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_DIRECTION } from "@/lib/world/atmosphere";
import { TREE, TREE_GROUND } from "@/lib/world/layout";
import { cavityAt, spine, wallPoint } from "@/lib/world/tree";
import { sharedUniforms } from "@/lib/world/materials";
import { createRng } from "@/lib/world/noise";
import { frame } from "@/lib/world/store";

/**
 * Light inside the hollow: low sunbeams slant through cracks on the sun side
 * of the trunk, a soft column falls from the open crown, and golden dust
 * drifts through the hall — brightest where it crosses a beam.
 */

const SUN_AZIMUTH = Math.atan2(SUN_DIRECTION.z, SUN_DIRECTION.x);
const BEAM_HEIGHTS = [38, 92, 148, 205];

function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: sharedUniforms.uTime, uStrength: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vNormalV = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uStrength;
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vView;
      void main() {
        // Soft edges: the beam is brightest seen through its core.
        float core = pow(abs(dot(vNormalV, vView)), 1.6);
        float t = 1.0 - vUv.y; // 0 at the source, 1 at the far end
        float along = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.35, 1.0, t));
        float shimmer = 0.85 + 0.15 * sin(vUv.y * 40.0 - uTime * 0.8 + vUv.x * 12.0);
        float a = core * along * shimmer * 0.16 * uStrength;
        gl_FragColor = vec4(vec3(1.0, 0.78, 0.45) * a, 1.0);
      }
    `,
  });
}

export function TreeInterior() {
  const beams = useMemo(() => {
    return BEAM_HEIGHTS.map((y, i) => {
      // Entry crack on the sun-facing wall; the beam travels away from the sun, downward.
      const theta = SUN_AZIMUTH + (i % 2 === 0 ? 0.25 : -0.3);
      const entry = wallPoint(theta, y, -0.5);
      const dir = SUN_DIRECTION.clone().negate();
      const c = cavityAt(y - 20);
      const length = c.radius * 2.6;
      const radius = 1.4 + (i % 3) * 0.5;
      // Narrow at the crack (y = 0, uv.y = 1), widening as it falls along -Y → dir.
      const geo = new THREE.CylinderGeometry(radius, radius * 1.35, length, 24, 1, true);
      geo.translate(0, -length / 2, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      return { geo, entry, q, length };
    });
  }, []);
  const beamMat = useMemo(() => beamMaterial(), []);

  // A broad, faint column from the open crown.
  const crown = useMemo(() => {
    const top = 330;
    const bottom = 110;
    const c = cavityAt(top);
    const geo = new THREE.CylinderGeometry(c.radius * 0.8, c.radius * 1.6, top - bottom, 32, 1, true);
    geo.translate(0, (top + bottom) / 2, 0);
    geo.rotateX(0);
    const sp = spine(top);
    return { geo, x: sp.x, z: sp.y };
  }, []);
  const crownMat = useMemo(() => {
    const m = beamMaterial();
    m.uniforms.uStrength.value = 0.55;
    return m;
  }, []);

  // The open crown far above: a disc of golden daylight the ascent rises into.
  const opening = useMemo(() => {
    const c = cavityAt(330);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: { uStrength: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uStrength; varying vec2 vUv;
        void main(){ float d = length(vUv * 2.0 - 1.0); float g = pow(max(0.0, 1.0 - d), 1.6);
          gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * g * uStrength, 1.0); }`,
    });
    const geo = new THREE.PlaneGeometry(c.radius * 5, c.radius * 5);
    return { mat, geo, x: c.x, z: c.z };
  }, []);

  // Golden dust filling the hall.
  const dust = useMemo(() => {
    const rng = createRng(1212);
    const count = 2200;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const y = rng() * 230;
      const c = cavityAt(y);
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (c.radius - 1.5);
      pos[i * 3] = c.x + Math.cos(a) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = c.z + Math.sin(a) * r;
      seed[i] = rng();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const lines = beams.map((b) => {
      const dir = new THREE.Vector3(0, -1, 0).applyQuaternion(b.q);
      return { o: b.entry, d: dir };
    });
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: sharedUniforms.uTime,
        uScale: { value: 1000 },
        uOrigins: { value: lines.map((l) => l.o) },
        uDirs: { value: lines.map((l) => l.d) },
        uFade: { value: 0 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime, uScale;
        uniform vec3 uOrigins[4];
        uniform vec3 uDirs[4];
        attribute float aSeed;
        varying float vGlow;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.21 + aSeed * 40.0) * 0.8;
          p.y += mod(uTime * (0.25 + aSeed * 0.35) + aSeed * 30.0, 6.0) - 3.0;
          p.z += cos(uTime * 0.17 + aSeed * 31.0) * 0.8;
          float lit = 0.0;
          for (int i = 0; i < 4; i++) {
            vec3 v = p - uOrigins[i];
            float t = max(dot(v, uDirs[i]), 0.0);
            float d = length(v - uDirs[i] * t);
            lit = max(lit, smoothstep(3.2, 0.6, d));
          }
          vGlow = 0.18 + lit * 1.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp((0.05 + aSeed * 0.06) * uScale / -mv.z, 1.0, 9.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uFade;
        varying float vGlow;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * vGlow * a * uFade, 1.0);
        }
      `,
    });
    return { geo, mat };
  }, [beams]);

  useEffect(
    () => () => {
      beams.forEach((b) => b.geo.dispose());
      beamMat.dispose();
      crown.geo.dispose();
      crownMat.dispose();
      dust.geo.dispose();
      dust.mat.dispose();
      opening.geo.dispose();
      opening.mat.dispose();
    },
    [beams, beamMat, crown, crownMat, dust, opening]
  );

  const group = useRef<THREE.Group>(null);
  const openingRef = useRef<THREE.Mesh>(null);
  useFrame(({ camera, gl }) => {
    if (openingRef.current) openingRef.current.quaternion.copy(camera.quaternion);
    opening.mat.uniforms.uStrength.value = frame.interior * (0.3 + 2.6 * THREE.MathUtils.smoothstep(frame.progress, 0.9, 1.0));
    const inside = frame.interior;
    if (group.current) group.current.visible = inside > 0.02;
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    dust.mat.uniforms.uScale.value = gl.domElement.height / (2 * Math.tan(fov / 2));
    dust.mat.uniforms.uFade.value = inside;
    beamMat.uniforms.uStrength.value = inside;
    crownMat.uniforms.uStrength.value = 0.55 * inside + frame.outro * 2.5;
  });

  return (
    <group ref={group} position={[TREE.x, TREE_GROUND, TREE.z]}>
      {beams.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={beamMat} position={b.entry} quaternion={b.q} renderOrder={20} frustumCulled={false} />
      ))}
      <mesh geometry={crown.geo} material={crownMat} position={[crown.x, 0, crown.z]} renderOrder={19} frustumCulled={false} />
      <points geometry={dust.geo} material={dust.mat} renderOrder={21} frustumCulled={false} />
      <mesh ref={openingRef} geometry={opening.geo} material={opening.mat} position={[opening.x, 356, opening.z]} renderOrder={22} frustumCulled={false} />
    </group>
  );
}
