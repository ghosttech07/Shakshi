"use client";

import { useEffect, useState, type RefObject } from "react";

export type Policy3D = "full" | "interaction" | "never";

type NetNavigator = Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };

/**
 * How eagerly to load WebGL here:
 * - never: Data Saver, 2G/3G, or a modest device → the static render stays.
 * - interaction: touch devices → wait for the first touch or scroll (keeps first paint fast).
 * - full: desktop → load once the browser is idle.
 */
export function get3DPolicy(): Policy3D {
  const n = navigator as NetNavigator;
  const c = n.connection;
  if (c?.saveData || /(^|-)(2g|3g)$/.test(c?.effectiveType ?? "")) return "never";
  if ((n.deviceMemory ?? 8) < 4 || (n.hardwareConcurrency ?? 8) < 4) return "never";
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "never";
  } catch {
    return "never";
  }
  return matchMedia("(pointer: coarse)").matches ? "interaction" : "full";
}

/** True once it's time to mount a 3D scene inside `ref`: in view, and allowed by the policy. */
export function useLoad3D(ref: RefObject<HTMLElement | null>, opts: { respectPolicy?: boolean } = {}) {
  const [policy, setPolicy] = useState<Policy3D | null>(null);
  const [go, setGo] = useState(false);

  useEffect(() => setPolicy(opts.respectPolicy === false ? "full" : get3DPolicy()), [opts.respectPolicy]);

  useEffect(() => {
    if (!policy || policy === "never" || !ref.current) return;
    let inView = false;
    let allowed = false;
    const tryStart = () => inView && allowed && setGo(true);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      tryStart();
    }, { rootMargin: "200px" });
    io.observe(ref.current);

    const cleanups: (() => void)[] = [() => io.disconnect()];
    if (policy === "full") {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 400));
      const id = idle(() => {
        allowed = true;
        tryStart();
      });
      cleanups.push(() => (window.cancelIdleCallback ? window.cancelIdleCallback(id as number) : clearTimeout(id as number)));
    } else {
      const onFirst = () => {
        allowed = true;
        tryStart();
        events.forEach((ev) => removeEventListener(ev, onFirst));
      };
      const events = ["pointerdown", "touchstart", "scroll", "keydown", "wheel"];
      events.forEach((ev) => addEventListener(ev, onFirst, { passive: true, once: true }));
      cleanups.push(() => events.forEach((ev) => removeEventListener(ev, onFirst)));
    }
    return () => cleanups.forEach((c) => c());
  }, [policy, ref]);

  return { go, policy };
}
