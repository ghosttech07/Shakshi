"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { duvetTexture, knitTexture, linenTexture, quiltTexture, woodTexture } from "./fabric";

// Bed proportions (metres-ish)
export const W = 2.0;
export const D = 2.3;
export const LEG = 0.08;
export const FRAME_H = 0.2;
export const BASE = LEG + FRAME_H; // top of the upholstered base
export const H = 0.3; // mattress
export const TOP = BASE + H;

// The duvet covers from below the pillows to beyond the foot, hanging over three sides.
const OVER = 0.36;
export const CW = W + OVER * 2;
export const Z0 = -D / 2 + 0.62;
export const Z1 = D / 2 + OVER;
const SEG_X = 90;
const SEG_Z = 80;

const smooth = (t: number) => 1 - Math.pow(1 - t, 3);

/** Soft, irregular wrinkles on the duvet's top, as if someone has just smoothed it. */
const ripple = (x: number, z: number) => 0.009 * Math.sin(x * 3.3 + z * 2.1) + 0.006 * Math.sin(x * 7.1 + z * 4.3) + 0.003 * Math.sin(x * 13 - z * 9);

/** Where each point of the duvet rests once it has settled over the mattress edges. */
export function drape(x: number, z: number, out: THREE.Vector3) {
  const ox = Math.max(0, Math.abs(x) - W / 2);
  const oz = Math.max(0, z - D / 2);
  const s = Math.hypot(ox, oz);
  const rip = ripple(x, z);
  if (s === 0) {
    // Soft turned-down fold near the pillows
    const fold = z < Z0 + 0.16 ? 0.045 * Math.sin(((z - Z0) / 0.16) * Math.PI) : 0;
    out.set(x, TOP + 0.03 + rip + fold, z);
    return;
  }
  const dx = (Math.sign(x) * ox) / s;
  const dz = oz / s;
  const r = 0.08;
  const arc = (Math.PI * r) / 2;
  let horiz: number;
  let y: number;
  if (s < arc) {
    const a = s / r;
    horiz = r * Math.sin(a);
    y = TOP + 0.01 - r + r * Math.cos(a);
  } else {
    horiz = r;
    y = TOP + 0.01 - r - (s - arc);
  }
  // Folds in the hanging fabric, deepening toward the hem; the corners swing out a little
  const along = ox > oz ? z : x;
  const depth = Math.min(1, s * 3);
  horiz += (0.026 * Math.sin(along * 8.5) + 0.012 * Math.sin(along * 21 + 1.3)) * depth;
  if (ox > 0 && oz > 0) horiz += 0.03 * Math.min(ox, oz) * 4;
  out.set(x - dx * s + dx * (horiz + 0.02), y + 0.02 + rip * 0.5, z - dz * s + dz * (horiz + 0.02));
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
  const bump = useMemo(() => {
    const t = duvetTexture();
    t.repeat.set(8, 6);
    return t;
  }, []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => (geometry.dispose(), bump.dispose()), [geometry, bump]);

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
      <meshPhysicalMaterial color="#f8f4ed" roughness={0.82} sheen={1} sheenRoughness={0.45} sheenColor="#fff6e8" bumpMap={bump} bumpScale={2.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

// The knitted throw folded across the foot of the bed
export const THROW_W = W + 0.46;
export const THROW_D = 0.6;
export const THROW_Z = D / 2 - 0.5;

export function throwRest(x: number, z: number, out: THREE.Vector3) {
  const edge = W / 2 + 0.07;
  const ox = Math.max(0, Math.abs(x) - edge);
  const lie = TOP + 0.065 + ripple(x, z) + 0.006 * Math.sin(z * 22);
  if (ox === 0) return out.set(x, lie, z);
  const r = 0.09;
  const arc = (Math.PI * r) / 2;
  const sx = Math.sign(x);
  if (ox < arc) {
    const a = ox / r;
    return out.set(sx * (edge + r * Math.sin(a)), lie - r + r * Math.cos(a), z);
  }
  // Hanging part: a gentle wave along its hem
  return out.set(sx * (edge + r + 0.012 * Math.sin(z * 11)), lie - r - (ox - arc), z);
}

/** Lands once the duvet has settled (or is simply there, when the bed arrives dressed). */
function Throw({ show }: { show: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);
  const { geometry, rest } = useMemo(() => {
    const g = new THREE.PlaneGeometry(THROW_W, THROW_D, 80, 24);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, THROW_Z);
    return { geometry: g, rest: new Float32Array(g.attributes.position.array) };
  }, []);
  const bump = useMemo(() => knitTexture([18, 5]), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => (geometry.dispose(), bump.dispose()), [geometry, bump]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    m.visible = show;
    if (!show) return;
    start.current ??= clock.elapsedTime;
    const k = Math.min(1, (clock.elapsedTime - start.current) / 1.6);
    if (k === 1 && m.userData.done) return;
    m.userData.done = k === 1;
    const e = smooth(k);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3];
      const z = rest[i * 3 + 2];
      throwRest(x, z, target);
      const flyY = TOP + 0.9 + 0.05 * Math.sin(x * 3 + clock.elapsedTime * 2);
      arr[i * 3] = x * (1 - e) + target.x * e;
      arr[i * 3 + 1] = flyY * (1 - e) + target.y * e;
      arr[i * 3 + 2] = z * (1 - e) + target.z * e;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} geometry={geometry} visible={false} castShadow receiveShadow>
      <meshPhysicalMaterial color="#b48d62" roughness={0.95} sheen={1} sheenRoughness={0.6} sheenColor="#f1d6ae" bumpMap={bump} bumpScale={3} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A stuffed pillow: two panels sewn at the edge, full in the middle and pinched at the seams. */
export function pillowGeometry(w: number, d: number, t: number) {
  const panel = (up: boolean) => {
    const g = new THREE.PlaneGeometry(w, d, 44, 30);
    g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const u = (2 * x) / w;
      const v = (2 * z) / d;
      const f = Math.pow(Math.max(0, 1 - Math.abs(u) ** 3), 0.5) * Math.pow(Math.max(0, 1 - Math.abs(v) ** 3), 0.5);
      // Corners pull in as the stuffing takes up the fabric; small creases run toward the seam
      const pinch = 1 - 0.07 * (1 - f) * (Math.abs(u) * Math.abs(v));
      const crease = 0.01 * Math.sin(u * 11 + v * 4) * (1 - f) * f * 4;
      pos.setXYZ(i, x * pinch, (up ? 1 : -1) * ((t / 2) * f + crease), z * pinch);
    }
    return g;
  };
  const top = panel(true);
  const bottom = panel(false);
  const g = mergeGeometries([top, bottom])!;
  top.dispose();
  bottom.dispose();
  g.computeVertexNormals();
  return g;
}

