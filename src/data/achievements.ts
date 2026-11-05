/** Achievements and recognition — from the current resume unless noted. */

export interface Achievement {
  title: string;
  result: string;
  organiser?: string;
  year: string;
  /** "placement" results are shown more prominently than participation. */
  tier: "placement" | "participation" | "certification";
}

export const achievements: Achievement[] = [
  { title: "Smart India Hackathon", result: "Top 30 Finalist · national level", organiser: "Government of India", year: "2025", tier: "placement" },
  { title: "Nirmith National Hackathon", result: "National Finalist", organiser: "NITTE Meenakshi Institute of Technology", year: "2026", tier: "placement" },
  { title: "InnovateX 4.0 Hardware Hackathon", result: "Runner-Up", organiser: "Presidency University", year: "2026", tier: "placement" },
  { title: "InnovateX 4.0 Hardware Expo", result: "Runner-Up", organiser: "Presidency University", year: "2026", tier: "placement" },
  { title: "PromptWars", result: "Top 15 of 180 teams", year: "2026", tier: "placement" },
  { title: "Fetch-A-Thon 3.0", result: "Built WARDEN", organiser: "Fetch.ai", year: "2026", tier: "participation" },
  { title: "Qiskit Fall Fest", result: "Built WATERWEAVE", organiser: "IIIT Kottayam", year: "2026", tier: "participation" },
  { title: "Odoo × NMIT Hackathon", result: "Participant", year: "2026", tier: "participation" },
  { title: "ISAKA Hackathon", result: "Participant", year: "2026", tier: "participation" },
  { title: "Microsoft Azure AI Fundamentals", result: "AI-900 certification", organiser: "Microsoft", year: "", tier: "certification" },
];
