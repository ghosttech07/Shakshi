"use client";

import type { EventName } from "@shakshi/shared/records";

type Queued = { name: EventName; props: Record<string, string | number | boolean>; path: string; at: string };

let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function sessionId() {
  try {
    let id = sessionStorage.getItem("shk-sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("shk-sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function flush() {
  timer = null;
  if (!queue.length) return;
  const payload = JSON.stringify({ sessionId: sessionId(), events: queue.splice(0, 40) });
  const blob = new Blob([payload], { type: "application/json" });
  if (!navigator.sendBeacon?.("/api/events", blob)) {
    fetch("/api/events", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
}

if (typeof window !== "undefined") {
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
}

/**
 * Records a product event: stored for the admin funnel, and forwarded to Google Tag Manager
 * or gtag if either is installed on the page.
 */
export function track(name: EventName, props: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
  w.dataLayer?.push({ event: name, ...props });
  w.gtag?.("event", name, props);
  queue.push({ name, props, path: location.pathname, at: new Date().toISOString() });
  if (!timer) timer = setTimeout(flush, 2000);
}
