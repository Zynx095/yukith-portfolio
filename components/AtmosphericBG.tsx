"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/* ─── Animated distortion grid (canvas) ──────────────────────────── */
function DistortionGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = 18;
      const rows = 12;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      for (let xi = 0; xi <= cols; xi++) {
        ctx.beginPath();
        let first = true;
        for (let yi = 0; yi <= rows; yi++) {
          const bx = xi * cellW;
          const by = yi * cellH;
          // Sine-wave warp based on position + time
          const dx = Math.sin(yi * 0.5 + t * 0.6) * 6 * (xi / cols);
          const dy = Math.cos(xi * 0.4 + t * 0.5) * 5 * (yi / rows);
          const px = bx + dx;
          const py = by + dy;
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(168,180,204,${0.018 + Math.sin(t + xi) * 0.005})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      for (let yi = 0; yi <= rows; yi++) {
        ctx.beginPath();
        let first = true;
        for (let xi = 0; xi <= cols; xi++) {
          const bx = xi * cellW;
          const by = yi * cellH;
          const dx = Math.sin(yi * 0.5 + t * 0.6) * 6 * (xi / cols);
          const dy = Math.cos(xi * 0.4 + t * 0.5) * 5 * (yi / rows);
          const px = bx + dx;
          const py = by + dy;
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(168,180,204,${0.018 + Math.cos(t + yi) * 0.005})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      t += 0.008;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

/* ─── Particle Field (upgraded cinematic) ────────────────────────── */
function CinematicParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);

    // Two tiers: large slow drifters + tiny fast sparks
    type P = {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; base: number;
      life: number; maxLife: number; tier: "drift" | "spark";
    };

    const mkParticle = (): P => {
      const tier = Math.random() < 0.25 ? "drift" : "spark";
      const maxLife = tier === "drift" ? 400 + Math.random() * 400 : 120 + Math.random() * 180;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (tier === "drift" ? 0.15 : 0.4),
        vy: -(Math.random() * (tier === "drift" ? 0.12 : 0.5)) - 0.05,
        size: tier === "drift" ? 1.5 + Math.random() * 2.5 : 0.4 + Math.random() * 0.8,
        opacity: 0,
        base: tier === "drift" ? 0.12 + Math.random() * 0.18 : 0.25 + Math.random() * 0.35,
        life: Math.floor(Math.random() * maxLife),
        maxLife,
        tier,
      };
    };

    const particles: P[] = Array.from({ length: 140 }, mkParticle);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      // Mouse reactive glow
      if (mx > 0 && my > 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 380);
        g.addColorStop(0, "rgba(0,212,255,0.045)");
        g.addColorStop(0.5, "rgba(0,212,255,0.012)");
        g.addColorStop(1, "rgba(0,212,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      particles.forEach((p, i) => {
        const prog = p.life / p.maxLife;
        const env = prog < 0.1 ? prog / 0.1 : prog > 0.85 ? (1 - prog) / 0.15 : 1;
        p.opacity = p.base * env;

        // Repulsion
        if (mx > 0 && my > 0) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const range = p.tier === "drift" ? 180 : 120;
          if (dist < range) {
            const f = (1 - dist / range) * (p.tier === "drift" ? 0.3 : 0.6);
            p.vx += (dx / dist) * f;
            p.vy += (dy / dist) * f;
          }
        }

        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[i] = mkParticle();
          return;
        }

        if (p.tier === "drift") {
          // Soft glow blob
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          grd.addColorStop(0, `rgba(0,212,255,${p.opacity})`);
          grd.addColorStop(1, "rgba(0,212,255,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168,180,204,${p.opacity})`;
          ctx.fill();
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}

/* ─── Mouse reactive spotlight ───────────────────────────────────── */
function MouseSpotlight() {
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 40, damping: 20 });
  const sy = useSpring(y, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none rounded-full"
      style={{
        left: sx,
        top: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 600,
        height: 600,
        background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, rgba(0,212,255,0.01) 45%, transparent 70%)",
        zIndex: 2,
      }}
      aria-hidden="true"
    />
  );
}

/* ─── Static volumetric fog blobs ─────────────────────────────────── */
function FogLayers() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
      {/* Top-left cool fog */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 900,
          height: 600,
          left: "-20%",
          top: "-10%",
          background: "radial-gradient(ellipse, rgba(74,127,168,0.045) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Bottom-right silver haze */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 800,
          height: 700,
          right: "-15%",
          bottom: "-15%",
          background: "radial-gradient(ellipse, rgba(168,180,204,0.035) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      {/* Center deep glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 1200,
          height: 500,
          left: "10%",
          top: "35%",
          background: "radial-gradient(ellipse, rgba(0,212,255,0.022) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)", top: "60%" }}
        animate={{ top: ["20%", "80%", "20%"], opacity: [0, 0.8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ─── Export ──────────────────────────────────────────────────────── */
export function AtmosphericBG() {
  return (
    <>
      <FogLayers />
      <DistortionGrid />
      <CinematicParticles />
      <MouseSpotlight />
    </>
  );
}
