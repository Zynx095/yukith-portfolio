"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { scrambleText, springs, ease } from "@/lib/animations";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─── Constants ───────────────────────────────────────────────────── */
const BOOT_LINES = [
  "INITIALIZING YUKITH.OS v2.4.1",
  "CALIBRATING MOTION ENGINE...",
  "NEURAL LINK ESTABLISHED.",
];

const ENV_LABELS: Array<{ id: string; text: string; sub: string; style: React.CSSProperties }> = [
  { id: "l1", text: "ACTIVE", sub: "SYSTEM_STATUS", style: { top: "14%", left: "3%", rotate: "-90deg", transformOrigin: "left center" } },
  { id: "l2", text: "SECURE  ████████░░  99%", sub: "NET_INTEGRITY", style: { top: "12%", right: "4%" } },
  { id: "l3", text: "< 02.4ms", sub: "LATENCY", style: { bottom: "18%", left: "4%" } },
  { id: "l4", text: "BUILD v2.4.1-rc.3", sub: "SYS_BUILD", style: { bottom: "22%", right: "3%", rotate: "90deg", transformOrigin: "right center" } },
];

/* ─── Boot Line ───────────────────────────────────────────────────── */
function BootLine({ text, index }: { text: string; index: number }) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const cancel = scrambleText(text, setDisplay, 500);
      setTimeout(() => { setDone(true); cancel(); }, 550);
    }, index * 500);
    return () => clearTimeout(t);
  }, [text, index]);

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] leading-5">
      <span style={{ color: done ? "var(--accent-cyan)" : "var(--foreground-subtle)" }}>
        {done ? ">" : "·"}
      </span>
      <span style={{ color: done ? "var(--foreground-muted)" : "var(--foreground-subtle)" }}>
        {display}
      </span>
    </div>
  );
}

/* ─── Environmental floating label ───────────────────────────────── */
function EnvLabel({ text, sub, style }: { text: string; sub: string; style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute pointer-events-none hidden lg:block"
      style={{ ...style }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.8, duration: 1.2 }}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="font-mono leading-none"
          style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--foreground-subtle)" }}
        >
          {sub}
        </span>
        <span
          className="font-mono leading-none"
          style={{ fontSize: "10px", letterSpacing: "0.18em", color: "var(--accent-silver)" }}
        >
          {text}
        </span>
      </div>
      <div style={{ width: 20, height: 1, background: "var(--accent-cyan)", opacity: 0.35, marginTop: 4 }} />
    </motion.div>
  );
}

/* ─── Magnetic CTA ────────────────────────────────────────────────── */
function MagneticBtn({
  children,
  primary,
  href,
}: {
  children: React.ReactNode;
  primary?: boolean;
  href?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rid = useRef(0);

  const onMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  }, [x, y]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  const onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const id = rid.current++;
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
  }, []);

  const base = primary
    ? "bg-[var(--accent-cyan)] text-[#111113]"
    : "bg-transparent text-[var(--foreground-muted)] border border-white/10";

  return (
    <motion.a
      ref={ref}
      href={href ?? "#"}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={primary ? { boxShadow: "0 0 40px rgba(0,212,255,0.4)", scale: 1.04 } : { scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={springs.snappy}
      className={`relative overflow-hidden px-7 py-3 font-mono text-[11px] tracking-[0.22em] uppercase rounded-full cursor-pointer select-none ${base}`}
    >
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x, top: r.y,
            translateX: "-50%", translateY: "-50%",
            background: primary ? "rgba(255,255,255,0.25)" : "rgba(0,212,255,0.2)",
          }}
          initial={{ width: 0, height: 0, opacity: 0.7 }}
          animate={{ width: 220, height: 220, opacity: 0 }}
          transition={{ duration: 0.7, ease: ease.expo }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </motion.a>
  );
}

