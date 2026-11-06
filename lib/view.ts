import { useSyncExternalStore } from "react";

/**
 * Presentation mode: the immersive World Tree or the Classic portfolio.
 *
 * Resolution order for a visit (see VIEW_BOOT_SCRIPT, which runs in <head>
 * before the first paint so neither mode flashes the other):
 *
 *   1. `?view=classic` / `?view=immersive` in the URL — for this visit only,
 *      never written to storage;
 *   2. the visitor's last choice from the switcher (localStorage);
 *   3. Immersive.
 *
 * If WebGL is missing, fails to start or the 3D world hits a fatal error, the
 * page falls back to Classic for the rest of the visit (also not stored), and
 * a notice says why.
 *
 * The server always renders `data-view="classic"` on <html>: without
 * JavaScript the boot script never runs and the page is the Classic portfolio.
 */

import { THEME_COLOR, VIEW_PARAM, VIEW_STORAGE_KEY, type View, type ViewReason } from "./view-boot";

export type { View, ViewReason };

interface ViewState {
  view: View;
  reason: ViewReason;
  /** Set when the page fell back to Classic on its own. */
  fallback: { reason: "no-webgl" | "error"; detail?: string } | null;
}

/** What the server renders and hydration starts from. */
const SERVER_STATE: ViewState = { view: "immersive", reason: "default", fallback: null };

let state: ViewState | null = null;
const listeners = new Set<() => void>();

function readDocument(): ViewState {
  const d = document.documentElement;
  const view: View = d.getAttribute("data-view") === "classic" ? "classic" : "immersive";
  const reason = (d.getAttribute("data-view-reason") as ViewReason | null) ?? "default";
  return { view, reason, fallback: reason === "no-webgl" ? { reason: "no-webgl" } : null };
}

function current(): ViewState {
  if (typeof document === "undefined") return SERVER_STATE;
  if (!state) state = readDocument();
  return state;
}

function commit(next: ViewState) {
  state = next;
  const d = document.documentElement;
  d.setAttribute("data-view", next.view);
  d.setAttribute("data-view-reason", next.reason);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next.view]);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const getView = () => current().view;

/** Subscribe to the presentation mode. Hydrates as "immersive" (the server render), then settles. */
export function useView(): View {
  return useSyncExternalStore(subscribe, () => current().view, () => SERVER_STATE.view);
}

export function useViewFallback() {
  return useSyncExternalStore(subscribe, () => current().fallback, () => null);
}

/** Remove `?view=` from the address bar so a stored choice is not overridden on reload. */
function dropViewParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(VIEW_PARAM)) return;
  url.searchParams.delete(VIEW_PARAM);
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

/**
 * The visitor chose a mode with the switcher or the keyboard shortcut. The
 * choice is remembered, and an explicit `?view=` is dropped so the two never
 * disagree on the next reload.
 */
export function chooseView(view: View) {
  const s = current();
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    /* storage can be blocked; the choice still applies to this visit */
  }
  dropViewParam();
  if (s.view === view && !s.fallback) return;
  commit({ view, reason: "user", fallback: null });
}

/** The 3D world could not run: show Classic for this visit without touching the stored choice. */
export function fallBackToClassic(reason: "no-webgl" | "error", detail?: string) {
  const s = current();
  if (s.view === "classic" && s.fallback) return;
  if (detail) console.warn(`[view] switching to Classic: ${reason} — ${detail}`);
  commit({ view: "classic", reason, fallback: { reason, detail } });
}

export function dismissFallbackNotice() {
  const s = current();
  if (s.fallback) commit({ ...s, fallback: null });
}
