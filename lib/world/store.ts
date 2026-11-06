import { useSyncExternalStore } from "react";
import { discover } from "@/lib/discoveries";

/**
 * Shared state for the experience.
 *
 * `frame` holds values that change every frame (scroll progress, velocity,
 * focus blend, projected label position). It is a plain mutable object read
 * inside `useFrame` and rAF-driven DOM updaters — never React state, so
 * scrolling causes no React re-renders.
 *
 * `ui` holds coarse, discrete state (chapter, focused relic, open record,
 * index, sound …) that components subscribe to through `useUi`.
 */

export type FocusPhase = "moving" | "focusing" | "focused";
export type QualityTier = "high" | "medium" | "low";

export const frame = {
  /** Raw scroll position through the whole journey, 0..1 (lib/world/chapters.ts). */
  scrollTarget: 0,
  /** Smoothed scroll position the camera follows, 0..1. */
  scroll: 0,
  /** Story time of the raw scroll position, 0..1. */
  target: 0,
  /** Story time the world follows, 0..1 (holds still inside a region). */
  progress: 0,
  /** Region the camera is in (null on the main story path) and how far through it, 0..1. */
  region: null as null | "district" | "arena" | "library",
  regionT: 0,
  /** 1 while the camera is in a sealed interior away from the valley (the arena). */
  pocket: 0,
  /** 0..1 fade to dark across a cut into or out of a region. */
  cut: 0,
  /** Look-around offsets from dragging (radians). */
  lookYaw: 0,
  lookPitch: 0,
  /** Smoothed scroll velocity in progress units per second (signed). */
  velocity: 0,
  /** Seconds since the last scroll movement. */
  idle: 10,
  /** Last non-zero scroll direction (-1 back, +1 forward). */
  direction: 1,
  /** 0..1 blend of the camera towards the focused relic's framing. */
  focusWeight: 0,
  /** 0..1 how far inside the World Tree the camera is. */
  interior: 0,
  /** 0..1 daylight → dusk → night, driven by the journey. */
  dusk: 0,
  /** Screen position (CSS px) and projected radius of the relic in focus, for its DOM label. */
  focusX: 0,
  focusY: 0,
  focusR: 0,
  focusVisible: false,
  /** 0..1 how near the camera is to the relic's framing (label prominence). */
  focusNear: 0,
  /** Screen position of Bella (for the "throw a stick" hint). */
  petX: 0,
  petY: 0,
  petVisible: false,
};

export interface UiState {
  /** The 3D world has compiled and drawn its first frame. */
  ready: boolean;
  /** Real asset loading progress, 0..1. */
  loaded: number;
  chapter: number;
  focusId: string | null;
  focusPhase: FocusPhase;
  hoverId: string | null;
  /** Project record open in the panel. */
  openId: string | null;
  indexOpen: boolean;
  /** The aim-trainer mini-game is open (the world pauses). */
  gameOpen: boolean;
  /** World is (at least partly) visible — false once the portfolio covers it. */
  inWorld: boolean;
  quality: QualityTier;
  sound: boolean;
  /** Region the camera is in (null on the story path). */
  region: null | "district" | "arena" | "library";
}

type Listener = () => void;

const initial: UiState = {
  ready: false,
  loaded: 0,
  chapter: 0,
  focusId: null,
  focusPhase: "moving",
  hoverId: null,
  openId: null,
  indexOpen: false,
  gameOpen: false,
  inWorld: true,
  quality: "high",
  sound: false,
  region: null,
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

/** Default values of the per-frame state (a fresh journey). */
const FRAME_DEFAULTS = { ...frame };

/**
 * Return the world's shared state to a fresh journey. Called when the
 * Immersive presentation mounts and unmounts, so switching modes never leaves
 * stale progress, focus or readiness behind.
 */
export function resetWorldState(overrides: Partial<UiState> = {}) {
  Object.assign(frame, FRAME_DEFAULTS);
  ui.set({ ready: false, loaded: 0, chapter: 0, focusId: null, focusPhase: "moving", hoverId: null, inWorld: true, sound: false, region: null, ...overrides });
}

export const openGame = () => ui.set({ gameOpen: true, indexOpen: false, openId: null });
/** Open anything's record (project, event, achievement, memory …); "aim" opens the aim trainer. */
export const openRecord = (id: string) => {
  if (id === "aim") return openGame();
  ui.set({ openId: id, indexOpen: false });
  discover(id);
};
export const closeRecord = () => ui.set({ openId: null });
export const openIndex = () => ui.set({ indexOpen: true });
export const closeGame = () => ui.set({ gameOpen: false });
export const closeIndex = () => ui.set({ indexOpen: false });
