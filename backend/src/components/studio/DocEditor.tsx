"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteGroup } from "@shakshi/shared/cms/site-fields";
import { FieldEditor, type EditorContext } from "./FieldEditor";
import { api } from "./actions";

type Doc = Record<string, unknown>;
const stamp = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
const getAt = (v: Doc, path: string): Doc => (path ? (path.split(".").reduce<unknown>((o, k) => (o as Doc)?.[k], v) as Doc) ?? {} : v);
const setAt = (v: Doc, path: string, next: Doc): Doc => {
  if (!path) return next;
  const [head, ...rest] = path.split(".");
  return { ...v, [head]: setAt((v[head] as Doc) ?? {}, rest.join("."), next) };
};

/**
 * Edits a single draftable document (site settings, the quiz) in grouped screens, with the
 * same safety as pages: 10-second autosave, a warning before leaving unsaved work, and Publish.
 */
export function DocEditor({
  groups,
  initial,
  url,
  bodyKey,
  ctx,
  liveUrl,
}: {
  groups: SiteGroup[];
  initial: { draft: Doc; published: Doc | null; updatedAt?: string };
  url: string;
  bodyKey: "site" | "doc";
  ctx: EditorContext;
  liveUrl: string;
}) {
  const [doc, setDoc] = useState<Doc>(initial.draft);
  const [saved, setSaved] = useState(JSON.stringify(initial.draft));
  const [published, setPublished] = useState(JSON.stringify(initial.published));
  const [group, setGroup] = useState(groups[0].id);
  const [status, setStatus] = useState(initial.updatedAt ? `Draft saved ${stamp(initial.updatedAt)}` : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef(doc);
  ref.current = doc;
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const dirty = JSON.stringify(doc) !== saved;
  const unpublished = JSON.stringify(doc) !== published;
  const g = groups.find((x) => x.id === group)!;

  const save = useCallback(
    async (autosave: boolean) => {
      const current = ref.current;
      try {
        const r = await api<{ updatedAt: string }>("PUT", url, { [bodyKey]: current, autosave });
        setSaved(JSON.stringify(current));
        setStatus(`${autosave ? "Autosaved" : "Draft saved"} ${stamp(r.updatedAt)}`);
        setError("");
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      }
    },
    [url, bodyKey]
  );
  useEffect(() => {
    const t = setInterval(() => JSON.stringify(ref.current) !== savedRef.current && save(true), 10_000);
    return () => clearInterval(t);
  }, [save]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const publish = async () => {
    setBusy(true);
    if (dirty && !(await save(false))) return setBusy(false);
    try {
      const r = await api<{ publishedAt: string }>("POST", `${url}/publish`, {});
      setPublished(JSON.stringify(ref.current));
      setStatus(`Published ${stamp(r.publishedAt)}. The site refreshes within a few seconds.`);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 lg:-mx-10 lg:px-10">
        <span className="mr-auto text-xs text-stone" role="status" aria-live="polite">
          {error ? <span className="text-bad">{error}</span> : dirty ? "Unsaved changes" : status}
        </span>
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">
          View live ↗
        </a>
        <button className="btn btn-line btn-sm" disabled={!dirty} onClick={() => save(false)}>
          Save draft
        </button>
        <button className="btn btn-gold btn-sm" disabled={busy || !unpublished} onClick={publish}>
          {busy ? "Publishing…" : unpublished ? "Publish" : "Published"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Settings groups" className="lg:sticky lg:top-24 lg:self-start">
          <select className="field lg:hidden" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Settings group">
            {groups.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
          <ul className="hidden space-y-0.5 lg:block">
            {groups.map((x) => (
              <li key={x.id}>
                <button onClick={() => setGroup(x.id)} aria-current={group === x.id ? "page" : undefined} className={`w-full rounded-md px-3 py-2 text-left text-sm ${group === x.id ? "bg-midnight text-pearl" : "hover:bg-ink/5"}`}>
                  {x.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section className="card p-5 sm:p-6" aria-labelledby="group-title">
          <h2 id="group-title" className="text-3xl">
            {g.title}
          </h2>
          <p className="mb-6 text-sm text-stone">{g.description}</p>
          <FieldEditor key={g.id} fields={g.fields} value={getAt(doc, g.path)} onChange={(v) => setDoc((d) => setAt(d, g.path, v))} ctx={ctx} />
        </section>
      </div>
    </div>
  );
}
