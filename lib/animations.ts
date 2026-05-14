import type { Variants } from "framer-motion";

/* ─── Spring Presets ──────────────────────────────────────────────── */
export const springs = {
  /** Slow, heavy cinematic spring */
  cinematic: { type: "spring", stiffness: 60, damping: 20, mass: 1.2 },
  /** Snappy spring for nav items */
  snappy: { type: "spring", stiffness: 280, damping: 28, mass: 0.8 },
  /** Gentle float */
  gentle: { type: "spring", stiffness: 40, damping: 18, mass: 1.5 },
  /** Elastic entrance */
  elastic: { type: "spring", stiffness: 200, damping: 22, mass: 1 },
} as const;

/* ─── Easing Curves ───────────────────────────────────────────────── */
export const ease = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  expo: [0.16, 1, 0.3, 1],
  back: [0.34, 1.56, 0.64, 1],
  inOut: [0.45, 0, 0.55, 1],
} as const;

/* ─── Shared Variants ─────────────────────────────────────────────── */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      ...springs.cinematic,
      delay,
    },
  }),
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 1.2, ease: ease.smooth, delay },
  }),
};

export const slideInVariants: Variants = {
  hidden: { opacity: 0, x: -30, filter: "blur(8px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { ...springs.elastic, delay },
  }),
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85, filter: "blur(8px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { ...springs.cinematic, delay },
  }),
};

export const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

/* ─── Text Scramble Utility ───────────────────────────────────────── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

export function scrambleText(
  target: string,
  onUpdate: (val: string) => void,
  duration = 1200
): () => void {
  let frame = 0;
  let raf: number;
  const totalFrames = Math.round(duration / 16);

  const tick = () => {
    const progress = frame / totalFrames;
    const revealedChars = Math.floor(progress * target.length);

    const result = target
      .split("")
      .map((char, i) => {
        if (char === " ") return " ";
        if (i < revealedChars) return char;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      })
      .join("");

    onUpdate(result);
    frame++;

    if (frame <= totalFrames) {
      raf = requestAnimationFrame(tick);
    } else {
      onUpdate(target);
    }
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/* ─── Mouse Position Hook Helper ─────────────────────────────────── */
export type MousePosition = { x: number; y: number };

export function normalizeMousePosition(
  x: number,
  y: number,
  width: number,
  height: number
): MousePosition {
  return {
    x: (x / width - 0.5) * 2,
    y: (y / height - 0.5) * 2,
  };
}
