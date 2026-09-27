"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Field } from "@shakshi/shared/cms/types";
import { RichText } from "./RichText";
import { MediaPicker, type Media } from "./MediaLibrary";

type Value = Record<string, unknown>;
export type EditorContext = { products: { slug: string; name: string }[]; links: string[] };

/** Keys may be dotted ("toggles.nightMode") to reach into nested settings. */
const getAt = (v: Value, key: string): unknown => key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Value)[k] : undefined), v);
const setAt = (v: Value, key: string, next: unknown): Value => {
  const [head, ...rest] = key.split(".");
  if (!rest.length) return { ...v, [head]: next };
  const inner = v[head] && typeof v[head] === "object" ? (v[head] as Value) : {};
  return { ...v, [head]: setAt(inner, rest.join("."), next) };
};

const blankFor = (fields: Field[]): Value => Object.fromEntries(fields.map((f) => [f.key, f.type === "list" || f.type === "products" ? [] : f.type === "toggle" ? false : f.type === "number" ? 0 : ""]));

/**
 * Renders editable inputs for a field schema (sections, site settings, products…).
 * `focus` is a dotted path ("items.2.title") clicked in the live preview: its input is revealed and focused.
 */
export function FieldEditor({ fields, value, onChange, ctx, focus, path = "" }: { fields: Field[]; value: Value; onChange: (v: Value) => void; ctx: EditorContext; focus?: string; path?: string }) {
  const set = (key: string, v: unknown) => onChange(setAt(value, key, v));
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={getAt(value, f.key)} set={(v) => set(f.key, v)} setSibling={set} siblings={value} fields={fields} ctx={ctx} focus={focus} path={path ? `${path}.${f.key}` : f.key} />
      ))}
    </div>
  );
}

