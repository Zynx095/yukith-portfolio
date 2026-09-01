"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useInteractionContext } from "@/hooks/useInteraction";
import { DetailPanel } from "./DetailPanel";

export function WorldInteractionLayer() {
  const { activeZone, isPanelOpen, closePanel } = useInteractionContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" && isPanelOpen) {
        closePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, closePanel]);

  return (
    <>
      <AnimatePresence>
        {isPanelOpen && activeZone && (
          <DetailPanel zoneId={activeZone} onClose={closePanel} />
        )}
      </AnimatePresence>
    </>
  );
}
