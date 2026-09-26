import { DEFAULT_SETTINGS, PREFIX_REGION } from "./settings";
import type { StoreSettings } from "./records";

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number) => inr.format(n);

/** No-cost EMI over 12 months, rounded up to the rupee */
export const emiFrom = (total: number, months = 12) => Math.ceil(total / months);

/** The house easing (power3.inOut): slow to leave, slow to arrive. Nothing linear, nothing bouncy. */
export const EASE = [0.65, 0, 0.35, 1] as const;
export const DRIFT = [0.65, 0, 0.35, 1] as const;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });
export const formatDate = (d: Date) => dateFmt.format(d);

/** Adds business days, skipping Sundays (our delivery teams rest) */
export const addDeliveryDays = (from: Date, days: number) => {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d;
};

export type DeliveryEstimate =
  | { ok: false; message: string }
  | { ok: true; region: string; earliest: Date; latest: Date; whiteGlove: boolean };

type DeliveryRules = Pick<StoreSettings, "metroPrefixes" | "remotePrefixes" | "unserviceable">;

/** Delivery window for a pincode, using the delivery areas set in the studio. */
export const estimateDelivery = (pincode: string, rules: DeliveryRules = DEFAULT_SETTINGS, now = new Date()): DeliveryEstimate => {
  const pin = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(pin)) return { ok: false, message: "Please enter a valid six-digit pincode." };
  if (rules.unserviceable.some((p) => pin.startsWith(p))) return { ok: false, message: "We don't deliver to this pincode just yet. Our concierge can help arrange it." };
  const two = pin.slice(0, 2);
  if (rules.metroPrefixes.includes(two)) {
    return { ok: true, region: PREFIX_REGION[two] ?? "Metro", earliest: addDeliveryDays(now, 3), latest: addDeliveryDays(now, 5), whiteGlove: true };
  }
  const remote = rules.remotePrefixes.includes(two);
  return {
    ok: true,
    region: remote ? "Extended network" : "Across India",
    earliest: addDeliveryDays(now, remote ? 9 : 6),
    latest: addDeliveryDays(now, remote ? 14 : 9),
    whiteGlove: !remote,
  };
};
