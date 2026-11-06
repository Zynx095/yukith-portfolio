"use client";

import { useEffect, useRef, useState } from "react";
import { DISCOVERABLES, setDiscoveryToast, useDiscoveryCount, type Discoverable } from "@/lib/discoveries";

/** A quiet note when something new is discovered (polite, auto-dismissing, never blocking). */
export function DiscoveryToast() {
  const [item, setItem] = useState<Discoverable | null>(null);
  const count = useDiscoveryCount();
  const timer = useRef(0);
  useEffect(() => {
    setDiscoveryToast((d) => {
      setItem(d);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setItem(null), 3200);
    });
    return () => {
      setDiscoveryToast(null);
      window.clearTimeout(timer.current);
    };
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 right-4 z-[60] md:right-6">
      {item && (
        <div className="rounded-xl border border-line-strong bg-ink-2/95 px-4 py-3 text-sm shadow-lg backdrop-blur" style={{ animation: "beat-in 500ms var(--ease-out-soft) both" }}>
          <p className="label text-signal">
            Discovered · {count} / {DISCOVERABLES.length}
          </p>
          <p className="mt-1 text-paper">{item.title}</p>
        </div>
      )}
    </div>
  );
}
