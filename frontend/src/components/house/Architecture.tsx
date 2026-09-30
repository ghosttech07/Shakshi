"use client";

import { useFrame } from "@react-three/fiber";
import { RoundedBox, useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef, type JSX, type MutableRefObject } from "react";
import * as THREE from "three";
import { box, plane, type SurfaceKey } from "./materials";
import { BEDROOMS, BEDROOM_OPENING, DOOR, HALL, HOUSE, ROOMS } from "./layout";

type Mats = Record<SurfaceKey, THREE.MeshStandardMaterial>;

/** A solid block with its texture at true scale. */
function Block({ size, at, mat, tile, shadow = true }: { size: [number, number, number]; at: [number, number, number]; mat: THREE.Material; tile?: number; shadow?: boolean }) {
  const t = tile ?? (mat.userData.tile as number) ?? 1;
  const [w, h, d] = size;
  const geo = useMemo(() => box(w, h, d, t), [w, h, d, t]);
  return <mesh geometry={geo} material={mat} position={at} castShadow={shadow} receiveShadow />;
}

type Gap = { a: number; b: number; h: number };

/** A wall running along x at depth z (from x0 to x1), with any number of openings. */
function WallX({ x0, x1, z, mat, gaps = [], h = HOUSE.height }: { x0: number; x1: number; z: number; mat: THREE.Material; gaps?: Gap[]; h?: number }) {
  const t = HOUSE.wall;
  const parts: JSX.Element[] = [];
  let cur = x0;
  [...gaps].sort((p, q) => p.a - q.a).forEach((g, i) => {
    if (g.a > cur) parts.push(<Block key={`s${i}`} size={[g.a - cur, h, t]} at={[(cur + g.a) / 2, h / 2, z]} mat={mat} />);
    parts.push(<Block key={`l${i}`} size={[g.b - g.a, h - g.h, t]} at={[(g.a + g.b) / 2, g.h + (h - g.h) / 2, z]} mat={mat} />);
    cur = g.b;
  });
  if (x1 > cur) parts.push(<Block key="end" size={[x1 - cur, h, t]} at={[(cur + x1) / 2, h / 2, z]} mat={mat} />);
  return <>{parts}</>;
}

type Win = { a: number; b: number; sill: number; head: number };

/** A wall running along z at x (from z0 to z1), with windows (sill/head) or full-height openings. */
function WallZ({ z0, z1, x, mat, wins = [], h = HOUSE.height }: { z0: number; z1: number; x: number; mat: THREE.Material; wins?: Win[]; h?: number }) {
  const t = HOUSE.wall;
  const parts: JSX.Element[] = [];
  let cur = z0;
  [...wins].sort((p, q) => p.a - q.a).forEach((w, i) => {
    if (w.a > cur) parts.push(<Block key={`s${i}`} size={[t, h, w.a - cur]} at={[x, h / 2, (cur + w.a) / 2]} mat={mat} />);
    if (w.sill > 0) parts.push(<Block key={`sill${i}`} size={[t, w.sill, w.b - w.a]} at={[x, w.sill / 2, (w.a + w.b) / 2]} mat={mat} />);
    if (w.head < h) parts.push(<Block key={`head${i}`} size={[t, h - w.head, w.b - w.a]} at={[x, w.head + (h - w.head) / 2, (w.a + w.b) / 2]} mat={mat} />);
    cur = w.b;
  });
  if (z1 > cur) parts.push(<Block key="end" size={[t, h, z1 - cur]} at={[x, h / 2, (cur + z1) / 2]} mat={mat} />);
  return <>{parts}</>;
}

/** Clear architectural glass with a faint reflection of the sky. */
export function useGlass() {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({ color: "#dfe7ea", transparent: true, opacity: 0.14, roughness: 0.03, metalness: 0, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide }),
    []
  );
}

