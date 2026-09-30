"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PerformanceMonitor } from "@react-three/drei";
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

const SKY_TURN = 3.3;
const SKY = "/house/env/qwantani_dusk_2_puresky";

/**
 * Moves the camera along the route as the visitor scrolls (progress 0 → 1). The position follows a
 * smooth curve; the view turns by angle (yaw and pitch), so swinging from a left bedroom to a
 * right one is a clean turn, never a flip.
 */
function CameraRig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  // On a portrait phone the room is narrower than the bed, so the camera stands back in the corridor with a wider lens
  const narrow = useThree((st) => st.size.width / st.size.height < 0.8);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = narrow ? 57 : 50;
    cam.updateProjectionMatrix();
  }, [camera, narrow]);
  const route = useMemo(() => {
    const keys = PATH.map((p) => (narrow && p.room ? { ...p, pos: [Math.sign(p.look[0]) * 0.55, p.pos[1], p.pos[2]] as [number, number, number] } : p));
    const curve = new THREE.CatmullRomCurve3(keys.map((p) => new THREE.Vector3(...p.pos)), false, "centripetal");
    let prev = 0;
    const angles = keys.map((p, i) => {
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
  }, [narrow]);
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

/** Turns the panorama so the sunset glows behind the house (dev: ?sky=<radians> to try others). */
function skyTurn(): [number, number, number] {
  const q = typeof location === "undefined" ? NaN : Number(new URLSearchParams(location.search).get("sky") ?? NaN);
  return [0, Number.isFinite(q) ? q : SKY_TURN, 0];
}

/** Where the last of the sun glows on the horizon: behind the house, as you walk up to it. */
const SUN = new THREE.Vector3(-0.79, 0, -0.62).normalize();

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // always at the far plane, behind everything
  }
`;
const skyFrag = /* glsl */ `
  uniform vec3 zenith, upper, mid, horizon, glow, ground, sun;
  varying vec3 vDir;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(horizon, mid, smoothstep(0.0, 0.12, h));
    col = mix(col, upper, smoothstep(0.1, 0.38, h));
    col = mix(col, zenith, smoothstep(0.35, 0.95, h));
    // the afterglow: strongest on the horizon toward the sun, fading up and around
    float toward = max(dot(normalize(vec3(d.x, 0.0, d.z)), sun), 0.0);
    col += glow * pow(toward, 5.0) * exp(-max(h, 0.0) * 7.0);
    col += glow * 0.25 * pow(toward, 1.5) * exp(-max(h, 0.0) * 14.0);
    // a few early stars, high up
    vec3 cell = floor(d * 260.0);
    float star = step(0.9975, hash(cell)) * smoothstep(0.3, 0.8, h) * (0.5 + 0.5 * hash(cell + 1.0));
    col += vec3(star) * 0.35;
    // below the horizon (only seen past the hills): dusk haze
    col = mix(col, ground, smoothstep(0.0, -0.06, h));
    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * The blue-hour sky: deep indigo overhead, a warm afterglow low on the horizon behind the house,
 * a few early stars. Drawn by a small shader (no image to download); the lighting comes from the HDR.
 */
function Sky() {
  const { scene } = useThree();
  const mat = useMemo(() => {
    const c = (hex: string) => new THREE.Color(hex);
    return new THREE.ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      uniforms: {
        zenith: { value: c("#070d24") },
        upper: { value: c("#152152") },
        mid: { value: c("#3b4381") },
        horizon: { value: c("#b98493") },
        glow: { value: c("#ff9a55") },
        ground: { value: c("#2c2c48") },
        sun: { value: SUN },
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
  }, []);
  useEffect(() => {
    scene.background = null;
    scene.fog = new THREE.Fog("#34345a", 70, 290);
    return () => {
      scene.fog = null;
      mat.dispose();
    };
  }, [scene, mat]);
  const cam = useThree((st) => st.camera);
  const dome = useRef<THREE.Mesh>(null);
  // the dome travels with the camera, so it's always infinitely far away
  useFrame(() => dome.current?.position.copy(cam.position));
  return (
    <mesh ref={dome} material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 48, 24]} />
    </mesh>
  );
}

/**
 * Outside, the evening is cool and dim, so the lit rooms glow warm through the glass; indoors the
 * ambient light comes up to a comfortable level. Blended by where the camera is.
 */
function Ambience() {
  const { scene, camera } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    const inside = THREE.MathUtils.smoothstep(-camera.position.z, -9.5, -5.5); // 0 in the garden → 1 past the front glass
    scene.environmentIntensity = THREE.MathUtils.lerp(0.2, 0.6, inside);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.26, 0.16, inside);
  });
  return <hemisphereLight ref={hemi} args={["#34427a", "#1b1812", 0.26]} />;
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
    const list: Zone[] = [
      // from the garden: the terrace under the soffit, and the living room glowing through the glass
      { centre: new THREE.Vector3(0, 2, 13), lights: [{ pos: [0, 3.1, 7.4], color: "#ffcf92", intensity: 12, distance: 11 }, { pos: [-1.5, 2.7, 2.5], color: "#ffc07e", intensity: 16, distance: 14 }] },
      { centre: new THREE.Vector3(0, 1.6, 3), lights: [{ pos: [-5, 2.45, 3], color: "#ffc387", intensity: 8, distance: 11 }, { pos: [4.5, 2.45, 2], color: "#ffc387", intensity: 7, distance: 11 }] },
      { centre: new THREE.Vector3(0, 1.6, -3), lights: [{ pos: [-3.4, 2.4, -3], color: "#ffc387", intensity: 7, distance: 9 }, { pos: [4.6, 2.9, -3], color: "#ffcf9a", intensity: 6, distance: 9 }] },
      { centre: new THREE.Vector3(0, 1.6, -14), lights: [{ pos: [0, 2.7, -9], color: "#ffcf9a", intensity: 4, distance: 8 }, { pos: [0, 2.7, -19], color: "#ffcf9a", intensity: 4, distance: 8 }] },
    ];
    for (const b of BEDROOMS) {
      const t = THEMES[b.id];
      const f = roomFrame(b);
      const dark = t.id === "midnight" || t.id === "terracotta";
      list.push({
        centre: new THREE.Vector3(f.x * 0.55, 1.6, f.z),
        lights: [
          // the room's ceiling light, over the foot of the bed
          { pos: inRoom(b.id, 0, 3.05, -0.9), color: t.light, intensity: dark ? 6.5 : 4.2, distance: 9 },
          // a warm wash grazing down the wall behind the bed
          { pos: inRoom(b.id, 0, 2.75, -f.depth / 2 + 0.75), color: "#ffc98a", intensity: dark ? 2.6 : 1.7, distance: 4 },
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
      <Ambience />
      {/* Blue hour: the last soft light of the sky, from behind and to the left */}
      <directionalLight
        position={[-26, 14, -18]}
        intensity={0.55}
        color="#9fb0e6"
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
  const turn = useMemo(skyTurn, []);
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
        <Environment files={`${SKY}_1k.hdr`} environmentIntensity={0.6} environmentRotation={turn} />
        <Sky />
        <Lights />
        <StillShadows />
        <House progress={progress} room={room} onSelect={onSelect} />
        <CameraRig progress={progress} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO halfRes aoRadius={0.9} distanceFalloff={0.8} intensity={lite ? 1.6 : 2.4} quality={lite ? "performance" : "medium"} />
          <Bloom mipmapBlur luminanceThreshold={1.6} luminanceSmoothing={0.3} intensity={0.7} />
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
