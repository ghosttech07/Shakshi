"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./actions";

export function NewPageForm({ base }: { base: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const auto = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (!open)
    return (
      <button className="btn btn-gold" onClick={() => setOpen(true)}>
        + New page
      </button>
    );
  return (
    <form
      className="card flex w-full flex-wrap items-end gap-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        try {
          const r = await api<{ key: string }>("POST", "/api/admin/pages", { title, slug });
          router.push(`${base}/pages/${encodeURIComponent(r.key)}`);
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="np-title">
          Page title
        </label>
        <input
          id="np-title"
          className="field"
          value={title}
          autoFocus
          onChange={(e) => {
            setTitle(e.target.value);
            if (!touched) setSlug(auto(e.target.value));
          }}
          placeholder="Our Craft"
        />
      </div>
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="np-slug">
          Address
        </label>
        <div className="flex items-center gap-1">
          <span className="text-stone">/</span>
          <input
            id="np-slug"
            className="field font-mono text-xs"
            value={slug}
            onChange={(e) => {
              setTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="our-craft"
          />
        </div>
      </div>
      <button className="btn btn-dark">Create</button>
      <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
        Cancel
      </button>
      {error && <p className="w-full text-sm text-bad">{error}</p>}
    </form>
  );
}
