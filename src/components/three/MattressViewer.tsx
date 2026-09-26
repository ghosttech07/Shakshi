"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Layer } from "@/lib/products";
import { MattressModel } from "./MattressModel";

/** The 360° viewer on product pages: drag to turn, pinch or scroll to approach, layers can part. */
export default function MattressViewer({ layers, explode, autoRotate }: { layers: Layer[]; explode: number; autoRotate: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [2.6, 1.9, 2.9], fov: 34 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      aria-label="Interactive 3D mattress. Drag to rotate."
      role="img"
    >
      <hemisphereLight args={["#fff6ea", "#cbbba4", 1]} />
      <directionalLight position={[3, 5, 2]} intensity={2.2} color="#ffe6c4" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#d7deff" />
      <group position={[0, -0.25, 0]}>
        <MattressModel layers={layers} explode={explode} />
        <ContactShadows position={[0, -0.001, 0]} opacity={0.35} scale={5} blur={2.6} far={2} color="#4a3a28" />
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.4}
        maxDistance={6}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.06}
        target={[0, 0.25, 0]}
      />
    </Canvas>
  );
}
