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

    // Inertia-based: each frame closes 11% of the gap, so the page glides to a stop without
    // trailing behind the wheel. Touch screens keep their own native scrolling, which is smoothest there.
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
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

  // Photos further down load lazily, and decoding one the moment it scrolls into view stalls the
  // scroll for a frame or two. While the browser is idle, fetch and decode the ones a couple of
  // screens ahead, so they're ready before the visitor gets there.
  useEffect(() => {
    let stop = false;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const warm = () => {
      if (stop) return;
      const ahead = scrollY + innerHeight * 3;
      document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]:not([data-warmed])').forEach((img) => {
        if (img.getBoundingClientRect().top + scrollY > ahead) return;
        img.dataset.warmed = "1";
        img.loading = "eager";
        img.decode().catch(() => {});
      });
    };
    const onScroll = () => ric(warm);
    const first = window.setTimeout(() => ric(warm), 1200);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      stop = true;
      window.clearTimeout(first);
      removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
