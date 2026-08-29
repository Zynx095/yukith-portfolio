"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { StoryCanvas } from '@/components/story/StoryCanvas';

interface IntroExperienceProps {
  onComplete: () => void;
}

const ZONES = [
  { start: 0, end: 0.1, text: "Welcome to my world." },
  { start: 0.1, end: 0.2, text: "Every story starts somewhere. Mine started with family." },
  { start: 0.2, end: 0.3, text: "School wasn't always easy. But I locked in and found my people." },
  { start: 0.3, end: 0.4, text: "2023. A custom PC built from scraps. Everything changed." },
  { start: 0.4, end: 0.5, text: "Curiosity became obsession. I had to know what I could build." },
  { start: 0.5, end: 0.6, text: "Presidency University. Networks and Cybersecurity felt right." },
  { start: 0.6, end: 0.7, text: "ETTH. AURA. ShadowGuard. Real problems, real systems." },
  { start: 0.7, end: 0.8, text: "Elevance. NVIDIA. Building alongside brilliant teams." },
  { start: 0.8, end: 0.9, text: "SIH Finalist. InTech Club. Hackathons. Leadership." },
  { start: 0.9, end: 1.0, text: "" }
];

export default function IntroExperience({ onComplete }: IntroExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeZone, setActiveZone] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const indicatorHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);
  const whiteoutOpacity = useTransform(scrollYProgress, [0.95, 1], [0, 1]);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      // Find active zone
      const zoneIndex = ZONES.findIndex(z => latest >= z.start && latest <= z.end);
      if (zoneIndex !== -1 && zoneIndex !== activeZone) {
        setActiveZone(zoneIndex);
      }

      // Check for completion
      if (latest > 0.98 && !isTransitioning) {
        setIsTransitioning(true);
        setTimeout(() => {
          onComplete();
        }, 1500); // Wait for whiteout
      }
    });
  }, [scrollYProgress, activeZone, isTransitioning, onComplete]);

  return (
    <div ref={containerRef} className="relative w-full h-[1400vh] bg-[#0D0A08]">
      {/* Fixed background canvas */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <StoryCanvas scrollProgress={scrollYProgress} />
      </div>

      {/* Fixed Overlay UI */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        
        {/* Progress Bar - Left Edge */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 w-[2px] h-1/3 bg-[#15100C] rounded-full overflow-hidden hidden md:block">
          <motion.div 
            className="w-full bg-[#B99755]"
            style={{ height: indicatorHeight }}
          />
        </div>

        {/* Skip Button - Top Right */}
        <div className="absolute top-8 right-8 pointer-events-auto">
          <button 
            onClick={onComplete}
            className="text-[#8E826C] hover:text-[#F4F1EA] text-sm uppercase tracking-widest font-mono transition-colors"
          >
            QUICK TOUR
          </button>
        </div>

        {/* Subtitles - Top Center */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeZone}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="font-serif text-2xl md:text-4xl text-[#F0E6CF]"
              style={{ textShadow: "0px 2px 10px rgba(0,0,0,0.8)" }}
            >
              {ZONES[activeZone]?.text}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Whiteout Transition at the end */}
        <motion.div 
          className="absolute inset-0 bg-[#F4F1EA] pointer-events-none z-50"
          style={{ opacity: whiteoutOpacity }}
        />
      </div>
    </div>
  );
}
