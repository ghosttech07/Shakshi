import { list } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { SIZES } from "@shakshi/shared/products";
import type { OrderData } from "@shakshi/shared/orders";

export const runtime = "nodejs";

type Notice = { city: string; product: string; size: string; minutesAgo: number; demo?: boolean };

/**
 * Recent purchases, anonymised to city + mattress + size. Only real orders are shown;
 * SOCIAL_PROOF_DEMO=true adds sample notices for demos and must stay off in production.
 */
export async function GET() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const orders = await list<OrderData>("orders", { since, limit: 40 });
  const notices: Notice[] = orders
    .filter((o) => !o.data.sample)
    .flatMap((o) => {
      const m = o.data.items.find((i) => i.kind === "mattress");
      if (!m || !o.data.customer.city) return [];
      return [{ city: o.data.customer.city, product: m.name, size: SIZES.find((s) => s.id === m.size)?.label ?? "", minutesAgo: Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000) }];
    })
    .slice(0, 12);

  if (!notices.length && process.env.SOCIAL_PROOF_DEMO === "true") {
    notices.push(
      { city: "Hyderabad", product: "The Shakshi Signature", size: "Queen", minutesAgo: 14, demo: true },
      { city: "Pune", product: "The Cirrus", size: "King", minutesAgo: 41, demo: true },
      { city: "Chennai", product: "The Lumen", size: "Queen", minutesAgo: 96, demo: true }
    );
  }
  return json({ notices });
}
