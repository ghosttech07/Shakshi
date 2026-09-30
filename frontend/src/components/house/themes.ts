import type { ThemeId } from "./layout";

/**
 * The four bedrooms. Each has its own palette, wall treatment and bed, and features one mattress.
 * Colours are sRGB hex; "accent" is the feature wall behind the bed.
 */
export type Theme = {
  id: ThemeId;
  name: string;
  line: string; // one-line mood, shown in the room caption
  product: string; // featured mattress slug
  wall: string; // painted walls
  floor: "oak" | "walnut" | "marble" | "lightOak";
  accent: "slats" | "fluted" | "cane" | "arch";
  accentColor: string;
  headboard: string; // upholstery colour
  headboardSheen: string;
  duvet: string;
  throw: string;
  pillow: string;
  rug: string;
  nightstand: string; // painted/wood colour of the bedside tables
  lampBase: string;
  shade: string;
  metal: string; // lamp stems, frames
  light: string; // warm light colour in the room
  extras: ("lounge" | "plants" | "bench" | "art" | "jharokha")[];
};

export const THEMES: Record<ThemeId, Theme> = {
  ivory: {
    id: "ivory",
    name: "Ivory & Oak",
    line: "Pale oak, soft linen, nothing more than you need.",
    product: "cirrus",
    wall: "#e9e3d8",
    floor: "oak",
    accent: "slats",
    accentColor: "#6f5039",
    headboard: "#d9c7aa",
    headboardSheen: "#f3e6d0",
    duvet: "#f8f4ed",
    throw: "#b48d62",
    pillow: "#fbf8f2",
    rug: "#d8cbb6",
    nightstand: "#b58a5c",
    lampBase: "#e7ddcf",
    shade: "#fff3de",
    metal: "#b8925a",
    light: "#ffe9cf",
    extras: ["lounge", "plants"],
  },
  midnight: {
    id: "midnight",
    name: "Midnight & Brass",
    line: "Deep navy, velvet and brass: the hotel suite you never check out of.",
    product: "sovereign",
    wall: "#1f2a3d",
    floor: "walnut",
    accent: "fluted",
    accentColor: "#1a2436",
    headboard: "#23405a",
    headboardSheen: "#5f86a8",
    duvet: "#f4f1ea",
    throw: "#1d3450",
    pillow: "#f6f3ec",
    rug: "#3a3a44",
    nightstand: "#2b1d14",
    lampBase: "#c9a45c",
    shade: "#fff0d6",
    metal: "#c9a45c",
    light: "#ffd9a8",
    extras: ["bench", "art"],
  },
  sage: {
    id: "sage",
    name: "Sage & Cane",
    line: "Sage walls, woven cane and a garden that has wandered indoors.",
    product: "atelier",
    wall: "#a9b59a",
    floor: "lightOak",
    accent: "cane",
    accentColor: "#c9ab78",
    headboard: "#c8b48c",
    headboardSheen: "#efe2c2",
    duvet: "#f6f3ec",
    throw: "#7f8f6a",
    pillow: "#eef0e6",
    rug: "#cfc3a8",
    nightstand: "#d2b489",
    lampBase: "#b86b45",
    shade: "#fbf1dd",
    metal: "#8a6a45",
    light: "#fff0d8",
    extras: ["plants", "lounge"],
  },
  terracotta: {
    id: "terracotta",
    name: "Terracotta Heritage",
    line: "Sun-baked terracotta, carved arches and brass, rooted in Indian craft.",
    product: "signature",
    wall: "#b86443",
    floor: "marble",
    accent: "arch",
    accentColor: "#9a4a2f",
    headboard: "#5a3421",
    headboardSheen: "#a8744f",
    duvet: "#f3ece0",
    throw: "#2d4a7a",
    pillow: "#e9c46a",
    rug: "#7a2f24",
    nightstand: "#4a2c1a",
    lampBase: "#c9a45c",
    shade: "#ffe7c4",
    metal: "#c9a45c",
    light: "#ffcf96",
    extras: ["jharokha", "plants", "bench"],
  },
};
