"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { socialData } from "@/src/data/social";

gsap.registerPlugin(ScrollTrigger);

export function ContactScene() {
  const ref = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".contact-reveal",
        { opacity: 0, y: 60, filter: "blur(12px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)",
          stagger: 0.1, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 75%", toggleActions: "play none none none" },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="contact" className="relative bg-cream-100 min-h-screen flex items-center justify-center overflow-hidden py-32">
      
      {/* Massive Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
        <h2 className="text-[20vw] font-serif font-bold leading-none tracking-tighter whitespace-nowrap text-wood-900">
          CONNECT
        </h2>
      </div>

      <div ref={containerRef} className="relative z-10 max-w-5xl mx-auto px-6 w-full flex flex-col items-center text-center">
        
        <span className="contact-reveal font-sans uppercase block mb-8 tracking-widest text-wood-800 text-xs bg-cream-100/90 backdrop-blur-sm px-4 py-2 rounded-xl">
          04 / Roots
        </span>

        <h2 className="contact-reveal text-5xl md:text-8xl font-serif font-bold tracking-tight text-wood-900 mb-8">
          Let's <br className="md:hidden" /> Connect
        </h2>

        <p className="contact-reveal text-wood-800 font-sans max-w-xl mx-auto mb-16 text-lg bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
          Whether you have an ambitious project in mind, want to collaborate on
          something organic, or just want to talk shop — my inbox is open.
        </p>

        <div className="contact-reveal flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 mb-24 w-full max-w-4xl">
          {socialData.map((link) => {
            const isEmail = link.platform === "Email";
            const isResume = link.platform === "Resume";
            const url = isResume ? "/resume.pdf" : link.url;
            
            return (
              <motion.a 
                key={link.platform}
                href={url}
                target={isEmail ? undefined : "_blank"}
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto min-h-[48px] px-12 py-4 flex items-center justify-center font-sans text-sm tracking-wide border border-forest-700/30 text-wood-900 hover:bg-forest-700 hover:text-cream-100 transition-colors rounded-full bg-cream-100/90 backdrop-blur-sm shadow-sm"
              >
                {link.platform}
              </motion.a>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="contact-reveal grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl pt-16 border-t border-leaf-700/20">
          
          <div className="flex flex-col items-center text-center bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
            <span className="font-sans text-[10px] uppercase text-wood-800 tracking-widest mb-2">Location</span>
            <span className="font-sans text-sm text-wood-900">Bengaluru, India</span>
          </div>

          <div className="flex flex-col items-center text-center bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
            <span className="font-sans text-[10px] uppercase text-wood-800 tracking-widest mb-2">Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-forest-700 shadow-sm" />
              <span className="font-sans text-sm text-wood-900">Available for Opportunities</span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center bg-cream-100/90 backdrop-blur-sm p-4 rounded-xl">
            <span className="font-sans text-[10px] uppercase text-wood-800 tracking-widest mb-2">Local Time</span>
            <span className="font-sans text-sm text-wood-900">UTC+5:30 (IST)</span>
          </div>

        </div>

      </div>
    </section>
  );
}
