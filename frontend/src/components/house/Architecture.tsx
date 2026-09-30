"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { box, plane, type SurfaceKey } from "./materials";
import { BEDROOM_DOOR, DOOR, HOUSE, ROOMS } from "./layout";

type Mats = Record<SurfaceKey, THREE.MeshStandardMaterial>;

/** A solid block with its texture at true scale. */
function Block({ size, at, mat, tile, shadow = true }: { size: [number, number, number]; at: [number, number, number]; mat: THREE.Material; tile?: number; shadow?: boolean }) {
  const t = tile ?? (mat.userData.tile as number) ?? 1;
  const [w, h, d] = size;
  const geo = useMemo(() => box(w, h, d, t), [w, h, d, t]);
  return <mesh geometry={geo} material={mat} position={at} castShadow={shadow} receiveShadow />;
}

/** A wall along x (a run between x0 and x1 at depth z), optionally with one opening. */
function WallX({ x0, x1, z, mat, h = HOUSE.height, gap }: { x0: number; x1: number; z: number; mat: THREE.Material; h?: number; gap?: { x0: number; x1: number; h: number } }) {
  const t = HOUSE.wall;
  if (!gap) return <Block size={[x1 - x0, h, t]} at={[(x0 + x1) / 2, h / 2, z]} mat={mat} />;
  return (
    <>
      <Block size={[gap.x0 - x0, h, t]} at={[(x0 + gap.x0) / 2, h / 2, z]} mat={mat} />
      <Block size={[x1 - gap.x1, h, t]} at={[(gap.x1 + x1) / 2, h / 2, z]} mat={mat} />
      <Block size={[gap.x1 - gap.x0, h - gap.h, t]} at={[(gap.x0 + gap.x1) / 2, gap.h + (h - gap.h) / 2, z]} mat={mat} />
    </>
  );
}

/** A wall along z at x, optionally with a window opening (sill to head height). */
function WallZ({ z0, z1, x, mat, h = HOUSE.height, win }: { z0: number; z1: number; x: number; mat: THREE.Material; h?: number; win?: { z0: number; z1: number; sill: number; head: number } }) {
  const t = HOUSE.wall;
  if (!win) return <Block size={[t, h, z1 - z0]} at={[x, h / 2, (z0 + z1) / 2]} mat={mat} />;
  return (
    <>
      <Block size={[t, h, win.z0 - z0]} at={[x, h / 2, (z0 + win.z0) / 2]} mat={mat} />
      <Block size={[t, h, z1 - win.z1]} at={[x, h / 2, (win.z1 + z1) / 2]} mat={mat} />
      <Block size={[t, win.sill, win.z1 - win.z0]} at={[x, win.sill / 2, (win.z0 + win.z1) / 2]} mat={mat} />
      <Block size={[t, h - win.head, win.z1 - win.z0]} at={[x, win.head + (h - win.head) / 2, (win.z0 + win.z1) / 2]} mat={mat} />
    </>
  );
}

/** Clear architectural glass with a faint reflection of the sky. */
export function useGlass() {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#dfe7ea",
        transparent: true,
        opacity: 0.16,
        roughness: 0.03,
        metalness: 0,
        envMapIntensity: 1.4,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );
}

const frameMat = new THREE.MeshStandardMaterial({ color: "#1c1c1e", roughness: 0.45, metalness: 0.6 });

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
        <mesh key={i} position={[x0 + i * step, h / 2, z]} material={frameMat} castShadow>
          <boxGeometry args={[0.05, h, 0.08]} />
        </mesh>
      ))}
      <mesh position={[(x0 + x1) / 2, 0.03, z]} material={frameMat}>
        <boxGeometry args={[x1 - x0, 0.06, 0.1]} />
      </mesh>
      <mesh position={[(x0 + x1) / 2, h - 0.03, z]} material={frameMat}>
        <boxGeometry args={[x1 - x0, 0.06, 0.1]} />
      </mesh>
    </group>
  );
}

