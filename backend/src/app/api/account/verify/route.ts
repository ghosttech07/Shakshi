import { NextResponse, type NextRequest } from "next/server";
import { authClient, loadProfile, saveProfile, signInUnavailable, snapshot, startSession } from "@/lib/server/customer";
import { bad, body, isEmail, limited, str } from "@/lib/server/http";
import { emptyProfile } from "@shakshi/shared/account";

export const runtime = "nodejs";

/** Step 2: the customer types the code from their email. A match signs them in on this device. */
export async function POST(req: NextRequest) {
  const off = signInUnavailable();
  if (off) return bad(off, 503);
  if (limited(req, "account-verify", 12, 10 * 60_000)) return bad("Too many attempts. Please wait a few minutes and try again.", 429);
  const b = await body(req, 2000);
  const email = str(b?.email, 120).toLowerCase();
  const code = str(b?.code, 12).replace(/\s/g, "");
  if (!isEmail(email) || !/^\d{6,10}$/.test(code)) return bad("Please enter the code from your email.");

  const { data, error } = await authClient().auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) return bad("That code isn't right or has expired. Please check it, or ask for a new one.", 400);

  const now = new Date().toISOString();
  const existing = await loadProfile(email);
  const profile = existing ?? emptyProfile(email, now);
  profile.lastSignInAt = now;
  await saveProfile(profile);

  const res = NextResponse.json({ ...(await snapshot(email)), isNew: !existing || !existing.name }, { headers: { "Cache-Control": "no-store" } });
  await startSession(res, email);
  return res;
}
