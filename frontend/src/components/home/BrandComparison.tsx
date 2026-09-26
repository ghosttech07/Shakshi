import { Reveal } from "@/components/ui/Reveal";
import { IconCheck, IconMinus } from "@/components/ui/Icons";
import { SECTIONS } from "@shakshi/shared/cms/sections";
import { Emph, fieldFn } from "@/components/cms/text";

type Row = { label: string; ours: string; a: string; b: string };
type Data = { eyebrow?: string; title?: string; brandLabel?: string; colA?: string; colB?: string; rows?: Row[] };
const DEFAULTS = SECTIONS.comparison.defaults as Data;
type Cell = boolean | string;
/** "yes" / "no" become a tick and a dash. */
const cell = (v: string): Cell => (/^(yes|true|✓)$/i.test(v.trim()) ? true : /^(no|false|-|–)$/i.test(v.trim()) ? false : v);

function Value({ v, strong }: { v: Cell; strong?: boolean }) {
  if (v === true) return <IconCheck size={18} className={strong ? "text-gold-ink" : "text-stone"} aria-label="Yes" />;
  if (v === false) return <IconMinus size={18} className="text-ink/25" aria-label="No" />;
  return <span className={strong ? "text-ink" : "text-stone"}>{v}</span>;
}

/** An honest side-by-side: Shakshi vs a typical showroom mattress vs a typical mattress-in-a-box. */
export function BrandComparison({ data = {}, edit }: { data?: Data; edit?: boolean }) {
  const f = fieldFn(edit);
  const d = { ...DEFAULTS, ...data };
  const ROWS = d.rows ?? [];
  return (
    <section className="container-lux py-24 lg:py-32" aria-labelledby="compare-title">
      <Reveal>
        {d.eyebrow && <p className="eyebrow mb-4 text-gold-ink" {...f("eyebrow")}>{d.eyebrow}</p>}
        <h2 id="compare-title" className="display max-w-2xl text-4xl sm:text-5xl lg:text-6xl" {...f("title")}>
          <Emph text={d.title ?? ""} />
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="mt-12 overflow-x-auto" data-lenis-prevent>
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <caption className="sr-only">{`${d.brandLabel} compared with ${d.colA?.toLowerCase()} and ${d.colB?.toLowerCase()}`}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-[28%] pb-6" />
                <th scope="col" className="bg-midnight px-5 py-5 text-pearl">
                  <span className="font-serif text-2xl font-normal" {...f("brandLabel")}>{d.brandLabel}</span>
                </th>
                <th scope="col" className="px-5 pb-6 align-bottom font-normal text-stone" {...f("colA")}>{d.colA}</th>
                <th scope="col" className="px-5 pb-6 align-bottom font-normal text-stone" {...f("colB")}>{d.colB}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i} className="border-t border-ink/10" {...f(`rows.${i}.label`)}>
                  <th scope="row" className="py-4 pr-4 font-normal">
                    {r.label}
                  </th>
                  <td className={`bg-midnight/[0.04] px-5 py-4 ${i === ROWS.length - 1 ? "pb-6" : ""}`}>
                    <Value v={cell(r.ours)} strong />
                  </td>
                  <td className="px-5 py-4">
                    <Value v={cell(r.a)} />
                  </td>
                  <td className="px-5 py-4">
                    <Value v={cell(r.b)} />
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
