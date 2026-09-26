#!/usr/bin/env node
// Sets up the studio (admin) for this machine:
//   npm run studio:setup                   → random password, printed once
//   npm run studio:setup -- "my password"  → your own password (12+ characters)
// Writes backend/.env.local and frontend/.env.local (both gitignored). Existing keys are kept
// unless they're the ones being set. Only the bcrypt hash of the password is stored.
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const given = process.argv[2];
if (given && given.length < 12) {
  console.error("Please choose a password of at least 12 characters.");
  process.exit(1);
}
const password = given ?? randomBytes(12).toString("base64url");
const hash = await bcrypt.hash(password, 12);

function merge(file, values) {
  const lines = existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/) : [];
  const keep = lines.filter((l) => !Object.keys(values).some((k) => l.startsWith(`${k}=`)));
  // Next.js expands $VAR in .env files, so every literal $ (bcrypt hashes are full of them) is escaped.
  const add = Object.entries(values).map(([k, v]) => `${k}=${String(v).replaceAll("$", "\\$")}`);
  writeFileSync(file, [...keep.filter(Boolean), ...add].join("\n") + "\n");
}

const backendEnv = join(root, "backend", ".env.local");
const frontendEnv = join(root, "frontend", ".env.local");
const existing = existsSync(backendEnv) ? readFileSync(backendEnv, "utf8") : "";
const keep = (k) => existing.match(new RegExp(`^${k}=(.+)$`, "m"))?.[1];

const adminPath = keep("ADMIN_PATH") ?? `studio-${randomBytes(6).toString("hex")}`;
const revalidate = keep("REVALIDATE_SECRET") ?? randomBytes(24).toString("hex");

merge(backendEnv, {
  ADMIN_PATH: adminPath,
  ADMIN_PASSWORD_HASH: hash,
  ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
  REVALIDATE_SECRET: revalidate,
  FRONTEND_URL: keep("FRONTEND_URL") ?? "http://localhost:3000",
});
merge(frontendEnv, { API_URL: "http://localhost:4000", REVALIDATE_SECRET: revalidate });

console.log("\nStudio ready.");
console.log(`  Address:  http://localhost:4000/${adminPath}`);
console.log(given ? "  Password: (the one you chose)" : `  Password: ${password}`);
console.log("\nKeep both somewhere safe. Changing the password signs everyone out.\n");
