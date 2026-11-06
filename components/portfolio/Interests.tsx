import { LIBRARY_SUMMARY, VOLUMES, type Shelf } from "@/src/data/library";

const SHELVES: Shelf[] = ["Manhwa", "Manga", "Anime", "Series", "Games", "Writing", "Music"];

/**
 * The library, on paper: each title is an original book spine (colour and
 * type only — no cover art), grouped by shelf.
 */
export function Interests() {
  return (
    <div>
      <p className="max-w-2xl text-lg text-paper/90">{LIBRARY_SUMMARY}</p>
      <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {SHELVES.filter((s) => VOLUMES.some((v) => v.shelf === s)).map((shelf) => (
          <li key={shelf}>
            <h3 className="label border-b border-line pb-3">{shelf}</h3>
            <ul className="mt-4 space-y-4">
              {VOLUMES.filter((v) => v.shelf === shelf).map((v) => (
                <li key={v.id} id={v.id} className="flex scroll-mt-24 gap-4">
                  <span aria-hidden="true" className="relative block h-16 w-4 shrink-0 rounded-[3px] shadow-sm" style={{ background: v.color }}>
                    <span className="absolute inset-x-[3px] top-2 h-px bg-white/40" />
                    <span className="absolute inset-x-[3px] bottom-2 h-px bg-white/40" />
                  </span>
                  <span>
                    <span className="block font-display text-xl leading-tight">{v.title}</span>
                    <span className="block text-sm text-paper-dim">{v.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
