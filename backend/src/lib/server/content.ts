import sanitizeHtml from "sanitize-html";
import { SECTIONS } from "@shakshi/shared/cms/sections";
import { DEFAULT_PAGES, DEFAULT_SITE, pageKey } from "@shakshi/shared/cms/defaults";
import type { Draftable, Field, PageDoc, Section, SiteConfig } from "@shakshi/shared/cms/types";
import { get, insert, list, remove, upsert } from "./db";

/**
 * Content storage for the CMS. Pages and the site config are "draftable": edits land in `draft`,
 * and Publish copies draft → published (keeping a version). Everything is audit-logged.
 * With nothing stored yet, the built-in defaults are both the draft and the published content.
 */

// ---------- sanitising ----------
const RICH = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "hr", "code"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
};
export const cleanHtml = (html: string) => sanitizeHtml(String(html ?? ""), RICH);
const cleanText = (v: unknown, max = 5000) => (typeof v === "string" ? v.slice(0, max) : v);

function cleanFields(fields: Field[], data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = data[f.key];
    if (v === undefined) continue;
    if (f.type === "richtext") out[f.key] = cleanHtml(String(v));
    else if (f.type === "list" && Array.isArray(v)) out[f.key] = v.slice(0, 100).map((item) => cleanFields(f.of ?? [], (item ?? {}) as Record<string, unknown>));
    else if (f.type === "number") out[f.key] = Number.isFinite(Number(v)) ? Number(v) : 0;
    else if (f.type === "toggle") out[f.key] = Boolean(v);
    else if (f.type === "products") out[f.key] = Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 20) : [];
    else if ((f.type === "link" || f.type === "image" || f.type === "video" || f.type === "file") && typeof v === "string") out[f.key] = /^\s*javascript:/i.test(v) ? "" : v.slice(0, 1000);
    else out[f.key] = cleanText(v);
    // keep companion alt text for images
    if (f.type === "image" && typeof data[`${f.key}Alt`] === "string") out[`${f.key}Alt`] = String(data[`${f.key}Alt`]).slice(0, 300);
  }
  return out;
}

export function cleanPage(doc: PageDoc): PageDoc {
  const slug = String(doc.slug ?? "").toLowerCase().replace(/[^a-z0-9/-]/g, "").replace(/^\/+|\/+$/g, "").slice(0, 80);
  const sections: Section[] = (Array.isArray(doc.sections) ? doc.sections : []).slice(0, 60).flatMap((s) => {
    const def = SECTIONS[s?.type];
    if (!def) return [];
    return [{ id: String(s.id).slice(0, 40) || Math.random().toString(36).slice(2, 10), type: s.type, hidden: Boolean(s.hidden), data: cleanFields(def.fields, (s.data ?? {}) as Record<string, unknown>) }];
  });
  return {
    slug,
    title: String(doc.title ?? "Untitled").slice(0, 120),
    seo: { title: String(doc.seo?.title ?? "").slice(0, 120), description: String(doc.seo?.description ?? "").slice(0, 300), ogImage: String(doc.seo?.ogImage ?? "").slice(0, 1000), noindex: Boolean(doc.seo?.noindex) },
    sections,
    system: doc.system,
  };
}

// ---------- audit ----------
export async function audit(action: string, target: string, detail = "") {
  try {
    await insert("audit_log", { action, target, detail: detail.slice(0, 500) });
  } catch (e) {
    console.error("[audit]", e);
  }
}

// ---------- pages ----------
type PageRow = Draftable<PageDoc>;

const fromDefault = (d: PageDoc): PageRow => ({ draft: d, published: d, updatedAt: "" });

export async function getPageRow(key: string): Promise<PageRow | null> {
  const row = await get<PageRow>("pages", key);
  if (row) return row.data;
  const d = DEFAULT_PAGES.find((p) => pageKey(p.slug) === key);
  return d ? fromDefault(structuredClone(d)) : null;
}

export async function listPages() {
  const rows = await list<PageRow>("pages", { limit: 500 });
  const stored = new Map(rows.map((r) => [r.id, r.data]));
  const all = new Map<string, PageRow>();
  for (const d of DEFAULT_PAGES) all.set(pageKey(d.slug), stored.get(pageKey(d.slug)) ?? fromDefault(d));
  for (const [k, v] of stored) if (!all.has(k)) all.set(k, v);
  return [...all.entries()].map(([key, r]) => ({
    key,
    slug: r.draft.slug,
    title: r.draft.title,
    system: Boolean(r.draft.system),
    published: Boolean(r.published),
    changed: JSON.stringify(r.draft) !== JSON.stringify(r.published),
    updatedAt: r.updatedAt,
    publishedAt: r.publishedAt,
  }));
}

