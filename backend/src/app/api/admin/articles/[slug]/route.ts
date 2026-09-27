import { isAdmin } from "@/lib/server/studio";
import { get, upsert } from "@/lib/server/db";
import { audit, cleanHtml } from "@/lib/server/content";
import { notifyStorefront } from "@/lib/server/notify";
import { getArticles, type ArticleRow } from "@/lib/server/catalog";
import { shape } from "@/lib/server/shape";
import { bad, body, json } from "@/lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ slug: string }> };

const TEMPLATE = { title: "", dek: "", category: "", author: "", date: "", readMins: 5, image: "", imageAlt: "", related: [""], html: "", published: false, publishAt: "" };

/** Saves an essay. Its text is sanitised; reading time is estimated from the words. */
export async function PUT(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const slug = decodeURIComponent((await ctx.params).slug);
  if (!(await getArticles({ all: true })).some((a) => a.slug === slug)) return bad("Not found", 404);
  const b = await body<{ article: Record<string, unknown> }>(req, 400_000);
  if (!b?.article) return bad("Bad request");
  const a = shape(TEMPLATE, b.article, 200_000);
  if (!a.title.trim()) return bad("The essay needs a title.");
  if (a.published && a.imageAlt.trim().length < 3) return bad("Describe the main image (alt text) before publishing.");
  const html = cleanHtml(a.html);
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const existing = await get<ArticleRow>("articles", slug);
  await upsert("articles", slug, {
    ...(existing?.data ?? {}),
    ...a,
    html,
    related: a.related.filter(Boolean),
    readMins: Math.max(1, Math.round(words / 220)),
    date: /^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : new Date().toISOString().slice(0, 10),
    publishAt: a.publishAt ? new Date(`${a.publishAt.slice(0, 10)}T07:00:00+05:30`).toISOString() : undefined,
  });
  await audit("article.save", slug, a.published ? (a.publishAt ? `scheduled ${a.publishAt.slice(0, 10)}` : "published") : "draft");
  await notifyStorefront();
  return json({ ok: true, readMins: Math.max(1, Math.round(words / 220)) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const slug = decodeURIComponent((await ctx.params).slug);
  const existing = await get<ArticleRow>("articles", slug);
  await upsert("articles", slug, { ...(existing?.data ?? {}), deleted: true, published: false });
  await audit("article.delete", slug);
  await notifyStorefront();
  return json({ ok: true });
}
