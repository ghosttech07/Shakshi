import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, INTERNAL_PREFIX, adminBase, verifySession } from "@/lib/server/admin-session";

const PRIVATE_HEADERS = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

function privately(res: NextResponse) {
  for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v);
  return res;
}

/**
 * Guards the studio:
 * - /<ADMIN_PATH>/login is the only studio page reachable without a session.
 * - Every other /<ADMIN_PATH>/… page needs a valid session, or redirects to the login screen.
 * - /api/admin/… (except login) answers 401 without a session.
 * - The internal route the studio is served from can never be visited directly.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === INTERNAL_PREFIX || pathname.startsWith(`${INTERNAL_PREFIX}/`)) {
    return NextResponse.rewrite(new URL("/_not-a-page", req.url));
  }

  const authed = () => verifySession(req.cookies.get(ADMIN_COOKIE)?.value);

  if (pathname.startsWith("/api/admin/")) {
    if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") return privately(NextResponse.next());
    return (await authed()) ? privately(NextResponse.next()) : privately(NextResponse.json({ error: "Unauthorised" }, { status: 401 }));
  }

  const base = adminBase();
  if (!base || (pathname !== base && !pathname.startsWith(`${base}/`))) return NextResponse.next();

  const sub = pathname.slice(base.length) || "/";
  const ok = await authed();
  if (sub === "/login") {
    return privately(ok ? NextResponse.redirect(new URL(base, req.url)) : NextResponse.rewrite(new URL(`${INTERNAL_PREFIX}/login${search}`, req.url)));
  }
  if (!ok) return privately(NextResponse.redirect(new URL(`${base}/login`, req.url)));
  return privately(NextResponse.rewrite(new URL(`${INTERNAL_PREFIX}${sub === "/" ? "" : sub}${search}`, req.url)));
}

export const config = {
  // Everything except build assets and public files.
  matcher: ["/((?!_next/static|_next/image|brand/|hero/|icon|apple-icon|robots.txt|sitemap.xml).*)"],
};
