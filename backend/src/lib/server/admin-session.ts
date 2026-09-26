import { SignJWT, jwtVerify } from "jose";

/**
 * Studio (admin) sessions. Used by src/proxy.ts to guard every studio page and admin API,
 * and again inside those pages and routes as a second lock.
 *
 * Environment:
 *   ADMIN_PATH            the secret URL segment, e.g. "studio-7fq2m9xk" (no slashes)
 *   ADMIN_PASSWORD_HASH   bcrypt hash of the studio password (npm run studio:hash -- "password")
 *   ADMIN_SESSION_SECRET  32+ random characters used to sign session tokens
 */

export const ADMIN_COOKIE = "shk_studio";
export const SESSION_HOURS = 8;
export const INTERNAL_PREFIX = "/studio-internal";

/** "/<ADMIN_PATH>", or null when the studio isn't configured (then it simply doesn't exist). */
export function adminBase(): string | null {
  const p = process.env.ADMIN_PATH?.trim();
  if (!p || !/^[a-z0-9][a-z0-9-]{7,63}$/i.test(p)) return null;
  if (!process.env.ADMIN_PASSWORD_HASH || !secretBytes()) return null;
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
