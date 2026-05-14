"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { springs, ease } from "@/lib/animations";
import { PROJECTS } from "@/src/data/projects";

gsap.registerPlugin(ScrollTrigger);

/* ─── Tilt card ───────────────────────────────────────────────────── */
function ProjectCard({ project, index }: { project: typeof PROJECTS[number]; index: number }) {
  // FIXED: Changed to HTMLAnchorElement to match <motion.a>
  const cardRef = useRef<HTMLAnchorElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 120, damping: 20 });
  const smy = useSpring(my, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(smy, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smx, [-0.5, 0.5], [-10, 10]);
  const glowX = useTransform(smx, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(smy, [-0.5, 0.5], [0, 100]);

  // FIXED: Changed to HTMLAnchorElement
  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); setHovered(false); };

  // GSAP entrance
  useEffect(() => {
    if (!wrapRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(wrapRef.current, {
        opacity: 0,
        y: 80,
        filter: "blur(16px)",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        delay: index * 0.12,
      });
    });
    return () => ctx.revert();
  }, [index]);

  return (
    // FIXED: Added the missing wrapRef container to fix the GSAP animation and the dangling div
    <div ref={wrapRef}>
      <motion.a
        ref={cardRef}
        href={project.github}
        target="_blank"
        rel="noopener noreferrer"
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onLeave}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 900,
          transformStyle: "preserve-3d",
        }}
        className="relative group cursor-pointer block"
      >
        {/* Main card */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "var(--surface-2)",
            border: `1px solid ${hovered ? project.accent + "30" : "rgba(255,255,255,0.06)"}`,
            transition: "border-color 0.4s ease",
            minHeight: 340,
          }}
        >
          {/* Moving glow follow */}
          <motion.div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 300,
              height: 300,
              left: glowX,
              top: glowY,
              translateX: "-50%",
              translateY: "-50%",
              background: `radial-gradient(circle, ${project.accent}22 0%, transparent 65%)`,
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          />

          {/* Header */}
          <div className="relative p-6 pb-4 flex items-start justify-between">
            <span
              className="font-mono"
              style={{ fontSize: "10px", letterSpacing: "0.3em", color: "var(--foreground-subtle)" }}
            >
              {project.id}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--foreground-subtle)" }}
            >
              {project.year}
            </span>
          </div>

          {/* Title */}
          <div className="px-6 pb-4">
            <h3
              className="font-bold leading-none text-balance"
              style={{
                fontSize: "clamp(36px, 4.5vw, 60px)",
                letterSpacing: "-0.03em",
                color: hovered ? project.accent : "var(--foreground)",
                transition: "color 0.4s ease",
                whiteSpace: "pre-line",
              }}
            >
              {project.title}
            </h3>
          </div>

          {/* Divider */}
          <div
            className="mx-6"
            style={{ height: 1, background: "rgba(255,255,255,0.05)" }}
          />

          {/* Description */}
          <motion.div
            className="px-6 overflow-hidden"
            animate={{ height: hovered ? "auto" : 0, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: ease?.smooth || [0.25, 0.1, 0.25, 1] }}
            style={{ height: 0, opacity: 0 }}
          >
            <p
              className="pt-4 pb-2 leading-relaxed text-pretty"
              style={{ fontSize: "12px", color: "var(--foreground-muted)" }}
            >
              {project.desc}
            </p>
          </motion.div>

          {/* Footer row */}
          <div className="p-6 pt-4 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <span
                className="font-mono"
                style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--foreground-subtle)", textTransform: "uppercase" }}
              >
                {project.role}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono rounded-full px-2.5 py-0.5"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      color: "var(--foreground-subtle)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 shrink-0">
              {[project.stat1, project.stat2].map(({ n, l }) => (
                <div key={l} className="flex flex-col items-end gap-0.5">
                  <span
                    className="font-bold tabular-nums"
                    style={{ fontSize: "18px", color: "var(--foreground)", lineHeight: 1 }}
                  >
                    {n}
                  </span>
                  <span
                    className="font-mono"
                    style={{ fontSize: "8px", letterSpacing: "0.2em", color: "var(--foreground-subtle)" }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active bar bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)` }}
            animate={{ opacity: hovered ? 1 : 0, scaleX: hovered ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          />
        </div>

        {/* 3D shadow layer */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ transform: "translateZ(-20px)" }}
          animate={{
            boxShadow: hovered
              ? `0 40px 80px -20px ${project.accent}25, 0 0 0 1px ${project.accent}15`
              : "0 8px 30px -8px rgba(0,0,0,0.5)",
          }}
          transition={{ duration: 0.4 }}
        />
      </motion.a>
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────────── */
function SceneHeader() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.querySelectorAll("[data-reveal]"), {
        opacity: 0, y: 50, filter: "blur(10px)",
        stagger: 0.15, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 80%", toggleActions: "play none none none" },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="relative mb-16">
      {/* Background oversized label */}
      <span
        data-reveal=""
        className="absolute select-none pointer-events-none font-bold leading-none"
        style={{
          fontSize: "clamp(80px, 14vw, 180px)",
          letterSpacing: "-0.05em",
          color: "rgba(255,255,255,0.025)",
          top: "50%",
          left: "-0.04em",
          transform: "translateY(-50%)",
        }}
        aria-hidden="true"
      >
        WORK
      </span>

      <div className="relative flex items-end justify-between gap-8 flex-wrap">
        <div>
          <span
            data-reveal=""
            className="font-mono uppercase block mb-2"
            style={{ fontSize: "9px", letterSpacing: "0.4em", color: "var(--accent-cyan)" }}
          >
            Selected Projects
          </span>
          <h2
            data-reveal=""
            className="font-bold leading-none"
            style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.03em", color: "var(--foreground)" }}
          >
            What I Build
          </h2>
        </div>
        <p
          data-reveal=""
          className="max-w-xs text-pretty"
          style={{ fontSize: "12px", lineHeight: 1.7, color: "var(--foreground-muted)" }}
        >
          AI systems, autonomous robotics, cybersecurity architectures, and immersive engineering experiences.
        </p>
      </div>
    </div>
  );
}

/* ─── Exported section ────────────────────────────────────────────── */
export function WorkScene() {
  return (
    <section
      id="work"
      className="relative"
      style={{ paddingTop: "14vh", paddingBottom: "18vh", paddingLeft: "clamp(24px, 6vw, 120px)", paddingRight: "clamp(24px, 6vw, 120px)" }}
      aria-label="Work"
    >
      {/* Atmospheric divider line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 40%, rgba(0,212,255,0.12) 60%, transparent 100%)" }}
      />

      <SceneHeader />

      {/* Asymmetric grid — 2-col on large, offset alternating */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 z-10 relative">
        {PROJECTS.map((p, i) => (
          <div
            key={p.id}
            style={{ marginTop: i % 2 === 1 ? "clamp(0px, 4vw, 60px)" : 0 }}
          >
            <ProjectCard project={p} index={i} />
          </div>
        ))}
      </div>

      {/* CTA row */}
      <motion.div
        className="flex items-center justify-center mt-16 gap-6 z-10 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)", maxWidth: 200 }} />
        <a
          href="#contact"
          className="font-mono uppercase tracking-widest hover:text-white transition-colors"
          style={{ fontSize: "10px", color: "var(--foreground-subtle)" }}
        >
          View all projects —&gt;
        </a>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)", maxWidth: 200 }} />
      </motion.div>
    </section>
  );
}