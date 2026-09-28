"use client";

import type { AccountProfile, AccountSnapshot } from "@shakshi/shared/account";
import { useAccount } from "./account";
import { useStore } from "./store";

/**
 * The customer's account on the server. Signing in (email + one-time code) makes the account the
 * same on every device: profile, orders, wishlist, rewards and warranties load from the shop's database.
 */
type Result<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

async function call<T>(path: string, method: "GET" | "POST" | "PATCH", body?: unknown): Promise<Result<T>> {
  try {
    const res = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin", cache: "no-store" });
    const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : null;
    if (res.ok && data) return { ok: true, data: data as T };
    return { ok: false, error: data?.error ?? "We can't reach your account just now. Please try again shortly.", status: res.status };
  } catch {
    return { ok: false, error: "We can't reach your account just now. Please check your connection and try again.", status: 0 };
  }
}

export const requestCode = (email: string) => call<{ ok: true }>("/api/account/code", "POST", { email });
export const verifyCode = (email: string, code: string) => call<AccountSnapshot & { isNew: boolean }>("/api/account/verify", "POST", { email, code });
type Patch = Partial<Pick<AccountProfile, "name" | "phone" | "wishlist" | "referralCode" | "reviewsWritten" | "warranties">>;
let queue: Promise<unknown> = Promise.resolve();
/** Saves to the account, one save at a time and in order. */
export function saveAccount(patch: Patch): Promise<Result<{ profile: AccountProfile }>> {
  const run = queue.then(() => call<{ profile: AccountProfile }>("/api/account/me", "PATCH", patch));
  queue = run.catch(() => undefined);
  return run;
}

let signedIn = false;
let loading = false; // true while the server's account is being put into the browser
export const isSignedIn = () => signedIn;

/** Puts the server's account into the browser, merging anything saved here before signing in. */
export async function applySnapshot(s: AccountSnapshot) {
  signedIn = true;
  const acct = useAccount.getState();
  const store = useStore.getState();
  const p = s.profile;

  const wishlist = [...new Set([...p.wishlist, ...store.wishlist])];
  const referralCode = p.referralCode ?? acct.referralCode;
  const reviewsWritten = Math.max(p.reviewsWritten, acct.reviewsWritten);
  const warranties = { ...acct.warranties, ...p.warranties };
  const serverIds = new Set(s.orders.map((o) => o.id));
  const orders = [...s.orders, ...acct.orders.filter((o) => !serverIds.has(o.id) && o.sample)];

  loading = true;
  useAccount.setState({ profile: { name: p.name, email: p.email, phone: p.phone }, orders, referralCode, reviewsWritten, warranties });
  useStore.setState({ wishlist });
  loading = false;

  // Anything that only existed on this device goes up to the account
  const patch: Patch = {};
  if (wishlist.length !== p.wishlist.length) patch.wishlist = wishlist;
  if (referralCode && !p.referralCode) patch.referralCode = referralCode;
  if (reviewsWritten > p.reviewsWritten) patch.reviewsWritten = reviewsWritten;
  if (Object.keys(warranties).length > Object.keys(p.warranties).length) patch.warranties = warranties;
  if (Object.keys(patch).length) await saveAccount(patch);
}

/** Loads the account if this browser is signed in. Returns whether it is. */
export async function refreshAccount() {
  const r = await call<AccountSnapshot>("/api/account/me", "GET");
  if (r.ok) {
    await applySnapshot(r.data);
    return true;
  }
  if (r.status === 401) {
    signedIn = false;
    // A name typed on this device before accounts were verified isn't an account: ask for the code.
    if (useAccount.getState().profile) useAccount.setState({ profile: null });
  }
  return false;
}

/** Signs out here, and clears this device of the account's personal details. */
export async function signOut() {
  await call("/api/account/logout", "POST");
  signedIn = false;
  useAccount.setState({ profile: null, orders: [], referralCode: null, reviewsWritten: 0, warranties: {} });
  useStore.setState({ wishlist: [] });
}

let watching = false;
/** Keeps the account up to date as the customer saves things (wishlist, rewards, warranties). */
export function watchAccount() {
  if (watching) return;
  watching = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const push = (patch: Patch) => {
    if (!signedIn || loading) return;
    clearTimeout(timer);
    timer = setTimeout(() => void saveAccount(patch), 600);
  };
  useStore.subscribe((s, prev) => {
    if (s.wishlist !== prev.wishlist) push({ wishlist: s.wishlist });
  });
  useAccount.subscribe((s, prev) => {
    if (!signedIn || loading) return;
    if (s.referralCode !== prev.referralCode && s.referralCode) void saveAccount({ referralCode: s.referralCode });
    if (s.reviewsWritten !== prev.reviewsWritten) void saveAccount({ reviewsWritten: s.reviewsWritten });
    if (s.warranties !== prev.warranties) void saveAccount({ warranties: s.warranties });
  });
}
