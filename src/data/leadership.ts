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
    // Both resumes date this role 2026 (the earlier site data said "2024 – present").
    period: "2026",
    details: ["10 concurrent technical events", "≈ 280 participants across 60–70 teams", "World Record recognition"],
  },
  // The resume gives no date for this role (it first appears on the October 2026 resume), so none is shown.
  { role: "Student Coordinator", organisation: "30-hour AWS Innovation Challenge, Presidency University", period: "" },
  // Owner-provided (not on the current resume): role, start date and the one responsibility below.
  { role: "Social Media Head", organisation: "InTech Club", period: "Jun 2026 – present", details: ["Publishing the club's content and its reach on LinkedIn and Instagram"] },
  { role: "Event Head", organisation: "Build Club", period: "2024 – present" },
  { role: "Core Coordinator", organisation: "One-O-One Club", period: "2024 – present" },
  { role: "Event Head", organisation: "Informatica Club", period: "2024 – present" },
];
