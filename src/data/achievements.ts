/** Achievements and recognition — from the current resume unless noted. */

export interface Achievement {
  title: string;
  result: string;
  organiser?: string;
  /** Year it happened; empty when no source dates it. */
  year: string;
  /** "placement" results are shown more prominently than participation. */
  tier: "placement" | "participation" | "certification";
}

export const achievements: Achievement[] = [
  { title: "Smart India Hackathon", result: "Top 30 Finalist · national level", organiser: "Government of India", year: "2025", tier: "placement" },
  { title: "Nirmith National Hackathon", result: "National Finalist", organiser: "NITTE Meenakshi Institute of Technology", year: "2026", tier: "placement" },
  { title: "InnovateX 4.0 Hardware Hackathon", result: "Runner-Up", organiser: "Presidency University", year: "2026", tier: "placement" },
  { title: "InnovateX 4.0 Hardware Expo", result: "Runner-Up", organiser: "Presidency University", year: "2026", tier: "placement" },
  // Resume: "Prompt Wars, Presidency University — Top 15 of 180 teams". FairShift was a separate,
  // later solo submission to the ACM SRM Student Chapter's PromptWars event (see projects.ts).
  // The resume gives no year; it first appears on the October 2026 resume, so no year is shown.
  { title: "Prompt Wars", result: "Top 15 of 180 teams", organiser: "Presidency University", year: "", tier: "placement" },
  { title: "Fetch-A-Thon 3.0", result: "Built WARDEN", organiser: "GDG · Fetch.ai", year: "2026", tier: "participation" },
  { title: "Qiskit Fall Fest", result: "Built WATERWEAVE", organiser: "IIIT Kottayam", year: "2026", tier: "participation" },
  { title: "Odoo × NMIT Hackathon", result: "Participant", year: "2026", tier: "participation" },
  // The resume's "2026" belongs to the Odoo × NMIT entry; this one is undated. The resume spells it "ISAKA".
  { title: "ISACA Cybersecurity × AI Hackathon", result: "Participant", year: "", tier: "participation" },
  { title: "Microsoft Azure AI Fundamentals", result: "AI-900 certification", organiser: "Microsoft", year: "", tier: "certification" },
];
