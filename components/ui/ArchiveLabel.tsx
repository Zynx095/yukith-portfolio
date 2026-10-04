"use client";

import { useEffect, useRef } from "react";
import { ARTIFACTS } from "@/lib/world/archive";
import { frame, openArtifact, useUi } from "@/lib/world/store";
import { SigilMark } from "./SigilMark";

/**
 * The label beside the relic the camera is passing. It follows the relic's
 * projected position every frame (DOM transform only — no re-render), grows
 * more prominent as the camera settles, and offers an optional "open" action.
 * Scrolling simply carries on; nothing waits for a click.
 */
export function ArchiveLabel() {
  const focusId = useUi((s) => s.focusId);
  const phase = useUi((s) => s.focusPhase);
  const openId = useUi((s) => s.openId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const narrow = window.innerWidth < 768;
        // Beside the relic on wide screens, beneath it on narrow ones.
        const x = narrow ? window.innerWidth / 2 : Math.min(frame.focusX + frame.focusR + 44, window.innerWidth - 380);
        const y = narrow
          ? Math.min(frame.focusY + frame.focusR + 110, window.innerHeight - 150)
          : Math.max(110, Math.min(frame.focusY, window.innerHeight - 220));
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(${narrow ? "-50%" : "0"}, -50%)`;
        el.style.opacity = frame.focusVisible ? String(0.35 + 0.65 * frame.focusNear) : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const info = focusId ? ARTIFACTS[focusId] : null;
  const focused = phase === "focused";

  return (
    <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-30 w-[min(22rem,88vw)] transition-opacity duration-300" style={{ opacity: 0 }}>
      {info && openId !== info.id && (
        <div key={info.id} className="animate-[labelIn_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
          <div className="flex items-center gap-3">
            <SigilMark id={info.id} accent={info.accent} size={30} />
            <p className="narration-shadow font-mono text-[10px] uppercase tracking-[0.38em] text-[#e7c26b]">{info.kind}</p>
          </div>
          <h2 className="narration-shadow mt-3 font-serif text-4xl font-light leading-none text-[#fbf6ec] md:text-5xl">{info.title}</h2>
          <p className="narration-shadow mt-3 max-w-xs font-sans text-sm leading-relaxed text-[#fbf6ec]/80">{info.subtitle}</p>
          <button
            type="button"
            onClick={() => openArtifact(info.id)}
            className={`pointer-events-auto mt-5 inline-flex items-center gap-3 rounded-full border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.3em] transition-all duration-500 ${
              focused
                ? "border-[#e7c26b]/70 bg-black/35 text-[#f6dc93] hover:bg-[#e7c26b] hover:text-[#1a120a]"
                : "border-white/15 bg-black/20 text-[#fbf6ec]/60"
            }`}
          >
            Open the record <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
