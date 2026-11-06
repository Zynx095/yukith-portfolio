/**
 * Competitive gaming. Every claim here was supplied by the owner in the brief of
 * 2026-11-06 and is shown as such (docs/CONTENT_VERIFICATION.md §12). No match
 * statistics, win rates, agents, team names, prize money or dates are shown
 * because none were supplied — the record is achievement-based on purpose.
 */

export type Evidence = "owner-reported";

export interface RankRecord {
  id: string;
  game: string;
  /** Rank name exactly as the owner gave it. */
  rank: string;
  /** Qualifier shown next to the rank. */
  note: string;
  evidence: Evidence;
  /** Visual identity of the exhibit (original artwork — no publisher marks). */
  emblem: "immortal" | "eagle" | "grandmaster";
  accent: string;
}

export const RANKS: RankRecord[] = [
  { id: "valorant-rank", game: "Valorant", rank: "Immortal 1", note: "Current rank", evidence: "owner-reported", emblem: "immortal", accent: "#e8465a" },
  { id: "csgo-rank", game: "Counter-Strike: Global Offensive", rank: "Legendary Eagle", note: "CS:GO rank (not a CS2 rank)", evidence: "owner-reported", emblem: "eagle", accent: "#c9a85a" },
  { id: "mlbb-rank", game: "Mobile Legends: Bang Bang", rank: "Grandmaster", note: "Rank reached", evidence: "owner-reported", emblem: "grandmaster", accent: "#6f8fe8" },
];

export interface TournamentRecord {
  id: string;
  title: string;
  game: string;
  /** Placement or result exactly as known. */
  result: string;
  level: "School" | "College" | "Open";
  detail: string;
  evidence: Evidence;
}

export const TOURNAMENTS: TournamentRecord[] = [
  {
    id: "amd-valorant",
    title: "AMD Valorant tournament",
    game: "Valorant",
    result: "4th place",
    level: "Open",
    detail: "Finished fourth in a Valorant tournament run by AMD. The year and bracket details are not on record, so they are not shown.",
    evidence: "owner-reported",
  },
  {
    id: "school-valorant",
    title: "School Valorant tournaments",
    game: "Valorant",
    result: "Multiple tournaments played",
    level: "School",
    detail: "Played in multiple school Valorant tournaments. Across school and college competitions, won multiple tournaments — which ones is not on record, so none are named.",
    evidence: "owner-reported",
  },
  {
    id: "college-valorant",
    title: "College Valorant tournaments",
    game: "Valorant",
    result: "Tournaments played",
    level: "College",
    detail: "Played in college Valorant tournaments. Across school and college competitions, won multiple tournaments — which ones is not on record, so none are named.",
    evidence: "owner-reported",
  },
];

/** What the arena says about competitive play, in one line. */
export const GAMING_SUMMARY =
  "Competitive FPS and MOBA player: Immortal 1 in Valorant, Legendary Eagle in CS:GO, Grandmaster in Mobile Legends; multiple tournament wins across school and college, and fourth place at an AMD Valorant tournament.";
