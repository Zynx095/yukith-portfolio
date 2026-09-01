"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll';
import Hero from '@/components/Hero';
import AboutScene from '@/components/AboutScene';
import WorkScene from '@/components/WorkScene';
import ExperienceNode from '@/components/ExperienceNode';
import MilestoneGrid from '@/components/MilestoneGrid';
import ContactScene from '@/components/ContactScene';
import TreeNavigation from '@/components/TreeNavigation';

// Dynamically import PortfolioWorld to avoid SSR hydration issues with @react-three/drei's Html component in React 19
const PortfolioWorld = dynamic(() => import('@/components/world/PortfolioWorld').then(mod => mod.PortfolioWorld), {
  ssr: false,
});

export default function Home() {
  const [phase, setPhase] = useState<'world' | 'portfolio'>('world');

  const MainPortfolio = () => (
    <SmoothScrollProvider>
      <TreeNavigation />
      <main className="bg-[#F4F1EA] text-[#0D0A08]">
        <Hero />
        <AboutScene />
        <WorkScene />
        <ExperienceNode />
        <MilestoneGrid />
        <ContactScene />
      </main>
      <footer className="py-8 text-center text-[#8E826C] text-sm font-mono border-t border-[#15100C]">
        © {new Date().getFullYear()} Yukith M Joseph. All rights reserved.
        <div className="mt-4 text-xs text-[#8E826C]/60">
          Experience inspired by the interactive portfolio work of{' '}
          <a
            href="https://www.sebastien-lempens.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#B99755] transition-colors"
          >
            Sébastien Lempens
          </a>
          .
        </div>
      </footer>
    </SmoothScrollProvider>
  );

  return (
    <main className="w-full h-screen overflow-hidden bg-[#0D0A08] m-0 p-0 fixed inset-0">
      <AnimatePresence mode="wait">
        {phase === 'world' && (
          <motion.div 
            key="world" 
            className="w-full h-full"
            exit={{ opacity: 0 }} 
            transition={{ duration: 2 }} // Slow cinematic fade out
          >
            <PortfolioWorld onComplete={() => setPhase('portfolio')} />
          </motion.div>
        )}
        
        {phase === 'portfolio' && (
          <motion.div 
            key="portfolio" 
            className="w-full h-full overflow-y-auto"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 2, delay: 0.5 }}
          >
            <MainPortfolio />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
