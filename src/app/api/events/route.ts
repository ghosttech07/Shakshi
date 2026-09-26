import { insertMany } from "@/lib/server/db";
import { body, json, limited, str } from "@/lib/server/http";
import { EVENT_NAMES } from "@/lib/records";

export const runtime = "nodejs";

/** Receives batched analytics beacons. Unknown event names and oversized payloads are dropped. */
export async function POST(req: Request) {
  if (limited(req, "events", 120)) return json({ ok: false }, 429);
  const b = await body<{ events?: unknown[]; sessionId?: string }>(req, 24_000);
  if (!b || !Array.isArray(b.events)) return json({ ok: false }, 400);
  const sessionId = str(b.sessionId, 60);
  const events = b.events.slice(0, 40).flatMap((e) => {
    if (!e || typeof e !== "object") return [];
    const ev = e as Record<string, unknown>;
    const name = str(ev.name, 40);
    if (!(EVENT_NAMES as readonly string[]).includes(name)) return [];
    const props: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries((ev.props as Record<string, unknown>) ?? {}).slice(0, 12)) {
      if (typeof v === "string") props[str(k, 30)] = str(v, 120);
      else if (typeof v === "number" || typeof v === "boolean") props[str(k, 30)] = v;
    }
    return [{ name, props, path: str(ev.path, 200), sessionId, at: str(ev.at, 40) }];
  });
  await insertMany("events", events);
  return json({ ok: true });
}
