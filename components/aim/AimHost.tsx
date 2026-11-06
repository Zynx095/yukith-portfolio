"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { closeGame, useUi } from "@/lib/world/store";
import { getLenis } from "@/components/providers/smooth-scroll";

/** Loaded only when someone opens the game — never with the page or the world. */
const AimTrainer = dynamic(() => import("./AimTrainer"), { ssr: false });

/** Mounts the aim trainer while it is open; the world's frame loop is paused meanwhile. */
export function AimHost() {
  const open = useUi((s) => s.gameOpen);
  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    return () => getLenis()?.start();
  }, [open]);
  return open ? <AimTrainer onClose={closeGame} /> : null;
}
