import { isAdmin } from "@/lib/server/studio";
import { get, upsert } from "@/lib/server/db";
import { audit } from "@/lib/server/content";
import { bad, body, json, num, str } from "@/lib/server/http";
import type { DiscountData } from "@shakshi/shared/records";

export const runtime = "nodejs";

/** Creates a discount code. Codes are stored upper-case and must be unique. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body(req);
  if (!b) return bad("Bad request");
  const code = str(b.code, 30).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9-]{3,30}$/.test(code)) return bad("Use 3–30 letters, numbers or dashes for the code.");
  if (/^(SHK|GIFT)-/.test(code)) return bad("Codes starting SHK- or GIFT- are reserved for referrals and gift cards.");
  if (await get("discount_codes", code)) return bad("That code already exists.");
  const type = b.type === "flat" ? "flat" : "percent";
  const value = num(b.value);
  if (!(value > 0) || (type === "percent" && value > 100)) return bad(type === "percent" ? "A percentage between 1 and 100, please." : "Enter the amount off in rupees.");
  const expiresAt = str(b.expiresAt, 30);
  const data: DiscountData = {
    type,
    value: Math.round(value),
    expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59+05:30`).toISOString() : undefined,
    usageLimit: num(b.usageLimit) > 0 ? Math.round(num(b.usageLimit)) : undefined,
    minSubtotal: num(b.minSubtotal) > 0 ? Math.round(num(b.minSubtotal)) : undefined,
    uses: 0,
    active: true,
    note: str(b.note, 200) || undefined,
  };
  await upsert("discount_codes", code, data, { status: "active" });
  await audit("discount.create", code, `${data.value}${type === "percent" ? "%" : " INR"}`);
  return json({ ok: true, code });
}
