"use client";

import { useView, type View } from "@/lib/view";
import { switchView, VIEW_LABEL } from "./switchView";

const VIEWS: View[] = ["immersive", "classic"];

/**
 * The presentation switcher: two labelled, pressed-state buttons. Always in
 * the top bar, in both modes and on phones. Shortcut: V.
 */
export function ViewSwitch({ className = "" }: { className?: string }) {
  const view = useView();
  return (
    <div
      role="group"
      aria-label="Presentation"
      data-js-only
      className={`relative inline-flex h-10 items-center rounded-full border border-line-strong bg-ink/50 p-1 backdrop-blur-sm ${className}`}
    >
      {VIEWS.map((v) => {
        const active = view === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => switchView(v)}
            aria-pressed={active}
            aria-keyshortcuts="V"
            title={`${VIEW_LABEL[v]} view (press V to switch)`}
            data-opt={v}
            // Pressed styling follows <html data-view> in CSS, so it is right before hydration too.
            className="view-opt relative h-8 rounded-full px-3 text-[0.8125rem] font-medium transition-colors duration-200"
          >
            {VIEW_LABEL[v]}
          </button>
        );
      })}
    </div>
  );
}
