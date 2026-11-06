"use client";

import { openIndex, ui, useUi } from "@/lib/world/store";
import { useView } from "@/lib/view";
import { scrollToId } from "@/components/providers/smooth-scroll";
import { SECTIONS } from "@/components/portfolio/sections";
import { ViewSwitch } from "@/components/view/ViewSwitch";
import { FileIcon, IndexIcon, SoundIcon } from "./Icons";

/**
 * The one persistent bar. It always carries the presentation switcher and the
 * index. In the World Tree it adds sound and a way out to the written
 * portfolio; over the written portfolio (and in Classic) it becomes the
 * site's navigation. It never covers the centre of the frame.
 */
export function TopBar() {
  const view = useView();
  const inWorld = useUi((s) => s.inWorld);
  const ready = useUi((s) => s.ready);
  const sound = useUi((s) => s.sound);
  const world = view === "immersive" && inWorld;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div
        data-topbar
        data-solid={!world}
        className={`pointer-events-auto mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 transition-colors duration-500 md:px-6 ${
          world ? "bg-transparent" : "border-b border-line bg-ink/85 backdrop-blur-md"
        }`}
      >
        <a
          href="#record"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("record");
          }}
          className="group flex min-w-0 items-center gap-3 rounded-full py-2 pr-2 text-left"
        >
          <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong font-display text-sm">
            Y
          </span>
          <span className="hidden text-sm sm:block">
            <span className="block leading-tight">Yukith M Joseph</span>
            <span className="label hidden text-[0.6rem] md:block">Networks · Security · Applied AI</span>
          </span>
          <span className="sr-only sm:hidden">Yukith M Joseph — introduction</span>
        </a>

        <nav aria-label="Portfolio sections" data-portfolio-nav className={world ? "hidden" : "hidden xl:block"}>
          <ul className="flex items-center gap-1">
            {SECTIONS.filter((s) => s.nav).map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(s.id);
                  }}
                  className="rounded-full px-3 py-2 text-sm text-paper-dim hover:text-paper"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {world && ready && (
            <a
              href="#record"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("record");
              }}
              className="hidden min-h-10 items-center rounded-full px-3 text-sm text-paper-dim hover:text-paper lg:inline-flex"
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
            <a href="/resume.pdf" target="_blank" className="hidden min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm hover:border-signal hover:text-signal md:inline-flex">
              <FileIcon size={16} /> Resume
            </a>
          )}
          <ViewSwitch />
          <button
            type="button"
            onClick={openIndex}
            data-js-only
            aria-haspopup="dialog"
            aria-keyshortcuts="/"
            aria-label="Open the index"
            className="inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-line-strong bg-ink/40 px-3 text-sm backdrop-blur-sm hover:border-signal hover:text-signal sm:px-4"
          >
            <IndexIcon size={16} /> <span className="hidden sm:inline">Index</span>
          </button>
        </div>
      </div>
    </div>
  );
}
