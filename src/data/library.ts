/**
 * The library — stories and media the owner has named himself (src/data/about.ts
 * and the owner's earlier notes). Only these titles are shown; no favourites are
 * inferred. Covers in the world are original abstract designs: no cover art,
 * panels or characters are reproduced (docs/CONTENT_VERIFICATION.md §15).
 */

export type Shelf = "Manhwa" | "Manga" | "Anime" | "Series" | "Games" | "Writing" | "Music";

export interface Volume {
  id: string;
  title: string;
  shelf: Shelf;
  note: string;
  /** Spine / cover colour of the original design. */
  color: string;
}

export const VOLUMES: Volume[] = [
  { id: "lib-lookism", title: "Lookism", shelf: "Manhwa", color: "#3c5a8a", note: "A favourite — Shingen Yamazaki is my favourite character. It also inspired STREET HIERARCHY, my Roblox game." },
  { id: "lib-jjk", title: "Jujutsu Kaisen", shelf: "Manga", color: "#5b3a6b", note: "On the manga shelf." },
  { id: "lib-bleach", title: "Bleach", shelf: "Anime", color: "#7a3328", note: "On the anime shelf." },
  { id: "lib-tomodachi", title: "Tomodachi Game", shelf: "Anime", color: "#8a6a2e", note: "On the anime shelf." },
  { id: "lib-dark", title: "Dark", shelf: "Series", color: "#2e3b38", note: "Favourite series." },
  { id: "lib-elden", title: "Elden Ring", shelf: "Games", color: "#7d6a3a", note: "One of the first games on the scrap-built PC." },
  { id: "lib-writing", title: "Stories I write", shelf: "Writing", color: "#4e5a3a", note: "Reading, writing novels and storytelling in general." },
  { id: "lib-rnb", title: "R&B", shelf: "Music", color: "#6a3a4e", note: "On repeat while I work." },
];

export const volumeById = (id: string) => VOLUMES.find((v) => v.id === id);

export const LIBRARY_SUMMARY = "Manhwa, manga and anime, a favourite series, the games that started it all — and the stories I write myself.";
