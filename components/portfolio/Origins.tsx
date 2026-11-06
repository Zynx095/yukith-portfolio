import { FAMILY_SUMMARY, FIRST_STEPS, MEMORIES, SCHOOLS } from "@/src/data/origins";

/** Family, first steps and a few memories — personal, but private by design. */
export function Origins() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div>
        <h3 className="label">Family</h3>
        <p className="mt-3 font-display text-2xl leading-snug">{FAMILY_SUMMARY}</p>
        <h3 className="label mt-10">First steps</h3>
        <ul className="mt-3 space-y-3">
          {SCHOOLS.map((s) => (
            <li key={s.name}>
              <p>
                {s.name} <span className="text-paper-dim">· {s.years}</span>
              </p>
              <p className="text-sm text-paper-dim">{s.memory}</p>
            </li>
          ))}
          <li className="text-sm text-paper-dim">{FIRST_STEPS.influence}</li>
        </ul>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        {MEMORIES.map((m) => (
          <li key={m.id} id={m.id} className="scroll-mt-24 bg-ink p-5 sm:last:odd:col-span-2">
            <p className="label">{m.title}</p>
            <p className="mt-2 text-paper/90">{m.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
