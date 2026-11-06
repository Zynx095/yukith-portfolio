"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { JOURNEY_VH } from "@/lib/world/chapters";
import { readScroll } from "@/lib/world/scroll";
import { ui, useUi } from "@/lib/world/store";
import { Loader } from "./ui/Loader";
import { JourneyOverlay } from "./ui/JourneyOverlay";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

function hasWebgl2() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * The World Tree journey: the scroll spacer that drives it, the canvas, and
 * its overlays. Without WebGL2 the spacer collapses and the written portfolio
 * stands on its own.
 */
export function Experience() {
  const noWebgl = useUi((s) => s.noWebgl);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!hasWebgl2()) ui.set({ noWebgl: true, inWorld: false });
    setMounted(true);
    const update = () => ui.set({ inWorld: !ui.get().noWebgl && readScroll().inWorld });
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (noWebgl) return null;
  return (
    <>
      {/* Without JavaScript the journey cannot run: hide it and show the portfolio. */}
      <noscript>
        <style>{`#journey,#loader{display:none!important}`}</style>
      </noscript>
      <div id="journey" aria-hidden="true" style={{ height: `${JOURNEY_VH * 100}svh` }} />
      {mounted && <WorldCanvas />}
      {mounted && <JourneyOverlay />}
      <Loader />
    </>
  );
}
