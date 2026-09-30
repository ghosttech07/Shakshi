"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

/**
 * Real materials for the house (Poly Haven, CC0): colour, surface detail and roughness maps.
 * Geometry built with `box()` / `plane()` below carries UVs in metres, so a texture's `tile`
 * (its real-world size) keeps it the same scale on every wall and floor.
 */
const T = "/house/textures/";

export type Surface = {
  name: string; // Poly Haven texture id
  tile: number; // metres covered by one repeat of the texture
  tint?: string;
  rough?: number; // roughness multiplier
  normal?: number;
  noRough?: boolean;
  /** Keep the weave (surface detail) but not the texture's own colour: the tint is the colour. */
  noColour?: boolean;
  /** How strongly the sky is reflected (interiors less, so rooms keep their own warm light). */
  env?: number;
};

export const SURFACES = {
  oakFloor: { name: "herringbone_parquet", tile: 2.2, tint: "#fff1dd", rough: 0.82, normal: 0.55, env: 0.4 },
  plaster: { name: "beige_wall_001", tile: 2.5, tint: "#dccab0", rough: 0.95, normal: 0.3, noColour: true, env: 0.35 },
  marble: { name: "marble_01", tile: 1.6, tint: "#f6f1ea", rough: 0.35, normal: 0.3, env: 0.6 },
  linen: { name: "rough_linen", tile: 0.5, tint: "#cdbfa9", rough: 1, normal: 1.1, noColour: true, env: 0.35 },
  wool: { name: "poly_wool_herringbone", tile: 0.9, tint: "#b9a88f", rough: 1, normal: 1.8, noColour: true, env: 0.3 },
  darkOak: { name: "black_oak_veneer", tile: 1.2, tint: "#6b4e36", rough: 0.7, normal: 0.5, env: 0.45 },
  stone: { name: "exterior_wall_cladding", tile: 2.4, tint: "#c9c1b4", rough: 1, normal: 1 },
  render: { name: "exterior_wall_cladding_03", tile: 3, tint: "#f1ece4", rough: 1, normal: 0.4 },
  lawn: { name: "grass_ground", tile: 3, tint: "#8fa05f", rough: 1, normal: 0.8 },
  paving: { name: "stone_tiles_02", tile: 2.4, tint: "#d8d0c3", rough: 0.9, normal: 0.7 },
  concrete: { name: "brushed_concrete", tile: 3, tint: "#cfc9c0", rough: 0.9, normal: 0.5 },
} satisfies Record<string, Surface>;

export type SurfaceKey = keyof typeof SURFACES;

/** One PBR material per surface, shared by every mesh that uses it. */
export function useSurfaces() {
  const keys = Object.keys(SURFACES) as SurfaceKey[];
  const urls = keys.flatMap((k) => {
    const s: Surface = SURFACES[k];
    return [`${T}${s.name}_diff.webp`, `${T}${s.name}_nor.webp`, `${T}${s.name}_rough.webp`];
  });
  const tex = useTexture(urls);
  return useMemo(() => {
    const out = {} as Record<SurfaceKey, THREE.MeshStandardMaterial>;
    keys.forEach((k, i) => {
      const s: Surface = SURFACES[k];
      const [map, normalMap, roughnessMap] = tex.slice(i * 3, i * 3 + 3);
      for (const t of [map, normalMap, roughnessMap]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 8;
      }
      map.colorSpace = THREE.SRGBColorSpace;
      out[k] = new THREE.MeshStandardMaterial({
        map: s.noColour ? null : map,
        normalMap,
        normalScale: new THREE.Vector2(s.normal ?? 1, s.normal ?? 1),
        roughnessMap,
        roughness: s.rough ?? 1,
        color: s.tint ?? "#ffffff",
        envMapIntensity: s.env ?? 0.9,
      });
      out[k].userData.tile = s.tile;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex]);
}

/** A box whose texture coordinates are in metres divided by `tile` (so textures keep true scale). */
export function box(w: number, h: number, d: number, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // Face order: +x, -x, +y, -y, +z, -z (4 vertices each)
  const dims: [number, number][] = [
    [d, h], [d, h], [w, d], [w, d], [w, h], [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    const [a, b] = dims[f];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * a) / tile, (uv.getY(i) * b) / tile);
    }
  }
  return g;
}

/** A flat floor/ground piece lying on XZ, texture in metres. */
export function plane(w: number, d: number, tile = 1) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * d) / tile);
  return g;
}
