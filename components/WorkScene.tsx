"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { PROJECTS } from "@/src/data/projects";

import { ProjectETTH } from "./projects/ProjectETTH";
import { ProjectAURA } from "./projects/ProjectAURA";
import { ProjectShadowGuard } from "./projects/ProjectShadowGuard";
import { ProjectSugarAI } from "./projects/ProjectSugarAI";

gsap.registerPlugin(ScrollTrigger);

/* --- Section header ------------------------------------------------ */
function SceneHeader() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      // Parallax effect on header
      gsap.to(ref.current, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });

      gsap.fromTo(
        ref.current!.querySelectorAll("[data-reveal]"),
        { opacity: 0, y: 50, filter: "blur(10px)", scale: 0.95 },
        {
          opacity: 1, y: 0, filter: "blur(0px)", scale: 1,
          stagger: 0.15, duration: 1.2, ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 75%", toggleActions: "play none none reverse" },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="relative py-32 px-6 lg:px-24 max-w-7xl mx-auto flex flex-col items-start min-h-[40vh] justify-center z-10 origin-top">
      <div className="bg-cream-100/80 backdrop-blur-md p-6 md:p-10 rounded-2xl shadow-sm border border-cream-300">
        <span
          data-reveal=""
          className="font-sans uppercase block mb-4 tracking-[0.3em] text-forest-700 text-xs"
        >
          Phase 02 / Branches
        </span>
        <h2
          data-reveal=""
          className="font-serif font-medium leading-none text-5xl md:text-7xl tracking-tight text-wood-900 max-w-2xl"
        >
          Engineering & Architecture
        </h2>
        <p
          data-reveal=""
          className="mt-6 max-w-lg text-wood-800 text-sm md:text-base font-sans"
        >
          An exploration of applied systems. Growing from machine learning pipelines to defensive cybersecurity ecosystems.
        </p>
      </div>
    </div>
  );
}

export function WorkScene() {
  const placeholders = PROJECTS.filter(p => p.isPlaceholder);

  return (
    <div id="work" className="relative w-full bg-transparent" aria-label="Work">
      <SceneHeader />

      {/* Interactive Project Environments */}
      <ProjectETTH />
      <ProjectAURA />
      <ProjectShadowGuard />
      <ProjectSugarAI />

      {/* Other Projects / Placeholders Index */}
      {placeholders.length > 0 && (
        <section className="py-32 px-6 lg:px-24 max-w-7xl mx-auto border-t border-wood-900/10 mt-16 relative z-10">
          <h3 className="font-sans text-[10px] tracking-[0.2em] text-wood-800 uppercase mb-12">
            Archived / Emerging Buds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {placeholders.map((p) => (
              <motion.div 
                key={p.id} 
                className="bg-cream-100/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-cream-300 cursor-pointer"
                whileHover={{ scale: 1.03, backgroundColor: "var(--leaf-100)", borderColor: "var(--forest-700)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-[10px] text-wood-800">{p.year}</span>
                  <span className="font-sans text-[9px] uppercase tracking-widest px-2 py-1 bg-leaf-300/20 text-forest-900 rounded-full border border-forest-700">Sprouting</span>
                </div>
                <h4 className="font-serif text-lg text-wood-900 mb-2">{p.title}</h4>
                <div className="flex flex-wrap gap-2 mt-4">
                  {p.tags.map(t => (
                    <span key={t} className="font-sans text-[9px] text-wood-800 uppercase">{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}