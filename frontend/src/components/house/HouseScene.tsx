"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, type MutableRefObject } from "react";
import * as THREE from "three";
import { Architecture } from "./Architecture";
import { BedroomBed } from "./BedroomBed";
import { Furniture } from "./Furniture";
import type { HotspotId } from "./Hotspot";
import { PATH } from "./layout";
import { useSurfaces } from "./materials";

/** Moves the camera along the path as the visitor scrolls (progress 0 → 1), gently smoothed. */
function CameraRig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const curves = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p.pos)), false, "centripetal");
    const look = new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p.look)), false, "centripetal");
    return { pos, look };
  }, []);
  const smooth = useMemo(() => ({ p: progress.current }), [progress]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const sway = useMemo(() => new THREE.Vector2(), []);

  useFrame((_, dt) => {
    smooth.p = THREE.MathUtils.damp(smooth.p, progress.current, 3.2, Math.min(dt, 0.05));
    // Which stretch of the path we're on, then where along it
    const p = THREE.MathUtils.clamp(smooth.p, 0, 1);
    let i = 0;
    while (i < PATH.length - 2 && p > PATH[i + 1].at) i++;
    const a = PATH[i].at;
    const b = PATH[i + 1].at;
    const u = (i + THREE.MathUtils.smootherstep(p, a, b)) / (PATH.length - 1);
    camera.position.copy(curves.pos.getPoint(u));
    target.copy(curves.look.getPoint(u));
    // In the bedroom the view leans a touch toward the pointer, so the room feels alive
    const settle = THREE.MathUtils.smoothstep(p, 0.94, 1);
    sway.x = THREE.MathUtils.damp(sway.x, pointer.x * settle, 2.5, dt);
    sway.y = THREE.MathUtils.damp(sway.y, pointer.y * settle, 2.5, dt);
    target.x += sway.x * 0.6;
    target.y += sway.y * 0.25;
    camera.lookAt(target);
  });
  return null;
}

/** The sunset sky as the visible background (the lighting comes from its HDR twin). */
function Sky() {
  const { scene } = useThree();
  const tex = useTexture("/house/env/belfast_sunset_puresky_bg.webp");
  useEffect(() => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
    scene.backgroundRotation.set(0, Math.PI * 0.62, 0);
    scene.backgroundIntensity = 1.05;
    scene.environmentRotation.set(0, Math.PI * 0.62, 0);
    scene.fog = new THREE.Fog("#caa58a", 45, 150);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, tex]);
  return null;
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#ffe3c4", "#3a3128", 0.35]} />
      {/* Low sunset sun from behind the house, to the left */}
      <directionalLight
        position={[-26, 11, -18]}
        intensity={2.4}
        color="#ffb877"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-far={90}
      />
      {/* Warm interior light: the house glows from within at dusk */}
      <pointLight position={[-3.5, 3.0, 3]} intensity={9} distance={11} decay={2} color="#ffd29a" />
      <pointLight position={[3.5, 3.0, 3]} intensity={7} distance={10} decay={2} color="#ffd29a" />
      <pointLight position={[0.5, 3.0, -3]} intensity={7} distance={10} decay={2} color="#ffd29a" />
      <pointLight position={[0, 3.0, -10.5]} intensity={7} distance={10} decay={2} color="#ffcf92" />
      <pointLight position={[0, 2.2, -12.2]} intensity={3} distance={6} decay={2} color="#ffe2bd" />
    </>
  );
}

function House({ progress, active, onSelect }: { progress: MutableRefObject<number>; active: boolean; onSelect: (id: HotspotId) => void }) {
  const mats = useSurfaces();
  return (
    <>
      <Architecture mats={mats} progress={progress} />
      <Furniture mats={mats} active={active} onSelect={onSelect} />
      <BedroomBed active={active} onSelect={onSelect} />
    </>
  );
}

/** Tells the page the first frames of the finished house are on screen. */
function Ready({ onReady }: { onReady: () => void }) {
  let frames = 0;
  useFrame(() => {
    if (++frames === 4) onReady();
  });
  return null;
}

export default function HouseScene({ progress, active, onSelect, onReady, lite = false }: { progress: MutableRefObject<number>; active: boolean; onSelect: (id: HotspotId) => void; onReady: () => void; lite?: boolean }) {
  return (
    <Canvas
      shadows="soft"
      dpr={lite ? [1, 1.25] : [1, 1.6]}
      camera={{ fov: 50, near: 0.05, far: 400, position: PATH[0].pos }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping, powerPreference: "high-performance" }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <Sky />
        <Environment files="/house/env/belfast_sunset_puresky_1k.hdr" environmentIntensity={0.55} />
        <Lights />
        <House progress={progress} active={active} onSelect={onSelect} />
        <CameraRig progress={progress} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO halfRes aoRadius={0.9} distanceFalloff={0.8} intensity={lite ? 1.6 : 2.4} quality={lite ? "performance" : "medium"} />
          <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.55} />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.28} darkness={0.55} />
          <SMAA />
        </EffectComposer>
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
