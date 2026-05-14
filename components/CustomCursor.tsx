"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { stiffness: 400, damping: 30, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 400, damping: 30, mass: 0.5 });

  const trailX = useSpring(rawX, { stiffness: 80, damping: 20, mass: 1.2 });
  const trailY = useSpring(rawY, { stiffness: 80, damping: 20, mass: 1.2 });

  // Ripple clicks
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setIsVisible(true);
    };

    const onEnter = () => setIsVisible(true);
    const onLeave = () => setIsVisible(false);

    const onMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      const id = rippleId.current++;
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 800);
    };
    const onMouseUp = () => setIsClicking(false);

    const onHoverChange = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const isInteractive =
        el.tagName === "A" ||
        el.tagName === "BUTTON" ||
        el.closest("a") !== null ||
        el.closest("button") !== null ||
        el.getAttribute("data-cursor-hover") !== null;
      setIsHovering(isInteractive);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousemove", onHoverChange);
    window.addEventListener("mouseenter", onEnter);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", onHoverChange);
      window.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [rawX, rawY]);

  if (typeof window === "undefined") return null;

  return (
    <>
      {/* Hide default cursor */}
      <style>{`* { cursor: none !important; }`}</style>

      {/* Ripple effects */}
      {ripples.map((r) => (
        <motion.div
          key={r.id}
          className="fixed pointer-events-none rounded-full border border-[#00d4ff]"
          style={{ left: r.x, top: r.y, translateX: "-50%", translateY: "-50%", zIndex: 9998 }}
          initial={{ width: 0, height: 0, opacity: 0.7 }}
          animate={{ width: 120, height: 120, opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}

      {/* Trail dot */}
      <motion.div
        className="fixed pointer-events-none rounded-full"
        style={{
          x: trailX,
          y: trailY,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: 9997,
          width: isHovering ? 40 : 24,
          height: isHovering ? 40 : 24,
          background: isHovering
            ? "rgba(0, 212, 255, 0.08)"
            : "transparent",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          opacity: isVisible ? 1 : 0,
          transition: "width 0.3s ease, height 0.3s ease, background 0.3s ease",
        }}
      />

      {/* Core dot */}
      <motion.div
        className="fixed pointer-events-none rounded-full"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: 9999,
          width: isClicking ? 4 : 6,
          height: isClicking ? 4 : 6,
          background: "#00d4ff",
          boxShadow: "0 0 10px rgba(0, 212, 255, 0.8)",
          opacity: isVisible ? 1 : 0,
          transition: "width 0.15s ease, height 0.15s ease",
        }}
      />
    </>
  );
}
