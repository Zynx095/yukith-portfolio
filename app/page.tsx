"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ExperienceLoader from '@/components/experience/ExperienceLoader';
import IntroExperience from '@/components/IntroExperience';

// Main Portfolio Components
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll';
import Hero from '@/components/Hero';
import AboutScene from '@/components/AboutScene';
import WorkScene from '@/components/WorkScene';
import ExperienceNode from '@/components/ExperienceNode';
import MilestoneGrid from '@/components/MilestoneGrid';
import ContactScene from '@/components/ContactScene';
import TreeNavigation from '@/components/TreeNavigation';

export default function Home() {
  const [phase, setPhase] = useState<'loading' | 'intro' | 'portfolio'>('loading');

  const MainPortfolio = () => (
    <SmoothScrollProvider>
      <TreeNavigation />
      <main className="bg-[#0D0A08] text-[#F4F1EA]">
        <Hero />
        <AboutScene />
        <WorkScene />
        <ExperienceNode />
        <MilestoneGrid />
        <ContactScene />
      </main>
      <footer className="py-8 text-center text-[#8E826C] text-sm font-mono border-t border-[#15100C]">
        © {new Date().getFullYear()} Yukith M Joseph. All rights reserved.
      </footer>
    </SmoothScrollProvider>
  );

  return (
    <AnimatePresence mode="wait">
      {phase === 'loading' && (
        <motion.div key="loading" exit={{ opacity: 0 }} transition={{ duration: 1 }}>
          <ExperienceLoader onComplete={() => setPhase('intro')} />
        </motion.div>
      )}
      
      {phase === 'intro' && (
        <motion.div key="intro" exit={{ opacity: 0 }} transition={{ duration: 1 }}>
          <IntroExperience onComplete={() => setPhase('portfolio')} />
        </motion.div>
      )}

      {phase === 'portfolio' && (
        <motion.div 
          key="portfolio" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1.5 }}
        >
          <MainPortfolio />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
