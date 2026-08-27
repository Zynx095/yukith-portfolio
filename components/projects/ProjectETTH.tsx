"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS } from "@/src/data/projects";

gsap.registerPlugin(ScrollTrigger);

export function ProjectETTH() {
  const containerRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const etth = PROJECTS.find((p) => p.title === "ETTH");

  useEffect(() => {
    if (!containerRef.current || !flowRef.current || !indicatorRef.current) return;
    
    const ctx = gsap.context(() => {
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": function() {
          // Desktop: Pin the section and scrub the data flow
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=2000",
              scrub: 1,
              pin: true,
            }
          });

          // Move flow up as we scroll
          tl.to(flowRef.current, {
            y: "-100%",
            ease: "none",
          }, 0);
          
          tl.to(indicatorRef.current, {
            height: "100%",
            ease: "none",
          }, 0);

          // Highlight nodes sequentially
          nodeRefs.current.forEach((node, i) => {
            if (node) {
              const dot = node.querySelector('.pipeline-dot');
              const box = node.querySelector('.pipeline-box');
              tl.to(dot, { backgroundColor: "var(--forest-700)", scale: 1.5, ease: "none" }, i * 0.2)
                .to(box, { borderColor: "var(--forest-700)", backgroundColor: "var(--cream-100)", ease: "none" }, i * 0.2);
            }
          });
        },
        "(max-width: 767px)": function() {
          // Mobile: no pinning
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  if (!etth) return null;

  const pipeline = [
    "RAW PCAP",
    "FLOW RECONSTRUCTION",
    "TLS FINGERPRINTS",
    "BEHAVIORAL FEATURES",
    "ML PIPELINE",
  ];

  return (
    <section ref={containerRef} className="relative w-full min-h-screen overflow-hidden bg-transparent">
      {/* Soft botanical background shapes could go here if needed, but we keep it transparent as requested */}
      
      <div className="h-full min-h-screen flex flex-col md:flex-row items-center max-w-7xl mx-auto px-6 lg:px-24">
        
        {/* Left: Info */}
        <div className="flex-1 z-10 w-full pt-20 pb-10 md:pt-0 md:pb-0">
          <div className="bg-cream-100/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-sm border border-cream-300">
            <div className="font-mono text-[10px] tracking-widest text-forest-700 mb-4">
              [ ACTIVE PROJECT ]
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter mb-2 text-wood-900">
              {etth.title}
            </h2>
            <div className="text-xl font-sans text-wood-800 font-medium mb-4">
              {etth.role}
            </div>
            <p className="font-sans text-wood-800 text-sm md:text-base max-w-md mb-4">
              {etth.desc}
            </p>
            <p className="font-serif text-moss-500 text-sm max-w-md mb-8 italic">
              Key insight: encrypted traffic can be analyzed without decrypting payloads, much like understanding a tree by observing its roots.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {etth.tags.map(tech => (
                <span key={tech} className="px-3 py-1 text-[10px] font-mono border border-forest-700 rounded-full text-forest-900 bg-leaf-300/20">
                  {tech}
                </span>
              ))}
            </div>
            
            <div className="mb-8 border border-forest-700 bg-leaf-300/20 p-4 rounded-xl max-w-md">
              <div className="font-mono text-[12px] text-forest-900 font-medium">
                VERIFIED RESULT: 46/46 PASSING UNIT TESTS
              </div>
            </div>

            {etth.verifiedFeatures && (
              <div className="flex flex-col gap-2 mb-8">
                <span className="font-mono text-[9px] uppercase tracking-widest text-wood-800">Verified Capabilities</span>
                <ul className="text-xs font-sans text-wood-800 space-y-2">
                  {etth.verifiedFeatures.map((f, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-forest-700 mt-0.5">❦</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {etth.github && (
              <a 
                href={etth.github} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 border border-forest-700 bg-leaf-300/20 hover:bg-leaf-300/40 text-forest-900 font-sans text-sm transition-colors rounded-full"
              >
                View on GitHub
              </a>
            )}
          </div>
        </div>

        {/* Right: Pipeline Interactive Viz */}
        <div className="flex-1 w-full relative mt-8 md:mt-0 overflow-hidden md:h-screen md:border-l md:border-leaf-700/10 md:pl-16">
          <div ref={flowRef} className="md:absolute md:top-[20%] left-0 w-full flex flex-col gap-12 md:gap-24 md:pl-16 relative">
            
            {/* The vertical connection line - styled as a root/vine */}
            <div className="absolute left-[11px] md:left-[71px] top-4 w-0.5 h-[calc(100%-2rem)] md:h-[150%] bg-forest-700/20 -z-10 rounded-full" />
            
            {/* Scroll-progress indicator (mobile hidden, desktop managed by GSAP) - growing vine */}
            <div ref={indicatorRef} className="hidden md:block absolute left-[11px] md:left-[71px] w-0.5 h-0 top-4 bg-forest-700 -z-10 rounded-full transition-all duration-300" />

            {pipeline.map((step, i) => (
              <div 
                key={i} 
                ref={el => { nodeRefs.current[i] = el; }}
                className="relative flex items-center gap-6 group"
              >
                {/* Node - styled as a seed/node */}
                <div className="pipeline-dot w-2.5 h-2.5 rounded-full bg-sage-400 border-2 border-cream shrink-0 ml-2 md:ml-0 transition-transform group-hover:scale-150 group-hover:bg-forest-700" />
                
                {/* Flow text box */}
                <div className="pipeline-box px-6 py-4 border border-forest-700/20 bg-cream-100/80 backdrop-blur-md rounded-2xl w-full max-w-[280px] shadow-sm transition-all group-hover:shadow-md group-hover:border-forest-700/50">
                  <span className="font-sans font-medium text-sm text-wood-900">
                    {step}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
