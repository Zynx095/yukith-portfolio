"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  life: number;
  maxLife: number;
  color: string;
}

interface ParticleFieldProps {
  count?: number;
  mouseX?: number;
  mouseY?: number;
}

const COLORS = [
  "rgba(0, 212, 255, ",   // cyan
  "rgba(168, 180, 204, ", // silver-blue
  "rgba(100, 130, 180, ", // blue-gray
];

export function ParticleField({ count = 80, mouseX = 0, mouseY = 0 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const createParticle = useCallback((canvas: HTMLCanvasElement): Particle => {
    const maxLife = 200 + Math.random() * 300;
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.25,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0,
      baseOpacity: 0.15 + Math.random() * 0.4,
      life: Math.floor(Math.random() * maxLife),
      maxLife,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }, []);

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

    // Init particles
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(canvas)
    );

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ambient grid
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      const gridSize = 80;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Mouse influence radial glow
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx && my) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 320);
        grad.addColorStop(0, "rgba(0, 212, 255, 0.04)");
        grad.addColorStop(1, "rgba(0, 212, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Particles
      particlesRef.current.forEach((p, i) => {
        const progress = p.life / p.maxLife;
        // fade in / fade out envelope
        const envelope =
          progress < 0.1
            ? progress / 0.1
            : progress > 0.85
            ? (1 - progress) / 0.15
            : 1;
        p.opacity = p.baseOpacity * envelope;

        // Mouse repulsion (gentle)
        if (mx && my) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (1 - dist / 150) * 0.4;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife || p.x < 0 || p.x > canvas.width || p.y < 0) {
          particlesRef.current[i] = createParticle(canvas);
          return;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity.toFixed(3)})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [count, createParticle]);

  // Update mouse ref without triggering re-render
  useEffect(() => {
    mouseRef.current = { x: mouseX, y: mouseY };
  }, [mouseX, mouseY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
