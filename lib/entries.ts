import { DOMAIN_LABEL, projectById } from "@/src/data/projects";
import { DOMAIN_NAME, EVIDENCE_LABEL, eventById } from "@/src/data/events";
import { RANKS, TOURNAMENTS } from "@/src/data/gaming";
import { familyById, memoryById } from "@/src/data/origins";
import { volumeById } from "@/src/data/library";

/**
 * One way to describe anything the visitor can focus or open in the world:
 * a project relic, an event exhibit, a gaming achievement, a family moment, a
 * memory or a library volume. Labels and the record dialog read from here, and
 * every word comes from src/data.
 */

export type EntryKind = "project" | "event" | "rank" | "tournament" | "family" | "memory" | "volume" | "aim";

export interface Entry {
  id: string;
  kind: EntryKind;
  kicker: string;
  title: string;
  subtitle?: string;
  line?: string;
  status?: string;
  /** Text of the label's button. */
  action: string;
}

export function entryById(id: string): Entry | undefined {
  const p = projectById(id);
  if (p) return { id, kind: "project", kicker: `${DOMAIN_LABEL[p.domain]} · ${p.period}`, title: p.title, subtitle: p.kind, line: p.tagline, status: p.status, action: "Open the record" };
  const e = eventById(id);
  if (e)
    return {
      id,
      kind: "event",
      kicker: [DOMAIN_NAME[e.domain], e.year].filter(Boolean).join(" · "),
      title: e.name,
      subtitle: [e.organiser, e.host].filter(Boolean).join(" · ") || undefined,
      line: e.result ?? e.role,
      status: EVIDENCE_LABEL[e.evidence],
      action: "Open the record",
    };
  const r = RANKS.find((x) => x.id === id);
  if (r) return { id, kind: "rank", kicker: r.game, title: r.rank, subtitle: r.note, status: "As reported by Yukith", action: "More" };
  const t = TOURNAMENTS.find((x) => x.id === id);
  if (t) return { id, kind: "tournament", kicker: `${t.level} · ${t.game}`, title: t.title, line: t.result, status: "As reported by Yukith", action: "More" };
  const f = familyById(id);
  if (f) return { id, kind: "family", kicker: "Home", title: f.title, line: f.line, action: "More" };
  const m = memoryById(id);
  if (m) return { id, kind: "memory", kicker: "A memory", title: m.title, line: m.text, action: "More" };
  const v = volumeById(id);
  if (v) return { id, kind: "volume", kicker: `Library · ${v.shelf}`, title: v.title, line: v.note, action: "More" };
  if (id === "aim") return { id, kind: "aim", kicker: "Portfolio mini-game", title: "Aim trainer", line: "Flick, precision, reaction and moving targets. Not affiliated with Riot Games or Valorant.", action: "Play" };
  return undefined;
}
