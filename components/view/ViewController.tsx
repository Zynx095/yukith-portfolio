"use client";

import { useEffect, useState } from "react";
import { dismissFallbackNotice, useView, useViewFallback } from "@/lib/view";
import { THEME_COLOR } from "@/lib/view-boot";
import { CloseIcon } from "@/components/shared/Icons";
import { setViewAnnouncer, switchView, toggleView } from "./switchView";

/**
 * Page-level glue for the presentation mode: the V shortcut, the polite live
 * region that announces a switch, the browser's theme colour, and the notice
 * shown when the page had to fall back to Classic on its own.
 */
export function ViewController() {
  const view = useView();
  const fallback = useViewFallback();
  const [message, setMessage] = useState("");

  useEffect(() => {
    setViewAnnouncer(setMessage);
    return () => setViewAnnouncer(null);
  }, []);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[view]);
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "v" && e.key !== "V") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      e.preventDefault();
      toggleView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
      {fallback && view === "classic" && (
        <div role="status" className="fixed inset-x-0 top-16 z-40 flex justify-center px-4 pt-3">
          <div className="flex max-w-2xl items-start gap-3 rounded-xl border border-line-strong bg-ink-2 px-4 py-3 text-sm shadow-lg">
            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ember" />
            <p className="text-paper">
              {fallback.reason === "no-webgl"
                ? "This browser or device can't run the 3D World Tree (WebGL 2 is unavailable), so you're reading the Classic portfolio. Everything is here."
                : "The 3D World Tree stopped working on this device, so you're reading the Classic portfolio. Everything is here."}
              {fallback.reason === "error" && (
                <button type="button" onClick={() => switchView("immersive")} className="ml-2 font-medium text-signal underline underline-offset-4">
                  Try the 3D view again
                </button>
              )}
            </p>
            <button type="button" onClick={dismissFallbackNotice} aria-label="Dismiss notice" className="-m-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-paper-dim hover:text-paper">
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Renders its children only in the given presentation (after hydration settles). */
export function OnlyIn({ view, children }: { view: "immersive" | "classic"; children: React.ReactNode }) {
  return useView() === view ? <>{children}</> : null;
}
