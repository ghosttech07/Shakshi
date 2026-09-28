import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { NEEDS_DATABASE, insert, list } from "@/lib/server/db";
import { ADMIN_COOKIE, adminBase, cookieOptions, passwordHash, signSession } from "@/lib/server/admin-session";
import { body, str } from "@/lib/server/http";

export const runtime = "nodejs";

const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;
const GENERIC = { error: "Incorrect password" };

type Attempt = { ip: string; success: boolean; userAgent: string };

const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";

/**
 * Studio sign-in. The password is compared on the server against a bcrypt hash; the browser
 * never sees the hash or the rules. Five failures from one IP locks it out for fifteen minutes,
 * and every attempt is recorded. Failures (and lockouts) all return the same generic message.
 */
export async function POST(req: Request) {
  try {
    return await signIn(req);
  } catch (e) {
    // A server without its database can't record attempts, so it can't let anyone in safely
    if ((e as Error).message === NEEDS_DATABASE) return NextResponse.json({ error: NEEDS_DATABASE }, { status: 503 });
    throw e;
  }
}

async function signIn(req: Request) {
  const base = adminBase();
  if (!base) return NextResponse.json(GENERIC, { status: 401 });

  const ip = clientIp(req);
  const userAgent = str(req.headers.get("user-agent"), 200);
  const since = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const recentFails = (await list<Attempt>("login_attempts", { status: "fail", since, limit: 1000 })).filter((a) => a.data.ip === ip).length;

  const b = await body(req, 2000);
  const password = str(b?.password, 200);

  if (recentFails >= LOCK_AFTER) {
    await insert("login_attempts", { ip, success: false, userAgent, locked: true }, { status: "fail" });
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(GENERIC, { status: 401 });
  }

  const ok = password.length > 0 && (await bcrypt.compare(password, passwordHash()));
  await insert("login_attempts", { ip, success: ok, userAgent }, { status: ok ? "success" : "fail" });
  if (!ok) return NextResponse.json(GENERIC, { status: 401 });

  const res = NextResponse.json({ ok: true, next: base });
  const secure = new URL(req.url).protocol === "https:";
  res.cookies.set(ADMIN_COOKIE, await signSession(), cookieOptions(secure));
  return res;
}
