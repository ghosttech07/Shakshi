"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@shakshi/shared/utils";

// Placeholder claims for the storefront design: confirm each certificate before launch.
const CERTS = [
  { id: "certipur", mark: "CP", name: "CertiPUR-US®", scope: "Foams", body: "Our foams are made without ozone depleters, PBDE flame retardants, mercury, lead or formaldehyde, and are tested for low emissions (VOCs) for indoor air quality." },
  { id: "oeko", mark: "OT", name: "OEKO-TEX® Standard 100", scope: "Covers & textiles", body: "Every thread, button and zip that touches you is tested for harmful substances, to the strictest class for products in direct contact with skin." },
  { id: "gots", mark: "GO", name: "GOTS", scope: "Organic cotton", body: "The Global Organic Textile Standard certifies our cotton from field to finished cover: organic fibre, and responsible processing all the way through." },
  { id: "gols", mark: "GL", name: "GOLS", scope: "Natural latex", body: "The Global Organic Latex Standard confirms our latex is made from certified organic rubber, with strict limits on fillers and chemicals." },
  { id: "iso", mark: "ISO", name: "ISO 9001", scope: "Our atelier", body: "Our workshop's quality management is independently audited, so every mattress is built, checked and finished the same careful way." },
];

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
export function Certifications({ className, compact }: { className?: string; compact?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const c = CERTS.find((x) => x.id === open);
  return (
    <>
      <ul className={cn("flex flex-wrap gap-x-6 gap-y-4", className)} aria-label="Certifications">
        {CERTS.map((x) => (
          <li key={x.id}>
            <button onClick={() => setOpen(x.id)} className="group flex items-center gap-3 text-left text-gold-ink transition-colors duration-500 hover:text-ink" aria-haspopup="dialog">
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
