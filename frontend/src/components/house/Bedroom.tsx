"use client";

import { RoundedBox, useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { D as BED_D } from "@/components/three/HeroScene";
import { BedroomBed } from "./BedroomBed";
import { Hotspot, type HotspotId } from "./Hotspot";
import { HOUSE, roomFrame, type Bedroom as Room } from "./layout";
import { plane, type SurfaceKey } from "./materials";
import type { Theme } from "./themes";

type Mats = Record<SurfaceKey, THREE.MeshStandardMaterial>;
const M = "/house/models/";

/** One placed copy of a downloaded model. */
function Model({ name, at, rot = 0, scale = 1 }: { name: string; at: [number, number, number]; rot?: number; scale?: number }) {
  const { scene } = useGLTF(`${M}${name}.glb`);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.receiveShadow = true;
    });
    return c;
  }, [scene]);
  return <primitive object={obj} position={at} rotation={[0, rot, 0]} scale={scale} />;
}

/** Woven cane (rattan) pattern, drawn once. */
function caneTexture() {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c9ab78";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#8a6a40";
  g.lineWidth = 7;
  for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
    g.save();
    g.translate(s / 2, s / 2);
    g.rotate(a);
    for (let i = -s; i <= s; i += 22) {
      g.beginPath();
      g.moveTo(-s, i);
      g.lineTo(s, i);
      g.stroke();
    }
    g.restore();
  }
  g.fillStyle = "#3a2a18";
  for (let x = 0; x < s; x += 22) for (let y = 0; y < s; y += 19) {
    g.beginPath();
    g.arc(x + ((y / 19) % 2) * 11, y, 3.2, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(10, 6);
  return t;
}

/** A shape with rectangular holes (windows), used for painted wall faces. */
function wallShape(w: number, h: number, holes: { x: number; y: number; w: number; h: number }[] = []) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.closePath();
  for (const o of holes) {
    const p = new THREE.Path();
    p.moveTo(o.x - o.w / 2, o.y);
    p.lineTo(o.x + o.w / 2, o.y);
    p.lineTo(o.x + o.w / 2, o.y + o.h);
    p.lineTo(o.x - o.w / 2, o.y + o.h);
    p.closePath();
    s.holes.push(p);
  }
  return new THREE.ShapeGeometry(s);
}

