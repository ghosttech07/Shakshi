import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminBase } from "@/lib/server/admin-session";

export const runtime = "nodejs";

/** Clears the studio session on the server, then returns to the sign-in screen. */
export async function POST(req: Request) {
  const base = adminBase() ?? "";
  const res = NextResponse.redirect(new URL(`${base}/login`, req.url), 303);
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
