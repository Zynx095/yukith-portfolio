"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { JOURNEY_VH } from "@/lib/world/chapters";
import { readScroll } from "@/lib/world/scroll";
import { resetWorldState, ui } from "@/lib/world/store";
import { fallBackToClassic, useView } from "@/lib/view";
import { scrollPageToTop } from "@/components/view/switchView";
import { Loader } from "./ui/Loader";

/**
 * Everything heavy (three.js, the scene, its overlays and sound) lives in one
 * lazily loaded chunk, so the Classic presentation never downloads it.
 */
const ExperienceRuntime = dynamic(() => import("./ExperienceRuntime"), { ssr: false });

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

/** Any error thrown while rendering the 3D world (including a failed chunk load) ends in Classic. */
class WorldErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("The 3D world failed", error);
    fallBackToClassic("error", error instanceof Error ? error.message : String(error));
    scrollPageToTop();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The World Tree journey: the scroll spacer that drives it, the loader and —
 * once WebGL 2 is confirmed — the runtime. Rendered only in the Immersive
 * presentation; unmounting it tears the world down completely (the renderer
 * is disposed and its WebGL context released).
 */
function ImmersiveExperience() {
  const [runtime, setRuntime] = useState(false);

  useEffect(() => {
    resetWorldState();
    if (!hasWebgl2()) {
      fallBackToClassic("no-webgl", "WebGL 2 context could not be created");
      return;
    }
    setRuntime(true);
    const update = () => ui.set({ inWorld: readScroll().inWorld });
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resetWorldState({ inWorld: false });
    };
  }, []);

  return (
    <>
      <div id="journey" aria-hidden="true" style={{ height: `${JOURNEY_VH * 100}svh` }} />
      {runtime && (
        <WorldErrorBoundary>
          <ExperienceRuntime />
        </WorldErrorBoundary>
      )}
      <Loader />
    </>
  );
}

export function Experience() {
  const view = useView();
  return view === "immersive" ? <ImmersiveExperience /> : null;
}
