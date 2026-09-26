"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { linenTexture, quiltTexture } from "./fabric";

// Bed proportions (metres-ish)
const W = 2.0;
const D = 2.3;
const H = 0.42;
const PLINTH = 0.14;
const TOP = PLINTH + H;

// The duvet covers from below the pillows to beyond the foot, hanging over three sides.
const OVER = 0.36;
const CW = W + OVER * 2;
const Z0 = -D / 2 + 0.62;
const Z1 = D / 2 + OVER;
const SEG_X = 90;
const SEG_Z = 80;

const smooth = (t: number) => 1 - Math.pow(1 - t, 3);

/** Where each point of the duvet rests once it has settled over the mattress edges. */
function drape(x: number, z: number, out: THREE.Vector3) {
  const ox = Math.max(0, Math.abs(x) - W / 2);
  const oz = Math.max(0, z - D / 2);
  const s = Math.hypot(ox, oz);
  const ripple = 0.006 * Math.sin(x * 7.1 + z * 4.3) + 0.004 * Math.sin(x * 13 - z * 9);
  if (s === 0) {
    // Soft turned-down fold near the pillows
    const fold = z < Z0 + 0.14 ? 0.035 * Math.sin(((z - Z0) / 0.14) * Math.PI) : 0;
    out.set(x, TOP + 0.02 + ripple + fold, z);
    return;
  }
  const dx = (Math.sign(x) * ox) / s;
  const dz = oz / s;
  const r = 0.07;
  const arc = (Math.PI * r) / 2;
  let horiz: number;
  let y: number;
  if (s < arc) {
    const a = s / r;
    horiz = r * Math.sin(a);
    y = TOP - r + r * Math.cos(a);
  } else {
    horiz = r;
    y = TOP - r - (s - arc);
  }
  // Gentle vertical folds in the hanging fabric
  const along = ox > oz ? z : x;
  horiz += 0.022 * Math.sin(along * 8.5) * Math.min(1, s * 3) + 0.01 * Math.sin(along * 21) * Math.min(1, s * 2);
  out.set(x - dx * s + dx * (horiz + 0.02), y + 0.02 + ripple, z - dz * s + dz * (horiz + 0.02));
}

