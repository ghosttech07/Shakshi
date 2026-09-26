"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Answers } from "./quiz";
import type { OrderItem } from "./orders";
import { POINTS } from "./orders";

export type LocalOrder = {
  id: string;
  token: string;
  createdAt: string;
  deliveryDate: string;
  total: number;
  items: OrderItem[];
  sample?: boolean;
  giftCodes?: { code: string; amount: number; to: string }[];
};

export type JournalEntry = { date: string; quality: number; hours: number; note?: string };
export type ThemePref = "auto" | "day" | "night";
export type SoundId = "rain" | "ocean" | "noise";

type State = {
  profile: { name: string; email: string } | null;
  orders: LocalOrder[];
  quiz: { answers: Answers; match: string; score: number; at: string } | null;
  journal: JournalEntry[];
  reviewsWritten: number;
  referralCode: string | null;
  referredBy: string | null;
  warranties: Record<string, { id: string; serial: string; registeredAt: string }>;
  unrolledAt: string | null;
  cartId: string;
  theme: ThemePref;
  sound: SoundId | null;
  volume: number;

  signIn: (name: string, email: string) => void;
  signOut: () => void;
  addOrder: (o: LocalOrder) => void;
  setQuiz: (q: State["quiz"]) => void;
  logSleep: (e: JournalEntry) => void;
  removeSleep: (date: string) => void;
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

/** Everything personal is kept on this device. Orders also live on the server, reachable with their private token. */
export const useAccount = create<State>()(
  persist(
    (set, get) => ({
      profile: null,
      orders: [],
      quiz: null,
      journal: [],
      reviewsWritten: 0,
      referralCode: null,
      referredBy: null,
      warranties: {},
      unrolledAt: null,
      cartId: newId(),
      theme: "auto",
      sound: null,
      volume: 0.5,

      signIn: (name, email) => set({ profile: { name: name.trim(), email: email.trim().toLowerCase() } }),
      signOut: () => set({ profile: null }),
      addOrder: (o) => set({ orders: [o, ...get().orders.filter((x) => x.id !== o.id)] }),
      setQuiz: (quiz) => set({ quiz }),
      logSleep: (e) => set({ journal: [...get().journal.filter((j) => j.date !== e.date), e].sort((a, b) => a.date.localeCompare(b.date)).slice(-120) }),
      removeSleep: (date) => set({ journal: get().journal.filter((j) => j.date !== date) }),
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
export function pointsFor(s: Pick<State, "orders" | "reviewsWritten" | "journal">, referrals = 0) {
  const purchases = s.orders.filter((o) => !o.sample).reduce((sum, o) => sum + Math.floor(o.total / 100) * POINTS.perHundredRupees, 0);
  const weeks = new Set(s.journal.map((j) => { const d = new Date(j.date); const onejan = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-${Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)}`; })).size;
  return {
    purchases,
    reviews: s.reviewsWritten * POINTS.review,
    referrals: referrals * POINTS.referral,
    journal: weeks * POINTS.journalWeek,
    total: purchases + s.reviewsWritten * POINTS.review + referrals * POINTS.referral + weeks * POINTS.journalWeek,
  };
}

export function makeReferralCode(name: string) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4).padEnd(4, "X");
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `SHK-${letters}${digits}`;
}
