"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * One Lenis instance smooths the whole page — the World Tree journey and the
 * portfolio below it. Native scrolling (keyboard, scrollbar, touch, assistive
 * tech) keeps working; with reduced motion Lenis is not started at all.
 */

let instance: Lenis | null = null;

/** The page's Lenis instance (null before mount or with reduced motion). */
export const getLenis = () => instance;

/** Smoothly scroll to an element id (falls back to native scrolling). */
export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset, duration: 1.6 });
  else el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  // Move keyboard focus with the view so the next Tab continues from there.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.2 });
    instance = lenis;
    return () => {
      lenis.destroy();
      instance = null;
    };
  }, []);

  return <>{children}</>;
}