/* ─── Oversized run-off heading characters ────────────────────────── */
function CinematicHeadline({ text, bootDone }: { text: string; bootDone: boolean }) {
  return (
    <div
      className="relative select-none overflow-visible"
      style={{ lineHeight: 0.85 }}
      aria-label={text}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block font-bold"
          style={{
            fontSize: "clamp(100px, 20vw, 240px)",
            color: "var(--foreground)",
            letterSpacing: "-0.04em",
            willChange: "transform, opacity, filter",
          }}
          initial={{ opacity: 0, y: 80, filter: "blur(20px)" }}
          animate={bootDone ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ ...springs.cinematic, delay: 0.05 * i }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}

/* ─── Scrolling ticker ────────────────────────────────────────────── */
function Ticker() {
  const items = ["AI SYSTEMS", "CYBERSECURITY", "EMBEDDED C++", "NEXT.JS", "OLLAMA", "HARDWARE AUTOMATION", "PYTHON"];
  return (
    <div className="overflow-hidden border-t border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <motion.div
        className="flex gap-12 py-2.5 w-max font-mono"
        style={{ fontSize: "9px", letterSpacing: "0.35em", color: "var(--foreground-subtle)" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-12 uppercase whitespace-nowrap">
            {item}
            <span style={{ color: "var(--accent-cyan)", opacity: 0.5 }}>+</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────── */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineWrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [bootDone, setBootDone] = useState(false);
  const [headlineText, setHeadlineText] = useState("YUKITH");

  // Mouse parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 35, damping: 18 });
  const smy = useSpring(my, { stiffness: 35, damping: 18 });
  const bgX = useTransform(smx, [-1, 1], [-50, 50]);
  const bgY = useTransform(smy, [-1, 1], [-35, 35]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const r = sectionRef.current?.getBoundingClientRect();
      if (!r) return;
      mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
      my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    },
    [mx, my]
  );

  // Boot sequence
  useEffect(() => {
    const t = setTimeout(() => {
      setBootDone(true);
      scrambleText("YUKITH", setHeadlineText, 1000);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // GSAP scroll — headline slow parallax, section fade
  useEffect(() => {
    if (!headlineWrapRef.current || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(headlineWrapRef.current, {
        y: -120,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "60% top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [bootDone]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full min-h-screen overflow-hidden"
      onMouseMove={onMouseMove}
      aria-label="Hero"
      style={{ background: "transparent" }}
    >
      {/* Boot terminal — center fade out */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-30"
        animate={{ opacity: bootDone ? 0 : 1, pointerEvents: bootDone ? "none" : "auto" }}
        transition={{ duration: 0.8, delay: bootDone ? 0.3 : 0 }}
      >
        <div
          className="glass-pill rounded-2xl p-5 w-72"
          style={{ border: "1px solid var(--glass-border)" }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            {["#ff5f57","#febc2e","#28c840"].map((c) => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
            <span className="ml-2 font-mono" style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--foreground-subtle)" }}>
              YUKITH.OS — BOOT
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {BOOT_LINES.map((line, i) => (
              <BootLine key={line} text={line} index={i} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Environmental labels */}
      {ENV_LABELS.map((l) => (
        <EnvLabel key={l.id} text={l.text} sub={l.sub} style={l.style} />
      ))}

      {/* Mouse-reactive background glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 900,
          height: 700,
          top: "5%",
          left: "20%",
          x: bgX,
          y: bgY,
          background: "radial-gradient(ellipse, rgba(0,212,255,0.03) 0%, transparent 65%)",
          filter: "blur(80px)",
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ── Asymmetric layout ──────────────────────────────────── */}
      <div
        className="relative flex flex-col justify-end min-h-screen pb-20 pt-32"
        style={{ paddingLeft: "clamp(24px, 6vw, 120px)", zIndex: 2 }}
      >
        {/* Status + role — top-left offset */}
        <motion.div
          className="flex flex-col gap-2 mb-8"
          initial={{ opacity: 0, x: -30 }}
          animate={bootDone ? { opacity: 1, x: 0 } : {}}
          transition={{ ...springs.cinematic, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--accent-cyan)" }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.5, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <span
              className="font-mono uppercase"
              style={{ fontSize: "10px", letterSpacing: "0.3em", color: "var(--foreground-muted)" }}
            >
              Available for Opportunities
            </span>
          </div>
          <div
            className="font-mono uppercase"
            style={{ fontSize: "11px", letterSpacing: "0.25em", color: "var(--foreground-subtle)" }}
          >
            Full-Spectrum Systems Engineer
          </div>
        </motion.div>

        {/* Massive headline — bleeds right */}
        <div ref={headlineWrapRef} className="relative" style={{ marginLeft: "-0.04em" }}>
          <CinematicHeadline text={headlineText} bootDone={bootDone} />
          
          {/* AURA BOOST: Glowing Tech Stack Line */}
          <motion.div
            className="mt-2 font-mono"
            initial={{ opacity: 0 }}
            animate={bootDone ? { opacity: 1 } : {}}
            transition={{ delay: 1.0, duration: 1 }}
            style={{ 
              fontSize: "11px", 
              letterSpacing: "0.2em", 
              color: "var(--accent-cyan)", 
              textTransform: "uppercase" 
            }}
          >
            Realtime AI Systems / Secure Infrastructure / Embedded Intelligence
          </motion.div>

          {/* Ghost sub-headline — offset below, right-aligned */}
          <motion.div
            className="absolute right-0 bottom-0 translate-y-full pt-4 hidden xl:block"
            initial={{ opacity: 0 }}
            animate={bootDone ? { opacity: 1 } : {}}
            transition={{ delay: 1.2, duration: 1 }}
            style={{ paddingRight: "clamp(24px, 6vw, 120px)" }}
          >
            <p
              className="font-mono text-right text-pretty"
              style={{
                fontSize: "13px",
                lineHeight: 1.65,
                maxWidth: 360,
                color: "var(--foreground-muted)",
              }}
            >
              Building autonomous AI systems, cybersecurity architectures, immersive interfaces, and embedded technologies designed for real-world impact.
            </p>
          </motion.div>
        </div>

        {/* Bottom row — offset left, staggered */}
        <motion.div
          className="flex flex-col gap-6 mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={bootDone ? { opacity: 1, y: 0 } : {}}
          transition={{ ...springs.cinematic, delay: 0.7 }}
        >
          <div className="flex flex-wrap items-center gap-5">
            <MagneticBtn primary href="#work">View Work</MagneticBtn>
            
            {/* The Zero-Friction Mailto Hook */}
            <MagneticBtn href="mailto:yukithj@gmail.com?subject=Portfolio%20Connection%3A%20Opportunity&body=Hi%20Yukith%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20wanted%20to%20connect.%0A%0AProject%20%2F%20Opportunity%3A%0A%0ADetails%3A%0A%0ARegards%2C">
              Get in Touch
            </MagneticBtn>

            <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)" }} />

            {/* Stats inline */}
            {[
              { n: "08+", l: "Projects" },
              { n: "02yrs", l: "Building" },
              { n: "TOP 30", l: "SIH 2025" },
            ].map(({ n, l }) => (
              <div key={l} className="flex flex-col gap-0.5">
                <span
                  className="font-bold tabular-nums"
                  style={{ fontSize: "22px", color: "var(--foreground)", lineHeight: 1 }}
                >
                  {n}
                </span>
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--foreground-subtle)" }}
                >
                  {l}
                </span>
              </div>
            ))}
          </div>

          {/* Subtle HUD Social Links */}
          
          {/* Subtle HUD Social Links */}
          <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.2em] uppercase mt-2">
            <a 
              href="https://github.com/Zynx095" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--foreground-subtle)] hover:text-[var(--accent-cyan)] transition-colors duration-300"
            >
              [ GitHub ]
            </a>
            <a 
              href="https://www.linkedin.com/in/yukith-joseph" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--foreground-subtle)] hover:text-[var(--accent-cyan)] transition-colors duration-300"
            >
              [ LinkedIn ]
            </a>
            <a 
              href="/resume.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--foreground-subtle)] hover:text-[var(--accent-cyan)] transition-colors duration-300"
            >
              [ Resume ]
            </a>
            
             </div>
        </motion.div>

      {/* Ticker tape — bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-10"
        initial={{ opacity: 0 }}
        animate={bootDone ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <Ticker />
      </motion.div>
    </div>

      {/* Scroll overlay darkening (animated by GSAP on scroll) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 60%, #111113 100%)", opacity: 0, zIndex: 5 }}
        aria-hidden="true"
      />

      {/* Vertical rule — far left */}
      <motion.div
        className="absolute left-6 top-1/4 bottom-1/4 hidden lg:block pointer-events-none"
        style={{ width: 1, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.07), transparent)", zIndex: 2 }}
        initial={{ scaleY: 0 }}
        animate={bootDone ? { scaleY: 1 } : {}}
        transition={{ ...springs.cinematic, delay: 1.8 }}
      />

      {/* Frame corner — top right */}
      <motion.div
        className="absolute top-8 right-8 hidden lg:block pointer-events-none"
        style={{ zIndex: 2 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={bootDone ? { opacity: 1, scale: 1 } : {}}
        transition={{ ...springs.cinematic, delay: 2.0 }}
      >
        <div style={{ width: 40, height: 40, borderTop: "1px solid rgba(0,212,255,0.2)", borderRight: "1px solid rgba(0,212,255,0.2)" }} />
      </motion.div>

      {/* Frame corner — bottom left */}
      <motion.div
        className="absolute bottom-8 left-16 hidden lg:block pointer-events-none"
        style={{ zIndex: 2 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={bootDone ? { opacity: 1, scale: 1 } : {}}
        transition={{ ...springs.cinematic, delay: 2.1 }}
      >
        <div style={{ width: 40, height: 40, borderBottom: "1px solid rgba(0,212,255,0.2)", borderLeft: "1px solid rgba(0,212,255,0.2)" }} />
      </motion.div>
    </section>
  );
}