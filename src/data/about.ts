/**
 * The person behind the engineering — owner-provided, non-sensitive details only.
 * Deliberately excluded: date of birth, school marks, relationship details and
 * the names of family members (see docs/CONTENT_VERIFICATION.md §8).
 */

export interface Interest {
  /** Small prop at the home camp that stands for it. */
  prop: "controller" | "books" | "notebook" | "headphones" | "lantern";
  label: string;
  note: string;
}

export const interests: Interest[] = [
  { prop: "controller", label: "Games", note: "Elden Ring and Valorant. Games are how I first got into computers." },
  { prop: "books", label: "Anime, manga & manhwa", note: "Bleach, Tomodachi Game, Jujutsu Kaisen — and Lookism, which inspired my Roblox game." },
  { prop: "notebook", label: "Writing", note: "Reading, writing stories and storytelling in general." },
  { prop: "headphones", label: "Music & shows", note: "R&B, and the series Dark." },
];

export const home = {
  city: "Bengaluru",
  dog: { name: "Bella", breed: "Shih Tzu" },
  languages: ["English", "Telugu", "Hindi", "Kannada", "French"],
  /** First real machine (owner-provided). */
  firstMachine: "A PC built from scrap parts",
};
