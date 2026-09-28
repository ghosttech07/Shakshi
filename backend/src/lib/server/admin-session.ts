import { SignJWT, jwtVerify } from "jose";

/**
 * Studio (admin) sessions. Used by src/proxy.ts to guard every studio page and admin API,
 * and again inside those pages and routes as a second lock.
 *
 * Environment:
 *   ADMIN_PATH            the studio's URL segment, e.g. "admin" (no slashes)
 *   ADMIN_PASSWORD_HASH   bcrypt hash of the studio password (npm run studio:hash -- "password")
 *   ADMIN_SESSION_SECRET  32+ random characters used to sign session tokens
 */

export const ADMIN_COOKIE = "shk_studio";
export const SESSION_HOURS = 8;
export const INTERNAL_PREFIX = "/studio-internal";

// Addresses the backend already uses for other things.
const RESERVED = ["api", "_next", "studio-internal", "brand", "hero", "icon", "login"];

/**
 * The bcrypt hash from the environment. In .env files each "$" is written as "\$" (Next expands
 * "$" there); dashboards like Vercel's take the hash as-is. Either form works: a bcrypt hash never
 * contains a backslash or quotes, so those are simply removed.
 */
export function passwordHash(): string {
  return (process.env.ADMIN_PASSWORD_HASH ?? "").trim().replace(/\\\$/g, "$").replace(/^["']|["']$/g, "");
}

/** "/<ADMIN_PATH>" (default "/admin"), or null when the studio isn't configured (then it simply doesn't exist). */
export function adminBase(): string | null {
  const p = process.env.ADMIN_PATH?.trim() || "admin";
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/i.test(p) || RESERVED.includes(p.toLowerCase())) return null;
  if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(passwordHash()) || !secretBytes()) return null;
  return `/${p}`;
}

function secretBytes() {
  const s = process.env.ADMIN_SESSION_SECRET ?? "";
  return s.length >= 32 ? new TextEncoder().encode(s) : null;
}

export async function signSession() {
  return new SignJWT({ role: "studio" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .setIssuer("shakshi-studio")
    .sign(secretBytes()!);
}

export async function verifySession(token: string | undefined) {
  const key = secretBytes();
  if (!token || !key) return false;
  try {
    const { payload } = await jwtVerify(token, key, { issuer: "shakshi-studio", algorithms: ["HS256"] });
    return payload.role === "studio";
  } catch {
    return false;
  }
}

export const cookieOptions = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
});
