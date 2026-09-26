import { randomBytes } from "crypto";
import { insert } from "@/lib/server/db";
import { bad, body, isEmail, isPhone, json, limited, str } from "@/lib/server/http";
import { SHOWROOMS } from "@shakshi/shared/products";
import type { BookingData, BookingKind as Kind } from "@shakshi/shared/records";

export const runtime = "nodejs";

const KINDS: Kind[] = ["salon", "home", "video"];

export async function POST(req: Request) {
  if (limited(req, "bookings", 8)) return bad("Too many attempts. Please wait a moment.", 429);
  const b = await body(req);
  if (!b) return bad("Bad request");
  const kind = b.kind as Kind;
  if (!KINDS.includes(kind)) return bad("Please choose a type of visit.");
  const start = new Date(str(b.start, 40));
  if (isNaN(start.getTime()) || start.getTime() < Date.now() || start.getTime() > Date.now() + 62 * 86400000) return bad("Please choose a date and time.");
  const name = str(b.name, 80);
  const phone = str(b.phone, 20);
  const email = str(b.email, 120).toLowerCase();
  if (!name || !isPhone(phone)) return bad("Please share your name and a phone number.");
  if (email && !isEmail(email)) return bad("Please check your email address.");
  if (kind === "video" && !email) return bad("We'll send your video link by email, so please share it.");
  const salon = str(b.salon, 30);
  if (kind === "salon" && !SHOWROOMS.some((s) => s.id === salon)) return bad("Please choose a salon.");
  const address = str(b.address, 240);
  if (kind === "home" && address.length < 8) return bad("Please share the address for your home trial.");

  const data: BookingData = {
    kind,
    start: start.toISOString(),
    minutes: kind === "video" ? 15 : 60,
    name,
    phone,
    email: email || undefined,
    salon: kind === "salon" ? salon : undefined,
    address: kind === "home" ? address : undefined,
    topic: str(b.topic, 300) || undefined,
  };
  // A private video room per consultation. Point VIDEO_ROOM_BASE at your own meeting provider.
  if (kind === "video") data.meetingUrl = `${process.env.VIDEO_ROOM_BASE ?? "https://meet.jit.si/"}Shakshi-Consult-${randomBytes(6).toString("hex")}`;

  const row = await insert("bookings", data, { status: "requested", email: email || undefined });
  return json({ id: row.id, meetingUrl: data.meetingUrl });
}
