import { isAdmin } from "@/lib/server/studio";
import { upsert } from "@/lib/server/db";
import { audit } from "@/lib/server/content";
import { getArticles } from "@/lib/server/catalog";
import { bad, body, json, str } from "@/lib/server/http";
import { IMG } from "@shakshi/shared/images";

export const runtime = "nodejs";

/** Starts a new essay as a draft. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body(req);
  const title = str(b?.title, 160);
  const slug = str(b?.slug, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!title || !slug) return bad("Give the essay a title and an address.");
  if ((await getArticles({ all: true })).some((a) => a.slug === slug)) return bad("An essay already uses that address.");
  await upsert("articles", slug, {
    title,
    dek: "",
    category: "Sleep hygiene",
    author: "The Shakshi atelier",
    date: new Date().toISOString().slice(0, 10),
    readMins: 5,
    image: IMG.sleepSoft,
    imageAlt: "",
    related: [],
    body: [],
    html: "<p>Begin here.</p>",
    published: false,
  });
  await audit("article.create", slug, title);
  return json({ slug });
}
