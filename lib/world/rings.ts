import { achievements } from "@/src/data/achievements";
import { experience } from "@/src/data/experience";
import { leadership } from "@/src/data/leadership";
import { education } from "@/src/data/profile";

/**
 * What each growth ring inside the trunk records — assembled only from the
 * verified data files, grouped by the year each item began or happened.
 */

export interface RingEntry {
  kind: "Milestone" | "Result" | "Role" | "Experience";
  title: string;
  detail: string;
}

const startYear = (period: string) => period.match(/20\d\d/)?.[0] ?? "";

export function ringEntries(year: string): RingEntry[] {
  const out: RingEntry[] = [];
  if (startYear(education.period) === year) out.push({ kind: "Milestone", title: "Started B.Tech, CSE (Networks)", detail: education.institution });
  for (const r of leadership) if (startYear(r.period) === year) out.push({ kind: "Role", title: r.role, detail: r.organisation });
  for (const a of achievements) if (a.year === year && a.tier === "placement") out.push({ kind: "Result", title: a.result, detail: a.title });
  for (const e of experience) if (startYear(e.period) === year) out.push({ kind: "Experience", title: e.role, detail: e.organisation });
  return out;
}
