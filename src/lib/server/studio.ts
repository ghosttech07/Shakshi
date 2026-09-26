import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ADMIN_COOKIE, adminBase, verifySession } from "./admin-session";

/** Inside studio pages and admin routes: is this request signed in? (The proxy already checked; this is the second lock.) */
export async function isAdmin() {
  if (!adminBase()) return false;
  return verifySession((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** For studio pages: returns the studio base path, or sends the visitor to sign in. */
export async function requireStudio(): Promise<string> {
  const base = adminBase();
  if (!base) notFound();
  if (!(await isAdmin())) redirect(`${base}/login`);
  return base;
}
