"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/lib/world/store";
import { getLenis } from "@/components/providers/smooth-scroll";

const navNodes = [
  { id: "hero", label: "INTRO" },
  { id: "about", label: "ABOUT" },
  { id: "work", label: "WORK" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "achievements", label: "ACHIEVEMENTS" },
  { id: "contact", label: "CONTACT" },
];

/** Section navigation for the written portfolio; hidden while the visitor is in the World Tree. */
export default function TreeNavigation() {
  const [activeSection, setActiveSection] = useState("hero");
  const inWorld = useUi((s) => s.inWorld);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      // A section is current while it crosses the middle of the viewport —
      // works for sections of any height (Work spans many screens).
      { rootMargin: "-45% 0px -54% 0px", threshold: 0 }
    );
    navNodes.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  const visibility = inWorld ? "pointer-events-none opacity-0" : "opacity-100";

  return (
    <>
      <nav
        className={`fixed left-8 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center mix-blend-difference transition-opacity duration-500 lg:flex ${visibility}`}
        aria-label="Portfolio sections"
        aria-hidden={inWorld}
      >
        <div className="absolute -z-10 h-full w-[1px] bg-white/20" />
        {navNodes.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              aria-label={`Scroll to ${label}`}
              tabIndex={inWorld ? -1 : 0}
              className="group relative flex h-12 w-8 items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className={`h-2 w-2 rounded-full transition-all duration-300 ${isActive ? "scale-150 bg-[#B99755]" : "bg-white/50 group-hover:bg-white"}`} />
              <span
                className={`absolute left-10 font-mono text-xs tracking-widest transition-all duration-300 ${
                  isActive ? "text-[#B99755] opacity-100" : "text-white/50 opacity-0 group-hover:opacity-100"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <nav
        className={`fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-full border border-[#B99755]/30 bg-[#12351F]/90 px-2 py-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-opacity duration-500 lg:hidden ${visibility}`}
        aria-label="Portfolio sections"
        aria-hidden={inWorld}
      >
        {navNodes.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              aria-label={`Scroll to ${label}`}
              tabIndex={inWorld ? -1 : 0}
              className={`flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-full font-mono text-[10px] tracking-wider transition-colors ${
                isActive ? "bg-[#B99755] font-bold text-[#12351F]" : "text-[#F4F1EA]/70 hover:bg-white/10"
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
