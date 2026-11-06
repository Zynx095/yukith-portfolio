import * as THREE from "three";

/**
 * Small, quiet name tags for interactive things near the camera (family
 * figures, memories, exhibits that are not the one in focus). Scene components
 * register anchors; a projector inside the canvas writes their screen
 * positions every frame; the DOM overlay (components/experience/ui/WorldTags)
 * draws at most a handful, nearest first. Clicking a tag opens its record.
 */

export interface TagAnchor {
  id: string;
  title: string;
  position: THREE.Vector3;
  /** Shown only within this distance of the camera (metres). */
  near: number;
  /** Where in the journey the anchor is live. */
  region: "district" | "arena" | "library" | null;
  /** Story window [start, end] when `region` is null. */
  story?: [number, number];
}

export interface ScreenTag {
  id: string;
  title: string;
  x: number;
  y: number;
  /** 0..1 how near (for opacity). */
  near: number;
}

const anchors = new Map<string, TagAnchor>();
export const screenTags: ScreenTag[] = [];
export const MAX_TAGS = 5;

export function registerTags(list: TagAnchor[]) {
  for (const a of list) anchors.set(a.id, a);
  return () => {
    for (const a of list) anchors.delete(a.id);
  };
}

const v = new THREE.Vector3();
const candidates: { a: TagAnchor; d: number; x: number; y: number }[] = [];

/** Project the live anchors (called once per frame from inside the canvas). */
export function projectTags(camera: THREE.Camera, width: number, height: number, region: string | null, story: number, focusId: string | null, cut: number) {
  candidates.length = 0;
  if (cut < 0.2) {
    for (const a of anchors.values()) {
      if (a.id === focusId) continue;
      if (a.region !== region) continue;
      if (!a.region && a.story && (story < a.story[0] || story > a.story[1])) continue;
      const d = camera.position.distanceTo(a.position);
      if (d > a.near) continue;
      v.copy(a.position).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 0.95 || Math.abs(v.y) > 0.9) continue;
      candidates.push({ a, d, x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height });
    }
  }
  candidates.sort((p, q) => p.d - q.d);
  screenTags.length = 0;
  for (let i = 0; i < Math.min(MAX_TAGS, candidates.length); i++) {
    const c = candidates[i];
    screenTags.push({ id: c.a.id, title: c.a.title, x: c.x, y: c.y, near: 1 - c.d / c.a.near });
  }
}
