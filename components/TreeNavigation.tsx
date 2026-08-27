"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "hero", label: "Sapling" },
  { id: "about", label: "Roots" },
  { id: "work", label: "Branches" },
  { id: "experience", label: "Trunk" },
  { id: "achievements", label: "Rings" },
  { id: "contact", label: "Canopy" }
];

export function TreeNavigation() {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveSection(id);
              }
            });
          },
          { rootMargin: "-40% 0px -40% 0px" }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center">
      {/* Central Vine/Stem */}
      <div className="absolute top-0 bottom-0 w-[1px] bg-wood-900/10 left-1/2 -translate-x-1/2" />
      
      {SECTIONS.map((section, idx) => {
        const isActive = activeSection === section.id;
        // Alternate branches left and right
        const isLeft = idx % 2 === 0;

        return (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            className="group relative flex items-center justify-center h-16 w-16"
            aria-label={`Scroll to ${section.label}`}
          >
            {/* The Node (Bud/Leaf) */}
            <div className={`relative z-10 w-3 h-3 rounded-full transition-all duration-500 ${
              isActive ? "bg-forest-700 scale-150" : "bg-leaf-300 hover:bg-forest-700 hover:scale-125"
            }`} />

            {/* Label (Leaf shape appearance on hover/active) */}
            <div className={`absolute ${isLeft ? 'right-full mr-4' : 'left-full ml-4'} 
              transition-all duration-300 pointer-events-none flex items-center bg-cream-100/90 backdrop-blur-sm px-3 py-1 rounded-xl
              ${isActive ? 'opacity-100 translate-x-0 shadow-sm' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-2'}
            `}>
              <span className={`font-sans text-xs uppercase tracking-widest ${
                isActive ? 'text-forest-700 font-bold' : 'text-wood-800 font-medium'
              }`}>
                {section.label}
              </span>
            </div>
            
            {isActive && (
              <motion.div 
                layoutId="activeBranch"
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-[2px] bg-forest-700 ${isLeft ? 'right-1/2' : 'left-1/2'}`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
