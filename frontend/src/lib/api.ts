"use client";

export const OFFLINE_MESSAGE = "We can't reach our booking system just now. Please try again shortly, or WhatsApp or call our concierge.";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; offline: boolean };

/**
 * POSTs JSON to the backend (through the storefront's /api proxy). Never throws: when the backend
 * is down it returns a friendly, ready-to-show message so the page can offer another way.
 */
export async function postJSON<T = Record<string, unknown>>(path: string, body: unknown, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), ...init });
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : null;
    if (res.ok && data) return { ok: true, data: data as T };
    // A proxy error page (HTML) or 5xx means the backend isn't answering.
    if (!isJson || res.status >= 500) return { ok: false, error: OFFLINE_MESSAGE, offline: true };
    return { ok: false, error: (data as { error?: string })?.error ?? "Something went wrong. Please try again.", offline: false };
  } catch {
    return { ok: false, error: OFFLINE_MESSAGE, offline: true };
  }
}
