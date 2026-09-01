"use client";

import { useEffect, useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { profileData } from '@/src/data/profile';
import { socialData } from '@/src/data/social';
import Link from 'next/link';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    if (!textRef.current) return;
    
    const elements = textRef.current.children;
    gsap.fromTo(elements, 
      { y: 50, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        stagger: 0.1, 
        duration: 1, 
        ease: "power3.out",
        delay: 0.2
      }
    );
  }, []);

  return (
    <section 
      id="hero" 
      aria-label="Hero Introduction" 
      ref={containerRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#F4F1EA]"
    >
      {/* Background Pattern — subtle leaves/canopy motif */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5C45 5 55 15 55 30C55 45 45 55 30 55C15 55 5 45 5 30C5 15 15 5 30 5ZM30 10C20 10 10 20 10 30C10 40 20 50 30 50C40 50 50 40 50 30C50 20 40 10 30 10Z' fill='%2312351F' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px',
          backgroundPosition: 'center',
          transform: 'translateY(-10vh)', // Slight offset
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
        }} 
      />

      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-start justify-center"
        ref={textRef}
      >
        <h1 className="text-5xl sm:text-7xl md:text-[9rem] font-serif font-bold text-[#12351F] leading-tight mb-2 tracking-tight">
          {profileData.name}
        </h1>
        
        <p className="text-xl sm:text-2xl md:text-3xl font-serif text-[#3A2417] mb-6 max-w-3xl">
          {profileData.degree}
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          {profileData.primaryFocus.map((focus: string, i: number) => (
            <span key={i} className="px-4 py-2 bg-[#12351F]/10 text-[#12351F] font-mono text-sm rounded-full border border-[#12351F]/20">
              {focus}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link 
            href="#work" 
            className="px-8 py-4 min-w-[44px] min-h-[44px] bg-[#12351F] text-[#F4F1EA] font-sans font-medium rounded hover:bg-[#315D39] transition-colors flex items-center justify-center"
          >
            Explore Work
          </Link>
          
          <div className="flex flex-wrap gap-3">
            {Object.entries(socialData).map(([key, data]: [string, any]) => (
              <a 
                key={key}
                href={key === 'resume' ? '/resume.pdf' : data.url}
                target={key === 'resume' ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="px-6 py-4 min-w-[44px] min-h-[44px] border border-[#3A2417]/30 text-[#3A2417] hover:border-[#12351F] hover:text-[#12351F] font-sans rounded transition-colors flex items-center justify-center"
              >
                {data.label}
              </a>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 animate-bounce opacity-70">
        <span className="text-[#3A2417] font-mono text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-12 bg-[#3A2417]"></div>
      </div>
    </section>
  );
}