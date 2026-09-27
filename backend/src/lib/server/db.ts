import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * One small storage interface for everything the site records.
 * With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set it talks to Supabase (schema in supabase/migrations);
 * otherwise it keeps a JSON file in .data/ so the whole site works locally with no setup.
 */
export type Table =
  | "orders"
  | "bookings"
  | "leads"
  | "abandoned_carts"
  | "events"
  | "reviews"
  | "gift_cards"
  | "warranties"
  | "referrals"
  | "stock"
  | "products"
  | "articles"
  | "login_attempts"
  | "discount_codes"
  | "settings"
  | "pages"
  | "page_versions"
  | "content"
  | "media"
  | "audit_log";

export type Row<T = Record<string, unknown>> = {
  id: string;
  created_at: string;
  status: string | null;
  email: string | null;
  data: T;
};

type Query = { status?: string; email?: string; limit?: number; since?: string };

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const backend: "supabase" | "local" = url && key ? "supabase" : "local";

let client: SupabaseClient | null = null;
const sb = () => (client ??= createClient(url!, key!, { auth: { persistSession: false } }));

// ---------- local JSON adapter ----------
const FILE = path.join(process.cwd(), ".data", "db.json");
type LocalDb = Partial<Record<Table, Row[]>>;
let queue: Promise<unknown> = Promise.resolve();

async function readLocal(): Promise<LocalDb> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

/** Serialises reads and writes so concurrent requests never clobber the file. */
function withLocal<T>(fn: (db: LocalDb) => T, write = false): Promise<T> {
  const run = queue.then(async () => {
    const db = await readLocal();
    const out = fn(db);
    if (write) {
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(db));
    }
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

const matches = (r: Row, q: Query) =>
  (!q.status || r.status === q.status) && (!q.email || r.email === q.email) && (!q.since || r.created_at >= q.since);

function fail(error: { message: string } | null) {
  if (error) throw new Error(`[db] ${error.message}`);
}

// ---------- public API ----------
export async function insert<T>(table: Table, data: T, opts: { id?: string; status?: string; email?: string } = {}): Promise<Row<T>> {
  const row: Row<T> = {
    id: opts.id ?? randomUUID(),
    created_at: new Date().toISOString(),
    status: opts.status ?? null,
    email: opts.email?.toLowerCase() ?? null,
    data,
  };
  if (backend === "supabase") {
    const { error } = await sb().from(table).insert(row);
    fail(error);
    return row;
  }
  return withLocal((db) => {
    (db[table] ??= []).unshift(row as Row);
    return row;
  }, true);
}

export async function insertMany<T>(table: Table, items: T[]): Promise<void> {
  if (!items.length) return;
  const now = new Date().toISOString();
  const rows = items.map((data) => ({ id: randomUUID(), created_at: now, status: null, email: null, data }));
  if (backend === "supabase") {
    const { error } = await sb().from(table).insert(rows);
    return fail(error);
  }
  await withLocal((db) => {
    const list = (db[table] ??= []);
    list.unshift(...(rows as Row[]));
    if (table === "events" && list.length > 20000) list.length = 20000;
  }, true);
}

export async function list<T>(table: Table, q: Query = {}): Promise<Row<T>[]> {
  const limit = q.limit ?? 500;
  if (backend === "supabase") {
    let req = sb().from(table).select("*").order("created_at", { ascending: false }).limit(limit);
    if (q.status) req = req.eq("status", q.status);
    if (q.email) req = req.eq("email", q.email.toLowerCase());
    if (q.since) req = req.gte("created_at", q.since);
    const { data, error } = await req;
    fail(error);
    return (data ?? []) as Row<T>[];
  }
  return withLocal((db) => ((db[table] ?? []).filter((r) => matches(r, q)).slice(0, limit) as Row<T>[]));
}

export async function get<T>(table: Table, id: string): Promise<Row<T> | null> {
  if (backend === "supabase") {
    const { data, error } = await sb().from(table).select("*").eq("id", id).maybeSingle();
    fail(error);
    return (data as Row<T>) ?? null;
  }
  return withLocal((db) => ((db[table] ?? []).find((r) => r.id === id) as Row<T>) ?? null);
}

/** Merges `data` into the stored JSON and optionally sets status. */
export async function update<T>(table: Table, id: string, patch: { status?: string | null; data?: Partial<T> }): Promise<Row<T> | null> {
  const current = await get<T>(table, id);
  if (!current) return null;
  const next: Row<T> = {
    ...current,
    status: patch.status === undefined ? current.status : patch.status,
    data: { ...current.data, ...(patch.data ?? {}) } as T,
  };
  if (backend === "supabase") {
    const { error } = await sb().from(table).update({ status: next.status, data: next.data }).eq("id", id);
    fail(error);
    return next;
  }
  return withLocal((db) => {
    const i = (db[table] ?? []).findIndex((r) => r.id === id);
    if (i >= 0) db[table]![i] = next as Row;
    return next;
  }, true);
}

/** Insert-or-replace by id (used for carts, stock and catalogue overrides). */
export async function upsert<T>(table: Table, id: string, data: T, opts: { status?: string; email?: string } = {}): Promise<Row<T>> {
  const existing = await get<T>(table, id);
  const row: Row<T> = {
    id,
    created_at: existing?.created_at ?? new Date().toISOString(),
    status: opts.status ?? existing?.status ?? null,
    email: opts.email?.toLowerCase() ?? existing?.email ?? null,
    data,
  };
  if (backend === "supabase") {
    const { error } = await sb().from(table).upsert(row);
    fail(error);
    return row;
  }
  return withLocal((db) => {
    const rows = (db[table] ??= []);
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) rows[i] = row as Row;
    else rows.unshift(row as Row);
    return row;
  }, true);
}

export async function remove(table: Table, id: string): Promise<void> {
  if (backend === "supabase") {
    const { error } = await sb().from(table).delete().eq("id", id);
    return fail(error);
  }
  await withLocal((db) => {
    db[table] = (db[table] ?? []).filter((r) => r.id !== id);
  }, true);
}
