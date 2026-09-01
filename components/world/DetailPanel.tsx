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

function createParchmentTexture() {
  if (typeof window === "undefined") return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#1A1510";
  ctx.fillRect(0, 0, size, size);

  // Subtle grain
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = Math.random() * 0.03;
    ctx.fillStyle = `rgba(212, 190, 150, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Subtle edge darkening
  const gradient = ctx.createRadialGradient(size/2, size/2, size*0.3, size/2, size/2, size*0.7);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.15)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
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
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="pointer-events-auto max-w-xl w-full"
        >
          <div
            className="relative bg-[#1A2A15]/97 rounded-sm border border-[#3A5A35]/40 shadow-[0_20px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(58,90,53,0.15)] overflow-hidden"
            style={{ borderLeft: `3px solid ${accentColor}` }}
          >
            {/* Parchment texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
              }}
            />

            {/* Top accent line */}
            <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

            <div className="p-8 md:p-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p
                    className="font-mono text-xs uppercase tracking-[0.3em] mb-2"
                    style={{ color: accentColor }}
                  >
                    {config.subtitle || config.type}
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl text-white tracking-wide">
                    {config.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 px-3 py-1.5 font-mono text-xs uppercase tracking-widest border border-[#3A5A35] text-[#8BA0B5] hover:text-[#E3CB8A] hover:border-[#3A5A35]/80 rounded-sm transition-colors"
                  aria-label="Close panel"
                >
                  Close [ESC]
                </button>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-[#3A5A35]/30 to-transparent mb-6" />

              {/* Content */}
              <div className="space-y-6">
                {/* Overview */}
                <section>
                  <h3
                    className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
                    style={{ color: accentColor }}
                  >
                    Overview
                  </h3>
                  <p className="font-sans text-[#E8DDD0] text-base leading-relaxed">
                    {config.description}
                  </p>
                </section>

                {/* Problem */}
                {config.problem && (
                  <section>
                    <h3
                      className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
                      style={{ color: accentColor }}
                    >
                      The Problem
                    </h3>
                    <p className="font-sans text-[#C8B8A8] text-sm leading-relaxed">
                      {config.problem}
                    </p>
                  </section>
                )}

                {/* Approach */}
                {config.approach && (
                  <section>
                    <h3
                      className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
                      style={{ color: accentColor }}
                    >
                      The Approach
                    </h3>
                    <p className="font-sans text-[#C8B8A8] text-sm leading-relaxed">
                      {config.approach}
                    </p>
                  </section>
                )}

                {/* Engineering */}
                {config.engineering && (
                  <section>
                    <h3
                      className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
                      style={{ color: accentColor }}
                    >
                      Engineering
                    </h3>
                    <p className="font-sans text-[#C8B8A8] text-sm leading-relaxed">
                      {config.engineering}
                    </p>
                  </section>
                )}

                {/* Technology */}
                {config.technology && config.technology.length > 0 && (
                  <section>
                    <h3
                      className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
                      style={{ color: accentColor }}
                    >
                      Technology
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {config.technology.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1.5 text-xs font-mono rounded-sm border"
                          style={{
                            backgroundColor: "#1A0D2E",
                            borderColor: `${accentColor}40`,
                            color: "#CCBBEE",
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Features */}
                {config.features && config.features.length > 0 && (
                  <section>
                    <h3
                      className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
                      style={{ color: accentColor }}
                    >
                      Key Details
                    </h3>
                    <ul className="space-y-2.5">
                      {config.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 font-sans text-sm text-[#D8C8B8]">
                          <span
                            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: accentColor }}
                          />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Links */}
                {config.links && config.links.length > 0 && (
                  <section className="pt-4">
                    <div className="flex flex-wrap gap-3">
                      {config.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-widest border rounded-sm transition-all"
                          style={{
                            borderColor: `${accentColor}60`,
                            color: accentColor,
                            backgroundColor: `${accentColor}10`,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = `${accentColor}20`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = `${accentColor}10`;
                          }}
                        >
                          <span>{link.label}</span>
                          <span>→</span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* Bottom accent */}
            <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}50)` }} />
          </div>
        </motion.div>

        {/* Backdrop dim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0A1A10]/70 backdrop-blur-sm z-[-1]"
          onClick={onClose}
        />
      </AnimatePresence>
    </div>
  );
}

function getProjectAccent(projectId: string): string {
  const project = PROJECTS.find((p) => p.id === projectId || p.title.toLowerCase() === projectId);
  if (project) return project.accent;
  return "#B99755";
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
