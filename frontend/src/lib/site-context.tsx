"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SITE } from "@shakshi/shared/cms/defaults";
import type { SiteConfig } from "@shakshi/shared/cms/types";

const Ctx = createContext<SiteConfig>(DEFAULT_SITE);

/** Global, editable site content (brand, navigation, footer, contact, theme, commerce rules). */
export function SiteProvider({ site, children }: { site: SiteConfig; children: ReactNode }) {
  return <Ctx.Provider value={site}>{children}</Ctx.Provider>;
}

export const useSite = () => useContext(Ctx);

/** Scheduled content (announcements) is live between its optional start and end dates. */
export const isLive = (x: { start?: string; end?: string }, now = new Date()) => (!x.start || new Date(x.start) <= now) && (!x.end || new Date(x.end) >= now);
