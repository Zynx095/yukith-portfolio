import { useSyncExternalStore } from "react";
import { FEATURED } from "@/src/data/projects";
import { EVENTS } from "@/src/data/events";
import { RANKS, TOURNAMENTS } from "@/src/data/gaming";
import { FAMILY_MOMENTS, MEMORIES } from "@/src/data/origins";
import { VOLUMES } from "@/src/data/library";

/**
 * Discoveries: a light, local record of what the visitor has opened in the
 * world — relics, exhibits, memories, the aim trainer. It rewards exploring;
 * it never gates information (everything is also in the index and the Classic
 * page). Stored only in this browser.
 */

export type DiscoveryGroup = "Engineering" | "Competitions" | "Gaming" | "Home" | "Library" | "Hidden";

export interface Discoverable {
  id: string;
  title: string;
  group: DiscoveryGroup;
}

const familyOnce = FAMILY_MOMENTS.filter((m, i, all) => all.findIndex((x) => x.title === m.title) === i);

export const DISCOVERABLES: Discoverable[] = [
  ...FEATURED.map((p) => ({ id: p.id, title: p.title, group: "Engineering" as const })),
  ...EVENTS.map((e) => ({ id: e.id, title: e.name, group: "Competitions" as const })),
  ...RANKS.map((r) => ({ id: r.id, title: `${r.game}: ${r.rank}`, group: "Gaming" as const })),
  ...TOURNAMENTS.map((t) => ({ id: t.id, title: t.title, group: "Gaming" as const })),
  { id: "aim-trainer", title: "Finished a run in the aim trainer", group: "Gaming" },
  ...familyOnce.map((m) => ({ id: m.id, title: m.title, group: "Home" as const })),
  ...MEMORIES.map((m) => ({ id: m.id, title: m.title, group: "Home" as const })),
  { id: "bella-fetch", title: "Played fetch with Bella", group: "Hidden" },
  ...VOLUMES.map((v) => ({ id: v.id, title: v.title, group: "Library" as const })),
];

const KNOWN = new Set(DISCOVERABLES.map((d) => d.id));
const KEY = "yk-discoveries";

let found: Set<string> | null = null;
let version = 0;
const listeners = new Set<() => void>();
let toast: ((d: Discoverable) => void) | null = null;

function load() {
  if (found) return found;
  found = new Set();
  try {
    for (const id of JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]) if (KNOWN.has(id)) found.add(id);
  } catch {
    /* storage blocked or corrupt — start empty */
  }
  return found;
}

/** Record a discovery (ids that are not discoverable are ignored). Returns true the first time. */
export function discover(id: string) {
  if (typeof window === "undefined" || !KNOWN.has(id)) return false;
  // Family figures in conversation share one discovery.
  const canonical = id === "family-talk-b" ? "family-talk" : id;
  const set = load();
  if (set.has(canonical)) return false;
  set.add(canonical);
  version++;
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* keep it for this visit */
  }
  listeners.forEach((l) => l());
  const d = DISCOVERABLES.find((x) => x.id === canonical);
  if (d) toast?.(d);
  return true;
}

export const isDiscovered = (id: string) => (typeof window === "undefined" ? false : load().has(id));
export const setDiscoveryToast = (fn: ((d: Discoverable) => void) | null) => {
  toast = fn;
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Number found (re-renders on change). */
export function useDiscoveryCount() {
  return useSyncExternalStore(
    subscribe,
    () => (load(), version, found!.size),
    () => 0
  );
}

/** The set of discovered ids, as a version-stamped snapshot. */
export function useDiscoveries() {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return typeof window === "undefined" ? new Set<string>() : load();
}

export function resetDiscoveries() {
  found = new Set();
  version++;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
