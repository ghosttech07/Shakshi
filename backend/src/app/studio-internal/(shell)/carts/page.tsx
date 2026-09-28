import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import type { CartSnapshot } from "@shakshi/shared/records";
import { Badge, Empty, PageHead, ago, inr } from "@/components/studio/ui";
import { StatusSelect } from "@/components/studio/actions";

export const metadata = { title: "Unfinished checkouts" };

const STATUS = [
  { value: "open", label: "Not contacted" },
  { value: "contacted", label: "Contacted" },
  { value: "recovered", label: "Recovered" },
  { value: "closed", label: "Closed" },
];

/** Friendly recovery messages; the team reviews and sends them from their own email or WhatsApp. */
const templates = (c: CartSnapshot, storefront: string) => {
  const first = (c.name ?? "").split(" ")[0] || "there";
  const items = c.items.map((i) => i.name).join(", ");
  const email = `Hello ${first},\n\nYou left ${items} waiting in your Shakshi bag. It's still there for you, with complimentary white-glove delivery.\n\nIf you had a question about firmness, sizes or delivery, just reply to this email, or book a free 15-minute video call with a sleep specialist: ${storefront}/showroom?kind=video#book\n\nWarmly,\nThe Shakshi atelier`;
  const wa = `Hello ${first}, this is the Shakshi atelier. Your ${items} is still waiting in your bag. Could we help with anything, sizes, firmness or delivery? You can finish here: ${storefront}/checkout`;
  return { email, wa };
};

export default async function CartsPage() {
  await requireStudio();
  const storefront = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const rows = (await list<CartSnapshot & { email?: string }>("abandoned_carts", { limit: 500 })).filter((r) => r.data.items?.length);

  return (
    <>
      <PageHead eyebrow="Sales" title="Unfinished checkouts" intro="People who started checking out but didn't finish. Tap Email or WhatsApp to send a friendly ready-written message; nothing is sent automatically." />
      {rows.length ? (
        <ul className="space-y-4">
          {rows.map((r) => {
            const t = templates(r.data, storefront);
            const phone = (r.data.phone ?? "").replace(/[^\d]/g, "");
            const waNumber = phone.length === 10 ? `91${phone}` : phone;
            return (
              <li key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {r.data.name || "Guest"} <span className="font-normal text-stone">· {ago(r.data.updatedAt ?? r.created_at)} · reached step {r.data.step}</span>
                    </p>
                    <p className="text-sm text-stone">
                      {r.email ?? "no email"} {r.data.phone && `· ${r.data.phone}`}
                    </p>
                    <p className="mt-2 text-sm">
                      {r.data.items.map((i) => `${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}`).join(", ")} · <strong>{inr(r.data.total)}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "recovered" && <Badge tone="ok">Recovered</Badge>}
                    <StatusSelect url={`/api/admin/records/abandoned_carts/${r.id}`} value={r.status ?? "open"} options={STATUS} label="Cart follow-up" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.email && (
                    <a className="btn btn-line btn-sm" href={`mailto:${r.email}?subject=${encodeURIComponent("Your Shakshi bag is waiting")}&body=${encodeURIComponent(t.email)}`}>
                      Email template
                    </a>
                  )}
                  {waNumber && (
                    <a className="btn btn-line btn-sm" href={`https://wa.me/${waNumber}?text=${encodeURIComponent(t.wa)}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp template
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty title="No abandoned carts.">When someone begins checkout and leaves, their bag appears here.</Empty>
      )}
    </>
  );
}
