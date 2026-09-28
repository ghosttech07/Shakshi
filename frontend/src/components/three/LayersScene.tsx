"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { linenTexture, quiltTexture } from "./fabric";
import type { Kind } from "./MattressModel";

/** Scroll state written by the section's ScrollTrigger: e = how far apart the layers are (0..1). */
export type LayersProgress = { e: number; turn: number };

type Props = {
  kinds: Kind[];
  /** Layer depths in cm, top first (same order as kinds). */
  depths: number[];
  progress: MutableRefObject<LayersProgress>;
  active: number;
  live: boolean;
  still?: boolean;
};

const W = 2.2;
const D = 1.5;
const CM = 0.022;
const GAP = 0.3;
// The base is an open tray the support core sits in.
const TRAY = { wall: 0.05, floor: 0.05, height: 0.26, pad: 0.06 };

const SOFT: Kind[] = ["cover", "gel", "foam", "latex", "wool"];
const LOOK: Record<Kind, { color: string; rough: number; sheen: number; sheenColor: string; clearcoat?: number }> = {
  cover: { color: "#f4f2ee", rough: 0.88, sheen: 1, sheenColor: "#ffffff" },
  gel: { color: "#3f9ad8", rough: 0.55, sheen: 0.6, sheenColor: "#bfe4ff", clearcoat: 0.25 },
  foam: { color: "#f1f1ee", rough: 0.92, sheen: 0.9, sheenColor: "#ffffff" },
  latex: { color: "#efe2bd", rough: 0.8, sheen: 0.7, sheenColor: "#fff6de" },
  wool: { color: "#efe8dc", rough: 0.95, sheen: 1, sheenColor: "#ffffff" },
  springs: { color: "#5d6878", rough: 0.95, sheen: 0.7, sheenColor: "#aab6c8" },
  base: { color: "#1f3a6e", rough: 0.75, sheen: 0.5, sheenColor: "#6f8fc8" },
};

/**
 * A rounded, finely divided slab (indexed, so it shades smoothly when bent).
 * Grid lines are packed towards the edges so the rounded rims stay smooth.
 */
