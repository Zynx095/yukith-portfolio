"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BEATS } from "@/lib/world/journey";
import { frame } from "@/lib/world/store";

/**
 * Film-style narration: one thought at a time in the lower third. Reads the
 * journey progress on animation frames and re-renders only when the beat
 * changes.
 */
export function CinematicNarration() {
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    let raf = 0;
    let current = -2;
    const tick = () => {
      const p = frame.progress;
      const i = BEATS.findIndex((b) => p >= b.start && p < b.end);
      if (i !== current) {
        current = i;
        setIndex(i);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const beat = index >= 0 ? BEATS[index] : null;
  const title = index === 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-20" aria-live="polite">
      <AnimatePresence mode="wait">
        {beat && (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={
              title
                ? "absolute inset-x-0 top-[38%] flex flex-col items-center px-6 text-center"
                : "absolute bottom-[12vh] left-[6vw] max-w-[min(42rem,86vw)] md:left-[7vw]"
            }
          >
            <p className="narration-shadow font-mono text-[10px] uppercase tracking-[0.45em] text-[#e7c26b] md:text-[11px]">{beat.kicker}</p>
            <p
              className={
                title
                  ? "narration-shadow mt-4 font-serif text-5xl font-light tracking-[0.02em] text-[#f7f2e9] md:text-7xl"
                  : "narration-shadow mt-3 font-serif text-[1.65rem] font-light leading-snug text-[#f7f2e9] md:text-[2.35rem]"
              }
            >
              {beat.line}
            </p>
            {beat.sub && <p className="narration-shadow mt-4 font-sans text-sm tracking-[0.18em] text-[#f7f2e9]/75 md:text-base">{beat.sub}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
