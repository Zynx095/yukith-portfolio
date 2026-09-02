"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useInteractionContext } from "@/hooks/useInteraction";
import { STORY_ZONES } from "@/src/data/storyZones";
import { PROJECTS } from "@/src/data/projects";
import { achievementsData } from "@/src/data/achievements";
import { leadershipData } from "@/src/data/leadership";
import { experienceData } from "@/src/data/experience";
import { personalStory } from "@/src/data/personal";

// Replaced parchment texture generator with holographic grid generator
function createHolographicGrid() {
  if (typeof window === "undefined") return null;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, size);
  ctx.moveTo(size, 0);
  ctx.lineTo(size, size);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

interface DetailPanelProps {
  zoneId: string;
  onClose: () => void;
}

export function DetailPanel({ zoneId, onClose }: DetailPanelProps) {
  const config = STORY_ZONES.find((z) => z.id === zoneId);
  if (!config) return null;

  const accentColor = config.type === "project" ? getProjectAccent(config.id) : "#B99755";
  const borderColor = `${accentColor}40`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-end pr-8 md:pr-16 pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={zoneId}
          initial={{ opacity: 0, x: 100, filter: "blur(10px)", scale: 0.95 }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, x: 60, filter: "blur(10px)", scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-auto max-w-2xl w-full"
        >
          <div
            className="relative bg-black/30 backdrop-blur-2xl rounded-lg border border-white/5 overflow-hidden"
            style={{ 
              boxShadow: `0 30px 100px rgba(0,0,0,0.8), 0 0 60px ${accentColor}20, inset 0 0 30px ${accentColor}15`
            }}
          >
            {/* Holographic grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
              style={{
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />

            {/* Corner UI elements */}
            <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none" style={{ borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}`, opacity: 0.8 }} />
            <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none" style={{ borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}`, opacity: 0.8 }} />
            <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none" style={{ borderTop: `2px solid ${accentColor}`, opacity: 0.3 }} />
            <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none" style={{ borderBottom: `2px solid ${accentColor}`, opacity: 0.3 }} />

            {/* Scanning line effect */}
            <motion.div 
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, opacity: 0.5 }}
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            />

            <div className="relative p-10 md:p-12 z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
                    <p className="font-mono text-xs uppercase tracking-[0.4em]" style={{ color: accentColor }}>
                      {config.subtitle || config.type}
                    </p>
                  </div>
                  <h2 className="font-sans font-light text-4xl md:text-5xl text-white tracking-tight drop-shadow-md">
                    {config.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="group relative ml-4 px-4 py-2 overflow-hidden border border-white/10 hover:border-white/30 rounded-sm transition-all"
                  aria-label="Close panel"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative font-mono text-[10px] uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                    Close [ESC]
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/5 mb-8 relative">
                <div className="absolute left-0 top-0 h-full w-1/3" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
              </div>

              {/* Content */}
              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* Overview */}
                <section>
                  <p className="font-sans font-light text-white/80 text-lg leading-relaxed">
                    {config.description}
                  </p>
                </section>

                {/* Problem */}
                {config.problem && (
                  <section className="bg-black/20 p-6 rounded-sm border border-white/5">
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-4 text-white/40">
                      The Problem
                    </h3>
                    <p className="font-sans text-white/70 text-base leading-relaxed">
                      {config.problem}
                    </p>
                  </section>
                )}

                {/* Approach */}
                {config.approach && (
                  <section className="bg-black/20 p-6 rounded-sm border border-white/5">
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-4 text-white/40">
                      The Approach
                    </h3>
                    <p className="font-sans text-white/70 text-base leading-relaxed">
                      {config.approach}
                    </p>
                  </section>
                )}

                {/* Engineering */}
                {config.engineering && (
                  <section className="bg-black/20 p-6 rounded-sm border border-white/5">
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-4 text-white/40">
                      Engineering
                    </h3>
                    <p className="font-sans text-white/70 text-base leading-relaxed">
                      {config.engineering}
                    </p>
                  </section>
                )}

                {/* Technology & Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {config.technology && config.technology.length > 0 && (
                    <section>
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4 text-white/40">
                        Tech Stack
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {config.technology.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1.5 text-xs font-mono rounded-sm border bg-black/40 text-white/80"
                            style={{ borderColor: `${accentColor}30` }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {config.features && config.features.length > 0 && (
                    <section>
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4 text-white/40">
                        Key Features
                      </h3>
                      <ul className="space-y-3">
                        {config.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 font-sans text-sm text-white/70">
                            <span className="mt-1.5 w-1 h-1 bg-white/50 rounded-full shrink-0" />
                            <span className="leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                {/* Links */}
                {config.links && config.links.length > 0 && (
                  <section className="pt-6 border-t border-white/5">
                    <div className="flex flex-wrap gap-4">
                      {config.links.map((link) => (
                         <a
                         key={link.label}
                         href={link.url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="group flex items-center gap-3 px-6 py-3 border rounded-sm transition-all relative overflow-hidden"
                         style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
                       >
                         <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${accentColor}20` }} />
                         <span className="relative font-mono text-xs uppercase tracking-widest text-white/90">{link.label}</span>
                         <span className="relative text-white/50 group-hover:translate-x-1 transition-transform">→</span>
                       </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Backdrop dim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[-1]"
          onClick={onClose}
        />
      </AnimatePresence>
    </div>
  );
}

function getProjectAccent(projectId: string): string {
  // Check by exact ID match
  let project = PROJECTS.find((p) => p.id === projectId);
  if (project) return project.accent;

  // Check by title match (normalize for comparison)
  const normalizedId = projectId.toLowerCase().replace(/[^a-z0-9]/g, '');
  project = PROJECTS.find((p) => {
    const normalizedTitle = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalizedTitle === normalizedId || p.title.toLowerCase().includes(projectId.toLowerCase());
  });
  if (project) return project.accent;

  return "#B995";
}

export function useZoneExplorer() {
  const { activeZone, openPanel, closePanel, isPanelOpen } = useInteractionContext();

  useEffect(() => {
    const handleExplore = (e: Event) => {
      const zoneId = (e as CustomEvent).detail;
      if (zoneId) openPanel(zoneId);
    };
    window.addEventListener("explore-zone", handleExplore);
    return () => window.removeEventListener("explore-zone", handleExplore);
  }, [openPanel]);

  return { activeZone, isPanelOpen, closePanel };
}
