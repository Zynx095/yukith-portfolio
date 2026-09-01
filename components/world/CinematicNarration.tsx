"use client";

import { useState } from "react";
import { useScroll, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";

interface StorySegment {
  start: number;
  end: number;
  subtitle: string;
  text: string;
}

const STORY_SEGMENTS: StorySegment[] = [
  {
    start: 0.0,
    end: 0.08,
    subtitle: "WELCOME",
    text: "My name is Yukith M Joseph."
  },
  {
    start: 0.08,
    end: 0.18,
    subtitle: "MY WORLD",
    text: "I'm 19, studying Computer Science at Presidency University in Bangalore."
  },
  {
    start: 0.18,
    end: 0.32,
    subtitle: "MY FAMILY",
    text: "My mom, my dad, my grandma, my aunt, her son — my brother — and my lovely Shih Tzu, Bella. And my girlfriend."
  },
  {
    start: 0.32,
    end: 0.42,
    subtitle: "THEIR SUPPORT",
    text: "They support me so much. They are my foundation, my strength, and the reason I keep going."
  },
  {
    start: 0.42,
    end: 0.55,
    subtitle: "COLLEGE LIFE",
    text: "At Presidency University, I found my passion for cybersecurity and AI. The journey has been challenging but incredibly rewarding."
  },
  {
    start: 0.55,
    end: 0.68,
    subtitle: "ACHIEVEMENTS",
    text: "From hackathons to internships at NVIDIA and Elevance, every milestone shaped who I am today."
  },
  {
    start: 0.68,
    end: 0.78,
    subtitle: "THE TRANSITION",
    text: "Somewhere along the way, curiosity became projects... and those projects became a world of their own."
  },
  {
    start: 0.78,
    end: 0.99,
    subtitle: "THE ARCHIVE",
    text: "Welcome inside the World Tree — the living archive of everything I have built."
  }
];

export function CinematicNarration() {
  const scroll = useScroll();
  const [currentSegment, setCurrentSegment] = useState<StorySegment | null>(null);

  useFrame(() => {
    if (!scroll) return;
    const offset = scroll.offset;
    
    const active = STORY_SEGMENTS.find(s => offset >= s.start && offset < s.end);
    if (active?.subtitle !== currentSegment?.subtitle) {
      setCurrentSegment(active || null);
    }
  });

  if (!currentSegment) return null;

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div className="fixed inset-0 pointer-events-none z-40 flex items-end justify-center pb-24 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSegment.subtitle}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="max-w-[85vw] md:max-w-[75vw] lg:max-w-[65vw] text-center"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-mono text-xs md:text-sm tracking-[0.4em] uppercase text-[#C8D4C8] mb-4 font-semibold"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}
          >
            {currentSegment.subtitle}
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-serif text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white leading-tight font-light"
            style={{ textShadow: "0 4px 12px rgba(0,0,0,0.95)" }}
          >
            {currentSegment.text}
          </motion.h2>
        </motion.div>
      </AnimatePresence>
      </div>
    </Html>
  );
}
