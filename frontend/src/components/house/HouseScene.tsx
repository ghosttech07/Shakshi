"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PerformanceMonitor, useTexture } from "@react-three/drei";
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { memo, Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { Architecture } from "./Architecture";
import { Bedroom } from "./Bedroom";
import { Furniture } from "./Furniture";
import type { HotspotId } from "./Hotspot";
import { BEDROOMS, PATH, roomFrame, type ThemeId } from "./layout";
import { useSurfaces } from "./materials";
import { THEMES } from "./themes";

const SKY_TURN = 0;
const SKY = "/house/env/qwantani_dusk_2_puresky";

/**
 * Moves the camera along the route as the visitor scrolls (progress 0 → 1). The position follows a
 * smooth curve; the view turns by angle (yaw and pitch), so swinging from a left bedroom to a
 * right one is a clean turn, never a flip.
 */
function CameraRig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const route = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p.pos)), false, "centripetal");
    let prev = 0;
    const angles = PATH.map((p, i) => {
      const dx = p.look[0] - p.pos[0];
      const dy = p.look[1] - p.pos[1];
      const dz = p.look[2] - p.pos[2];
      let yaw = Math.atan2(dx, dz);
      if (i > 0) {
        while (yaw - prev > Math.PI) yaw -= Math.PI * 2;
        while (yaw - prev < -Math.PI) yaw += Math.PI * 2;
      }
      prev = yaw;
      return { yaw, pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
    });
    return { curve, angles };
  }, []);
  const state = useMemo(() => ({ p: progress.current, sx: 0, sy: 0 }), [progress]);

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    state.p = THREE.MathUtils.damp(state.p, progress.current, 4, step);
    const p = THREE.MathUtils.clamp(state.p, 0, 1);
    let i = 0;
    while (i < PATH.length - 2 && p > PATH[i + 1].at) i++;
    const a = PATH[i].at;
    const b = PATH[i + 1].at;
    const e = THREE.MathUtils.smootherstep(p, a, b);
    camera.position.copy(route.curve.getPoint((i + e) / (PATH.length - 1)));
    let yaw = THREE.MathUtils.lerp(route.angles[i].yaw, route.angles[i + 1].yaw, e);
    let pitch = THREE.MathUtils.lerp(route.angles[i].pitch, route.angles[i + 1].pitch, e);
    // Standing in a bedroom, the view leans a little toward the pointer, so the room feels alive
    const still = PATH[i].room && PATH[i].room === PATH[i + 1].room ? 1 : 0;
    state.sx = THREE.MathUtils.damp(state.sx, pointer.x * still, 2.5, step);
    state.sy = THREE.MathUtils.damp(state.sy, pointer.y * still, 2.5, step);
    yaw -= state.sx * 0.12;
    pitch += state.sy * 0.05;
    const c = Math.cos(pitch);
    camera.lookAt(camera.position.x + Math.sin(yaw) * c, camera.position.y + Math.sin(pitch), camera.position.z + Math.cos(yaw) * c);
  });
  return null;
}

/** The blue-hour sky as the visible background (the lighting comes from its HDR twin). */
function Sky() {
  const { scene } = useThree();
  const tex = useTexture(`${SKY}_bg.webp`);
  useEffect(() => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
    // Turns the panorama so the sunset glows behind the house (dev: ?sky=<radians> to try others)
    const q = Number(new URLSearchParams(location.search).get("sky"));
    const turn = Number.isFinite(q) && location.search.includes("sky=") ? q : SKY_TURN;
    scene.backgroundRotation.set(0, turn, 0);
    scene.backgroundIntensity = 0.8;
    scene.environmentRotation.set(0, turn, 0);
    scene.fog = new THREE.Fog("#8f86a3", 90, 300);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, tex]);
  return null;
}

type LightSpec = { pos: [number, number, number]; color: string; intensity: number; distance: number };
type Zone = { centre: THREE.Vector3; lights: [LightSpec, LightSpec] };

/** A point given in a bedroom's own frame (headboard wall at local −z), placed in the house. */
function inRoom(id: ThemeId, x: number, y: number, z: number): [number, number, number] {
  const f = roomFrame(BEDROOMS.find((b) => b.id === id)!);
  const c = Math.cos(f.rot);
  const s = Math.sin(f.rot);
  return [f.x + x * c + z * s, y, f.z - x * s + z * c];
}

/**
 * Four warm lights that travel with the visitor: the two zones nearest the camera get two lights
 * each, the farther one faded by distance. The number of lights never changes, so nothing
 * recompiles mid-scroll, yet whichever room you're in is lit.
 */
