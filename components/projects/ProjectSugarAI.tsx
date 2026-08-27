"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROJECTS } from "@/src/data/projects";

export function ProjectSugarAI() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const sugarAI = PROJECTS.find((p) => p.title === "Sugar AI");

  if (!sugarAI) return null;

  const handleMicClick = () => {
    setIsListening(true);
    setTimeout(() => setIsListening(false), 5000); // Reset after 5s
  };

  return (
    <section ref={containerRef} className="relative w-full min-h-screen bg-transparent py-24 overflow-hidden flex items-center">
      
      {/* Soft botanical ambient background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(163, 177, 138, 0.15) 0%, rgba(255,255,255,0) 70%)'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-24 w-full flex flex-col md:flex-row gap-16 items-center z-10">
        
        {/* Left: Info */}
        <div className="flex-1 w-full">
          <div className="bg-cream-100/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-sm border border-cream-300">
            <div className="font-mono text-[10px] tracking-widest text-forest-700 mb-4">
              [ OFFLINE SYSTEM ]
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter mb-2 text-wood-900">
              {sugarAI.title}
            </h2>
            <div className="text-xl font-sans text-wood-800 font-medium mb-4">
              {sugarAI.role}
            </div>
            <p className="font-sans text-wood-800 text-sm md:text-base max-w-md mb-4">
              {sugarAI.desc}
            </p>
            
            <div className="mb-8 p-4 bg-leaf-300/20 border border-forest-700 rounded-2xl shadow-sm text-sm font-sans text-moss-500 max-w-md">
              <strong className="text-forest-900">Key Differentiator:</strong> 100% local, offline processing. Rooted securely on the device, like a self-sustaining ecosystem without external dependencies.
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {sugarAI.tags.map(tech => (
                <span key={tech} className="px-3 py-1 text-[10px] font-mono border border-forest-700 rounded-full text-forest-900 bg-leaf-300/20">
                  {tech}
                </span>
              ))}
            </div>

            {sugarAI.github && (
              <a 
                href={sugarAI.github} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 border border-forest-700 bg-leaf-300/20 hover:bg-leaf-300/40 text-forest-900 font-sans text-sm transition-colors rounded-full"
              >
                View on GitHub
              </a>
            )}
          </div>
        </div>

        {/* Right: Audio Pipeline Visualization as Organic Ripples */}
        <div className="flex-1 w-full flex flex-col gap-6 relative md:pl-16 md:border-l md:border-forest-700/20 py-8">
          
          {/* Mic Button at the top */}
          <div className="flex justify-center md:justify-start pl-8 md:pl-8 mb-4">
            <button
              onClick={handleMicClick}
              disabled={isListening}
              className={`p-4 rounded-full border-2 transition-all ${
                isListening 
                  ? "bg-forest-700 border-forest-900 shadow-[0_0_20px_rgba(74,103,65,0.5)]" 
                  : "bg-leaf-300/20 border-forest-700 hover:bg-leaf-300/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isListening ? "var(--cream-100)" : "var(--forest-900)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
          </div>

          {/* Stem connection */}
          <div className="absolute top-[100px] bottom-8 left-6 md:left-16 w-0.5 bg-forest-700/20 rounded-full overflow-hidden">
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ top: "-10%" }}
                  animate={{ top: "110%" }}
                  transition={{ duration: 4, ease: "linear" }}
                  className="absolute left-0 w-full h-1/4 bg-forest-700 blur-sm rounded-full"
                />
              )}
            </AnimatePresence>
          </div>

          {[
            { label: "USER VOICE", desc: "Local Mic Input", delay: 0 },
            { label: "WHISPER", desc: "Speech-to-Text", delay: 0.5 },
            { label: "OLLAMA", desc: "Local LLM Inference", delay: 1.5 },
            { label: "MELOTTS", desc: "Text-to-Speech", delay: 2.5 },
            { label: "SYSTEM VOICE", desc: "Audio Output", delay: 3.5 },
          ].map((node, i) => {
            const active = isListening;
            return (
            <div key={i} className="relative flex items-center gap-6 group pl-12 md:pl-8">
              <div className="absolute left-[20px] md:left-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-sage-400 border-2 border-cream">
                {active && (
                  <motion.div 
                    className="absolute inset-0 bg-forest-700 rounded-full origin-center"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: [1, 2.5, 1], opacity: [0, 0.6, 0] }}
                    transition={{ duration: 1.5, delay: node.delay, repeat: 0 }}
                  />
                )}
                {active && (
                  <motion.div 
                    className="absolute inset-0 bg-sage-400 rounded-full origin-center"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0, 0.8, 0] }}
                    transition={{ duration: 1.5, delay: node.delay + 0.2, repeat: 0 }}
                  />
                )}
              </div>
              
              <motion.div 
                className={`px-6 py-4 border bg-cream-100/80 backdrop-blur-md rounded-2xl w-full max-w-[280px] transition-all shadow-sm ${active ? 'border-forest-700' : 'border-forest-700/20'}`}
                animate={{ scale: active ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 0.5, delay: node.delay }}
              >
                <span className="font-sans font-semibold text-sm text-wood-900 block mb-1">
                  {node.label}
                </span>
                <span className="font-sans text-[11px] text-wood-800 uppercase tracking-wide">
                  {node.desc}
                </span>
              </motion.div>
            </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
