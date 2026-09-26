import { isAdmin } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import { bad, json } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const rows = await list<{ action: string; target: string; detail: string }>("audit_log", { limit: 300 });
  return json({ entries: rows.map((r) => ({ id: r.id, at: r.created_at, ...r.data })) });
}
