"use client";

import { createContext, useContext } from "react";
import type * as THREE from "three";
import type { WorldAssets } from "@/lib/world/assets";
import type { QualitySettings } from "@/lib/world/quality";

export interface WorldContextValue {
  assets: WorldAssets;
  leaves: THREE.Texture;
  glow: THREE.Texture;
  interiorEnv: THREE.Texture;
  quality: QualitySettings;
}

export const WorldContext = createContext<WorldContextValue | null>(null);

export function useWorld() {
  const v = useContext(WorldContext);
  if (!v) throw new Error("useWorld must be used inside the world scene");
  return v;
}
