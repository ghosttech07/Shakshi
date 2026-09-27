"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAccount, pointsFor, type ThemePref } from "@/lib/account";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { tierFor } from "@shakshi/shared/orders";
import { RecommendedRow } from "@/components/commerce/RecommendedRow";
import { Orders } from "./Orders";
import { Rewards, useReferralCount } from "./Rewards";

const SECTIONS = [
  { id: "orders", label: "Orders" },
  { id: "rewards", label: "Rewards" },
  { id: "settings", label: "Settings" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Still awake" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function SignIn() {
  const signIn = useAccount((s) => s.signIn);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please share your name and a valid email.");
    signIn(name, email);
  };
  return (
    <form onSubmit={submit} className="border border-gold/40 bg-gold/[0.05] p-7 sm:p-9">
      <p className="eyebrow text-gold-ink">Welcome</p>
      <p className="display mt-3 text-3xl">Make this your account.</p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone">Your orders and rewards are kept privately on this device. Tell us your name to be greeted properly, and to receive your referral link.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label>
          <span className="eyebrow text-stone">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="field" />
        </label>
        <label>
          <span className="eyebrow text-stone">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="field" />
        </label>
        <button type="submit" className="btn btn-dark">
          Continue
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-[#9a5a4a]" role="alert">{error}</p>}
    </form>
  );
}

function Settings() {
  const theme = useAccount((s) => s.theme);
  const setTheme = useAccount((s) => s.setTheme);
  const signOut = useAccount((s) => s.signOut);
  const profile = useAccount((s) => s.profile);
  const [confirm, setConfirm] = useState(false);

  const forget = () => {
    try {
      localStorage.removeItem("shakshi-account");
      localStorage.removeItem("shakshi-store");
      localStorage.removeItem("shakshi-helpful");
    } catch {}
    location.href = "/";
  };

  return (
    <section id="settings" className="scroll-mt-28" aria-labelledby="settings-title">
      <h2 id="settings-title" className="display text-4xl">
        Settings
      </h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <fieldset className="border border-ink/10 p-6">
          <legend className="eyebrow px-2 text-stone">Appearance</legend>
          <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
            {([
              ["auto", "Follow the time of day"],
              ["day", "Always day"],
              ["night", "Always night"],
            ] as [ThemePref, string][]).map(([v, l]) => (
              <button key={v} role="radio" aria-checked={theme === v} className="chip" onClick={() => setTheme(v)}>
                {l}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone">Night mode turns the site moonlit from 7pm to 6am.</p>
        </fieldset>
        <div className="border border-ink/10 p-6">
          <p className="eyebrow text-stone">Your data</p>
          <p className="mt-3 text-sm text-stone">Everything here lives in this browser. Orders are also kept by our team, reachable only with your order&rsquo;s private link.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {profile && (
              <button onClick={signOut} className="btn btn-outline !py-3">
                Sign out
              </button>
            )}
            {confirm ? (
              <button onClick={forget} className="btn btn-dark !py-3">
                Yes, forget this device
              </button>
            ) : (
              <button onClick={() => setConfirm(true)} className="text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
                Forget this device
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AccountClient() {
  const hydrated = useHydrated();
  const account = useAccount();
  const wishlist = useStore((s) => s.wishlist);
  const referrals = useReferralCount(account.referralCode);
  const tier = tierFor(pointsFor(account, referrals).total);

  if (!hydrated) return <div className="skeleton mt-10 h-[60vh]" />;
  const first = account.profile?.name.split(" ")[0];
  const placed = account.orders.filter((o) => !o.sample).length;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-gold-ink">Your account</p>
          <h1 className="display mt-4 text-5xl sm:text-6xl">
            {greeting()}
            {first ? `, ${first}` : ""}.
          </h1>
          <p className="mt-3 text-sm text-stone">
            {tier.name} member · {placed} order{placed === 1 ? "" : "s"} · {wishlist.length} saved
          </p>
        </div>
        <nav aria-label="Account sections" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="chip shrink-0">
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      {!account.profile && (
        <div className="mt-12">
          <SignIn />
        </div>
      )}

      <div className="mt-16 space-y-24">
        <Orders />
        <Rewards />
        <Settings />
      </div>
      <RecommendedRow className="!px-0" />
      <p className="mt-10 text-center text-sm text-stone">
        Need a hand?{" "}
        <Link href="/showroom#contact" className="link-lux text-ink">
          Talk to a concierge
        </Link>
        .
      </p>
    </>
  );
}
