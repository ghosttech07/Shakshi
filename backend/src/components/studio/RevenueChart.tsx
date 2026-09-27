"use client";

import { useState } from "react";

type Day = { date: string; total: number; orders: number };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const short = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);
const label = (iso: string) => new Date(`${iso}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/**
 * Daily revenue, one series. Thin bars in the single validated chart hue, rounded only at the
 * data end, a recessive grid, a hover/focus tooltip, and a table view for screen readers.
 */
export function RevenueChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 220;
  const pad = { l: 44, r: 8, t: 12, b: 26 };
  const max = Math.max(10000, ...days.map((d) => d.total));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const bw = iw / days.length;
  const barW = Math.max(3, Math.min(14, bw - 4));
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const h = hover !== null ? days[hover] : null;

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily revenue for the last 30 days" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(28 34 48 / 0.08)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6b635a">
              {short(t)}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = pad.l + i * bw + (bw - barW) / 2;
          const hh = Math.max(0, pad.t + ih - y(d.total));
          const r = Math.min(4, barW / 2, hh);
          return (
            <g key={d.date}>
              {hh > 0 && (
                <path
                  d={`M${x},${pad.t + ih} v${-(hh - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${hh - r} z`}
                  fill="var(--color-chart)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {/* A hit target taller and wider than the bar */}
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
              {(i % 5 === 0 || i === days.length - 1) && (
                <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#6b635a">
                  {label(d.date)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="rgb(28 34 48 / 0.25)" />
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `clamp(0px, calc(${((pad.l + hover * bw + bw / 2) / W) * 100}% - 70px), calc(100% - 150px))` }}
        >
          <p className="font-semibold text-ink">{label(h.date)}</p>
          <p className="mt-0.5 text-ink">{inr(h.total)}</p>
          <p className="text-stone">
            {h.orders} order{h.orders === 1 ? "" : "s"}
          </p>
        </div>
      )}
      <details className="mt-3 text-xs text-stone">
        <summary className="cursor-pointer">View as table</summary>
        <table className="table mt-2">
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td>{label(d.date)}</td>
                <td>{d.orders}</td>
                <td>{inr(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}
