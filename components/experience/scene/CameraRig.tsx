"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ARCHIVE_STEP, FOCUS_STOPS, interiorAmount, poseAt, type FocusStop } from "@/lib/world/journey";
import { chapterAt } from "@/lib/world/chapters";
import { RELIC_RADIUS } from "@/lib/world/archive";
import { frame, ui, type FocusPhase } from "@/lib/world/store";
import { readScroll } from "@/lib/world/scroll";
import { cavityAt } from "@/lib/world/tree";
import { TREE } from "@/lib/world/layout";
import { debugCamera } from "@/lib/world/debug";

/**
 * Scroll-driven camera.
 *
 * Progress follows the scroll position through a critically damped spring and
 * the pose comes from the journey keyframes, so the authored path is followed
 * exactly and the camera never cuts corners through geometry.
 *
 * Focus magnet: when the visitor stops near a relic (low velocity, a short
 * idle time, inside its window — preferring the one ahead) the camera eases to
 * that relic's framing. It never touches the scroll position, and any scroll
 * input releases it within a fraction of a second.
 */

const FOCUS_WINDOW = ARCHIVE_STEP * 0.45;
const IDLE_TO_FOCUS = 0.3; // seconds
const STILL_VELOCITY = 0.003; // progress units per second

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

function nearestStop(p: number, direction: number, window: number): FocusStop | null {
  let best: FocusStop | null = null;
  let bestScore = Infinity;
  for (const s of FOCUS_STOPS) {
    const d = s.progress - p;
    if (Math.abs(d) > window) continue;
    const score = Math.abs(d) - (Math.sign(d) === direction ? 0.002 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      proj: new THREE.Vector3(),
      edge: new THREE.Vector3(),
      springV: 0,
      lastPhase: "moving" as FocusPhase,
      lastFocus: null as string | null,
      lastChapter: -1,
      fov: 50,
    }),
    []
  );

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 20);

    // 1 — scroll input
    const s = readScroll();
    const prevTarget = frame.target;
    frame.target = s.progress;
    const dTarget = frame.target - prevTarget;
    frame.velocity += (dTarget / Math.max(dt, 1e-3) - frame.velocity) * (1 - Math.exp(-12 * dt));
    if (Math.abs(dTarget) > 1e-6) {
      frame.idle = 0;
      frame.direction = Math.sign(dTarget);
    } else frame.idle += dt;

    // 2 — critically damped progress spring (instant with reduced motion)
    if (reduced) frame.progress = frame.target;
    else {
      const omega = 6.5;
      const x0 = frame.progress - frame.target;
      const decay = Math.exp(-omega * dt);
      const temp = (tmp.springV + omega * x0) * dt;
      tmp.springV = (tmp.springV - omega * temp) * decay;
      frame.progress = frame.target + (x0 + temp) * decay;
      if (Math.abs(frame.progress - frame.target) < 1e-6) frame.progress = frame.target;
    }

    // 3 — base pose on the path
    let fov = poseAt(frame.progress, tmp.pos, tmp.look);

    // 4 — focus magnet
    const stop = nearestStop(frame.progress, frame.direction, FOCUS_WINDOW);
    const still = frame.idle > IDLE_TO_FOCUS && Math.abs(frame.velocity) < STILL_VELOCITY;
    const want = stop && still ? 1 : 0;
    const rate = want > frame.focusWeight ? 2.2 : 12;
    frame.focusWeight += (want - frame.focusWeight) * (1 - Math.exp(-rate * dt));
    const proximity = stop ? 1 - THREE.MathUtils.smoothstep(Math.abs(stop.progress - frame.progress), 0.004, FOCUS_WINDOW) : 0;
    const w = frame.focusWeight * proximity;
    if (stop && w > 0.001) {
      tmp.pos.lerp(stop.camera, w);
      tmp.look.lerp(stop.target, w);
      fov = THREE.MathUtils.lerp(fov, 42, w);
    }

    // 5 — composition: in the archive the relic sits off-centre (left on wide
    // screens, high on narrow ones), leaving room for its label.
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

    // 6 — life: slow drift and a hint of pointer parallax (none with reduced motion)
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

    // 7 — never leave the hollow once inside it
    frame.interior = interiorAmount(frame.progress);
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

    // 9 — the relic's screen position, for its DOM label
    if (stop) {
      tmp.proj.copy(stop.target).project(camera);
      frame.focusVisible = tmp.proj.z < 1 && Math.abs(tmp.proj.x) < 1.15 && Math.abs(tmp.proj.y) < 1.15;
      frame.focusX = (tmp.proj.x * 0.5 + 0.5) * state.size.width;
      frame.focusY = (-tmp.proj.y * 0.5 + 0.5) * state.size.height;
      tmp.edge.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(RELIC_RADIUS).add(stop.target).project(camera);
      frame.focusR = Math.abs(tmp.edge.x - tmp.proj.x) * 0.5 * state.size.width;
      frame.focusNear = proximity;
    } else {
      frame.focusVisible = false;
      frame.focusNear = 0;
    }

    // 10 — publish coarse state for the UI (only when it changes)
    const phase: FocusPhase = !stop ? "moving" : w > 0.85 ? "focused" : w > 0.04 ? "focusing" : "moving";
    const focusId = stop && proximity > 0.15 ? stop.id : null;
    const chapter = chapterAt(frame.progress);
    if (phase !== tmp.lastPhase || focusId !== tmp.lastFocus || chapter !== tmp.lastChapter) {
      tmp.lastPhase = phase;
      tmp.lastFocus = focusId;
      tmp.lastChapter = chapter;
      ui.set({ focusPhase: phase, focusId, chapter });
    }
  }, -10);

  return null;
}
