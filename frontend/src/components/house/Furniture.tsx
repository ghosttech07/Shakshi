"use client";

import { RoundedBox, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { box, plane, type SurfaceKey } from "./materials";
import { Hotspot, type HotspotId } from "./Hotspot";
import { HOUSE } from "./layout";

type Mats = Record<SurfaceKey, THREE.MeshStandardMaterial>;
const M = "/house/models/";

export const MODELS = [
  "mid_century_lounge_chair", "modern_arm_chair_01", "modern_coffee_table_01", "modern_wooden_cabinet", "potted_plant_01",
  "potted_plant_02", "potted_plant_04", "ceramic_vase_01", "book_encyclopedia_set_01", "hanging_picture_frame_02",
  "standing_picture_frame_01", "standing_picture_frame_02", "modern_ceiling_lamp_01", "dining_chair_02", "side_table_01",
  "steel_frame_shelves_01",
] as const;
type ModelName = (typeof MODELS)[number];

/** One placed copy of a downloaded model, casting and receiving shadows. */
function Model({ name, at, rot = 0, scale = 1 }: { name: ModelName; at: [number, number, number]; rot?: number; scale?: number }) {
  const { scene } = useGLTF(`${M}${name}.glb`);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  return <primitive object={obj} position={at} rotation={[0, rot, 0]} scale={scale} />;
}

/** A modern low sofa: oak plinth, linen seat and back cushions. Faces +z before rotation. */
function Sofa({ mats, at, rot }: { mats: Mats; at: [number, number, number]; rot: number }) {
  const linen = mats.linen;
  const L = 2.9;
  return (
    <group position={at} rotation={[0, rot, 0]}>
      <mesh geometry={useMemo(() => box(L, 0.12, 1.0, 1.2), [])} material={mats.darkOak} position={[0, 0.06, 0]} castShadow receiveShadow />
      {[-1, 0, 1].map((i) => (
        <group key={i}>
          <RoundedBox args={[L / 3 - 0.03, 0.24, 0.86]} radius={0.07} smoothness={4} position={[(i * L) / 3, 0.24, 0.06]} material={linen} castShadow receiveShadow />
          <RoundedBox args={[L / 3 - 0.05, 0.5, 0.24]} radius={0.09} smoothness={4} position={[(i * L) / 3, 0.58, -0.33]} rotation={[-0.12, 0, 0]} material={linen} castShadow receiveShadow />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.2, 0.56, 1.0]} radius={0.06} smoothness={4} position={[s * (L / 2 + 0.08), 0.34, 0]} material={linen} castShadow receiveShadow />
      ))}
      {/* two throw cushions */}
      {[-1, 1].map((s) => (
        <RoundedBox key={`c${s}`} args={[0.44, 0.42, 0.14]} radius={0.06} smoothness={4} position={[s * 1.05, 0.56, -0.12]} rotation={[-0.25, s * 0.2, s * 0.08]} material={mats.wool} castShadow />
      ))}
    </group>
  );
}

/** A lamp with a glowing linen shade (floor or table). */
function Lamp({ at, height, shade = 0.42, table = false }: { at: [number, number, number]; height: number; shade?: number; table?: boolean }) {
  return (
    <group position={at}>
      <mesh position={[0, table ? 0.12 : 0.015, 0]} castShadow>
        {table ? <cylinderGeometry args={[0.07, 0.1, 0.24, 24]} /> : <cylinderGeometry args={[0.16, 0.18, 0.03, 32]} />}
        <meshStandardMaterial color={table ? "#e7ddcf" : "#2a2521"} roughness={table ? 0.35 : 0.4} metalness={table ? 0 : 0.6} />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, height, 8]} />
        <meshStandardMaterial color="#b8925a" roughness={0.3} metalness={1} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <cylinderGeometry args={[shade * 0.42, shade * 0.52, shade * 0.62, 40, 1, true]} />
        <meshStandardMaterial color="#fff3de" emissive="#ffcf8a" emissiveIntensity={2.2} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight position={[0, height - 0.05, 0]} intensity={table ? 2.2 : 3.2} distance={table ? 3.2 : 5} decay={2} color="#ffc98a" />
    </group>
  );
}

