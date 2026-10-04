import { useSyncExternalStore } from "react";
import type { ArtifactId } from "./archive";

/**
 * Journey state.
 *
 * `frame` holds values that change every frame (scroll progress, velocity,
 * focus blend). It is a plain mutable object read inside `useFrame` and DOM
 * updaters — never React state, so scrolling causes no React re-renders.
 *
 * `ui` holds coarse, discrete state (current chapter, focused artifact, open
 * panel …) that React components subscribe to through `useUi`.
 */

export type FocusPhase = "moving" | "focusing" | "focused";
export type QualityTier = "high" | "medium" | "low";

export const frame = {
  /** Raw scroll progress through the journey, 0..1. */
  target: 0,
  /** Smoothed progress the camera follows, 0..1. */
  progress: 0,
  /** Smoothed scroll velocity in progress units per second (signed). */
  velocity: 0,
  /** Seconds since the last scroll movement. */
  idle: 10,
  /** Last non-zero scroll direction (-1 back, +1 forward). */
  direction: 1,
  /** 0..1 blend of the camera towards the focused artifact's framing. */
  focusWeight: 0,
  /** 0..1 how far the camera is inside the World Tree (drives lighting/exposure). */
  interior: 0,
  /** 0..1 transition into the portfolio at the end of the journey. */
  outro: 0,
  /** Screen position (CSS px) of the relic nearest the camera's focus, for its DOM label. */
  focusX: 0,
  focusY: 0,
  /** Projected radius (CSS px) of that relic, so its label sits beside it. */
  focusR: 0,
  focusVisible: false,
  /** 0..1 how near the camera is to the current relic's framing (label prominence). */
  focusNear: 0,
};

export interface UiState {
  ready: boolean;
  chapter: number;
  focusId: ArtifactId | null;
  focusPhase: FocusPhase;
  hoverId: ArtifactId | null;
  openId: ArtifactId | null;
  /** World is (at least partly) visible — false once the portfolio covers it. */
  inWorld: boolean;
  quality: QualityTier;
}

type Listener = () => void;

const initial: UiState = {
  ready: false,
  chapter: 0,
  focusId: null,
  focusPhase: "moving",
  hoverId: null,
  openId: null,
  inWorld: true,
  quality: "high",
};

let state: UiState = initial;
const listeners = new Set<Listener>();

export const ui = {
  get: () => state,
  set(partial: Partial<UiState>) {
    let changed = false;
    for (const key in partial) {
      const k = key as keyof UiState;
      if (state[k] !== partial[k]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...partial };
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Subscribe a component to a slice of UI state. Selectors should return primitives. */
export function useUi<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(
    ui.subscribe,
    () => selector(state),
    () => selector(initial)
  );
}

export const openArtifact = (id: ArtifactId) => ui.set({ openId: id });
export const closeArtifact = () => ui.set({ openId: null });
