"use client";

import { prefersCalm } from "@/lib/motion";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

let lenis: Lenis | null = null;
let locks = 0;

export function lockScroll() {
  locks++;
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    lenis?.start();
    document.documentElement.style.overflow = "";
  }
}

export function scrollToTarget(target: string | number | HTMLElement) {
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else if (typeof target === "string") document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  else target.scrollIntoView({ behavior: "smooth" });
}

/** Buttery, weighted page scroll, kept in lockstep with GSAP's ScrollTrigger. Off for reduced motion. */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (prefersCalm()) return;

    // Inertia-based: each frame closes 8% of the gap, so the page glides to a stop.
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Content that appears after load (recommendations, live reviews, images) moves everything
    // below it, so pinned sections re-measure; otherwise they pin too early and leave a blank gap.
    let height = document.body.scrollHeight;
    let timer = 0;
    const resized = new ResizeObserver(() => {
      const next = document.body.scrollHeight;
      if (Math.abs(next - height) < 2) return;
      height = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        ScrollTrigger.refresh();
        height = document.body.scrollHeight;
      }, 120);
    });
    resized.observe(document.body);
    return () => {
      resized.disconnect();
      window.clearTimeout(timer);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // Each new page begins at the top, calmly.
  useEffect(() => {
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname]);

  return null;
}
