import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import type { LeadData } from "@shakshi/shared/records";
import { Badge, Empty, PageHead, ago } from "@/components/studio/ui";
import { ActionButton } from "@/components/studio/actions";

export const metadata = { title: "Messages" };

const KINDS: Record<LeadData["kind"], string> = { contact: "Contact form", hospitality: "Hospitality & trade", swatches: "Swatch request", newsletter: "Newsletter" };
const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ kind?: string; show?: string }> }) {
  const base = await requireStudio();
  const { kind = "", show = "new" } = await searchParams;
  const all = await list<LeadData>("leads", { limit: 2000 });
  const rows = all.filter((l) => (!kind || l.data.kind === kind) && (show === "all" || (l.status ?? "new") === show));
  const open = all.filter((l) => (l.status ?? "new") === "new").length;
  const href = (k: string, s: string) => `${base}/inquiries?${new URLSearchParams({ ...(k ? { kind: k } : {}), show: s })}`;

  return (
    <>
      <PageHead eyebrow="Customers" title="Messages" intro={`Messages from the contact form, newsletter sign-ups and swatch requests.${open ? ` ${open} waiting for a reply.` : ""}`} />
      <nav aria-label="Filter inquiries" className="mb-5 flex flex-wrap gap-2">
        {["", ...Object.keys(KINDS)].map((k) => (
          <Link key={k || "all"} href={href(k, show)} aria-current={kind === k ? "page" : undefined} className={`btn btn-sm ${kind === k ? "btn-dark" : "btn-line"}`}>
            {k ? KINDS[k as LeadData["kind"]] : "Everything"}
          </Link>
        ))}
        <span className="mx-1 w-px bg-ink/10" aria-hidden />
        {[
          ["new", "Waiting"],
          ["handled", "Handled"],
          ["all", "All"],
        ].map(([s, l]) => (
          <Link key={s} href={href(kind, s)} aria-current={show === s ? "page" : undefined} className={`btn btn-sm ${show === s ? "btn-dark" : "btn-line"}`}>
            {l}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((l) => (
            <li key={l.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="min-w-0 max-w-3xl">
                <p className="flex flex-wrap items-center gap-2 text-xs text-stone">
                  <Badge tone="gold">{KINDS[l.data.kind] ?? l.data.kind}</Badge> {ago(l.created_at)}
                  {l.email && (
                    <a href={`mailto:${l.email}`} className="text-gold-ink hover:underline">
                      {l.email}
                    </a>
                  )}
                </p>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                  {Object.entries(l.data.fields ?? {})
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-stone">{label(k)}</dt>
                        <dd className="whitespace-pre-line">{v}</dd>
                      </div>
                    ))}
                </dl>
              </div>
              {(l.status ?? "new") === "new" ? (
                <ActionButton url={`/api/admin/records/leads/${l.id}`} body={{ status: "handled" }} className="btn btn-dark btn-sm">
                  Mark as handled
                </ActionButton>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge tone="ok">Handled</Badge>
                  <ActionButton url={`/api/admin/records/leads/${l.id}`} body={{ status: "new" }}>
                    Reopen
                  </ActionButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="All caught up." />
      )}
    </>
  );
}
