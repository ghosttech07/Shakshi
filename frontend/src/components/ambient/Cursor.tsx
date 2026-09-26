"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A soft circular cursor for mouse users. It trails gently, swells over imagery (where it
 * reads "View"), tightens over buttons and links, and sinks a little when you press.
 * Off for touch, and for anyone who prefers reduced motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const ok = matchMedia("(pointer: fine) and (hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(ok);
    if (!ok) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const pos = { x: -100, y: -100 };
    const eased = { x: -100, y: -100 };
    let scale = 1;
    let target = 1;
    let pressed = false;
    let raf = 0;

    const mode = (el: Element | null) => {
      if (!el || !(el instanceof Element)) return "none";
      if (el.closest("input, textarea, select, canvas, iframe")) return "hidden";
      if (el.closest("[data-cursor='view'], a img, a picture, button img")) return "view";
      if (el.closest("a, button, [role='button'], label, summary, [role='tab'], [role='radio']")) return "link";
      return "none";
    };

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const m = mode(e.target as Element);
      const r = ring.current!;
      r.dataset.mode = m;
      dot.current!.dataset.mode = m;
      target = m === "view" ? 2.3 : m === "link" ? 1.45 : 1;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);
    const onLeave = () => {
      pos.x = pos.y = -100;
    };

    const tick = () => {
      eased.x += (pos.x - eased.x) * 0.16;
      eased.y += (pos.y - eased.y) * 0.16;
      scale += ((pressed ? target * 0.78 : target) - scale) * 0.14;
      ring.current!.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      dot.current!.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      const settled = Math.abs(pos.x - eased.x) < 0.1 && Math.abs(pos.y - eased.y) < 0.1 && Math.abs(scale - (pressed ? target * 0.78 : target)) < 0.002;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown);
    addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-cursor");
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden>
        <span>View</span>
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  );
}
