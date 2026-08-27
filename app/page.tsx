"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";

import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { TreeEnvironment } from "@/components/TreeEnvironment";
import { TreeNavigation } from "@/components/TreeNavigation";
import { Hero } from "@/components/Hero";
import { WorkScene } from "@/components/WorkScene";
import { AboutScene } from "@/components/AboutScene";
import { ExperienceNode } from "@/components/ExperienceNode";
import { MilestoneGrid } from "@/components/MilestoneGrid";
import { ContactScene } from "@/components/ContactScene";
import { socialData } from "@/src/data/social";
import { profileData } from "@/src/data/profile";

import { IntroExperience } from "@/components/IntroExperience";

gsap.registerPlugin(ScrollTrigger);

/* --- Main Portfolio Experience --- */
// Extracted to a sub-component so it completely unmounts when the Intro is active.
function MainPortfolio() {
  useEffect(() => {
    // Refresh ScrollTrigger after layout settles
    const t = setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <SmoothScrollProvider>
        {/* 2.5D Tree Environment Layer */}
        <TreeEnvironment />

        {/* Organic Tree Navigation */}
        <TreeNavigation />

        <main style={{ position: "relative", zIndex: 10 }}>
          {/* -- Scene 00: Sapling -- */}
          <Hero />

          {/* -- Scene 01: Roots -- */}
          <AboutScene />

          {/* -- Scene 02: Branches (Projects) -- */}
          <WorkScene />

          {/* -- Scene 03: Trunk (Experience) -- */}
          <ExperienceNode />

          {/* -- Scene 04: Rings (Achievements) -- */}
          <MilestoneGrid />

          {/* -- Scene 05: Canopy (Contact) -- */}
          <ContactScene />
        </main>

        {/* Footer */}
        <footer
          className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-4 py-8 bg-cream-200"
          style={{
            paddingLeft: "clamp(24px, 6vw, 120px)",
            paddingRight: "clamp(24px, 6vw, 120px)",
            borderTop: "1px solid var(--cream-400)",
          }}
        >
          <span className="font-sans text-[10px] tracking-widest uppercase text-wood-500">
            {profileData.name} © 2026
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            {socialData.map((link) => (
              <a
                key={link.platform}
                href={link.platform === "Resume" ? "/resume.pdf" : link.url}
                target={link.platform === "Email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="font-sans text-[10px] tracking-widest uppercase text-wood-500 hover:text-leaf-700 transition-colors"
              >
                {link.platform}
              </a>
            ))}
          </div>
          <span className="font-sans text-[10px] tracking-widest uppercase text-wood-500">
            Handcrafted Engineering
          </span>
        </footer>
      </SmoothScrollProvider>
    </motion.div>
  );
}

/* --- Page Root --- */
export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {!introCompleted ? (
          <motion.div key="intro-experience" exit={{ opacity: 0 }} transition={{ duration: 1.5 }}>
            <IntroExperience onComplete={() => setIntroCompleted(true)} />
          </motion.div>
        ) : (
          <MainPortfolio key="main-portfolio" />
        )}
      </AnimatePresence>
    </>
  );
}