/** Sheer linen curtains gathered beside a window. */
function Curtain({ at, height, width, rot = 0 }: { at: [number, number, number]; height: number; width: number; rot?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 40, 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.05 * Math.sin((p.getX(i) / width) * Math.PI * 9));
    g.computeVertexNormals();
    return g;
  }, [width, height]);
  return (
    <mesh geometry={geo} position={at} rotation={[0, rot, 0]}>
      <meshStandardMaterial color="#f2ece2" roughness={1} transparent opacity={0.72} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Furniture({ mats, active, onSelect }: { mats: Mats; active: boolean; onSelect: (id: HotspotId) => void }) {
  const H = HOUSE.height;
  const g = useMemo(
    () => ({
      rugLiving: plane(4.4, 3.6, 0.9),
      rugBed: plane(3.6, 3.0, 0.9),
      tableTop: box(2.7, 0.05, 1.05, 1.6),
      tableLeg: box(0.08, 0.72, 0.85, 1.2),
      island: box(1.0, 0.88, 2.8, 1.2),
      islandTop: box(1.12, 0.05, 2.95, 1.6),
      tallCabinets: box(0.62, 2.9, 5, 1.2),
      slat: box(0.09, 2.95, 0.05, 1.2),
    }),
    []
  );
  return (
    <group>
      {/* ───── Living room ───── */}
      <mesh geometry={g.rugLiving} material={mats.wool} position={[-4, 0.008, 2.9]} receiveShadow />
      <Sofa mats={mats} at={[-5.75, 0, 2.9]} rot={Math.PI / 2} />
      <Model name="modern_coffee_table_01" at={[-3.95, 0, 2.9]} />
      <Model name="modern_arm_chair_01" at={[-2.3, 0, 1.85]} rot={-Math.PI / 2 - 0.25} />
      <Model name="modern_arm_chair_01" at={[-2.3, 0, 3.95]} rot={-Math.PI / 2 + 0.25} />
      <Model name="potted_plant_01" at={[-6.35, 0, 0.75]} scale={1.3} />
      <Lamp at={[-6.35, 0, 4.95]} height={1.55} />
      <Model name="mid_century_lounge_chair" at={[4.2, 0, 4.1]} rot={-2.35} />
      <Model name="potted_plant_02" at={[6.2, 0, 5.3]} scale={1.15} />
      <Model name="modern_wooden_cabinet" at={[6.55, 0, 2.3]} rot={-Math.PI / 2} />
      <Model name="ceramic_vase_01" at={[6.5, 0.68, 1.6]} />
      <Model name="hanging_picture_frame_02" at={[6.84, 2.05, 2.3]} rot={-Math.PI / 2} scale={2.4} />

      {/* ───── Dining & kitchen ───── */}
      <group position={[-2.6, 0, -3]}>
        <mesh geometry={g.tableTop} material={mats.marble} position={[0, 0.745, 0]} castShadow receiveShadow />
        {[-1.05, 1.05].map((x) => (
          <mesh key={x} geometry={g.tableLeg} material={mats.darkOak} position={[x, 0.36, 0]} castShadow receiveShadow />
        ))}
        {[-0.9, 0, 0.9].map((x) => (
          <group key={x}>
            <Model name="dining_chair_02" at={[x, 0, -0.78]} />
            <Model name="dining_chair_02" at={[x, 0, 0.78]} rot={Math.PI} />
          </group>
        ))}
        {[-0.7, 0.7].map((x) => (
          <group key={`p${x}`}>
            <Model name="modern_ceiling_lamp_01" at={[x, 1.3, 0]} />
            <mesh position={[x, (2.47 + H) / 2, 0]}>
              <cylinderGeometry args={[0.004, 0.004, H - 2.47, 6]} />
              <meshStandardMaterial color="#1c1c1c" />
            </mesh>
            <pointLight position={[x, 1.45, 0]} intensity={2.6} distance={4} decay={2} color="#ffcf92" />
          </group>
        ))}
      </group>
      {/* Kitchen island and a wall of tall oak cabinets */}
      <group position={[3.4, 0, -3]}>
        <mesh geometry={g.island} material={mats.darkOak} position={[0, 0.44, 0]} castShadow receiveShadow />
        <mesh geometry={g.islandTop} material={mats.marble} position={[0, 0.905, 0]} castShadow receiveShadow />
        <Model name="potted_plant_04" at={[0.1, 0.93, -0.8]} />
      </group>
      <mesh geometry={g.tallCabinets} material={mats.darkOak} position={[6.44, 1.45, -3]} castShadow receiveShadow />

      {/* ───── Bedroom ───── */}
      <mesh geometry={g.rugBed} material={mats.wool} position={[0, 0.008, -12.6]} receiveShadow />
      {/* Dark oak slatted wall behind the bed */}
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} geometry={g.slat} material={mats.darkOak} position={[-2.63 + i * 0.25, 1.475, -14.83]} castShadow receiveShadow />
      ))}
      <Model name="side_table_01" at={[-1.62, 0, -14.4]} />
      <Model name="side_table_01" at={[1.62, 0, -14.4]} />
      <Lamp at={[-1.75, 0.55, -14.5]} height={0.42} shade={0.34} table />
      <Lamp at={[1.75, 0.55, -14.5]} height={0.42} shade={0.34} table />

      {/* Photo frames on the bedside tables: Our Story */}
      <Hotspot id="story" label="Our Story" anchor={[1.5, 0.95, -14.25]} active={active} onSelect={onSelect}>
        <Model name="standing_picture_frame_01" at={[-1.45, 0.55, -14.3]} rot={-Math.PI / 2 + 0.35} scale={1.3} />
        <Model name="standing_picture_frame_02" at={[1.45, 0.55, -14.3]} rot={-Math.PI / 2 - 0.35} scale={1.3} />
      </Hotspot>

      {/* Bookshelf: the Sleep Library */}
      <Hotspot id="library" label="Sleep Library" anchor={[-4.6, 2.3, -14.3]} active={active} onSelect={onSelect}>
        <Model name="steel_frame_shelves_01" at={[-4.6, 0, -14.55]} scale={0.1} />
        <Model name="book_encyclopedia_set_01" at={[-4.98, 0.06, -14.55]} />
        <Model name="book_encyclopedia_set_01" at={[-4.98, 0.6, -14.55]} />
        <Model name="book_encyclopedia_set_01" at={[-4.98, 1.15, -14.55]} />
        <Model name="potted_plant_04" at={[-4.3, 1.66, -14.5]} />
        <Model name="ceramic_vase_01" at={[-4.3, 0.61, -14.5]} scale={0.6} />
      </Hotspot>

      <Model name="mid_century_lounge_chair" at={[4.6, 0, -12.9]} rot={-2.5} />
      <Model name="potted_plant_02" at={[6.15, 0, -14.3]} />
      <Curtain at={[HOUSE.x1 - 0.32, 1.6, -13.05]} height={3.1} width={0.9} rot={-Math.PI / 2} />
      <Curtain at={[HOUSE.x1 - 0.32, 1.6, -7.95]} height={3.1} width={0.9} rot={-Math.PI / 2} />
    </group>
  );
}

MODELS.forEach((m) => useGLTF.preload(`${M}${m}.glb`));