/** A window set into a side wall (glass on z-axis plane). */
function WindowZ({ z0, z1, x, sill, head, glass }: { z0: number; z1: number; x: number; sill: number; head: number; glass: THREE.Material }) {
  return (
    <group>
      <mesh position={[x, (sill + head) / 2, (z0 + z1) / 2]} rotation={[0, Math.PI / 2, 0]} material={glass}>
        <planeGeometry args={[z1 - z0, head - sill]} />
      </mesh>
      <mesh position={[x, (sill + head) / 2, (z0 + z1) / 2]} material={frameMat}>
        <boxGeometry args={[0.08, head - sill + 0.08, 0.05]} />
      </mesh>
    </group>
  );
}

/** Front sliding doors: slide apart as the visitor approaches (progress 0.2 → 0.3). */
function FrontDoors({ glass, progress }: { glass: THREE.Material; progress: MutableRefObject<number> }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const open = useRef(0);
  useFrame((_, dt) => {
    const target = THREE.MathUtils.clamp((progress.current - 0.2) / 0.1, 0, 1);
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
      {/* frame edges */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={frameMat} position={[(s * DOOR.width) / 4, 0, 0]}>
          <boxGeometry args={[0.05, HOUSE.height - 0.1, 0.06]} />
        </mesh>
      ))}
      {/* brass pull */}
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

/** Recessed ceiling downlights: small glowing discs (the light itself comes from the room lights). */
function Downlights({ spots }: { spots: [number, number][] }) {
  return (
    <>
      {spots.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, HOUSE.height - 0.005, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.07, 24]} />
          <meshStandardMaterial color="#fff1d6" emissive="#ffd9a0" emissiveIntensity={6} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** The pool: deep turquoise water catching the sunset. */
function Pool({ mats }: { mats: Mats }) {
  const water = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#1d5f6b", roughness: 0.04, metalness: 0.1, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.92 }),
    []
  );
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(9, 3.6, 60, 24).rotateX(-Math.PI / 2), []);
  const rest = useMemo(() => new Float32Array(geo.attributes.position.array), [geo]);
  useFrame(({ clock }) => {
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
  return (
    <group position={[-7.5, 0, 13.4]}>
      <Block size={[9.8, 0.3, 4.4]} at={[0, -0.32, 0]} mat={mats.paving} />
      <mesh position={[0, -0.33, 0]} material={new THREE.MeshStandardMaterial({ color: "#0b3a44", roughness: 0.6 })}>
        <boxGeometry args={[9, 0.02, 3.6]} />
      </mesh>
      <mesh ref={ref} geometry={geo} material={water} position={[0, -0.2, 0]} receiveShadow />
    </group>
  );
}

/** Low garden bollards: warm pools of light along the terrace edge. */
function Bollards() {
  const xs = [-9, -5, -1.8, 1.8, 5, 9];
  return (
    <>
      {xs.map((x) => (
        <group key={x} position={[x, -0.12, 10.6]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 0.6, 16]} />
            <meshStandardMaterial color="#26241f" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.06, 16]} />
            <meshStandardMaterial color="#ffe2b0" emissive="#ffc27a" emissiveIntensity={8} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function Architecture({ mats, progress }: { mats: Mats; progress: MutableRefObject<number> }) {
  const glass = useGlass();
  const { x0, x1, z0, z1, height: H, wall } = HOUSE;
  const W = x1 - x0;
  const D = z1 - z0;

  // Interior floors: oak herringbone throughout
  const floorGeo = useMemo(() => plane(W, D, mats.oakFloor.userData.tile), [W, D, mats.oakFloor]);
  const ceilingGeo = useMemo(() => plane(W, D, 3).rotateX(Math.PI), [W, D]);

  return (
    <group>
      {/* Ground: lawn stretching away, and the stone terrace in front */}
      <mesh geometry={useMemo(() => plane(160, 160, 3), [])} material={mats.lawn} position={[0, -0.36, 0]} receiveShadow />
      <Block size={[26, 0.24, 7.4]} at={[0, -0.24, 9.7]} mat={mats.paving} />
      <Block size={[W + 1.4, 0.36, D + 1.4]} at={[0, -0.18, (z0 + z1) / 2]} mat={mats.concrete} shadow={false} />

      {/* Interior floor and ceiling */}
      <mesh geometry={floorGeo} material={mats.oakFloor} position={[0, 0.001, (z0 + z1) / 2]} receiveShadow />
      <mesh geometry={ceilingGeo} material={mats.plaster} position={[0, H, (z0 + z1) / 2]} receiveShadow />

      {/* Front: stone feature wall, glass, sliding doors, dark oak slats */}
      <Block size={[2.8, H, 0.5]} at={[x0 + 1.4, H / 2, z1 - 0.05]} mat={mats.stone} />
      <GlazingX x0={x0 + 2.8} x1={-DOOR.width / 2} z={z1} glass={glass} every={1.4} />
      <GlazingX x0={DOOR.width / 2} x1={x1 - 2.6} z={z1} glass={glass} every={1.4} />
      <FrontDoors glass={glass} progress={progress} />
      <Block size={[2.6, H, wall]} at={[x1 - 1.3, H / 2, z1]} mat={mats.render} />
      {/* vertical oak slats over the right bay */}
      {Array.from({ length: 11 }, (_, i) => (
        <Block key={i} size={[0.07, H + 0.3, 0.14]} at={[x1 - 2.5 + i * 0.24, (H + 0.3) / 2, z1 + 0.2]} mat={mats.darkOak} tile={1.2} />
      ))}

      {/* Side walls, with a dining window (left) and a bedroom window (right) */}
      <WallZ z0={z0} z1={z1} x={x0} mat={mats.render} win={{ z0: -5.2, z1: -0.8, sill: 0.9, head: 2.9 }} />
      <WindowZ z0={-5.2} z1={-0.8} x={x0} sill={0.9} head={2.9} glass={glass} />
      <WallZ z0={z0} z1={z1} x={x1} mat={mats.render} win={{ z0: -12.6, z1: -8.4, sill: 0.45, head: 2.95 }} />
      <WindowZ z0={-12.6} z1={-8.4} x={x1} sill={0.45} head={2.95} glass={glass} />
      {/* Interior faces of the side walls are plaster */}
      <WallZ z0={z0} z1={z1} x={x0 + wall} mat={mats.plaster} win={{ z0: -5.2, z1: -0.8, sill: 0.9, head: 2.9 }} />
      <WallZ z0={z0} z1={z1} x={x1 - wall} mat={mats.plaster} win={{ z0: -12.6, z1: -8.4, sill: 0.45, head: 2.95 }} />

      {/* Back wall of the bedroom */}
      <WallX x0={x0} x1={x1} z={z0} mat={mats.plaster} />
      {/* Bedroom wall, with a tall opening from the dining room */}
      <WallX x0={x0 + wall} x1={x1 - wall} z={ROOMS.bedroom.z1} mat={mats.plaster} gap={{ x0: -BEDROOM_DOOR.width / 2, x1: BEDROOM_DOOR.width / 2, h: BEDROOM_DOOR.height }} />
      {/* A slender column marks the step from living to dining */}
      <Block size={[0.3, H, 0.3]} at={[-1.6, H / 2, ROOMS.dining.z1]} mat={mats.plaster} />

      {/* Roof slab with a deep front overhang, and the upper wing clad in dark oak */}
      <Block size={[W + 1.2, 0.35, D + 2.4]} at={[0, H + 0.175, (z0 + z1) / 2 + 0.8]} mat={mats.render} />
      <Block size={[9.4, 3.2, 10.2]} at={[-2.9, HOUSE.roofTop + 1.6, 2.1]} mat={mats.darkOak} />
      {/* its long ribbon window, glowing warm */}
      <mesh position={[-2.9, HOUSE.roofTop + 1.7, 7.21]}>
        <planeGeometry args={[8.2, 1.1]} />
        <meshStandardMaterial color="#ffd6a0" emissive="#ffb866" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>

      <Downlights spots={[[-4, 1.5], [-4, 4.5], [3.5, 1.5], [3.5, 4.5], [-2.6, -2.2], [3.4, -3], [-4.5, -9], [4.5, -9], [-4.5, -13], [4.5, -13]]} />

      <Pool mats={mats} />
      <Bollards />
    </group>
  );
}
