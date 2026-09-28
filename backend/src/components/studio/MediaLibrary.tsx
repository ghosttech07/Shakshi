"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { api } from "./actions";

export type Media = { id: string; at: string; url: string; name: string; kind: "image" | "video" | "model" | "file"; type: string; size: number; width?: number; height?: number; alt: string };
type Kind = Media["kind"];

const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);
const ACCEPT: Record<Kind, string> = { image: "image/*", video: "video/*", model: ".glb,.gltf,model/*", file: "*/*" };

/**
 * The media library: drag-and-drop uploads (images become WebP, alt text is required),
 * alt-text editing, and deletion that refuses while a file is still used somewhere.
 * With `onPick`, it doubles as the picker for image/video/file fields.
 */
export function MediaLibrary({ onPick, kind }: { onPick?: (m: Media) => void; kind?: Kind }) {
  const [items, setItems] = useState<Media[] | null>(null);
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Media | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setItems((await api<{ media: Media[] }>("GET", "/api/admin/media")).media);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const upload = async () => {
    if (!pending.length) return;
    if (alt.trim().length < 3) return setError("Describe the file in a few words (alt text) before uploading. It helps people using screen readers, and search.");
    setBusy(true);
    setError("");
    for (const f of pending) {
      const form = new FormData();
      form.set("file", f);
      form.set("alt", alt.trim());
      const r = await fetch("/api/admin/media", { method: "POST", body: form });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(`${f.name}: ${j.error ?? "Upload failed."}`);
        setBusy(false);
        return;
      }
      if (onPick && pending.length === 1) onPick({ ...j, at: new Date().toISOString() });
    }
    setPending([]);
    setAlt("");
    setBusy(false);
    load();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    setPending([...e.dataTransfer.files]);
  };

  const shown = (items ?? []).filter((m) => (!kind || m.kind === kind) && (!q || `${m.name} ${m.alt}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors ${drag ? "border-gold bg-gold/10" : "border-ink/15"}`}
      >
        {pending.length ? (
          <div className="mx-auto max-w-lg text-left">
            <p className="text-sm">
              Ready to upload: <strong>{pending.map((f) => f.name).join(", ")}</strong>
            </p>
            <label htmlFor="alt" className="label mt-3">
              Alt text (required): what does it show?
            </label>
            <input id="alt" className="field" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="A tufted headboard above crisp white bedding" autoFocus />
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-gold" disabled={busy} onClick={upload}>
                {busy ? "Uploading…" : "Upload"}
              </button>
              <button type="button" className="btn btn-line" onClick={() => setPending([])}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm">Drag files here, or</p>
            <button type="button" className="btn btn-line btn-sm mt-2" onClick={() => input.current?.click()}>
              Choose files
            </button>
            <p className="mt-2 text-xs text-stone">Images are resized and converted to WebP. Videos up to 80 MB, 3D models (GLB) up to 40 MB.</p>
          </>
        )}
        <input ref={input} type="file" multiple hidden accept={kind ? ACCEPT[kind] : undefined} onChange={(e) => setPending([...(e.target.files ?? [])])} />
      </div>
      {error && (
        <p className="mt-2 text-sm text-bad" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <input className="field max-w-xs" placeholder="Search files" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search files" />
        <span className="text-xs text-stone">{items ? `${shown.length} file${shown.length === 1 ? "" : "s"}` : "Loading…"}</span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => (onPick ? onPick(m) : setOpen(m))} className="group block w-full overflow-hidden rounded-md border border-ink/10 bg-white text-left hover:border-gold">
              <span className="block aspect-[4/3] bg-ivory-2">
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-xs uppercase tracking-[0.2em] text-stone">{m.kind}</span>
                )}
              </span>
              <span className="block truncate px-2 pt-1.5 text-xs font-semibold">{m.name}</span>
              <span className="block truncate px-2 pb-2 text-[0.68rem] text-stone">{m.alt || "No alt text"}</span>
            </button>
          </li>
        ))}
      </ul>
      {open && <MediaDetails m={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

function MediaDetails({ m, onClose, onChanged }: { m: Media; onClose: () => void; onChanged: () => void }) {
  const [alt, setAlt] = useState(m.alt);
  const [usedIn, setUsedIn] = useState<string[] | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api<{ usedIn: string[] }>("GET", `/api/admin/media/${m.id}`).then((r) => setUsedIn(r.usedIn)).catch(() => setUsedIn([]));
  }, [m.id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={m.name}>
      <button className="absolute inset-0 bg-midnight/60" aria-label="Close" onClick={onClose} />
      <div className="card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-paper p-5">
        {m.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt={m.alt} className="max-h-80 w-full rounded object-contain" />
        ) : m.kind === "video" ? (
          <video src={m.url} controls className="max-h-80 w-full" />
        ) : null}
        <p className="mt-3 font-semibold">{m.name}</p>
        <p className="text-xs text-stone">
          {m.type} · {kb(m.size)}
          {m.width ? ` · ${m.width}×${m.height}` : ""}
        </p>
        <p className="mt-2 break-all rounded bg-ivory-2 px-2 py-1 font-mono text-xs">{m.url}</p>
        <label className="label mt-4" htmlFor="alt-edit">
          Alt text
        </label>
        <input id="alt-edit" className="field" value={alt} onChange={(e) => setAlt(e.target.value)} />
        <p className="mt-3 text-sm">
          {usedIn === null ? "Checking where it's used…" : usedIn.length ? <>Used in: {usedIn.join(", ")}</> : "Not used anywhere yet."}
        </p>
        {msg && <p className="mt-2 text-sm text-bad">{msg}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-dark"
            onClick={async () => {
              if (alt.trim().length < 3) return setMsg("Alt text needs a few words.");
              await api("PATCH", `/api/admin/media/${m.id}`, { alt: alt.trim() });
              onChanged();
              onClose();
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!!usedIn?.length}
            title={usedIn?.length ? "Remove it from those places first" : undefined}
            onClick={async () => {
              if (!confirm(`Delete ${m.name}? This can't be undone.`)) return;
              try {
                await api("DELETE", `/api/admin/media/${m.id}`);
                onChanged();
                onClose();
              } catch (e) {
                setMsg((e as Error).message);
              }
            }}
          >
            Delete
          </button>
          <button type="button" className="btn btn-line ml-auto" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** A modal wrapper around the library, for choosing a file for a field. */
export function MediaPicker({ kind, onPick, onClose }: { kind?: Kind; onPick: (m: Media) => void; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Choose a file">
      <button className="absolute inset-0 bg-midnight/60" aria-label="Close" onClick={onClose} />
      <div className="card relative max-h-[90vh] w-full max-w-5xl overflow-y-auto bg-paper p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">Choose {kind === "image" ? "an image" : kind === "video" ? "a video" : "a file"}</h2>
          <button type="button" className="btn btn-line btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <MediaLibrary kind={kind} onPick={(m) => (onPick(m), onClose())} />
      </div>
    </div>
  );
}
