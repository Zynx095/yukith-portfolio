"use client";

import { SigilMark } from "@/components/ui/SigilMark";
import { getLenis } from "@/components/providers/smooth-scroll";
import { ProjectLinks } from "./ProjectLinks";
import { PROJECTS } from "@/src/data/projects";

/** Order of the chapters below; the index mirrors it. */
export const WORK_ORDER = ["etth", "aura", "shadowguard", "sugarai", "qshield", "jiva", "street-hierarchy", "trc"];

const KIND: Record<string, string> = { "street-hierarchy": "Roblox game", trc: "Client website" };

/** Every branch at a glance: sigil, what it is, one line, and a way in. */
export function WorkIndex() {
  const projects = WORK_ORDER.map((id) => PROJECTS.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p && !p.isPlaceholder);

  const open = (id: string) => {
    const el = document.getElementById(`project-${id}`);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28">
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {projects.map((p) => (
          <li key={p.id}>
            <article
              className="group relative flex h-full flex-col rounded-xl border border-[#2A1D14] bg-[#120D0A] p-6 transition duration-500 hover:-translate-y-1 hover:border-[#51321E]"
              style={{ ["--accent" as string]: p.accent }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ boxShadow: `inset 0 0 0 1px ${p.accent}40, 0 24px 60px -30px ${p.accent}` }}
              />
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#3A2417] bg-[#0D0A08]">
                  <SigilMark id={p.id} accent={p.accent} size={34} />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#D8C9A8]/55">
                  {KIND[p.id] ?? "Project"} · {p.year}
                </span>
              </div>
              <h3 className="mb-1 font-serif text-2xl text-[#E3CB8A]">{p.title}</h3>
              <p className="mb-3 font-sans text-sm text-[#D8C9A8]">{p.role}</p>
              <p className="mb-6 line-clamp-3 font-sans text-sm leading-relaxed text-[#D8C9A8]/65">{p.desc}</p>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => open(p.id)}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#B99755]/70 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#E3CB8A] transition-colors hover:bg-[#B99755] hover:text-[#0D0A08]"
                  aria-label={`Read about ${p.title}`}
                >
                  Explore <span aria-hidden="true">↓</span>
                </button>
                <ProjectLinks project={p} compact />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
