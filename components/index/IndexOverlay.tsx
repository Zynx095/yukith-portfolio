"use client";

import { useEffect, useRef } from "react";
import { closeIndex, openGame, openIndex, openRecord, ui, useUi } from "@/lib/world/store";
import { DISCOVERABLES, useDiscoveryCount } from "@/lib/discoveries";
import { getLenis, scrollToId } from "@/components/providers/smooth-scroll";
import { scrollToProgress } from "@/lib/world/scroll";
import { CHAPTERS, JOURNEY_VH } from "@/lib/world/chapters";
import { COLLABORATIONS, FEATURED, MORE_WORK } from "@/src/data/projects";
import { SECTIONS } from "@/components/portfolio/sections";
import { useView } from "@/lib/view";
import { switchView } from "@/components/view/switchView";
import { SocialLinks } from "@/components/shared/SocialLinks";
import { CloseIcon } from "@/components/shared/Icons";


/**
 * The index: everything in one place for visitors who would rather not travel
 * the whole tree. Opens with the "Index" button or the "/" key.
 */
export function IndexOverlay() {
  const open = useUi((s) => s.indexOpen);
  const view = useView();
  const found = useDiscoveryCount();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      getLenis()?.stop();
    } else if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    const onClose = () => {
      if (!ui.get().openId) getLenis()?.start();
      closeIndex();
    };
    d?.addEventListener("close", onClose);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing && !ui.get().openId) {
        e.preventDefault();
        openIndex();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      d?.removeEventListener("close", onClose);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (fn: () => void) => {
    ref.current?.close();
    // Let the dialog release scrolling before travelling.
    requestAnimationFrame(fn);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="index-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="m-0 max-h-none max-w-none bg-transparent p-0 text-paper backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div data-lenis-prevent className="fixed inset-0 overflow-y-auto overscroll-contain bg-ink/95 md:inset-x-auto md:inset-y-4 md:left-1/2 md:w-[min(880px,calc(100vw-2rem))] md:-translate-x-1/2 md:rounded-2xl md:border md:border-line md:bg-ink-2">
          <div className="flex items-center justify-between border-b border-line px-6 py-4 md:px-8">
            <h2 id="index-title" className="font-display text-2xl">
              Index
            </h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close index" className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-paper-dim hover:text-paper">
              <CloseIcon />
            </button>
          </div>

          <div className="grid gap-10 px-6 py-8 md:grid-cols-2 md:px-8">
            <nav aria-labelledby="idx-projects">
              <h3 id="idx-projects" className="label">
                Projects — open a record
              </h3>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {[...FEATURED, ...MORE_WORK, ...COLLABORATIONS].map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => openRecord(p.id)} className="group flex w-full items-baseline justify-between gap-4 py-2.5 text-left">
                      <span className="font-display text-lg group-hover:text-signal">{p.title}</span>
                      <span className="truncate text-right text-sm text-paper-dim">{p.kind}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-10">
              {view === "classic" && (
                <div>
                  <h3 className="label">Presentation</h3>
                  <p className="mt-3 text-sm text-paper-dim">You are reading the Classic portfolio. The same work is also an explorable 3D World Tree.</p>
                  <button type="button" onClick={() => go(() => switchView("immersive"))} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-sm hover:border-signal hover:text-signal">
                    Enter the World Tree
                  </button>
                </div>
              )}
              {view === "immersive" && (
                <nav aria-labelledby="idx-journey">
                  <h3 id="idx-journey" className="label">
                    The journey — jump to a chapter
                  </h3>
                  <ol className="mt-3 space-y-1">
                    {CHAPTERS.map((c, i) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => go(() => scrollToProgress(c.start + (i === 0 ? 0 : 0.3 / JOURNEY_VH)))} className="group flex w-full gap-3 py-1.5 text-left">
                          <span className="label w-6 pt-1 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                          <span>
                            <span className="group-hover:text-signal">{c.title}</span>
                            <span className="block text-sm text-paper-dim">{c.blurb}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <nav aria-labelledby="idx-sections">
                <h3 id="idx-sections" className="label">
                  {view === "classic" ? "Sections" : "The written portfolio"}
                </h3>
                <ul className="mt-3 space-y-1">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => go(() => scrollToId(s.id))} className="py-1.5 text-left hover:text-signal">
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
              <div>
                <h3 className="label">Play &amp; discover</h3>
                <button type="button" onClick={() => go(openGame)} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-sm hover:border-signal hover:text-signal">
                  Open the aim trainer
                </button>
                <p className="mt-3 text-sm text-paper-dim">
                  Discovered {found} of {DISCOVERABLES.length} things in the world — relics, exhibits, memories and more.
                </p>
              </div>
              <div>
                <h3 className="label">Contact</h3>
                <SocialLinks className="mt-3" />
              </div>
            </div>
          </div>
          <p className="border-t border-line px-6 py-3 text-xs text-paper-faint md:px-8">
            Press <kbd className="rounded border border-line px-1 font-mono">/</kbd> anywhere to open the index, <kbd className="rounded border border-line px-1 font-mono">Esc</kbd> to close it, <kbd className="rounded border border-line px-1 font-mono">V</kbd> to switch between Immersive and Classic.
          </p>
        </div>
      )}
    </dialog>
  );
}
