"use client";

/**
 * Shown while the world's code loads and its shaders compile, so the first
 * thing a visitor sees is a finished frame, never a half-built scene.
 */
export function LoadingVeil({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0d0a08] transition-opacity duration-[1400ms] ease-out"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      aria-hidden={!visible}
      role="status"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#c9a65a]/80">Entering the world</p>
      <p className="mt-5 font-serif text-3xl font-light tracking-wide text-[#f4efe6] md:text-4xl">Yukith M Joseph</p>
      <div className="mt-8 h-px w-40 overflow-hidden bg-white/10">
        <div className="h-full w-1/3 animate-[veil_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#e7c26b] to-transparent" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