const frameMat = new THREE.MeshStandardMaterial({ color: "#1c1c1e", roughness: 0.45, metalness: 0.6 });
export const glowWarm = new THREE.MeshStandardMaterial({ color: "#fff1d6", emissive: "#ffd9a0", emissiveIntensity: 9, toneMapped: false });

/** A floor-to-ceiling glazing run along x with slim black mullions. */
function GlazingX({ x0, x1, z, h = HOUSE.height, glass, every = 1.5 }: { x0: number; x1: number; z: number; h?: number; glass: THREE.Material; every?: number }) {
  const n = Math.max(1, Math.round((x1 - x0) / every));
  const step = (x1 - x0) / n;
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, h / 2, z]} material={glass}>
        <planeGeometry args={[x1 - x0, h]} />
      </mesh>
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[x0 + i * step, h / 2, z]} material={frameMat}>
          <boxGeometry args={[0.05, h, 0.08]} />
        </mesh>
      ))}
      {[0.03, h - 0.03].map((y) => (
        <mesh key={y} position={[(x0 + x1) / 2, y, z]} material={frameMat}>
          <boxGeometry args={[x1 - x0, 0.06, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

/** Glass in a side-wall window (a plane facing ±x) with a slim frame. */
function PaneZ({ a, b, x, sill, head, glass }: { a: number; b: number; x: number; sill: number; head: number; glass: THREE.Material }) {
  return (
    <group position={[x, (sill + head) / 2, (a + b) / 2]}>
      <mesh rotation={[0, Math.PI / 2, 0]} material={glass}>
        <planeGeometry args={[b - a, head - sill]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, (s * (b - a)) / 2]} material={frameMat}>
          <boxGeometry args={[0.1, head - sill, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

/** Front sliding doors: slide apart as the visitor approaches. */
function FrontDoors({ glass, progress }: { glass: THREE.Material; progress: MutableRefObject<number> }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const open = useRef(0);
  useFrame((_, dt) => {
    const target = THREE.MathUtils.clamp((progress.current - 0.13) / 0.07, 0, 1);
    open.current = THREE.MathUtils.damp(open.current, target, 4, dt);
    const shift = open.current * (DOOR.width / 2 - 0.05);
    if (left.current) left.current.position.x = -DOOR.width / 4 - shift;
    if (right.current) right.current.position.x = DOOR.width / 4 + shift;
  });
  const panel = (
    <>
      <mesh material={glass}>
        <planeGeometry args={[DOOR.width / 2, HOUSE.height - 0.1]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={frameMat} position={[(s * DOOR.width) / 4, 0, 0]}>
          <boxGeometry args={[0.05, HOUSE.height - 0.1, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[0.03, 1.1, 0.03]} />
        <meshStandardMaterial color="#b8925a" roughness={0.3} metalness={1} />
      </mesh>
    </>
  );
  return (
    <group position={[0, (HOUSE.height - 0.1) / 2, DOOR.z + 0.05]}>
      <group ref={left}>{panel}</group>
      <group ref={right}>{panel}</group>
    </group>
  );
}

/** Small glowing discs set into a ceiling, drawn as one batch (the light comes from the room lights). */
function Downlights({ spots, y = HOUSE.height - 0.004 }: { spots: [number, number][]; y?: number }) {
  const geo = useMemo(() => new THREE.CircleGeometry(0.065, 20).rotateX(Math.PI / 2), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    spots.forEach(([x, z], i) => ref.current!.setMatrixAt(i, m.makeTranslation(x, y, z)));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [spots, y]);
  return <instancedMesh ref={ref} args={[geo, glowWarm, spots.length]} frustumCulled={false} />;
}

type Place = [number, number, number, number, number]; // x, y, z, scale, rotation

/** Many copies of one model drawn in a single batch per part (instancing): trees and grass. */
function Scatter({ url, items, cast = false }: { url: string; items: Place[]; cast?: boolean }) {
  const { scene } = useGLTF(url);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const out: { geo: THREE.BufferGeometry; mat: THREE.Material; local: THREE.Matrix4 }[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) out.push({ geo: m.geometry, mat: m.material as THREE.Material, local: m.matrixWorld.clone() });
    });
    return out;
  }, [scene]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    const t = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    parts.forEach((p, pi) => {
      const im = refs.current[pi];
      if (!im) return;
      items.forEach(([x, y, z, s, r], i) => {
        t.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, r), new THREE.Vector3(s, s, s)).multiply(p.local);
        im.setMatrixAt(i, t);
      });
      im.instanceMatrix.needsUpdate = true;
    });
  }, [parts, items]);
  return (
    <>
      {parts.map((p, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          args={[p.geo, p.mat, items.length]}
          castShadow={cast}
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}

/** Seeded random numbers, so the garden grows the same way every visit. */
function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** The pool: stone coping around lit turquoise water that moves gently, with sun loungers. */
function Pool({ mats }: { mats: Mats }) {
  const water = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#2a8fa0", roughness: 0.02, metalness: 0.05, envMapIntensity: 1.8, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.78 }),
    []
  );
  const basin = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7fd3dd", emissive: "#2bb7c9", emissiveIntensity: 0.9, roughness: 0.6 }), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(10, 3.8, 40, 16).rotateX(-Math.PI / 2), []);
  const rest = useMemo(() => new Float32Array(geo.attributes.position.array), [geo]);
  const frame = useRef(0);
  useFrame(({ clock }) => {
    if (++frame.current % 2) return; // ripples at half rate look the same and cost half
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3];
      const z = rest[i * 3 + 2];
      pos.setY(i, 0.012 * Math.sin(x * 2.1 + t * 0.9) + 0.008 * Math.sin(z * 3.3 - t * 1.2));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  const c = 0.45;
  const cushion = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f1ece2", roughness: 0.95 }), []);
  return (
    <group position={[-9, 0, 14]}>
      <Block size={[10 + c * 2, 0.16, c]} at={[0, -0.2, 1.9 + c / 2]} mat={mats.paving} />
      <Block size={[10 + c * 2, 0.16, c]} at={[0, -0.2, -1.9 - c / 2]} mat={mats.paving} />
      <Block size={[c, 0.16, 3.8]} at={[5 + c / 2, -0.2, 0]} mat={mats.paving} />
      <Block size={[c, 0.16, 3.8]} at={[-5 - c / 2, -0.2, 0]} mat={mats.paving} />
      <mesh position={[0, -1.1, 0]} material={basin}>
        <boxGeometry args={[10, 0.02, 3.8]} />
      </mesh>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, -0.66, 0]} material={basin}>
          <boxGeometry args={[0.02, 0.9, 3.8]} />
        </mesh>
      ))}
      {[-1.9, 1.9].map((z) => (
        <mesh key={z} position={[0, -0.66, z]} material={basin}>
          <boxGeometry args={[10, 0.9, 0.02]} />
        </mesh>
      ))}
      <mesh geometry={geo} material={water} position={[0, -0.22, 0]} />
      {[-2.2, 0.2].map((x) => (
        <group key={x} position={[x, -0.12, 3.35]} rotation={[0, 0.08, 0]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.75, 0.08, 1.9]} />
            <meshStandardMaterial color="#8a6440" roughness={0.6} />
          </mesh>
          <RoundedBox args={[0.7, 0.1, 1.3]} radius={0.04} position={[0, 0.25, 0.3]} material={cushion} castShadow />
          <RoundedBox args={[0.7, 0.1, 0.62]} radius={0.04} position={[0, 0.42, -0.6]} rotation={[0.6, 0, 0]} material={cushion} castShadow />
        </group>
      ))}
    </group>
  );
}

/** Low garden bollards: warm points of light along the terrace edge. */
function Bollards() {
  const spots = [-10, -6, -2, 2, 6, 10];
  const post = useMemo(() => new THREE.MeshStandardMaterial({ color: "#26241f", roughness: 0.5, metalness: 0.5 }), []);
  return (
    <>
      {spots.map((x) => (
        <group key={x} position={[x, -0.12, 11.4]}>
          <mesh position={[0, 0.3, 0]} material={post}>
            <cylinderGeometry args={[0.06, 0.07, 0.6, 12]} />
          </mesh>
          <mesh position={[0, 0.55, 0]} material={glowWarm}>
            <cylinderGeometry args={[0.055, 0.055, 0.06, 12]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** The landscape: lawn rolling up into soft hills far away, clipped hedges, trees and grass. */
function Garden({ mats }: { mats: Mats }) {
  // Flat near the house, rising into gentle hills beyond ~70 m (the fog softens them)
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(700, 700, 140, 140);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const r = Math.hypot(x, z - 10);
      const hills = 9 * Math.sin(x * 0.018 + 1.3) * Math.cos(z * 0.021) + 6 * Math.sin(x * 0.041 - z * 0.033) + 12;
      p.setY(i, THREE.MathUtils.smoothstep(r, 70, 170) * Math.max(0, hills));
      uv.setXY(i, x / 3, z / 3);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const hedge = useMemo(() => {
    const m = mats.lawn.clone();
    m.color = new THREE.Color("#3f5a2e");
    m.normalScale = new THREE.Vector2(2, 2);
    return m;
  }, [mats.lawn]);
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#cfc6b6", roughness: 0.9 }), []);

  const trees = useMemo<Place[]>(
    () => [
      [-17, -0.36, 9, 1.25, 0.4],
      [14.5, -0.36, 13.5, 1.05, 2.1],
      [-14, -0.36, -8, 1.4, 4.2],
      [14, -0.36, -4, 1.2, 1.2],
      [-15, -0.36, -20, 1.5, 2.9],
      [15, -0.36, -18, 1.35, 5.2],
      [21, -0.36, 4, 1.1, 3.8],
      [-24, -0.36, -2, 1.5, 0.3],
      [-28, -0.36, -26, 1.6, 0.8],
      [-12, -0.36, -36, 1.8, 2.6],
      [4, -0.36, -40, 1.5, 4.0],
      [18, -0.36, -34, 1.9, 1.7],
      [30, -0.36, -14, 1.6, 3.3],
      [34, -0.36, 8, 1.7, 5.1],
      [-34, -0.36, 14, 1.5, 1.9],
    ],
    []
  );

  const grass = useMemo(() => {
    const rnd = seeded(7);
    const out: Place[] = [];
    const rows: [number, number, number, number][] = [
      [-15, 7.2, -11, 7.2],
      [11, 7.2, 15, 7.2],
      [-15, 16.8, -3, 16.8],
      [9.6, 7.6, 9.6, 16],
      [-9.8, -22.4, -9.8, 5.2],
      [9.8, -22.4, 9.8, 5.2],
      [-9, -22.8, 9, -22.8],
    ];
    for (const [x0, z0, x1, z1] of rows) {
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.8);
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        out.push([x0 + (x1 - x0) * k + (rnd() - 0.5) * 0.6, -0.36, z0 + (z1 - z0) * k + (rnd() - 0.5) * 0.6, 0.9 + rnd() * 0.7, rnd() * 6.28]);
      }
    }
    return out;
  }, []);

  const hedges: { at: [number, number, number]; size: [number, number, number] }[] = [
    { at: [-19, 0.25, 4], size: [0.9, 1.2, 22] },
    { at: [19, 0.25, 2], size: [0.9, 1.2, 26] },
    { at: [-12.5, 0.1, 18.6], size: [9, 0.9, 0.8] },
    { at: [12.5, 0.1, 18.6], size: [9, 0.9, 0.8] },
  ];

  return (
    <group>
      <mesh geometry={ground} material={mats.lawn} position={[0, -0.36, 0]} receiveShadow />
      {hedges.map((h, i) => (
        <RoundedBox key={i} args={h.size} radius={0.25} smoothness={3} position={h.at} material={hedge} castShadow receiveShadow />
      ))}
      <Scatter url="/house/models/island_tree_02.glb" items={trees} cast />
      <Scatter url="/house/models/grass_medium_01.glb" items={grass} />
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[11.8 + (i % 2) * 0.35, -0.33, 17.2 + i * 1.05]} rotation={[0, i * 0.3, 0]} material={stoneMat} receiveShadow>
          <cylinderGeometry args={[0.42, 0.44, 0.06, 18]} />
        </mesh>
      ))}
    </group>
  );
}

export function Architecture({ mats, progress }: { mats: Mats; progress: MutableRefObject<number> }) {
  const glass = useGlass();
  const { x0, x1, z0, z1, height: H, wall } = HOUSE;
  const W = x1 - x0;
  const D = z1 - z0;
  const hx = HALL.x;

  const floorGeo = useMemo(() => plane(W, D, mats.oakFloor.userData.tile), [W, D, mats.oakFloor]);
  const ceilingGeo = useMemo(() => plane(W, D, 3).rotateX(Math.PI), [W, D]);
  const soffitGeo = useMemo(() => plane(W + 1.2, 2.2, 1.2).rotateX(Math.PI), [W]);

  // Each bedroom: two tall windows in its outer wall, either side of the bed
  const sideWins = (side: -1 | 1): Win[] =>
    BEDROOMS.filter((b) => b.side === side).flatMap((b) => [
      { a: b.z0 + 0.7, b: b.z0 + 1.9, sill: 0.35, head: 3.0 },
      { a: b.z1 - 1.9, b: b.z1 - 0.7, sill: 0.35, head: 3.0 },
    ]);
  const leftWins: Win[] = [{ a: -5.2, b: -0.8, sill: 0.9, head: 2.9 }, ...sideWins(-1)];
  const rightWins = sideWins(1);
  // A wide doorway from the corridor into each bedroom
  const doorways = (side: -1 | 1): Win[] =>
    BEDROOMS.filter((b) => b.side === side).map((b) => {
      const c = (b.z0 + b.z1) / 2;
      return { a: c - BEDROOM_OPENING.width / 2, b: c + BEDROOM_OPENING.width / 2, sill: 0, head: BEDROOM_OPENING.height };
    });

  return (
    <group>
      <Garden mats={mats} />
      <Block size={[24, 0.24, 5.6]} at={[1, -0.24, 8.8]} mat={mats.paving} />
      <Block size={[8.6, 0.24, 5.4]} at={[8.4, -0.24, 14.2]} mat={mats.paving} />
      <Block size={[W + 1.4, 0.36, D + 1.4]} at={[0, -0.18, (z0 + z1) / 2]} mat={mats.concrete} shadow={false} />

      <mesh geometry={floorGeo} material={mats.oakFloor} position={[0, 0.001, (z0 + z1) / 2]} receiveShadow />
      <mesh geometry={ceilingGeo} material={mats.plaster} position={[0, H, (z0 + z1) / 2]} />

      {/* Front: a stone wall that runs on into the garden, glass, doors and oak slats */}
      <Block size={[5.4, H, 0.5]} at={[x0 + 0.1, H / 2, z1 - 0.05]} mat={mats.stone} />
      <GlazingX x0={x0 + 2.8} x1={-DOOR.width / 2} z={z1} glass={glass} every={1.4} />
      <GlazingX x0={DOOR.width / 2} x1={x1 - 2.6} z={z1} glass={glass} every={1.4} />
      <FrontDoors glass={glass} progress={progress} />
      <Block size={[2.6, H, wall]} at={[x1 - 1.3, H / 2, z1]} mat={mats.render} />
      {Array.from({ length: 11 }, (_, i) => (
        <Block key={i} size={[0.07, H + 0.3, 0.14]} at={[x1 - 2.5 + i * 0.24, (H + 0.3) / 2, z1 + 0.2]} mat={mats.darkOak} tile={1.2} />
      ))}

      {/* Outer side walls: rendered outside, plaster inside, with their windows */}
      <WallZ z0={z0} z1={z1} x={x0} mat={mats.render} wins={leftWins} />
      <WallZ z0={z0} z1={z1} x={x0 + wall} mat={mats.plaster} wins={leftWins} />
      <WallZ z0={z0} z1={z1} x={x1} mat={mats.render} wins={rightWins} />
      <WallZ z0={z0} z1={z1} x={x1 - wall} mat={mats.plaster} wins={rightWins} />
      {leftWins.map((w, i) => (
        <PaneZ key={`lw${i}`} a={w.a} b={w.b} x={x0} sill={w.sill} head={w.head} glass={glass} />
      ))}
      {rightWins.map((w, i) => (
        <PaneZ key={`rw${i}`} a={w.a} b={w.b} x={x1} sill={w.sill} head={w.head} glass={glass} />
      ))}

      {/* Back wall, with a tall window at the end of the corridor */}
      <WallX x0={x0} x1={x1} z={z0} mat={mats.render} gaps={[{ a: -1.1, b: 1.1, h: 3.0 }]} />
      <mesh position={[0, 1.5, z0]} material={glass}>
        <planeGeometry args={[2.2, 3]} />
      </mesh>

      {/* Dining room's back wall, opening onto the corridor */}
      <WallX x0={x0 + wall} x1={x1 - wall} z={ROOMS.dining.z0} mat={mats.plaster} gaps={[{ a: -hx, b: hx, h: 2.9 }]} />
      {/* Corridor walls with a wide doorway into each bedroom */}
      <WallZ z0={HALL.z0} z1={HALL.z1} x={-hx} mat={mats.plaster} wins={doorways(-1)} />
      <WallZ z0={HALL.z0} z1={HALL.z1} x={hx} mat={mats.plaster} wins={doorways(1)} />
      {/* Walls between the front and back bedrooms */}
      <WallX x0={x0 + wall} x1={-hx} z={-14} mat={mats.plaster} />
      <WallX x0={hx} x1={x1 - wall} z={-14} mat={mats.plaster} />

      {/* Roof slab with a deep front overhang, a warm oak soffit beneath it, and the upper wing */}
      <Block size={[W + 1.2, 0.35, D + 2.4]} at={[0, H + 0.175, (z0 + z1) / 2 + 0.8]} mat={mats.render} />
      <mesh geometry={soffitGeo} material={mats.darkOak} position={[0, H - 0.002, z1 + 1.05]} />
      <Block size={[10.4, 3.2, 10.2]} at={[-3.4, HOUSE.roofTop + 1.6, 2.1]} mat={mats.darkOak} />
      <mesh position={[-3.4, HOUSE.roofTop + 1.7, 7.19]}>
        <planeGeometry args={[9.2, 1.3]} />
        <meshStandardMaterial color="#3a2a1f" emissive="#ffb866" emissiveIntensity={0.55} roughness={0.8} />
      </mesh>
      <mesh position={[-3.4, HOUSE.roofTop + 1.7, 7.22]} material={glass}>
        <planeGeometry args={[9.2, 1.3]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-3.4 - 4.6 + i * (9.2 / 7), HOUSE.roofTop + 1.7, 7.24]} material={frameMat}>
          <boxGeometry args={[0.05, 1.34, 0.05]} />
        </mesh>
      ))}

      <Downlights
        spots={[
          ...[-8, -5.6, -3.2, -0.8, 1.6, 4, 6.4, 8.8].map((x) => [x, 7.1] as [number, number]),
          [-5, 1.5], [-5, 4.5], [4, 1.5], [4, 4.5], [-3, -2.2], [4.4, -3], [0, -8], [0, -12], [0, -16], [0, -20],
        ]}
      />

      <Pool mats={mats} />
      <Bollards />
    </group>
  );
}
