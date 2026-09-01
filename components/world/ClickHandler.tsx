"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Click handler context
interface ClickContextType {
  onZoneClick: (zoneId: string) => void;
}

const ClickContext = React.createContext<ClickContextType>({
  onZoneClick: () => {},
});

export function useClickContext() {
  return React.useContext(ClickContext);
}

export function ClickHandler({ children }: { children: React.ReactNode }) {
  const { camera, raycaster, mouse } = useThree();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [clickedZone, setClickedZone] = useState<string | null>(null);

  const handleZoneClick = (zoneId: string) => {
    setClickedZone(zoneId);
  };

  useFrame(() => {
    // Raycasting for hover detection would go here
    // For now, we'll use distance-based detection
  });

  return (
    <ClickContext.Provider value={{ onZoneClick: handleZoneClick }}>
      {children}
    </ClickContext.Provider>
  );
}

// Helper to check if a point is near a zone position
export function isNearZone(point: THREE.Vector3, zonePosition: [number, number, number], threshold: number = 15): boolean {
  const zonePos = new THREE.Vector3(...zonePosition);
  return point.distanceTo(zonePos) < threshold;
}

// Animated hover effect for interactive zones
export function useZoneHover(active: boolean) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalScale = useRef(1);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetScale = active ? 1.05 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 5
      );
    }
  });

  return meshRef;
}

// Make React available
const React = {
  createContext: createContext,
  useContext: useContext,
  useState: useState,
  useRef: useRef,
  createElement: (type: any, props: any, children: any) => {
    return { type, props, children };
  }
};

function createContext(defaultValue: any) {
  return {
    Provider: ({ children, value }: { children: any; value: any }) => null,
    Consumer: ({ children }: { children: any }) => children(defaultValue),
  };
}

function useContext(context: any) {
  return context._currentValue;
}
