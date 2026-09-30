"use client";

import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

export type HotspotId = "mattresses" | "pillows" | "covers" | "library" | "story";

const GOLD = new THREE.Color("#c9a96e");

/**
 * Wraps something in the room that can be clicked. While `active` (the visitor has arrived in
 * the bedroom), it shows a pulsing dot; pointing at it lights it softly in gold with its label;
 * clicking opens what it stands for.
 */
export function Hotspot({ id, label, anchor, active, onSelect, children }: { id: HotspotId; label: string; anchor: [number, number, number]; active: boolean; onSelect: (id: HotspotId) => void; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const glow = useRef(0);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);

  // Own copies of the materials, so lighting this object doesn't light everything sharing them
  useEffect(() => {
    const list: THREE.MeshStandardMaterial[] = [];
    group.current?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const own = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => {
        const c = (mat as THREE.MeshStandardMaterial).clone();
        c.emissive = GOLD.clone();
        c.emissiveIntensity = 0;
        list.push(c);
        return c;
      });
      m.material = Array.isArray(m.material) ? own : own[0];
    });
    mats.current = list;
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      glow.current += ((hover && active ? 1 : 0) - glow.current) * 0.15;
      mats.current.forEach((m) => (m.emissiveIntensity = glow.current * 0.35));
      if (Math.abs((hover && active ? 1 : 0) - glow.current) > 0.01) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover, active]);

  useEffect(() => {
    document.body.style.cursor = hover && active ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover, active]);

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!active) return;
    e.stopPropagation();
    setHover(true);
  };
  const out = () => setHover(false);
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!active) return;
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <group ref={group} onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
      {active && (
        <Html position={anchor} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div className={`house-hotspot ${hover ? "is-hover" : ""}`}>
            <span className="house-hotspot-dot" />
            <span className="house-hotspot-label">{label}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
