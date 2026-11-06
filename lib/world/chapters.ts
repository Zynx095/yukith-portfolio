/**
 * The journey's timeline, chapters and scroll length. Kept free of three.js so
 * the HTML layer (HUD, index, skip links) can use it without the 3D bundle.
 *
 * Two clocks:
 *   scroll — 0..1 through the whole journey (the page's scroll range);
 *   story  — 0..1 through the original valley-to-crown story. Everything
 *            that follows the story (time of day, the tree's interior, the
 *            archive and rings) reads this clock.
 *
 * Regions are inserted into the story at a story time: while the visitor is
 * in a region the story clock holds still and the region's own clock runs
 * (0..1). Regions marked `cut` are entered and left through a short fade.
 */

/** Length of the valley-to-crown story, in viewport heights. */
export const STORY_VH = 30;

export type RegionId = "district" | "arena" | "library";

export interface RegionSlot {
  id: RegionId;
  /** Story time at which the region is inserted. */
  at: number;
  /** Scroll length of the region, in viewport heights. */
  vh: number;
  /** Entered and left through a fade (a different place, not a continuous camera move). */
  cutIn: boolean;
  cutOut: boolean;
}

export const REGION_SLOTS: RegionSlot[] = [
  { id: "district", at: 0.27, vh: 6, cutIn: false, cutOut: false },
  { id: "arena", at: 0.27, vh: 5.5, cutIn: true, cutOut: true },
  { id: "library", at: 0.795, vh: 3.5, cutIn: true, cutOut: true },
];

/** Scroll length of the whole journey, in viewport heights. */
export const JOURNEY_VH = STORY_VH + REGION_SLOTS.reduce((a, r) => a + r.vh, 0);

interface Placed extends RegionSlot {
  /** Scroll positions where the region starts and ends (0..1). */
  start: number;
  end: number;
}

export const REGIONS: Placed[] = (() => {
  let extra = 0;
  return REGION_SLOTS.map((r) => {
    const startVh = r.at * STORY_VH + extra;
    extra += r.vh;
    return { ...r, start: startVh / JOURNEY_VH, end: (startVh + r.vh) / JOURNEY_VH };
  });
})();

/** Scroll position of a story time (the start of any region inserted there comes after it). */
export function storyToScroll(story: number) {
  let extra = 0;
  for (const r of REGION_SLOTS) if (r.at < story - 1e-9) extra += r.vh;
  return (story * STORY_VH + extra) / JOURNEY_VH;
}

export interface TimelinePoint {
  story: number;
  region: Placed | null;
  /** 0..1 through the region (0 when not in one). */
  t: number;
}

/** Where a scroll position falls: in the story, or inside a region. */
export function timelineAt(scroll: number, out: TimelinePoint = { story: 0, region: null, t: 0 }): TimelinePoint {
  const vh = Math.min(1, Math.max(0, scroll)) * JOURNEY_VH;
  let extra = 0;
  for (const r of REGIONS) {
    const s = r.start * JOURNEY_VH;
    const e = r.end * JOURNEY_VH;
    if (vh < s) break;
    if (vh < e) {
      out.story = r.at;
      out.region = r;
      out.t = (vh - s) / (e - s);
      return out;
    }
    extra += r.vh;
  }
  out.story = Math.min(1, (vh - extra) / STORY_VH);
  out.region = null;
  out.t = 0;
  return out;
}

/** Fade to dark around region cuts: 0 (clear) … 1 (fully dark), from the smoothed scroll position. */
export function cutFade(scroll: number) {
  const w = 0.45 / JOURNEY_VH; // half-width of a fade, in scroll units
  let a = 0;
  for (const r of REGIONS) {
    if (r.cutIn) a = Math.max(a, 1 - Math.min(1, Math.abs(scroll - r.start) / w));
    if (r.cutOut) a = Math.max(a, 1 - Math.min(1, Math.abs(scroll - r.end) / w));
  }
  return a * a * (3 - 2 * a);
}

export interface Chapter {
  id: string;
  /** Scroll position where the chapter begins (0..1). */
  start: number;
  title: string;
  /** One line shown in the index. */
  blurb: string;
}

const story = (id: string, s: number, title: string, blurb: string): Chapter => ({ id, start: storyToScroll(s), title, blurb });
const region = (id: RegionId, title: string, blurb: string): Chapter => ({ id, start: REGIONS.find((r) => r.id === id)!.start, title, blurb });

export const CHAPTERS: Chapter[] = [
  story("arrival", 0, "Arrival", "The valley, and the World Tree on the horizon"),
  story("home", 0.07, "Home", "Where it started — family, Bella, and small memories"),
  story("path", 0.17, "The path", "Networks, security, applied AI, systems — carved into four waystones"),
  region("district", "The hackathon district", "Every hackathon, competition and event, as an exhibition"),
  region("arena", "The arena", "Valorant, CS:GO and Mobile Legends — and an aim trainer"),
  story("reveal", 0.29, "The World Tree", "Everything I build connects here"),
  story("roots", 0.38, "The roots", "Roots that carry the signal into the tree"),
  story("archive", 0.46, "The archive", "Nine projects, one hall"),
  region("library", "The library", "Manhwa, manga, anime and stories, high in the tree"),
  story("rings", 0.805, "The rings", "2024 – 2026: three years, three stages"),
  story("crown", 0.92, "The crown", "Get in touch"),
];

/** Chapter index for a scroll position. */
export const chapterAt = (scroll: number) => {
  let i = 0;
  for (let k = 0; k < CHAPTERS.length; k++) if (scroll >= CHAPTERS[k].start - 1e-6) i = k;
  return i;
};
