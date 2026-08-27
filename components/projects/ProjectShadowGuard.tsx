"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { PROJECTS } from "@/src/data/projects";

type DataType = "Document" | "Image" | "Prompt" | null;

export function ProjectShadowGuard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeData, setActiveData] = useState<DataType>(null);
  const [pipelineState, setPipelineState] = useState(0);
  
  const shadowGuard = PROJECTS.find((p) => p.title === "ShadowGuard");

  const handleDataClick = (type: DataType) => {
    if (activeData) return;
    setActiveData(type);
    setPipelineState(1);
    
    setTimeout(() => setPipelineState(2), 1000);
    setTimeout(() => setPipelineState(3), 2000);
    setTimeout(() => setPipelineState(4), 3000);
    setTimeout(() => {
      setActiveData(null);
      setPipelineState(0);
    }, 4000);
  };

  if (!shadowGuard) return null;

  return (
    <section ref={containerRef} className="relative w-full min-h-screen overflow-hidden bg-transparent">
      <div className="h-full min-h-screen flex flex-col md:flex-row items-center max-w-7xl mx-auto px-6 lg:px-24">
        
        {/* Left: Info */}
        <div className="flex-1 z-10 w-full pt-20 pb-10 md:pt-0 md:pb-0">
          <div className="bg-cream-100/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-sm border border-cream-300">
            <div className="font-mono text-[10px] tracking-widest text-forest-700 mb-4">
              [ ECOSYSTEM PROTECTOR ]
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter mb-2 text-wood-900">
              {shadowGuard.title}
            </h2>
            <div className="text-xl font-sans text-wood-800 font-medium mb-4">
              {shadowGuard.role}
            </div>
            <p className="font-sans text-wood-800 text-sm md:text-base max-w-md mb-8">
              {shadowGuard.desc}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {shadowGuard.tags.map(tech => (
                <span key={tech} className="px-3 py-1 text-[10px] font-mono border border-forest-700 rounded-full text-forest-900 bg-leaf-300/20">
                  {tech}
                </span>
              ))}
            </div>
            
            <div className="p-5 border border-forest-700 bg-leaf-300/20 backdrop-blur-sm rounded-2xl max-w-sm mb-8 shadow-sm">
              <span className="font-sans text-[11px] font-bold uppercase text-forest-900 block mb-2 flex items-center gap-2">
                <span className="text-forest-700">✿</span> Natural Boundary
              </span>
              <p className="text-sm font-sans text-moss-500 leading-relaxed">
                This prototype acts as a natural membrane, allowing healthy elements to pass through while filtering out harmful toxins based on strict ecological policies.
              </p>
            </div>

            {shadowGuard.github && (
              <a 
                href={shadowGuard.github} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 border border-forest-700 bg-leaf-300/20 hover:bg-leaf-300/40 text-forest-900 font-sans text-sm transition-colors rounded-full"
              >
                View on GitHub
              </a>
            )}

            <div className="mt-8 pt-8 border-t border-forest-700/20">
              <span className="font-mono text-[10px] uppercase tracking-widest text-wood-500 block mb-4">Inject Test Payload</span>
              <div className="flex gap-4">
                {["Document", "Image", "Prompt"].map(type => (
                  <button
                    key={type}
                    onClick={() => handleDataClick(type as DataType)}
                    disabled={activeData !== null}
                    className="px-4 py-2 text-xs font-sans font-medium border border-forest-700 rounded-lg text-forest-900 bg-cream-100 hover:bg-leaf-300/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Natural Boundary Visualization */}
        <div className="flex-1 w-full min-h-[400px] md:h-screen relative mt-8 md:mt-0 flex flex-col md:block justify-center items-center py-10 md:py-0">
          <div className="w-full max-w-md relative flex flex-col gap-12">
            
            {/* Stem */}
            <div className="absolute top-4 bottom-4 left-[38px] w-0.5 bg-forest-700/20 rounded-full -z-10" />

            {/* Entity */}
            <motion.div
              className="absolute left-[22px] w-8 h-8 rounded-full border-2 bg-cream-100 shadow-md flex items-center justify-center z-20"
              initial={{ top: "-10%", opacity: 0, borderColor: "var(--forest-700)" }}
              animate={{
                top: activeData ? `${pipelineState * 25}%` : "-10%",
                opacity: activeData ? (pipelineState === 4 ? 0 : 1) : 0,
                borderColor: pipelineState >= 3 && activeData === "Prompt" ? "var(--earth-600)" : "var(--forest-700)",
                backgroundColor: pipelineState >= 3 && activeData === "Prompt" ? "var(--earth-200)" : "var(--cream-100)"
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <span className="text-[10px]">{activeData === "Document" ? "📄" : activeData === "Image" ? "🖼️" : "💬"}</span>
            </motion.div>

            {[
              { label: "Policy", desc: "Context Check" },
              { label: "Detection", desc: "DLP Scanning" },
              { label: "Decision", desc: "Allow / Block" },
              { label: "Response", desc: "Audit Log" }
            ].map((node, i) => (
              <div key={i} className="relative flex items-center gap-8 pl-6">
                <div className={`w-4 h-4 rounded-full border-2 bg-cream-100 transition-colors duration-500 ${pipelineState > i ? 'border-forest-700 bg-forest-700' : 'border-forest-700/30'}`} />
                <div className={`flex-1 p-5 border rounded-2xl bg-cream-100/80 backdrop-blur-md transition-all duration-500 ${pipelineState === i + 1 ? 'border-forest-700 shadow-md scale-105' : 'border-forest-700/20 shadow-sm'}`}>
                  <div className="font-sans text-sm font-semibold text-wood-900">{node.label}</div>
                  <div className="font-sans text-xs text-wood-600">{node.desc}</div>
                </div>
              </div>
            ))}

          </div>

        </div>
      </div>
    </section>
  );
}
