"use client";

import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS } from '@/src/data/projects';
import { Github } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ProjectShadowGuard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const project = PROJECTS.find(p => p.title === "ShadowGuard");

  useLayoutEffect(() => {
    if (!containerRef.current || !flowRef.current) return;

    let ctx = gsap.context(() => {
      const items = gsap.utils.toArray('.flow-item');
      const lines = gsap.utils.toArray('.flow-line');

      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=150%",
              pin: true,
              scrub: 1,
            }
          });

          items.forEach((item: any, i) => {
            tl.to(item, {
              backgroundColor: "#1D4A2B",
              borderColor: "#315D39",
              color: "#E3CB8A",
              duration: 1
            });
            if (i < lines.length) {
              tl.to(lines[i] as any, {
                scaleY: 1,
                opacity: 1,
                duration: 1
              });
            }
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (!project) return null;

  const flowSteps = ['PAYLOAD', 'IAM', 'DLP', 'POLICY', 'DECISION'];

  return (
    <section 
      ref={containerRef}
      className="min-h-screen relative flex items-center justify-center py-20 px-4"
      style={{ backgroundColor: '#0D0A08', color: '#F4F1EA' }}
    >
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[#D8C9A8] bg-[#3A2417] inline-block px-3 py-1 rounded font-mono text-xs mb-4 tracking-wider">
            [ EXPERIMENTAL PROTOTYPE ]
          </p>
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

          <div className="mb-8">
            <h3 className="text-[#B99755] font-serif mb-4">Architecture Features</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-sans text-[#D8C9A8]/70">
              {project.verifiedFeatures?.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#315D39]" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {project.github && (
            <a 
              href={project.github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#15100C] hover:bg-[#3A2417] border border-[#51321E] text-[#E3CB8A] rounded transition-colors min-h-[44px]"
            >
              <Github size={20} />
              <span className="font-mono text-sm">View Concept Repository</span>
            </a>
          )}
        </div>

        <div ref={flowRef} className="relative flex flex-col items-center py-10">
          {flowSteps.map((step, i) => (
            <React.Fragment key={i}>
              <div className="flow-item w-48 py-4 bg-[#0D0A08] border-2 border-[#15100C] rounded text-center font-mono text-sm text-[#51321E] transition-colors relative z-10">
                {step}
              </div>
              {i < flowSteps.length - 1 && (
                <div className="flow-line w-0.5 h-12 bg-[#B99755] origin-top opacity-30 md:opacity-0 md:scale-y-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
