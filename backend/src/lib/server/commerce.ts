import { randomBytes } from "crypto";
import { ADDONS, SIZES, priceFor, type Accessory, type Product } from "@shakshi/shared/products";
import { GIFT_RE, REFERRAL_RE, REFERRAL_REWARD, type OrderItem } from "@shakshi/shared/orders";
import { get } from "./db";
import type { DiscountData } from "@shakshi/shared/records";

export const GIFT_MIN = 2000;
export const GIFT_MAX = 500000;

const code = (n: number) =>
  Array.from(randomBytes(n))
    .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32])
    .join("");

export const newGiftCode = () => `GIFT-${code(4)}-${code(4)}`;
export const newToken = () => randomBytes(18).toString("base64url");
export const newOrderNumber = () => `SHK-${code(6)}`;

/**
 * The server's own price for a line, from the catalogue, never from the browser.
 * Returns null for anything it doesn't recognise, which rejects the order.
 */
export function serverPrice(item: OrderItem, catalog: Product[], accessories: Accessory[]): number | null {
  switch (item.kind) {
    case "mattress": {
      const p = catalog.find((x) => x.slug === item.ref);
      if (!p || !item.size || !SIZES.some((s) => s.id === item.size)) return null;
      return priceFor(p, item.size);
    }
    case "accessory":
      return accessories.find((a) => a.id === item.ref)?.price ?? null;
    case "addon":
      return ADDONS.find((a) => a.id === item.ref)?.price ?? null;
    case "giftcard":
      return Number.isInteger(item.price) && item.price >= GIFT_MIN && item.price <= GIFT_MAX ? item.price : null;
    default:
      return null;
  }
}

export type Promo = { ok: true; kind: "referral" | "giftcard" | "discount"; code: string; amount: number; label: string } | { ok: false; message: string };

/** Checks a referral or gift-card code against what is actually on record. */
export async function checkPromo(raw: string, subtotal: number, hasMattress: boolean): Promise<Promo> {
  const c = raw.trim().toUpperCase();
  if (REFERRAL_RE.test(c)) {
    const ref = await get<{ name: string }>("referrals", c);
    if (!ref) return { ok: false, message: "We couldn't find that referral code." };
    if (!hasMattress) return { ok: false, message: "Referral gifts apply to orders that include a mattress." };
    return { ok: true, kind: "referral", code: c, amount: Math.min(REFERRAL_REWARD, subtotal), label: `A gift from ${ref.data.name.split(" ")[0]}` };
  }
  if (GIFT_RE.test(c)) {
    const g = await get<{ balance: number }>("gift_cards", c);
    if (!g || g.data.balance <= 0) return { ok: false, message: "That gift card has no balance remaining." };
    return { ok: true, kind: "giftcard", code: c, amount: Math.min(g.data.balance, subtotal), label: "Gift card" };
  }
  // Discount codes created in the studio.
  if (/^[A-Z0-9-]{3,30}$/.test(c)) {
    const d = await get<DiscountData>("discount_codes", c);
    if (d) {
      const x = d.data;
      if (!x.active) return { ok: false, message: "That code is no longer active." };
      if (x.expiresAt && new Date(x.expiresAt) < new Date()) return { ok: false, message: "That code has expired." };
      if (x.usageLimit && x.uses >= x.usageLimit) return { ok: false, message: "That code has been fully redeemed." };
      if (x.minSubtotal && subtotal < x.minSubtotal) return { ok: false, message: `That code applies to orders over ₹${x.minSubtotal.toLocaleString("en-IN")}.` };
      const amount = Math.min(subtotal, x.type === "percent" ? Math.round((subtotal * Math.min(x.value, 100)) / 100) : x.value);
      return { ok: true, kind: "discount", code: c, amount, label: x.type === "percent" ? `${x.value}% off (${c})` : c };
    }
  }
  return { ok: false, message: "That code isn't one we recognise." };
}
