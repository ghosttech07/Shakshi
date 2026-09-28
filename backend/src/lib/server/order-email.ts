import { STAGES, currentStage, type OrderData, type StageId } from "@shakshi/shared/orders";
import { formatINR } from "@shakshi/shared/utils";
import { getSite } from "./content";
import { list, update } from "./db";
import { sendEmail } from "./email";

/**
 * The emails a customer receives about an order: a confirmation when it's placed and a note at
 * every later stage. Each one carries the full invoice (items, prices, charges and total).
 */
const GST = 0.18; // prices include GST
const SUBJECT: Record<StageId, (n: string) => string> = {
  placed: (n) => `Order confirmed · ${n}`,
  crafting: (n) => `Your mattress is being handcrafted · ${n}`,
  dispatched: (n) => `Your order is on its way · ${n}`,
  out_for_delivery: (n) => `Arriving today · ${n}`,
  delivered: (n) => `Delivered. Sleep well · ${n}`,
};
const HEADLINE: Record<StageId, string> = {
  placed: "Thank you. Your order is confirmed.",
  crafting: "Your order is being handcrafted.",
  dispatched: "Your order is on its way.",
  out_for_delivery: "Your order arrives today.",
  delivered: "Your order has been delivered.",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const day = (iso: string) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const shopUrl = () => (process.env.FRONTEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

/** The money lines of the invoice, in order. Exported so the email and tests agree. */
export function invoiceLines(o: OrderData) {
  const taxableGross = o.items.filter((i) => i.kind !== "giftcard").reduce((s, i) => s + i.price * i.qty, 0);
  const gst = Math.round(taxableGross - taxableGross / (1 + GST));
  const lines: [string, string][] = [["Subtotal", formatINR(o.subtotal)]];
  if (o.discount) lines.push([o.discountLabel ? `Discount (${o.discountLabel})` : "Discount", `− ${formatINR(o.discount)}`]);
  if (o.removal) lines.push(["Old mattress removal", formatINR(o.removal)]);
  lines.push(["Delivery", o.delivery ? formatINR(o.delivery) : "Free (white-glove)"]);
  return { lines, total: formatINR(o.total), gst: formatINR(gst) };
}

export async function orderEmail(id: string, createdAt: string, o: OrderData, stage: StageId) {
  const { brand, contact } = await getSite();
  const s = STAGES.find((x) => x.id === stage)!;
  const c = o.customer;
  const { lines, total, gst } = invoiceLines(o);
  const orderLink = `${shopUrl()}/account#orders`;
  const invoiceLink = `${shopUrl()}/account/invoice/${encodeURIComponent(id)}`;

  const rows = o.items
    .map(
      (i) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee6d8;vertical-align:top">
          <div style="font-weight:600;color:#1c2230">${esc(i.name)}</div>
          ${i.detail ? `<div style="font-size:13px;color:#6b6f7b;margin-top:2px">${esc(i.detail)}</div>` : ""}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee6d8;text-align:center;vertical-align:top;color:#1c2230">${i.qty}</td>
        <td style="padding:12px 0 12px 8px;border-bottom:1px solid #eee6d8;text-align:right;vertical-align:top;color:#1c2230;white-space:nowrap">${formatINR(i.price)}</td>
        <td style="padding:12px 0 12px 8px;border-bottom:1px solid #eee6d8;text-align:right;vertical-align:top;color:#1c2230;white-space:nowrap">${formatINR(i.price * i.qty)}</td>
      </tr>`
    )
    .join("");
  const money = lines
    .map(([k, v]) => `<tr><td style="padding:5px 0;color:#6b6f7b">${esc(k)}</td><td style="padding:5px 0;text-align:right;color:#1c2230;white-space:nowrap">${esc(v)}</td></tr>`)
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f5f0e8;font-family:Helvetica,Arial,sans-serif;color:#1c2230">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:24px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff">
      <tr><td style="padding:28px 32px;border-bottom:1px solid #eee6d8">
        <div style="font-size:26px;font-weight:800;letter-spacing:1px;color:#eb0202">${esc(brand.name.toUpperCase())}</div>
        <div style="font-size:12px;color:#8a7650;letter-spacing:2px;text-transform:uppercase;margin-top:4px">${esc(brand.tagline)}</div>
      </td></tr>
      <tr><td style="padding:28px 32px 8px">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a8844a">${esc(s.label)}</div>
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;line-height:1.25;margin:8px 0 12px">${esc(HEADLINE[stage])}</h1>
        <p style="margin:0 0 6px;font-size:15px;line-height:1.6">Hello ${esc(c.first)}, ${esc(s.note.charAt(0).toLowerCase() + s.note.slice(1))}</p>
        <p style="margin:0;font-size:14px;color:#6b6f7b">Order <b style="color:#1c2230">${esc(id)}</b> · placed ${esc(day(createdAt))}<br>Delivery: <b style="color:#1c2230">${esc(day(o.deliveryDate))}</b></p>
      </td></tr>
      <tr><td style="padding:20px 32px 0">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b6f7b;margin-bottom:4px">Invoice</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr>
            <th align="left" style="padding:8px 0;border-bottom:2px solid #1c2230;font-size:12px;color:#6b6f7b;font-weight:600">Item</th>
            <th style="padding:8px;border-bottom:2px solid #1c2230;font-size:12px;color:#6b6f7b;font-weight:600">Qty</th>
            <th align="right" style="padding:8px 0 8px 8px;border-bottom:2px solid #1c2230;font-size:12px;color:#6b6f7b;font-weight:600">Price</th>
            <th align="right" style="padding:8px 0 8px 8px;border-bottom:2px solid #1c2230;font-size:12px;color:#6b6f7b;font-weight:600">Amount</th>
          </tr>
          ${rows}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:10px">
          ${money}
          <tr><td style="padding:10px 0 4px;border-top:2px solid #1c2230;font-weight:700;font-size:16px">Order total</td><td style="padding:10px 0 4px;border-top:2px solid #1c2230;text-align:right;font-weight:700;font-size:16px;white-space:nowrap">${esc(total)}</td></tr>
          <tr><td colspan="2" style="padding:0 0 4px;font-size:12px;color:#6b6f7b">Includes GST of ${esc(gst)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:22px 32px 0">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b6f7b;margin-bottom:6px">Delivering to</div>
        <div style="font-size:14px;line-height:1.55">${esc(`${c.first} ${c.last}`)}<br>${esc(c.address)}<br>${esc(c.city)} ${esc(c.pincode)}<br>${esc(c.phone)}</div>
      </td></tr>
      <tr><td style="padding:26px 32px">
        <a href="${orderLink}" style="display:inline-block;background:#0e1420;color:#f5f0e8;text-decoration:none;padding:13px 22px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase">Track your order</a>
        <a href="${invoiceLink}" style="display:inline-block;margin-left:10px;color:#1c2230;font-size:13px;padding:13px 0">Download invoice</a>
      </td></tr>
      <tr><td style="padding:18px 32px 26px;border-top:1px solid #eee6d8;font-size:12px;color:#6b6f7b;line-height:1.6">
        Questions? Reply to this email, call ${esc(contact.phone)} or write to ${esc(contact.email)}.<br>${esc(contact.address)}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;

  const text = [
    HEADLINE[stage],
    `Hello ${c.first}, ${s.note}`,
    `Order ${id}, placed ${day(createdAt)}. Delivery: ${day(o.deliveryDate)}.`,
    "",
    "INVOICE",
    ...o.items.map((i) => `${i.name}${i.detail ? ` (${i.detail})` : ""} × ${i.qty}: ${formatINR(i.price * i.qty)}`),
    ...lines.map(([k, v]) => `${k}: ${v}`),
    `Order total: ${total} (includes GST of ${gst})`,
    "",
    `Delivering to: ${c.first} ${c.last}, ${c.address}, ${c.city} ${c.pincode}`,
    `Track your order: ${orderLink}`,
    `Invoice: ${invoiceLink}`,
    "",
    `Questions? Call ${contact.phone} or write to ${contact.email}.`,
  ].join("\n");

  return { to: c.email, subject: SUBJECT[stage](id), html, text };
}

/** Sends the email for a stage. Never throws: an email problem must not undo an order or a status change. */
export async function sendOrderEmail(id: string, createdAt: string, o: OrderData, stage: StageId) {
  try {
    return await sendEmail(await orderEmail(id, createdAt, o, stage));
  } catch (e) {
    console.error(`[email] order ${id} (${stage}): ${(e as Error).message}`);
    return { ok: false, error: (e as Error).message };
  }
}

type OrderRow = { id: string; created_at: string; status: string | null; data: OrderData };

/**
 * Emails the customer if their order has reached a stage they haven't heard about yet, and records
 * it so each stage is emailed once. Orders from before emails existed are marked silently.
 */
export async function emailIfNewStage(row: OrderRow, now = new Date()): Promise<boolean> {
  if (row.data.sample) return false;
  const stage = currentStage(row, now);
  if (!row.data.emailed) {
    await update("orders", row.id, { data: { emailed: STAGES.slice(0, STAGES.findIndex((s) => s.id === stage) + 1).map((s) => s.id) } });
    return false;
  }
  if (row.data.emailed.includes(stage)) return false;
  await update("orders", row.id, { data: { emailed: [...row.data.emailed, stage] } });
  await sendOrderEmail(row.id, row.created_at, row.data, stage);
  return true;
}

/** Catches up every recent order (orders on the automatic calendar move stage by date alone). */
export async function catchUpOrderEmails() {
  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const rows = await list<OrderData>("orders", { since, limit: 1000 });
  let sent = 0;
  for (const r of rows) if (await emailIfNewStage(r).catch(() => false)) sent++;
  return { checked: rows.length, sent };
}
