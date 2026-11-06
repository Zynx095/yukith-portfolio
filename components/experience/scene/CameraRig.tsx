"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ARCHIVE_STEP, FOCUS_STOPS, interiorAmount, poseAt } from "@/lib/world/journey";
import { JOURNEY_VH, STORY_VH, chapterAt, cutFade, timelineAt, type TimelinePoint } from "@/lib/world/chapters";
import { RELIC_RADIUS } from "@/lib/world/archive";
import { REGION_FOCUS, exhibitById, regionPose } from "@/lib/world/regions";
import { frame, ui, type FocusPhase } from "@/lib/world/store";
import { readScroll } from "@/lib/world/scroll";
import { cavityAt } from "@/lib/world/tree";
import { TREE } from "@/lib/world/layout";
import { debugCamera } from "@/lib/world/debug";
import { projectTags } from "@/lib/world/tags";

/**
 * Scroll-driven camera.
 *
 * The smoothed scroll position (a critically damped spring) is split by the
 * timeline (lib/world/chapters.ts) into the story clock and, inside a region,
 * the region's own clock. The pose comes from the story keyframes or the
 * region's path, so authored paths are followed exactly.
 *
 * Focus magnet: when the visitor stops near a relic or an exhibit (low
 * velocity, a short idle time, inside its window — preferring the one ahead)
 * the camera eases to that framing. It never touches the scroll position, and
 * any scroll input releases it within a fraction of a second.
 *
 * Look around: dragging on the world turns the view (yaw ±55°, pitch ±25°);
 * it eases back when the visitor scrolls on.
 */

const IDLE_TO_FOCUS = 0.3; // seconds
const STILL_VELOCITY = 0.003; // story units per second

interface Stop {
  id: string;
  /** Distance to the stop in its own clock, and the window it pulls within. */
  d: number;
  window: number;
  camera: THREE.Vector3;
  target: THREE.Vector3;
  radius: number;
}

const CAVITY_TABLE = (() => {
  const step = 2;
  const out: { x: number; z: number; r: number }[] = [];
  for (let y = -10; y <= 400; y += step) {
    const c = cavityAt(y);
    out.push({ x: c.x, z: c.z, r: c.radius });
  }
  return { step, min: -10, max: 400, out };
})();

function cavityLookup(localY: number) {
  const f = (THREE.MathUtils.clamp(localY, CAVITY_TABLE.min, CAVITY_TABLE.max) - CAVITY_TABLE.min) / CAVITY_TABLE.step;
  const i = Math.min(Math.floor(f), CAVITY_TABLE.out.length - 2);
  const t = f - i;
  const a = CAVITY_TABLE.out[i];
  const b = CAVITY_TABLE.out[i + 1];
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, r: a.r + (b.r - a.r) * t };
}

const RELIC_WINDOW = ARCHIVE_STEP * 0.45;
const scratch: Stop = { id: "", d: 0, window: 0, camera: new THREE.Vector3(), target: new THREE.Vector3(), radius: 0 };

