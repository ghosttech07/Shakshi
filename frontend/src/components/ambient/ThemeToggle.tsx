"use client";

import { useEffect } from "react";
import { useAccount, type ThemePref } from "@/lib/account";
import { useHydrated } from "@/lib/useHydrated";
import { applyTheme, useNight } from "@/lib/theme";

const NEXT: Record<ThemePref, ThemePref> = { auto: "night", night: "day", day: "auto" };
const LABEL: Record<ThemePref, string> = { auto: "Theme follows the time of day", night: "Night mode", day: "Day mode" };

/** Cycles Auto → Night → Day. Auto turns moonlit at 7pm and back at 6am. */
export function ThemeToggle() {
  const hydrated = useHydrated();
  const pref = useAccount((s) => s.theme);
  const setTheme = useAccount((s) => s.setTheme);
  const night = useNight();

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(pref);
    if (pref !== "auto") return;
    const t = setInterval(() => applyTheme("auto"), 60_000);
    return () => clearInterval(t);
  }, [pref, hydrated]);

  return (
    <button
      onClick={() => setTheme(NEXT[pref])}
      aria-label={`${LABEL[pref]}. Switch to ${LABEL[NEXT[pref]].toLowerCase()}`}
      title={LABEL[pref]}
      className="relative grid h-11 w-11 place-items-center"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden>
        {night ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
          </>
        )}
      </svg>
      {pref === "auto" && hydrated && <span className="absolute bottom-2 right-2 text-[0.5rem] font-semibold">A</span>}
    </button>
  );
}
