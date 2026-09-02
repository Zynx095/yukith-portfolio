"use client";

import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProjectETTH from './projects/ProjectETTH';
import ProjectAURA from './projects/ProjectAURA';
import ProjectShadowGuard from './projects/ProjectShadowGuard';
import ProjectSugarAI from './projects/ProjectSugarAI';

gsap.registerPlugin(ScrollTrigger);

export default function WorkScene() {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !headerRef.current) return;

    let ctx = gsap.context(() => {

      gsap.from(headerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "top 20%",
          scrub: 1,
        },
        opacity: 0,
        y: 50,
      });

      const projects = gsap.utils.toArray('.project-wrapper');
      projects.forEach((proj: any) => {
        gsap.fromTo(proj, 
          { opacity: 0.3 },
          {
            opacity: 1,
            scrollTrigger: {
              trigger: proj,
              start: "top 80%",
              end: "top 20%",
              scrub: true
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="work" ref={containerRef} className="relative w-full bg-[#0D0A08] border-t-2 border-[#1A120D]">
            <div className="absolute top-0 left-1/4 w-px h-16 bg-gradient-to-b from-[#3A2417] to-transparent"></div>
      <div className="absolute top-0 right-1/4 w-px h-24 bg-gradient-to-b from-[#3A2417] to-transparent"></div>
      <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-[#51321E] to-transparent hidden md:block"></div>

      <div className="py-32 px-4 max-w-7xl mx-auto relative z-10" ref={headerRef}>
        <div className="text-center mb-4 flex justify-center items-center gap-4">
          <div className="h-[1px] w-12 bg-[#315D39]/50"></div>
          <span className="text-[#B99755] font-mono text-sm tracking-widest uppercase">Branches</span>
          <div className="h-[1px] w-12 bg-[#315D39]/50"></div>
        </div>
        <h2 className="text-5xl md:text-7xl font-serif text-[#E3CB8A] mb-8 text-center">Selected Works</h2>
      </div>

      <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-[#1A120D] hidden lg:block z-0"></div>

      <div className="project-wrapper">
        <ProjectETTH />
      </div>
      
      <div className="project-wrapper">
        <ProjectAURA />
      </div>
      
      <div className="project-wrapper">
        <ProjectShadowGuard />
      </div>
      
      <div className="project-wrapper">
        <ProjectSugarAI />
      </div>
      
      </div>
    </section>
  );
}