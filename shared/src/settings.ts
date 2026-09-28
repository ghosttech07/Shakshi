import { CONTACT } from "./products";
import type { StoreSettings } from "./records";

/** Defaults until the team edits them in the studio (stored in the `settings` table as id "store"). */
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Shakshi",
  phone: CONTACT.phone,
  email: CONTACT.email,
  whatsapp: CONTACT.whatsapp,
  address: "Shakshi Atelier, Whitefield Road, Bengaluru 560066",
  announcement: { enabled: true, text: "Complimentary white-glove delivery on every mattress", link: "/shop" },
  metroPrefixes: ["11", "12", "20", "40", "41", "56", "50", "60", "70", "38", "30", "16"],
  remotePrefixes: ["79", "18", "19", "74", "73"],
  unserviceable: [],
};

export const PREFIX_REGION: Record<string, string> = {
  "11": "Delhi NCR",
  "12": "Delhi NCR",
  "20": "Delhi NCR",
  "40": "Mumbai",
  "41": "Pune",
  "56": "Bengaluru",
  "50": "Hyderabad",
  "60": "Chennai",
  "70": "Kolkata",
  "38": "Ahmedabad",
  "30": "Jaipur",
  "16": "Chandigarh",
};

export const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
