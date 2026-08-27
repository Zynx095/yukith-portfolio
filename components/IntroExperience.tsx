"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring, useTransform } from 'framer-motion';
import { personalStory } from '@/src/data/personal';
import { AudioSystem } from '@/components/AudioSystem';
import { StoryCanvas } from '@/components/story/StoryCanvas';

type IntroExperienceProps = {
  onComplete: () => void;
};

const ROOM_DIALOGUE = [
  "Hey.",
  "You're probably wondering what this place is.",
  "This is basically the messy version of my story.",
  "Come in. I'll show you around."
];

const CHAPTER_NAMES = [
  'BeforeEngineer', 'FirstSpark', 'School', 'Direction', 'FirstComputer', 
  'Discovery', 'University', 'Engineering', 'Projects', 'Internships', 
  'Hackathons', 'Leadership', 'WhoIAmNow', 'Tree'
];

const STORY_DIALOGUE = [
  "Every story starts somewhere. For me, it started with family—the anchor that kept me grounded through an unpredictable childhood.", 
  "I didn't start with a roadmap. There was no grand master plan, just a quiet curiosity about how the world worked and a desire to leave a mark on it.",
  "School wasn't always easy. There were rough patches and moments of uncertainty, but I locked in, found my people, and started discovering who I actually was.", 
  "During those years, I found myself constantly searching. I was mostly trying to figure out what I wanted to build, even if I didn't have the tools yet.",
  "Then came 2023. I managed to piece together a custom PC entirely from scraps. That single moment changed the trajectory of everything.", 
  "Suddenly, I wasn't just consuming technology—I was controlling it. I spent countless nights staring at that screen, simply wanting to know what I could build with it.",
  "That obsession led me to Presidency University. The moment I dove into Networks and Cybersecurity, it just felt right. Like I had finally found my language.", 
  "The deeper I went, the more I realized something strange about myself: I actually loved the stress of building complex systems from the ground up.", 
  "That drive turned into ETTH, AURA, and ShadowGuard. I stopped building toys and started trying to solve real, difficult problems.", 
  "Eventually, I took those skills into the professional world at Elevance, learning what it really takes to build full-stack systems alongside a brilliant team.", 
  "The momentum didn't stop. Becoming an SIH Finalist taught me the absolute thrill of designing and shipping a real-time project in just 24 hours.", 
  "But engineering is only half the equation. Leading the InTech Club taught me how to organize, communicate, and bring people together around a shared vision.", 
  "Beyond the code, I'm just someone who is naturally outgoing and kind. When I'm not architecting systems, you'll probably find me geeking out over video games and manhwas.", 
  "Every line of code, every late night, every project is a branch. And this... this is where it all connects." 
];

