import Link from "next/link";
import { ACCESSORY_RANGES } from "@shakshi/shared/products";
import { cn } from "@shakshi/shared/utils";

/** Tabs across the top of the shop: Mattresses, then each range (Pillows, Mattress Covers). */
export function RangeTabs({ current }: { current: string }) {
  const tabs = [{ slug: "mattresses", label: "Mattresses", href: "/shop" }, ...ACCESSORY_RANGES.map((r) => ({ slug: r.slug, label: r.label, href: `/shop/${r.slug}` }))];
  return (
    <nav aria-label="Product ranges" className="-mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:px-0">
      <div className="flex gap-8">
        {tabs.map((t) => (
          <Link
            key={t.slug}
            href={t.href}
            aria-current={current === t.slug ? "page" : undefined}
            className={cn("whitespace-nowrap border-b pb-2 text-sm transition-colors duration-500", current === t.slug ? "border-gold text-ink" : "border-transparent text-stone hover:text-ink")}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
