"use client";

import { openIndex, ui, useUi } from "@/lib/world/store";
import { scrollToId } from "@/components/providers/smooth-scroll";
import { FileIcon, IndexIcon, SoundIcon } from "./Icons";
import { SECTIONS } from "@/components/index/IndexOverlay";

/**
 * The one persistent bar. In the World Tree it offers the index, sound and a
 * way out to the written portfolio; over the portfolio it becomes its
 * navigation. It never covers the centre of the frame.
 */
export function TopBar() {
  const inWorld = useUi((s) => s.inWorld);
  const ready = useUi((s) => s.ready);
  const noWebgl = useUi((s) => s.noWebgl);
  const sound = useUi((s) => s.sound);
  const world = inWorld && !noWebgl;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div
        className={`pointer-events-auto mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 transition-colors duration-500 md:px-6 ${
          world ? "bg-transparent" : "border-b border-line bg-ink/85 backdrop-blur-md"
        }`}
      >
        <button type="button" onClick={() => scrollToId("record")} className="group flex items-center gap-3 rounded-full py-2 pr-2 text-left">
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full border border-line-strong font-display text-sm">
            Y
          </span>
          <span className="text-sm">
            <span className="block leading-tight">Yukith M Joseph</span>
            <span className="label hidden text-[0.6rem] sm:block">Networks · Security · Applied AI</span>
          </span>
        </button>

        {!world && (
          <nav aria-label="Portfolio sections" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {SECTIONS.slice(1).map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId(s.id);
                    }}
                    className="rounded-full px-3 py-2 text-sm text-paper-dim hover:text-paper"
                  >
                    {s.label.replace(" & leadership", "")}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {world && ready && (
            <a
              href="#record"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("record");
              }}
              className="hidden min-h-10 items-center rounded-full px-3 text-sm text-paper-dim hover:text-paper sm:inline-flex"
            >
              Skip to portfolio
            </a>
          )}
          {world && ready && (
            <button
              type="button"
              onClick={() => ui.set({ sound: !sound })}
              aria-pressed={sound}
              aria-label={sound ? "Mute ambient sound" : "Play ambient sound"}
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-paper-dim hover:border-line-strong hover:text-paper"
            >
              <SoundIcon on={sound} />
            </button>
          )}
          {!world && (
            <a href="/resume.pdf" target="_blank" className="hidden min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm hover:border-signal hover:text-signal sm:inline-flex">
              <FileIcon size={16} /> Resume
            </a>
          )}
          <button
            type="button"
            onClick={openIndex}
            aria-haspopup="dialog"
            aria-keyshortcuts="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong bg-ink/40 px-4 text-sm backdrop-blur-sm hover:border-signal hover:text-signal"
          >
            <IndexIcon size={16} /> Index
          </button>
        </div>
      </div>
    </div>
  );
}
