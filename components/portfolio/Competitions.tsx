import { EVENT_ORGANISING, EVENT_PARTICIPATION, EVENT_RESULTS, EVIDENCE_LABEL, DOMAIN_NAME, type EventRecord } from "@/src/data/events";
import { projectById } from "@/src/data/projects";

/** One event, as a row: result or role, the event, where, and what the evidence is. */
function EventRow({ e }: { e: EventRecord }) {
  const project = e.project ? projectById(e.project) : undefined;
  return (
    <li id={`event-${e.id}`} className="grid scroll-mt-24 grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-b border-line py-5">
      <div>
        <p className="font-display text-[1.3rem] leading-snug">{e.name}</p>
        <p className="text-sm text-paper-dim">
          {[e.organiser, e.host].filter(Boolean).join(" · ") || DOMAIN_NAME[e.domain]}
        </p>
      </div>
      <p className="label pt-1 text-right tabular-nums text-sap">{e.year ?? ""}</p>
      <div className="col-span-2 mt-1 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-line-strong px-2.5 py-0.5 font-mono text-[0.72rem]">{e.result ?? e.role}</span>
        <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.72rem] text-paper-dim">{DOMAIN_NAME[e.domain]}</span>
        {project && (
          <a href={`#project-${project.id}`} className="text-paper underline decoration-line-strong underline-offset-4 hover:text-signal">
            Built {project.title}
          </a>
        )}
      </div>
      <p className="col-span-2 mt-1 text-paper/85">{e.description}</p>
      <p className="col-span-2 text-xs text-paper-faint">
        {EVIDENCE_LABEL[e.evidence]}
        {e.pending ? ` · ${e.pending}` : ""}
      </p>
    </li>
  );
}

/**
 * Every hackathon, competition and event — results, organising, then
 * participation. Participation is never presented as a placing.
 */
export function Competitions() {
  return (
    <div className="space-y-16">
      <div className="grid gap-14 lg:grid-cols-2">
        <div>
          <h3 className="label">Results</h3>
          <ul className="mt-2 border-t border-line">
            {EVENT_RESULTS.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </ul>
        </div>
        <div>
          <h3 className="label">Organising</h3>
          <ul className="mt-2 border-t border-line">
            {EVENT_ORGANISING.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h3 className="label">Took part in</h3>
        <ul className="mt-2 grid border-t border-line md:grid-cols-2 md:gap-x-12">
          {EVENT_PARTICIPATION.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </ul>
      </div>
    </div>
  );
}
