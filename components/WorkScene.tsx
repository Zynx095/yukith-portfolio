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
      // Header fade in
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

      // Simple reveal for each project container
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
    <section id="work" ref={containerRef} className="relative w-full bg-[#0D0A08]">
      <div className="py-24 px-4 max-w-7xl mx-auto" ref={headerRef}>
        <h2 className="text-5xl md:text-7xl font-serif text-[#E3CB8A] mb-4 text-center">Selected Works</h2>
        <div className="w-24 h-1 bg-[#315D39] mx-auto opacity-50" />
      </div>

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
    </section>
  );
}