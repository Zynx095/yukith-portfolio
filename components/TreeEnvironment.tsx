"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export function TreeEnvironment() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 15 });

  // Stage 1: Sapling (0 to 0.1)
  // Stage 2: Roots (0.1 to 0.25)
  // Stage 3: Growing Tree / Trunk thickens (0.25 to 0.4)
  // Stage 4: Branching (Projects) (0.4 to 0.7)
  // Stage 5: Mature Canopy (Experience/Contact) (0.7 to 1.0)

  // Trunk height and thickness
  const trunkScaleY = useTransform(smoothProgress, [0, 0.4], [0.15, 1]);
  const trunkWidth = useTransform(smoothProgress, [0.3, 0.8], [40, 100]);
  
  // Roots emergence
  const rootsOpacity = useTransform(smoothProgress, [0.1, 0.2], [0, 1]);
  const rootsScale = useTransform(smoothProgress, [0.1, 0.3], [0.5, 1]);

  // Branches emerging in sequence
  const lowerBranchOpacity = useTransform(smoothProgress, [0.35, 0.5], [0, 1]);
  const upperBranchOpacity = useTransform(smoothProgress, [0.5, 0.65], [0, 1]);

  // Canopy expansion
  const canopyScale = useTransform(smoothProgress, [0.6, 0.9], [0.3, 1.3]);
  const canopyOpacity = useTransform(smoothProgress, [0.6, 0.95], [0, 0.25]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-multiply">
      
      {/* Dynamic Environment Lighting */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-sage-400/5 to-cream-100"
        style={{ opacity: useTransform(smoothProgress, [0, 1], [0.3, 1]) }}
      />

      {/* Base/Ground / Soil line */}
      <motion.div 
        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-wood-900/15 to-transparent"
        style={{ height: useTransform(smoothProgress, [0, 0.2], ["10vh", "25vh"]) }}
      />

      <div className="absolute bottom-[5vh] md:bottom-[10vh] left-1/2 -translate-x-1/2 w-[1000px] h-[1200px] origin-bottom flex items-end justify-center">
        
        {/* Roots System */}
        <motion.svg 
          width="600" 
          height="300" 
          viewBox="0 0 600 300" 
          className="absolute -bottom-[250px] origin-top"
          style={{ opacity: rootsOpacity, scale: rootsScale }}
        >
          <path d="M300,0 C250,100 100,150 50,250" stroke="var(--wood-800)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M300,0 C350,100 500,150 550,250" stroke="var(--wood-800)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M300,0 C280,150 200,200 180,300" stroke="var(--wood-800)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M300,0 C320,150 400,200 420,300" stroke="var(--wood-800)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4" />
        </motion.svg>

        {/* Main Trunk */}
        <motion.svg 
          width="100" 
          height="1200" 
          viewBox="0 0 100 1200" 
          className="absolute bottom-0 origin-bottom"
          style={{ scaleY: trunkScaleY, width: trunkWidth }}
          preserveAspectRatio="none"
        >
          <path d="M40,1200 C30,600 40,300 45,0 C55,300 70,600 60,1200 Z" fill="var(--wood-800)" opacity="0.6" />
        </motion.svg>

        {/* Branches & Canopy System - Wrapping in a subtle breathing animation */}
        <motion.div 
          className="absolute inset-0 origin-bottom"
          animate={{ rotate: [-0.5, 0.5, -0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Lower Branches (Projects 1 & 2) */}
          <motion.svg 
            width="1000" 
            height="1200" 
            viewBox="0 0 1000 1200" 
            className="absolute bottom-[300px]"
            style={{ opacity: lowerBranchOpacity }}
          >
            <path d="M500,800 Q300,600 150,550" stroke="var(--wood-700)" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M500,700 Q750,550 850,450" stroke="var(--wood-700)" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.4" />
          </motion.svg>

          {/* Upper Branches (Projects 3 & 4) */}
          <motion.svg 
            width="1000" 
            height="1200" 
            viewBox="0 0 1000 1200" 
            className="absolute bottom-[400px]"
            style={{ opacity: upperBranchOpacity }}
          >
            <path d="M500,500 Q350,300 250,150" stroke="var(--wood-700)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M500,600 Q650,400 750,200" stroke="var(--wood-700)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.4" />
          </motion.svg>

          {/* Abstract Canopy / Foliage */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-full h-[800px] flex items-center justify-center pointer-events-none">
            
            <motion.div 
              className="absolute w-[900px] h-[700px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-forest-700 blur-[60px]"
              style={{ scale: canopyScale, opacity: canopyOpacity }}
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.div 
              className="absolute w-[700px] h-[500px] rounded-[50%_50%_40%_60%/50%_60%_40%_50%] bg-moss-500 blur-[80px]"
              style={{ scale: canopyScale, opacity: useTransform(smoothProgress, [0.75, 1], [0, 0.3]) }}
              animate={{ rotate: [0, -5, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div 
              className="absolute w-[500px] h-[400px] rounded-full bg-leaf-300 blur-[100px]"
              style={{ scale: canopyScale, opacity: useTransform(smoothProgress, [0.85, 1], [0, 0.4]) }}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
