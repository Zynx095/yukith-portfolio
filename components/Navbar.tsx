"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { springs, fadeInVariants } from "@/lib/animations";

const NAV_ITEMS = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const magnetRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const navY = useTransform(scrollY, [0, 80], [-10, 0]);

  // Active section detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );

    NAV_ITEMS.forEach(({ href }) => {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Magnetic hover effect
  const handleMagnet = (e: React.MouseEvent<HTMLElement>, key: string) => {
    const el = magnetRefs.current.get(key);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const resetMagnet = (key: string) => {
    const el = magnetRefs.current.get(key);
    if (!el) return;
    el.style.transform = "translate(0,0)";
    el.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
    setTimeout(() => {
      if (el) el.style.transition = "";
    }, 500);
  };

  const handleNavClick = (href: string) => {
    setIsMobileOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Desktop — floating pill */}
      <motion.nav
        className="fixed top-6 left-1/2 z-50 hidden md:block"
        style={{ x: "-50%", opacity: navOpacity, y: navY }}
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        custom={0.5}
        aria-label="Main navigation"
      >
        <div className="glass-pill rounded-full px-2 py-2 flex items-center gap-1">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="px-3 py-1.5 mr-2 flex items-center gap-2 group"
          >
            <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent-cyan)] font-bold group-hover:glow-cyan transition-all duration-300">
              Y.OS
            </span>
          </a>

          <div className="w-px h-4 bg-white/10 mr-2" />

          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href;
            const isHovered = hoveredItem === item.label;
            return (
              <motion.div
                key={item.label}
                className="relative"
                ref={(el) => {
                  if (el) magnetRefs.current.set(item.label, el);
                }}
                onMouseMove={(e) => handleMagnet(e, item.label)}
                onMouseLeave={() => {
                  resetMagnet(item.label);
                  setHoveredItem(null);
                }}
                onMouseEnter={() => setHoveredItem(item.label)}
              >
                {/* Active / hover background */}
                <AnimatePresence>
                  {(isActive || isHovered) && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: isActive
                          ? "rgba(0,212,255,0.1)"
                          : "rgba(255,255,255,0.05)",
                        border: isActive
                          ? "1px solid rgba(0,212,255,0.25)"
                          : "1px solid rgba(255,255,255,0.08)",
                      }}
                      layoutId="nav-highlight"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={springs.snappy}
                    />
                  )}
                </AnimatePresence>

                <a
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                  className={`relative z-10 block px-4 py-1.5 text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-300 rounded-full ${
                    isActive
                      ? "text-[var(--accent-cyan)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </a>
              </motion.div>
            );
          })}

          <div className="w-px h-4 bg-white/10 ml-2" />

          {/* CTA */}
          <motion.a
            href="#contact"
            onClick={(e) => { e.preventDefault(); handleNavClick("#contact"); }}
            className="ml-2 px-4 py-1.5 text-xs font-mono font-bold tracking-[0.15em] uppercase rounded-full text-[#111113] bg-[var(--accent-cyan)] relative overflow-hidden group"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={springs.snappy}
          >
            <span className="relative z-10">Hire Me</span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5, ease: [0.45, 0, 0.55, 1] }}
            />
          </motion.a>
        </div>
      </motion.nav>

      {/* Mobile — bottom dock */}
      <motion.div
        className="fixed bottom-6 left-1/2 z-50 md:hidden"
        style={{ x: "-50%" }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springs.cinematic, delay: 1 }}
      >
        <div className="glass-pill rounded-full px-4 py-3 flex items-center gap-4">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                className={`text-[10px] font-mono tracking-wider uppercase transition-colors duration-300 ${
                  isActive
                    ? "text-[var(--accent-cyan)]"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                {isActive && (
                  <motion.div
                    className="w-1 h-1 rounded-full bg-[var(--accent-cyan)] mx-auto mb-1"
                    layoutId="mobile-dot"
                  />
                )}
                {item.label}
              </a>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
