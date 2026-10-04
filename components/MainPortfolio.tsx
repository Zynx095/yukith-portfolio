"use client";

import Hero from "@/components/Hero";
import AboutScene from "@/components/AboutScene";
import WorkScene from "@/components/WorkScene";
import ExperienceNode from "@/components/ExperienceNode";
import MilestoneGrid from "@/components/MilestoneGrid";
import ContactScene from "@/components/ContactScene";
import TreeNavigation from "@/components/TreeNavigation";

/** The written portfolio that the World Tree journey leads into. */
export default function MainPortfolio() {
  return (
    <div className="relative z-10">
      <TreeNavigation />
      <main className="bg-[#F4F1EA] text-[#0D0A08]">
        <Hero />
        <AboutScene />
        <WorkScene />
        <ExperienceNode />
        <MilestoneGrid />
        <ContactScene />
      </main>
      <footer className="border-t border-[#15100C] bg-[#0D0A08] py-8 text-center font-mono text-sm text-[#8E826C]">
        © {new Date().getFullYear()} Yukith M Joseph. All rights reserved.
        <div className="mt-4 text-xs text-[#8E826C]/60">
          Experience inspired by the interactive portfolio work of{" "}
          <a href="https://www.sebastien-lempens.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#B99755]">
            Sébastien Lempens
          </a>
          .
        </div>
      </footer>
    </div>
  );
}
