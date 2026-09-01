"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import * as THREE from "three";
import { STORY_ZONES, StoryZoneConfig } from "@/src/data/storyZones";

export type InteractionState = "none" | "available" | "opening" | "open" | "closing";

export interface ZoneProximityData {
  zoneId: string;
  distance: number;
  interactProgress: number;
  revealProgress: number;
  config: StoryZoneConfig;
}

export interface InteractionContextValue {
  activeZone: string | null;
  interactionState: InteractionState;
  nearestZone: ZoneProximityData | null;
  openPanel: (zoneId: string) => void;
  closePanel: () => void;
  togglePanel: (zoneId: string) => void;
  isPanelOpen: boolean;
}

const InteractionContext = createContext<InteractionContextValue | null>(null);

export function useInteractionContext() {
  const ctx = useContext(InteractionContext);
  if (!ctx) throw new Error("useInteractionContext must be used within InteractionProvider");
  return ctx;
}

// Module-level reactive store for proximity data
const proximitySubscribers = new Set<(data: ZoneProximityData[]) => void>();
let currentProximityData: ZoneProximityData[] = [];

export function notifyProximity(data: ZoneProximityData[]) {
  currentProximityData = data;
  proximitySubscribers.forEach((fn) => fn(data));
}

export function getCurrentProximity(): ZoneProximityData[] {
  return currentProximityData;
}

export function ZoneProximityProvider({ children }: { children: ReactNode }) {
  const [nearestZone, setNearestZone] = useState<ZoneProximityData | null>(null);

  return (
    <InteractionContext.Provider value={{ activeZone: null, interactionState: "none" as InteractionState, nearestZone, openPanel: () => {}, closePanel: () => {}, togglePanel: () => {}, isPanelOpen: false }}>
      {children}
    </InteractionContext.Provider>
  );
}

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [interactionState, setInteractionState] = useState<InteractionState>("none");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [nearestZone, setNearestZone] = useState<ZoneProximityData | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs so the keyboard handler always has latest values without re-binding
  const nearestZoneRef = useRef<ZoneProximityData | null>(null);
  const activeZoneRef = useRef<string | null>(null);
  const isPanelOpenRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { nearestZoneRef.current = nearestZone; }, [nearestZone]);
  useEffect(() => { activeZoneRef.current = activeZone; }, [activeZone]);
  useEffect(() => { isPanelOpenRef.current = isPanelOpen; }, [isPanelOpen]);

  // Listen to proximity updates
  useEffect(() => {
    const subscriber = (data: ZoneProximityData[]) => {
      const candidates = data.filter(
        (d) => d.config.allowInteraction && d.interactProgress > 0.05
      );
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.distance - b.distance);
        setNearestZone(candidates[0]);
      } else {
        setNearestZone(null);
      }
    };
    proximitySubscribers.add(subscriber);
    return () => { proximitySubscribers.delete(subscriber); };
  }, []);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const openPanel = useCallback((zoneId: string) => {
    clearTimer();
    setActiveZone(zoneId);
    setInteractionState("opening");
    setIsPanelOpen(true);
    activeZoneRef.current = zoneId;
    isPanelOpenRef.current = true;
    timeoutRef.current = setTimeout(() => {
      setInteractionState("open");
    }, 150);
  }, []);

  const closePanel = useCallback(() => {
    clearTimer();
    setInteractionState("closing");
    setIsPanelOpen(false);
    activeZoneRef.current = null;
    isPanelOpenRef.current = false;
    timeoutRef.current = setTimeout(() => {
      setActiveZone(null);
      setInteractionState("none");
    }, 350);
  }, []);

  const togglePanel = useCallback((zoneId: string) => {
    if (isPanelOpenRef.current && activeZoneRef.current === zoneId) {
      closePanel();
    } else {
      openPanel(zoneId);
    }
  }, [openPanel, closePanel]);

  // Global keyboard listener — uses capture phase + refs to always have latest values
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const panelOpen = isPanelOpenRef.current;
        if (!panelOpen) {
          const zoneToOpen = activeZoneRef.current || nearestZoneRef.current?.zoneId || null;
          if (zoneToOpen) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openPanel(zoneToOpen);
          }
        }
      }
      if (e.code === "Escape") {
        if (isPanelOpenRef.current) {
          e.preventDefault();
          e.stopPropagation();
          closePanel();
        }
      }
    };

    // Add to multiple targets in capture phase
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    // Also prevent default SPACE behavior at document level
    const preventSpaceScroll = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPanelOpenRef.current) {
        const zoneToOpen = activeZoneRef.current || nearestZoneRef.current?.zoneId || null;
        if (zoneToOpen) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", preventSpaceScroll, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", preventSpaceScroll, true);
      clearTimer();
    };
  }, [openPanel, closePanel, clearTimer]);

  return (
    <InteractionContext.Provider value={{ activeZone, interactionState, nearestZone, openPanel, closePanel, togglePanel, isPanelOpen }}>
      {children}
    </InteractionContext.Provider>
  );
}
