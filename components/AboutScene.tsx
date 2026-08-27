"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { skillsData, certificationsData } from "@/src/data/skills";
import { profileData } from "@/src/data/profile";
import { educationData } from "@/src/data/education";
import { leadershipData } from "@/src/data/leadership";
import { motion, AnimatePresence } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

export function AboutScene() {
  const sectionRef = useRef<HTMLElement>(null);
  
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".root-node",
        { opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" },
        {
          opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
          stagger: 0.15, duration: 1.2, ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="relative w-full min-h-screen py-32 bg-cream-200">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 w-full relative z-10">
        
        <div className="root-node mb-16">
          <span className="font-sans text-xs tracking-[0.3em] uppercase text-wood-800 block mb-4">
            Phase 01 / Roots
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-wood-900 tracking-tight">
            Fundamentals & Foundation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16">
          
          {/* Education & Bio */}
          <div className="flex flex-col gap-8 xl:col-span-1 md:col-span-1">
            <div className="root-node">
              <h3 className="font-sans text-xs uppercase tracking-widest text-wood-800 mb-6 border-b border-wood-900/10 pb-4">
                Education
              </h3>
              <div className="flex flex-col gap-2 bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
                <span className="text-wood-900 font-serif text-2xl">{educationData[0].degree}</span>
                <span className="text-wood-800 font-sans">{educationData[0].institution}</span>
                <span className="text-wood-800 font-sans text-sm">{educationData[0].period}</span>
              </div>
            </div>
            
            <div className="root-node bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
              <p className="text-wood-800 leading-relaxed font-sans">
                My engineering roots are grounded in the intersection of secure network architectures and applied machine learning. I believe the most robust systems are built by deeply understanding the physical and logical layers they run on.
              </p>
            </div>
          </div>

          {/* Core Technical Branches */}
          <div className="flex flex-col xl:col-span-1 md:col-span-1">
            <h3 className="root-node font-sans text-xs uppercase tracking-widest text-wood-800 mb-6 border-b border-wood-900/10 pb-4">
              Core Disciplines
            </h3>
            <div className="flex flex-col gap-8">
              {skillsData.map((category, idx) => (
                <motion.div 
                  key={idx} 
                  className="root-node relative cursor-pointer p-4 -m-4 rounded-2xl transition-colors duration-300 hover:bg-cream-100/60"
                  onMouseEnter={() => setHoveredCategory(category.title)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={`font-serif text-xl mb-3 transition-colors duration-300 ${hoveredCategory === category.title ? 'text-forest-700' : 'text-leaf-700'}`}>
                    {category.title}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill, sIdx) => (
                      <motion.span 
                        key={skill} 
                        className={`px-3 py-1 bg-cream-100 border text-xs font-sans rounded-full transition-all duration-300 ${hoveredCategory === category.title ? 'border-forest-700 text-forest-900 shadow-sm' : 'border-wood-900/5 text-wood-800'}`}
                        animate={{ 
                          y: hoveredCategory === category.title ? -2 : 0,
                          opacity: hoveredCategory && hoveredCategory !== category.title ? 0.6 : 1
                        }}
                        transition={{ delay: hoveredCategory === category.title ? sIdx * 0.03 : 0 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leadership & Impact */}
          <div className="flex flex-col xl:col-span-1 md:col-span-2">
            <h3 className="root-node font-sans text-xs uppercase tracking-widest text-wood-800 mb-6 border-b border-wood-900/10 pb-4">
              Leadership & Impact
            </h3>
            <div className="flex flex-col gap-4">
              {leadershipData.map((role, i) => (
                <motion.div 
                  key={i} 
                  className="root-node p-5 border border-wood-900/10 bg-cream-100 rounded-xl shadow-sm cursor-pointer"
                  whileHover={{ backgroundColor: "var(--leaf-300)", borderColor: "var(--forest-700)", scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-wood-900 text-sm font-sans font-medium">{role.role} — {role.eventOrClub}</div>
                  {role.organization && <div className="text-wood-800 text-xs mt-1">{role.organization}</div>}
                  <div className="text-forest-700 text-xs font-sans mt-3">{role.period}</div>
                </motion.div>
              ))}
              
              {certificationsData.map((cert, i) => (
                <motion.div 
                  key={i} 
                  className="root-node p-5 border border-leaf-700/20 bg-leaf-700/5 rounded-lg mt-4 cursor-pointer group"
                  whileHover={{ backgroundColor: "var(--forest-700)", scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-leaf-700 group-hover:text-cream-200 text-xs font-sans uppercase tracking-widest mb-2 transition-colors">Certification</div>
                  <div className="text-wood-900 group-hover:text-white text-sm font-serif transition-colors">{cert}</div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      {/* Abstract Root SVG background */}
      <svg className="absolute bottom-0 left-0 w-full h-64 pointer-events-none opacity-5" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path d="M0,0 Q250,200 500,100 T1000,200 L1000,250 L0,250 Z" fill="var(--wood-900)" />
      </svg>
    </section>
  );
}
