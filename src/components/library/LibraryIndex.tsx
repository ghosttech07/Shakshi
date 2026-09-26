"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Article } from "@/lib/articles";
import { Img } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { EASE } from "@/lib/utils";
import { IconArrow } from "@/components/ui/Icons";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function ArticleMeta({ a, dark }: { a: Article; dark?: boolean }) {
  return (
    <p className={`text-xs ${dark ? "text-pearl/60" : "text-stone"}`}>
      {a.category} · {a.readMins} min read · {dateFmt.format(new Date(a.date))}
    </p>
  );
}

export function ArticleCard({ a, index = 0 }: { a: Article; index?: number }) {
  return (
    <Reveal delay={(index % 3) * 0.1}>
      <Link href={`/sleep-library/${a.slug}`} className="group block">
        <Img src={a.image} alt={a.imageAlt} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" wrapperClassName="aspect-[4/3]" className="transition-transform duration-[1600ms] ease-silk group-hover:scale-105" />
        <p className="eyebrow mt-5 text-gold-ink">{a.category}</p>
        <h3 className="mt-3 text-3xl leading-tight transition-colors duration-700 group-hover:text-gold-ink">{a.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone">{a.dek}</p>
        <p className="mt-4 text-xs text-stone">{a.readMins} min read</p>
      </Link>
    </Reveal>
  );
}

export function LibraryIndex({ articles }: { articles: Article[] }) {
  const [feature, ...rest] = articles;
  const categories = useMemo(() => ["All", ...Array.from(new Set(articles.map((a) => a.category)))], [articles]);
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? rest : articles.filter((a) => a.category === cat);

  return (
    <>
      {feature && cat === "All" && (
        <section className="container-lux" aria-label="Featured essay">
          <Link href={`/sleep-library/${feature.slug}`} className="group grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <Img src={feature.image} alt={feature.imageAlt} sizes="(min-width: 1024px) 55vw, 100vw" preload wrapperClassName="aspect-[4/3] lg:aspect-[16/11]" className="transition-transform duration-[1800ms] ease-silk group-hover:scale-[1.03]" />
            <div>
              <p className="eyebrow text-gold-ink">Featured · {feature.category}</p>
              <h2 className="display mt-5 text-4xl sm:text-5xl lg:text-6xl">{feature.title}</h2>
              <p className="mt-6 text-lg leading-relaxed text-stone">{feature.dek}</p>
              <p className="mt-6 text-sm">{feature.author}</p>
              <ArticleMeta a={feature} />
              <span className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold-ink">
                Read the essay <IconArrow size={14} className="transition-transform duration-700 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>
      )}

      <section className="container-lux py-20 lg:py-28" aria-label="All essays">
        <div role="tablist" aria-label="Filter by topic" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto border-b border-ink/10 px-5 pb-5 sm:mx-0 sm:px-0">
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className="chip shrink-0" data-active={cat === c} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={cat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: EASE }} className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a, i) => (
              <ArticleCard key={a.slug} a={a} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}
