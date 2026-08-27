"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { achievementsData } from "@/src/data/achievements";
import { motion, AnimatePresence } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

export function MilestoneGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !containerRef.current) return;
    const ctx = gsap.context(() => {
      // Intro unmask/grow animation for the title and text
      gsap.fromTo(".milestone-intro", 
        { opacity: 0, y: 50, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, stagger: 0.2, ease: "expo.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
        }
      );

      // Horizontal scroll
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          gsap.to(containerRef.current, {
            x: () => -(containerRef.current!.scrollWidth - window.innerWidth + 120),
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "+=1500",
              scrub: 1,
              pin: true,
            },
          });
        }
      });

      // Growth rings unmask/grow organically
      gsap.fromTo(".ring-element", 
        { opacity: 0, scale: 0.7, transformOrigin: "bottom left" },
        { opacity: 1, scale: 1, stagger: 0.15, duration: 1.2, ease: "elastic.out(1, 0.7)", 
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} aria-label="Achievements and Hackathons" className="relative bg-cream-100 min-h-screen flex flex-col justify-center overflow-hidden py-24 md:py-0">
      
      <div className="px-6 lg:px-24 mb-16 md:mb-32">
        <span className="milestone-intro font-sans uppercase block mb-4 tracking-widest text-wood-800 text-xs bg-cream-100/90 backdrop-blur-sm px-4 py-2 rounded-xl inline-block">
          03 / Growth Rings
        </span>
        <h2 className="milestone-intro font-serif font-bold leading-none text-4xl md:text-6xl tracking-tight text-forest-900 bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl inline-block mt-4">
          Achievements
        </h2>
        <p className="milestone-intro mt-4 font-sans text-wood-800 bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl inline-block">Recognitions and milestones.</p>
      </div>

      <div className="w-full overflow-hidden flex items-center md:block">
        <div ref={containerRef} className="flex flex-col md:flex-row gap-8 px-6 lg:px-24 w-full md:w-max">
          {achievementsData.map((ach, i) => (
            <motion.div 
              key={i} 
              className="ring-element w-[85vw] max-w-[320px] md:w-[400px] shrink-0 p-10 border-l-[3px] border-b-[3px] border-forest-700/20 rounded-bl-[100px] rounded-tr-3xl bg-cream-100/90 backdrop-blur-sm shadow-sm cursor-pointer relative overflow-hidden flex flex-col justify-end min-h-[300px]"
              initial="idle"
              animate="idle"
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              variants={{
                idle: { scale: 1, borderColor: "rgba(22, 60, 40, 0.2)", backgroundColor: "rgba(242, 237, 228, 0.9)" },
                hover: { scale: 1.03, borderColor: "rgba(22, 60, 40, 0.6)", backgroundColor: "var(--leaf-300)" }
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex justify-between items-start mb-6">
                <motion.span 
                  className="font-sans text-xs text-wood-800 font-bold px-3 py-1 bg-cream-100 rounded-full border border-wood-900/10"
                  variants={{
                    hover: { backgroundColor: "var(--forest-700)", color: "#fff", scale: 1.05 }
                  }}
                >{ach.year}</motion.span>
              </div>
              
              <motion.div
                variants={{
                  idle: { opacity: 0.9, y: 10 },
                  hover: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-serif font-bold text-forest-900 mb-2 leading-tight">
                  {ach.title}
                </h3>
                <div className="font-sans text-sm text-wood-800 mb-6">
                  @ {ach.organization}
                </div>
                <div className="inline-block border border-forest-700/40 rounded-full px-4 py-1.5 text-xs text-forest-900 font-bold tracking-wide uppercase bg-cream-100/50">
                  {ach.roleOrPlacement}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