function Bed() {
  const tex = useMemo(() => ({ quilt: quiltTexture(5), linen: linenTexture(9), wood: woodTexture() }), []);
  const geo = useMemo(
    () => ({
      euro: pillowGeometry(0.68, 0.64, 0.24),
      sleep: pillowGeometry(0.78, 0.5, 0.2),
      lumbar: pillowGeometry(0.58, 0.3, 0.15),
    }),
    []
  );
  useEffect(
    () => () => {
      Object.values(tex).forEach((t) => t.dispose());
      Object.values(geo).forEach((g) => g.dispose());
    },
    [tex, geo]
  );
  const HB_W = W + 0.36;
  const HB_H = 1.22;
  const CH = 9; // channels in the headboard
  const cw = HB_W / CH;
  const legs: [number, number][] = [
    [-(W / 2 - 0.08), -(D / 2 - 0.12)],
    [W / 2 - 0.08, -(D / 2 - 0.12)],
    [-(W / 2 - 0.08), D / 2 - 0.12],
    [W / 2 - 0.08, D / 2 - 0.12],
    [-(W / 2 - 0.08), 0],
    [W / 2 - 0.08, 0],
  ];
  const upholstery = <meshPhysicalMaterial color="#cdbc9f" roughness={0.96} sheen={0.8} sheenRoughness={0.6} sheenColor="#f4e8d4" bumpMap={tex.linen} bumpScale={1.1} />;
  return (
    <group>
      {/* Tapered oak legs */}
      {legs.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, LEG / 2, z]} castShadow>
          <cylinderGeometry args={[0.032, 0.022, LEG, 20]} />
          <meshStandardMaterial color="#8e6c47" roughness={0.55} bumpMap={tex.wood} bumpScale={0.6} />
        </mesh>
      ))}
      {/* Upholstered base */}
      <RoundedBox args={[W + 0.12, FRAME_H, D + 0.1]} radius={0.045} smoothness={5} position={[0, LEG + FRAME_H / 2, 0.02]} castShadow receiveShadow>
        {upholstery}
      </RoundedBox>
      {/* Mattress, with its quilted top showing at the head of the bed */}
      <RoundedBox args={[W, H, D]} radius={0.06} smoothness={5} position={[0, BASE + H / 2, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f2ede4" roughness={0.9} sheen={0.7} sheenColor="#ffffff" bumpMap={tex.quilt} bumpScale={1.2} />
      </RoundedBox>
      {/* Channel-tufted headboard: padded vertical channels side by side */}
      {Array.from({ length: CH }, (_, k) => (
        <RoundedBox key={k} args={[cw - 0.008, HB_H, 0.14]} radius={0.06} smoothness={5} position={[-HB_W / 2 + cw * (k + 0.5), LEG + HB_H / 2, -D / 2 - 0.12]} castShadow receiveShadow>
          {upholstery}
        </RoundedBox>
      ))}
      <RoundedBox args={[HB_W + 0.02, HB_H - 0.06, 0.06]} radius={0.02} position={[0, LEG + HB_H / 2 - 0.02, -D / 2 - 0.2]} castShadow>
        <meshStandardMaterial color="#a8967a" roughness={0.9} />
      </RoundedBox>
      {/* Euro shams upright against the headboard, sleeping pillows leaning on them, a lumbar cushion in front */}
      {[-0.49, 0.49].map((x) => (
        <mesh key={`e${x}`} geometry={geo.euro} position={[x, TOP + 0.3, -D / 2 + 0.13]} rotation={[-1.2, 0, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#e9dfcf" roughness={0.9} sheen={1} sheenRoughness={0.5} sheenColor="#fff4e2" bumpMap={tex.linen} bumpScale={0.8} />
        </mesh>
      ))}
      {[-0.46, 0.46].map((x) => (
        <mesh key={`s${x}`} geometry={geo.sleep} position={[x, TOP + 0.16, -D / 2 + 0.4]} rotation={[-0.62, x > 0 ? -0.04 : 0.04, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#fbf8f2" roughness={0.85} sheen={1} sheenRoughness={0.4} sheenColor="#ffffff" />
        </mesh>
      ))}
      <mesh geometry={geo.lumbar} position={[0.05, TOP + 0.14, -D / 2 + 0.6]} rotation={[-0.95, 0.08, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#c9a96e" roughness={0.75} sheen={1} sheenRoughness={0.4} sheenColor="#f6e2b8" bumpMap={tex.linen} bumpScale={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Wide screens: the bed sits to the right so the headline can breathe on the left.
 * Narrower screens give the bed its own space below the text, so it's centred and sized to fit it.
 */
function Framing() {
  const { camera, size } = useThree();
  const wide = size.width >= 1024;
  // Layout effect: the framing is in place before the first frame is drawn (no jump on load).
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (wide) cam.setViewOffset(size.width, size.height, -size.width * 0.2, -size.height * 0.02, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size, wide]);
  // Step back far enough that the bed (about 3.7 m across as it turns) always fits the width.
  const aspect = size.width / Math.max(1, size.height);
  const radius = wide ? 6.4 : Math.min(11, Math.max(6.2, 3.7 / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * aspect)));
  useFrame(() => {
    const a = 0.72;
    camera.position.set(Math.sin(a) * radius, radius * 0.42, Math.cos(a) * radius);
    camera.lookAt(0, 0.4, 0.1);
  });
  return null;
}

/** The bed turns slowly on its own, like a showroom turntable: one full turn about every 40 seconds. */
const TURN_SECONDS = 40;
function Turntable({ spin, children }: { spin: boolean; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin && group.current) group.current.rotation.y += (Math.min(delta, 0.1) * Math.PI * 2) / TURN_SECONDS;
  });
  return <group ref={group}>{children}</group>;
}

/** Tells the page once real frames are on screen, so the poster beneath can step aside. */
function Ready({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) onReady?.();
  });
  return null;
}

/**
 * Soft studio light baked into an environment map (no downloads): a big window to the left,
 * a bounce card to the right and a ceiling panel. Fabrics pick up gentle, believable highlights.
 */
function Studio({ night }: { night: boolean }) {
  return (
    // Captured once; the key rebuilds it when the site switches between day and night
    <Environment key={night ? "night" : "day"} resolution={256} frames={1} environmentIntensity={night ? 0.28 : 0.75}>
      <color attach="background" args={[night ? "#101626" : "#e9dcc6"]} />
      <Lightformer form="rect" intensity={night ? 1.2 : 3} color={night ? "#9fb4e6" : "#fff4e2"} position={[-5, 3.5, 3]} scale={[5, 4, 1]} target={[0, 0.6, 0]} />
      <Lightformer form="rect" intensity={night ? 0.3 : 1} color={night ? "#6c7fb0" : "#f6e6cc"} position={[5, 2, -2]} scale={[4, 3, 1]} target={[0, 0.6, 0]} />
      <Lightformer form="rect" intensity={night ? 0.4 : 1.2} color={night ? "#8a9bc8" : "#fffaf0"} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
      {night && <Lightformer form="circle" intensity={3} color="#ffb877" position={[2.5, 1.2, -1.5]} scale={0.8} target={[0, 0.6, 0]} />}
    </Environment>
  );
}

function Lights({ night }: { night: boolean }) {
  return night ? (
    <>
      <hemisphereLight args={["#9fb3d9", "#1a2233", 0.3]} />
      {/* Moonlight through the window */}
      <directionalLight position={[-4.5, 6, 3]} intensity={1.5} color="#bccbf2" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={10} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      {/* A bedside lamp left glowing */}
      <pointLight position={[1.55, 0.95, -1.0]} intensity={3.2} distance={3.2} decay={1.6} color="#ffb877" />
    </>
  ) : (
    <>
      <hemisphereLight args={["#fff4e2", "#d9c6ab", 0.45]} />
      <directionalLight position={[-4.5, 6, 3]} intensity={2.3} color="#ffe2b8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={8} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <directionalLight position={[5, 3, -2]} intensity={0.3} color="#c9d4ff" />
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
  const [dressed, setDressed] = useState(false);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 30, near: 0.1, far: 40, position: [3.4, 2.3, 3.8] }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: night ? 0.95 : 1.02 }}
      aria-hidden
    >
      <Framing />
      <Ready onReady={onReady} />
      <Studio night={night} />
      <Lights night={night} />
      <Turntable spin={drift}>
        <Bed />
        {duvet && <Duvet settled={mode === "settled"} onSettled={() => setDressed(true)} />}
        {duvet && <Throw show={dressed} />}
      </Turntable>
      {/* Soft contact shadow where the bed meets the floor, plus the window's cast shadow */}
      <ContactShadows position={[0, 0.002, 0]} scale={7} resolution={512} blur={2.6} far={1.4} opacity={night ? 0.7 : 0.5} color={night ? "#03050a" : "#4a3620"} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={night ? 0.28 : 0.14} color={night ? "#05070c" : "#5a4630"} />
      </mesh>
      {sparkles && <Sparkles count={night ? 30 : 45} scale={[5, 3, 5]} position={[-0.5, 1.8, 0.5]} size={night ? 1.6 : 2.2} speed={0.18} opacity={night ? 0.45 : 0.55} color={night ? "#dfe8ff" : "#fff1d6"} />}
    </Canvas>
  );
}
