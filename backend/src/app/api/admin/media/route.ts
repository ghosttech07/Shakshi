import { isAdmin } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import { saveUpload, type MediaData } from "@/lib/server/media";
import { audit } from "@/lib/server/content";
import { bad, json } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const rows = await list<MediaData>("media", { limit: 1000 });
  return json({ media: rows.map((r) => ({ id: r.id, at: r.created_at, ...r.data })) });
}

/** Upload: multipart with `file` and `alt`. Images are converted to WebP automatically. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Please choose a file to upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return bad("Please choose a file to upload.");
  try {
    const row = await saveUpload(file, String(form.get("alt") ?? ""));
    await audit("media.upload", row.id, row.data.name);
    return json({ id: row.id, ...row.data });
  } catch (e) {
    return bad((e as Error).message);
  }
}
