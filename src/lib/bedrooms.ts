import { IMG } from "./images";

export type Hotspot = { ref: string; kind: "mattress" | "accessory"; x: number; y: number };
export type Bedroom = { id: string; image: string; alt: string; name: string; city: string; caption: string; tall?: boolean; spots: Hotspot[] };

// Customer bedrooms (placeholder photography). Hotspot x/y are percentages across the photo.
export const BEDROOMS: Bedroom[] = [
  { id: "b1", image: IMG.tufted, alt: "A tufted headboard above crisp white bedding", name: "Ritika S.", city: "Mumbai", caption: "Our Sunday room. We don't leave it before eleven.", tall: true, spots: [{ ref: "cirrus", kind: "mattress", x: 50, y: 72 }, { ref: "pillows", kind: "accessory", x: 42, y: 50 }] },
  { id: "b2", image: IMG.platform, alt: "A low wooden platform bed with linen and cushions", name: "Aarav & Tara", city: "Goa", caption: "Salt air, linen, and the Atelier. Nothing synthetic in here.", spots: [{ ref: "atelier", kind: "mattress", x: 48, y: 58 }, { ref: "sheets", kind: "accessory", x: 60, y: 76 }] },
  { id: "b3", image: IMG.elegant, alt: "An elegant grey bedroom with a velvet headboard", name: "Kabir M.", city: "New Delhi", caption: "Moved in with the Signature before the sofa arrived. Priorities.", tall: true, spots: [{ ref: "signature", kind: "mattress", x: 50, y: 64 }, { ref: "protector", kind: "accessory", x: 34, y: 70 }] },
  { id: "b4", image: IMG.brightRoom, alt: "A bright white bedroom with morning light", name: "Leela M.", city: "Chennai", caption: "It's 34° outside. The Lumen doesn't know.", spots: [{ ref: "lumen", kind: "mattress", x: 50, y: 70 }] },
  { id: "b5", image: IMG.grandSuite, alt: "A grand suite with a tufted sofa at the foot of the bed", name: "The Oberois", city: "Chandigarh", caption: "Twenty years of marriage deserved the Sovereign.", spots: [{ ref: "sovereign", kind: "mattress", x: 70, y: 55 }, { ref: "pillows", kind: "accessory", x: 80, y: 44 }] },
  { id: "b6", image: IMG.classic, alt: "A classic bedroom with twin lamps and a bench", name: "Meera S.", city: "Hyderabad", caption: "The lamps are my grandmother's; the mattress is all mine.", tall: true, spots: [{ ref: "signature", kind: "mattress", x: 45, y: 62 }, { ref: "sheets", kind: "accessory", x: 58, y: 70 }] },
  { id: "b7", image: IMG.minimal, alt: "A minimal dark bedroom with a mustard cushion", name: "Dev P.", city: "Bengaluru", caption: "Minimal room, maximal sleep.", spots: [{ ref: "cirrus", kind: "mattress", x: 50, y: 75 }, { ref: "pillows", kind: "accessory", x: 50, y: 50 }] },
  { id: "b8", image: IMG.resort, alt: "A warm resort-style room opening onto a garden", name: "Sana K.", city: "Kochi", caption: "Holiday every night, apparently.", spots: [{ ref: "atelier", kind: "mattress", x: 70, y: 70 }] },
  { id: "b9", image: IMG.darkWood, alt: "A bedroom with dark wood panelling and soft light", name: "Vikram N.", city: "Pune", caption: "Back pain gone in three weeks. My physio asked where I bought it.", tall: true, spots: [{ ref: "sovereign", kind: "mattress", x: 52, y: 66 }] },
  { id: "b10", image: IMG.whiteLux, alt: "A luxurious white bedroom with a padded wall", name: "Ananya M.", city: "Mumbai", caption: "Monsoon nights, finally quiet.", spots: [{ ref: "cirrus", kind: "mattress", x: 55, y: 68 }, { ref: "protector", kind: "accessory", x: 40, y: 74 }] },
];
