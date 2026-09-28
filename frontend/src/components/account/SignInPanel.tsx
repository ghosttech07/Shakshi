"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { applySnapshot, requestCode, saveAccount, verifyCode } from "@/lib/account-client";
import { useAccount } from "@/lib/account";
import { cn } from "@shakshi/shared/utils";

type Step = "email" | "code" | "name";

/**
 * Sign in or create an account with no password: we email a one-time code, the customer types it,
 * and their account (orders, wishlist, rewards) is theirs on any device.
 */
export function SignInPanel({ title = "Sign in to your account", intro, onDone, className }: { title?: string; intro?: string; onDone?: () => void; className?: string }) {
  // Already verified but no name yet (e.g. a new customer who left before giving it): ask only for the name
  const signedIn = useAccount((s) => s.profile);
  const [step, setStep] = useState<Step>(signedIn && !signedIn.name ? "name" : "email");
  const [email, setEmail] = useState(signedIn?.email ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  useEffect(() => {
    if (step === "code") codeInput.current?.focus();
  }, [step]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return setError("Please enter a valid email address.");
    setBusy(true);
    setError("");
    const r = await requestCode(v);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setEmail(v);
    setCode("");
    setStep("code");
    setWait(45);
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.replace(/\s/g, "");
    if (!/^\d{6,10}$/.test(c)) return setError("Please enter the code from your email.");
    setBusy(true);
    setError("");
    const r = await verifyCode(email, c);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    await applySnapshot(r.data);
    if (!r.data.profile.name) return setStep("name");
    onDone?.();
  };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setError("Please tell us your name.");
    setBusy(true);
    setError("");
    const r = await saveAccount({ name: n });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    useAccount.getState().setName(n);
    onDone?.();
  };

  return (
    <div className={cn("border border-gold/40 bg-gold/[0.05] p-7 sm:p-9", className)}>
      <p className="eyebrow text-gold-ink">{step === "name" ? "Welcome to Shakshi" : "No password needed"}</p>
      <p className="display mt-3 text-3xl">{step === "email" ? title : step === "code" ? "Check your email." : "What shall we call you?"}</p>

      {step === "email" && (
        <form onSubmit={send} noValidate>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone">{intro ?? "Enter your email and we'll send you a sign-in code. Your orders, invoices, wishlist and rewards are then yours on any device."}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label htmlFor="signin-email">
              <span className="eyebrow text-stone">Email</span>
              <input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" className="field" />
            </label>
            <button type="submit" disabled={busy} className="btn btn-dark">
              {busy ? "Sending…" : "Email me a code"}
            </button>
          </div>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verify} noValidate>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone">
            We&rsquo;ve sent a code to <b className="text-ink">{email}</b>. It may take a minute to arrive; check your spam folder too.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label htmlFor="signin-code">
              <span className="eyebrow text-stone">Code</span>
              <input
                id="signin-code"
                ref={codeInput}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Code from your email"
                className="field text-lg tracking-[0.3em] placeholder:tracking-normal placeholder:text-base"
              />
            </label>
            <button type="submit" disabled={busy} className="btn btn-dark">
              {busy ? "Checking…" : "Sign in"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.18em] text-stone">
            <button type="button" onClick={() => send()} disabled={busy || wait > 0} className="hover:text-ink disabled:opacity-50">
              {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
            </button>
            <button type="button" onClick={() => (setStep("email"), setError(""))} className="hover:text-ink">
              Use a different email
            </button>
          </div>
        </form>
      )}

      {step === "name" && (
        <form onSubmit={saveName} noValidate>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone">You&rsquo;re signed in as {email}. Your name is how we&rsquo;ll greet you and address your deliveries.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label htmlFor="signin-name">
              <span className="eyebrow text-stone">Full name</span>
              <input id="signin-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="field" />
            </label>
            <button type="submit" disabled={busy} className="btn btn-dark">
              {busy ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-3 text-xs text-[#9a5a4a]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
