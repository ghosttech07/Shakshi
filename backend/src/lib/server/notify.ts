/**
 * Asks the storefront to refresh its cached pages after a studio edit.
 * Best effort: if the storefront is down, the edit is saved regardless and pages refresh on their own timer.
 */
export async function notifyStorefront() {
  const url = (process.env.FRONTEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  try {
    await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: "{}",
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    console.warn("[notify] storefront not reachable; it will refresh on its own timer", (e as Error).message);
  }
}
