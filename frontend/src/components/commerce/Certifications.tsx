"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@shakshi/shared/utils";
import { SECTIONS } from "@shakshi/shared/cms/sections";

// Placeholder claims for the storefront design: confirm each certificate before launch (editable in the studio).
type Cert = { mark: string; name: string; scope: string; body: string };
const CERTS = SECTIONS.certifications.defaults.items as Cert[];

function Seal({ mark }: { mark: string }) {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="1.5 2.5" />
      <text x="32" y="37" textAnchor="middle" fontSize={mark.length > 2 ? 12 : 15} fontFamily="var(--font-serif)" fill="currentColor">
        {mark}
      </text>
    </svg>
  );
}

/** Certification badges; each opens a short plain-language explanation. */
export function Certifications({ className, compact, items }: { className?: string; compact?: boolean; items?: Cert[] }) {
  const list = items?.length ? items : CERTS;
  const [open, setOpen] = useState<number | null>(null);
  const c = open === null ? undefined : list[open];
  return (
    <>
      <ul className={cn("flex flex-wrap gap-x-6 gap-y-4", className)} aria-label="Certifications">
        {list.map((x, i) => (
          <li key={i}>
            <button onClick={() => setOpen(i)} className="group flex items-center gap-3 text-left text-gold-ink transition-colors duration-500 hover:text-ink" aria-haspopup="dialog">
              <Seal mark={x.mark} />
              {!compact && (
                <span>
                  <span className="block text-sm text-ink">{x.name}</span>
                  <span className="block text-xs text-stone group-hover:underline">{x.scope}</span>
                </span>
              )}
              {compact && <span className="sr-only">{x.name}: what it means</span>}
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!c} onClose={() => setOpen(null)} title={c?.name ?? "Certification"} className="sm:max-w-lg">
        {c && (
          <div className="px-6 pb-8 pt-2">
            <div className="flex items-center gap-4 text-gold-ink">
              <Seal mark={c.mark} />
              <p className="eyebrow text-stone">Certifies · {c.scope}</p>
            </div>
            <p className="mt-5 leading-relaxed text-ink/85">{c.body}</p>
          </div>
        )}
      </Dialog>
    </>
  );
}
