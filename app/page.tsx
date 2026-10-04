"use client";

import dynamic from "next/dynamic";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { LoadingVeil } from "@/components/ui/LoadingVeil";
import MainPortfolio from "@/components/MainPortfolio";
import { JOURNEY_VH } from "@/lib/world/constants";

// The 3D world is client-only and loads in its own chunk behind the veil.
const PortfolioWorld = dynamic(() => import("@/components/world/PortfolioWorld"), {
  ssr: false,
  loading: () => <LoadingVeil visible />,
});

/**
 * One continuous page: scrolling first carries the visitor through the World
 * Tree journey (a fixed canvas driven by this spacer's scroll range), and the
 * portfolio follows directly beneath it — scroll back up to return to the tree.
 */
export default function Home() {
  return (
    <SmoothScrollProvider>
      <PortfolioWorld />
      <div id="journey" style={{ height: `${JOURNEY_VH * 100}vh` }} aria-hidden="true" />
      <MainPortfolio />
    </SmoothScrollProvider>
  );
}
