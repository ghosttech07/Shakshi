import type { NextRequest } from "next/server";
import { loadProfile, saveProfile, sessionEmail, snapshot } from "@/lib/server/customer";
import { update } from "@/lib/server/db";
import { bad, body, isPhone, json, str } from "@/lib/server/http";
import { emptyProfile, type AccountProfile } from "@shakshi/shared/account";

export const runtime = "nodejs";

/** The signed-in customer's account: profile plus every order placed with their email. */
export async function GET(req: NextRequest) {
  const email = await sessionEmail(req);
  if (!email) return bad("Not signed in", 401);
  return json(await snapshot(email));
}

/** Updates the parts of the account the customer controls. Unknown fields are ignored. */
export async function PATCH(req: NextRequest) {
  const email = await sessionEmail(req);
  if (!email) return bad("Not signed in", 401);
  const b = await body(req, 20_000);
  if (!b) return bad("Bad request");
  const current = await loadProfile(email);
  // Only the fields sent are changed (so two saves close together can't undo each other)
  const changes: Partial<AccountProfile> = {};

  if (typeof b.name === "string") {
    const name = str(b.name, 80);
    if (!name) return bad("Please tell us your name.");
    changes.name = name;
  }
  if (typeof b.phone === "string") {
    const phone = str(b.phone, 20);
    if (phone && !isPhone(phone)) return bad("Please enter a valid phone number.");
    changes.phone = phone;
  }
  if (Array.isArray(b.wishlist)) changes.wishlist = [...new Set(b.wishlist.map((s) => str(s, 60)).filter(Boolean))].slice(0, 100);
  if (typeof b.referralCode === "string" && !current?.referralCode && /^SHK-[A-Z]{4}\d{4}$/.test(b.referralCode)) changes.referralCode = b.referralCode;
  if (typeof b.reviewsWritten === "number" && Number.isInteger(b.reviewsWritten)) changes.reviewsWritten = Math.max(current?.reviewsWritten ?? 0, Math.min(b.reviewsWritten, 500));
  if (b.warranties && typeof b.warranties === "object" && !Array.isArray(b.warranties)) {
    const w: AccountProfile["warranties"] = { ...(current?.warranties ?? {}) };
    for (const [orderId, x] of Object.entries(b.warranties as Record<string, { id?: unknown; serial?: unknown; registeredAt?: unknown }>).slice(0, 50)) {
      if (x && typeof x === "object") w[str(orderId, 40)] = { id: str(x.id, 60), serial: str(x.serial, 40), registeredAt: str(x.registeredAt, 40) };
    }
    changes.warranties = w;
  }

  if (!current) return json({ profile: await saveProfile({ ...emptyProfile(email), ...changes }) });
  const row = await update<AccountProfile>("customers", email, { data: changes });
  return json({ profile: { ...current, ...(row?.data ?? changes), email } });
}
