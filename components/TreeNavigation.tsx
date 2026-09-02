"use client";

import { useEffect, useState } from 'react';

const navNodes = [
  { id: 'hero', label: 'INTRO' },
  { id: 'about', label: 'ABOUT' },
  { id: 'work', label: 'WORK' },
  { id: 'experience', label: 'EXPERIENCE' },
  { id: 'achievements', label: 'ACHIEVEMENTS' },
  { id: 'contact', label: 'CONTACT' },
];

export default function TreeNavigation() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    navNodes.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
            <nav className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col items-center z-50 mix-blend-difference" aria-label="Desktop Navigation">
        <div className="absolute w-[1px] h-full bg-white/20 -z-10" />
        {navNodes.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              aria-label={`Scroll to ${label}`}
              className="group relative flex items-center justify-center w-8 h-12 outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              <span 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-[#B99755] scale-150' : 'bg-white/50 group-hover:bg-white'
                }`}
              />
              <span 
                className={`absolute left-10 font-mono text-xs tracking-widest transition-all duration-300 ${
                  isActive ? 'opacity-100 text-[#B99755]' : 'opacity-0 text-white/50 group-hover:opacity-100'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

            <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-[#12351F]/90 backdrop-blur-md border border-[#B99755]/30 rounded-full z-50 flex items-center justify-between px-2 py-2 pb-[env(safe-area-inset-bottom)]" aria-label="Mobile Navigation">
        {navNodes.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              aria-label={`Scroll to ${label}`}
              className={`min-h-[44px] min-w-[44px] flex-1 flex items-center justify-center rounded-full transition-colors text-[10px] font-mono tracking-wider ${
                isActive ? 'bg-[#B99755] text-[#12351F] font-bold' : 'text-[#F4F1EA]/70 hover:bg-white/10'
              }`}
            >
              {label.substring(0, 3)}
            </button>
          );
        })}
      </nav>
    </>
  );
}
