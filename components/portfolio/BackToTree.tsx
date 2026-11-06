"use client";

import { getLenis } from "@/components/providers/smooth-scroll";
import { useView } from "@/lib/view";

/** Return to the start of the World Tree journey (or the top of the Classic page). */
export function BackToTree() {
  const view = useView();
  return (
    <button
      type="button"
      data-js-only
      onClick={() => {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: view === "classic" ? 1.2 : 2.4 });
        else window.scrollTo({ top: 0 });
      }}
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-line px-4 text-paper hover:border-signal hover:text-signal"
    >
      {view === "classic" ? "Back to top" : "Back to the World Tree"}
    </button>
  );
}
