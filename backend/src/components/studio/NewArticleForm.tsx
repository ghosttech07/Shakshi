"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./actions";

export function NewArticleForm({ base }: { base: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  if (!open)
    return (
      <button className="btn btn-gold" onClick={() => setOpen(true)}>
        + New essay
      </button>
    );
  return (
    <form
      className="card flex flex-wrap items-end gap-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        try {
          const r = await api<{ slug: string }>("POST", "/api/admin/articles", { title, slug });
          router.push(`${base}/library/${r.slug}`);
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <div className="min-w-64">
        <label className="label" htmlFor="na-title">
          Title
        </label>
        <input id="na-title" className="field" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Why we sleep better in the cold" />
        {slug && <p className="mt-1 font-mono text-xs text-stone">/sleep-library/{slug}</p>}
      </div>
      <button className="btn btn-dark">Create draft</button>
      <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
        Cancel
      </button>
      {error && <p className="w-full text-sm text-bad">{error}</p>}
    </form>
  );
}
