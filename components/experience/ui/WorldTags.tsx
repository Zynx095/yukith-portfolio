"use client";

import { useEffect, useRef } from "react";
import { MAX_TAGS, screenTags } from "@/lib/world/tags";
import { openRecord, useUi } from "@/lib/world/store";

/**
 * Name tags for interactive things near the camera. A fixed pool of buttons is
 * moved on animation frames (no React re-renders while scrolling).
 */
export function WorldTags() {
  const pool = useRef<(HTMLButtonElement | null)[]>([]);
  const ids = useRef<string[]>([]);
  const open = useUi((s) => s.openId !== null || s.indexOpen || s.gameOpen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      for (let i = 0; i < MAX_TAGS; i++) {
        const el = pool.current[i];
        if (!el) continue;
        const t = screenTags[i];
        if (!t || open) {
          if (el.style.opacity !== "0") {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            el.tabIndex = -1;
          }
          continue;
        }
        if (ids.current[i] !== t.id) {
          ids.current[i] = t.id;
          el.textContent = t.title;
          el.dataset.id = t.id;
          el.setAttribute("aria-label", `${t.title} — open`);
        }
        el.style.opacity = String(Math.min(1, 0.35 + t.near * 1.2));
        el.style.pointerEvents = "auto";
        el.tabIndex = 0;
        el.style.transform = `translate3d(${Math.round(t.x)}px, ${Math.round(t.y)}px, 0) translate(-50%, -140%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <div aria-label="Things nearby" role="group" className="absolute inset-0">
      {Array.from({ length: MAX_TAGS }, (_, i) => (
        <button
          key={i}
          ref={(el) => void (pool.current[i] = el)}
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            const id = (e.currentTarget as HTMLButtonElement).dataset.id;
            if (id) openRecord(id);
          }}
          className="absolute left-0 top-0 whitespace-nowrap rounded-full border border-paper/25 bg-ink/65 px-2.5 py-1 text-xs text-paper backdrop-blur-sm transition-opacity duration-200 hover:border-signal hover:text-signal"
          style={{ opacity: 0, pointerEvents: "none" }}
        />
      ))}
    </div>
  );
}