export async function publishedPage(slug: string): Promise<PageDoc | null> {
  const row = await getPageRow(pageKey(slug));
  return row?.published ?? null;
}

export async function saveDraft(key: string, doc: PageDoc) {
  const current = await getPageRow(key);
  const clean = cleanPage({ ...doc, system: current?.draft.system });
  if (current?.draft.system) clean.slug = current.draft.slug; // built-in routes keep their address
  const next: PageRow = { draft: clean, published: current?.published ?? null, publishedAt: current?.publishedAt, updatedAt: new Date().toISOString() };
  await upsert("pages", key, next);
  return next;
}

export async function publishPage(key: string, note = "") {
  const row = await getPageRow(key);
  if (!row) return null;
  const now = new Date().toISOString();
  const next: PageRow = { ...row, published: row.draft, publishedAt: now, updatedAt: row.updatedAt || now };
  await upsert("pages", key, next);
  await insert("page_versions", { key, doc: row.draft, note: note.slice(0, 200), publishedAt: now });
  await audit("page.publish", key, `${row.draft.sections.length} sections`);
  return next;
}

export async function deletePage(key: string) {
  const row = await getPageRow(key);
  if (!row || row.draft.system) return false;
  await remove("pages", key);
  await audit("page.delete", key, row.draft.title);
  return true;
}

export async function pageVersions(key: string) {
  const rows = await list<{ key: string; doc: PageDoc; note: string; publishedAt: string }>("page_versions", { limit: 1000 });
  return rows.filter((r) => r.data.key === key).slice(0, 50).map((r) => ({ id: r.id, at: r.data.publishedAt, note: r.data.note, sections: r.data.doc.sections.length, doc: r.data.doc }));
}

// ---------- site config (and other single documents) ----------
export async function getDoc<T>(id: "site" | "quiz", fallback: T): Promise<Draftable<T>> {
  const row = await get<Draftable<T>>("content", id);
  return row?.data ?? { draft: fallback, published: fallback, updatedAt: "" };
}

export async function saveDocDraft<T>(id: "site" | "quiz", doc: T, fallback: T) {
  const current = await getDoc(id, fallback);
  const next: Draftable<T> = { ...current, draft: doc, updatedAt: new Date().toISOString() };
  await upsert("content", id, next);
  return next;
}

export async function publishDoc<T>(id: "site" | "quiz", fallback: T) {
  const current = await getDoc(id, fallback);
  const now = new Date().toISOString();
  const next: Draftable<T> = { ...current, published: current.draft, publishedAt: now };
  await upsert("content", id, next);
  await insert("page_versions", { key: `doc:${id}`, doc: current.draft, note: "", publishedAt: now });
  await audit(`${id}.publish`, id);
  return next;
}

export const getSite = async (which: "draft" | "published" = "published") => {
  const d = await getDoc<SiteConfig>("site", DEFAULT_SITE);
  return mergeSite((which === "draft" ? d.draft : d.published) ?? DEFAULT_SITE);
};

/** New settings added in later releases fall back to their defaults for older stored configs. */
export function mergeSite(s: Partial<SiteConfig>): SiteConfig {
  const d = DEFAULT_SITE;
  return {
    ...d,
    ...s,
    brand: { ...d.brand, ...s.brand },
    announcement: { ...d.announcement, ...s.announcement },
    footer: { ...d.footer, ...s.footer },
    contact: { ...d.contact, ...s.contact },
    theme: { ...d.theme, ...s.theme, colors: { ...d.theme.colors, ...s.theme?.colors }, fonts: { ...d.theme.fonts, ...s.theme?.fonts }, toggles: { ...d.theme.toggles, ...s.theme?.toggles } },
    seo: { ...d.seo, ...s.seo },
    analytics: { ...d.analytics, ...s.analytics },
    commerce: { ...d.commerce, ...s.commerce },
    popups: { ...d.popups, ...s.popups, exitIntent: { ...d.popups.exitIntent, ...s.popups?.exitIntent } },
  };
}
