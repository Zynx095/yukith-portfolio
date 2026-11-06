"use client";

import { openGame } from "@/lib/world/store";

/** Opens the aim trainer (needs JavaScript and WebGL — hidden without JavaScript). */
export function PlayAimButton({ className = "", label = "Play the aim trainer" }: { className?: string; label?: string }) {
  return (
    <button
      type="button"
      data-js-only
      onClick={openGame}
      aria-haspopup="dialog"
      className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-paper px-6 text-sm font-medium text-ink transition-colors hover:bg-signal ${className}`}
    >
      {label}
    </button>
  );
}
