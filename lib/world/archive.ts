import { PROJECTS, type Project } from "@/src/data/projects";
import { achievementsData } from "@/src/data/achievements";
import { leadershipData } from "@/src/data/leadership";
import { experienceData } from "@/src/data/experience";

/**
 * The archive inside the World Tree: one sigil relic per body of work.
 * The relics are artistic — every word in their panels comes straight from
 * the verified data files in `src/data`.
 */

export type ArtifactId =
  | "aura"
  | "etth"
  | "shadowguard"
  | "qshield"
  | "jiva"
  | "sugarai"
  | "street-hierarchy"
  | "trc"
  | "achievements"
  | "leadership"
  | "experience";

export interface ArtifactInfo {
  id: ArtifactId;
  title: string;
  /** One-line factual descriptor. */
  subtitle: string;
  /** Small caps category label. */
  kind: string;
  /** Accent colour for the relic's enamel/glow and its UI. */
  accent: string;
  project?: Project;
}

const project = (id: string) => {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) throw new Error(`Missing project data for ${id}`);
  return p;
};

const fromProject = (id: ArtifactId): ArtifactInfo => {
  const p = project(id);
  return { id, title: p.title, subtitle: p.role, kind: `Project · ${p.year}`, accent: p.accent, project: p };
};

export const ARTIFACTS: Record<ArtifactId, ArtifactInfo> = {
  aura: fromProject("aura"),
  etth: fromProject("etth"),
  shadowguard: fromProject("shadowguard"),
  qshield: fromProject("qshield"),
  jiva: fromProject("jiva"),
  sugarai: { ...fromProject("sugarai"), accent: "#f3c27a" },
  "street-hierarchy": { ...fromProject("street-hierarchy"), kind: "Roblox game · 2026" },
  trc: { ...fromProject("trc"), kind: "Client website · 2026" },
  achievements: {
    id: "achievements",
    title: "Achievements",
    subtitle: `${achievementsData.length} hackathon milestones`,
    kind: "Recognition",
    accent: "#e9c46a",
  },
  leadership: {
    id: "leadership",
    title: "Leadership",
    subtitle: `${leadershipData[0].role} — ${leadershipData[0].eventOrClub}`,
    kind: "Community",
    accent: "#f0b27a",
  },
  experience: {
    id: "experience",
    title: "Experience",
    subtitle: experienceData.map((e) => e.company.split(" ×")[0]).join(" · "),
    kind: "Professional record",
    accent: "#d9c7a3",
  },
};

/** Order of discovery while ascending the tree. */
export const ARCHIVE_ORDER: ArtifactId[] = [
  "aura",
  "etth",
  "shadowguard",
  "qshield",
  "jiva",
  "sugarai",
  "street-hierarchy",
  "trc",
  "achievements",
  "leadership",
  "experience",
];
