import { achievements } from "@/src/data/achievements";
import { experience } from "@/src/data/experience";
import { leadership } from "@/src/data/leadership";
import { education } from "@/src/data/profile";
import { FEATURED, PROJECTS } from "@/src/data/projects";

/**
 * The growth rings: one stage per year, assembled only from the verified data
 * files (src/data). Anything without a year in its source (the AI-900
 * certification, Prompt Wars, ISAKA, the AWS coordinator role) is not placed on
 * a ring. Kept free of three.js so the HTML overlay can use it.
 */

export type RingKind = "Milestone" | "Role" | "Result" | "Experience" | "Built" | "Entered" | "Continuing";

export interface RingGroup {
  kind: RingKind;
  items: { title: string; detail?: string }[];
}

export interface RingStage {
  year: string;
  /** The stage's name — what kind of year it was. */
  stage: string;
  /** One factual line. */
  summary: string;
  /** Light colour of the ring (scene) and its accent (overlay). */
  color: string;
  groups: RingGroup[];
  /** Glowing nodes carved into the ring: one per new item that year. */
  nodes: number;
  /** Roles begun that year that are still running (threads climbing the hollow). */
  continuing: number;
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const words = (n: number) => WORDS[n] ?? String(n);
const startYear = (period: string) => period.match(/20\d\d/)?.[0] ?? "";
const ongoing = (period: string) => /present|expected/i.test(period);

const ORDER: RingKind[] = ["Milestone", "Built", "Experience", "Result", "Role", "Entered", "Continuing"];

function stageFor(year: string) {
  const groups: RingGroup[] = [];
  const add = (kind: RingKind, title: string, detail?: string) => {
    let g = groups.find((x) => x.kind === kind);
    if (!g) groups.push((g = { kind, items: [] }));
    g.items.push({ title, detail });
  };
  if (startYear(education.period) === year) add("Milestone", "Started the B.Tech in CSE (Networks)", education.institution);
  for (const e of experience) if (startYear(e.period) === year) add("Experience", e.role, e.organisation);
  for (const a of achievements) if (a.year === year && a.tier === "placement") add("Result", a.result, a.title);
  for (const r of leadership) if (r.period && startYear(r.period) === year) add("Role", r.role, r.organisation);
  const built = PROJECTS.filter((p) => !p.collaboration && startYear(p.period) === year);
  if (built.length) {
    const featured = built.filter((p) => p.featured).map((p) => p.title);
    const rest = built.length - featured.length;
    add("Built", `${built.length} projects with source`, featured.join(" · ") + (rest > 0 ? ` and ${rest} more` : ""));
  }
  // (Competitions merely entered are listed in the written portfolio, not on the rings.)
  groups.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  const newItems = groups.reduce((n, g) => n + (g.kind === "Built" ? built.length : g.items.length), 0);
  return { groups, nodes: newItems };
}

const y2024 = stageFor("2024");
const y2025 = stageFor("2025");
const y2026 = stageFor("2026");
const continuing2024 = leadership.filter((r) => startYear(r.period) === "2024" && ongoing(r.period));
const placements2026 = achievements.filter((a) => a.year === "2026" && a.tier === "placement").length;

// 2025 also carries the roles begun in 2024 — shown as threads passing through it.
y2025.groups.push({ kind: "Continuing", items: continuing2024.map((r) => ({ title: r.role, detail: r.organisation })) });

export const RING_STAGES: RingStage[] = [
  {
    year: "2024",
    stage: "Roots",
    summary: `Started the degree and took on ${words(continuing2024.length)} club roles in the first year.`,
    color: "#e3a24a",
    ...y2024,
    continuing: continuing2024.length + 1, // the degree runs on to 2028 too
  },
  {
    year: "2025",
    stage: "Reach",
    summary: "A national final — Top 30 at Smart India Hackathon 2025 — while the club roles carried on.",
    color: "#f0c869",
    ...y2025,
    continuing: 0,
  },
  {
    year: "2026",
    stage: "Branching",
    summary: `${PROJECTS.filter((p) => !p.collaboration && startYear(p.period) === "2026").length} projects, an internship, the Presidency × NVIDIA capstone and ${words(placements2026)} finals and placings.`,
    color: "#7ee0cf",
    ...y2026,
    continuing: 0,
  },
];

/** The featured projects named on the 2026 ring (also the relics in the archive). */
export const FEATURED_TITLES = FEATURED.map((p) => p.title);