/** An arch outline (rectangle topped by a semicircle), for the heritage room's niches. */
function archShape(w: number, h: number) {
  const s = new THREE.Shape();
  const r = w / 2;
  s.moveTo(-r, 0);
  s.lineTo(-r, h - r);
  s.absarc(0, h - r, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.closePath();
  return new THREE.ShapeGeometry(s, 32);
}

/**
 * A whole themed bedroom, built in the room's own frame: the headboard wall at local z = −depth/2
 * (the house's outer wall), the corridor doorway at +depth/2, the width along local x.
 */
export function Bedroom({ room, theme, mats, active, onSelect }: { room: Room; theme: Theme; mats: Mats; active: boolean; onSelect: (id: HotspotId) => void }) {
  const f = roomFrame(room);
  const H = HOUSE.height;
  const wallIn = f.depth / 2 - HOUSE.wall * 1.5 - 0.015; // painted face, just in front of the outer wall's plaster lining
  const sideIn = f.width / 2 - HOUSE.wall / 2 - 0.015;
  const winX = f.width / 2 - 1.3; // the two tall windows either side of the bed
  const back = -wallIn; // the face of the wall behind the bed
  const bedZ = back + 0.22 + BED_D / 2 + 0.12;

  const m = useMemo(() => {
    const paint = mats.plaster.clone();
    paint.color = new THREE.Color(theme.wall);
    const floor = (theme.floor === "marble" ? mats.marble : mats.oakFloor).clone();
    floor.color = new THREE.Color(theme.floor === "walnut" ? "#9a7358" : theme.floor === "lightOak" ? "#fff9ef" : theme.floor === "marble" ? "#f1ebe2" : "#fff1dd");
    const rug = mats.wool.clone();
    rug.color = new THREE.Color(theme.rug);
    const accent = new THREE.MeshStandardMaterial({ color: theme.accentColor, roughness: theme.accent === "fluted" ? 0.55 : 0.8 });
    const cane = theme.accent === "cane" ? new THREE.MeshStandardMaterial({ map: caneTexture(), roughness: 0.8 }) : null;
    const wood = new THREE.MeshStandardMaterial({ color: theme.nightstand, roughness: 0.55 });
    const metal = new THREE.MeshStandardMaterial({ color: theme.metal, roughness: 0.3, metalness: 1 });
    const lampBase = new THREE.MeshStandardMaterial({ color: theme.lampBase, roughness: 0.35, metalness: theme.lampBase === theme.metal ? 1 : 0 });
    const shade = new THREE.MeshStandardMaterial({ color: theme.shade, emissive: "#ffcf8a", emissiveIntensity: 2.6, side: THREE.DoubleSide, toneMapped: false });
    const sheer = new THREE.MeshStandardMaterial({ color: "#f2ece2", roughness: 1, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const upholstery = new THREE.MeshPhysicalMaterial({ color: theme.headboard, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color(theme.headboardSheen) });
    return { paint, floor, rug, accent, cane, wood, metal, lampBase, shade, sheer, upholstery };
  }, [mats, theme]);
  useEffect(() => () => Object.values(m).forEach((x) => x?.dispose()), [m]);

  const g = useMemo(() => {
    const winHoles = [-1, 1].map((s) => ({ x: s * winX, y: 0.35, w: 1.2, h: 2.65 }));
    return {
      floor: plane(f.width - HOUSE.wall, f.depth - HOUSE.wall, theme.floor === "marble" ? 1.4 : 2.2),
      back: wallShape(f.width - HOUSE.wall, H, winHoles),
      side: wallShape(f.depth - HOUSE.wall, H),
      rug: plane(3.2, 2.4, 0.9),
      arch: archShape(3.2, 3.05),
      curtain: (() => {
        const c = new THREE.PlaneGeometry(0.75, H - 0.2, 30, 1);
        const p = c.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) p.setZ(i, 0.05 * Math.sin((p.getX(i) / 0.75) * Math.PI * 7));
        c.computeVertexNormals();
        return c;
      })(),
    };
  }, [f.width, f.depth, H, winX, theme.floor]);
  useEffect(() => () => Object.values(g).forEach((x) => x.dispose()), [g]);

  const on = active;
  const nightX = 1.62;
  const topY = 0.56;

  return (
    <group position={[f.x, 0, f.z]} rotation={[0, f.rot, 0]}>
      {/* Floor, and the three painted walls around the bed */}
      <mesh geometry={g.floor} material={m.floor} position={[0, 0.004, 0]} receiveShadow />
      <mesh geometry={g.back} material={m.paint} position={[0, 0, -wallIn]} />
      <mesh geometry={g.side} material={m.paint} position={[-sideIn, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={g.side} material={m.paint} position={[sideIn, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* The feature wall behind the bed */}
      {theme.accent === "slats" &&
        Array.from({ length: 21 }, (_, i) => (
          <mesh key={i} position={[-2.5 + i * 0.25, H / 2 - 0.1, -wallIn + 0.03]} material={m.accent} castShadow>
            <boxGeometry args={[0.09, H - 0.2, 0.05]} />
          </mesh>
        ))}
      {theme.accent === "fluted" && (
        <group position={[0, 0, -wallIn + 0.02]}>
          {Array.from({ length: 40 }, (_, i) => (
            <mesh key={i} position={[-2.9 + i * 0.149, H / 2 - 0.1, 0]} rotation={[0, 0, 0]} material={m.accent}>
              <cylinderGeometry args={[0.07, 0.07, H - 0.2, 12, 1, false, Math.PI, Math.PI]} />
            </mesh>
          ))}
          <mesh position={[0, H - 0.18, 0.08]} material={m.metal}>
            <boxGeometry args={[6.1, 0.03, 0.02]} />
          </mesh>
        </group>
      )}
      {theme.accent === "cane" && m.cane && (
        <group position={[0, 0, -wallIn + 0.03]}>
          <mesh position={[0, 1.55, 0]} material={m.cane}>
            <planeGeometry args={[4.4, 2.2]} />
          </mesh>
          {[
            [0, 2.68, 4.56, 0.08],
            [0, 0.42, 4.56, 0.08],
            [-2.24, 1.55, 0.08, 2.34],
            [2.24, 1.55, 0.08, 2.34],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, 0.02]} material={m.wood}>
              <boxGeometry args={[w, h, 0.05]} />
            </mesh>
          ))}
        </group>
      )}
      {theme.accent === "arch" && (
        <group position={[0, 0, -wallIn + 0.02]}>
          <mesh geometry={g.arch} material={m.accent} />
          {/* a brass line tracing the arch */}
          <mesh position={[0, 3.05 - 1.6, 0.012]} material={m.metal}>
            <torusGeometry args={[1.68, 0.018, 8, 48, Math.PI]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.68, (3.05 - 1.6) / 2, 0.012]} material={m.metal}>
              <boxGeometry args={[0.036, 3.05 - 1.6, 0.036]} />
            </mesh>
          ))}
        </group>
      )}

      {/* The bed */}
      <BedroomBed theme={theme} active={on} onSelect={onSelect} position={[0, 0, bedZ]} />

      {/* Bedside tables and lamps */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * nightX, 0, back + 0.6]}>
          <RoundedBox args={[0.56, 0.44, 0.44]} radius={0.02} position={[0, 0.34, 0]} material={m.wood} castShadow />
          <mesh position={[0, 0.34, 0.225]} material={m.metal}>
            <boxGeometry args={[0.18, 0.015, 0.01]} />
          </mesh>
          {[-0.24, 0.24].map((lx) =>
            [-0.18, 0.18].map((lz) => (
              <mesh key={`${lx}${lz}`} position={[lx, 0.06, lz]} material={m.metal}>
                <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
              </mesh>
            ))
          )}
          <group position={[s * 0.1, topY, 0]}>
            <mesh position={[0, 0.13, 0]} material={m.lampBase}>
              <cylinderGeometry args={[0.07, 0.1, 0.26, 20]} />
            </mesh>
            <mesh position={[0, 0.34, 0]} material={m.metal}>
              <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
            </mesh>
            <mesh position={[0, 0.48, 0]} material={m.shade}>
              <cylinderGeometry args={[0.13, 0.17, 0.22, 28, 1, true]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Photo frames on the right-hand table: Our Story */}
      <Hotspot id="story" label="Our Story" anchor={[nightX - 0.2, 1.05, back + 0.75]} active={on} onSelect={onSelect}>
        <Model name="standing_picture_frame_01" at={[nightX - 0.2, topY, back + 0.66]} rot={-Math.PI / 2 - 0.3} scale={1.25} />
        <Model name="standing_picture_frame_02" at={[-nightX + 0.2, topY, back + 0.66]} rot={-Math.PI / 2 + 0.3} scale={1.25} />
      </Hotspot>

      {/* A bookshelf against the left wall: the Sleep Library */}
      <Hotspot id="library" label="Sleep Library" anchor={[-f.width / 2 + 0.5, 2.35, back + 1.35]} active={on} onSelect={onSelect}>
        <group position={[-f.width / 2 + 0.42, 0, back + 1.35]} rotation={[0, Math.PI / 2, 0]}>
          <Model name="steel_frame_shelves_01" at={[0, 0, 0]} scale={0.1} />
          <Model name="book_encyclopedia_set_01" at={[-0.38, 0.06, 0]} />
          <Model name="book_encyclopedia_set_01" at={[-0.38, 0.6, 0]} />
          <Model name="book_encyclopedia_set_01" at={[-0.38, 1.15, 0]} />
          <Model name="ceramic_vase_01" at={[0.3, 0.61, 0.05]} scale={0.6} />
          <Model name="potted_plant_04" at={[0.3, 1.66, 0.05]} />
        </group>
      </Hotspot>

      {/* Rug */}
      <mesh geometry={g.rug} material={m.rug} position={[0, 0.008, bedZ + 0.9]} receiveShadow />

      {/* Sheer curtains beside each window */}
      {[-1, 1].flatMap((s) => [-0.75, 0.75].map((o) => (
        <mesh key={`${s}${o}`} geometry={g.curtain} material={m.sheer} position={[s * winX + o, H / 2 - 0.05, -wallIn + 0.12]} />
      )))}

      {/* Theme extras */}
      {theme.extras.includes("lounge") && <Model name="mid_century_lounge_chair" at={[f.width / 2 - 1.1, 0, back + 1.5]} rot={-0.7} />}
      {theme.extras.includes("plants") && (
        <>
          <Model name="potted_plant_02" at={[f.width / 2 - 0.5, 0, back + 0.5]} />
          <Model name="potted_plant_01" at={[-f.width / 2 + 0.5, 0, f.depth / 2 - 0.9]} scale={1.2} />
        </>
      )}
      {theme.extras.includes("bench") && (
        <group position={[0, 0, bedZ + BED_D / 2 + 0.45]}>
          <RoundedBox args={[1.6, 0.14, 0.45]} radius={0.05} position={[0, 0.42, 0]} material={m.upholstery} castShadow />
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, 0.18, 0]} material={m.metal}>
              <boxGeometry args={[0.04, 0.36, 0.4]} />
            </mesh>
          ))}
        </group>
      )}
      {theme.extras.includes("art") && <Model name="hanging_picture_frame_02" at={[-f.width / 2 + 0.16, 1.9, 0.6]} rot={Math.PI / 2} scale={2.2} />}
    </group>
  );
}
