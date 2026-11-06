"use client";

import { useEffect, useRef } from "react";
import { Ambient } from "@/lib/world/audio";
import { frame, ui, useUi } from "@/lib/world/store";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Drives the synthesised ambience from the journey: which layers are audible
 * follows where the camera is. Created only after the visitor turns sound on.
 */
export function Sound() {
  const on = useUi((s) => s.sound);
  const inWorld = useUi((s) => s.inWorld);
  const ambient = useRef<Ambient | null>(null);

  useEffect(() => {
    if (!on) {
      ambient.current?.stop();
      return;
    }
    if (!ambient.current) {
      try {
        ambient.current = new Ambient();
      } catch {
        ui.set({ sound: false });
        return;
      }
    }
    void ambient.current.start();
  }, [on]);

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let last = performance.now();
    let lastFocus: string | null = null;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const a = ambient.current;
      if (a) {
        const p = frame.progress;
        const inside = frame.interior;
        const outside = (1 - inside) * (inWorld ? 1 : 0.15);
        a.update(
          {
            wind: outside * (0.5 + 0.4 * smooth(0.25, 0.4, p)) + (p > 0.93 ? 0.6 : 0),
            fire: outside * (1 - smooth(0.11, 0.17, p)) * 0.9,
            water: outside * Math.max(1 - smooth(0.15, 0.2, p), 0.25 * (1 - smooth(0.3, 0.36, p))),
            crickets: outside * smooth(0.36, 0.44, p) * 0.5,
            hall: inside * (inWorld ? 0.9 : 0),
          },
          dt
        );
        const focus = ui.get().focusPhase === "focused" ? ui.get().focusId : null;
        if (focus && focus !== lastFocus) a.chime();
        lastFocus = focus;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, inWorld]);

  useEffect(() => () => ambient.current?.dispose(), []);
  return null;
}
