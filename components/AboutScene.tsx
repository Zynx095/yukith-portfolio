"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { springs } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ────────────────────────────────────────────────────────── */
const SKILLS = [
{
cat: "AI / Machine Learning",
items: [
"Whisper AI",
"Ollama",
"LangChain",
"TensorFlow",
"Scikit-Learn",
"Computer Vision",
],
},

{
cat: "Frontend / Experience",
items: [
"Next.js",
"React",
"TypeScript",
"Tailwind CSS",
"Framer Motion",
"GSAP",
],
},

{
cat: "Embedded / Edge Systems",
items: [
"Arduino",
"ESP32",
"Embedded C",
"Sensor Fusion",
"Edge Computing",
"IoT Systems",
],
},

{
cat: "Cybersecurity",
items: [
"Network Security",
"DLP Systems",
"Packet Inspection",
"Anomaly Detection",
"Cyber Forensics",
"Intrusion Detection",
],
},

{
cat: "Systems / Backend",
items: [
"Python",
"FastAPI",
"Node.js",
"SQL",
"Realtime Inference",
"System Architecture",
],
},
];


const TIMELINE = [
{
year: "2026",
label: "AI Systems & Security Engineering",
org: "CURRENT FOCUS",
note: "Building autonomous AI ecosystems, immersive interfaces, and cybersecurity architectures",
},

{
year: "2025",
label: "Autonomous Systems Development",
org: "MAJOR PROJECT PHASE",
note: "Built AI assistants, intrusion detection systems, robotics platforms, and immersive full-stack interfaces",
},

{
year: "2025",
label: "Smart India Hackathon",
org: "TOP 30 FINALIST",
note: "Recognized nationally for systems innovation, embedded engineering, and execution under constraints",
},

{
year: "2026",
label: "STP Cleaning Robot",
org: "FLAGSHIP BUILD",
note: "Engineered an autonomous sewage treatment cleaning robot under ₹3,000 INR",
},

{
year: "2024",
label: "Started Building Systems",
org: "ORIGIN POINT",
note: "Began exploring AI, cybersecurity, embedded systems, and immersive software engineering",
},
];



/* ─── Animated skill bar ─────────────────────────────────────────── */
function SkillBar({ item, delay }: { item: string; delay: number }) {
  const [w, setW] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 88%",
        once: true,
        onEnter: () => {
          setTimeout(() => setW(70 + Math.random() * 30), delay * 1000);
        },
      });
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className="flex items-center gap-3">
      <span
        className="font-mono shrink-0"
        style={{ fontSize: "11px", color: "var(--foreground-muted)", letterSpacing: "0.1em", width: 130 }}
      >
        {item}
      </span>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 1.5, background: "rgba(255,255,255,0.07)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-silver))" }}
          initial={{ width: "0%" }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="font-mono" style={{ fontSize: "9px", color: "var(--foreground-subtle)", width: 30, textAlign: "right" }}>
        {w > 0 ? `${Math.round(w)}%` : ""}
      </span>
    </div>
  );
}

