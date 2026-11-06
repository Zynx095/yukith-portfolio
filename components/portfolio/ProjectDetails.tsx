import type { Project } from "@/src/data/projects";

/**
 * A project's full record, inline: a native <details> disclosure, so it opens
 * without JavaScript and is announced as expandable by screen readers.
 */
export function ProjectDetails({ project, className = "" }: { project: Project; className?: string }) {
  return (
    <details className={`group/details rounded-xl border border-line ${className}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-2.5 text-sm text-paper hover:text-signal [&::-webkit-details-marker]:hidden">
        <span>
          <span className="group-open/details:hidden">Full details</span>
          <span className="hidden group-open/details:inline">Hide details</span>
          <span className="sr-only"> for {project.title}</span>
        </span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 transition-transform duration-300 group-open/details:rotate-180">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="space-y-6 border-t border-line px-4 pb-5 pt-5 text-[0.95rem]">
        <div>
          <h4 className="label">The problem</h4>
          <p className="mt-1.5 text-paper/90">{project.problem}</p>
        </div>
        {project.architecture && (
          <div>
            <h4 className="label">How it fits together</h4>
            <ol className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-paper/90">
              {project.architecture.map((step, i) => (
                <li key={step} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true" className="text-paper-faint">→</span>}
                  <span className="rounded-md border border-line px-2 py-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div>
          <h4 className="label">Implemented</h4>
          <ul className="mt-2 space-y-1.5">
            {project.features.map((f) => (
              <li key={f} className="flex gap-3 text-paper/90">
                <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        {project.decisions && (
          <div>
            <h4 className="label">Engineering decisions</h4>
            <ul className="mt-2 space-y-1.5">
              {project.decisions.map((d) => (
                <li key={d} className="flex gap-3 text-paper/90">
                  <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-sap" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[7rem_1fr]">
          <dt className="label pt-0.5">My part</dt>
          <dd className="text-paper/90">{project.contribution}</dd>
          {project.context && (
            <>
              <dt className="label pt-0.5">Context</dt>
              <dd className="text-paper/90">{project.context}</dd>
            </>
          )}
        </dl>
        {project.limits && (
          <div className="rounded-lg border border-line bg-ink-2 px-4 py-3">
            <h4 className="label text-ember">Honest limits</h4>
            <p className="mt-1 text-sm text-paper-dim">{project.limits}</p>
          </div>
        )}
        {project.gallery && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {project.gallery.map((img) => (
              <li key={img.src}>
                <a href={img.src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.alt} width={img.width} height={img.height} loading="lazy" decoding="async" className="aspect-[3/2] h-auto w-full object-cover" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
