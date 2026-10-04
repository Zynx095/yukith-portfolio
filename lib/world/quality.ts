import type { QualityTier } from "./store";

/**
 * Rendering quality tiers. The initial tier comes from a quick device probe;
 * at runtime the PerformanceMonitor lowers DPR first and then the tier if the
 * frame rate stays low.
 */

export interface QualitySettings {
  /** Upper bound for the device pixel ratio. */
  maxDpr: number;
  /** Directional shadow map size; 0 disables shadows. */
  shadowMapSize: number;
  /** Bloom / tone-mapping / vignette composer. */
  postprocessing: boolean;
  /** MSAA samples for the composer's render target. */
  msaa: number;
  /** Fraction of foliage clumps / grass rendered. */
  foliage: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: { maxDpr: 2, shadowMapSize: 2048, postprocessing: true, msaa: 4, foliage: 1 },
  medium: { maxDpr: 1.5, shadowMapSize: 1024, postprocessing: true, msaa: 2, foliage: 0.75 },
  low: { maxDpr: 1, shadowMapSize: 0, postprocessing: false, msaa: 0, foliage: 0.5 },
};

export const TIER_ORDER: QualityTier[] = ["low", "medium", "high"];

/** Best-effort device classification. Runs once on the client. */
export function detectInitialTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const small = Math.min(window.screen.width, window.screen.height) < 820;
  if (coarse && small) return "low";

  let renderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return "low";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return "medium";
  }
  if (/swiftshader|llvmpipe|software/i.test(renderer)) return "low";
  if (coarse) return "medium";
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (/intel|uhd|iris|mali|adreno|powervr/i.test(renderer) || memory <= 4 || cores <= 4) return "medium";
  return "high";
}
