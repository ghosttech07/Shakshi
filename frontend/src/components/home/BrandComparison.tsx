import { Reveal } from "@/components/ui/Reveal";
import { IconCheck, IconMinus } from "@/components/ui/Icons";

type Cell = true | false | string;
const ROWS: { label: string; shakshi: Cell; store: Cell; online: Cell }[] = [
  { label: "Handcrafted to order", shakshi: true, store: false, online: false },
  { label: "Try it at home", shakshi: "100 nights", store: false, online: "Often 30–100 nights" },
  { label: "Feel it before buying", shakshi: "Salons, home trials & video calls", store: true, online: false },
  { label: "Delivery", shakshi: "White-glove, set up in your room", store: "Kerbside, often charged", online: "Rolled in a box" },
  { label: "Natural materials", shakshi: "Wool, organic cotton, natural latex", store: "Varies", online: "Mostly synthetic foams" },
  { label: "Warranty", shakshi: "10 years", store: "1–5 years", online: "Varies" },
  { label: "Old mattress taken away", shakshi: true, store: "Sometimes", online: false },
  { label: "Clear, fixed pricing", shakshi: true, store: "Negotiated", online: true },
];

function Value({ v, strong }: { v: Cell; strong?: boolean }) {
  if (v === true) return <IconCheck size={18} className={strong ? "text-gold-ink" : "text-stone"} aria-label="Yes" />;
  if (v === false) return <IconMinus size={18} className="text-ink/25" aria-label="No" />;
  return <span className={strong ? "text-ink" : "text-stone"}>{v}</span>;
}

/** An honest side-by-side: Shakshi vs a typical showroom mattress vs a typical mattress-in-a-box. */
export function BrandComparison() {
  return (
    <section className="container-lux py-24 lg:py-32" aria-labelledby="compare-title">
      <Reveal>
        <p className="eyebrow text-gold-ink">The difference</p>
        <h2 id="compare-title" className="display mt-4 max-w-2xl text-4xl sm:text-5xl lg:text-6xl">
          Not all mattresses are <em>made alike.</em>
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="mt-12 overflow-x-auto" data-lenis-prevent>
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <caption className="sr-only">Shakshi compared with a typical store mattress and a typical online mattress</caption>
            <thead>
              <tr>
                <th scope="col" className="w-[28%] pb-6" />
                <th scope="col" className="bg-midnight px-5 py-5 text-pearl">
                  <span className="font-serif text-2xl font-normal">Shakshi</span>
                </th>
                <th scope="col" className="px-5 pb-6 align-bottom font-normal text-stone">Typical store mattress</th>
                <th scope="col" className="px-5 pb-6 align-bottom font-normal text-stone">Typical online mattress</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.label} className="border-t border-ink/10">
                  <th scope="row" className="py-4 pr-4 font-normal">
                    {r.label}
                  </th>
                  <td className={`bg-midnight/[0.04] px-5 py-4 ${i === ROWS.length - 1 ? "pb-6" : ""}`}>
                    <Value v={r.shakshi} strong />
                  </td>
                  <td className="px-5 py-4">
                    <Value v={r.store} />
                  </td>
                  <td className="px-5 py-4">
                    <Value v={r.online} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}
