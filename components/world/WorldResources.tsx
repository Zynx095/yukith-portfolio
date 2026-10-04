"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getWorldTextures, type WorldTextures } from "@/lib/world/textures";
import { createSkyMaterial } from "@/lib/world/atmosphere";

/**
 * GPU resources shared across the world: baked textures and the two
 * image-based-lighting environments (open sky, and the warm hollow of the
 * World Tree). Created once per renderer and disposed with the canvas.
 */

export interface WorldResourcesValue {
  textures: WorldTextures;
  skyEnv: THREE.Texture;
  interiorEnv: THREE.Texture;
}

const Ctx = createContext<WorldResourcesValue | null>(null);

export function useWorldResources() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorldResources must be used inside <WorldResources>");
  return v;
}

function buildSkyEnvironment(gl: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const material = createSkyMaterial();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), material);
  scene.add(dome);
  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0.02, 0.1, 200);
  pmrem.dispose();
  dome.geometry.dispose();
  material.dispose();
  return target;
}

/** A warm, dim cavity: dark wood all round, a bright opening overhead, ember glow low down. */
function buildInteriorEnvironment(gl: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 wood = vec3(0.095, 0.054, 0.028);
        vec3 col = wood * (0.6 + 0.4 * smoothstep(-1.0, 1.0, d.y));
        // Daylight falling through the open crown far above.
        col += vec3(1.0, 0.86, 0.62) * smoothstep(0.86, 0.99, d.y) * 1.8;
        // Warm bounce from sunlit inner walls.
        col += vec3(0.42, 0.24, 0.1) * pow(max(d.y, 0.0), 2.0) * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), material);
  scene.add(dome);
  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0.04, 0.1, 200);
  pmrem.dispose();
  dome.geometry.dispose();
  material.dispose();
  return target;
}

export function WorldResources({ children }: { children: ReactNode }) {
  const gl = useThree((s) => s.gl);
  const value = useMemo(() => {
    const textures = getWorldTextures(gl);
    const sky = buildSkyEnvironment(gl);
    const interior = buildInteriorEnvironment(gl);
    return { textures, skyEnv: sky.texture, interiorEnv: interior.texture, targets: [sky, interior] };
  }, [gl]);

  useEffect(
    () => () => {
      value.textures.dispose();
      value.targets.forEach((t) => t.dispose());
    },
    [value]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
