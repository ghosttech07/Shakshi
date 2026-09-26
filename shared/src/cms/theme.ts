import type { SiteConfig } from "./types";
import { DEFAULT_SITE } from "./defaults";

/** Curated type pairings the studio offers. Each is loaded by the storefront (only the chosen ones download). */
export const HEADING_FONTS = ["Cormorant Garamond", "Playfair Display", "Bodoni Moda", "Fraunces"] as const;
export const BODY_FONTS = ["Manrope", "Inter", "DM Sans", "Jost"] as const;

/**
 * CSS that re-points the design tokens at the studio's chosen colours. Day values apply outside
 * night mode (night mode keeps its own dark palette); gold applies in both. Empty when nothing changed.
 */
export function themeCss(theme: SiteConfig["theme"]): string {
  const d = DEFAULT_SITE.theme.colors;
  const c = theme.colors;
  const hex = (v: string) => (/^#[0-9a-f]{3,8}$/i.test(v) ? v : null);
  const day: string[] = [];
  const both: string[] = [];
  const mix = (a: string, b: string, pct: number) => `color-mix(in oklab, ${a} ${pct}%, ${b})`;
  if (hex(c.midnight) && c.midnight.toLowerCase() !== d.midnight) {
    day.push(`--color-midnight:${c.midnight}`, `--color-midnight-2:${mix(c.midnight, "#ffffff", 96)}`, `--color-midnight-3:${mix(c.midnight, "#ffffff", 91)}`);
  }
  if (hex(c.ivory) && c.ivory.toLowerCase() !== d.ivory) {
    day.push(`--color-ivory:${c.ivory}`, `--color-ivory-2:${mix(c.ivory, "#8a7a60", 94)}`, `--color-ivory-3:${mix(c.ivory, "#8a7a60", 87)}`);
  }
  if (hex(c.ink) && c.ink.toLowerCase() !== d.ink) day.push(`--color-ink:${c.ink}`);
  if (hex(c.blush) && c.blush.toLowerCase() !== d.blush) day.push(`--color-blush:${c.blush}`);
  if (hex(c.gold) && c.gold.toLowerCase() !== d.gold) {
    both.push(`--color-gold:${c.gold}`, `--color-gold-soft:${mix(c.gold, "#ffffff", 70)}`);
    day.push(`--color-gold-ink:${mix(c.gold, "#000000", 58)}`);
  }
  return [day.length ? `:root:not([data-theme="night"]){${day.join(";")}}` : "", both.length ? `:root{${both.join(";")}}` : ""].join("");
}
