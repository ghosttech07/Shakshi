import { get } from "./db";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { StoreSettings } from "@/lib/records";

export async function getSettings(): Promise<StoreSettings> {
  try {
    const row = await get<Partial<StoreSettings>>("settings", "store");
    return { ...DEFAULT_SETTINGS, ...(row?.data ?? {}), announcement: { ...DEFAULT_SETTINGS.announcement, ...(row?.data.announcement ?? {}) } };
  } catch (e) {
    console.error("[settings]", e);
    return DEFAULT_SETTINGS;
  }
}
