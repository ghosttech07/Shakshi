"use client";

import { useState, type FormEvent } from "react";

/** One password field. Checked on the server; failures always read the same. */
export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.next) {
        location.assign(j.next);
        return;
      }
      // 503 is a setup problem on the server (no database), never a hint about the password
      setError(r.status === 503 && j.error ? j.error : "Incorrect password");
    } catch {
      setError("Incorrect password");
    }
    setPassword("");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-12 space-y-4" noValidate>
      <label htmlFor="password" className="sr-only">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-invalid={!!error}
        aria-describedby={error ? "login-error" : undefined}
        className="w-full rounded-md border border-pearl/20 bg-pearl/[0.04] px-4 py-3 text-center text-pearl placeholder:text-pearl/35 focus:border-gold focus:outline-none"
      />
      <button type="submit" disabled={busy || !password} className="btn btn-gold w-full py-3 text-xs uppercase tracking-[0.25em]">
        {busy ? "Checking…" : "Enter"}
      </button>
      <p id="login-error" role="alert" className="min-h-5 text-sm text-gold-soft">
        {error}
      </p>
    </form>
  );
}
