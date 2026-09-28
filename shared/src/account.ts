import type { Customer, OrderItem } from "./orders";

/** A customer's account as stored on the server (customers table, id = email). */
export type AccountProfile = {
  email: string;
  name: string;
  phone: string;
  wishlist: string[];
  referralCode: string | null;
  reviewsWritten: number;
  warranties: Record<string, { id: string; serial: string; registeredAt: string }>;
  createdAt: string;
  lastSignInAt: string;
};

/** An order as the account page shows it (same shape the shop keeps in the browser). */
export type AccountOrder = {
  id: string;
  token: string;
  createdAt: string;
  deliveryDate: string;
  total: number;
  items: OrderItem[];
  customer?: Customer;
  discount?: number;
  removal?: number;
  delivery?: number;
  giftCodes?: { code: string; amount: number; to: string }[];
};

export type AccountSnapshot = { profile: AccountProfile; orders: AccountOrder[] };

export const emptyProfile = (email: string, now = new Date().toISOString()): AccountProfile => ({
  email,
  name: "",
  phone: "",
  wishlist: [],
  referralCode: null,
  reviewsWritten: 0,
  warranties: {},
  createdAt: now,
  lastSignInAt: now,
});
