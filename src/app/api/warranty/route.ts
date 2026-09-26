import { timingSafeEqual } from "crypto";
import { get, insert } from "@/lib/server/db";
import { bad, body, json, limited, str } from "@/lib/server/http";
import type { OrderData } from "@/lib/orders";

export const runtime = "nodejs";

/** Registers the 10-year warranty against a real order (proved by its private token). */
export async function POST(req: Request) {
  if (limited(req, "warranty", 6)) return bad("Too many attempts", 429);
  const b = await body(req);
  if (!b) return bad("Bad request");
  const orderId = str(b.orderId, 30);
  const token = str(b.token, 60);
  const serial = str(b.serial, 40).toUpperCase();
  const name = str(b.name, 80);
  if (!name || !/^[A-Z0-9-]{6,40}$/.test(serial)) return bad("Please check the serial number on your mattress label.");

  const order = await get<OrderData>("orders", orderId);
  const ok = order && Buffer.from(token).length === Buffer.from(order.data.token).length && timingSafeEqual(Buffer.from(token), Buffer.from(order.data.token));
  if (!ok) return bad("We couldn't match that order.", 404);

  const row = await insert("warranties", { orderId, serial, name, product: str(b.product, 60), expires: new Date(Date.now() + 10 * 365.25 * 86400000).toISOString() }, { email: order.email ?? undefined, status: "active" });
  return json({ id: row.id, registeredAt: row.created_at });
}
