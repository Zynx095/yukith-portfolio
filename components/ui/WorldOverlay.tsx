"use client";

import { useEffect, useRef } from "react";
import { CinematicNarration } from "./CinematicNarration";
import { JourneyHUD } from "./JourneyHUD";
import { SocialIcons } from "./SocialIcons";
import { ArchiveLabel } from "./ArchiveLabel";
import { DetailPanel } from "./DetailPanel";
import { frame, useUi, type QualityTier } from "@/lib/world/store";
import { PORTFOLIO_CREAM } from "@/lib/world/constants";

/** Everything drawn over the canvas while the visitor is in the world. */
export function WorldOverlay({ quality }: { quality: QualityTier }) {
  const inWorld = useUi((s) => s.inWorld);
  const outroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (outroRef.current) outroRef.current.style.opacity = String(frame.outro);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ visibility: inWorld ? "visible" : "hidden" }}>
      {/* Low tier renders without the composer, so the vignette is drawn here instead. */}
      {quality === "low" && (
        <div
          className="pointer-events-none fixed inset-0 z-[1]"
          style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.42) 100%)" }}
        />
      )}
      <CinematicNarration />
      <ArchiveLabel />
      <JourneyHUD />
      <div className="fixed bottom-5 right-5 z-30 md:bottom-7 md:right-8">
        <SocialIcons />
      </div>
      <DetailPanel />
      {/* The ascent ends in light: the world dissolves into the portfolio's paper. */}
      <div ref={outroRef} className="pointer-events-none fixed inset-0 z-40" style={{ background: PORTFOLIO_CREAM, opacity: 0 }} />
    </div>
  );
}
