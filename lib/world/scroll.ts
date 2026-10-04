import { getLenis } from "@/components/providers/smooth-scroll";
import { JOURNEY_VH } from "./constants";

/**
 * The journey is driven by the page's own scroll position: a tall spacer
 * (`#journey`) sits above the portfolio, and progress is how far through it
 * the viewport has travelled. Native scrolling, keyboard, touch and the
 * scrollbar all work; nothing is ever locked.
 */

function journeyHeight() {
  const el = typeof document !== "undefined" ? document.getElementById("journey") : null;
  return el ? el.offsetHeight : window.innerHeight * JOURNEY_VH;
}

export function readScroll() {
  const lenis = getLenis();
  const y = lenis ? lenis.scroll : window.scrollY;
  const h = journeyHeight();
  const end = Math.max(1, h - window.innerHeight);
  return {
    y,
    progress: Math.min(1, Math.max(0, y / end)),
    /** The portfolio's hero has not yet fully covered the viewport. */
    inWorld: y < h - 2,
  };
}

/** Scroll the page to a journey progress (used by "skip" links and the perf harness). */
export function scrollToProgress(p: number, immediate = false) {
  const end = Math.max(1, journeyHeight() - window.innerHeight);
  const top = p * end;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(top, { immediate, duration: immediate ? 0 : 2.2 });
  else window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
}

/** Scroll to the portfolio section that follows the journey. */
export function scrollToPortfolio() {
  const top = journeyHeight();
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(top, { duration: 2.4 });
  else window.scrollTo({ top, behavior: "smooth" });
}
