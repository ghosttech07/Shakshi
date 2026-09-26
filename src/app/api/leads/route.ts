import { insert } from "@/lib/server/db";
import { bad, body, isEmail, json, limited, str } from "@/lib/server/http";

export const runtime = "nodejs";

const KINDS = ["hospitality", "contact", "newsletter", "swatches"] as const;

/** Every enquiry form lands here: hospitality, contact, newsletter and swatch requests. */
export async function POST(req: Request) {
  if (limited(req, "leads", 8)) return bad("Too many attempts. Please wait a moment.", 429);
  const b = await body(req);
  if (!b) return bad("Bad request");
  const kind = b.kind as (typeof KINDS)[number];
  if (!KINDS.includes(kind)) return bad("Bad request");
  const email = str(b.email, 120).toLowerCase();
  if (!isEmail(email)) return bad("Please share a valid email address.");

  // Keep only short string fields; forms never need more.
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries((b.fields as Record<string, unknown>) ?? {})) {
    if (Object.keys(fields).length >= 20) break;
    const val = typeof v === "string" ? str(v, 1000) : Array.isArray(v) ? v.filter((x) => typeof x === "string").join(", ").slice(0, 300) : typeof v === "number" ? String(v) : "";
    if (val) fields[str(k, 40)] = val;
  }
  const row = await insert("leads", { kind, fields }, { email, status: "new" });
  return json({ id: row.id });
}
