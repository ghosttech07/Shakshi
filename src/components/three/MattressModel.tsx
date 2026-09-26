"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Layer } from "@/lib/products";
import { quiltTexture } from "./fabric";

export const MATTRESS_W = 1.6;
export const MATTRESS_D = 2.0;
const CM = 0.012; // scene units per centimetre of depth

type Kind = "cover" | "gel" | "foam" | "latex" | "wool" | "springs" | "base";

export function layerKind(l: Layer, i: number): Kind {
  const s = `${l.name} ${l.material}`.toLowerCase();
  if (i === 0) return "cover";
  if (s.includes("spring") || s.includes("coil")) return "springs";
  if (s.includes("gel")) return "gel";
  if (s.includes("foundation") || s.includes("base")) return "base";
  if (s.includes("latex")) return "latex";
  if (s.includes("wool") || s.includes("cashmere")) return "wool";
  return "foam";
}

const KIND_COLOR: Record<Kind, string> = {
  cover: "#efe8dc",
  gel: "#a9c9d3",
  foam: "#f1e7d3",
  latex: "#eedfb6",
  wool: "#e9ddcb",
  springs: "#8c867d",
  base: "#a89f94",
};

function Springs({ w, h, d }: { w: number; h: number; d: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const cols = 11;
  const rows = 13;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        m.makeTranslation(-w / 2 + (w / cols) * (c + 0.5), 0, -d / 2 + (d / rows) * (r + 0.5));
        ref.current.setMatrixAt(i++, m);
      }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [w, d]);
  const r = Math.min(w / cols, d / rows) * 0.38;
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, cols * rows]} castShadow>
        <cylinderGeometry args={[r, r, h * 0.94, 14, 1, true]} />
        <meshStandardMaterial color="#b7b0a5" metalness={0.75} roughness={0.35} side={THREE.DoubleSide} />
      </instancedMesh>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial color="#f3ede4" transparent opacity={0.28} roughness={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}

type Props = {
  layers: Layer[];
  explode?: number; // 0 → assembled, 1 → fully separated
  coverColor?: string;
  width?: number;
  depth?: number;
  /** Show the finished mattress, its cover wrapping every layer, rather than the layer stack. */
  encased?: boolean;
};

/** A mattress built from its real layer stack; separates smoothly when `explode` rises. */
export function MattressModel({ layers, explode = 0, coverColor, width = MATTRESS_W, depth = MATTRESS_D, encased }: Props) {
  const quilt = useMemo(() => quiltTexture(4), []);
  const border = useMemo(() => {
    const t = quiltTexture(1);
    t.repeat.set(24, 1);
    return t;
  }, []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const current = useRef(0);

  // Stack bottom-up: the last layer (foundation) sits on the floor.
  const stack = useMemo(() => {
    const out: { layer: Layer; kind: Kind; h: number; y: number; index: number }[] = [];
    let y = 0;
    for (let i = layers.length - 1; i >= 0; i--) {
      const h = Math.max(0.018, layers[i].depth * CM);
      out.push({ layer: layers[i], kind: layerKind(layers[i], i), h, y: y + h / 2, index: i });
      y += h;
    }
    return out;
  }, [layers]);

  useFrame((_, dt) => {
    current.current = THREE.MathUtils.damp(current.current, explode, 2.4, dt);
    stack.forEach((s, i) => {
      const g = groups.current[i];
      if (g) g.position.y = s.y + current.current * i * 0.24;
    });
  });

  if (encased) {
    const h = mattressHeight(layers);
    const color = coverColor ?? KIND_COLOR.cover;
    return (
      <group>
        {/* Quilted top panel over a smooth border, like a hand-finished mattress */}
        <RoundedBox args={[width, h, depth]} radius={0.06} smoothness={5} position={[0, h / 2, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color={color} roughness={0.92} sheen={0.8} sheenColor="#ffffff" bumpMap={border} bumpScale={0.4} />
        </RoundedBox>
        <RoundedBox args={[width - 0.04, 0.03, depth - 0.04]} radius={0.014} position={[0, h - 0.004, 0]} receiveShadow>
          <meshPhysicalMaterial color={color} roughness={0.9} sheen={0.9} sheenColor="#ffffff" bumpMap={quilt} bumpScale={2} />
        </RoundedBox>
      </group>
    );
  }

  return (
    <group>
      {stack.map((s, i) => (
        <group key={s.index} ref={(el) => void (groups.current[i] = el)} position={[0, s.y, 0]}>
          {s.kind === "springs" ? (
            <Springs w={width * 0.97} h={s.h} d={depth * 0.97} />
          ) : (
            <RoundedBox args={[width, s.h, depth]} radius={Math.min(0.05, s.h / 2.2)} smoothness={4} castShadow receiveShadow>
              <meshPhysicalMaterial
                color={s.kind === "cover" && coverColor ? coverColor : KIND_COLOR[s.kind]}
                roughness={s.kind === "gel" ? 0.35 : 0.9}
                sheen={s.kind === "cover" || s.kind === "wool" ? 0.8 : 0}
                sheenColor="#ffffff"
                transparent={s.kind === "gel"}
                opacity={s.kind === "gel" ? 0.88 : 1}
                bumpMap={s.kind === "cover" ? quilt : undefined}
                bumpScale={1.4}
              />
            </RoundedBox>
          )}
        </group>
      ))}
    </group>
  );
}

export const mattressHeight = (layers: Layer[]) => layers.reduce((h, l) => h + Math.max(0.018, l.depth * CM), 0);