function Duvet({ settled, onSettled }: { settled: boolean; onSettled?: () => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);
  const told = useRef(false);
  const { geometry, rest, dist } = useMemo(() => {
    const g = new THREE.PlaneGeometry(CW, Z1 - Z0, SEG_X, SEG_Z);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, (Z0 + Z1) / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const rest = new Float32Array(pos.array);
    const dist = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3];
      const z = rest[i * 3 + 2];
      dist[i] = Math.min(1, Math.hypot(x / (CW / 2), (z - (Z0 + Z1) / 2) / ((Z1 - Z0) / 2)) / 1.2);
    }
    return { geometry: g, rest, dist };
  }, []);
  const bump = useMemo(() => linenTexture(8), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const now = clock.elapsedTime;
    start.current ??= now + 0.4;
    const T = settled ? 10 : Math.max(0, (now - start.current) / 3.6);
    if (T > 2.5 && !told.current) {
      told.current = true;
      onSettled?.();
    }
    if (T > 2.5 && Math.floor(now * 30) % 3 !== 0) return; // settled: breathe at a gentler cadence
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3];
      const z = rest[i * 3 + 2];
      drape(x, z, target);
      const local = Math.min(1, Math.max(0, (T - dist[i] * 0.45) / 0.75));
      const e = smooth(local);
      const flyY = TOP + 1.5 + 0.16 * Math.sin(x * 2.1 + now * 1.2) * Math.cos(z * 1.7 + now * 0.9) + 0.05 * Math.sin(x * 5 - now * 1.6);
      arr[i * 3] = x * 1.04 * (1 - e) + target.x * e;
      arr[i * 3 + 1] = flyY * (1 - e) + target.y * e + 0.004 * e * Math.sin(now * 0.8 + x * 2 + z);
      arr[i * 3 + 2] = z * (1 - e) + target.z * e;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial color="#f6efe4" roughness={0.88} sheen={1} sheenRoughness={0.55} sheenColor="#fff2dc" bumpMap={bump} bumpScale={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Bed() {
  const quilt = useMemo(() => quiltTexture(5), []);
  return (
    <group>
      {/* Oak plinth */}
      <RoundedBox args={[W + 0.1, PLINTH, D + 0.1]} radius={0.02} position={[0, PLINTH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#b9a58c" roughness={0.75} />
      </RoundedBox>
      {/* Mattress */}
      <RoundedBox args={[W, H, D]} radius={0.07} smoothness={5} position={[0, PLINTH + H / 2, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#efe7da" roughness={0.9} sheen={0.7} sheenColor="#ffffff" bumpMap={quilt} bumpScale={1.2} />
      </RoundedBox>
      {/* Upholstered headboard */}
      <RoundedBox args={[W + 0.3, 1.25, 0.14]} radius={0.06} smoothness={5} position={[0, 0.72, -D / 2 - 0.1]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#d8cab4" roughness={0.95} sheen={0.6} sheenColor="#fff" />
      </RoundedBox>
      {/* Pillows */}
      {[-0.48, 0.48].map((x) => (
        <RoundedBox key={x} args={[0.86, 0.2, 0.52]} radius={0.09} smoothness={6} position={[x, TOP + 0.11, -D / 2 + 0.34]} rotation={[-0.22, 0, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#faf6ef" roughness={0.85} sheen={1} sheenColor="#fff5e6" />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.6, 0.16, 0.4]} radius={0.075} smoothness={6} position={[0.22, TOP + 0.15, -D / 2 + 0.6]} rotation={[-0.18, 0.1, 0]} castShadow>
        <meshPhysicalMaterial color="#c9a96e" roughness={0.7} sheen={1} sheenColor="#f3dfb4" />
      </RoundedBox>
    </group>
  );
}

/** Frames the bed to the right on wide screens so the headline can breathe on the left. */
function Framing({ drift }: { drift: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (size.width >= 1024) cam.setViewOffset(size.width, size.height, -size.width * 0.2, -size.height * 0.02, size.width, size.height);
    // Narrow screens: headline on top, bed resting in the lower half
    else cam.setViewOffset(size.width, size.height, -size.width * 0.07, -size.height * 0.24, size.width, size.height);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  // Narrow screens step back so the whole bed fits beneath the headline.
  const radius = size.width < 768 ? 12.5 : 6.4;
  useFrame(({ clock }) => {
    const t = drift ? clock.elapsedTime : 0;
    const a = 0.72 + Math.sin(t * 0.08) * 0.1;
    camera.position.set(Math.sin(a) * radius, radius * 0.42 + Math.sin(t * 0.11) * 0.08, Math.cos(a) * radius);
    camera.lookAt(0, 0.4, 0.1);
  });
  return null;
}

/** Tells the page once real frames are on screen, so the poster beneath can step aside. */
function Ready({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) onReady?.();
  });
  return null;
}

function Lights({ night }: { night: boolean }) {
  return night ? (
    <>
      <hemisphereLight args={["#9fb3d9", "#1a2233", 0.5]} />
      <ambientLight intensity={0.12} color="#8fa6d6" />
      {/* Moonlight through the window */}
      <directionalLight position={[-4.5, 6, 3]} intensity={1.7} color="#bccbf2" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-radius={10} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      {/* A bedside lamp left glowing */}
      <pointLight position={[1.55, 0.95, -1.0]} intensity={3.2} distance={3.2} decay={1.6} color="#ffb877" />
    </>
  ) : (
    <>
      <hemisphereLight args={["#fff4e2", "#d9c6ab", 0.9]} />
      <ambientLight intensity={0.25} color="#ffe9cc" />
      <directionalLight position={[-4.5, 6, 3]} intensity={2.6} color="#ffdcae" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-radius={8} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <directionalLight position={[5, 3, -2]} intensity={0.35} color="#c9d4ff" />
    </>
  );
}

type Props = {
  active: boolean;
  night?: boolean;
  /** "fall": the duvet drifts down and settles. "settled": already dressed, just breathing. */
  mode?: "fall" | "settled";
  drift?: boolean;
  duvet?: boolean;
  sparkles?: boolean;
  onReady?: () => void;
};

export default function HeroScene({ active, night = false, mode = "fall", drift = true, duvet = true, sparkles = true, onReady }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 30, near: 0.1, far: 40, position: [3.4, 2.3, 3.8] }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: night ? 0.95 : 1.05 }}
      aria-hidden
    >
      <Framing drift={drift} />
      <Ready onReady={onReady} />
      <Lights night={night} />
      <Bed />
      {duvet && <Duvet settled={mode === "settled"} />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={night ? 0.3 : 0.16} color={night ? "#05070c" : "#5a4630"} />
      </mesh>
      {sparkles && <Sparkles count={night ? 30 : 45} scale={[5, 3, 5]} position={[-0.5, 1.8, 0.5]} size={night ? 1.6 : 2.2} speed={0.18} opacity={night ? 0.45 : 0.55} color={night ? "#dfe8ff" : "#fff1d6"} />}
    </Canvas>
  );
}
