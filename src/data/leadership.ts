/** Leadership and community roles — current resume plus the owner's brief. */

export interface Role {
  role: string;
  organisation: string;
  period: string;
  details?: string[];
}

export const leadership: Role[] = [
  {
    role: "Organiser",
    organisation: "InnovateX Tech Fest, Presidency University",
    period: "2024 – present",
    details: ["10 concurrent technical events", "≈ 280 participants across 60–70 teams", "World Record recognition"],
  },
  { role: "Student Coordinator", organisation: "30-hour AWS Innovation Challenge, Presidency University", period: "2026" },
  { role: "Social Media Head", organisation: "InTech Club", period: "Jun 2026 – present", details: ["Content and reach across LinkedIn and Instagram"] },
  { role: "Event Head", organisation: "Build Club", period: "2024 – present" },
  { role: "Core Coordinator", organisation: "One-O-One Club", period: "2024 – present" },
  { role: "Event Head", organisation: "Informatica Club", period: "2024 – present" },
];
