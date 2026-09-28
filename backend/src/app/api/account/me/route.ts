import type { NextRequest } from "next/server";
import { loadProfile, saveProfile, sessionEmail, snapshot } from "@/lib/server/customer";
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
  const p: AccountProfile = (await loadProfile(email)) ?? emptyProfile(email);

  if (typeof b.name === "string") {
    const name = str(b.name, 80);
    if (!name) return bad("Please tell us your name.");
    p.name = name;
  }
  if (typeof b.phone === "string") {
    const phone = str(b.phone, 20);
    if (phone && !isPhone(phone)) return bad("Please enter a valid phone number.");
    p.phone = phone;
  }
  if (Array.isArray(b.wishlist)) p.wishlist = [...new Set(b.wishlist.map((s) => str(s, 60)).filter(Boolean))].slice(0, 100);
  if (typeof b.referralCode === "string" && !p.referralCode && /^SHK-[A-Z]{4}\d{4}$/.test(b.referralCode)) p.referralCode = b.referralCode;
  if (typeof b.reviewsWritten === "number" && Number.isInteger(b.reviewsWritten)) p.reviewsWritten = Math.max(p.reviewsWritten, Math.min(b.reviewsWritten, 500));
  if (b.warranties && typeof b.warranties === "object" && !Array.isArray(b.warranties)) {
    for (const [orderId, w] of Object.entries(b.warranties as Record<string, { id?: unknown; serial?: unknown; registeredAt?: unknown }>).slice(0, 50)) {
      if (w && typeof w === "object") p.warranties[str(orderId, 40)] = { id: str(w.id, 60), serial: str(w.serial, 40), registeredAt: str(w.registeredAt, 40) };
    }
  }
  await saveProfile(p);
  return json({ profile: p });
}
