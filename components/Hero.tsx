"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { profileData } from "@/src/data/profile";
import { socialData } from "@/src/data/social";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Smooth fade and slight upward drift on scroll down
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // Elegant, editorial fade up
      gsap.fromTo(
        ".hero-element",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.5,
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.2
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-cream-100"
      aria-label="Hero Introduction"
    >
      {/* Soft natural lighting gradient */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: "radial-gradient(circle at 50% 30%, rgba(255,250,235,1) 0%, rgba(243,235,221,0) 70%)" }}
      />

      <motion.div 
        ref={containerRef}
        className="relative z-10 w-full max-w-5xl px-6 md:px-12 flex flex-col items-center text-center h-full justify-center will-change-transform"
        style={{ opacity, y }}
      >
        {/* The Sapling Metaphor - Abstract Botanical SVG */}
        <div className="hero-element mb-12 opacity-80">
          <svg width="60" height="120" viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 120C30 90 28 60 30 30" stroke="var(--wood-700)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M30 70C25 65 15 60 15 50" stroke="var(--wood-700)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M30 50C35 45 45 40 45 30" stroke="var(--wood-700)" strokeWidth="1.5" strokeLinecap="round"/>
            {/* Leaves */}
            <circle cx="13" cy="48" r="3" fill="var(--leaf-600)" />
            <circle cx="47" cy="28" r="3" fill="var(--leaf-600)" />
            <circle cx="30" cy="27" r="4" fill="var(--leaf-700)" />
          </svg>
        </div>

        <h1 className="hero-element font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-wood-900 mb-6">
          {profileData.name}
        </h1>

        <div className="hero-element font-sans text-sm md:text-base text-wood-800 mb-6 max-w-xl bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
          {profileData.degree}
        </div>

        <div className="hero-element font-sans text-xs md:text-sm tracking-widest text-leaf-700 uppercase mb-12 flex flex-wrap justify-center gap-3">
          Cybersecurity <span className="text-moss-500">·</span> AI/ML <span className="text-moss-500">·</span> Networking <span className="text-moss-500">·</span> Intelligent Systems
        </div>

        {/* Action Nodes */}
        <div className="hero-element flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4">
          <motion.a
            href="#work"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group px-8 py-3 rounded-full border border-forest-700 bg-forest-700 text-cream-100 font-sans text-xs uppercase tracking-widest transition-colors hover:bg-forest-900"
          >
            Explore Work
          </motion.a>

          <div className="flex flex-wrap gap-4">
            {socialData.map((link) => (
              <motion.a
                key={link.platform}
                href={link.platform === "Resume" ? "/resume.pdf" : link.url}
                target={link.platform === "Email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, backgroundColor: "var(--cream-200)" }}
                whileTap={{ scale: 0.95 }}
                className="text-wood-700 hover:text-wood-900 transition-colors font-sans text-xs uppercase tracking-widest border border-wood-900/10 px-5 py-3 hover:border-wood-900/30 rounded-full bg-cream-100 shadow-sm"
              >
                {link.platform}
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-3 hero-element opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-wood-900 to-transparent" />
      </motion.div>
    </section>
  );
}