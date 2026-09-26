"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Layer } from "@shakshi/shared/products";
import { MattressModel, mattressHeight } from "./MattressModel";

/** Grows children in softly whenever they mount (e.g. when the frame changes). */
function Grow({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const s = THREE.MathUtils.damp(g.current.scale.y, 1, 3.2, dt);
    g.current.scale.set(1, s, 1);
  });
  return (
    <group ref={g} scale={[1, 0.001, 1]}>
      {children}
    </group>
  );
}

type FrameProps = { id: string; w: number; d: number; wood: string; fabric: string };

function Frame({ id, w, d, wood, fabric }: FrameProps) {
  const woodMat = <meshStandardMaterial color={wood} roughness={0.55} />;
  if (id === "oslo")
    return (
      <Grow>
        <RoundedBox args={[w + 0.16, 0.12, d + 0.16]} radius={0.02} position={[0, 0.16, 0]} castShadow receiveShadow>{woodMat}</RoundedBox>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * (w / 2 - 0.05), 0.05, z * (d / 2 - 0.05)]} castShadow>
            <boxGeometry args={[0.07, 0.1, 0.07]} />
            {woodMat}
          </mesh>
        ))}
        <RoundedBox args={[w + 0.16, 0.62, 0.05]} radius={0.02} position={[0, 0.45, -d / 2 - 0.1]} castShadow>{woodMat}</RoundedBox>
      </Grow>
    );
  if (id === "aurelia")
    return (
      <Grow>
        <RoundedBox args={[w + 0.2, 0.3, d + 0.2]} radius={0.05} smoothness={4} position={[0, 0.2, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color={fabric} roughness={1} sheen={0.8} sheenColor="#fff" />
        </RoundedBox>
        <RoundedBox args={[w + 0.34, 1.35, 0.2]} radius={0.09} smoothness={5} position={[0, 0.9, -d / 2 - 0.14]} castShadow>
          <meshPhysicalMaterial color={fabric} roughness={1} sheen={0.8} sheenColor="#fff" />
        </RoundedBox>
        {/* Channel tufting across the headboard */}
        {Array.from({ length: Math.round((w + 0.3) / 0.22) }).map((_, i, arr) => (
          <RoundedBox key={i} args={[0.2, 1.2, 0.06]} radius={0.03} smoothness={4} position={[-(w + 0.3) / 2 + ((w + 0.3) / arr.length) * (i + 0.5), 0.9, -d / 2 - 0.02]} castShadow>
            <meshPhysicalMaterial color={fabric} roughness={1} sheen={0.8} sheenColor="#fff" />
          </RoundedBox>
        ))}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * (w / 2), 0.025, z * (d / 2)]}>
            <cylinderGeometry args={[0.03, 0.022, 0.05, 12]} />
            {woodMat}
          </mesh>
        ))}
      </Grow>
    );
  if (id === "kyoto")
    return (
      <Grow>
        <mesh position={[0, 0.07, 0]} castShadow>
          <boxGeometry args={[w - 0.5, 0.14, d - 0.5]} />
          <meshStandardMaterial color="#1f1712" roughness={0.8} />
        </mesh>
        <RoundedBox args={[w + 0.5, 0.08, d + 0.35]} radius={0.015} position={[0, 0.18, 0.05]} castShadow receiveShadow>{woodMat}</RoundedBox>
        <RoundedBox args={[w + 1.3, 0.78, 0.06]} radius={0.015} position={[0, 0.6, -d / 2 - 0.12]} castShadow>{woodMat}</RoundedBox>
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.5, 0.05, 0.4]} radius={0.01} position={[s * (w / 2 + 0.42), 0.46, -d / 2 + 0.1]} castShadow>{woodMat}</RoundedBox>
        ))}
      </Grow>
    );
  return null;
}

const FRAME_TOP: Record<string, number> = { none: 0, oslo: 0.22, aurelia: 0.35, kyoto: 0.22 };

function Pillows({ count, w, y, d }: { count: number; w: number; y: number; d: number }) {
  if (!count) return null;
  const perRow = 2;
  const pw = Math.min(0.72, (w - 0.1) / perRow);
  const items: { x: number; z: number; row: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    items.push({ x: (i % perRow - 0.5) * (pw + 0.04), z: -d / 2 + 0.3 + row * 0.22, row });
  }
  return (
    <Grow>
      {items.map((p, i) => (
        <RoundedBox key={i} args={[pw, 0.13, 0.5]} radius={0.06} smoothness={6} position={[p.x, y + 0.07 + (p.row ? 0.01 : 0.05), p.z]} rotation={[p.row ? -0.12 : -0.28, 0, 0]} castShadow>
          <meshPhysicalMaterial color={p.row ? "#e9dccb" : "#fbf8f2"} roughness={0.85} sheen={1} sheenColor="#fff5e6" />
        </RoundedBox>
      ))}
    </Grow>
  );
}

type Props = {
  layers: Layer[];
  cover: string;
  widthCm: number;
  depthCm: number;
  frame: { id: string; wood: string; fabric: string };
  pillows: number;
};

export default function BedScene({ layers, cover, widthCm, depthCm, frame, pillows }: Props) {
  const w = widthCm / 100;
  const d = depthCm / 100;
  const base = FRAME_TOP[frame.id] ?? 0;
  const top = base + mattressHeight(layers);
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [4.3, 3.1, 4.7], fov: 34 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }} role="img" aria-label="Live preview of your configured bed">
      <hemisphereLight args={["#fff6ea", "#cbbba4", 1]} />
      <directionalLight position={[-3, 5, 3]} intensity={2.3} color="#ffe2bc" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[3, 2, -2]} intensity={0.45} color="#d7deff" />
      <group position={[0, -0.35, 0.1]}>
        <Frame key={frame.id} id={frame.id} w={w} d={d} wood={frame.wood} fabric={frame.fabric} />
        <group position={[0, base, 0]}>
          <MattressModel layers={layers} coverColor={cover} width={w} depth={d} encased />
        </group>
        <Pillows key={pillows} count={pillows} w={w} d={d} y={top} />
        {/* A folded throw at the foot */}
        <RoundedBox args={[w + 0.04, 0.035, 0.42]} radius={0.015} position={[0, top + 0.018, d / 2 - 0.35]} castShadow>
          <meshPhysicalMaterial color="#c9a96e" roughness={0.9} sheen={1} sheenColor="#f5e3bd" />
        </RoundedBox>
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={7} blur={2.4} far={2.5} color="#4a3a28" />
      </group>
      <OrbitControls makeDefault enablePan={false} minDistance={3.5} maxDistance={9} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.15} enableDamping target={[0, 0.1, 0]} />
    </Canvas>
  );
}
