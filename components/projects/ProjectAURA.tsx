"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useSpring } from "framer-motion";
import { PROJECTS } from "@/src/data/projects";

type AuraState = "NORMAL" | "OBSERVED" | "SUSPICIOUS";

export function ProjectAURA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<AuraState>("NORMAL");
  const [inputPos, setInputPos] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  // Smooth springs for tracking the bounding box (tuned to slightly lag the cursor)
  const trackX = useSpring(0, { stiffness: 40, damping: 15, mass: 1.2 });
  const trackY = useSpring(0, { stiffness: 40, damping: 15, mass: 1.2 });

  const aura = PROJECTS.find((p) => p.title === "AURA");

  // Zone coordinates (normalized 0-1) for the detection region
  const zone = {
    xMin: 0.4,
    xMax: 0.9,
    yMin: 0.4,
    yMax: 0.9
  };

  useEffect(() => {
    trackX.set(inputPos.x);
    trackY.set(inputPos.y);
  }, [inputPos, trackX, trackY]);

  const handlePointerMove = (x: number, y: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    setInputPos({ x: relativeX, y: relativeY });

    // Calculate state based on zone intrusion
    const normX = relativeX / rect.width;
    const normY = relativeY / rect.height;

    const inZone = (normX >= zone.xMin && normX <= zone.xMax && normY >= zone.yMin && normY <= zone.yMax);

    if (inZone) {
      if (state === "NORMAL") setState("OBSERVED");
      // Simulate progression to suspicious if staying in zone
      const timer = setTimeout(() => {
        setState(prev => prev === "OBSERVED" ? "SUSPICIOUS" : prev);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setState("NORMAL");
    }
  };

  if (!aura) return null;

  const getStateColors = () => {
    switch(state) {
      case "NORMAL": return { text: "text-forest-900", border: "border-forest-900", bg: "bg-forest-900/10", tag: "bg-forest-700 text-cream-100" };
      case "OBSERVED": return { text: "text-earth-500", border: "border-earth-500", bg: "bg-earth-500/10", tag: "bg-earth-500 text-cream-100" };
      case "SUSPICIOUS": return { text: "text-earth-600", border: "border-earth-600", bg: "bg-earth-600/20", tag: "bg-earth-600 text-cream-100" };
    }
  };

  const colors = getStateColors();

  return (
    <section className="relative w-full min-h-screen bg-transparent py-32 overflow-hidden flex items-center">
      
      <div className="max-w-7xl mx-auto px-6 lg:px-24 w-full flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Left: Info */}
        <div className="flex-1 w-full z-10 bg-cream-100/80 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-cream-300">
          <div className="font-sans text-[10px] tracking-widest text-forest-700 mb-4 uppercase">
            [ Active Project ]
          </div>
          <h2 className="text-4xl md:text-6xl font-serif font-medium tracking-tight mb-2 text-forest-900">
            {aura.title}
          </h2>
          <div className="text-xl font-sans text-wood-700 font-medium mb-4">
            {aura.role}
          </div>
          <p className="font-sans text-wood-700 text-sm md:text-base max-w-md mb-8">
            {aura.desc}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {aura.tags.map(tech => (
              <span key={tech} className="px-3 py-1 text-[10px] font-sans uppercase tracking-widest border border-forest-700/20 rounded-full text-forest-900 bg-leaf-300/20">
                {tech}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <span className="font-sans text-[10px] uppercase tracking-widest text-wood-500">State Machine Pipeline</span>
            <div className="flex items-center gap-2 font-sans text-xs text-wood-600">
               <span className={state === "NORMAL" ? "text-forest-900 font-bold" : ""}>NORMAL</span>
               <span className="opacity-50 text-wood-400">→</span>
               <span className={state === "OBSERVED" ? "text-earth-500 font-bold" : ""}>OBSERVED</span>
               <span className="opacity-50 text-wood-400">→</span>
               <span className={state === "SUSPICIOUS" ? "text-earth-600 font-bold" : ""}>SUSPICIOUS</span>
            </div>
          </div>

          {aura.github && (
            <a 
              href={aura.github} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 border border-forest-700 hover:bg-forest-700 text-forest-900 hover:text-cream-100 font-sans text-sm transition-colors rounded-full"
            >
              View Source
            </a>
          )}
        </div>

        {/* Right: Technical Tracking Visualization */}
        <div 
          ref={containerRef}
          className="flex-1 w-full aspect-square md:aspect-[4/3] bg-cream-100 relative rounded-2xl overflow-hidden cursor-crosshair group touch-none border border-cream-300 shadow-sm"
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => { setIsInteracting(false); setState("NORMAL"); }}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onTouchStart={(e) => { setIsInteracting(true); if(e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchMove={(e) => { if(e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchEnd={() => { setIsInteracting(false); setState("NORMAL"); }}
        >
          {/* Subtle grid to indicate technical space, but in wood tones */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(var(--wood-900) 1px, transparent 1px), linear-gradient(90deg, var(--wood-900) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          {/* Detection Zone (Polygon simulation) */}
          <div 
            className="absolute border border-dashed transition-colors duration-500 pointer-events-none flex items-center justify-center"
            style={{ 
              left: `${zone.xMin * 100}%`, 
              top: `${zone.yMin * 100}%`, 
              width: `${(zone.xMax - zone.xMin) * 100}%`, 
              height: `${(zone.yMax - zone.yMin) * 100}%`,
              borderColor: state === "NORMAL" ? "var(--sage-400)" : "var(--earth-500)",
              backgroundColor: state === "NORMAL" ? "transparent" : "var(--earth-500)",
              opacity: state === "NORMAL" ? 0.3 : 0.05
            }}
          >
            <span className="font-sans text-[10px] uppercase tracking-widest text-wood-500 opacity-50">Monitoring Zone</span>
          </div>

          {/* Object Bounding Box */}
          <motion.div 
            className={`absolute pointer-events-none border-2 z-20 flex flex-col justify-end transition-colors duration-300 ${colors.border} ${colors.bg}`}
            style={{ 
              left: trackX, top: trackY, 
              width: 120, height: 160,
              x: "-50%", y: "-50%",
            }}
            animate={{ opacity: isInteracting ? 1 : 0, scale: isInteracting ? 1 : 0.8 }}
          >
            {/* HUD details for the box */}
            <div className={`absolute -top-6 left-0 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${colors.tag}`}>
              PERSON // ID:07
            </div>
            
            <div className={`w-full p-1 text-[8px] font-mono uppercase bg-white/50 backdrop-blur-sm ${colors.text} border-t ${colors.border}`}>
              CONF: 0.94<br/>
              STATE: {state}
            </div>
          </motion.div>

          {/* Status Overlay */}
          <div className="absolute top-4 right-4 flex flex-col items-end pointer-events-none z-10">
            <span className="font-sans text-[10px] tracking-widest text-wood-500 uppercase mb-1">System State</span>
            <div className={`px-3 py-1 font-sans font-medium text-[10px] tracking-widest uppercase rounded-sm transition-colors ${colors.tag}`}>
              {state}
            </div>
          </div>
          
          <div className="absolute bottom-4 left-4 font-sans text-[9px] text-wood-400 uppercase pointer-events-none z-10">
            YOLOv8 // FASTAPI // CENTROID TRACKING
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500" style={{ opacity: isInteracting ? 0 : 1 }}>
            <span className="font-sans text-xs uppercase tracking-widest text-forest-900 bg-cream-100/90 px-6 py-3 rounded-full backdrop-blur-md shadow-sm border border-forest-700/20">
              Interact to Track
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
