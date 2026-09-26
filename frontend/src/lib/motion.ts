"use client";

import { useReducedMotion as useOsReducedMotion } from "framer-motion";
import { useSite } from "./site-context";

/** The studio's animation intensity ("full" | "reduced" | "off"), stamped on <html data-motion>. */
const siteCalm = () => typeof document !== "undefined" && (document.documentElement.dataset.motion ?? "full") !== "full";

/** True when motion should be simple fades: the visitor asked for it, or the studio turned motion down. */
export const prefersCalm = () => siteCalm() || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);

export function useReducedMotion() {
  const os = useOsReducedMotion();
  return !!os || useSite().theme.motion !== "full";
}
