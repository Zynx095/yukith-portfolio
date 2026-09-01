"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { achievementsData } from '@/src/data/achievements';

gsap.registerPlugin(ScrollTrigger);

export default function MilestoneGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          const sections = gsap.utils.toArray(".milestone-card");
          
          gsap.to(sections, {
            xPercent: -100 * (sections.length - 1),
            ease: "none",
            scrollTrigger: {
              trigger: scrollContainerRef.current,
              pin: true,
              scrub: 1,
              snap: 1 / (sections.length - 1),
              end: () => "+=" + scrollContainerRef.current?.offsetWidth
            }
          });
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="achievements" 
      aria-label="Achievements"
      ref={sectionRef} 
      className="bg-[#F4F1EA] text-[#3A2417] py-24 md:py-0 relative overflow-hidden"
    >
      {/* Background subtle tree rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#B99755]/5 rounded-full pointer-events-none hidden md:block"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-[#B99755]/5 rounded-full pointer-events-none hidden md:block"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 md:hidden mb-12">
        <h2 className="text-4xl font-serif text-[#12351F] font-bold border-b border-[#3A2417]/20 pb-4 flex items-center gap-3">
          <span className="text-[#B99755] text-2xl">✤</span> Achievements
        </h2>
      </div>

      <div 
        ref={scrollContainerRef} 
        className="md:min-h-screen flex flex-col md:flex-row md:items-center px-6 md:px-12 gap-8 md:gap-12 md:overflow-hidden relative z-10"
      >
        <div className="hidden md:block w-[400px] shrink-0 milestone-card">
          <h2 className="text-5xl font-serif text-[#12351F] font-bold border-b border-[#3A2417]/20 pb-4 mb-4 flex items-center gap-4">
            <span className="text-[#B99755] text-3xl">✤</span> Achievements
          </h2>
          <p className="font-sans text-[#51321E]">Milestones, recognition, and growth rings from competitive events.</p>
        </div>

        {achievementsData.map((ach, idx) => (
          <div 
            key={idx} 
            className="milestone-card shrink-0 w-[85vw] max-w-[320px] md:w-[400px] h-[350px] bg-white/80 backdrop-blur-sm border border-[#B99755]/30 rounded-xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group"
          >
            {/* Tree ring decorative corner */}
            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full border-[10px] border-[#B99755]/10 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full border-[4px] border-[#315D39]/5 group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#12351F] to-[#B99755] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-[#12351F] text-[#F4F1EA] font-mono text-xs font-bold rounded-full mb-6 border border-[#B99755]/30">
                {ach.roleOrPlacement}
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#12351F] mb-3 leading-tight">
                {ach.title}
              </h3>
              <p className="font-sans text-[#51321E]">{ach.organization}</p>
            </div>
            
            <div className="font-mono text-4xl font-bold text-[#B99755]/20 mt-auto text-right relative z-10">
              {ach.year}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
