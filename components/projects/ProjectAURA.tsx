"use client";

import React, { useRef, useState, useEffect } from 'react';
import { PROJECTS } from '@/src/data/projects';
import { Github } from 'lucide-react';

export default function ProjectAURA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  
  const project = PROJECTS.find(p => p.title === "AURA");

  const stateColors = {
    NORMAL: '#315D39', // Forest light
    OBSERVED: '#B99755', // Gold
    SUSPICIOUS: '#ff4b4b' // Red/Alert
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || !crosshairRef.current || !statusRef.current) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    crosshairRef.current.style.left = `${x}%`;
    crosshairRef.current.style.top = `${y}%`;

    const distanceToCenter = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
    
    let newState: 'NORMAL' | 'OBSERVED' | 'SUSPICIOUS' = 'NORMAL';
    if (distanceToCenter < 15) {
      newState = 'SUSPICIOUS';
    } else if (distanceToCenter < 35) {
      newState = 'OBSERVED';
    }

    const color = stateColors[newState];
    crosshairRef.current.style.borderColor = color;
    crosshairRef.current.style.boxShadow = `0 0 20px ${color}40`;
    
    statusRef.current.textContent = `STATUS: ${newState}`;
    statusRef.current.style.color = color;
    statusRef.current.style.borderColor = color;
  };

  if (!project) return null;

  return (
    <section 
      className="min-h-screen relative flex items-center justify-center py-20 px-4 overflow-hidden"
      style={{ backgroundColor: '#0D0A08', color: '#F4F1EA' }}
    >
      <div 
        ref={containerRef}
        className="absolute inset-0 z-0 opacity-20 cursor-crosshair touch-none"
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerMove}
      >
        <div 
          ref={crosshairRef}
          className="absolute w-32 h-32 border-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none"
          style={{ 
            left: `50%`, 
            top: `50%`,
            borderColor: stateColors.NORMAL,
            boxShadow: `0 0 20px ${stateColors.NORMAL}40`
          }}
        >
          <div className="absolute top-1/2 left-0 w-full h-px bg-current opacity-50" />
          <div className="absolute left-1/2 top-0 w-px h-full bg-current opacity-50" />
        </div>
        
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-dashed border-[#B99755]/30 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#ff4b4b]/30 rounded-full bg-[#ff4b4b]/5 pointer-events-none" />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 pointer-events-none">
        <div>
          <div 
            ref={statusRef}
            className="inline-block px-3 py-1 mb-6 border font-mono text-sm rounded transition-colors duration-300"
            style={{ borderColor: stateColors.NORMAL, color: stateColors.NORMAL }}
          >
            STATUS: NORMAL
          </div>
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

          {project.github && (
            <a 
              href={project.github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#15100C] hover:bg-[#3A2417] border border-[#51321E] text-[#E3CB8A] rounded transition-colors pointer-events-auto min-h-[44px]"
            >
              <Github size={20} />
              <span className="font-mono text-sm">View Repository</span>
            </a>
          )}
        </div>

        <div className="bg-[#15100C]/80 backdrop-blur-md border border-[#51321E] p-8 rounded-lg shadow-2xl pointer-events-auto">
          <h3 className="text-[#B99755] font-serif mb-4 text-xl border-b border-[#3A2417] pb-2">Verified Features</h3>
          <ul className="space-y-3 text-sm font-sans text-[#D8C9A8]">
            {project.verifiedFeatures?.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <span className="text-[#315D39] mt-0.5 group-hover:text-[#B99755] transition-colors">⚡</span> 
                <span className="opacity-80 group-hover:opacity-100 transition-opacity">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
