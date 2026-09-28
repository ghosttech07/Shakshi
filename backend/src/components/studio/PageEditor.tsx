"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SECTIONS, sectionDefaults } from "@shakshi/shared/cms/sections";
import { newId, type Draftable, type PageDoc, type Section } from "@shakshi/shared/cms/types";
import { FieldEditor, type EditorContext } from "./FieldEditor";
import { MediaPicker } from "./MediaLibrary";
import { api } from "./actions";

type Device = "desktop" | "tablet" | "mobile";
const WIDTH: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };
type Version = { id: string; at: string; note: string; sections: number; doc: PageDoc };

const summary = (s: Section) => {
  for (const k of ["title", "heading", "headline", "intro", "eyebrow", "body"]) {
    const v = s.data[k];
    if (typeof v === "string" && v.trim()) return v.replace(/<[^>]+>/g, " ").replace(/\*/g, "").trim().slice(0, 60);
  }
  return "";
};
const stamp = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

export function PageEditor({ pageKey, initial, frontend, base, ctx }: { pageKey: string; initial: Draftable<PageDoc>; frontend: string; base: string; ctx: EditorContext }) {
  const [doc, setDoc] = useState<PageDoc>(initial.draft);
  const [saved, setSaved] = useState(JSON.stringify(initial.draft));
  const [publishedJson, setPublishedJson] = useState(JSON.stringify(initial.published));
  const [status, setStatus] = useState(initial.updatedAt ? `Draft saved ${stamp(initial.updatedAt)}` : "");
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | undefined>();
  const [panel, setPanel] = useState<"sections" | "settings" | "versions">("sections");
  const [adding, setAdding] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(800);
  const origin = useMemo(() => new URL(frontend).origin, [frontend]);

  const json = JSON.stringify(doc);
  const dirty = json !== saved;
  const unpublished = json !== publishedJson;
  const section = doc.sections.find((s) => s.id === selected) ?? null;

  // ---- live preview ----
  const post = useCallback((msg: unknown) => frame.current?.contentWindow?.postMessage(msg, origin), [origin]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== origin || !e.data || typeof e.data !== "object") return;
      if (e.data.type === "shakshi:preview-ready") post({ type: "shakshi:preview", page: docRef.current });
      if (e.data.type === "shakshi:select" && typeof e.data.sectionId === "string") {
        setPanel("sections");
        setSelected(e.data.sectionId);
        setFocus(typeof e.data.field === "string" ? e.data.field : undefined);
        setMobileTab("edit");
      }
    };
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, [origin, post]);
  const docRef = useRef(doc);
  docRef.current = doc;
  useEffect(() => {
    const t = setTimeout(() => post({ type: "shakshi:preview", page: doc }), 120);
    return () => clearTimeout(t);
  }, [doc, post]);
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setBoxW(e.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(1, boxW / WIDTH[device]);

  // ---- saving ----
  const save = useCallback(
    async (autosave: boolean) => {
      const current = docRef.current;
      const body = JSON.stringify(current);
      try {
        const r = await api<{ updatedAt: string }>("PUT", `/api/admin/pages/${encodeURIComponent(pageKey)}`, { doc: current, autosave });
        setSaved(body);
        setStatus(`${autosave ? "Autosaved" : "Draft saved"} ${stamp(r.updatedAt)}`);
        setError("");
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      }
    },
    [pageKey]
  );
  // Autosave every 10 seconds while there are changes.
  useEffect(() => {
    const t = setInterval(() => {
      if (JSON.stringify(docRef.current) !== savedRef.current) save(true);
    }, 10_000);
    return () => clearInterval(t);
  }, [save]);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  // Warn before leaving with unsaved changes.
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
      const r = await api<{ publishedAt: string }>("POST", `/api/admin/pages/${encodeURIComponent(pageKey)}/publish`, {});
      setPublishedJson(JSON.stringify(docRef.current));
      setStatus(`Published ${stamp(r.publishedAt)}. The live page refreshes within a few seconds.`);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const reload = async () => {
    const row = await api<Draftable<PageDoc>>("GET", `/api/admin/pages/${encodeURIComponent(pageKey)}`);
    setDoc(row.draft);
    setSaved(JSON.stringify(row.draft));
    setSelected(null);
  };

  // ---- editing ----
  const setSections = (sections: Section[]) => setDoc((d) => ({ ...d, sections }));
  const updateSection = (id: string, data: Record<string, unknown>) => setDoc((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, data } : s)) }));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= doc.sections.length || from === to) return;
    const next = [...doc.sections];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setSections(next);
  };
  const addSection = (type: string) => {
    const s: Section = { id: `${type}-${newId()}`, type, data: sectionDefaults(type) };
    const at = selected ? doc.sections.findIndex((x) => x.id === selected) + 1 : doc.sections.length;
    setSections([...doc.sections.slice(0, at), s, ...doc.sections.slice(at)]);
    setAdding(false);
    setSelected(s.id);
    setTimeout(() => post({ type: "shakshi:focus", sectionId: s.id }), 400);
  };
  const select = (id: string) => {
    setSelected(id);
    setFocus(undefined);
    post({ type: "shakshi:focus", sectionId: id });
  };

  return (
    <div className="-mx-4 -my-6 sm:-mx-8 lg:-mx-10 lg:-my-10">
      {/* Top bar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-3 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:px-6 lg:top-0">
        <a href={`${base}/pages`} className="text-sm text-stone hover:text-ink" onClick={(e) => dirty && !confirm("You have unsaved changes. Leave anyway?") && e.preventDefault()}>
          ← Pages
        </a>
        <div className="min-w-0">
          <h1 className="truncate text-2xl leading-none">{doc.title}</h1>
          <p className="truncate text-xs text-stone">/{doc.slug}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone" role="status" aria-live="polite">
            {error ? <span className="text-bad">{error}</span> : dirty ? "Unsaved changes" : status}
          </span>
          <a href={`${frontend}/${doc.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">
            View live ↗
          </a>
          <button className="btn btn-line btn-sm" disabled={!dirty} onClick={() => save(false)}>
            Save draft
          </button>
          <button className="btn btn-gold btn-sm" disabled={busy || !unpublished} onClick={publish} title={unpublished ? "Make this draft live" : "The live page matches this draft"}>
            {busy ? "Publishing…" : unpublished ? "Publish" : "Published"}
          </button>
        </div>
      </div>

      {/* Phone: switch between editing and preview */}
      <div className="flex border-b border-ink/10 bg-paper lg:hidden" role="tablist">
        {(["edit", "preview"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={mobileTab === t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-sm ${mobileTab === t ? "border-b-2 border-gold font-semibold" : "text-stone"}`}>
            {t === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:h-[calc(100vh-65px)] lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
        {/* Editor */}
        <aside className={`overflow-y-auto border-r border-ink/10 bg-paper p-4 sm:p-5 ${mobileTab === "edit" ? "" : "hidden lg:block"}`}>
          {!section && (
            <nav className="mb-4 flex gap-1 rounded-md bg-ivory-2 p-1 text-sm" aria-label="Editor panels">
              {(["sections", "settings", "versions"] as const).map((p) => (
                <button key={p} onClick={() => setPanel(p)} aria-pressed={panel === p} className={`flex-1 rounded px-2 py-1.5 ${panel === p ? "bg-white font-semibold shadow-sm" : "text-stone"}`}>
                  {p === "sections" ? "Sections" : p === "settings" ? "Page & SEO" : "History"}
                </button>
              ))}
            </nav>
          )}

          {section ? (
            <div>
              <button className="mb-3 text-sm text-stone hover:text-ink" onClick={() => setSelected(null)}>
                ← All sections
              </button>
              <h2 className="text-lg">{SECTIONS[section.type]?.label ?? section.type}</h2>
              <p className="mb-5 text-xs text-stone">{SECTIONS[section.type]?.description}</p>
              {SECTIONS[section.type]?.fields.length ? (
                <FieldEditor fields={SECTIONS[section.type].fields} value={section.data} onChange={(d) => updateSection(section.id, d)} ctx={ctx} focus={focus} />
              ) : (
                <p className="rounded-md bg-ivory-2 p-3 text-sm text-stone">This section has no words of its own to edit; it shows a live part of the shop.</p>
              )}
            </div>
          ) : panel === "sections" ? (
            <>
              <ol className="space-y-1.5">
                {doc.sections.map((s, i) => (
                  <li
                    key={s.id}
                    draggable
                    onDragStart={() => setDragging(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragging !== null) move(dragging, i);
                      setDragging(null);
                    }}
                    className={`group flex items-center gap-1 rounded-md border bg-white px-2 py-1.5 ${dragging === i ? "opacity-40" : ""} ${s.hidden ? "border-dashed border-ink/20" : "border-ink/10 hover:border-gold/60"}`}
                  >
                    <span aria-hidden className="cursor-grab select-none px-1 text-stone">⋮⋮</span>
                    <button className="min-w-0 flex-1 py-1 text-left" onClick={() => select(s.id)}>
                      <span className={`block truncate text-sm font-semibold ${s.hidden ? "text-stone line-through" : ""}`}>{SECTIONS[s.type]?.label ?? s.type}</span>
                      <span className="block truncate text-xs text-stone">{s.hidden ? "Hidden" : summary(s)}</span>
                    </button>
                    <button className="btn btn-sm px-1.5" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                      ↑
                    </button>
                    <button className="btn btn-sm px-1.5" aria-label="Move down" disabled={i === doc.sections.length - 1} onClick={() => move(i, i + 1)}>
                      ↓
                    </button>
                    <details className="relative">
                      <summary className="btn btn-sm list-none px-1.5" aria-label="More actions">
                        ⋯
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-ink/10 bg-white p-1 text-sm shadow-lg">
                        <button className="block w-full rounded px-2 py-1.5 text-left hover:bg-ivory-2" onClick={() => setSections(doc.sections.map((x) => (x.id === s.id ? { ...x, hidden: !x.hidden } : x)))}>
                          {s.hidden ? "Show" : "Hide"}
                        </button>
                        {!SECTIONS[s.type]?.unique && (
                          <button className="block w-full rounded px-2 py-1.5 text-left hover:bg-ivory-2" onClick={() => setSections([...doc.sections.slice(0, i + 1), { ...structuredClone(s), id: `${s.type}-${newId()}` }, ...doc.sections.slice(i + 1)])}>
                            Duplicate
                          </button>
                        )}
                        <button
                          className="block w-full rounded px-2 py-1.5 text-left text-bad hover:bg-ivory-2"
                          onClick={() => {
                            if (confirm(`Delete the “${SECTIONS[s.type]?.label ?? s.type}” section? You can restore it from History after publishing.`)) setSections(doc.sections.filter((x) => x.id !== s.id));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
              <button className="btn btn-dark mt-3 w-full" onClick={() => setAdding(true)}>
                + Add a section
              </button>
              <p className="mt-3 text-xs text-stone">Drag to reorder. Click anything in the preview to edit it.</p>
            </>
          ) : panel === "settings" ? (
            <PageSettings doc={doc} setDoc={setDoc} pageKey={pageKey} base={base} />
          ) : (
            <History pageKey={pageKey} current={doc} onRestored={reload} dirty={dirty} />
          )}
        </aside>

        {/* Preview */}
        <section className={`flex min-h-[70vh] flex-col bg-ivory-2 ${mobileTab === "preview" ? "" : "hidden lg:flex"}`} aria-label="Live preview">
          <div className="flex items-center justify-center gap-1 border-b border-ink/10 bg-paper p-2" role="group" aria-label="Preview size">
            {(["desktop", "tablet", "mobile"] as const).map((d) => (
              <button key={d} onClick={() => setDevice(d)} aria-pressed={device === d} className={`btn btn-sm ${device === d ? "btn-dark" : "btn-line"}`}>
                {d === "desktop" ? "Desktop" : d === "tablet" ? "Tablet" : "Mobile"}
              </button>
            ))}
            <span className="ml-2 hidden text-xs text-stone sm:inline">{WIDTH[device]}px</span>
          </div>
          <div ref={box} className="relative flex-1 overflow-hidden">
            <div className="absolute left-1/2 top-0 origin-top" style={{ width: WIDTH[device], height: `${100 / scale}%`, transform: `translateX(-50%) scale(${scale})` }}>
              <iframe ref={frame} src={`${frontend}/preview`} title="Live preview" className="h-full w-full border-0 bg-ivory shadow-xl" />
            </div>
          </div>
        </section>
      </div>

      {adding && <SectionLibrary existing={doc.sections} onPick={addSection} onClose={() => setAdding(false)} />}
    </div>
  );
}

function SectionLibrary({ existing, onPick, onClose }: { existing: Section[]; onPick: (type: string) => void; onClose: () => void }) {
  const groups = new Map<string, [string, (typeof SECTIONS)[string]][]>();
  for (const [type, def] of Object.entries(SECTIONS)) {
    if (def.unique && existing.some((s) => s.type === type)) continue;
    groups.set(def.group, [...(groups.get(def.group) ?? []), [type, def]]);
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Add a section">
      <button className="absolute inset-0 bg-midnight/60" aria-label="Close" onClick={onClose} />
      <div className="card relative max-h-[88vh] w-full max-w-4xl overflow-y-auto bg-paper p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Add a section</h2>
          <button className="btn btn-line btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        {[...groups].map(([g, items]) => (
          <div key={g} className="mb-6">
            <p className="eyebrow mb-2 text-gold-ink">{g}</p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(([type, def]) => (
                <li key={type}>
                  <button onClick={() => onPick(type)} className="h-full w-full rounded-md border border-ink/10 bg-white p-3 text-left transition-colors hover:border-gold">
                    <span className="block font-semibold">{def.label}</span>
                    <span className="mt-0.5 block text-xs text-stone">{def.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageSettings({ doc, setDoc, pageKey, base }: { doc: PageDoc; setDoc: (fn: (d: PageDoc) => PageDoc) => void; pageKey: string; base: string }) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const seo = (k: keyof PageDoc["seo"], v: string | boolean) => setDoc((d) => ({ ...d, seo: { ...d.seo, [k]: v } }));
  const desc = doc.seo.description ?? "";
  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="pt">
          Page name (in the studio)
        </label>
        <input id="pt" className="field" value={doc.title} onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))} />
      </div>
      <div>
        <label className="label" htmlFor="ps">
          Address
        </label>
        <div className="flex items-center gap-1">
          <span className="text-stone">/</span>
          <input id="ps" className="field font-mono text-xs" value={doc.slug} disabled={doc.system} onChange={(e) => setDoc((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, "-") }))} />
        </div>
        {doc.system && <p className="mt-1 text-xs text-stone">Built-in pages keep their address.</p>}
      </div>
      <hr className="border-ink/10" />
      <p className="eyebrow text-gold-ink">Search & sharing</p>
      <div>
        <label className="label" htmlFor="st">
          Title in search results
        </label>
        <input id="st" className="field" value={doc.seo.title ?? ""} onChange={(e) => seo("title", e.target.value)} placeholder="Uses the site default when empty" />
      </div>
      <div>
        <label className="label" htmlFor="sd">
          Description <span className="font-normal">({desc.length}/160)</span>
        </label>
        <textarea id="sd" className="field" value={desc} onChange={(e) => seo("description", e.target.value)} />
      </div>
      <div>
        <p className="label">Social sharing image</p>
        <div className="flex gap-2">
          <input className="field font-mono text-xs" value={doc.seo.ogImage ?? ""} onChange={(e) => seo("ogImage", e.target.value)} aria-label="Social sharing image address" />
          <button className="btn btn-line btn-sm" onClick={() => setPicking(true)}>
            Choose
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-[#7d6232]" checked={!!doc.seo.noindex} onChange={(e) => seo("noindex", e.target.checked)} /> Hide this page from search engines
      </label>
      {/* How it will look in Google */}
      <div className="rounded-md border border-ink/10 bg-white p-3">
        <p className="truncate text-[0.8rem] text-[#1a0dab]">{doc.seo.title || doc.title}</p>
        <p className="truncate text-xs text-[#006621]">shakshi.in/{doc.slug}</p>
        <p className="line-clamp-2 text-xs text-stone">{desc || "No description yet."}</p>
      </div>
      {!doc.system && (
        <button
          className="btn btn-danger mt-4"
          onClick={async () => {
            if (!confirm(`Delete “${doc.title}”? Its address will stop working.`)) return;
            await api("DELETE", `/api/admin/pages/${encodeURIComponent(pageKey)}`);
            router.push(`${base}/pages`);
          }}
        >
          Delete page
        </button>
      )}
      {picking && <MediaPicker kind="image" onClose={() => setPicking(false)} onPick={(m) => seo("ogImage", m.url)} />}
    </div>
  );
}

function History({ pageKey, current, onRestored, dirty }: { pageKey: string; current: PageDoc; onRestored: () => void; dirty: boolean }) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api<{ versions: Version[] }>("GET", `/api/admin/pages/${encodeURIComponent(pageKey)}/versions`).then((r) => setVersions(r.versions));
  }, [pageKey]);
  const restore = async (versionId: string, sectionId?: string) => {
    if (dirty && !confirm("Restoring replaces your unsaved changes. Continue?")) return;
    await api("POST", `/api/admin/pages/${encodeURIComponent(pageKey)}/versions`, { versionId, sectionId });
    setMsg(sectionId ? "Section restored into the draft. Publish to make it live." : "Version restored into the draft. Publish to make it live.");
    onRestored();
  };
  if (!versions) return <p className="text-stone">Loading…</p>;
  if (!versions.length) return <p className="text-stone">Every time you publish, a version is kept here so you can go back.</p>;
  return (
    <div>
      {msg && <p className="mb-3 rounded-md bg-ok/10 p-2 text-sm text-ok">{msg}</p>}
      <ol className="space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="rounded-md border border-ink/10 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{stamp(v.at)}</p>
                <p className="text-xs text-stone">
                  {v.sections} sections{v.note ? ` · ${v.note}` : ""}
                </p>
              </div>
              <button className="btn btn-line btn-sm" onClick={() => restore(v.id)}>
                Restore
              </button>
            </div>
            <button className="mt-2 text-xs text-gold-ink hover:underline" onClick={() => setOpen(open === v.id ? null : v.id)} aria-expanded={open === v.id}>
              {open === v.id ? "Hide sections" : "Restore a single section…"}
            </button>
            {open === v.id && (
              <ul className="mt-2 space-y-1">
                {v.doc.sections.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">
                      {SECTIONS[s.type]?.label ?? s.type} {!current.sections.some((x) => x.id === s.id) && <em className="text-stone">(deleted since)</em>}
                    </span>
                    <button className="btn btn-line btn-sm" onClick={() => restore(v.id, s.id)}>
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
