"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExperienceLoaderProps {
  onComplete: () => void;
}

export default function ExperienceLoader({ onComplete }: ExperienceLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [showEnter, setShowEnter] = useState(false);

  useEffect(() => {
    let start = performance.now();
    const duration = 3000;
    
    const animate = (time: number) => {
      const elapsed = time - start;
      const t = Math.min(elapsed / duration, 1);

      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgress(ease * 100);
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setShowEnter(true);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  const title = "YUKITH";
  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0D0A08]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-md px-8 relative h-64">
                <motion.div 
          className="font-serif text-5xl md:text-7xl text-[#F4F1EA] tracking-[0.3em] mb-8 overflow-hidden flex"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.15, delayChildren: 0.5 }}
        >
          {title.split("").map((char, index) => (
            <motion.span key={index} variants={letterVariants} transition={{ duration: 0.8, ease: "easeOut" }}>
              {char}
            </motion.span>
          ))}
        </motion.div>

                <div className="w-full h-[1px] bg-[#15100C] relative overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-[#B99755]"
            style={{ width: `${progress}%` }}
          />
        </div>

                <div className="mt-8 h-16 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {!showEnter ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[#8E826C] text-sm tracking-widest font-mono uppercase"
              >
                loading experience...
              </motion.div>
            ) : (
              <motion.button
                key="enter"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className="w-24 h-24 rounded-full border border-[#B99755] flex items-center justify-center text-[#B99755] hover:bg-[#B99755] hover:text-[#0D0A08] transition-colors duration-300 font-mono text-sm tracking-widest uppercase cursor-pointer"
              >
                Enter
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