function slab(w: number, h: number, d: number, segs: [number, number, number], radius: number, rim = 3) {
  const box = new THREE.BoxGeometry(2, 2, 2, ...segs);
  box.deleteAttribute("normal");
  box.deleteAttribute("uv");
  const g = mergeVertices(box);
  box.dispose();
  const half = [w / 2, h / 2, d / 2];
  const r = Math.min(radius, h / 2 - 0.001);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  const inner = new THREE.Vector3();
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const c = [pos.getX(i), pos.getY(i), pos.getZ(i)].map((t, a) => {
      const k = Math.min(0.45, rim / (segs[a] / 2));
      const a1 = Math.abs(t);
      const m = a1 <= 1 - k ? (a1 / (1 - k)) * (half[a] - r) : half[a] - r + ((a1 - (1 - k)) / k) * r;
      return Math.sign(t) * m;
    });
    p.set(c[0], c[1], c[2]);
    inner.set(
      THREE.MathUtils.clamp(p.x, -(half[0] - r), half[0] - r),
      THREE.MathUtils.clamp(p.y, -(half[1] - r), half[1] - r),
      THREE.MathUtils.clamp(p.z, -(half[2] - r), half[2] - r)
    );
    const off = p.clone().sub(inner);
    if (off.lengthSq() > 1e-10) p.copy(inner).add(off.normalize().multiplyScalar(r));
    pos.setXYZ(i, p.x, p.y, p.z);
    uv[i * 2] = p.x / w + 0.5;
    uv[i * 2 + 1] = p.z / d + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function material(kind: Kind) {
  const l = LOOK[kind];
  const m = new THREE.MeshPhysicalMaterial({
    color: l.color,
    roughness: l.rough,
    sheen: l.sheen,
    sheenColor: new THREE.Color(l.sheenColor),
    sheenRoughness: 0.55,
    clearcoat: l.clearcoat ?? 0,
    clearcoatRoughness: 0.5,
    // The layer being described glows a little brighter in its own colour
    emissive: new THREE.Color(l.color),
    emissiveIntensity: 0,
  });
  if (kind === "cover") {
    m.bumpMap = quiltTexture(5);
    m.bumpScale = 1.4;
  } else if (kind === "springs" || kind === "base" || kind === "wool") {
    m.bumpMap = linenTexture(kind === "springs" ? 5 : 7);
    m.bumpScale = 0.9;
  }
  return m;
}

type Built = {
  kind: Kind;
  soft: boolean;
  geo: THREE.BufferGeometry;
  rest: Float32Array;
  mat: THREE.MeshPhysicalMaterial;
  y: number; // resting centre height when stacked
  lift: number; // extra height when fully apart
  phase: number;
};

/** A soft layer: rolls in slow waves once it floats free, like foam hanging on air. */
function Layer({ b, index, progress, activeRef, still }: { b: Built; index: number; progress: MutableRefObject<LayersProgress>; activeRef: MutableRefObject<number>; still?: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const amp = useRef(0);
  const glow = useRef(0);
  useFrame(({ clock }, dt) => {
    const m = mesh.current;
    if (!m) return;
    const e = progress.current.e;
    m.position.y = b.y + b.lift * e;
    glow.current = THREE.MathUtils.damp(glow.current, activeRef.current === index ? 1 : 0, 4, dt);
    b.mat.emissiveIntensity = glow.current * 0.22;
    if (!b.soft) return;
    const target = 0.1 * e * (1 - index * 0.1);
    const was = amp.current;
    amp.current = THREE.MathUtils.damp(amp.current, target, 3, dt);
    if (Math.abs(amp.current) < 0.0004 && Math.abs(was) < 0.0004) return;
    const t = still ? 1.2 : clock.elapsedTime;
    const pos = b.geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const A = amp.current;
    for (let i = 0; i < pos.count; i++) {
      const x = b.rest[i * 3];
      const z = b.rest[i * 3 + 2];
      const wave = Math.sin(x * 3.1 + t * 0.9 + b.phase) * (0.75 + 0.25 * Math.cos(z * 1.9 - t * 0.55 + b.phase)) + 0.22 * Math.sin(x * 5.3 - t * 0.7 + z * 1.3);
      arr[i * 3 + 1] = b.rest[i * 3 + 1] + A * wave;
    }
    pos.needsUpdate = true;
    b.geo.computeVertexNormals();
  });
  return <mesh ref={mesh} geometry={b.geo} material={b.mat} castShadow receiveShadow />;
}

/** The base: an open tray with the wordmark on its front. */
function Tray({ b, index, progress, activeRef, logo }: { b: Built; index: number; progress: MutableRefObject<LayersProgress>; activeRef: MutableRefObject<number>; logo: THREE.Texture | null }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef(0);
  const parts = useMemo(() => {
    const tw = W + TRAY.pad * 2;
    const td = D + TRAY.pad * 2;
    const { wall, floor, height } = TRAY;
    const r = 0.02;
    return [
      { geo: slab(tw, floor, td, [40, 2, 30], r, 2), at: [0, floor / 2, 0] },
      { geo: slab(tw, height, wall, [40, 6, 2], r, 2), at: [0, height / 2, td / 2 - wall / 2] },
      { geo: slab(tw, height, wall, [40, 6, 2], r, 2), at: [0, height / 2, -td / 2 + wall / 2] },
      { geo: slab(wall, height, td - wall * 2, [2, 6, 30], r, 2), at: [tw / 2 - wall / 2, height / 2, 0] },
      { geo: slab(wall, height, td - wall * 2, [2, 6, 30], r, 2), at: [-tw / 2 + wall / 2, height / 2, 0] },
    ] as { geo: THREE.BufferGeometry; at: [number, number, number] }[];
  }, []);
  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts]);
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.position.y = b.lift * progress.current.e;
    glow.current = THREE.MathUtils.damp(glow.current, activeRef.current === index ? 1 : 0, 4, dt);
    b.mat.emissiveIntensity = glow.current * 0.35;
  });
  return (
    <group ref={group}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geo} material={b.mat} position={p.at} castShadow receiveShadow />
      ))}
      {logo && (
        <mesh position={[0, TRAY.height * 0.5, D / 2 + TRAY.pad + 0.002]}>
          <planeGeometry args={[0.62, 0.62 * (651 / 2000)]} />
          <meshBasicMaterial map={logo} transparent toneMapped={false} opacity={0.92} />
        </mesh>
      )}
    </group>
  );
}

/** The wordmark drawn in pearl on a transparent canvas, for the tray front. */
function useLogo() {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let made: THREE.CanvasTexture | null = null;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 1000;
      c.height = 326;
      const g = c.getContext("2d")!;
      g.drawImage(img, 0, 0, c.width, c.height);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = "#f5f0e8";
      g.fillRect(0, 0, c.width, c.height);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      made = t;
      setTex(t);
    };
    img.src = "/brand/shakshi-wordmark.svg";
    return () => {
      img.onload = null;
      made?.dispose();
    };
  }, []);
  return tex;
}

