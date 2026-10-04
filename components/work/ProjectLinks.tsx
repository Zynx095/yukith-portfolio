import { ArrowUpRight, Github } from "lucide-react";
import type { Project } from "@/src/data/projects";

/** Repository and live-site buttons for a project (only the links that exist). */
export function ProjectLinks({ project, compact = false }: { project: Project; compact?: boolean }) {
  const base = compact
    ? "inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors"
    : "inline-flex min-h-[44px] items-center gap-2 rounded border px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-colors";
  return (
    <div className="flex flex-wrap gap-3">
      {project.live && (
        <a
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border-[#B99755] bg-[#B99755] text-[#0D0A08] hover:bg-[#E3CB8A]`}
          aria-label={`Visit the live ${project.title} website`}
        >
          Visit site <ArrowUpRight size={compact ? 14 : 16} aria-hidden="true" />
        </a>
      )}
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border-[#51321E] bg-[#15100C] text-[#E3CB8A] hover:border-[#B99755] hover:bg-[#3A2417]`}
          aria-label={`${project.title} source on GitHub`}
        >
          <Github size={compact ? 14 : 16} aria-hidden="true" /> Repository
        </a>
      )}
    </div>
  );
}
