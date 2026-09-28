import { list, type Row } from "./db";
import { currentStage, type OrderData } from "@shakshi/shared/orders";
import type { BookingData, CartSnapshot, EventData, LeadData, ReviewData } from "@shakshi/shared/records";

/** Read helpers for studio pages (server only; every caller sits behind requireStudio). */

const TZ = "Asia/Kolkata";
/** YYYY-MM-DD in India time. */
export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

export const orders = () => list<OrderData>("orders", { limit: 2000 });
export const liveOrders = (rows: Row<OrderData>[]) => rows.filter((o) => !o.data.sample);
export const stageOf = (o: Row<OrderData>) => currentStage(o);

export async function overview() {
  const [os, bookings, reviews, leads, stock, events, carts] = await Promise.all([
    orders(),
    list<BookingData>("bookings", { limit: 1000 }),
    list<ReviewData>("reviews", { status: "pending", limit: 1000 }),
    list<LeadData>("leads", { status: "new", limit: 1000 }),
    list<{ qty: number | null }>("stock", { limit: 500 }),
    list<EventData>("events", { limit: 20000, since: new Date(Date.now() - 30 * 86400000).toISOString() }),
    list<CartSnapshot>("abandoned_carts", { status: "open", limit: 500 }),
  ]);
  const now = new Date();
  const today = dayKey(now);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStart = dayKey(monday);
  const monthStart = today.slice(0, 8) + "01";

  const real = liveOrders(os);
  const sum = (rows: Row<OrderData>[]) => rows.reduce((s, o) => s + (o.data.total ?? 0), 0);
  const since = (k: string) => real.filter((o) => dayKey(o.created_at) >= k);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400000);
    return { date: dayKey(d), total: 0, orders: 0 };
  });
  const byDay = new Map(days.map((d) => [d.date, d]));
  for (const o of real) {
    const d = byDay.get(dayKey(o.created_at));
    if (d) {
      d.total += o.data.total ?? 0;
      d.orders += 1;
    }
  }

  const count = (name: string) => new Set(events.filter((e) => e.data.name === name).map((e) => e.data.sessionId)).size;
  const funnel = [
    { label: "Visited", n: count("page_view") },
    { label: "Added to bag", n: count("add_to_cart") },
    { label: "Began checkout", n: count("checkout_step") },
    { label: "Ordered", n: count("purchase") },
  ];

  return {
    todayOrders: since(today).length,
    todayRevenue: sum(since(today)),
    weekRevenue: sum(since(weekStart)),
    monthRevenue: sum(since(monthStart)),
    pending: real.filter((o) => stageOf(o) !== "delivered").length,
    lowStock: stock.filter((s) => typeof s.data.qty === "number" && s.data.qty <= 3).map((s) => ({ key: s.id, qty: s.data.qty as number })),
    pendingReviews: reviews.length,
    openInquiries: leads.length,
    upcomingBookings: bookings.filter((b) => b.status !== "cancelled" && new Date(b.data.start) >= now).length,
    bookingsToConfirm: bookings.filter((b) => (b.status ?? "requested") === "requested" && new Date(b.data.start) >= now).length,
    openCarts: carts.filter((c) => c.data.items?.length).length,
    days,
    funnel,
    recent: real.slice(0, 6),
  };
}

/** What field editors need to offer: mattresses to pick, and the site's own addresses for link fields. */
export async function editorContext() {
  const { getCatalog } = await import("./catalog");
  const { listPages } = await import("./content");
  const [products, pages] = await Promise.all([getCatalog({ includeUnpublished: true }), listPages()]);
  return {
    products: products.map((p) => ({ slug: p.slug, name: p.name })),
    links: [...pages.map((p) => `/${p.slug}`), ...products.map((p) => `/mattress/${p.slug}`), "/account", "/wishlist", "/checkout", "/showroom?kind=video#book"],
  };
}
