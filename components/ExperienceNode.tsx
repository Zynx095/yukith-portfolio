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
    <section id="experience" ref={containerRef} className="py-24 px-6 md:px-12 bg-[#12351F] text-[#F4F1EA]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif text-[#B99755] font-bold mb-16 border-b border-[#B99755]/30 pb-4">
          EXPERIENCE
        </h2>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#B99755] before:via-[#B99755]/50 before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active exp-card">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#12351F] bg-[#B99755] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 ml-0 md:ml-auto md:mr-auto"></div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#F4F1EA] p-6 rounded shadow-xl border border-[#B99755]/20 ml-6 md:ml-0">
              <h3 className="font-serif font-bold text-2xl text-[#12351F]">NVIDIA × Presidency</h3>
              <p className="font-mono text-[#51321E] text-sm mt-1 mb-3">Capstone Project Internship</p>
              <p className="font-sans text-[#3A2417] leading-relaxed">
                Capstone collaboration bridging academic research with industry engineering.
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active exp-card">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#12351F] bg-[#315D39] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 ml-0 md:ml-auto md:mr-auto"></div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#F4F1EA] p-6 rounded shadow-xl border border-[#315D39]/20 ml-6 md:ml-0">
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
