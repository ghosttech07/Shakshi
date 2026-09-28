import { get, insert, update, upsert } from "@/lib/server/db";
import { getSite } from "@/lib/server/content";
import { getAccessories, getCatalog, getStock, stockKey } from "@/lib/server/catalog";
import { checkPromo, newGiftCode, newOrderNumber, newToken, serverPrice } from "@/lib/server/commerce";
import { bad, body, isEmail, isPhone, json, limited, num, str } from "@/lib/server/http";
import type { Customer, OrderData, OrderItem } from "@shakshi/shared/orders";
import type { NextRequest } from "next/server";
import { loadProfile, saveProfile, sessionEmail, signInUnavailable } from "@/lib/server/customer";
import { sendOrderEmail } from "@/lib/server/order-email";

export const runtime = "nodejs";

type Payload = {
  items: OrderItem[];
  customer: Customer;
  deliveryDate: string;
  payment: string;
  months?: number;
  removal?: boolean;
  note?: string;
  promoCode?: string;
  cartId?: string;
};

export async function POST(req: NextRequest) {
  if (limited(req, "orders", 10)) return bad("Too many attempts. Please wait a moment.", 429);
  // Orders come only from customers who have proved their email with a sign-in code.
  if (signInUnavailable()) return bad("Ordering isn't available yet: the shop's database isn't connected.", 503);
  const verified = await sessionEmail(req);
  if (!verified) return bad("Please sign in with your email to place your order.", 401);
  const b = await body<Payload>(req, 64_000);
  if (!b || !Array.isArray(b.items) || !b.items.length || b.items.length > 30) return bad("Your bag looks empty.");

  const c = b.customer ?? ({} as Customer);
  const customer: Customer = {
    first: str(c.first, 60),
    last: str(c.last, 60),
    email: verified,
    phone: str(c.phone, 20),
    address: str(c.address, 240),
    city: str(c.city, 60),
    pincode: str(c.pincode, 6),
  };
  if (!customer.first || !customer.last || !isEmail(customer.email) || !isPhone(customer.phone) || customer.address.length < 8 || !/^[1-9]\d{5}$/.test(customer.pincode)) {
    return bad("Please check your contact and delivery details.");
  }

  const delivery = new Date(str(b.deliveryDate, 40));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(delivery.getTime()) || delivery < today || delivery.getTime() - today.getTime() > 45 * 86400000) return bad("Please choose a delivery day.");

  // Price every line on the server.
  const [catalog, accessories] = await Promise.all([getCatalog(), getAccessories()]);
  const items: OrderItem[] = [];
  for (const raw of b.items) {
    const qty = Math.round(num(raw.qty));
    if (!(qty >= 1 && qty <= 10)) return bad("Please check the quantities in your bag.");
    const item: OrderItem = {
      key: str(raw.key, 80),
      kind: raw.kind,
      ref: str(raw.ref, 40),
      name: str(raw.name, 120),
      detail: str(raw.detail, 200),
      image: str(raw.image, 300),
      size: raw.size,
      price: Math.round(num(raw.price)),
      qty,
      gift: raw.kind === "giftcard" && raw.gift ? { to: str(raw.gift.to, 60), email: str(raw.gift.email, 120), from: str(raw.gift.from, 60), message: str(raw.gift.message, 400), design: str(raw.gift.design, 20) } : undefined,
    };
    const price = serverPrice(item, catalog, accessories);
    if (price === null) return bad(`We couldn't price "${item.name}". Please remove it and add it again.`);
    items.push({ ...item, price });
  }

  // Stock: sizes with a recorded quantity are limited; everything else is made to order.
  const stock = await getStock();
  const need = new Map<string, number>();
  for (const i of items) if (i.kind === "mattress" && i.size) need.set(stockKey(i.ref, i.size), (need.get(stockKey(i.ref, i.size)) ?? 0) + i.qty);
  // Ready stock ships first; anything beyond it is handcrafted to order (a longer lead time, never a refusal).
  const madeToOrder = [...need].some(([k, n]) => typeof stock[k] === "number" && (stock[k] as number) < n);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const { commerce } = await getSite();
  const removal = b.removal && !items.some((i) => i.ref === "removal") ? commerce.removalFee : 0;
  let discount = 0;
  let discountLabel: string | undefined;
  let promoCode: string | undefined;
  if (b.promoCode) {
    const promo = await checkPromo(str(b.promoCode, 30), subtotal, items.some((i) => i.kind === "mattress"));
    if (!promo.ok) return bad(promo.message);
    discount = promo.amount;
    discountLabel = promo.label;
    promoCode = promo.code;
    if (promo.kind === "giftcard") {
      const g = await get<{ balance: number }>("gift_cards", promo.code);
      await update("gift_cards", promo.code, { data: { balance: (g?.data.balance ?? 0) - promo.amount } });
    }
    if (promo.kind === "discount") {
      const d = await get<{ uses: number }>("discount_codes", promo.code);
      await update("discount_codes", promo.code, { data: { uses: (d?.data.uses ?? 0) + 1 } });
    }
  }

  // Issue gift cards bought in this order.
  const giftCodes: NonNullable<OrderData["giftCodes"]> = [];
  for (const i of items.filter((x) => x.kind === "giftcard")) {
    for (let n = 0; n < i.qty; n++) {
      const code = newGiftCode();
      await upsert("gift_cards", code, { amount: i.price, balance: i.price, ...i.gift }, { email: i.gift?.email || undefined, status: "active" });
      giftCodes.push({ code, amount: i.price, to: i.gift?.to ?? "" });
    }
  }

  for (const [k, n] of need) {
    const have = stock[k];
    if (typeof have === "number") await upsert("stock", k, { qty: Math.max(0, have - n) });
  }

  const data: OrderData = {
    number: newOrderNumber(),
    token: newToken(),
    items,
    subtotal,
    discount,
    discountLabel,
    promoCode,
    removal,
    delivery: 0, // white-glove delivery is free
    emailed: ["placed"],
    total: Math.max(0, subtotal + removal - discount),
    customer,
    deliveryDate: delivery.toISOString(),
    payment: str(b.payment, 20),
    months: Number.isInteger(b.months) ? b.months : undefined,
    note: str(b.note, 400),
    statusMode: "auto",
    giftCodes,
    madeToOrder,
  };
  const row = await insert("orders", data, { id: data.number, status: "placed", email: customer.email });

  // Keep the account's name and phone filled in for next time
  const profile = await loadProfile(verified);
  if (profile && (!profile.name || !profile.phone)) {
    await saveProfile({ ...profile, name: profile.name || `${customer.first} ${customer.last}`, phone: profile.phone || customer.phone }).catch(() => null);
  }
  await sendOrderEmail(row.id, row.created_at, data, "placed");

  const cartId = str(b.cartId, 60);
  if (cartId) await update("abandoned_carts", cartId, { status: "recovered", data: { orderId: row.id } }).catch(() => null);

  return json({ id: row.id, token: data.token, total: data.total, discount, giftCodes, createdAt: row.created_at, deliveryDate: data.deliveryDate });
}
