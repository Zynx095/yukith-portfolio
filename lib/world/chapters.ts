/**
 * The journey's chapters and its scroll length. Kept free of three.js imports
 * so the HTML layer (HUD, index, skip links) can use it without the 3D bundle.
 */

/** Scroll length of the World Tree journey, in viewport heights. */
export const JOURNEY_VH = 30;

export interface Chapter {
  id: string;
  /** Journey progress where the chapter begins (0..1). */
  start: number;
  title: string;
  /** One line shown in the index. */
  blurb: string;
}

export const CHAPTERS: Chapter[] = [
  { id: "arrival", start: 0, title: "Arrival", blurb: "The valley, and the World Tree on the horizon" },
  { id: "home", start: 0.07, title: "Home", blurb: "Where it started — home, family and Bella" },
  { id: "path", start: 0.17, title: "The path", blurb: "Networks, security, applied AI, systems — carved into four waystones" },
  { id: "reveal", start: 0.29, title: "The World Tree", blurb: "Everything I build connects here" },
  { id: "roots", start: 0.38, title: "The roots", blurb: "Roots that carry the signal into the tree" },
  { id: "archive", start: 0.46, title: "The archive", blurb: "Nine projects, one hall" },
  { id: "rings", start: 0.805, title: "The rings", blurb: "2024 – 2026: three years, three stages" },
  { id: "crown", start: 0.92, title: "The crown", blurb: "Get in touch" },
];

export const chapterAt = (p: number) => {
  let i = 0;
  for (let k = 0; k < CHAPTERS.length; k++) if (p >= CHAPTERS[k].start - 1e-6) i = k;
  return i;
};
