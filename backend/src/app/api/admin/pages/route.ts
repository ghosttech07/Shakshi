import { isAdmin } from "@/lib/server/studio";
import { audit, cleanPage, getPageRow, listPages, saveDraft } from "@/lib/server/content";
import { bad, body, json, str } from "@/lib/server/http";
import { pageKey } from "@shakshi/shared/cms/defaults";
import type { PageDoc } from "@shakshi/shared/cms/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  return json({ pages: await listPages() });
}

/** Creates a custom page (starting from a header and a text block) at a new address. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body(req);
  const title = str(b?.title, 120);
  const slug = str(b?.slug, 80).toLowerCase().replace(/[^a-z0-9/-]/g, "-").replace(/-+/g, "-").replace(/^[-/]+|[-/]+$/g, "");
  if (!title || !slug) return bad("Give the page a title and an address.");
  const reserved = ["api", "account", "checkout", "mattress", "gift", "wishlist", "preview", "_next"];
  if (reserved.includes(slug.split("/")[0])) return bad("That address is used by the shop. Please choose another.");
  if (await getPageRow(pageKey(slug))) return bad("A page already lives at that address.");
  const doc: PageDoc = cleanPage({
    slug,
    title,
    seo: { title, description: "" },
    sections: [
      { id: "s1", type: "page-header", data: { eyebrow: "", title, intro: "", tone: "light" } },
      { id: "s2", type: "rich-text", data: { body: "<p>Start writing here.</p>", width: "narrow" } },
    ],
  });
  await saveDraft(pageKey(slug), doc);
  await audit("page.create", pageKey(slug), title);
  return json({ key: pageKey(slug) });
}
