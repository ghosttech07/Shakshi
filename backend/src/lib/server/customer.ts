import { SignJWT, jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import { backend, get, list, upsert } from "./db";
import { emptyProfile, type AccountOrder, type AccountProfile, type AccountSnapshot } from "@shakshi/shared/account";
import type { OrderData } from "@shakshi/shared/orders";

/**
 * Customer accounts. Supabase Auth proves the email (a one-time code sent to it); after that the
 * shop keeps its own signed, httpOnly cookie so the customer stays signed in for 30 days.
 *
 * Environment: CUSTOMER_SESSION_SECRET (32+ characters). Falls back to one derived from
 * ADMIN_SESSION_SECRET, so no extra setting is needed.
 */
export const CUSTOMER_COOKIE = "shk_customer";
const DAYS = 30;

function secret() {
  const own = process.env.CUSTOMER_SESSION_SECRET ?? "";
  const admin = process.env.ADMIN_SESSION_SECRET ?? "";
  const s = own.length >= 32 ? own : admin.length >= 32 ? `${admin}#customer-accounts` : "";
  return s ? new TextEncoder().encode(s) : null;
}

/** Why sign-in can't work on this server, or null when it can. */
export function signInUnavailable(): string | null {
  if (backend !== "supabase") return "Sign-in isn't available yet: the shop's database isn't connected.";
  if (!secret()) return "Sign-in isn't available yet: the server needs a session secret.";
  return null;
}

/** A fresh Supabase client per request, so one customer's sign-in never touches another's. */
export function authClient() {
  return createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function startSession(res: NextResponse, email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .setIssuer("shakshi-customer")
    .sign(secret()!);
  res.cookies.set(CUSTOMER_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DAYS * 86400 });
}

export function endSession(res: NextResponse) {
  res.cookies.set(CUSTOMER_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

/** The signed-in customer's email, or null. */
export async function sessionEmail(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(CUSTOMER_COOKIE)?.value;
  const key = secret();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { issuer: "shakshi-customer", algorithms: ["HS256"] });
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function loadProfile(email: string): Promise<AccountProfile | null> {
  const row = await get<AccountProfile>("customers", email);
  return row ? { ...emptyProfile(email, row.created_at), ...row.data, email } : null;
}

export async function saveProfile(p: AccountProfile) {
  await upsert("customers", p.email, p, { email: p.email, status: "active" });
  return p;
}

export function toAccountOrder(r: { id: string; created_at: string; data: OrderData }): AccountOrder {
  const d = r.data;
  return {
    id: r.id,
    token: d.token,
    createdAt: r.created_at,
    deliveryDate: d.deliveryDate,
    total: d.total,
    items: d.items,
    customer: d.customer,
    discount: d.discount,
    removal: d.removal,
    delivery: d.delivery ?? 0,
    giftCodes: d.giftCodes,
  };
}

export async function snapshot(email: string): Promise<AccountSnapshot> {
  const [profile, orders] = await Promise.all([loadProfile(email), list<OrderData>("orders", { email, limit: 200 })]);
  return { profile: profile ?? emptyProfile(email), orders: orders.filter((o) => !o.data.sample).map(toAccountOrder) };
}