/** The relic or exhibit nearest the camera's place on its path, or null. */
function nearestStop(tl: TimelinePoint, direction: number): Stop | null {
  let bestScore = Infinity;
  let found = false;
  if (tl.region) {
    const stops = REGION_FOCUS[tl.region.id];
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      const prev = stops[i - 1]?.t ?? s.t - 0.1;
      const next = stops[i + 1]?.t ?? s.t + 0.1;
      const window = Math.min(s.t - prev, next - s.t) * 0.45;
      const d = s.t - tl.t;
      if (Math.abs(d) > window) continue;
      const score = Math.abs(d) - (Math.sign(d) === direction ? window * 0.05 : 0);
      if (score < bestScore) {
        const ex = exhibitById(s.focus!);
        if (!ex) continue;
        bestScore = score;
        found = true;
        scratch.id = s.focus!;
        scratch.d = d;
        scratch.window = window;
        scratch.camera.copy(s.pos);
        scratch.target.copy(ex.center);
        scratch.radius = ex.radius;
      }
    }
    return found ? scratch : null;
  }
  for (const s of FOCUS_STOPS) {
    const d = s.progress - tl.story;
    if (Math.abs(d) > RELIC_WINDOW) continue;
    const score = Math.abs(d) - (Math.sign(d) === direction ? 0.002 : 0);
    if (score < bestScore) {
      bestScore = score;
      found = true;
      scratch.id = s.id;
      scratch.d = d;
      scratch.window = RELIC_WINDOW;
      scratch.camera.copy(s.camera);
      scratch.target.copy(s.target);
      scratch.radius = RELIC_RADIUS;
    }
  }
  return found ? scratch : null;
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      proj: new THREE.Vector3(),
      edge: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      tl: { story: 0, region: null, t: 0 } as TimelinePoint,
      tlTarget: { story: 0, region: null, t: 0 } as TimelinePoint,
      springV: 0,
      lastPhase: "moving" as FocusPhase,
      lastFocus: null as string | null,
      lastChapter: -1,
      lastRegion: null as string | null,
      fov: 50,
      drag: null as { x: number; y: number; yaw: number; pitch: number } | null,
    }),
    []
  );

  // Look around by dragging (pointer, touch with two fingers is left to the browser).
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      tmp.drag = { x: e.clientX, y: e.clientY, yaw: frame.lookYaw, pitch: frame.lookPitch };
    };
    const move = (e: PointerEvent) => {
      if (!tmp.drag) return;
      frame.lookYaw = THREE.MathUtils.clamp(tmp.drag.yaw - (e.clientX - tmp.drag.x) * 0.004, -0.95, 0.95);
      frame.lookPitch = THREE.MathUtils.clamp(tmp.drag.pitch - (e.clientY - tmp.drag.y) * 0.003, -0.42, 0.42);
      frame.idle = 0;
    };
    const up = () => {
      tmp.drag = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl, tmp]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 20);

    // 1 — scroll input
    const s = readScroll();
    const prevTarget = frame.scrollTarget;
    frame.scrollTarget = s.progress;
    const dTarget = frame.scrollTarget - prevTarget;
    // Velocity in story units per second, so thresholds keep their meaning.
    const storyRate = JOURNEY_VH / STORY_VH;
    frame.velocity += ((dTarget * storyRate) / Math.max(dt, 1e-3) - frame.velocity) * (1 - Math.exp(-12 * dt));
    if (Math.abs(dTarget) > 1e-6) {
      frame.idle = 0;
      frame.direction = Math.sign(dTarget);
    } else if (!tmp.drag) frame.idle += dt;

    // 2 — critically damped spring on the scroll position (instant with reduced motion)
    if (reduced) frame.scroll = frame.scrollTarget;
    else {
      const omega = 6.5;
      const x0 = frame.scroll - frame.scrollTarget;
      const decay = Math.exp(-omega * dt);
      const temp = (tmp.springV + omega * x0) * dt;
      tmp.springV = (tmp.springV - omega * temp) * decay;
      frame.scroll = frame.scrollTarget + (x0 + temp) * decay;
      if (Math.abs(frame.scroll - frame.scrollTarget) < 1e-7) frame.scroll = frame.scrollTarget;
    }

    // 3 — the two clocks, and the base pose
    const tl = timelineAt(frame.scroll, tmp.tl);
    frame.target = timelineAt(frame.scrollTarget, tmp.tlTarget).story;
    frame.progress = tl.story;
    frame.region = tl.region ? tl.region.id : null;
    frame.regionT = tl.t;
    frame.pocket = tl.region?.id === "arena" ? 1 : 0;
    frame.cut = cutFade(frame.scroll);
    let fov = tl.region ? regionPose(tl.region.id, tl.t, tmp.pos, tmp.look) : poseAt(tl.story, tmp.pos, tmp.look);

    // 4 — focus magnet
    const stop = nearestStop(tl, frame.direction);
    const still = frame.idle > IDLE_TO_FOCUS && Math.abs(frame.velocity) < STILL_VELOCITY;
    const want = stop && still ? 1 : 0;
    const rate = want > frame.focusWeight ? 2.2 : 12;
    frame.focusWeight += (want - frame.focusWeight) * (1 - Math.exp(-rate * dt));
    const proximity = stop ? 1 - THREE.MathUtils.smoothstep(Math.abs(stop.d), stop.window * 0.1, stop.window) : 0;
    const w = frame.focusWeight * proximity;
    if (stop && w > 0.001) {
      tmp.pos.lerp(stop.camera, w);
      tmp.look.lerp(stop.target, w);
      fov = THREE.MathUtils.lerp(fov, tl.region ? fov : 42, w);
    }

    // 5 — composition: the subject sits off-centre (left on wide screens, high on narrow ones),
    // leaving room for its label.
    const aspect = state.size.width / Math.max(1, state.size.height);
    if (stop && proximity > 0.01) {
      const fovNow = aspect < 1 ? Math.min(76, fov * (1 + (1 - aspect) * 0.5)) : fov;
      const half = Math.tan(THREE.MathUtils.degToRad(fovNow) / 2);
      const dist = tmp.look.distanceTo(tmp.pos);
      tmp.right.subVectors(tmp.look, tmp.pos).normalize();
      tmp.up.copy(camera.up);
      tmp.right.cross(tmp.up).normalize();
      if (aspect >= 1) tmp.look.addScaledVector(tmp.right, 0.24 * dist * half * aspect * proximity);
      else tmp.look.y -= 0.22 * dist * half * proximity;
    }

    // 6 — life: slow drift, a hint of pointer parallax, and the visitor's own look-around
    if (!tmp.drag && frame.idle < 0.05) {
      // Scrolling on: the view comes back to the path.
      frame.lookYaw *= Math.exp(-4 * dt);
      frame.lookPitch *= Math.exp(-4 * dt);
    }
    if (!reduced) {
      const t = state.clock.elapsedTime;
      const calm = 1 - 0.75 * w;
      tmp.pos.x += Math.sin(t * 0.21) * 0.06 * calm;
      tmp.pos.y += Math.sin(t * 0.29 + 1.3) * 0.04 * calm;
      tmp.right.subVectors(tmp.look, tmp.pos).normalize().cross(camera.up).normalize();
      const reach = tmp.look.distanceTo(tmp.pos);
      tmp.look.addScaledVector(tmp.right, state.pointer.x * reach * 0.012 * calm);
      tmp.look.y += state.pointer.y * reach * 0.008 * calm;
    }
    if (Math.abs(frame.lookYaw) > 1e-4 || Math.abs(frame.lookPitch) > 1e-4) {
      tmp.dir.subVectors(tmp.look, tmp.pos);
      const len = tmp.dir.length();
      tmp.dir.applyAxisAngle(camera.up, frame.lookYaw);
      tmp.right.crossVectors(tmp.dir, camera.up).normalize();
      tmp.dir.applyAxisAngle(tmp.right, frame.lookPitch);
      tmp.look.copy(tmp.pos).addScaledVector(tmp.dir.normalize(), len);
    }

    // 7 — never leave the hollow once inside it (story path only)
    frame.interior = tl.region ? 0 : interiorAmount(frame.progress);
    if (frame.interior > 0.5) {
      const c = cavityLookup(tmp.pos.y - TREE.y);
      const cx = TREE.x + c.x;
      const cz = TREE.z + c.z;
      const dx = tmp.pos.x - cx;
      const dz = tmp.pos.z - cz;
      const d = Math.hypot(dx, dz);
      const limit = c.r - 2.5;
      if (d > limit) {
        tmp.pos.x = cx + (dx / d) * limit;
        tmp.pos.z = cz + (dz / d) * limit;
      }
    }

    // 8 — apply
    if (aspect < 1) fov = Math.min(76, fov * (1 + (1 - aspect) * 0.5));
    if (debugCamera.value) {
      tmp.pos.fromArray(debugCamera.value, 0);
      tmp.look.fromArray(debugCamera.value, 3);
    }
    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.look);
    if (Math.abs(fov - tmp.fov) > 0.01) {
      tmp.fov = fov;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // 9 — the subject's screen position, for its DOM label
    if (stop) {
      tmp.proj.copy(stop.target).project(camera);
      frame.focusVisible = tmp.proj.z < 1 && Math.abs(tmp.proj.x) < 1.15 && Math.abs(tmp.proj.y) < 1.15;
      frame.focusX = (tmp.proj.x * 0.5 + 0.5) * state.size.width;
      frame.focusY = (-tmp.proj.y * 0.5 + 0.5) * state.size.height;
      tmp.edge.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(stop.radius).add(stop.target).project(camera);
      frame.focusR = Math.abs(tmp.edge.x - tmp.proj.x) * 0.5 * state.size.width;
      frame.focusNear = proximity;
    } else {
      frame.focusVisible = false;
      frame.focusNear = 0;
    }

    // 10 — name tags for interactive things nearby
    projectTags(camera, state.size.width, state.size.height, frame.region, frame.progress, stop && proximity > 0.15 ? stop.id : null, frame.cut);

    // 11 — publish coarse state for the UI (only when it changes)
    const phase: FocusPhase = !stop ? "moving" : w > 0.85 ? "focused" : w > 0.04 ? "focusing" : "moving";
    const focusId = stop && proximity > 0.15 ? stop.id : null;
    const chapter = chapterAt(frame.scroll);
    if (phase !== tmp.lastPhase || focusId !== tmp.lastFocus || chapter !== tmp.lastChapter || frame.region !== tmp.lastRegion) {
      tmp.lastPhase = phase;
      tmp.lastFocus = focusId;
      tmp.lastChapter = chapter;
      tmp.lastRegion = frame.region;
      ui.set({ focusPhase: phase, focusId, chapter, region: frame.region });
    }
  }, -10);

  return null;
}
