"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ARTIFACTS, type ArtifactId } from "@/lib/world/archive";
import { closeArtifact, useUi } from "@/lib/world/store";
import { achievementsData } from "@/src/data/achievements";
import { leadershipData } from "@/src/data/leadership";
import { experienceData } from "@/src/data/experience";
import type { Project } from "@/src/data/projects";
import { SigilMark } from "./SigilMark";

/**
 * The record behind a relic: a side sheet (bottom sheet on phones) that never
 * blocks the journey. It closes with Esc, its close button, or simply by
 * scrolling on to another part of the tree.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#c9a65a]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ProjectBody({ project }: { project: Project }) {
  return (
    <>
      <p className="font-sans text-[15px] leading-relaxed text-[#f4efe6]/85">{project.summary ?? project.desc}</p>
      {project.summary && <p className="mt-3 font-sans text-sm leading-relaxed text-[#f4efe6]/60">{project.desc}</p>}

      {project.gallery && project.gallery.length > 0 && (
        <div className="-mx-7 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-7 pb-2 md:-mx-9 md:px-9" data-lenis-prevent>
          {project.gallery.map((img) => (
            <figure key={img.src} className="w-[85%] shrink-0 snap-start overflow-hidden rounded-md border border-white/10 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <figcaption className="px-3 py-2 font-sans text-xs text-[#f4efe6]/55">{img.alt}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {project.verifiedFeatures && project.verifiedFeatures.length > 0 && (
        <Section title="What it does">
          <ul className="space-y-2.5">
            {project.verifiedFeatures.map((f) => (
              <li key={f} className="flex gap-3 font-sans text-sm leading-relaxed text-[#f4efe6]/80">
                <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-[#e7c26b]" />
                <span className="first-letter:uppercase">{f}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {project.tags.length > 0 && (
        <Section title="Built with">
          <ul className="flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <li key={t} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-[#f4efe6]/80">
                {t}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="mt-9 flex flex-wrap gap-3">
        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#e7c26b] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#1a120a] transition-colors hover:bg-[#f6dc93]"
          >
            Visit live site <span aria-hidden="true">↗</span>
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#e7c26b]/50 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f6dc93] transition-colors hover:border-[#e7c26b] hover:bg-[#e7c26b]/10"
          >
            View repository <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </>
  );
}

function RecordBody({ id }: { id: ArtifactId }) {
  if (id === "achievements") {
    return (
      <ul className="space-y-4">
        {achievementsData.map((a) => (
          <li key={a.title} className="border-l border-[#e7c26b]/40 pl-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#e7c26b]">{a.roleOrPlacement}</p>
            <p className="mt-1 font-serif text-lg text-[#f4efe6]">{a.title}</p>
            <p className="font-sans text-sm text-[#f4efe6]/60">
              {a.organization} · {a.year}
            </p>
          </li>
        ))}
      </ul>
    );
  }
  if (id === "leadership") {
    return (
      <ul className="space-y-5">
        {leadershipData.map((l) => (
          <li key={l.eventOrClub} className="border-l border-[#e7c26b]/40 pl-4">
            <p className="font-serif text-lg text-[#f4efe6]">{l.role}</p>
            <p className="font-sans text-sm text-[#f4efe6]/65">
              {l.eventOrClub}
              {l.organization ? ` · ${l.organization}` : ""} · {l.period}
            </p>
            {l.verifiedDetails && (
              <ul className="mt-2 space-y-1">
                {l.verifiedDetails.map((d) => (
                  <li key={d} className="font-sans text-xs text-[#f4efe6]/55 first-letter:uppercase">
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-5">
      {experienceData.map((e) => (
        <li key={e.company} className="border-l border-[#e7c26b]/40 pl-4">
          <p className="font-serif text-lg text-[#f4efe6]">{e.company}</p>
          <p className="font-sans text-sm text-[#f4efe6]/65">{e.type}</p>
        </li>
      ))}
    </ul>
  );
}

export function DetailPanel() {
  const openId = useUi((s) => s.openId);
  const focusId = useUi((s) => s.focusId);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Scrolling on to another part of the tree closes the record.
  useEffect(() => {
    if (openId && focusId !== openId) closeArtifact();
  }, [focusId, openId]);

  useEffect(() => {
    if (!openId) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeArtifact();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  const info = openId ? ARTIFACTS[openId] : null;

  return (
    <AnimatePresence>
      {info && (
        <motion.aside
          key={info.id}
          role="dialog"
          aria-modal="false"
          aria-labelledby="record-title"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-white/10 bg-[#120d09]/95 px-7 pb-10 pt-7 shadow-[0_-30px_80px_rgba(0,0,0,0.55)] md:inset-y-4 md:left-auto md:right-4 md:max-h-none md:w-[min(34rem,92vw)] md:rounded-2xl md:border md:px-9"
          data-lenis-prevent
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#e7c26b]/25 bg-black/30">
                <SigilMark id={info.id} accent={info.accent} size={44} />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#c9a65a]">{info.kind}</p>
                <h2 id="record-title" className="mt-1 font-serif text-3xl font-light leading-tight text-[#fbf6ec]">
                  {info.title}
                </h2>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={closeArtifact}
              aria-label="Close record"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#f4efe6]/70 transition-colors hover:border-[#e7c26b]/60 hover:text-[#e7c26b]"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <p className="mt-5 font-sans text-sm text-[#f4efe6]/70">{info.subtitle}</p>
          {info.project?.status && (
            <p className="mt-3 inline-block rounded-full border border-white/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#f4efe6]/60">
              {info.project.status}
            </p>
          )}

          <div className="mt-6 h-px w-full bg-gradient-to-r from-[#e7c26b]/50 to-transparent" />

          <div className="mt-6">{info.project ? <ProjectBody project={info.project} /> : <RecordBody id={info.id} />}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
