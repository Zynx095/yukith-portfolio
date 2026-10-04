/**
 * Opt-in diagnostics, driven by URL parameters (no effect on normal visits):
 *
 *   ?perf                 exposes `window.__world` (renderer, journey controls)
 *                         for the profiling workflow described in README.md
 *   ?off=tree,water,...   disables subsystems to isolate their cost:
 *                         tree, terrain, forest, water, family, artifacts,
 *                         post, shadows, html
 *   ?quality=low|medium|high   forces a quality tier
 *   ?cam=x,y,z,lx,ly,lz   (with ?perf) pins the camera for inspection shots
 */

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

export const PERF_MODE = params.has("perf");

const disabled = new Set((params.get("off") ?? "").split(",").map((s) => s.trim()).filter(Boolean));

export type Subsystem = "tree" | "terrain" | "forest" | "water" | "family" | "artifacts" | "post" | "shadows" | "html";

export const isOff = (system: Subsystem) => disabled.has(system);

/** Pinned inspection camera: position and look-at target, or null. */
export const DEBUG_CAMERA = (() => {
  if (!PERF_MODE) return null;
  const v = (params.get("cam") ?? "").split(",").map(Number);
  return v.length === 6 && v.every(Number.isFinite) ? v : null;
})();

export const FORCED_QUALITY = (() => {
  const q = params.get("quality");
  return q === "low" || q === "medium" || q === "high" ? q : null;
})();
