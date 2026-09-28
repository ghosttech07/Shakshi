import { NextResponse, type NextRequest } from "next/server";
import { backendUrl, studioOrigin } from "@/lib/backend-url";

/**
 * Redirects managed in the studio (Site → Redirects). The list is fetched from the backend
 * at most once a minute and kept in memory; if the backend is unreachable, pages simply load.
 */
const API = backendUrl();
type Redirect = { from: string; to: string; permanent: boolean };
let cache: { at: number; list: Redirect[] } = { at: 0, list: [] };
let inflight: Promise<void> | null = null;

async function refresh() {
  try {
    const r = await fetch(`${API}/api/public/routing`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
    cache = r.ok ? { at: Date.now(), list: ((await r.json()).redirects ?? []) as Redirect[] } : { ...cache, at: Date.now() };
  } catch {
    cache = { ...cache, at: Date.now() }; // try again in a minute
  }
}

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p).toLowerCase();

/** Browser calls to /api/* go to the backend, carrying the visitor's real IP (for its per-visitor limits). */
function toBackend(req: NextRequest) {
  const headers = new Headers(req.headers);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip");
  const secret = process.env.REVALIDATE_SECRET;
  headers.delete("x-shakshi-client-ip");
  headers.delete("x-shakshi-proxy");
  if (ip && secret) {
    headers.set("x-shakshi-client-ip", ip);
    headers.set("x-shakshi-proxy", secret);
  }
  return NextResponse.rewrite(new URL(req.nextUrl.pathname + req.nextUrl.search, API), { request: { headers } });
}

export async function proxy(req: NextRequest) {
  // The storefront's own API route stays here; every other /api/* call belongs to the backend.
  if (req.nextUrl.pathname.startsWith("/api/")) return req.nextUrl.pathname === "/api/revalidate" ? NextResponse.next() : toBackend(req);

  if (Date.now() - cache.at > 60_000) {
    inflight ??= refresh().finally(() => (inflight = null));
    // Only the very first request waits; after that a stale list is served while it refreshes.
    if (!cache.at) await inflight;
  }
  const path = norm(req.nextUrl.pathname);
  const hit = cache.list.find((r) => norm(r.from) === path);
  if (hit) {
    const to = /^https?:\/\//.test(hit.to) ? hit.to : new URL(hit.to, req.nextUrl.origin).toString();
    return NextResponse.redirect(to, hit.permanent ? 308 : 307);
  }
  if (path === "/preview") {
    // The studio shows drafts here inside a frame; only the studio may frame it.
    const res = NextResponse.next();
    res.headers.set("Content-Security-Policy", `frame-ancestors 'self' ${studioOrigin()}`);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  // Pages and API calls; never static assets, images or metadata files.
  matcher: ["/((?!_next/|brand/|hero/|anatomy/|icon|apple-icon|robots.txt|sitemap.xml|favicon).*)"],
};