export function IntroExperience({ onComplete }: IntroExperienceProps) {
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [introPhase, setIntroPhase] = useState(0);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showAudioOverlay, setShowAudioOverlay] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 15, mass: 0.5 });
  
  const [activeStoryChapter, setActiveStoryChapter] = useState(0);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    const segment = 1 / 14;
    const currentChapter = Math.min(13, Math.floor(latest / segment));
    if (currentChapter !== activeStoryChapter) {
      setActiveStoryChapter(currentChapter);
    }
  });

  // Whiteout trigger for handoff
  const treeWhiteout = useTransform(smoothProgress, [0.95, 1], [0, 1]);
  const progressY = useTransform(smoothProgress, [0, 1], ["-10vh", "10vh"]);

  useEffect(() => {
    if (!isStoryMode && !isTransitioning) {
      const sequence = async () => {
        setIntroPhase(1); 
        await new Promise(r => setTimeout(r, 1000));
        setIntroPhase(2); 
        await new Promise(r => setTimeout(r, 1000));
        setIntroPhase(3); 
      };
      sequence();
    }
  }, [isStoryMode, isTransitioning]);

  useEffect(() => {
    if (!isStoryMode && introPhase >= 3 && dialogueIndex < ROOM_DIALOGUE.length - 1) {
      const timer = setTimeout(() => setDialogueIndex(prev => prev + 1), 1500); // SPED UP from 4000
      return () => clearTimeout(timer);
    } else if (dialogueIndex === ROOM_DIALOGUE.length - 1 && introPhase < 4) {
      setTimeout(() => setIntroPhase(4), 500);
    }
  }, [isStoryMode, introPhase, dialogueIndex]);

  const handleQuickTour = () => {
    setIsTransitioning(true);
    setTimeout(() => onComplete(), 2000);
  };

  const handleDiveDeeper = () => {
    setShowAudioOverlay(true);
  };

  const onAudioDecision = () => {
    setShowAudioOverlay(false);
    setIsStoryMode(true);
    window.scrollTo(0, 0); 
  };

  const skipToPortfolio = () => {
    window.scrollTo(0, 0);
    setIsTransitioning(true);
    setTimeout(() => onComplete(), 2000); 
  };

  if (isStoryMode) {
    return (
      <div className="relative z-50 min-h-screen bg-black">
        <AudioSystem chapter={CHAPTER_NAMES[activeStoryChapter]} showOverlay={showAudioOverlay} onDecision={onAudioDecision} />

        {/* 1400vh enables extremely fine control over the 3D camera */}
        {!isTransitioning && <div style={{ height: '1400vh' }} />}

        {/* The 3D Scene Layer */}
        <div className="fixed inset-0 z-0">
           <StoryCanvas scrollYProgress={smoothProgress} />
        </div>

        {/* HUD / Narrative Overlay (2D) */}
        <div className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none ${isTransitioning ? 'z-[100]' : 'z-40'}`}>
          
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:pb-24 z-50">
            {/* Cinematic Subtitles - Pure Narration Fade */}
            <AnimatePresence mode="wait">
              {!isTransitioning && (
                <motion.div
                  key={`text-${activeStoryChapter}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute top-[20%] max-w-3xl text-center px-8"
                >
                  <h3 className="text-[12px] font-sans tracking-[0.4em] text-[#B99755] uppercase mb-8 opacity-50">
                    {CHAPTER_NAMES[activeStoryChapter]}
                  </h3>
                  <p className="text-2xl md:text-4xl font-serif text-[#F0E6CF] leading-relaxed drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
                    {STORY_DIALOGUE[activeStoryChapter]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar removed for 3D Holographic replacement */}
          </div>

          {/* The Whiteout Handoff (Final transition to Main Portfolio) */}
          <motion.div 
            className="absolute inset-0 bg-[#F4F1EA] pointer-events-none"
            style={{ opacity: isTransitioning ? 1 : treeWhiteout }}
            transition={{ duration: 1.5 }}
          />

          {!isTransitioning && !showAudioOverlay && (
            <div className="absolute top-8 right-8 z-50 pointer-events-auto">
               <button onClick={skipToPortfolio} className="px-6 py-3 bg-[#0D0A08]/80 backdrop-blur-md text-[#B99755] font-serif text-sm rounded-full border border-[#B99755]/30 hover:bg-[#1E150F] hover:shadow-[0_0_20px_rgba(185,151,85,0.4)] transition-all">
                 Skip to Portfolio
               </button>
            </div>
          )}

          {!isTransitioning && !showAudioOverlay && (
            <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none opacity-50">
               <motion.div className="w-px bg-[#B99755]/30" style={{ height: '20vh' }} />
               <motion.div 
                 className="w-2 h-2 rounded-full bg-[#B99755] shadow-[0_0_10px_#B99755]" 
                 style={{ y: progressY }} 
               />
               <motion.div className="w-px bg-[#B99755]/30" style={{ height: '20vh' }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // The Mystical Study (Unchanged)
  return (
    <motion.div 
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-colors duration-1000 bg-[#0D0A08]`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioning ? 0 : 1 }}
      transition={{ duration: 1.5 }}
    >
      <AudioSystem chapter="Intro" showOverlay={showAudioOverlay} onDecision={onAudioDecision} />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(21,16,12,0.8)_0%,rgba(13,10,8,1)_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: introPhase >= 1 ? 1 : 0, y: 0 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 w-full h-full pointer-events-none flex justify-between px-[10vw]"
      >
        <div className="w-[15vw] h-full bg-[#15100C] border-r border-[#3A2417] shadow-[20px_0_50px_rgba(0,0,0,0.8)]" />
        <div className="w-[15vw] h-full bg-[#15100C] border-l border-[#3A2417] shadow-[-20px_0_50px_rgba(0,0,0,0.8)]" />
      </motion.div>

      <div className="absolute bottom-0 w-full h-[40vh] bg-gradient-to-t from-[#000] to-transparent pointer-events-none" />

      <AnimatePresence>
        {!showAudioOverlay && (
          <motion.div exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 1 }} className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-30">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: introPhase >= 4 ? 1 : 0 }}
               transition={{ duration: 2 }}
               className="absolute inset-0 flex justify-between items-center px-[15vw] pointer-events-auto"
            >
               <motion.button
                 onClick={handleQuickTour}
                 whileHover={{ scale: 1.05 }}
                 className="relative group w-48 h-80 rounded-t-full flex flex-col items-center justify-end pb-8"
               >
                 <div className="absolute bottom-0 w-full h-full rounded-t-full bg-gradient-to-t from-[#0B2116] to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-1000 blur-xl" />
                 <div className="absolute bottom-0 w-24 h-48 bg-[#12351F] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <span className="relative z-10 text-xl font-serif text-[#D8C9A8] group-hover:text-[#F0E6CF] transition-colors drop-shadow-[0_0_10px_rgba(18,53,31,0.8)]">
                   Quick Tour
                 </span>
                 <div className="relative z-10 h-12 w-px bg-gradient-to-t from-transparent to-[#315D39] mt-4 opacity-50 group-hover:opacity-100" />
               </motion.button>

               <motion.button
                 onClick={handleDiveDeeper}
                 whileHover={{ scale: 1.05 }}
                 className="relative group w-48 h-80 flex flex-col items-center justify-center border border-[#3A2417]/0 hover:border-[#B99755]/30 rounded-t-full transition-all duration-700 bg-[#15100C]/0 hover:bg-[#15100C]/80"
               >
                 <div className="absolute inset-0 rounded-t-full shadow-[inset_0_0_50px_rgba(185,151,85,0)] group-hover:shadow-[inset_0_0_50px_rgba(185,151,85,0.2)] transition-shadow duration-1000" />
                 <span className="relative z-10 text-xl font-serif text-[#D8C9A8] group-hover:text-[#E3CB8A] transition-colors drop-shadow-[0_0_10px_rgba(185,151,85,0.8)]">
                   Dive Deeper
                 </span>
                 <div className="relative z-10 w-4 h-4 mt-8 rounded-full border border-[#B99755]/50 flex items-center justify-center opacity-50 group-hover:opacity-100">
                    <div className="w-1 h-1 bg-[#D4B56A] rounded-full" />
                 </div>
               </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="absolute bottom-16 md:bottom-24 z-40 pointer-events-none flex flex-col items-center"
        animate={{ opacity: showAudioOverlay ? 0 : 1 }}
      >
        <AnimatePresence mode="wait">
          {introPhase >= 3 && !showAudioOverlay && (
            <motion.div 
              key={dialogueIndex}
              initial={{ opacity: 0, y: 10, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute -top-24 -right-48 md:-right-64 bg-[#D8C9A8] text-[#15100C] font-serif italic px-6 py-4 rounded-3xl rounded-bl-none shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#B99755]/30 max-w-[250px] z-50 text-sm md:text-base"
            >
              <svg className="absolute -bottom-3 left-0 w-6 h-6 text-[#D8C9A8]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0,0 L24,0 L0,24 Z" />
              </svg>
              {ROOM_DIALOGUE[dialogueIndex]}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Avatar removed for 3D Holographic replacement */}
      </motion.div>
    </motion.div>
  );
}
