"use client";

import { useEffect, useRef } from "react";
import { closeRecord, openGame, openRecord, ui, useUi } from "@/lib/world/store";
import { getLenis } from "@/components/providers/smooth-scroll";
import { DOMAIN_LABEL, FEATURED, projectById, type Project } from "@/src/data/projects";
import { DOMAIN_NAME, EVENTS, EVIDENCE_LABEL, eventById, type EventRecord } from "@/src/data/events";
import { RANKS, TOURNAMENTS } from "@/src/data/gaming";
import { entryById } from "@/lib/entries";
import { RANK_EMBLEM, TrophyEmblem } from "@/components/shared/Emblems";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, CloseIcon } from "@/components/shared/Icons";
import { Gallery } from "./Gallery";

/**
 * The record of anything opened in the world — a project relic, an event
 * exhibit, a gaming achievement, a memory, a library volume — or from the
 * index. A native modal <dialog>: focus is trapped and restored, Esc and the
 * backdrop close it, the page behind is inert. Desktop: a side sheet. Phones:
 * a bottom sheet.
 */

function ProjectBody({ project }: { project: Project }) {
  return (
    <>
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
      {project.architecture && (
        <section className="mt-6">
          <h3 className="label">How it fits together</h3>
          <ol className="mt-3 space-y-1.5 border-l border-line pl-4 text-sm text-paper/90">
            {project.architecture.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
      )}
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
      {project.decisions && (
        <section className="mt-6">
          <h3 className="label">Engineering decisions</h3>
          <ul className="mt-3 space-y-2">
            {project.decisions.map((d) => (
              <li key={d} className="flex gap-3 text-paper/90">
                <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-sap" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
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
    </>
  );
}

function EventBody({ e }: { e: EventRecord }) {
  const project = e.project ? projectById(e.project) : undefined;
  return (
    <>
      <p className="font-display text-xl leading-snug text-paper">{e.description}</p>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="label pt-0.5">Role</dt>
        <dd>{e.role}</dd>
        {e.result && (
          <>
            <dt className="label pt-0.5">Result</dt>
            <dd>{e.result}</dd>
          </>
        )}
        {e.organiser && (
          <>
            <dt className="label pt-0.5">Organiser</dt>
            <dd>{e.organiser}</dd>
          </>
        )}
        {e.host && (
          <>
            <dt className="label pt-0.5">Host</dt>
            <dd>{e.host}</dd>
          </>
        )}
        <dt className="label pt-0.5">Category</dt>
        <dd>{DOMAIN_NAME[e.domain]}</dd>
        <dt className="label pt-0.5">Year</dt>
        <dd>{e.year ?? "Not on record"}</dd>
      </dl>
      {project && (
        <button type="button" onClick={() => openRecord(project.id)} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-5 text-sm font-medium text-ink hover:bg-signal">
          Built for it: {project.title} <ArrowRight />
        </button>
      )}
      <section className="mt-8 rounded-lg border border-line bg-ink px-4 py-3">
        <h3 className="label">Evidence · {EVIDENCE_LABEL[e.evidence]}</h3>
        <p className="mt-1 text-sm text-paper-dim">{e.source}</p>
        {e.pending && <p className="mt-2 text-sm text-paper-dim">{e.pending}</p>}
      </section>
    </>
  );
}

export function RecordPanel() {
  const openId = useUi((s) => s.openId);
  const ref = useRef<HTMLDialogElement>(null);
  const entry = openId ? entryById(openId) : undefined;
  const project = openId ? projectById(openId) : undefined;
  const event = openId ? eventById(openId) : undefined;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (entry && !d.open) {
      d.showModal();
      getLenis()?.stop();
    } else if (!entry && d.open) d.close();
  }, [entry]);

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

  // Step through siblings: projects through the featured relics, events through the archive.
  const siblings: { id: string; title: string }[] = project ? FEATURED.map((p) => ({ id: p.id, title: p.title })) : event ? EVENTS.map((x) => ({ id: x.id, title: x.name })) : [];
  const order = siblings.findIndex((p) => p.id === openId);
  const step = (d: number) => {
    if (order < 0) return;
    const next = siblings[(order + d + siblings.length) % siblings.length];
    openRecord(next.id);
    ref.current?.querySelector("[data-scroll]")?.scrollTo({ top: 0 });
  };

  const rank = openId ? RANKS.find((r) => r.id === openId) : undefined;
  const tournament = openId ? TOURNAMENTS.find((t) => t.id === openId) : undefined;
  const Emblem = rank ? RANK_EMBLEM[rank.emblem] : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="record-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="record-sheet m-0 max-h-none max-w-none bg-transparent p-0 text-paper backdrop:bg-black/55 backdrop:backdrop-blur-[2px]"
    >
      {entry && (
        <div className="fixed inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-line bg-ink-2 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(600px,100vw)] md:rounded-none md:border-l md:border-t-0">
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5 md:px-8 md:pt-7">
            <div>
              <p className="label">{project ? `${DOMAIN_LABEL[project.domain]} · ${project.period}` : entry.kicker}</p>
              <h2 id="record-title" className="mt-2 font-display text-3xl leading-tight md:text-4xl">
                {entry.title}
              </h2>
              {entry.subtitle && <p className="mt-1 text-paper-dim">{entry.subtitle}</p>}
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close record" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-paper-dim hover:text-paper">
              <CloseIcon />
            </button>
          </header>

          <div data-scroll data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8">
            {project && <ProjectBody project={project} />}
            {event && <EventBody e={event} />}
            {rank && Emblem && (
              <div>
                <Emblem size={88} />
                <p className="mt-5 font-display text-2xl">{rank.rank}</p>
                <p className="text-paper-dim">{rank.note}</p>
                <p className="mt-6 text-sm text-paper-dim">As reported by Yukith. No match statistics are shown because none are on record.</p>
                <button type="button" onClick={openGame} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm hover:border-signal hover:text-signal">
                  Try the aim trainer <ArrowRight />
                </button>
              </div>
            )}
            {tournament && (
              <div>
                {tournament.id === "amd-valorant" && <TrophyEmblem size={88} place="4" />}
                <p className="mt-4 font-display text-2xl">{tournament.result}</p>
                <p className="mt-3 text-paper/90">{tournament.detail}</p>
                <p className="mt-6 text-sm text-paper-dim">As reported by Yukith. Dates, teams and brackets are not on record.</p>
              </div>
            )}
            {!project && !event && !rank && !tournament && entry.line && <p className="font-display text-xl leading-snug text-paper">{entry.line}</p>}
          </div>

          {order >= 0 && siblings.length > 1 && (
            <footer className="flex items-center justify-between border-t border-line px-4 py-2 md:px-6">
              <button type="button" onClick={() => step(-1)} className="inline-flex min-h-11 max-w-[42%] items-center gap-1 truncate rounded-full px-3 text-sm text-paper-dim hover:text-paper">
                <ChevronLeft /> <span className="truncate">{siblings[(order - 1 + siblings.length) % siblings.length].title}</span>
              </button>
              <span className="label tabular-nums">
                {order + 1} / {siblings.length}
              </span>
              <button type="button" onClick={() => step(1)} className="inline-flex min-h-11 max-w-[42%] items-center gap-1 truncate rounded-full px-3 text-sm text-paper-dim hover:text-paper">
                <span className="truncate">{siblings[(order + 1) % siblings.length].title}</span> <ChevronRight />
              </button>
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

/** A button that opens a record. */
export function RecordButton({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => openRecord(id)} className={className} aria-haspopup="dialog">
      {children}
    </button>
  );
}
