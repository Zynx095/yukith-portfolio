"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experienceData } from "@/src/data/experience";

gsap.registerPlugin(ScrollTrigger);

export function ExperienceNode() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trunkRef = useRef<HTMLDivElement>(null);

  const nvidiaExp = experienceData.find(e => e.company === "NVIDIA × Presidency University");

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".exp-reveal",
        { opacity: 0, y: 50, filter: "blur(15px)", scale: 0.95 },
        {
          opacity: 1, y: 0, filter: "blur(0px)", scale: 1,
          stagger: 0.2, duration: 1.5, ease: "power4.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      if (trunkRef.current) {
        gsap.fromTo(
          trunkRef.current,
          { scaleY: 0, borderLeftWidth: "2px", opacity: 0 },
          {
            scaleY: 1,
            borderLeftWidth: "16px",
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 90%",
              end: "bottom top",
              scrub: true,
            }
          }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  if (!nvidiaExp) return null;

  return (
    <section ref={containerRef} className="relative py-32 bg-cream-100 overflow-hidden">
      {/* Abstract visual trunk that thickens on scroll */}
      <div 
        ref={trunkRef} 
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 border-l-solid border-forest-700/20 origin-top"
      />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-24 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          
          <div className="exp-reveal w-full max-w-3xl border border-leaf-700/20 bg-cream-100/60 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center shadow-lg transition-transform hover:scale-[1.02] duration-500">
            
            <div className="mb-6">
              <h3 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-forest-900 mb-4">
                {nvidiaExp.company}
              </h3>
              <p className="font-sans text-sm md:text-base tracking-wide text-wood-800 uppercase bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl inline-block">
                {nvidiaExp.type}
              </p>
            </div>

            <p className="text-wood-800 font-sans text-base md:text-lg max-w-xl mx-auto leading-relaxed mt-8 bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
              Capstone collaboration bridging academic research with industry engineering.
            </p>

          </div>
        </div>
      </div>
    </section>
  );
}
