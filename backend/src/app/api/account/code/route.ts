import { authClient, signInUnavailable } from "@/lib/server/customer";
import { bad, body, isEmail, json, limited, str } from "@/lib/server/http";

export const runtime = "nodejs";

/** Step 1 of signing in: Supabase emails a one-time code to the address (creating the account if new). */
export async function POST(req: Request) {
  const off = signInUnavailable();
  if (off) return bad(off, 503);
  if (limited(req, "account-code", 6, 10 * 60_000)) return bad("Too many codes requested. Please wait a few minutes and try again.", 429);
  const b = await body(req, 2000);
  const email = str(b?.email, 120).toLowerCase();
  if (!isEmail(email)) return bad("Please enter a valid email address.");

  const { error } = await authClient().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    const busy = error.status === 429 || /rate|limit|security purposes/i.test(error.message);
    console.warn(`[account] code for ${email} failed: ${error.message}`);
    return bad(busy ? "We've just sent a code to this address. Please wait a minute before asking for another." : "We couldn't send a code just now. Please try again.", busy ? 429 : 502);
  }
  return json({ ok: true });
}
