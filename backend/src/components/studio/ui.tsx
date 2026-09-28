import Link from "next/link";
import type { ReactNode } from "react";

/** Server-safe building blocks for studio pages. */

export function PageHead({ eyebrow, title, intro, actions }: { eyebrow?: string; title: string; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2 text-gold-ink">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold leading-tight sm:text-[1.75rem]">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-stone">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, note, href, tone }: { label: string; value: ReactNode; note?: ReactNode; href?: string; tone?: "warn" }) {
  const body = (
    <>
      <p className="eyebrow text-stone">{label}</p>
      <p className={`mt-3 text-3xl font-semibold leading-none tabular-nums ${tone === "warn" ? "text-warn" : "text-ink"}`}>{value}</p>
      {note && <p className="mt-2 text-xs text-stone">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition-colors hover:border-gold">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

const TONES = {
  neutral: "bg-ink/[0.07] text-ink",
  gold: "bg-gold/20 text-gold-ink",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  bad: "bg-bad/10 text-bad",
  dark: "bg-midnight text-pearl",
} as const;
export type Tone = keyof typeof TONES;

/** Status pill. Always text, never colour alone. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`badge ${TONES[tone]}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card px-6 py-14 text-center">
      <p className="text-2xl">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-stone">{children}</div>}
    </div>
  );
}

/** Horizontally scrolling table container, so wide tables never widen the page on phones. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="card overflow-x-auto">{children}</div>;
}

export function Filters({ children }: { children: ReactNode }) {
  return <form className="mb-5 flex flex-wrap items-end gap-3">{children}</form>;
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const when = (iso: string | undefined | null, withTime = true) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}), timeZone: "Asia/Kolkata" }) : "—";
export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
