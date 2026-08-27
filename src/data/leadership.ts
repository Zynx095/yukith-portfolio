export interface LeadershipRole {
  eventOrClub: string;
  role: string;
  period: string;
  organization?: string;
  verifiedDetails?: string[];
}

export const leadershipData: LeadershipRole[] = [
  {
    eventOrClub: "InTech Club",
    role: "Social Media Head",
    period: "June 2026 – Present"
  },
  {
    eventOrClub: "InnovateX Tech Fest",
    role: "Organiser",
    organization: "Presidency University",
    period: "2024–Present",
    verifiedDetails: [
      "10 simultaneous technical events",
      "approximately 280 participants",
      "60–70 teams",
      "₹10,000 prize distribution",
      "record-keeping",
      "World Record recognition"
    ]
  },
  {
    eventOrClub: "Build Club",
    role: "Event Head",
    period: "2024–Present"
  },
  {
    eventOrClub: "One-O-One Club",
    role: "Core Coordinator",
    period: "2024–Present"
  },
  {
    eventOrClub: "Informatica Club",
    role: "Event Head",
    period: "2024–Present"
  }
];
