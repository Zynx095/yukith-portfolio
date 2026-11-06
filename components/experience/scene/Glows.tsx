"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { shared } from "@/lib/world/materials";
import { useWorld } from "./WorldContext";

export interface GlowPoint {
  position: THREE.Vector3;
  size: number;
  color: THREE.ColorRepresentation;
  /** 0..1: how much the glow brightens at night. */
  night?: number;
  /** Phase offset for a slow pulse (NaN = steady). */
  pulse?: number;
}

/**
 * Soft additive glows drawn as camera-facing quads in one draw call. A custom
 * shader (not SpriteMaterial) so the height fog fades them correctly.
 */
export function Glows({ points, intensity = 1 }: { points: GlowPoint[]; intensity?: number }) {
  const { glow } = useWorld();
  const geometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const center = new Float32Array(points.length * 4);
    const color = new Float32Array(points.length * 4);
    const c = new THREE.Color();
    points.forEach((p, i) => {
      center.set([p.position.x, p.position.y, p.position.z, p.size], i * 4);
      c.set(p.color);
      color.set([c.r, c.g, c.b, p.pulse ?? -1], i * 4);
    });
    g.setAttribute("aCenter", new THREE.InstancedBufferAttribute(center, 4));
    g.setAttribute("aColor", new THREE.InstancedBufferAttribute(color, 4));
    g.setAttribute("aNight", new THREE.InstancedBufferAttribute(new Float32Array(points.map((p) => p.night ?? 0.6)), 1));
    g.instanceCount = points.length;
    return g;
  }, [points]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uMap: { value: null }, uIntensity: { value: intensity } }]),
          uMap: { value: glow },
          uTime: shared.uTime,
          uNight: shared.uNight,
        },
        vertexShader: /* glsl */ `
          #include <common>
          #include <fog_pars_vertex>
          attribute vec4 aCenter;
          attribute vec4 aColor;
          attribute float aNight;
          uniform float uTime, uNight, uIntensity;
          varying vec2 vUv;
          varying vec3 vColor;
          void main() {
            vUv = uv;
            float pulse = aColor.a < 0.0 ? 1.0 : 0.75 + 0.25 * sin(uTime * 1.6 + aColor.a * 6.283);
            vColor = aColor.rgb * pulse * uIntensity * mix(1.0 - aNight * 0.85, 1.0, uNight);
            vec4 mvPosition = modelViewMatrix * vec4(aCenter.xyz, 1.0);
            mvPosition.xy += position.xy * aCenter.w;
            vec3 transformed = aCenter.xyz;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }
        `,
        fragmentShader: /* glsl */ `
          #include <common>
          #include <fog_pars_fragment>
          uniform sampler2D uMap;
          varying vec2 vUv;
          varying vec3 vColor;
          void main() {
            float a = texture2D(uMap, vUv).a;
            vec3 glow = vColor * a;
            gl_FragColor = vec4(glow, 1.0);
            #include <fog_fragment>
            #ifdef USE_FOG
              gl_FragColor.rgb = glow * (1.0 - fogFactor);
            #endif
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [glow, intensity]
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}
