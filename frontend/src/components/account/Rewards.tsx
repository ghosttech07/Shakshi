"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { makeReferralCode, pointsFor, useAccount } from "@/lib/account";
import { REFERRAL_REWARD, TIERS, tierFor } from "@shakshi/shared/orders";
import { EASE, formatINR } from "@shakshi/shared/utils";
import { IconCheck, IconWhatsApp, IconGift } from "@/components/ui/Icons";

export function useReferralCount(code: string | null) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!code) return;
    fetch(`/api/referrals?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((j) => setCount(j.count ?? 0))
      .catch(() => {});
  }, [code]);
  return count;
}

export function Rewards() {
  const account = useAccount();
  const { profile, referralCode, setReferralCode } = account;
  const referrals = useReferralCount(referralCode);
  const pts = pointsFor(account, referrals);
  const tier = tierFor(pts.total);
  const next = TIERS.find((t) => t.min > pts.total);
  const progress = next ? (pts.total - tier.min) / (next.min - tier.min) : 1;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Every member gets a personal code, registered so friends' orders can be credited.
  useEffect(() => {
    if (!profile || referralCode) return;
    const code = makeReferralCode(profile.name);
    fetch("/api/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, name: profile.name }) })
      .then((r) => (r.ok ? setReferralCode(code) : setError("We couldn't create your referral link just now.")))
      .catch(() => setError("We couldn't create your referral link just now."));
  }, [profile, referralCode, setReferralCode]);

  const link = referralCode && typeof window !== "undefined" ? `${location.origin}/?ref=${referralCode}` : "";
  const message = `I sleep on Shakshi and thought you'd love it. Here's ${formatINR(REFERRAL_REWARD)} off your first mattress: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const share = () => navigator.share?.({ title: "Shakshi", text: message, url: link }).catch(() => {});

  return (
    <section id="rewards" className="scroll-mt-28" aria-labelledby="rewards-title">
      <h2 id="rewards-title" className="display text-4xl">
        Sleep Society
      </h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden bg-midnight p-7 text-pearl linen-dark sm:p-9">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
          <p className="eyebrow text-gold">Your tier</p>
          <p className="display mt-3 text-5xl">{tier.name}</p>
          <p className="mt-6 font-serif text-4xl tabular-nums">
            {pts.total.toLocaleString("en-IN")} <span className="text-lg text-pearl/60">points</span>
          </p>
          <div className="mt-5 h-[3px] rounded-full bg-pearl/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={next ? `Progress to ${next.name}` : "Highest tier reached"}>
            <motion.div className="h-full rounded-full bg-gold" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1.4, ease: EASE }} />
          </div>
          <p className="mt-2 text-xs text-pearl/60">{next ? `${(next.min - pts.total).toLocaleString("en-IN")} points to ${next.name}` : "You've reached our highest circle."}</p>
          <ul className="mt-6 space-y-2 text-sm text-pearl/80">
            {tier.perks.map((p) => (
              <li key={p} className="flex gap-2">
                <IconCheck size={16} className="mt-0.5 shrink-0 text-gold" /> {p}
              </li>
            ))}
          </ul>
          <dl className="mt-7 grid grid-cols-2 gap-3 border-t border-pearl/10 pt-5 text-xs text-pearl/60 sm:grid-cols-4">
            {[
              ["Purchases", pts.purchases],
              ["Reviews", pts.reviews],
              ["Referrals", pts.referrals],
              ["Journal", pts.journal],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className="font-serif text-xl text-pearl tabular-nums">{Number(v).toLocaleString("en-IN")}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border border-ink/10 p-7 sm:p-9">
          <IconGift size={28} className="text-gold-ink" />
          <p className="mt-4 font-serif text-3xl leading-tight">
            Give {formatINR(REFERRAL_REWARD)}, get {formatINR(REFERRAL_REWARD)}.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone">
            Friends take {formatINR(REFERRAL_REWARD)} off their first mattress. When they order, you receive {formatINR(REFERRAL_REWARD)} in Shakshi credit and 1,000 points.
          </p>
          {!profile ? (
            <p className="mt-6 text-sm">Sign in above to receive your personal link.</p>
          ) : referralCode ? (
            <>
              <div className="mt-6 flex items-center gap-2 border border-ink/15 p-2 pl-4">
                <span className="min-w-0 flex-1 truncate font-mono text-xs">{link}</span>
                <button onClick={copy} className="btn btn-dark shrink-0 !px-4 !py-2.5">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em]">
                <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gold-ink hover:text-ink">
                  <IconWhatsApp size={16} /> Share on WhatsApp
                </a>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button onClick={share} className="text-gold-ink hover:text-ink">
                    More ways to share
                  </button>
                )}
              </div>
              <p className="mt-5 text-sm">
                {referrals ? (
                  <>
                    <strong className="font-semibold">{referrals}</strong> friend{referrals > 1 ? "s have" : " has"} joined through you.
                  </>
                ) : (
                  <span className="text-stone">No friends have used your link yet.</span>
                )}
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm text-stone">{error || "Preparing your personal link…"}</p>
          )}
          <Link href="/sleep-society" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
            How the Society works
          </Link>
        </div>
      </div>
    </section>
  );
}
