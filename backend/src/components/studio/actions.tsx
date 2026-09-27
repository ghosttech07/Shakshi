"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

/** JSON request to a studio API. Resolves to the parsed body, or throws with the server's message. */
export async function api<T = { ok: true }>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, { method, headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) {
    location.reload(); // session expired: the proxy will show the sign-in screen
    throw new Error("Your session has ended. Please sign in again.");
  }
  if (!r.ok) throw Object.assign(new Error(j.error ?? "Something went wrong."), { data: j });
  return j as T;
}

/** A status dropdown that saves as soon as it changes. */
export function StatusSelect({ url, value, options, field = "status", label }: { url: string; value: string; options: { value: string; label: string }[]; field?: string; label: string }) {
  const router = useRouter();
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col gap-1">
      <select
        aria-label={label}
        className="field py-1.5 pr-8 text-sm"
        value={v}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = v;
          setV(next);
          setError("");
          start(async () => {
            try {
              await api("PATCH", url, { [field]: next });
              router.refresh();
            } catch (err) {
              setV(prev);
              setError((err as Error).message);
            }
          });
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-bad">{error}</span>}
    </span>
  );
}

/** A button that asks first, then calls an API and refreshes the page. */
export function ActionButton({
  url,
  method = "PATCH",
  body,
  confirm,
  children,
  className = "btn btn-line btn-sm",
  after,
}: {
  url: string;
  method?: "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  confirm?: string;
  children: ReactNode;
  className?: string;
  after?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError("");
          start(async () => {
            try {
              await api(method, url, body);
              if (after) router.push(after);
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
            }
          });
        }}
      >
        {pending ? "…" : children}
      </button>
      {error && <span className="max-w-xs text-xs text-bad">{error}</span>}
    </span>
  );
}
