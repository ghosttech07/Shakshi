import { timingSafeEqual } from "crypto";
import { get } from "@/lib/server/db";
import { bad, json } from "@/lib/server/http";
import { currentStage, stageTimes, type OrderData } from "@/lib/orders";

export const runtime = "nodejs";

/** Order tracking for the customer who placed it. The order token (kept in their browser) is the key. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const row = await get<OrderData>("orders", id);
  if (!row) return bad("Order not found", 404);
  const a = Buffer.from(token);
  const b = Buffer.from(row.data.token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return bad("Order not found", 404);

  return json({
    id: row.id,
    createdAt: row.created_at,
    stage: currentStage(row),
    times: stageTimes(row.created_at, row.data.deliveryDate),
    deliveryDate: row.data.deliveryDate,
    total: row.data.total,
  });
}