function FieldInput({
  field: f,
  value,
  set,
  setSibling,
  siblings,
  fields,
  ctx,
  focus,
  path,
}: {
  field: Field;
  value: unknown;
  set: (v: unknown) => void;
  setSibling: (k: string, v: unknown) => void;
  siblings: Value;
  fields: Field[];
  ctx: EditorContext;
  focus?: string;
  path: string;
}) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const [picking, setPicking] = useState(false);
  const focused = focus === path;

  useEffect(() => {
    if (!focused || !wrap.current) return;
    wrap.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const el = wrap.current.querySelector<HTMLElement>("input,textarea,select,[contenteditable=true]");
    el?.focus({ preventScroll: true });
  }, [focused]);

  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  const label = (
    <label htmlFor={id} className="label">
      {f.label}
    </label>
  );
  const help = f.help && <p className="mt-1 text-xs text-stone">{f.help}</p>;
  const ring = focused ? "rounded-md ring-2 ring-gold/60 ring-offset-4 ring-offset-paper" : "";

  let input: React.ReactNode;
  switch (f.type) {
    case "textarea":
      input = <textarea id={id} className="field" value={str} onChange={(e) => set(e.target.value)} rows={Math.min(8, Math.max(3, str.split("\n").length + 1))} />;
      break;
    case "richtext":
      input = <RichText id={id} label={f.label} value={str} onChange={set} />;
      break;
    case "number":
      input = <input id={id} type="number" className="field max-w-40" value={Number.isFinite(value as number) ? (value as number) : ""} min={f.min} max={f.max} step="any" onChange={(e) => set(e.target.value === "" ? 0 : Number(e.target.value))} />;
      break;
    case "toggle":
      input = (
        <label className="flex items-center gap-2 text-sm">
          <input id={id} type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} className="h-4 w-4 accent-[#7d6232]" /> {f.help ?? "On"}
        </label>
      );
      break;
    case "select":
      input = (
        <select id={id} className="field" value={str} onChange={(e) => set(e.target.value)}>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "color":
      input = (
        <div className="flex items-center gap-2">
          <input type="color" aria-label={`${f.label} picker`} value={/^#[0-9a-f]{6}$/i.test(str) ? str : "#000000"} onChange={(e) => set(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-ink/15 bg-white p-0.5" />
          <input id={id} className="field max-w-36 font-mono" value={str} onChange={(e) => set(e.target.value)} />
        </div>
      );
      break;
    case "date":
      input = <input id={id} type="date" className="field max-w-52" value={str.slice(0, 10)} onChange={(e) => set(e.target.value)} />;
      break;
    case "link":
      input = (
        <>
          <input id={id} className="field" value={str} onChange={(e) => set(e.target.value)} list={`${id}-links`} placeholder="/shop or https://…" />
          <datalist id={`${id}-links`}>
            {ctx.links.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </>
      );
      break;
    case "image":
    case "video":
    case "file": {
      const kind = f.type === "image" ? "image" : f.type === "video" ? "video" : undefined;
      input = (
        <div className="flex flex-wrap items-start gap-3">
          {str && f.type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={str.includes("unsplash.com") && !str.includes("?") ? `${str}?w=240&q=60` : str} alt="" className="h-20 w-28 rounded border border-ink/10 object-cover" />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <input id={id} className="field font-mono text-xs" value={str} onChange={(e) => set(e.target.value)} placeholder="Choose from the library, or paste an address" />
            <div className="flex gap-2">
              <button type="button" className="btn btn-line btn-sm" onClick={() => setPicking(true)}>
                {str ? "Replace" : "Choose"}
              </button>
              {str && (
                <button type="button" className="btn btn-line btn-sm" onClick={() => set("")}>
                  Remove
                </button>
              )}
            </div>
          </div>
          {picking && (
            <MediaPicker
              kind={kind}
              onClose={() => setPicking(false)}
              onPick={(m: Media) => {
                set(m.url);
                // Fill the matching alt-text field, if this section has one and it's empty.
                const altKey = [`${f.key}Alt`, f.key === "image" ? "imageAlt" : "", f.key === "image" ? "alt" : ""].find((k) => k && fields.some((x) => x.key === k));
                if (altKey && !siblings[altKey]) setTimeout(() => setSibling(altKey, m.alt), 0);
              }}
            />
          )}
        </div>
      );
      break;
    }
    case "tags": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      input = <TagsInput id={id} value={list} onChange={set} />;
      break;
    }
    case "products": {
      const chosen = Array.isArray(value) ? (value as string[]) : [];
      input = (
        <fieldset className="grid gap-1.5 sm:grid-cols-2" id={id}>
          {ctx.products.map((p) => (
            <label key={p.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-[#7d6232]" checked={chosen.includes(p.slug)} onChange={(e) => set(e.target.checked ? [...chosen, p.slug] : chosen.filter((s) => s !== p.slug))} />
              {p.name}
              {chosen.includes(p.slug) && <span className="text-xs text-stone">#{chosen.indexOf(p.slug) + 1}</span>}
            </label>
          ))}
        </fieldset>
      );
      break;
    }
    case "list":
      return (
        <div ref={wrap} className={ring}>
          <p className="label">{f.label}</p>
          {help}
          <ListEditor field={f} items={Array.isArray(value) ? (value as Value[]) : []} onChange={set} ctx={ctx} focus={focus} path={path} />
        </div>
      );
    default:
      input = <input id={id} className="field" value={str} onChange={(e) => set(e.target.value)} />;
  }
  return (
    <div ref={wrap} className={ring}>
      {f.type !== "toggle" || f.help ? label : null}
      {input}
      {f.type !== "toggle" && help}
    </div>
  );
}

function ListEditor({ field, items, onChange, ctx, focus, path }: { field: Field; items: Value[]; onChange: (v: Value[]) => void; ctx: EditorContext; focus?: string; path: string }) {
  const of = field.of ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  // A click in the preview on "items.3.title" opens item 3.
  useEffect(() => {
    if (!focus?.startsWith(`${path}.`)) return;
    const n = Number(focus.slice(path.length + 1).split(".")[0]);
    if (Number.isInteger(n)) setOpen(n);
  }, [focus, path]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
    setOpen(to);
  };
  const name = (it: Value, i: number) => {
    const v = field.itemLabel ? it[field.itemLabel] : "";
    return (typeof v === "string" && v.replace(/\*/g, "").slice(0, 70)) || `Item ${i + 1}`;
  };

  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li
            key={i}
            draggable={open !== i}
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragging !== null) move(dragging, i);
              setDragging(null);
            }}
            className={`rounded-md border bg-white ${dragging === i ? "opacity-50" : ""} ${open === i ? "border-gold/60" : "border-ink/10"}`}
          >
            <div className="flex items-center gap-1 px-2 py-1.5">
              <span aria-hidden className="cursor-grab select-none px-1 text-stone">⋮⋮</span>
              <button type="button" className="min-w-0 flex-1 truncate py-1 text-left text-sm" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                {name(it, i)}
              </button>
              <button type="button" className="btn btn-sm px-1.5" aria-label={`Move ${name(it, i)} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                ↑
              </button>
              <button type="button" className="btn btn-sm px-1.5" aria-label={`Move ${name(it, i)} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>
                ↓
              </button>
              <button type="button" className="btn btn-sm px-1.5" aria-label={`Duplicate ${name(it, i)}`} onClick={() => onChange([...items.slice(0, i + 1), structuredClone(it), ...items.slice(i + 1)])}>
                ⧉
              </button>
              <button
                type="button"
                className="btn btn-sm px-1.5 text-bad"
                aria-label={`Delete ${name(it, i)}`}
                onClick={() => {
                  if (confirm(`Delete “${name(it, i)}”?`)) onChange(items.filter((_, j) => j !== i));
                }}
              >
                ✕
              </button>
            </div>
            {open === i && (
              <div className="border-t border-ink/10 p-3">
                <FieldEditor fields={of} value={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} ctx={ctx} focus={focus} path={`${path}.${i}`} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="btn btn-line btn-sm"
        disabled={field.max !== undefined && items.length >= field.max}
        onClick={() => {
          onChange([...items, blankFor(of)]);
          setOpen(items.length);
        }}
      >
        + Add {field.label.toLowerCase().replace(/s$/, "").replace(/ \(.*\)$/, "")}
      </button>
    </div>
  );
}

/** Comma-separated short values (pincode prefixes and the like), kept as typed until focus leaves. */
function TagsInput({ id, value, onChange }: { id: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(", "));
  useEffect(() => setText(value.join(", ")), [value]);
  return (
    <input
      id={id}
      className="field font-mono text-xs"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(text.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean))}
    />
  );
}
