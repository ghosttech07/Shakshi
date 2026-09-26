"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SETTINGS } from "@shakshi/shared/settings";
import type { StoreSettings } from "@shakshi/shared/records";

const Ctx = createContext<StoreSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({ settings, children }: { settings: StoreSettings; children: ReactNode }) {
  return <Ctx.Provider value={settings}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
