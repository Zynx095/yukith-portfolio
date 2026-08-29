"use client";

import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS } from '@/src/data/projects';

gsap.registerPlugin(ScrollTrigger);

export default function ProjectETTH() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const project = PROJECTS.find(p => p.title === "ETTH");

  useLayoutEffect(() => {
    if (!containerRef.current || !pipelineRef.current) return;

    let ctx = gsap.context(() => {
      const stages = gsap.utils.toArray('.pipeline-stage');

      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=200%",
              pin: true,
              scrub: 1,
            }
          });

          stages.forEach((stage: any, i) => {
            tl.to(stage, {
              opacity: 1,
              scale: 1,
              duration: 1,
              ease: "power2.inOut",
            })
            .to(stage, {
              color: "#B99755", // Gold
              duration: 0.5,
            }, "<")
            if (i < stages.length - 1) {
              tl.to(stage, { opacity: 0.3, scale: 0.9, duration: 1 }, "+=0.5");
            }
          });
        },
        "(max-width: 767px)": () => {
          gsap.set(stages, { opacity: 1, scale: 1 });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (!project) return null;

  return (
    <section 
      ref={containerRef}
      className="min-h-screen relative flex items-center justify-center py-20 px-4"
      style={{ backgroundColor: '#0D0A08', color: '#F4F1EA' }}
    >
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="z-10">
          <p className="text-[#B99755] font-mono text-sm mb-4 tracking-widest">[ DEPLOYED SYSTEM ]</p>
          <h2 className="text-4xl md:text-6xl font-serif mb-6 text-[#E3CB8A]">{project.title}</h2>
          <p className="text-xl font-serif text-[#D8C9A8] mb-4">{project.role}</p>
          <p className="text-base text-[#D8C9A8]/80 mb-8 max-w-lg font-sans leading-relaxed">
            {project.desc}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.map(tag => (
              <span key={tag} className="px-3 py-1 border border-[#315D39]/30 rounded-full text-xs font-mono text-[#D8C9A8]">
                {tag}
              </span>
            ))}
          </div>

          <div className="border-t border-[#3A2417] pt-6">
            <h3 className="text-[#B99755] font-serif mb-4">Verified Features</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-sans text-[#D8C9A8]/70">
              {project.verifiedFeatures?.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#315D39] mt-1">✓</span> {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={pipelineRef} className="relative z-10 flex flex-col items-center justify-center space-y-4 md:space-y-8 font-mono text-sm md:text-base">
          <div className="absolute inset-0 border-l border-dashed border-[#3A2417] left-1/2 -translate-x-1/2 -z-10" />
          
          {['RAW PCAP', 'FLOW RECONSTRUCTION', 'TLS FINGERPRINTS', 'BEHAVIORAL FEATURES', 'ML PIPELINE'].map((stage, i) => (
            <div key={i} className="pipeline-stage bg-[#15100C] border border-[#51321E] px-6 py-4 rounded shadow-xl text-[#D8C9A8] text-center w-64 md:opacity-30 md:scale-90 transition-colors">
              {stage}
            </div>
          ))}
          <div className="mt-8 text-center bg-[#0B2116] border border-[#1D4A2B] px-6 py-4 rounded text-[#B99755] font-bold">
            THREAT DETECTED
          </div>
        </div>
      </div>
    </section>
  );
}
