import { GAMING_SUMMARY, RANKS, TOURNAMENTS } from "@/src/data/gaming";
import { RANK_EMBLEM, TrophyEmblem } from "@/components/shared/Emblems";
import { PlayAimButton } from "@/components/aim/PlayAimButton";

/** Competitive gaming: ranks, tournaments, and the aim trainer. */
export function Gaming() {
  const amd = TOURNAMENTS.find((t) => t.id === "amd-valorant")!;
  const rest = TOURNAMENTS.filter((t) => t.id !== "amd-valorant");
  return (
    <div className="space-y-14">
      <p className="max-w-2xl text-lg text-paper/90">{GAMING_SUMMARY}</p>

      <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {RANKS.map((r) => {
          const Emblem = RANK_EMBLEM[r.emblem];
          return (
            <li key={r.id} id={r.id} className="flex scroll-mt-24 flex-col items-start bg-ink p-6 md:p-7">
              <Emblem size={64} />
              <p className="label mt-5">{r.game}</p>
              <p className="mt-1 font-display text-[2rem] leading-tight">{r.rank}</p>
              <p className="text-sm text-paper-dim">{r.note}</p>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <article id={amd.id} className="flex scroll-mt-24 items-start gap-5 rounded-2xl border border-line-strong p-6 md:p-7">
          <TrophyEmblem size={72} place="4" />
          <div>
            <p className="label">Tournament · {amd.game}</p>
            <h3 className="mt-1 font-display text-[1.7rem] leading-tight">{amd.title}</h3>
            <p className="mt-1 font-display text-xl text-sap">{amd.result}</p>
            <p className="mt-3 text-paper/85">{amd.detail}</p>
          </div>
        </article>
        <div>
          <h3 className="label">Competitive history</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {rest.map((t) => (
              <li key={t.id} id={t.id} className="scroll-mt-24 py-4">
                <p className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-xl">{t.title}</span>
                  <span className="label shrink-0">{t.level}</span>
                </p>
                <p className="text-paper/85">{t.result}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-paper-faint">Ranks and results as reported by Yukith. Dates, teams and match statistics are not on record, so none are shown — and the order above is not a timeline.</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line-strong p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div>
          <p className="label">Portfolio mini-game</p>
          <p className="mt-1 font-display text-2xl">Aim trainer</p>
          <p className="mt-1 max-w-xl text-sm text-paper-dim">
            An original tactical-FPS aim challenge — flick, precision, reaction and moving targets. Built for this site; not affiliated with Riot Games or Valorant. Needs WebGL and a mouse or trackpad.
          </p>
        </div>
        <PlayAimButton />
      </div>
    </div>
  );
}
