import { timingSafeEqual } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { BACKEND_TAG } from "@/lib/data";

export const runtime = "nodejs";

/** Called by the backend after studio edits, so shoppers see new prices, stock and settings promptly. */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  const given = req.headers.get("x-revalidate-secret") ?? "";
  const ok = secret.length >= 16 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  revalidateTag(BACKEND_TAG, "max");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
