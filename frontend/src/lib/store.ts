"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SizeId } from "./products";
import { track } from "./analytics";

export type CartItem = {
  key: string; // unique per configuration
  kind: "mattress" | "accessory" | "addon" | "bundle" | "giftcard";
  ref: string; // product slug or accessory id
  name: string;
  detail?: string;
  image: string;
  size?: SizeId;
  price: number; // unit price
  qty: number;
  gift?: { to: string; email?: string; from: string; message?: string; design: string };
};

type Toast = { id: number; message: string };

type State = {
  cart: CartItem[];
  wishlist: string[];
  recent: string[];
  compare: string[];
  // UI (not persisted)
  cartOpen: boolean;
  quickView: string | null;
  conciergeOpen: boolean;
  toasts: Toast[];

  addToCart: (item: Omit<CartItem, "qty"> & { qty?: number }, open?: boolean) => void;
  setQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  pushRecent: (slug: string) => void;
  toggleCompare: (slug: string) => void;
  clearCompare: () => void;
  setCartOpen: (open: boolean) => void;
  setQuickView: (slug: string | null) => void;
  setConciergeOpen: (open: boolean) => void;
  toast: (message: string) => void;
  dismissToast: (id: number) => void;
};

let toastId = 0;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      recent: [],
      compare: [],
      cartOpen: false,
      quickView: null,
      conciergeOpen: false,
      toasts: [],

      addToCart: (item, open = true) => {
        const qty = item.qty ?? 1;
        const existing = get().cart.find((c) => c.key === item.key);
        set({
          cart: existing
            ? get().cart.map((c) => (c.key === item.key ? { ...c, qty: c.qty + qty } : c))
            : [...get().cart, { ...item, qty }],
        });
        track("add_to_cart", { item: item.ref, kind: item.kind, size: item.size ?? "", price: item.price, qty });
        // <FlyToCart> folds a little linen square into the bag, then opens the drawer if asked.
        window.dispatchEvent(new CustomEvent("shakshi:add", { detail: { open } }));
      },
      setQty: (key, qty) =>
        set({ cart: qty <= 0 ? get().cart.filter((c) => c.key !== key) : get().cart.map((c) => (c.key === key ? { ...c, qty } : c)) }),
      removeFromCart: (key) => set({ cart: get().cart.filter((c) => c.key !== key) }),
      clearCart: () => set({ cart: [] }),

      toggleWishlist: (slug) => {
        const has = get().wishlist.includes(slug);
        set({ wishlist: has ? get().wishlist.filter((s) => s !== slug) : [...get().wishlist, slug] });
        get().toast(has ? "Removed from your wishlist" : "Saved to your wishlist");
      },
      pushRecent: (slug) => set({ recent: [slug, ...get().recent.filter((s) => s !== slug)].slice(0, 8) }),
      toggleCompare: (slug) => {
        const list = get().compare;
        if (list.includes(slug)) return set({ compare: list.filter((s) => s !== slug) });
        if (list.length >= 3) return get().toast("Compare up to three mattresses at a time");
        set({ compare: [...list, slug] });
      },
      clearCompare: () => set({ compare: [] }),

      setCartOpen: (cartOpen) => set({ cartOpen }),
      setQuickView: (quickView) => set({ quickView }),
      setConciergeOpen: (conciergeOpen) => set({ conciergeOpen }),
      toast: (message) => {
        const id = ++toastId;
        set({ toasts: [...get().toasts, { id, message }] });
        setTimeout(() => get().dismissToast(id), 3200);
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: "shakshi-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist, recent: s.recent, compare: s.compare }),
      skipHydration: true,
    }
  )
);

export const cartSubtotal = (cart: CartItem[]) => cart.reduce((sum, c) => sum + c.price * c.qty, 0);
export const cartCount = (cart: CartItem[]) => cart.reduce((sum, c) => sum + c.qty, 0);
