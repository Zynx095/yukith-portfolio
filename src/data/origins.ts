/**
 * The Valley of Origins — family, first steps and the small memories behind
 * them. Owner-provided (the owner's own notes kept in this repository's
 * history, src/data/personal.ts before the rebuild) and deliberately private:
 * no names, no relationships, no birth date, no school marks
 * (docs/CONTENT_VERIFICATION.md §8 and §14).
 *
 * The family scene shows the kind of afternoon the owner described — someone at
 * the grill, people talking, someone resting by the fire, someone playing with
 * Bella — without saying who anyone is.
 */

export interface FamilyMoment {
  id: string;
  /** What is happening — never who. */
  title: string;
  line: string;
  /** Pose of the figure in the scene. */
  activity: "grill" | "talk-a" | "talk-b" | "rest" | "play";
}

export const FAMILY_MOMENTS: FamilyMoment[] = [
  { id: "family-grill", activity: "grill", title: "At the grill", line: "Family afternoons by the lake usually end with someone at the grill." },
  { id: "family-talk", activity: "talk-a", title: "Talking it over", line: "Long conversations by the water, the kind that run until it gets dark." },
  { id: "family-talk-b", activity: "talk-b", title: "Talking it over", line: "Long conversations by the water, the kind that run until it gets dark." },
  { id: "family-rest", activity: "rest", title: "By the fire", line: "Someone always claims the chair closest to the fire." },
  { id: "family-play", activity: "play", title: "Playing with Bella", line: "Bella decides when playtime starts, and she never decides it is over." },
];

export interface Memory {
  id: string;
  /** The object in the world that holds it. */
  object: "photo" | "pc" | "notebook" | "controller" | "medal";
  title: string;
  text: string;
}

/** Small memories, each held by an object at the home camp. */
export const MEMORIES: Memory[] = [
  { id: "memory-birthday", object: "photo", title: "A core memory", text: "The day the whole family came to my birthday party." },
  { id: "memory-pc", object: "pc", title: "The first machine", text: "A PC I built from scrap parts. Elden Ring and CS:GO were the first games on it; Python was the first language." },
  { id: "memory-games", object: "controller", title: "Where it started", text: "As a kid I dreamt of growing up and playing all the games I watched on YouTube or at a friend's home." },
  { id: "memory-turning-point", object: "notebook", title: "The turning point", text: "Getting into a hackathon on the strength of a pitch — and building a real-time project for the first time." },
  { id: "memory-lock-in", object: "medal", title: "Locking in", text: "There was a period when I felt a little lost, always trying to catch up. Then I realised I just had to lock in and follow my own path." },
];

export interface School {
  name: string;
  years: string;
  memory: string;
}

/** First steps — schools and the people who shaped them (owner-provided). */
export const SCHOOLS: School[] = [
  { name: "NCFE", years: "5 years", memory: "Finding my footing and learning what mattered to me." },
  { name: "Orchids The International School", years: "7 years", memory: "Friends who soon became close like family." },
];

export const FIRST_STEPS = {
  influence: "A school counsellor in eighth grade helped shape how I see things.",
  firstLanguage: "Python",
  firstGames: ["Elden Ring", "CS:GO"],
};

export const FAMILY_SUMMARY = "Home is Bengaluru — family, and Bella the Shih Tzu, who runs the place.";

export const memoryById = (id: string) => MEMORIES.find((m) => m.id === id);
export const familyById = (id: string) => FAMILY_MOMENTS.find((m) => m.id === id);
