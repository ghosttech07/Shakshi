"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { useSite } from "@/lib/site-context";

/** The studio's animation intensity: "reduced" and "off" keep only fades; the visitor's own setting is always honoured. */
export function MotionPrefs({ children }: { children: ReactNode }) {
  const motion = useSite().theme.motion;
  return <MotionConfig reducedMotion={motion === "full" ? "user" : "always"}>{children}</MotionConfig>;
}
