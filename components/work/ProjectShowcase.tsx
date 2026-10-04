"use client";

import { useState, type ReactNode } from "react";
import { SigilMark } from "@/components/ui/SigilMark";
import { ProjectLinks } from "./ProjectLinks";
import { projectById } from "@/src/data/projects";

/**
 * A project's chapter in the Work section: its sigil, what it is, the story
 * in a few sentences, verified features (expandable), stack, links — and on
 * the other side something to explore (screenshots or an interactive model).
 */
export function ProjectShowcase({ id, eyebrow, visual, flip = false }: { id: string; eyebrow: string; visual: ReactNode; flip?: boolean }) {
  const project = projectById(id);
  const [allFeatures, setAllFeatures] = useState(false);
  if (!project) return null;
  const features = project.verifiedFeatures ?? [];
  const shown = allFeatures ? features : features.slice(0, 5);

  return (
    <section id={`project-${id}`} className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24" style={{ backgroundColor: "#0D0A08", color: "#F4F1EA" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl"
        style={{ background: project.accent }}
      />
      <div className={`relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:gap-16 ${flip ? "lg:grid-cols-[1.15fr_1fr]" : "lg:grid-cols-[1fr_1.15fr]"}`}>
        <div className={flip ? "lg:order-2" : ""}>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#51321E] bg-[#15100C]" style={{ boxShadow: `0 0 40px -12px ${project.accent}` }}>
              <SigilMark id={project.id} accent={project.accent} size={40} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#B99755]">{eyebrow}</p>
              {project.status && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#D8C9A8]/60">{project.status}</p>}
            </div>
          </div>
          <h2 className="mb-4 font-serif text-4xl text-[#E3CB8A] md:text-6xl">{project.title}</h2>
          <p className="mb-5 font-serif text-xl text-[#D8C9A8]">{project.role}</p>
          <p className="mb-4 max-w-xl font-sans text-base leading-relaxed text-[#E8DCC0]">{project.desc}</p>
          {project.summary && <p className="mb-8 max-w-xl font-sans text-sm leading-relaxed text-[#D8C9A8]/75">{project.summary}</p>}

          {features.length > 0 && (
            <div className="mb-8 border-t border-[#3A2417] pt-6">
              <h3 className="mb-4 font-serif text-[#B99755]">Verified features</h3>
              <ul className="space-y-2.5 font-sans text-sm text-[#D8C9A8]/85">
                {shown.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.accent }} aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {features.length > 5 && (
                <button
                  type="button"
                  onClick={() => setAllFeatures((v) => !v)}
                  aria-expanded={allFeatures}
                  className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#B99755] underline-offset-4 hover:underline"
                >
                  {allFeatures ? "Show fewer" : `Show all ${features.length}`}
                </button>
              )}
            </div>
          )}

          <div className="mb-8 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-[#315D39]/40 px-3 py-1 font-mono text-xs text-[#D8C9A8]">
                {tag}
              </span>
            ))}
          </div>
          <ProjectLinks project={project} />
        </div>
        <div className={flip ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </section>
  );
}
