import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export const bad = (message: string, status = 400) => json({ error: message }, status);

/** Parses a JSON body with a size cap; returns null on anything malformed. */
export async function body<T = Record<string, unknown>>(req: Request, maxBytes = 32_000): Promise<T | null> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as T) : null;
  } catch {
    return null;
  }
}

export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const isPhone = (v: string) => /^[+\d][\d\s-]{7,16}$/.test(v);

/**
 * The visitor's IP address. Shop visitors reach the backend through the storefront, which passes their
 * real address along with the shared REVALIDATE_SECRET as proof; without that proof it's ignored.
 */
export function clientIp(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const passed = req.headers.get("x-shakshi-client-ip");
  if (secret && passed && req.headers.get("x-shakshi-proxy") === secret) return passed.slice(0, 64);
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

// A small in-memory limiter for public forms. Per server instance; enough to blunt casual abuse.
const hits = new Map<string, { n: number; reset: number }>();
export function limited(req: Request, bucket: string, max = 20, windowMs = 60_000) {
  const ip = clientIp(req);
  const k = `${bucket}:${ip}`;
  const now = Date.now();
  const h = hits.get(k);
  if (!h || h.reset < now) {
    hits.set(k, { n: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [key, v] of hits) if (v.reset < now) hits.delete(key);
    return false;
  }
  h.n++;
  return h.n > max;
}
