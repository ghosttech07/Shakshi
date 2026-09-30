/**
 * The villa's plan, in metres. x runs left→right as you face the front, z runs from the back
 * wall (−15) to the front glass (+6); the interior floor is y = 0. Rooms follow one another in a
 * straight line from the front, so scrolling simply walks forward: living → dining → bedroom.
 */
export const HOUSE = {
  x0: -7,
  x1: 7,
  z0: -15, // back wall (bedroom)
  z1: 6, // front glass (living room)
  height: 3.4, // ceiling
  wall: 0.25,
  roofTop: 3.75,
};

export const ROOMS = {
  living: { z0: 0, z1: 6 },
  dining: { z0: -6, z1: 0 },
  bedroom: { z0: -15, z1: -6 },
};

/** The front doors: two glass panels that slide apart as you approach. */
export const DOOR = { width: 2.4, z: HOUSE.z1 };

/** Doorway from the dining room into the bedroom. */
export const BEDROOM_DOOR = { width: 1.8, height: 2.75, z: ROOMS.bedroom.z1 };

export const BED = { x: 0, z: -13.45 };

/**
 * Camera path, as scroll progress → where the camera is and what it looks at.
 * The last stop is the bedroom, where the bed and everything clickable is in view.
 */
export const PATH: { at: number; pos: [number, number, number]; look: [number, number, number] }[] = [
  { at: 0.0, pos: [15, 2.4, 25], look: [-1.5, 2.9, 2] },
  { at: 0.16, pos: [5, 1.9, 17], look: [0, 1.9, 2] },
  { at: 0.3, pos: [0.2, 1.7, 10.5], look: [0, 1.55, 0] },
  { at: 0.42, pos: [0.15, 1.66, 5.4], look: [-1.2, 1.4, 0] },
  { at: 0.55, pos: [0.4, 1.66, 2.2], look: [-3.6, 1.1, 2.4] },
  { at: 0.68, pos: [0.6, 1.66, -1.4], look: [-2.6, 1.0, -3.6] },
  { at: 0.82, pos: [0.1, 1.66, -5.2], look: [0, 1.2, -12] },
  { at: 1.0, pos: [0, 1.72, -8.35], look: [0, 0.78, -13.1] },
];
