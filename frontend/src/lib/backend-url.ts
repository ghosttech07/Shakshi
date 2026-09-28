/**
 * The backend's address (API_URL), tidied so small slips in a hosting dashboard don't break the
 * shop: a missing "https://" is added and trailing slashes are dropped.
 * Plain module: also imported by next.config.ts.
 */
export function backendUrl(): string {
  let v = (process.env.API_URL ?? "").trim().replace(/\/+$/, "");
  if (!v) return "http://localhost:4000";
  if (!/^https?:\/\//i.test(v)) v = `${/^(localhost|127\.)/.test(v) ? "http" : "https"}://${v}`;
  return v;
}

/** The studio's origin, the only site allowed to frame /preview. */
export function studioOrigin(): string {
  const v = process.env.STUDIO_ORIGIN?.trim();
  try {
    return new URL(v || backendUrl()).origin;
  } catch {
    return new URL(backendUrl()).origin;
  }
}
