#!/usr/bin/env node
// Copies everything the site has stored on this computer (backend/.data) into Supabase, so the
// deployed site starts with your products, pages, settings, articles, orders and uploaded files.
//   npm run db:push
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in backend/.env.local or the environment),
// and the tables from backend/supabase/migrations already created. Safe to run again: rows are
// matched by id and replaced, files that are already uploaded are kept.
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(backendDir, "package.json"));
require("@next/env").loadEnvConfig(backendDir);
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.local first.");
  process.exit(1);
}
const dbFile = join(backendDir, ".data", "db.json");
if (!existsSync(dbFile)) {
  console.error("Nothing to copy: backend/.data/db.json doesn't exist.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
let db = JSON.parse(readFileSync(dbFile, "utf8"));

// 1. Uploaded files: into the "media" bucket, and every link to them updated
const mediaDir = join(backendDir, ".data", "media");
if (existsSync(mediaDir)) {
  const TYPES = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", avif: "image/avif", mp4: "video/mp4", webm: "video/webm", glb: "model/gltf-binary", pdf: "application/pdf", zip: "application/zip" };
  let text = JSON.stringify(db);
  const files = readdirSync(mediaDir);
  for (const name of files) {
    const type = TYPES[name.split(".").pop().toLowerCase()] ?? "application/octet-stream";
    const { error } = await sb.storage.from("media").upload(name, readFileSync(join(mediaDir, name)), { contentType: type, upsert: false, cacheControl: "31536000" });
    if (error && !/exists|Duplicate/i.test(error.message)) {
      console.error(`  file ${name}: ${error.message}`);
      continue;
    }
    const publicUrl = sb.storage.from("media").getPublicUrl(name).data.publicUrl;
    text = text.split(`/api/media/${name}`).join(publicUrl);
  }
  db = JSON.parse(text);
  console.log(`Files: ${files.length} uploaded to the media bucket.`);
}

// 2. Every table, in batches
let failed = false;
for (const [table, rows] of Object.entries(db)) {
  if (!Array.isArray(rows) || !rows.length) continue;
  let done = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500).map((r) => ({ id: r.id, created_at: r.created_at, status: r.status ?? null, email: r.email ?? null, data: r.data ?? {} }));
    const { error } = await sb.from(table).upsert(batch);
    if (error) {
      console.error(`  ${table}: ${error.message}`);
      failed = true;
      break;
    }
    done += batch.length;
  }
  console.log(`${table.padEnd(16)} ${done} of ${rows.length}`);
}
if (failed) {
  console.error("\nSome tables didn't copy. Did you run backend/supabase/migrations/*.sql in the Supabase SQL editor?");
  process.exit(1);
}
console.log("\nDone. The deployed site now has everything from this computer.");
