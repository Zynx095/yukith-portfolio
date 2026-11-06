"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/lib/world/store";
import { scrollToId } from "@/components/providers/smooth-scroll";

/**
 * The loading screen: the World Tree drawn as a single ink line, its stroke
 * advancing with real progress (files finished, then shaders compiled). The
 * name, role and a way straight to the portfolio are usable from the first
 * frame, so nobody has to wait for WebGL to learn who this is.
 */

// One continuous line: roots, trunk, limbs and the crown's outline.
const TREE_PATH =
  "M40 196 C70 190 92 188 104 176 C112 166 114 150 113 132 C112 112 110 96 106 84 " +
  "C96 80 82 74 70 62 C60 52 58 40 66 31 C74 22 88 22 96 28 C100 16 114 8 128 10 " +
  "C142 12 152 20 154 30 C164 24 178 26 186 36 C194 46 190 60 180 68 C170 76 156 80 142 82 " +
  "C138 96 136 112 135 132 C134 150 136 166 144 176 C156 188 178 190 208 196";
const ROOTS = "M104 176 C96 186 84 192 70 196 M144 176 C152 186 164 192 180 196 M113 182 C112 190 110 194 106 198 M135 182 C136 190 138 194 142 198";
const LIMBS = "M112 104 C104 92 94 84 82 78 M136 100 C146 90 158 84 170 80 M118 92 C118 70 120 52 124 38 M130 92 C134 72 140 56 150 44";

export function Loader() {
  const ready = useUi((s) => s.ready);
  const loaded = useUi((s) => s.loaded);
  const noWebgl = useUi((s) => s.noWebgl);
  const [gone, setGone] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 9000);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!ready && !noWebgl) return;
    const t = window.setTimeout(() => setGone(true), 1300);
    return () => window.clearTimeout(t);
  }, [ready, noWebgl]);
  if (gone) return null;

  const pct = Math.round(loaded * 100);
  const hidden = ready || noWebgl;
  return (
    <div
      id="loader"
      className={`fixed inset-0 z-30 flex flex-col items-center justify-center bg-ink px-6 text-center transition-opacity duration-[1200ms] ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <svg viewBox="0 0 248 206" className="h-auto w-[min(62vw,340px)]" aria-hidden="true">
        <path d={TREE_PATH} pathLength={1} fill="none" stroke="var(--color-paper)" strokeWidth={1.1} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - Math.min(1, loaded * 1.1)} style={{ transition: "stroke-dashoffset 600ms ease-out" }} />
        <path d={ROOTS} pathLength={1} fill="none" stroke="var(--color-signal)" strokeWidth={1} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - Math.max(0, loaded * 1.4 - 0.4)} style={{ transition: "stroke-dashoffset 600ms ease-out" }} />
        <path d={LIMBS} pathLength={1} fill="none" stroke="var(--color-paper-dim)" strokeWidth={0.9} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - Math.max(0, loaded * 1.6 - 0.6)} style={{ transition: "stroke-dashoffset 600ms ease-out" }} />
        <circle cx="124" cy="199" r="2.2" fill="var(--color-signal)" className="animate-pulse" />
      </svg>
      <p className="label mt-8">The World Tree</p>
      <p className="mt-3 font-display text-3xl md:text-4xl">Yukith M Joseph</p>
      <p className="mt-2 max-w-md text-sm text-paper-dim">Computer Science & Engineering · Networks · Presidency University, Bengaluru</p>
      <p className="label mt-8 tabular-nums" aria-hidden="true">
        {pct < 95 ? `Growing the world · ${pct}%` : "Preparing the light…"}
      </p>
      <p role="status" className="sr-only">
        {hidden ? "The 3D World Tree is ready." : "Loading the 3D World Tree. The written portfolio below is available now."}
      </p>
      <p className="mt-6 max-w-sm text-xs leading-relaxed text-paper-faint">Scroll to travel. Click a relic to open its record. Press / for the index.</p>
      <a
        href="#record"
        onClick={(e) => {
          e.preventDefault();
          scrollToId("record");
        }}
        className={`mt-6 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-signal hover:text-signal ${slow ? "text-paper" : "text-paper-dim"}`}
      >
        {slow ? "Taking a while? Read the portfolio now" : "Skip to the portfolio"}
      </a>
    </div>
  );
}
