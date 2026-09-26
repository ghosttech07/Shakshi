import { isAdmin } from "@/lib/server/studio";
import { audit, getPageRow, pageVersions, saveDraft } from "@/lib/server/content";
import { bad, body, json, str } from "@/lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ key: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  return json({ versions: await pageVersions(decodeURIComponent((await params).key)) });
}

/**
 * Restores a published version into the draft: the whole page, or just one section of it
 * (put back in place, or appended if it no longer exists). Publish to make it live.
 */
export async function POST(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const key = decodeURIComponent((await params).key);
  const b = await body(req);
  const versionId = str(b?.versionId, 60);
  const sectionId = str(b?.sectionId, 60);
  const version = (await pageVersions(key)).find((v) => v.id === versionId);
  const row = await getPageRow(key);
  if (!version || !row) return bad("Version not found", 404);
  let doc = version.doc;
  if (sectionId) {
    const sec = version.doc.sections.find((s) => s.id === sectionId);
    if (!sec) return bad("That section isn't in this version.");
    const sections = row.draft.sections.some((s) => s.id === sectionId) ? row.draft.sections.map((s) => (s.id === sectionId ? sec : s)) : [...row.draft.sections, sec];
    doc = { ...row.draft, sections };
  }
  await saveDraft(key, doc);
  await audit("page.restore", key, sectionId ? `section ${sectionId} from ${version.at}` : `version ${version.at}`);
  return json({ ok: true });
}
