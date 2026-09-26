"use client";

import { useEffect, useState } from "react";
import { NIGHT_FROM, NIGHT_UNTIL } from "./boot-script";

export const isNightHour = (d = new Date()) => d.getHours() >= NIGHT_FROM || d.getHours() < NIGHT_UNTIL;

export function applyTheme(pref: "auto" | "day" | "night") {
  const night = pref === "night" || (pref === "auto" && isNightHour());
  document.documentElement.dataset.theme = night ? "night" : "day";
}

/** True while the site is in night mode; follows toggles and the 7pm switch. */
export function useNight() {
  const [night, setNight] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setNight(el.dataset.theme === "night");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return night;
}
