"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS } from "@/lib/world/journey";
import { frame, useUi } from "@/lib/world/store";
import { scrollToPortfolio, scrollToProgress } from "@/lib/world/scroll";

/**
 * Minimal journey chrome: a hairline progress rail with the current chapter,
 * a "skip" link (navigation stays scroll-driven, this is only a shortcut),
 * and a scroll cue at the very start.
 */
export function JourneyHUD() {
  const chapter = useUi((s) => s.chapter);
  const fillRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${frame.progress})`;
      if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - frame.progress * 60));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <nav aria-label="Journey" className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-4 md:flex">
        <button
          type="button"
          onClick={() => scrollToProgress(CHAPTERS[chapter].start + 0.0001)}
          className="narration-shadow font-mono text-[10px] uppercase tracking-[0.35em] text-[#f7f2e9]/70 [writing-mode:vertical-rl] rotate-180 transition-colors hover:text-[#e7c26b]"
        >
          {String(chapter + 1).padStart(2, "0")} — {CHAPTERS[chapter].label}
        </button>
        <div className="relative h-48 w-px overflow-hidden bg-white/15">
          <div ref={fillRef} className="absolute inset-0 origin-top bg-[#e7c26b]" style={{ transform: "scaleY(0)" }} />
        </div>
      </nav>

      <button
        type="button"
        onClick={scrollToPortfolio}
        className="fixed right-5 top-5 z-30 rounded-full border border-white/15 bg-black/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#f7f2e9]/80 transition-colors hover:border-[#e7c26b]/60 hover:text-[#e7c26b] md:right-8 md:top-7"
      >
        Skip to portfolio ↓
      </button>

      <div ref={cueRef} className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex flex-col items-center gap-3" aria-hidden="true">
        <span className="narration-shadow font-mono text-[10px] uppercase tracking-[0.5em] text-[#f7f2e9]/80">Scroll</span>
        <span className="block h-10 w-px animate-[cue_2.2s_ease-in-out_infinite] bg-gradient-to-b from-[#e7c26b] to-transparent" />
      </div>
    </>
  );
}
