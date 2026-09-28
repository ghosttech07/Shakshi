"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Customer, OrderItem } from "@shakshi/shared/orders";
import { POINTS } from "@shakshi/shared/orders";

export type LocalOrder = {
  id: string;
  token: string;
  createdAt: string;
  deliveryDate: string;
  total: number;
  items: OrderItem[];
  sample?: boolean;
  giftCodes?: { code: string; amount: number; to: string }[];
  customer?: Customer;
  discount?: number;
  removal?: number;
};

export type ThemePref = "auto" | "day" | "night";
export type SoundId = "rain" | "ocean" | "noise";

type State = {
  /** The signed-in customer (verified by an emailed code; see account-client.ts). */
  profile: { name: string; email: string; phone?: string } | null;
  orders: LocalOrder[];
  reviewsWritten: number;
  referralCode: string | null;
  referredBy: string | null;
  warranties: Record<string, { id: string; serial: string; registeredAt: string }>;
  unrolledAt: string | null;
  cartId: string;
  theme: ThemePref;
  sound: SoundId | null;
  volume: number;

  setName: (name: string) => void;
  addOrder: (o: LocalOrder) => void;
  noteReview: () => void;
  setReferralCode: (c: string) => void;
  setReferredBy: (c: string | null) => void;
  registerWarranty: (orderId: string, w: { id: string; serial: string; registeredAt: string }) => void;
  setUnrolled: (iso: string | null) => void;
  newCart: () => void;
  setTheme: (t: ThemePref) => void;
  setSound: (s: SoundId | null) => void;
  setVolume: (v: number) => void;
};

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * The account as this browser holds it. When signed in, it mirrors the customer's account on the
 * server (loaded on every device); preferences like theme and sound stay per device.
 */
export const useAccount = create<State>()(
  persist(
    (set, get) => ({
      profile: null,
      orders: [],
      reviewsWritten: 0,
      referralCode: null,
      referredBy: null,
      warranties: {},
      unrolledAt: null,
      cartId: newId(),
      theme: "auto",
      sound: null,
      volume: 0.5,

      setName: (name) => {
        const p = get().profile;
        if (p) set({ profile: { ...p, name: name.trim() } });
      },
      addOrder: (o) => set({ orders: [o, ...get().orders.filter((x) => x.id !== o.id)] }),
      noteReview: () => set({ reviewsWritten: get().reviewsWritten + 1 }),
      setReferralCode: (referralCode) => set({ referralCode }),
      setReferredBy: (referredBy) => set({ referredBy }),
      registerWarranty: (orderId, w) => set({ warranties: { ...get().warranties, [orderId]: w } }),
      setUnrolled: (unrolledAt) => set({ unrolledAt }),
      newCart: () => set({ cartId: newId() }),
      setTheme: (theme) => set({ theme }),
      setSound: (sound) => set({ sound }),
      setVolume: (volume) => set({ volume }),
    }),
    { name: "shakshi-account", storage: createJSONStorage(() => localStorage), skipHydration: true }
  )
);

/** Loyalty points from what this member has done (referral credits are added by the caller). */
export function pointsFor(s: Pick<State, "orders" | "reviewsWritten">, referrals = 0) {
  const purchases = s.orders.filter((o) => !o.sample).reduce((sum, o) => sum + Math.floor(o.total / 100) * POINTS.perHundredRupees, 0);
  return {
    purchases,
    reviews: s.reviewsWritten * POINTS.review,
    referrals: referrals * POINTS.referral,
    total: purchases + s.reviewsWritten * POINTS.review + referrals * POINTS.referral,
  };
}

export function makeReferralCode(name: string) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4).padEnd(4, "X");
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `SHK-${letters}${digits}`;
}
