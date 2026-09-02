"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ExperienceNode() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".exp-card", 
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={containerRef} className="py-24 px-6 md:px-12 bg-[#12351F] text-[#F4F1EA] relative overflow-hidden">
            <div className="absolute -left-[10%] top-0 w-1/2 h-full opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-[#B99755]" fill="none" stroke="currentColor" strokeWidth="0.5">
          <path d="M50 0 C 40 20, 60 40, 50 60 C 40 80, 60 100, 50 120" />
          <path d="M50 20 C 30 40, 70 60, 40 80" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-serif text-[#B99755] font-bold mb-16 flex items-center justify-center gap-4 text-center">
          <span className="opacity-50 font-light text-3xl">〰</span>
          EXPERIENCE
          <span className="opacity-50 font-light text-3xl">〰</span>
        </h2>

                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-[#B99755] before:via-[#3A2417] before:to-[#12351F] before:rounded-full">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active exp-card">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#B99755] bg-[#3A2417] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 ml-0 md:ml-auto md:mr-auto relative">
              <div className="absolute inset-2 rounded-full border border-[#B99755]/50"></div>
              <div className="absolute inset-3 rounded-full border border-[#B99755]/30"></div>
              <span className="text-xs text-[#B99755]">◈</span>
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-[#F4F1EA] p-6 rounded shadow-xl border-l-4 border-l-[#B99755] ml-6 md:ml-0 relative">
              <h3 className="font-serif font-bold text-2xl text-[#12351F]">NVIDIA × Presidency</h3>
              <p className="font-mono text-[#51321E] text-sm mt-1 mb-3">Capstone Project Internship</p>
              <p className="font-sans text-[#3A2417] leading-relaxed">
                Capstone collaboration bridging academic research with industry engineering.
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active exp-card">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#315D39] bg-[#1A120D] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 ml-0 md:ml-auto md:mr-auto relative">
              <div className="absolute inset-2 rounded-full border border-[#315D39]/50"></div>
              <div className="absolute inset-3 rounded-full border border-[#315D39]/30"></div>
              <span className="text-xs text-[#315D39]">◈</span>
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-[#F4F1EA] p-6 rounded shadow-xl border-l-4 border-l-[#315D39] ml-6 md:ml-0 relative">
              <h3 className="font-serif font-bold text-2xl text-[#12351F]">Elevance</h3>
              <p className="font-mono text-[#51321E] text-sm mt-1 mb-3">Full-Stack Development Intern</p>
              <p className="font-sans text-[#3A2417] leading-relaxed">
                Full-stack development internship building production systems.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
