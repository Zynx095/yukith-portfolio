"use client";

import React from 'react';
import { PROJECTS } from '@/src/data/projects';
import { Github, Mic } from 'lucide-react';

export default function ProjectSugarAI() {
  const project = PROJECTS.find(p => p.title === "Sugar AI");

  if (!project) return null;

  return (
    <section 
      className="min-h-screen relative flex items-center justify-center py-24 px-4"
      style={{ backgroundColor: '#0D0A08', color: '#F4F1EA' }}
    >
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <p className="text-[#315D39] font-mono text-sm mb-4 tracking-widest">[ OFFLINE SYSTEM ]</p>
          <h2 className="text-4xl md:text-6xl font-serif mb-6 text-[#E3CB8A]">{project.title}</h2>
          <p className="text-xl font-serif text-[#D8C9A8] max-w-2xl mx-auto">{project.role}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <p className="text-base text-[#D8C9A8]/80 mb-8 font-sans leading-relaxed">
              {project.desc}
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#15100C] hover:bg-[#3A2417] border border-[#51321E] text-[#E3CB8A] rounded transition-colors min-h-[44px]"
              >
                <Github size={20} />
                <span className="font-mono text-sm">View Source</span>
              </a>
            )}
          </div>

          <div className="lg:col-span-7 bg-[#15100C] border border-[#3A2417] rounded-xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
              <div className="w-full h-32 flex items-center justify-center gap-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-[#B99755] rounded-full"
                    style={{ 
                      height: `${20 + Math.sin(i * 0.5) * 40 + Math.cos(i * 0.2) * 20}%`,
                      opacity: 0.5 + Math.sin(i * 0.3) * 0.5
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#1D4A2B] flex items-center justify-center text-[#E3CB8A] shadow-[0_0_30px_rgba(49,93,57,0.5)]">
                  <Mic size={32} />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left font-mono text-sm text-[#D8C9A8]">
                <div className="flex-1 bg-[#0D0A08] p-4 rounded border border-[#51321E]">
                  <span className="block text-[#B99755] mb-2 text-xs">1. INPUT</span>
                  USER VOICE
                </div>
                <div className="hidden md:block text-[#315D39]">→</div>
                <div className="flex-1 bg-[#0D0A08] p-4 rounded border border-[#51321E]">
                  <span className="block text-[#B99755] mb-2 text-xs">2. STT & LLM</span>
                  WHISPER + OLLAMA
                </div>
                <div className="hidden md:block text-[#315D39]">→</div>
                <div className="flex-1 bg-[#0D0A08] p-4 rounded border border-[#51321E]">
                  <span className="block text-[#B99755] mb-2 text-xs">3. OUTPUT</span>
                  MELOTTS
                </div>
              </div>

              <div className="mt-12 border-t border-[#3A2417] pt-8">
                <h3 className="text-[#B99755] font-serif mb-6 text-center">Core Capabilities</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans text-[#D8C9A8]/80">
                  {project.verifiedFeatures?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 bg-[#0D0A08]/50 p-3 rounded">
                      <div className="w-2 h-2 rounded-full bg-[#E3CB8A]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
