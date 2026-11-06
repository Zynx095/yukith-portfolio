"use client";

import WorldCanvas from "./WorldCanvas";
import { JourneyOverlay } from "./ui/JourneyOverlay";
import { Sound } from "./ui/Sound";

/** The lazily loaded part of the Immersive presentation. */
export default function ExperienceRuntime() {
  return (
    <>
      <WorldCanvas />
      <JourneyOverlay />
      <Sound />
    </>
  );
}
