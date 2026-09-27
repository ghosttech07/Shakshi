"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./actions";

export function NewProductForm({ base }: { base: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const slug = name.toLowerCase().replace(/^the\s+/, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!open)
    return (
      <button className="btn btn-gold" onClick={() => setOpen(true)}>
        + New mattress
      </button>
    );
  return (
    <form
      className="card flex flex-wrap items-end gap-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        try {
          const r = await api<{ slug: string }>("POST", "/api/admin/products", { name, slug });
          router.push(`${base}/products/${r.slug}`);
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <div>
        <label className="label" htmlFor="np-name">
          Name
        </label>
        <input id="np-name" className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="The Aurora" />
        {slug && <p className="mt-1 font-mono text-xs text-stone">/mattress/{slug}</p>}
      </div>
      <button className="btn btn-dark">Create</button>
      <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
        Cancel
      </button>
      {error && <p className="w-full text-sm text-bad">{error}</p>}
    </form>
  );
}
