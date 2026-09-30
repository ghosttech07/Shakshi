/**
 * The villa's plan, in metres. x runs left→right as you face the front, z runs from the back
 * wall (−22) to the front glass (+6); the interior floor is y = 0.
 *
 *   front glass (z = 6)
 *   ┌──────────── living (z 0→6) ─────────────┐
 *   │──────────── dining (z −6→0) ────────────│
 *   │ bedroom 1 │  corridor  │ bedroom 2       │   z −14 → −6
 *   │ bedroom 3 │ (x ±1.3)   │ bedroom 4       │   z −22 → −14
 *   └─────────────────────────────────────────┘ back wall (z = −22)
 */
export const HOUSE = {
  x0: -9,
  x1: 9,
  z0: -22,
  z1: 6,
  height: 3.4,
  wall: 0.25,
  roofTop: 3.75,
};

export const ROOMS = {
  living: { z0: 0, z1: 6 },
  dining: { z0: -6, z1: 0 },
};

/** The corridor to the bedrooms. */
export const HALL = { x: 1.3, z0: -22, z1: -6 };

/** The front doors: two glass panels that slide apart as you approach. */
export const DOOR = { width: 2.4, z: HOUSE.z1 };

/** Each bedroom's doorway onto the corridor (a wide opening, no door). */
export const BEDROOM_OPENING = { width: 3.2, height: 2.8 };

export type ThemeId = "ivory" | "midnight" | "sage" | "terracotta";
export type Bedroom = { id: ThemeId; side: -1 | 1; z0: number; z1: number };

/** Four bedrooms, each its own theme: left and right of the corridor, front pair then back pair. */
export const BEDROOMS: Bedroom[] = [
  { id: "ivory", side: -1, z0: -14, z1: -6 },
  { id: "midnight", side: 1, z0: -14, z1: -6 },
  { id: "sage", side: -1, z0: -22, z1: -14 },
  { id: "terracotta", side: 1, z0: -22, z1: -14 },
];

/** Where a bedroom sits in the house: its centre, and the turn that faces its bed toward the corridor. */
export function roomFrame(b: Bedroom) {
  const inner = HALL.x;
  const outer = HOUSE.x1;
  return {
    x: (b.side * (inner + outer)) / 2,
    z: (b.z0 + b.z1) / 2,
    depth: outer - inner, // along the bed (headboard wall → corridor)
    width: b.z1 - b.z0,
    rot: b.side === -1 ? Math.PI / 2 : -Math.PI / 2, // local −z (headboard) → the outer wall
  };
}

type Key = { at: number; pos: [number, number, number]; look: [number, number, number]; room?: ThemeId };

const stop = (b: Bedroom, at: number, hold: number): Key[] => {
  const z = (b.z0 + b.z1) / 2;
  const s = b.side;
  const k = { pos: [s * 2.1, 1.66, z] as [number, number, number], look: [s * 7.4, 0.78, z] as [number, number, number], room: b.id };
  return [
    { at, ...k },
    { at: at + hold, ...k },
  ];
};

/**
 * Camera route, as scroll progress → where the camera is and what it looks at.
 * It glides through the living and dining area without pausing, then stops in each bedroom
 * (a "hold": two identical keys), turning between the left and right rooms along the corridor.
 */
export const PATH: Key[] = [
  { at: 0.0, pos: [17, 2.5, 27], look: [-1.5, 2.9, 1] },
  { at: 0.12, pos: [6, 1.9, 17], look: [0, 1.9, 2] },
  { at: 0.21, pos: [0.2, 1.7, 9.6], look: [0, 1.55, 0] },
  { at: 0.29, pos: [0.2, 1.66, 1.5], look: [0, 1.45, -8] },
  { at: 0.36, pos: [0, 1.66, -6.4], look: [0, 1.4, -14] },
  { at: 0.41, pos: [0, 1.66, -9.2], look: [-3, 1.2, -10] },
  ...stop(BEDROOMS[0], 0.46, 0.07),
  { at: 0.58, pos: [0, 1.66, -10.4], look: [3, 1.2, -10] },
  ...stop(BEDROOMS[1], 0.62, 0.07),
  { at: 0.74, pos: [0, 1.66, -15.2], look: [0, 1.3, -20] },
  { at: 0.78, pos: [0, 1.66, -17.4], look: [-3, 1.2, -18] },
  ...stop(BEDROOMS[2], 0.82, 0.06),
  { at: 0.925, pos: [0, 1.66, -18.4], look: [3, 1.2, -18] },
  ...stop(BEDROOMS[3], 0.955, 0.045),
];

/** The bedroom whose stop the visitor is at, if any (with a little tolerance either side). */
export function roomAt(progress: number): ThemeId | null {
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i];
    const b = PATH[i + 1];
    if (a.room && a.room === b.room && progress >= a.at - 0.012 && progress <= b.at + 0.012) return a.room;
  }
  return null;
}

/** Scroll progress at the middle of a bedroom's stop (for jumping straight to a room). */
export function roomProgress(id: ThemeId) {
  const i = PATH.findIndex((k) => k.room === id);
  return i < 0 ? 1 : (PATH[i].at + PATH[i + 1].at) / 2;
}