/** Keeps the whole stack in frame at any screen shape, and lets it lean gently toward the pointer. */
function Rig({ progress }: { progress: MutableRefObject<LayersProgress> }) {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const e = progress.current.e;
    const aspect = size.width / Math.max(1, size.height);
    const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const needH = 1.35 + 1.45 * e;
    const needW = 3.1;
    const dist = Math.max(needH / (2 * tan), needW / (2 * tan * aspect)) * 1.08;
    look.set(0, 0.42 + 0.62 * e, 0);
    const dir = new THREE.Vector3(0, 0.38, 1).normalize();
    cam.position.copy(look).addScaledVector(dir, dist);
    cam.lookAt(look);
  });
  return null;
}

function Stack({ kinds, depths, progress, active, still }: Omit<Props, "live">) {
  const turn = useRef<THREE.Group>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const logo = useLogo();

  const built = useMemo<Built[]>(() => {
    const n = kinds.length;
    // Resting centre heights, from the bottom layer up
    const out: Built[] = new Array(n);
    let top = 0;
    for (let j = 0; j < n; j++) {
      const i = n - 1 - j;
      const kind = kinds[i];
      const soft = SOFT.includes(kind);
      if (kind === "base") {
        out[i] = { kind, soft: false, geo: new THREE.BufferGeometry(), rest: new Float32Array(), mat: material(kind), y: 0, lift: 0, phase: 0 };
        top = TRAY.floor;
        continue;
      }
      const h = kind === "springs" ? Math.max(0.3, depths[i] * CM) : Math.max(0.06, depths[i] * CM);
      const egg = kind === "foam";
      const geo = soft ? slab(W, h, D, egg ? [150, 6, 104] : [96, 5, 66], 0.035) : slab(W, h, D, [48, 10, 34], 0.05);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      // Contour foam gets its egg-crate top, which also shows as a serrated edge
      if (egg) {
        for (let v = 0; v < pos.count; v++) {
          const y = pos.getY(v);
          if (y <= 0) continue;
          const x = pos.getX(v);
          const z = pos.getZ(v);
          const bump = 0.5 + 0.5 * Math.sin(x * 34) * Math.sin(z * 34);
          pos.setY(v, y + 0.045 * bump * Math.min(1, y / (h / 2)) ** 2);
        }
        geo.computeVertexNormals();
      }
      out[i] = { kind, soft, geo, rest: new Float32Array(pos.array), mat: material(kind), y: top + h / 2, lift: j * GAP, phase: i * 0.55 };
      top += h + (egg ? 0.02 : 0);
    }
    return out;
  }, [kinds, depths]);

  useEffect(
    () => () =>
      built.forEach((b) => {
        b.geo.dispose();
        b.mat.bumpMap?.dispose();
        b.mat.dispose();
      }),
    [built]
  );

  useFrame(({ pointer }, dt) => {
    const g = turn.current;
    if (!g) return;
    const p = progress.current;
    const aimY = -0.42 + p.turn * 0.3 + (still ? 0 : pointer.x * 0.1);
    const aimX = still ? 0 : -pointer.y * 0.04;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, aimY, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, aimX, 3, dt);
  });

  return (
    <group ref={turn}>
      {built.map((b, i) =>
        b.kind === "base" ? <Tray key={i} b={b} index={i} progress={progress} activeRef={activeRef} logo={logo} /> : <Layer key={i} b={b} index={i} progress={progress} activeRef={activeRef} still={still} />
      )}
    </group>
  );
}

export default function LayersScene({ kinds, depths, progress, active, live, still }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={live ? "always" : "never"}
      camera={{ fov: 30, near: 0.1, far: 50, position: [0, 2, 6] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight args={["#eef3ff", "#1a2233", 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 6, 4]} intensity={2.2} color="#fff6ea" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} shadow-radius={6} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3} />
      {/* Warm gold rim from behind separates the layers from the dark backdrop */}
      <directionalLight position={[3, 2.5, -4]} intensity={1.6} color="#e9c98f" />
      <directionalLight position={[4, 1, 3]} intensity={0.5} color="#c9d8ff" />
      <Rig progress={progress} />
      <Stack kinds={kinds} depths={depths} progress={progress} active={active} still={still} />
    </Canvas>
  );
}
