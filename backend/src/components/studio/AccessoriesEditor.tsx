"use client";

import { useEffect, useState } from "react";
import type { Field } from "@shakshi/shared/cms/types";
import { FieldEditor, type EditorContext } from "./FieldEditor";
import { api } from "./actions";

const FIELDS: Field[] = [
  {
    key: "list",
    label: "Items",
    type: "list",
    itemLabel: "name",
    of: [
      { key: "name", label: "Name", type: "text" },
      {
        key: "kind",
        label: "Type",
        type: "select",
        options: [
          { value: "pillow", label: "Pillow (shown under Pillows)" },
          { value: "cover", label: "Mattress cover (shown under Mattress Covers)" },
          { value: "bedding", label: "Bedding (offered in the bag only)" },
        ],
      },
      { key: "price", label: "Price (₹)", type: "number", min: 0 },
      { key: "image", label: "Photo", type: "image" },
      { key: "note", label: "Short line", type: "text", help: "Shown in the menu's product list and on the card." },
      { key: "description", label: "Description", type: "textarea" },
      { key: "published", label: "Shown on the site", type: "toggle", help: "Shown on the site" },
      { key: "id", label: "Address", type: "text", help: "Used in links, e.g. /shop/pillows#latex-pillow. Leave empty to make one from the name." },
    ],
  },
];

type Item = Record<string, unknown>;

export function AccessoriesEditor({ initial, ctx, frontend }: { initial: Item[]; ctx: EditorContext; frontend: string }) {
  const [value, setValue] = useState<Record<string, unknown>>({ list: initial.map((a) => ({ published: true, description: "", ...a })) });
  const [saved, setSaved] = useState(JSON.stringify(value));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(value) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ list: Item[] }>("PUT", "/api/admin/accessories", value);
      const next = { list: r.list.map((a) => ({ published: true, description: "", ...a })) };
      setValue(next);
      setSaved(JSON.stringify(next));
      setMsg({ ok: true, text: "Saved. The shop updates within a few seconds." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 lg:-mx-10 lg:px-10">
        <span className="mr-auto text-xs" role="status">
          {msg ? <span className={msg.ok ? "text-ok" : "text-bad"}>{msg.text}</span> : dirty ? <span className="text-stone">Unsaved changes</span> : null}
        </span>
        <a href={`${frontend}/shop/pillows`} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">
          Pillows ↗
        </a>
        <a href={`${frontend}/shop/covers`} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">
          Covers ↗
        </a>
        <button className="btn btn-gold btn-sm" disabled={busy || !dirty} onClick={save}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      <section className="card p-5 sm:p-6">
        <FieldEditor fields={FIELDS} value={value} onChange={setValue} ctx={ctx} />
      </section>
    </div>
  );
}
