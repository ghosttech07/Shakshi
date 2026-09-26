"use client";

import { prefersCalm } from "@/lib/motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";

/**
 * The first moment of a visit: the crescent breathes once, slowly, like someone asleep,
 * then the page dissolves into view. Shown once per session, and briefly.
 */
export function Preloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("seen")) return setDone(true);
    const reduce = prefersCalm();
    const minimum = new Promise((r) => setTimeout(r, reduce ? 250 : Math.max(0, 1300 - performance.now())));
    const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1800))]);
    let alive = true;
    Promise.all([minimum, fonts]).then(() => {
      if (!alive) return;
      setDone(true);
      try {
        sessionStorage.setItem("shk-seen", "1");
      } catch {}
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="preloader" data-done={done} aria-hidden="true">
      <div className="preloader-mark">
        <Logo variant="lockup" className="h-24 sm:h-32" />
      </div>
    </div>
  );
}
