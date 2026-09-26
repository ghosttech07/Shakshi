/** Shapes of the records the site stores, shared by API routes and the admin panel. */

export const EVENT_NAMES = [
  "page_view",
  "quiz_start",
  "quiz_complete",
  "configurator_use",
  "add_to_cart",
  "checkout_step",
  "purchase",
  "consultation_booked",
  "booking_requested",
  "concierge_message",
  "ambient_sound",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];
export type EventData = { name: EventName; props: Record<string, string | number | boolean>; path: string; sessionId: string; at: string };

export type BookingKind = "salon" | "home" | "video";
export type BookingData = {
  kind: BookingKind;
  start: string;
  minutes: number;
  name: string;
  phone: string;
  email?: string;
  salon?: string;
  address?: string;
  topic?: string;
  meetingUrl?: string;
};

export type LeadData = { kind: "hospitality" | "contact" | "newsletter" | "swatches"; fields: Record<string, string> };

export type CartSnapshot = {
  items: { name: string; detail?: string; qty: number; price: number; image?: string }[];
  total: number;
  step: number;
  name?: string;
  phone?: string;
  updatedAt: string;
};

export type ReviewData = {
  product: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  position: "side" | "back" | "stomach" | "combination";
  body_type: "petite" | "average" | "broad";
  helpful: number;
  reply?: string;
  replyAt?: string;
};

export type DiscountData = { type: "percent" | "flat"; value: number; expiresAt?: string; usageLimit?: number; uses: number; minSubtotal?: number; active: boolean; note?: string };

export type StoreSettings = {
  storeName: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  announcement: { enabled: boolean; text: string; link?: string };
  /** First 2 digits of pincodes with 3–5 day white-glove delivery */
  metroPrefixes: string[];
  /** First 2 digits of pincodes on the extended (slower) network */
  remotePrefixes: string[];
  /** First 3 digits of pincodes we can't deliver to yet */
  unserviceable: string[];
};
