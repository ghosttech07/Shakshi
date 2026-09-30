"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BASE, CW, D, FRAME_H, H, LEG, THROW_D, THROW_W, THROW_Z, TOP, W, Z0, Z1, drape, pillowGeometry, throwRest } from "@/components/three/HeroScene";
import { duvetTexture, knitTexture, linenTexture, quiltTexture, woodTexture } from "@/components/three/fabric";
import { Hotspot, type HotspotId } from "./Hotspot";
import type { Theme } from "./themes";

/** A settled surface (duvet or throw) built once from its resting shape. */
function settled(w: number, d: number, sx: number, sz: number, z: number, rest: (x: number, z: number, out: THREE.Vector3) => void) {
  const g = new THREE.PlaneGeometry(w, d, sx, sz);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0, z);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    rest(pos.getX(i), pos.getZ(i), v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The bedroom's bed. The mattress, the two pillows and the bedding are each their own
 * clickable object: mattresses, pillows and covers.
 */
export function BedroomBed({ theme, active, onSelect, position }: { theme: Theme; active: boolean; onSelect: (id: HotspotId) => void; position: [number, number, number] }) {
  const tex = useMemo(() => {
    const duvet = duvetTexture();
    duvet.repeat.set(8, 6);
    return { quilt: quiltTexture(5), linen: linenTexture(9), wood: woodTexture(), duvet, knit: knitTexture([18, 5]) };
  }, []);
  const geo = useMemo(
    () => ({
      duvet: settled(CW, Z1 - Z0, 90, 80, (Z0 + Z1) / 2, drape),
      throw: settled(THROW_W, THROW_D, 80, 24, THROW_Z, throwRest),
      pillow: pillowGeometry(0.8, 0.52, 0.2),
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

  const upholstery = <meshPhysicalMaterial color={theme.headboard} roughness={0.92} sheen={1} sheenRoughness={0.5} sheenColor={theme.headboardSheen} bumpMap={tex.linen} bumpScale={1.1} />;
  const HB_W = W + 0.5;
  const CH = 9;
  const cw = HB_W / CH;
  const legs: [number, number][] = [
    [-(W / 2 - 0.08), -(D / 2 - 0.12)],
    [W / 2 - 0.08, -(D / 2 - 0.12)],
    [-(W / 2 - 0.08), D / 2 - 0.12],
    [W / 2 - 0.08, D / 2 - 0.12],
  ];

  return (
    <group position={position}>
      {/* Frame, legs and the channel-tufted headboard */}
      {legs.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, LEG / 2, z]} castShadow>
          <cylinderGeometry args={[0.032, 0.022, LEG, 20]} />
          <meshStandardMaterial color={theme.metal} roughness={0.4} metalness={0.6} bumpMap={tex.wood} bumpScale={0.6} />
        </mesh>
      ))}
      <RoundedBox args={[W + 0.14, FRAME_H, D + 0.1]} radius={0.045} smoothness={5} position={[0, LEG + FRAME_H / 2, 0.02]} castShadow receiveShadow>
        {upholstery}
      </RoundedBox>
      {Array.from({ length: CH }, (_, k) => (
        <RoundedBox key={k} args={[cw - 0.008, 1.3, 0.14]} radius={0.06} smoothness={5} position={[-HB_W / 2 + cw * (k + 0.5), LEG + 0.65, -D / 2 - 0.12]} castShadow receiveShadow>
          {upholstery}
        </RoundedBox>
      ))}

      {/* The mattress */}
      <Hotspot id="mattresses" label="Mattresses" anchor={[W / 2 + 0.05, BASE + H / 2, D / 2 - 0.2]} active={active} onSelect={onSelect}>
        <RoundedBox args={[W, H, D]} radius={0.06} smoothness={5} position={[0, BASE + H / 2, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#f3eee5" roughness={0.9} sheen={0.7} sheenColor="#ffffff" bumpMap={tex.quilt} bumpScale={1.2} />
        </RoundedBox>
      </Hotspot>

      {/* Two pillows */}
      <Hotspot id="pillows" label="Pillows" anchor={[0, TOP + 0.42, -D / 2 + 0.4]} active={active} onSelect={onSelect}>
        {[-0.47, 0.47].map((x) => (
          <mesh key={x} geometry={geo.pillow} position={[x, TOP + 0.17, -D / 2 + 0.36]} rotation={[-0.62, x > 0 ? -0.04 : 0.04, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color={theme.pillow} roughness={0.85} sheen={1} sheenRoughness={0.4} sheenColor="#ffffff" />
          </mesh>
        ))}
      </Hotspot>

      {/* Bedding: the duvet and the knitted throw */}
      <Hotspot id="covers" label="Covers & bedding" anchor={[-0.6, TOP + 0.12, 0.35]} active={active} onSelect={onSelect}>
        <mesh geometry={geo.duvet} castShadow receiveShadow>
          <meshPhysicalMaterial color={theme.duvet} roughness={0.82} sheen={1} sheenRoughness={0.45} sheenColor="#fff6e8" bumpMap={tex.duvet} bumpScale={2.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={geo.throw} castShadow receiveShadow>
          <meshPhysicalMaterial color={theme.throw} roughness={0.95} sheen={1} sheenRoughness={0.6} sheenColor="#f1d6ae" bumpMap={tex.knit} bumpScale={3} side={THREE.DoubleSide} />
        </mesh>
      </Hotspot>
    </group>
  );
}
