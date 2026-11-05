"use client";

import { useEffect, useRef } from "react";
import { closeRecord, openRecord, ui, useUi } from "@/lib/world/store";
import { getLenis } from "@/components/providers/smooth-scroll";
import { DOMAIN_LABEL, FEATURED, projectById } from "@/src/data/projects";
import { ArrowUpRight, ChevronLeft, ChevronRight, CloseIcon } from "@/components/shared/Icons";
import { Gallery } from "./Gallery";

/**
 * A project's full record — opened from a relic in the World Tree, from the
 * index or from the written portfolio. A native modal <dialog>: focus is
 * trapped and restored, Esc and the backdrop close it, the page behind is inert.
 * Desktop: a side sheet. Phones: a bottom sheet.
 */
export function RecordPanel() {
  const openId = useUi((s) => s.openId);
  const ref = useRef<HTMLDialogElement>(null);
  const project = openId ? projectById(openId) : undefined;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (project && !d.open) {
      d.showModal();
      getLenis()?.stop();
    } else if (!project && d.open) d.close();
  }, [project]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => {
      if (!ui.get().indexOpen) getLenis()?.start();
      closeRecord();
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const order = FEATURED.findIndex((p) => p.id === openId);
  const step = (d: number) => {
    if (order < 0) return;
    const next = FEATURED[(order + d + FEATURED.length) % FEATURED.length];
    openRecord(next.id);
    ref.current?.querySelector("[data-scroll]")?.scrollTo({ top: 0 });
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="record-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="record-sheet m-0 max-h-none max-w-none bg-transparent p-0 text-paper backdrop:bg-black/55 backdrop:backdrop-blur-[2px]"
    >
      {project && (
        <div className="fixed inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-line bg-ink-2 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(600px,100vw)] md:rounded-none md:border-l md:border-t-0">
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5 md:px-8 md:pt-7">
            <div>
              <p className="label">
                {DOMAIN_LABEL[project.domain]} · {project.period}
              </p>
              <h2 id="record-title" className="mt-2 font-display text-3xl leading-tight md:text-4xl">
                {project.title}
              </h2>
              <p className="mt-1 text-paper-dim">{project.kind}</p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close record" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-paper-dim hover:text-paper">
              <CloseIcon />
            </button>
          </header>

          <div data-scroll data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8">
            <p className="font-display text-xl leading-snug text-paper">{project.tagline}</p>

            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="label pt-0.5">Status</dt>
              <dd>{project.status}</dd>
              {project.context && (
                <>
                  <dt className="label pt-0.5">Context</dt>
                  <dd>{project.context}</dd>
                </>
              )}
              <dt className="label pt-0.5">My part</dt>
              <dd>{project.contribution}</dd>
            </dl>

            <section className="mt-8">
              <h3 className="label">The problem</h3>
              <p className="mt-2 text-paper/90">{project.problem}</p>
            </section>
            <section className="mt-6">
              <h3 className="label">What it does</h3>
              <p className="mt-2 text-paper/90">{project.summary}</p>
            </section>
            <section className="mt-6">
              <h3 className="label">Implemented</h3>
              <ul className="mt-3 space-y-2">
                {project.features.map((f) => (
                  <li key={f} className="flex gap-3 text-paper/90">
                    <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </section>
            {project.limits && (
              <section className="mt-6 rounded-lg border border-line bg-ink px-4 py-3">
                <h3 className="label text-ember">Honest limits</h3>
                <p className="mt-1 text-sm text-paper-dim">{project.limits}</p>
              </section>
            )}
            <section className="mt-6">
              <h3 className="label">Stack</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <li key={s} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-paper-dim">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
            {project.gallery && (
              <section className="mt-8">
                <Gallery images={project.gallery} title={project.title} />
              </section>
            )}
            <ul className="mt-8 flex flex-wrap gap-2 pb-2">
              {project.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm hover:border-signal hover:text-signal">
                    {l.label}
                    <ArrowUpRight />
                  </a>
                  {l.note && <p className="mt-1 pl-4 text-xs text-paper-faint">{l.note}</p>}
                </li>
              ))}
            </ul>
          </div>

          {order >= 0 && (
            <footer className="flex items-center justify-between border-t border-line px-4 py-2 md:px-6">
              <button type="button" onClick={() => step(-1)} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-paper-dim hover:text-paper">
                <ChevronLeft /> {FEATURED[(order - 1 + FEATURED.length) % FEATURED.length].title}
              </button>
              <span className="label tabular-nums">
                {order + 1} / {FEATURED.length}
              </span>
              <button type="button" onClick={() => step(1)} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-paper-dim hover:text-paper">
                {FEATURED[(order + 1) % FEATURED.length].title} <ChevronRight />
              </button>
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

/** A button that opens a project's record. */
export function RecordButton({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => openRecord(id)} className={className} aria-haspopup="dialog">
      {children}
    </button>
  );
}
