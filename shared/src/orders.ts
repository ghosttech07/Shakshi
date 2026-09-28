import type { SizeId } from "./products";

export type OrderItem = {
  key: string;
  kind: "mattress" | "accessory" | "addon" | "bundle" | "giftcard";
  ref: string;
  name: string;
  detail?: string;
  image: string;
  size?: SizeId;
  price: number;
  qty: number;
  gift?: { to: string; email?: string; from: string; message?: string; design: string };
};

export type Customer = { first: string; last: string; email: string; phone: string; address: string; city: string; pincode: string };

export type OrderData = {
  number: string;
  token: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountLabel?: string;
  promoCode?: string;
  removal: number;
  /** Delivery charge in rupees (0 = free white-glove delivery). */
  delivery?: number;
  /** Stages the customer has already been emailed about. */
  emailed?: string[];
  total: number;
  customer: Customer;
  deliveryDate: string; // ISO date
  payment: string;
  months?: number;
  note?: string;
  statusMode: "auto" | "manual";
  giftCodes?: { code: string; amount: number; to: string }[];
  sample?: boolean;
  madeToOrder?: boolean;
};

export const STAGES = [
  { id: "placed", label: "Confirmed", admin: "Confirmed", note: "We've received your order and reserved your place in the atelier." },
  { id: "crafting", label: "Handcrafting", admin: "Manufacturing", note: "Your mattress is being tufted and finished by hand." },
  { id: "dispatched", label: "Dispatched", admin: "Dispatched", note: "Wrapped in cotton and on its way to your city." },
  { id: "out_for_delivery", label: "Out for delivery", admin: "Out for Delivery", note: "Your white-glove team is en route today." },
  { id: "delivered", label: "Delivered", admin: "Delivered", note: "Set up, dressed and waiting for your first night." },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

const at = (d: Date, h: number) => {
  const x = new Date(d);
  x.setHours(h, 0, 0, 0);
  return x;
};

/** When each stage happens (or is expected to), from order time and delivery date. */
export function stageTimes(createdAt: string, deliveryDate: string): Record<StageId, Date> {
  const placed = new Date(createdAt);
  const delivery = new Date(deliveryDate);
  const dispatched = at(new Date(delivery.getTime() - 2 * 86400000), 10);
  return {
    placed,
    crafting: new Date(Math.min(placed.getTime() + 2 * 3600000, dispatched.getTime() - 3600000)),
    dispatched,
    out_for_delivery: at(delivery, 8),
    delivered: at(delivery, 17),
  };
}

/** Automatic progress follows the calendar; an atelier override (manual status) always wins. */
export function currentStage(o: { created_at: string; status: string | null; data: Pick<OrderData, "deliveryDate" | "statusMode"> }, now = new Date()): StageId {
  if (o.data.statusMode === "manual" && o.status && STAGES.some((s) => s.id === o.status)) return o.status as StageId;
  const t = stageTimes(o.created_at, o.data.deliveryDate);
  let stage: StageId = "placed";
  for (const s of STAGES) if (now >= t[s.id]) stage = s.id;
  return stage;
}

export const REFERRAL_REWARD = 5000;
export const GIFT_RE = /^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export const REFERRAL_RE = /^SHK-[A-Z0-9]{4,10}$/;

export const TIERS = [
  { id: "dreamer", name: "Dreamer", min: 0, perks: ["Early access to limited editions", "Birthday sleep ritual kit"] },
  { id: "reverie", name: "Reverie", min: 2500, perks: ["Complimentary annual mattress refresh", "Priority white-glove slots", "Everything in Dreamer"] },
  { id: "circle", name: "Shakshi Circle", min: 7500, perks: ["Private salon evenings", "Personal sleep specialist", "Everything in Reverie"] },
] as const;

export const POINTS = { perHundredRupees: 1, review: 250, referral: 1000 };

export const tierFor = (points: number) => [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
