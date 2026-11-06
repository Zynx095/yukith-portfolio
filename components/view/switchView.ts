import { flushSync } from "react-dom";
import { chooseView, getView, type View } from "@/lib/view";
import { getLenis } from "@/components/providers/smooth-scroll";
import { ui } from "@/lib/world/store";

/** Both presentations start at the top of the page. */
export function scrollPageToTop() {
  const lenis = getLenis();
  if (lenis) {
    lenis.start();
    lenis.scrollTo(0, { immediate: true, force: true });
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

let announce: ((text: string) => void) | null = null;
/** ViewController registers the polite live region that reports mode changes. */
export const setViewAnnouncer = (fn: ((text: string) => void) | null) => {
  announce = fn;
};

export const VIEW_LABEL: Record<View, string> = { immersive: "Immersive", classic: "Classic" };

/**
 * Switch presentation without reloading: dialogs close, the 3D world mounts
 * or unmounts (WorldCanvas releases its WebGL context on unmount), the page
 * returns to the top, and the change is announced to assistive technology.
 */
export function switchView(view: View) {
  if (getView() === view) {
    // Already showing it: just remember the choice.
    chooseView(view);
    return;
  }
  ui.set({ openId: null, indexOpen: false });
  const run = () => {
    flushSync(() => chooseView(view));
    scrollPageToTop();
    announce?.(view === "classic" ? "Classic portfolio. The 3D world is closed." : "Immersive World Tree. Scroll to travel.");
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!reduced && typeof doc.startViewTransition === "function" && getView() !== view) {
    try {
      doc.startViewTransition(run);
      return;
    } catch {
      /* fall through */
    }
  }
  run();
}

export const toggleView = () => switchView(getView() === "classic" ? "immersive" : "classic");