function RoamingLights() {
  const zones = useMemo<Zone[]>(() => {
    const warm = "#ffe6c6";
    const list: Zone[] = [
      { centre: new THREE.Vector3(0, 2, 13), lights: [{ pos: [-3, 3.1, 7.4], color: "#ffcf92", intensity: 11, distance: 10 }, { pos: [3, 3.1, 7.4], color: "#ffcf92", intensity: 11, distance: 10 }] },
      { centre: new THREE.Vector3(0, 1.6, 3), lights: [{ pos: [-5, 3.0, 3], color: warm, intensity: 10, distance: 12 }, { pos: [4.5, 3.0, 3], color: warm, intensity: 8, distance: 11 }] },
      { centre: new THREE.Vector3(0, 1.6, -3), lights: [{ pos: [-3.4, 2.6, -3], color: "#ffdcae", intensity: 7, distance: 9 }, { pos: [4.6, 3.0, -3], color: warm, intensity: 6, distance: 9 }] },
      { centre: new THREE.Vector3(0, 1.6, -14), lights: [{ pos: [0, 3.1, -9], color: warm, intensity: 4, distance: 8 }, { pos: [0, 3.1, -19], color: warm, intensity: 4, distance: 8 }] },
    ];
    for (const b of BEDROOMS) {
      const t = THEMES[b.id];
      const f = roomFrame(b);
      const dark = t.id === "midnight" || t.id === "terracotta";
      list.push({
        centre: new THREE.Vector3(f.x * 0.55, 1.6, f.z),
        lights: [
          { pos: inRoom(b.id, 0, 3.0, 0.6), color: t.light, intensity: dark ? 10 : 7.5, distance: 10 },
          { pos: inRoom(b.id, 0, 1.3, -f.depth / 2 + 1.3), color: "#ffc98a", intensity: dark ? 4.5 : 3.5, distance: 5 },
        ],
      });
    }
    return list;
  }, []);
  const refs = useRef<(THREE.PointLight | null)[]>([]);
  const slots = useRef<(number | null)[]>([null, null]); // the zone each pair of lights is serving
  const cam = useThree((s) => s.camera);

  useFrame(() => {
    const d = zones.map((z) => z.centre.distanceTo(cam.position));
    const order = d.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0]);
    const want = [order[0][1], order[1][1]];
    // A zone keeps the pair it already has; a newcomer takes the freed pair, so lights never jump
    const next = slots.current.map((z) => (z !== null && want.includes(z) ? z : null));
    for (const z of want) if (!next.includes(z)) next[next.indexOf(null)] = z;
    slots.current = next;
    const near = order[0][0];
    next.forEach((zi, k) => {
      if (zi === null) return;
      const fade = THREE.MathUtils.clamp(1.5 - (d[zi] - near) / 5, 0, 1);
      zones[zi].lights.forEach((spec, j) => {
        const l = refs.current[k * 2 + j];
        if (!l) return;
        l.position.set(...spec.pos);
        l.color.set(spec.color);
        l.intensity = spec.intensity * fade;
        l.distance = spec.distance;
      });
    });
  });
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <pointLight
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          decay={2}
          intensity={0}
        />
      ))}
    </>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#cfc6e6", "#3b3530", 0.22]} />
      {/* Blue hour: the last soft light of the sky, from behind and to the left */}
      <directionalLight
        position={[-26, 14, -18]}
        intensity={0.9}
        color="#d7cdea"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-far={110}
      />
      <RoamingLights />
    </>
  );
}

/** Nothing in the house moves, so its shadows are drawn a few times while it settles, not every frame. */
function StillShadows() {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);
  useFrame(() => {
    const n = ++frames.current;
    if (n < 300 && n % 30 === 0) gl.shadowMap.needsUpdate = true;
  });
  return null;
}

function House({ progress, room, onSelect }: { progress: MutableRefObject<number>; room: ThemeId | null; onSelect: (id: HotspotId) => void }) {
  const mats = useSurfaces();
  return (
    <>
      <Architecture mats={mats} progress={progress} />
      <Furniture mats={mats} />
      {BEDROOMS.map((b) => (
        <Bedroom key={b.id} room={b} theme={THEMES[b.id]} mats={mats} active={room === b.id} onSelect={onSelect} />
      ))}
    </>
  );
}

/** Development aid (?debug): logs draw calls, triangles, lights and frame rate every 2 seconds. */
function Perf() {
  const { gl, scene } = useThree();
  const acc = useRef({ t: 0, n: 0, last: 0 });
  const on = useMemo(() => typeof location !== "undefined" && location.search.includes("debug"), []);
  useFrame((_, dt) => {
    if (!on) return;
    const a = acc.current;
    a.t += dt;
    a.n++;
    if (a.t - a.last < 2) return;
    a.last = a.t;
    let lights = 0;
    let casters = 0;
    scene.traverse((o) => {
      if ((o as THREE.Light).isLight && o.visible) lights++;
      if ((o as THREE.Mesh).isMesh && o.castShadow) casters++;
    });
    console.log(`[perf] calls ${gl.info.render.calls} · triangles ${gl.info.render.triangles} · lights ${lights} · shadow casters ${casters} · ${(a.n / 2).toFixed(0)} fps`);
    a.n = 0;
  });
  return null;
}

/** Tells the page the first frames of the finished house are on screen. */
function Ready({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 4) onReady();
  });
  return null;
}

type Props = { progress: MutableRefObject<number>; room: ThemeId | null; onSelect: (id: HotspotId) => void; onReady: () => void; lite?: boolean };

function HouseScene({ progress, room, onSelect, onReady, lite = false }: Props) {
  // Sharpness adapts to the device: it steps down if frames start to slip, so scrolling stays smooth
  const [dpr, setDpr] = useState(lite ? 1 : 1.5);
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ fov: 50, near: 0.05, far: 500, position: PATH[0].pos }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping, powerPreference: "high-performance", stencil: false }}
      aria-hidden
    >
      <PerformanceMonitor
        flipflops={4}
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(lite ? 1.25 : 1.75, d + 0.25))}
      />
      <Suspense fallback={null}>
        <Sky />
        <Environment files={`${SKY}_1k.hdr`} environmentIntensity={0.6} />
        <Lights />
        <StillShadows />
        <House progress={progress} room={room} onSelect={onSelect} />
        <CameraRig progress={progress} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO halfRes aoRadius={0.9} distanceFalloff={0.8} intensity={lite ? 1.6 : 2.4} quality={lite ? "performance" : "medium"} />
          <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.55} />
          <HueSaturation saturation={0.06} />
          <BrightnessContrast contrast={0.08} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.28} darkness={0.55} />
          <SMAA />
        </EffectComposer>
        <Ready onReady={onReady} />
        <Perf />
      </Suspense>
    </Canvas>
  );
}

/** Scrolling re-renders the page around the scene; the scene itself re-renders only when its props change. */
export default memo(HouseScene);
