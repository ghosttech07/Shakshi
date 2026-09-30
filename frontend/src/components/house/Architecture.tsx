"use client";

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
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

/** The pool: stone coping around lit turquoise water that moves gently. */
function Pool({ mats }: { mats: Mats }) {
  const water = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#2a8fa0", roughness: 0.02, metalness: 0.05, envMapIntensity: 1.8, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.78 }),
    []
  );
  const basin = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7fd3dd", emissive: "#2bb7c9", emissiveIntensity: 0.9, roughness: 0.6 }), []);
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
  const c = 0.4; // coping width
  return (
    <group position={[-7.5, 0, 13.6]}>
      {/* coping: four stone strips framing the water */}
      <Block size={[9 + c * 2, 0.16, c]} at={[0, -0.2, 1.8 + c / 2]} mat={mats.paving} />
      <Block size={[9 + c * 2, 0.16, c]} at={[0, -0.2, -1.8 - c / 2]} mat={mats.paving} />
      <Block size={[c, 0.16, 3.6]} at={[4.5 + c / 2, -0.2, 0]} mat={mats.paving} />
      <Block size={[c, 0.16, 3.6]} at={[-4.5 - c / 2, -0.2, 0]} mat={mats.paving} />
      {/* lit basin below the surface */}
      <mesh position={[0, -1.1, 0]} material={basin}>
        <boxGeometry args={[9, 0.02, 3.6]} />
      </mesh>
      {[-4.5, 4.5].map((x) => (
        <mesh key={x} position={[x, -0.66, 0]} material={basin}>
          <boxGeometry args={[0.02, 0.9, 3.6]} />
        </mesh>
      ))}
      {[-1.8, 1.8].map((z) => (
        <mesh key={z} position={[0, -0.66, z]} material={basin}>
          <boxGeometry args={[9, 0.9, 0.02]} />
        </mesh>
      ))}
      <mesh geometry={geo} material={water} position={[0, -0.22, 0]} receiveShadow />
      <pointLight position={[0, -0.6, 0]} intensity={6} distance={7} decay={2} color="#5fd6e6" />
    </group>
  );
}

/** Trees and soft grass: the garden that frames the house. */
function Garden() {
  const tree = useGLTF("/house/models/island_tree_02.glb").scene;
  const grass = useGLTF("/house/models/grass_medium_01.glb").scene;
  const clone = (o: THREE.Object3D) => {
    const c = o.clone(true);
    c.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return c;
  };
  const trees = useMemo(
    () =>
      ([
        [-14.5, -0.36, 9, 1.25, 0.4],
        [12.5, -0.36, 12.5, 1.05, 2.1],
        [-11, -0.36, -6, 1.4, 4.2],
        [11.5, -0.36, -3, 1.2, 1.2],
        // a loose line of trees further back, so the horizon isn't bare
        [-26, -0.36, -24, 1.6, 0.8],
        [-15, -0.36, -31, 1.8, 2.6],
        [-3, -0.36, -34, 1.5, 4.0],
        [9, -0.36, -30, 1.9, 1.7],
        [21, -0.36, -22, 1.6, 3.3],
        [29, -0.36, -6, 1.7, 5.1],
        [-31, -0.36, -2, 1.5, 0.3],
      ] as const).map(([x, y, z, s, r]) => ({ obj: clone(tree), x, y, z, s, r })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree]
  );
  const tufts = useMemo(() => {
    const out: { obj: THREE.Object3D; x: number; z: number; s: number; r: number }[] = [];
    // along the front of the house, both sides of the terrace, and around the pool
    const rows: [number, number, number, number][] = [
      [-13, 6.6, -9.2, 6.6],
      [9.2, 6.6, 13, 6.6],
      [-13, 15.9, -2, 15.9],
      [7.8, 7.2, 7.8, 13],
      [-7.6, -14.6, -7.6, 5.2],
      [7.6, -14.6, 7.6, 5.2],
    ];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const [x0, z0, x1, z1] of rows) {
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.9);
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        out.push({ obj: clone(grass), x: x0 + (x1 - x0) * k + (rnd() - 0.5) * 0.5, z: z0 + (z1 - z0) * k + (rnd() - 0.5) * 0.5, s: 0.9 + rnd() * 0.6, r: rnd() * 6.28 });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grass]);
  return (
    <group>
      {trees.map((t, i) => (
        <primitive key={i} object={t.obj} position={[t.x, t.y, t.z]} scale={t.s} rotation={[0, t.r, 0]} />
      ))}
      {tufts.map((t, i) => (
        <primitive key={`g${i}`} object={t.obj} position={[t.x, -0.36, t.z]} scale={t.s} rotation={[0, t.r, 0]} />
      ))}
    </group>
  );
}

/** Soffit downlights set into the underside of the roof's front overhang. */
function Soffit() {
  const xs = [-6.5, -4.5, -2.5, -0.5, 1.5, 3.5, 5.5];
  return (
    <>
      {xs.map((x) => (
        <mesh key={x} position={[x, HOUSE.height - 0.002, 7.1]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 20]} />
          <meshStandardMaterial color="#fff1d6" emissive="#ffd9a0" emissiveIntensity={9} toneMapped={false} />
        </mesh>
      ))}
    </>
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
      <Block size={[20, 0.24, 5.4]} at={[1, -0.24, 8.7]} mat={mats.paving} />
      <Block size={[8, 0.24, 5.2]} at={[7, -0.24, 13.8]} mat={mats.paving} />
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
      {/* its long ribbon window: a warm-lit room seen through glass */}
      <mesh position={[-2.9, HOUSE.roofTop + 1.7, 7.19]}>
        <planeGeometry args={[8.2, 1.3]} />
        <meshStandardMaterial color="#3a2a1f" emissive="#ffb866" emissiveIntensity={0.55} roughness={0.8} />
      </mesh>
      <mesh position={[-2.9, HOUSE.roofTop + 1.7, 7.22]} material={glass}>
        <planeGeometry args={[8.2, 1.3]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-2.9 - 4.1 + i * (8.2 / 6), HOUSE.roofTop + 1.7, 7.24]} material={frameMat}>
          <boxGeometry args={[0.05, 1.34, 0.05]} />
        </mesh>
      ))}
      <pointLight position={[-2.9, HOUSE.roofTop + 1.8, 5.5]} intensity={5} distance={6} decay={2} color="#ffc27a" />

      <Downlights spots={[[-4, 1.5], [-4, 4.5], [3.5, 1.5], [3.5, 4.5], [-2.6, -2.2], [3.4, -3], [-4.5, -9], [4.5, -9], [-4.5, -13], [4.5, -13]]} />

      <Pool mats={mats} />
      <Bollards />
      <Soffit />
      <Garden />
    </group>
  );
}
