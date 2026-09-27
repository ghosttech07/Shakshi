import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import { getSite } from "@/lib/server/content";
import { dayKey } from "@/lib/server/studio-data";
import type { BookingData } from "@shakshi/shared/records";
import { Badge, Empty, PageHead, TableWrap, when } from "@/components/studio/ui";
import { StatusSelect } from "@/components/studio/actions";

export const metadata = { title: "Bookings" };

const STATUS = [
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
const KIND = { salon: "Salon visit", home: "Home trial", video: "Video call" } as const;
const tone = (s: string | null) => (s === "confirmed" ? "ok" : s === "cancelled" ? "neutral" : s === "completed" ? "dark" : "warn");

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ month?: string; day?: string }> }) {
  const base = await requireStudio();
  const sp = await searchParams;
  const [rows, site] = await Promise.all([list<BookingData>("bookings", { limit: 2000 }), getSite("published")]);
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : dayKey(new Date()).slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  const byDay = new Map<string, typeof rows>();
  for (const b of rows) {
    const k = dayKey(b.data.start);
    byDay.set(k, [...(byDay.get(k) ?? []), b]);
  }
  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const today = dayKey(new Date());
  const selected = sp.day && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : null;
  const listRows = (selected ? byDay.get(selected) ?? [] : rows.filter((b) => dayKey(b.data.start) >= today)).sort((a, b) => a.data.start.localeCompare(b.data.start));
  const salon = (id?: string) => site.showrooms.find((s) => s.id === id)?.city ?? id ?? "";

  return (
    <>
      <PageHead eyebrow="People" title="Bookings" intro="Salon visits, home trials and video consultations. Confirm or cancel each request; the customer is contacted by your team." />

      <section className="card p-4 sm:p-6" aria-labelledby="cal-title">
        <div className="mb-4 flex items-center justify-between">
          <Link href={`${base}/bookings?month=${shift(-1)}`} className="btn btn-line btn-sm" aria-label="Previous month">
            ←
          </Link>
          <h2 id="cal-title" className="text-2xl">
            {first.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}
          </h2>
          <Link href={`${base}/bookings?month=${shift(1)}`} className="btn btn-line btn-sm" aria-label="Next month">
            →
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-[0.15em] text-stone">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) =>
            d ? (
              <Link
                key={d}
                href={`${base}/bookings?month=${month}&day=${d}`}
                aria-current={selected === d ? "date" : undefined}
                className={`min-h-16 rounded-md border p-1.5 text-left text-xs transition-colors sm:min-h-20 ${selected === d ? "border-gold bg-gold/10" : "border-ink/[0.07] hover:border-gold/60"} ${d === today ? "font-semibold" : ""}`}
              >
                <span className={d === today ? "rounded-full bg-midnight px-1.5 text-pearl" : ""}>{Number(d.slice(8))}</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {(byDay.get(d) ?? []).slice(0, 4).map((b) => (
                    <span key={b.id} title={`${KIND[b.data.kind]} · ${b.data.name}`} className={`h-1.5 w-1.5 rounded-full ${b.status === "cancelled" ? "bg-ink/20" : b.status === "confirmed" ? "bg-ok" : "bg-gold"}`} />
                  ))}
                </span>
                {(byDay.get(d)?.length ?? 0) > 0 && <span className="sr-only">{byDay.get(d)!.length} bookings</span>}
              </Link>
            ) : (
              <div key={`x${i}`} />
            )
          )}
        </div>
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-stone">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> Requested</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Confirmed</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ink/20" /> Cancelled</span>
        </p>
      </section>

      <h2 className="mb-3 mt-8 text-2xl">{selected ? when(`${selected}T12:00:00+05:30`, false) : "Upcoming"}</h2>
      {listRows.length ? (
        <TableWrap>
          <table className="table min-w-[820px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Guest</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {listRows.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap">{when(b.data.start)}</td>
                  <td>
                    {KIND[b.data.kind]}
                    <span className="block text-xs text-stone">{b.data.minutes} min</span>
                  </td>
                  <td>
                    {b.data.name}
                    <span className="block text-xs text-stone">
                      <a href={`tel:${b.data.phone}`}>{b.data.phone}</a>
                      {b.data.email && <> · <a href={`mailto:${b.data.email}`}>{b.data.email}</a></>}
                    </span>
                  </td>
                  <td className="max-w-xs text-stone">
                    {b.data.kind === "salon" && `${salon(b.data.salon)} salon`}
                    {b.data.kind === "home" && b.data.address}
                    {b.data.kind === "video" && b.data.meetingUrl && (
                      <a href={b.data.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-gold-ink underline">
                        Join call
                      </a>
                    )}
                    {b.data.topic && <span className="block text-xs">“{b.data.topic}”</span>}
                  </td>
                  <td>
                    <span className="sr-only">
                      <Badge tone={tone(b.status)}>{b.status}</Badge>
                    </span>
                    <StatusSelect url={`/api/admin/records/bookings/${b.id}`} value={b.status ?? "requested"} options={STATUS} label={`Status of ${b.data.name}'s booking`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <Empty title={selected ? "No bookings that day." : "No upcoming bookings."} />
      )}
    </>
  );
}
