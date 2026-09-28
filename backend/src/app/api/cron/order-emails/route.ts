import { catchUpOrderEmails } from "@/lib/server/order-email";
import { bad, json } from "@/lib/server/http";

export const runtime = "nodejs";

/**
 * Daily catch-up (Vercel Cron, see vercel.json): emails customers whose orders moved to a new stage
 * on the automatic calendar. Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return bad("Unauthorised", 401);
  return json(await catchUpOrderEmails());
}