/* ─── Timeline item ──────────────────────────────────────────────── */
function TimelineItem({
  year, label, org, note, index,
}: typeof TIMELINE[number] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0, x: 30, filter: "blur(8px)",
        duration: 0.8, ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        delay: index * 0.1,
      });
    });
    return () => ctx.revert();
  }, [index]);

  return (
    <div ref={ref} className="relative flex gap-6 group">
      {/* Dot + line */}
      <div className="flex flex-col items-center" style={{ minWidth: 16 }}>
        <motion.div
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ background: "var(--accent-cyan)", boxShadow: "0 0 8px rgba(0,212,255,0.5)" }}
          whileInView={{ scale: [0.5, 1.3, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        />
        {index < TIMELINE.length - 1 && (
          <div
            className="flex-1 mt-2"
            style={{ width: 1, background: "linear-gradient(to bottom, rgba(0,212,255,0.2), rgba(255,255,255,0.04))", minHeight: 40 }}
          />
        )}
      </div>

      <div className="pb-8 flex flex-col gap-0.5">
        <span
          className="font-mono"
          style={{ fontSize: "9px", letterSpacing: "0.3em", color: "var(--accent-cyan)" }}
        >
          {year} — {org}
        </span>
        <span
          className="font-bold"
          style={{ fontSize: "15px", color: "var(--foreground)", letterSpacing: "-0.01em" }}
        >
          {label}
        </span>
        <span
          className="font-mono"
          style={{ fontSize: "10px", color: "var(--foreground-subtle)", letterSpacing: "0.08em" }}
        >
          {note}
        </span>
      </div>
    </div>
  );
}

/* ─── AboutScene ─────────────────────────────────────────────────── */
export function AboutScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const bigWordRef = useRef<HTMLDivElement>(null);

  // GSAP horizontal translate on the oversized bg word
  useEffect(() => {
    if (!bigWordRef.current || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bigWordRef.current,
        { x: "0%" },
        {
          x: "20%",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden"
      style={{
        paddingTop: "14vh",
        paddingBottom: "18vh",
        paddingLeft: "clamp(24px, 6vw, 120px)",
        paddingRight: "clamp(24px, 6vw, 120px)",
      }}
      aria-label="About"
    >
      {/* Atmospheric divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
      />

      {/* Giant environmental "ABOUT" word — scrolls laterally */}
      <div
        ref={bigWordRef}
        className="absolute select-none pointer-events-none overflow-hidden"
        style={{ top: "5%", left: "-5%", zIndex: 0 }}
        aria-hidden="true"
      >
        <span
          className="font-bold leading-none"
          style={{
            fontSize: "clamp(120px, 20vw, 260px)",
            letterSpacing: "-0.06em",
            color: "rgba(255,255,255,0.018)",
            whiteSpace: "nowrap",
          }}
        >
          SYSTEM
        </span>
      </div>

      {/* Asymmetric 2-col layout */}
      <div className="relative z-10 flex flex-col xl:flex-row gap-16 xl:gap-24 items-start">

        {/* LEFT — Bio + timeline */}
        <div className="flex-1 min-w-0" style={{ maxWidth: 560 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={springs.cinematic}
          >
            <span
              className="font-mono uppercase block mb-3"
              style={{ fontSize: "9px", letterSpacing: "0.4em", color: "var(--accent-cyan)" }}
            >
              Identity
            </span>

            {/* Layered heading */}
            <div className="relative mb-8">
              <h2
                className="font-bold leading-none"
                style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
              >
                Engineering<br />
<span style={{ color: "var(--accent-silver)" }}>
Intelligent
</span>{" "}
Systems
              </h2>
              {/* AI system annotation */}
              <div
                className="absolute hidden lg:flex items-center gap-1.5"
                style={{ top: 0, right: 0, transform: "translateY(-50%)" }}
              >
                <div className="w-4 h-px" style={{ background: "var(--accent-cyan)", opacity: 0.4 }} />
                <span className="font-mono" style={{ fontSize: "8px", letterSpacing: "0.25em", color: "var(--foreground-subtle)" }}>
                  ID_VERIFIED
                </span>
              </div>
            </div>

            <p
              className="leading-relaxed text-pretty mb-10"
              style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--foreground-muted)", maxWidth: 460 }}
            >
              I’m Yukith M Joseph, an engineering student focused on building intelligent systems at the intersection of AI, cybersecurity, embedded hardware, and immersive software engineering. My work spans autonomous robotics, edge-AI architectures, cybersecurity systems, and cinematic full-stack interfaces powered by local inference pipelines and real-time orchestration. I care deeply about building technology that is not only functional, but optimized, scalable, secure, and unforgettable to interact with.

            </p>

            {/* Floating metadata chips */}
            <div className="flex flex-wrap gap-2 mb-10">
              {[
  "Bengaluru, India",
  "AI Systems",
  "Cybersecurity",
  "Embedded Engineering",
  "2026 Internship",
  "Full-Spectrum Engineer",
].map((chip) => (
                <span
                  key={chip}
                  className="font-mono rounded-full px-3 py-1"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    color: "var(--foreground-subtle)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Timeline */}
          <div>
            <span
              className="font-mono uppercase block mb-6"
              style={{ fontSize: "9px", letterSpacing: "0.4em", color: "var(--foreground-subtle)" }}
            >
              Timeline
            </span>
            {TIMELINE.map((item, i) => (
              <TimelineItem key={`${item.year}-${i}`} {...item} index={i} />
            ))}
          </div>
        </div>

        {/* RIGHT — Skills offset higher */}
        <div
          className="flex-1 min-w-0"
          style={{ maxWidth: 460, marginTop: "clamp(0px, 5vw, 80px)" }}
        >
          {/* Skills heading */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={springs.cinematic}
            className="mb-8"
          >
            <span
              className="font-mono uppercase block mb-2"
              style={{ fontSize: "9px", letterSpacing: "0.4em", color: "var(--accent-cyan)" }}
            >
              Capabilities
            </span>
            <h3
              className="font-bold"
              style={{ fontSize: "clamp(28px, 3.5vw, 40px)", letterSpacing: "-0.03em", color: "var(--foreground)" }}
            >
              Toolset & Skills
            </h3>
          </motion.div>

          {/* Skill categories */}
          <div className="flex flex-col gap-8">
            {SKILLS.map((group, gi) => (
              <motion.div
                key={group.cat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ ...springs.cinematic, delay: gi * 0.1 }}
              >
                <div
                  className="flex items-center gap-3 mb-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}
                >
                  <span
                    className="font-mono uppercase"
                    style={{ fontSize: "9px", letterSpacing: "0.35em", color: "var(--accent-cyan)", opacity: 0.7 }}
                  >
                    {group.cat}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
                <div className="flex flex-col gap-2.5">
                  {group.items.map((item, ii) => (
                    <SkillBar key={item} item={item} delay={gi * 0.15 + ii * 0.06} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quote block — offset float */}
          <motion.blockquote
            className="relative mt-12 pl-5"
            style={{ borderLeft: "2px solid rgba(0,212,255,0.25)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <p
              className="text-pretty italic"
              style={{ fontSize: "13px", lineHeight: 1.75, color: "var(--foreground-muted)" }}
            >
              &ldquo;Great engineering is not just about writing code or building hardware. It’s about architecting complete systems that feel intelligent, seamless, and inevitable.&rdquo;
            </p>
            <footer
              className="mt-2 font-mono"
              style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--foreground-subtle)" }}
            >
              — YUKITH M JOSEPH
            </footer>
          </motion.blockquote>
        </div>
      </div>
    </section>
  );
}
