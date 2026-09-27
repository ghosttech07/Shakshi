"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SIZES, priceFor, type Product } from "@shakshi/shared/products";
import type { Field } from "@shakshi/shared/cms/types";
import { FieldEditor, type EditorContext } from "./FieldEditor";
import { api } from "./actions";

const MATERIALS = [
  ["memory-foam", "Memory foam"],
  ["latex", "Natural latex"],
  ["pocket-springs", "Pocket springs"],
  ["cooling-gel", "Cooling gel"],
  ["wool", "Wool"],
] as const;
const POSITIONS = [
  ["side", "Side"],
  ["back", "Back"],
  ["stomach", "Front"],
  ["combination", "Combination"],
] as const;

const t = (key: string, label: string, help?: string): Field => ({ key, label, type: "text", help });
const n = (key: string, label: string, min?: number, max?: number, help?: string): Field => ({ key, label, type: "number", min, max, help });
const DETAILS: Field[] = [
  t("name", "Name"),
  t("tier", "Tier (e.g. Plush, Balanced, Firm)"),
  t("tagline", "Tagline"),
  t("feeling", "One-word feeling"),
  { key: "description", label: "Description", type: "textarea" },
  t("badge", "Badge (optional, e.g. Most Loved)"),
  { key: "images", label: "Images (first is the main photo)", type: "list", itemLabel: "url", of: [{ key: "url", label: "Image", type: "image" }] },
  { key: "highlights", label: "Highlights", type: "list", itemLabel: "text", of: [t("text", "Highlight")] },
];
const FEEL: Field[] = [
  n("firmness", "Firmness (1 plush – 10 firm)", 1, 10),
  t("firmnessLabel", "Firmness label"),
  n("height", "Height (cm)"),
  n("cooling", "Cooling (1–5)", 1, 5),
  n("motionIsolation", "Motion isolation (1–5)", 1, 5),
  n("edgeSupport", "Edge support (1–5)", 1, 5),
  n("sink", "Sink depth under a palm press (cm)", 0, 20, "Used by the firmness simulator"),
  n("recovery", "Recovery time (seconds)", 0, 10),
  { key: "layers", label: "Layers (top to bottom)", type: "list", itemLabel: "name", of: [t("name", "Layer"), t("material", "Material"), t("benefit", "Benefit"), n("depth", "Depth (cm)")] },
];

export function ProductEditor({ product, stock, ctx, base, frontend, builtIn, categories }: { product: Product; stock: Record<string, number | null>; ctx: EditorContext; base: string; frontend: string; builtIn: boolean; categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const toForm = (p: Product) => ({ ...p, images: p.images.map((url) => ({ url })), highlights: p.highlights.map((text) => ({ text })) });
  const [form, setForm] = useState<Record<string, unknown>>(toForm(product));
  const [prices, setPrices] = useState<Record<string, string>>(Object.fromEntries(SIZES.map((s) => [s.id, product.prices?.[s.id] ? String(product.prices[s.id]) : ""])));
  const [qty, setQty] = useState<Record<string, string>>(Object.fromEntries(SIZES.map((s) => [s.id, typeof stock[s.id] === "number" ? String(stock[s.id]) : ""])));
  const [initial] = useState(() => JSON.stringify([toForm(product), prices, qty]));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify([form, prices, qty]) !== initial && !msg?.ok;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const list = (k: "materials" | "positions") => (Array.isArray(form[k]) ? (form[k] as string[]) : []);
  const toggle = (k: "materials" | "positions", v: string, on: boolean) => setForm((f) => ({ ...f, [k]: on ? [...list(k), v] : list(k).filter((x) => x !== v) }));
  const base$ = Number(form.basePrice) || 0;

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const productBody = { ...form, images: (form.images as { url: string }[]).map((i) => i.url), highlights: (form.highlights as { text: string }[]).map((h) => h.text) };
      await api("PUT", `/api/admin/products/${encodeURIComponent(product.slug)}`, { product: productBody, prices, stock: qty });
      setMsg({ ok: true, text: "Saved. The shop updates within a few seconds." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 lg:-mx-10 lg:px-10">
        <label className="mr-auto flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#7d6232]" checked={form.published !== false} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
          Visible in the shop
        </label>
        {msg && (
          <span role="status" className={`text-sm ${msg.ok ? "text-ok" : "text-bad"}`}>
            {msg.text}
          </span>
        )}
        {!msg && dirty && <span className="text-xs text-stone">Unsaved changes</span>}
        <a href={`${frontend}/mattress/${product.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">
          View ↗
        </a>
        <button className="btn btn-gold btn-sm" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-2xl">Details</h2>
          <FieldEditor fields={DETAILS} value={form} onChange={setForm} ctx={ctx} />
        </section>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-2xl">Price & stock by size</h2>
            <p className="mb-4 text-xs text-stone">Leave a price blank to derive it from the Queen price. Leave stock blank for made to order (no limit).</p>
            <label className="label" htmlFor="basePrice">
              Queen price (₹)
            </label>
            <input id="basePrice" type="number" min={0} className="field mb-4 max-w-48" value={base$ || ""} onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))} />
            <table className="table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Price ₹</th>
                  <th>In stock</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.label}
                      <span className="block text-[0.68rem] text-stone">{s.dims}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        aria-label={`${s.label} price`}
                        className="field w-28"
                        value={prices[s.id]}
                        placeholder={String(priceFor({ basePrice: base$, prices: {} }, s.id))}
                        onChange={(e) => setPrices((p) => ({ ...p, [s.id]: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input type="number" min={0} aria-label={`${s.label} units in stock`} className="field w-24" value={qty[s.id]} placeholder="To order" onChange={(e) => setQty((q) => ({ ...q, [s.id]: e.target.value }))} />
                      {qty[s.id] !== "" && Number(qty[s.id]) <= 3 && <span className="mt-1 block text-[0.68rem] text-warn">{Number(qty[s.id]) === 0 ? "Out of stock" : "Low"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-2xl">Category</h2>
            <p className="mb-3 text-xs text-stone">Where it appears in the Products menu. Manage categories in Site &amp; theme.</p>
            <select aria-label="Category" className="field" value={String(form.category ?? "")} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">No category (shown under All products only)</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 text-2xl">Materials & sleepers</h2>
            <fieldset>
              <legend className="label">Materials</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {MATERIALS.map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-[#7d6232]" checked={list("materials").includes(v)} onChange={(e) => toggle("materials", v, e.target.checked)} /> {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4">
              <legend className="label">Best for</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {POSITIONS.map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-[#7d6232]" checked={list("positions").includes(v)} onChange={(e) => toggle("positions", v, e.target.checked)} /> {l} sleepers
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-2xl">Feel</h2>
            <FieldEditor fields={FEEL} value={form} onChange={setForm} ctx={ctx} />
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-xl">{builtIn ? "Remove from the collection" : "Delete this mattress"}</h2>
            <p className="mt-1 text-sm text-stone">{builtIn ? "It disappears from the shop. Past orders are unaffected." : "This can't be undone. Past orders are unaffected."}</p>
            <button
              className="btn btn-danger mt-3"
              onClick={async () => {
                if (!confirm(`Remove ${product.name} from the shop?`)) return;
                await api("DELETE", `/api/admin/products/${encodeURIComponent(product.slug)}`);
                router.push(`${base}/products`);
                router.refresh();
              }}
            >
              {builtIn ? "Remove" : "Delete"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
