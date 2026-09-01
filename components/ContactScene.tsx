"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { socialData } from '@/src/data/social';
import { profileData } from '@/src/data/profile';

gsap.registerPlugin(ScrollTrigger);

export default function ContactScene() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".contact-reveal", 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="relative py-32 px-6 md:px-12 bg-[#12351F] text-[#F4F1EA] overflow-hidden">
      {/* Background Roots — massive tree roots reaching down */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-[#B99755]" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M20 0 C 30 50, 10 70, 0 100" />
          <path d="M50 0 C 60 40, 40 60, 30 100" />
          <path d="M80 0 C 70 30, 90 80, 100 100" />
        </svg>
      </div>

      {/* Background Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-serif font-black text-white/[0.03] select-none pointer-events-none whitespace-nowrap">
        CONNECT
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent to-[#B99755] mb-8 contact-reveal"></div>
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-[#B99755] mb-6 contact-reveal">
          Let's Connect
        </h2>
        <p className="text-lg md:text-xl font-sans text-[#F4F1EA]/80 max-w-2xl mb-16 contact-reveal">
          Always open to discussing new opportunities, creative projects, or a vision that aligns with my expertise.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16 contact-reveal">
          <div className="bg-[#1A120D] border-t-2 border-[#B99755] p-6 rounded-b-xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[#B99755]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <h3 className="font-serif text-[#B99755] text-xl mb-2 flex items-center justify-center gap-2">
              <span className="text-xs">🌿</span> Location
            </h3>
            <p className="font-sans text-[#D8C9A8]">Bengaluru, India</p>
          </div>
          <div className="bg-[#1A120D] border-t-2 border-[#315D39] p-6 rounded-b-xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[#315D39]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <h3 className="font-serif text-[#315D39] text-xl mb-2 flex items-center justify-center gap-2">
              <span className="text-xs">🌿</span> Status
            </h3>
            <p className="font-sans text-[#D8C9A8]">Available for Opportunities</p>
          </div>
          <div className="bg-[#1A120D] border-t-2 border-[#E3CB8A] p-6 rounded-b-xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[#E3CB8A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <h3 className="font-serif text-[#E3CB8A] text-xl mb-2 flex items-center justify-center gap-2">
              <span className="text-xs">🌿</span> Timezone
            </h3>
            <p className="font-sans text-[#D8C9A8]">UTC+5:30 IST</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 w-full contact-reveal">
          {Object.entries(socialData).map(([key, data]: [string, any]) => (
            <a 
              key={key}
              href={key === 'resume' ? '/resume.pdf' : data.url}
              target={key === 'resume' ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 min-h-[48px] bg-transparent border-2 border-[#B99755] text-[#B99755] hover:bg-[#B99755] hover:text-[#12351F] font-sans font-bold rounded-lg transition-all flex items-center justify-center"
            >
              {data.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
