"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { AtmosphericBG } from "@/components/AtmosphericBG";
import { CustomCursor } from "@/components/CustomCursor";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { WorkScene } from "@/components/WorkScene";
import { AboutScene } from "@/components/AboutScene";

gsap.registerPlugin(ScrollTrigger);

/* ─── Contact Scene ───────────────────────────────────────────────── */
function ContactScene() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.querySelectorAll("[data-contact-reveal]"), {
        opacity: 0, y: 60, filter: "blur(12px)",
        stagger: 0.12, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 75%", toggleActions: "play none none none" },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      id="contact"
      className="relative overflow-hidden"
      style={{
        paddingTop: "14vh",
        paddingBottom: "18vh",
        paddingLeft: "clamp(24px, 6vw, 120px)",
        paddingRight: "clamp(24px, 6vw, 120px)",
      }}
      aria-label="Contact"
    >
      {/* Atmospheric divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)" }}
      />

      {/* Environmental oversized text */}
      <div
        className="absolute select-none pointer-events-none overflow-hidden"
        style={{ bottom: "-5%", right: "-5%", zIndex: 0 }}
        aria-hidden="true"
      >
        <span
          className="font-bold leading-none"
          style={{
            fontSize: "clamp(80px, 18vw, 240px)",
            letterSpacing: "-0.06em",
            color: "rgba(255,255,255,0.016)",
            whiteSpace: "nowrap",
          }}
        >
          CONTACT
        </span>
      </div>

      <div className="relative z-10 flex flex-col xl:flex-row gap-16 xl:gap-32 items-start">
        {/* Left */}
        <div style={{ maxWidth: 500 }}>
          <span
            data-contact-reveal=""
            className="font-mono uppercase block mb-3"
            style={{ fontSize: "9px", letterSpacing: "0.4em", color: "var(--accent-cyan)" }}
          >
            Open Channel
          </span>
          <h2
            data-contact-reveal=""
            className="font-bold leading-none mb-6"
            style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Let&apos;s Build<br />
            <span style={{ color: "var(--accent-silver)" }}>Something</span><br />
            Extraordinary
          </h2>
          <p
            data-contact-reveal=""
            className="leading-relaxed text-pretty mb-8"
            style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--foreground-muted)", maxWidth: 380 }}
          >
            Whether you have an ambitious project in mind, want to collaborate on
            something experimental, or just want to talk shop — my inbox is open.
          </p>
          <div data-contact-reveal="" className="flex flex-wrap gap-3">
            <motion.a
              href="mailto:hello@yukith.dev"
              className="font-mono uppercase rounded-full px-7 py-3 text-[#111113] bg-[var(--accent-cyan)]"
              style={{ fontSize: "11px", letterSpacing: "0.2em" }}
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(0,212,255,0.4)" }}
              whileTap={{ scale: 0.97 }}
            >
              Send Message
            </motion.a>
            <motion.a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono uppercase rounded-full px-7 py-3"
              style={{
                fontSize: "11px",
                letterSpacing: "0.2em",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              whileHover={{ scale: 1.04, borderColor: "rgba(0,212,255,0.3)" }}
              whileTap={{ scale: 0.97 }}
            >
              LinkedIn
            </motion.a>
          </div>
        </div>

        {/* Right — floating info panel */}
        <div
          data-contact-reveal=""
          className="glass-pill rounded-2xl p-7 flex flex-col gap-5"
          style={{ minWidth: 260, border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: "9px", letterSpacing: "0.35em", color: "var(--foreground-subtle)" }}
          >
            Quick Info
          </span>
          {[
            { label: "Email", val: "yukithj@gmail.com" },
            { label: "Location", val: "Bengaluru, India" },
            { label: "Timezone", val: "UTC+5:30 (IST)" },
            { label: "Status", val: "Open For Internship" },
            { label: "Response", val: "Within 24h" },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span
                className="font-mono"
                style={{ fontSize: "8px", letterSpacing: "0.25em", color: "var(--foreground-subtle)", textTransform: "uppercase" }}
              >
                {label}
              </span>
              <span
                style={{ fontSize: "13px", color: "var(--foreground-muted)" }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Scene transition chrome ────────────────────────────────────── */
function SceneMarker({ id, label }: { id: string; label: string }) {
  return (
    <div
      className="relative flex items-center gap-4 overflow-hidden"
      style={{ height: 2, marginLeft: "clamp(24px, 6vw, 120px)", marginRight: "clamp(24px, 6vw, 120px)" }}
      aria-hidden="true"
    >
      <span
        className="absolute font-mono"
        style={{
          fontSize: "8px",
          letterSpacing: "0.4em",
          color: "var(--foreground-subtle)",
          bottom: 8,
          left: 0,
          textTransform: "uppercase",
        }}
      >
        {id} / {label}
      </span>
      <div className="w-full h-px" style={{ background: "linear-gradient(90deg, rgba(0,212,255,0.12), rgba(255,255,255,0.04) 60%, transparent)" }} />
    </div>
  );
}

/* ─── Scroll progress bar ────────────────────────────────────────── */
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (barRef.current) barRef.current.style.transform = `scaleX(${pct})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] origin-left pointer-events-none"
      style={{ height: 2, background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-silver))", transform: "scaleX(0)", transformOrigin: "left" }}
      ref={barRef}
      aria-hidden="true"
    />
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Refresh ScrollTrigger after layout settles
    const t = setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <SmoothScrollProvider>
      {/* Scroll progress hairline */}
      <ScrollProgress />

      {/* Full-screen atmospheric layer */}
      {mounted && <AtmosphericBG />}

      {/* Custom cursor */}
      {mounted && <CustomCursor />}

      {/* Navigation */}
      <Navbar />

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none noise-overlay"
        style={{ zIndex: 3 }}
        aria-hidden="true"
      />

      <main style={{ position: "relative", zIndex: 4 }}>
        {/* ── Scene 00: Hero ── */}
        <Hero />

        <div style={{ height: "6vh" }} />
        <SceneMarker id="00" label="Work" />
        <div style={{ height: "4vh" }} />

        {/* ── Scene 01: Work ── */}
        <WorkScene />

        <SceneMarker id="01" label="About" />
        <div style={{ height: "4vh" }} />

        {/* ── Scene 02: About ── */}
        <AboutScene />

        <SceneMarker id="02" label="Contact" />
        <div style={{ height: "4vh" }} />

        {/* ── Scene 03: Contact ── */}
        <ContactScene />
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 py-7"
        style={{
          paddingLeft: "clamp(24px, 6vw, 120px)",
          paddingRight: "clamp(24px, 6vw, 120px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <span className="font-mono" style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--foreground-subtle)" }}>
          YUKITH.OS © 2026 — ALL RIGHTS RESERVED
        </span>
        <div className="flex items-center gap-6">
          {["GitHub", "Twitter", "LinkedIn", "Dribbble"].map((link) => (
            <motion.a
              key={link}
              href="#"
              className="font-mono"
              style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--foreground-subtle)", textTransform: "uppercase" }}
              whileHover={{ color: "var(--foreground)" }}
            >
              {link}
            </motion.a>
          ))}
        </div>
        <span className="font-mono" style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--foreground-subtle)" }}>
          DESIGNED & BUILT WITH PRECISION
        </span>
      </footer>
    </SmoothScrollProvider>
  );
}
