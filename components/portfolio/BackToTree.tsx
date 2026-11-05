"use client";

import { getLenis } from "@/components/providers/smooth-scroll";
import { useUi } from "@/lib/world/store";

/** Return to the start of the World Tree journey (or the top of the page without WebGL). */
export function BackToTree() {
  const noWebgl = useUi((s) => s.noWebgl);
  return (
    <button
      type="button"
      onClick={() => {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 2.4 });
        else window.scrollTo({ top: 0 });
      }}
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-line px-4 text-paper hover:border-signal hover:text-signal"
    >
      {noWebgl ? "Back to top" : "Back to the World Tree"}
    </button>
  );
}
