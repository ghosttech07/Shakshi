"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ARTICLE_CATEGORIES } from "@shakshi/shared/articles";
import type { Field } from "@shakshi/shared/cms/types";
import { FieldEditor, type EditorContext } from "./FieldEditor";
import { api } from "./actions";

const FIELDS: Field[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "dek", label: "Standfirst", type: "textarea", help: "One or two sentences under the title." },
  { key: "category", label: "Category", type: "select", options: ARTICLE_CATEGORIES.map((c) => ({ value: c, label: c })) },
  { key: "author", label: "Author", type: "text" },
  { key: "date", label: "Date shown", type: "date" },
  { key: "image", label: "Main image", type: "image" },
  { key: "imageAlt", label: "Main image alt text", type: "text" },
  { key: "html", label: "Essay", type: "richtext" },
  { key: "related", label: "Mattresses to suggest at the end", type: "products" },
];

export function ArticleEditor({ article, ctx, base, frontend }: { article: Record<string, unknown> & { slug: string; builtIn: boolean }; ctx: EditorContext; base: string; frontend: string }) {
  const router = useRouter();
  const [a, setA] = useState<Record<string, unknown>>({ ...article, publishAt: typeof article.publishAt === "string" ? article.publishAt.slice(0, 10) : "" });
  const [saved, setSaved] = useState(JSON.stringify(a));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(a) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async (next = a) => {
    setBusy(true);
    setMsg(null);
    try {
      await api("PUT", `/api/admin/articles/${encodeURIComponent(article.slug)}`, { article: next });
      setA(next);
      setSaved(JSON.stringify(next));
      setMsg({ ok: true, text: next.published ? (next.publishAt ? `Scheduled for ${next.publishAt}.` : "Published.") : "Draft saved." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  };

  const live = !!a.published;
  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 lg:-mx-10 lg:px-10">
        <span className="mr-auto text-xs" role="status">
          {msg ? <span className={msg.ok ? "text-ok" : "text-bad"}>{msg.text}</span> : dirty ? <span className="text-stone">Unsaved changes</span> : <span className="text-stone">{live ? "Live" : "Draft"}</span>}
        </span>
        {live && (
          <a href={`${frontend}/sleep-library/${article.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">
            View ↗
          </a>
        )}
        <button className="btn btn-line btn-sm" disabled={busy || !dirty} onClick={() => save()}>
          Save
        </button>
        {live ? (
          <button className="btn btn-line btn-sm" disabled={busy} onClick={() => save({ ...a, published: false })}>
            Unpublish
          </button>
        ) : (
          <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => save({ ...a, published: true })}>
            {a.publishAt ? "Schedule" : "Publish"}
          </button>
        )}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5 sm:p-6">
          <FieldEditor fields={FIELDS.filter((f) => ["title", "dek", "html"].includes(f.key))} value={a} onChange={setA} ctx={ctx} />
        </section>
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-2xl">Details</h2>
            <FieldEditor fields={FIELDS.filter((f) => !["title", "dek", "html"].includes(f.key))} value={a} onChange={setA} ctx={ctx} />
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="text-2xl">Schedule</h2>
            <p className="mb-3 text-xs text-stone">Choose a date to publish automatically that morning. Leave empty to publish straight away.</p>
            <label className="label" htmlFor="publishAt">
              Publish on
            </label>
            <input id="publishAt" type="date" className="field max-w-52" value={String(a.publishAt ?? "")} onChange={(e) => setA((x) => ({ ...x, publishAt: e.target.value }))} />
          </section>
          <section className="card p-5 sm:p-6">
            <button
              className="btn btn-danger"
              onClick={async () => {
                if (!confirm(`Delete “${String(a.title)}”? It will disappear from the Sleep Library.`)) return;
                await api("DELETE", `/api/admin/articles/${encodeURIComponent(article.slug)}`);
                router.push(`${base}/library`);
                router.refresh();
              }}
            >
              Delete essay
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
