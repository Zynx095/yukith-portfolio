import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Every file the world downloads, loaded once through one LoadingManager so
 * the loading screen can show *real* progress (bytes are not knowable up
 * front for every file, so progress counts finished files).
 *
 * Sources and licences: docs/ASSETS.md (all CC0, processed by
 * scripts/assets/build-assets.mjs).
 */

export interface SurfaceSet {
  color: THREE.Texture;
  normal: THREE.Texture;
  /** R ambient occlusion · G roughness · B height. */
  data: THREE.Texture;
}

export interface WorldAssets {
  bark: SurfaceSet;
  litter: SurfaceSet;
  grass: SurfaceSet;
  trail: SurfaceSet;
  rock: SurfaceSet;
  models: Record<ModelName, GLTF>;
}

export type ModelName = "rocks-tall" | "rocks-round" | "fern" | "moss" | "stump" | "celandine";
const MODELS: ModelName[] = ["rocks-tall", "rocks-round", "fern", "moss", "stump", "celandine"];
const SURFACES = ["bark", "litter", "grass", "trail", "rock"] as const;

let promise: Promise<WorldAssets> | null = null;

export function loadWorldAssets(gl: THREE.WebGLRenderer, onProgress: (loaded: number, total: number) => void): Promise<WorldAssets> {
  if (promise) return promise;
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => onProgress(loaded, total);
  const texLoader = new THREE.TextureLoader(manager);
  const gltfLoader = new GLTFLoader(manager);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());

  const tex = (file: string, srgb: boolean) =>
    new Promise<THREE.Texture>((resolve, reject) =>
      texLoader.load(
        `/assets/textures/${file}`,
        (t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
          t.anisotropy = aniso;
          t.generateMipmaps = true;
          t.minFilter = THREE.LinearMipmapLinearFilter;
          t.magFilter = THREE.LinearFilter;
          resolve(t);
        },
        undefined,
        reject
      )
    );

  const surface = async (name: string): Promise<SurfaceSet> => {
    const [color, normal, data] = await Promise.all([tex(`${name}_color.webp`, true), tex(`${name}_normal.webp`, false), tex(`${name}_data.webp`, false)]);
    return { color, normal, data };
  };

  promise = (async () => {
    const [surfaces, models] = await Promise.all([
      Promise.all(SURFACES.map(surface)),
      Promise.all(MODELS.map((m) => gltfLoader.loadAsync(`/assets/models/${m}.glb`))),
    ]);
    const out = Object.fromEntries(SURFACES.map((s, i) => [s, surfaces[i]])) as Pick<WorldAssets, (typeof SURFACES)[number]>;
    return { ...out, models: Object.fromEntries(MODELS.map((m, i) => [m, models[i]])) as Record<ModelName, GLTF> };
  })();
  promise.catch(() => {
    promise = null;
  });
  return promise;
}

/** Upload every texture to the GPU now, so nothing stalls the first frames of the journey. */
export function uploadTextures(gl: THREE.WebGLRenderer, a: WorldAssets) {
  for (const s of SURFACES) for (const t of Object.values(a[s])) gl.initTexture(t);
}
