import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import { getCatalog } from "@/lib/server/catalog";
import type { ReviewData } from "@shakshi/shared/records";
import { Badge, Empty, PageHead, ago } from "@/components/studio/ui";
import { ActionButton, StatusSelect } from "@/components/studio/actions";
import { ReplyForm } from "@/components/studio/ReplyForm";

export const metadata = { title: "Reviews" };

const STATUS = [
  { value: "pending", label: "Awaiting approval" },
  { value: "approved", label: "Approved (public)" },
  { value: "hidden", label: "Hidden" },
];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const base = await requireStudio();
  const { status = "pending" } = await searchParams;
  const [all, catalog] = await Promise.all([list<ReviewData>("reviews", { limit: 1000 }), getCatalog({ includeUnpublished: true })]);
  const rows = status === "all" ? all : all.filter((r) => (r.status ?? "pending") === status);
  const counts = Object.fromEntries(STATUS.map((s) => [s.value, all.filter((r) => (r.status ?? "pending") === s.value).length]));

  return (
    <>
      <PageHead eyebrow="Customers" title="Reviews" intro="New reviews wait here until you approve them. Approved reviews appear on the home page and the mattress page." />
      <nav aria-label="Filter reviews" className="mb-5 flex flex-wrap gap-2">
        {[...STATUS, { value: "all", label: "All" }].map((s) => (
          <Link key={s.value} href={`${base}/reviews?status=${s.value}`} aria-current={status === s.value ? "page" : undefined} className={`btn btn-sm ${status === s.value ? "btn-dark" : "btn-line"}`}>
            {s.label.replace(" (public)", "")} {s.value !== "all" && <span className="opacity-60">{counts[s.value]}</span>}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 max-w-3xl">
                  <p className="text-xs text-stone">
                    {catalog.find((p) => p.slug === r.data.product)?.name ?? r.data.product} · {r.data.name} · {ago(r.created_at)} · {r.data.position} sleeper
                  </p>
                  <p className="mt-1 text-gold-ink" aria-label={`${r.data.rating} out of 5 stars`}>
                    {"★".repeat(r.data.rating)}
                    <span className="text-ink/20">{"★".repeat(5 - r.data.rating)}</span>
                  </p>
                  <p className="mt-1 text-base font-semibold">{r.data.title}</p>
                  <p className="mt-1 whitespace-pre-line text-ink/80">{r.data.body}</p>
                  {r.data.reply && <p className="mt-3 border-l-2 border-gold pl-3 text-sm text-stone">Your reply: {r.data.reply}</p>}
                </div>
                <Badge tone={r.status === "approved" ? "ok" : r.status === "hidden" ? "neutral" : "warn"}>{STATUS.find((s) => s.value === (r.status ?? "pending"))?.label}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-2">
                <StatusSelect url={`/api/admin/records/reviews/${r.id}`} value={r.status ?? "pending"} options={STATUS} label={`Status of review by ${r.data.name}`} />
                <ReplyForm id={r.id} reply={r.data.reply} />
                <ActionButton url={`/api/admin/records/reviews/${r.id}`} method="DELETE" confirm="Delete this review permanently?" className="btn btn-danger btn-sm">
                  Delete
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="Nothing here.">{status === "pending" ? "No reviews are waiting for approval." : "No reviews in this list yet."}</Empty>
      )}
    </>
  );
}
