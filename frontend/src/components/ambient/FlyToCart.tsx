"use client";

import { prefersCalm } from "@/lib/motion";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

const pulse = (el: Element | null) =>
  el?.animate([{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(0.9)" }, { transform: "scale(1)" }], {
    duration: 800,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });

/**
 * When something is added to the bag, a small square of linen rises from where you tapped,
 * folds itself in half mid-air, and settles into the bag icon. Then the drawer opens.
 */
export function FlyToCart() {
  const setCartOpen = useStore((s) => s.setCartOpen);

  useEffect(() => {
    let last = { x: 0, y: 0, t: 0 };
    const onDown = (e: PointerEvent) => (last = { x: e.clientX, y: e.clientY, t: Date.now() });

    const onAdd = (e: Event) => {
      const open = (e as CustomEvent<{ open?: boolean }>).detail?.open;
      const icon = document.querySelector("[data-cart-icon]");
      const rect = icon?.getBoundingClientRect();
      const reduce = prefersCalm();
      if (reduce || !rect || !rect.width || Date.now() - last.t > 4000) {
        pulse(icon ?? null);
        if (open) setCartOpen(true);
        return;
      }
      // The header may be tucked away mid-scroll; it slides back as the fabric travels.
      const tx = rect.left + rect.width / 2;
      const ty = Math.max(rect.top + rect.height / 2, 36);
      const dx = tx - last.x;
      const dy = ty - last.y;

      const el = document.createElement("div");
      el.className = "fly-fabric";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = '<span class="ff-bottom"></span><span class="ff-top"></span>';
      el.style.left = `${last.x}px`;
      el.style.top = `${last.y}px`;
      document.body.appendChild(el);

      const easing = "cubic-bezier(0.45, 0, 0.2, 1)";
      const flight = el.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.6) rotate(0deg)", opacity: 0 },
          { transform: `translate(calc(-50% + ${dx * 0.18}px), calc(-50% + ${dy * 0.18 - 90}px)) scale(1) rotate(-7deg)`, opacity: 1, offset: 0.28 },
          { transform: `translate(calc(-50% + ${dx * 0.72}px), calc(-50% + ${dy * 0.72 - 50}px)) scale(0.62) rotate(9deg)`, opacity: 1, offset: 0.72 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.14) rotate(0deg)`, opacity: 0.3 },
        ],
        { duration: 1000, easing }
      );
      el.querySelector(".ff-top")?.animate([{ transform: "rotateX(0deg)" }, { transform: "rotateX(0deg)", offset: 0.3 }, { transform: "rotateX(-176deg)" }], {
        duration: 1000,
        easing: "cubic-bezier(0.6, 0, 0.25, 1)",
        fill: "forwards",
      });
      flight.onfinish = () => {
        el.remove();
        pulse(icon ?? null);
        if (open) setTimeout(() => setCartOpen(true), 220);
      };
    };

    addEventListener("pointerdown", onDown, true);
    addEventListener("shakshi:add", onAdd);
    return () => {
      removeEventListener("pointerdown", onDown, true);
      removeEventListener("shakshi:add", onAdd);
    };
  }, [setCartOpen]);

  return null;
}
