"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useStore, cartCount } from "@/lib/store";
import { useAccount } from "@/lib/account";
import { useHydrated } from "@/lib/useHydrated";
import { IMG } from "@shakshi/shared/images";
import { EASE, cn } from "@shakshi/shared/utils";
import { IconBag, IconHeart, IconMenu, IconClose, IconUser, IconArrow } from "@/components/ui/Icons";
import { AmbientControl } from "@/components/ambient/AmbientControl";
import { ThemeToggle } from "@/components/ambient/ThemeToggle";
import { Img } from "@/components/ui/Img";
import { Logo } from "@/components/brand/Logo";
import { lockScroll, unlockScroll } from "./SmoothScroll";
import { isLive, useSite } from "@/lib/site-context";
import type { NavItem, ProductCategory } from "@shakshi/shared/cms/types";
import { useCatalog } from "@/lib/catalog-context";

type Child = NonNullable<NavItem["children"]>[number];
/** A dropdown's links, split into two even columns. */
const columns = (links: Child[]) => {
  const half = Math.ceil(links.length / 2);
  return [links.slice(0, half), links.slice(half)].filter((c) => c.length);
};

const hasMenu = (n: NavItem) => n.menu === "categories" || !!n.children?.length;

/** The Products panel: each category with its photo, a line about it, and how many mattresses it holds. */
function CategoryPanel({ item, categories, close }: { item: NavItem; categories: ProductCategory[]; close: () => void }) {
  const { products } = useCatalog();
  const count = (slug: string) => products.filter((p) => p.category === slug).length;
  const shown = categories.filter((c) => c.slug && c.name);
  return (
    <div className="container-lux py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <p className="eyebrow text-gold-ink">Shop by feel</p>
        <Link href={item.href || "/shop"} onClick={close} className="link-lux inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
          All products <IconArrow size={14} />
        </Link>
      </div>
      <ul className={cn("grid gap-6", shown.length >= 4 ? "grid-cols-4" : shown.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
        {shown.map((c) => {
          const n = count(c.slug);
          return (
            <li key={c.slug}>
              <Link href={`/shop/${c.slug}`} onClick={close} className="group block">
                <span className="relative block aspect-[16/10] overflow-hidden">
                  {c.image && <Img src={c.image} alt="" sizes="(min-width: 1024px) 28vw, 50vw" wrapperClassName="absolute inset-0" className="transition-transform duration-[1400ms] ease-silk group-hover:scale-105" />}
                </span>
                <span className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="link-lux font-serif text-2xl">{c.name}</span>
                  <span className="shrink-0 text-xs text-stone">
                    {n} {n === 1 ? "mattress" : "mattresses"}
                  </span>
                </span>
                {c.description && <span className="mt-1 block text-sm leading-relaxed text-stone">{c.description}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DiscoverMenu({ item, categories, open, setOpen }: { item: NavItem | undefined; categories: ProductCategory[]; open: boolean; setOpen: (o: boolean) => void }) {
  return (
    <AnimatePresence>
      {open && item && hasMenu(item) && (
        <motion.div
          id="discover-panel"
          className="absolute inset-x-0 top-full border-b border-ink/10 bg-ivory text-ink shadow-lift"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.7, ease: EASE }}
          onMouseLeave={() => setOpen(false)}
        >
          {item.menu === "categories" ? (
            <CategoryPanel item={item} categories={categories} close={() => setOpen(false)} />
          ) : (
          <div className="container-lux grid grid-cols-[1fr_1fr_1.1fr] gap-12 py-10">
            {columns(item.children ?? []).map((links, i) => (
              <div key={i}>
                <p className="eyebrow text-gold-ink">{i === 0 ? item.label : " "}</p>
                <ul className="mt-5 space-y-4">
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={() => setOpen(false)} className="group block">
                        <span className="link-lux font-serif text-2xl">{l.label}</span>
                        <span className="block text-xs text-stone">{l.note}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link href="/showroom?kind=video#book" onClick={() => setOpen(false)} className="group relative block overflow-hidden text-pearl">
              <Img src={IMG.sleepSoft} alt="" sizes="30vw" dark wrapperClassName="absolute inset-0" className="transition-transform duration-[1400ms] ease-silk group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-midnight/85 to-midnight/10" />
              <span className="relative flex h-full min-h-[220px] flex-col justify-end p-6">
                <span className="eyebrow text-gold">Complimentary</span>
                <span className="mt-2 font-serif text-3xl leading-tight">A 15-minute call with a sleep specialist</span>
                <span className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
                  Book a video consultation <IconArrow size={14} />
                </span>
              </span>
            </Link>
          </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Header() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const profile = useAccount((s) => s.profile);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const [discover, setDiscover] = useState(false);
  const [darkHero, setDarkHero] = useState(false);
  const discoverBtn = useRef<HTMLButtonElement>(null);
  const site = useSite();
  const { announcement } = site;
  const links = site.nav.filter((n) => n.href && !n.children?.length);
  const dropdown = site.nav.find(hasMenu);
  const categories = site.categories ?? [];
  const [live, setLive] = useState(false);
  useEffect(() => setLive(isLive(announcement)), [announcement]);
  const [barClosed, setBarClosed] = useState(false);
  useEffect(() => {
    try {
      setBarClosed(sessionStorage.getItem("shk-bar") === announcement.text);
    } catch {}
  }, [announcement.text]);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 400 && y > prev + 4 && !menu && !discover);
    if (y < prev - 4) setHidden(false);
  });

  useEffect(() => {
    setMenu(false);
    setDiscover(false);
  }, [pathname]);
  // Pages that open on a dark hero mark it with data-dark-hero, so the header can turn light.
  useEffect(() => {
    const check = () => setDarkHero(!!document.querySelector("[data-dark-hero]"));
    check();
    const id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  // Something was added to the bag: bring the header (and its bag icon) back into view.
  useEffect(() => {
    const show = () => setHidden(false);
    addEventListener("shakshi:add", show);
    return () => removeEventListener("shakshi:add", show);
  }, []);
  useEffect(() => {
    if (!discover) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDiscover(false);
        discoverBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [discover]);
  useEffect(() => {
    if (!menu) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  if (pathname.startsWith("/checkout")) {
    return (
      <header className="border-b border-ink/10 bg-ivory">
        <div className="container-lux flex h-20 items-center justify-between">
          <Link href="/" aria-label="Shakshi home">
            <Logo className="h-8" />
          </Link>
          <p className="eyebrow text-stone">Secure checkout</p>
          <button data-cart-icon className="sr-only" tabIndex={-1} aria-hidden />
        </div>
      </header>
    );
  }

  const onDark = darkHero && !scrolled && !menu && !discover;
  const count = hydrated ? cartCount(cart) : 0;
  const discoverActive = dropdown?.menu === "categories" ? pathname.startsWith(dropdown.href || "/shop") : !!dropdown?.children?.some((l) => pathname.startsWith(l.href));

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-[background-color,color,box-shadow,backdrop-filter] duration-1000 ease-silk",
          (scrolled || discover) && !menu ? "glass border-x-0 border-t-0 border-b-ink/5" : "border-b border-transparent",
          onDark || menu ? "text-pearl" : "text-ink"
        )}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <AnimatePresence initial={false}>
          {announcement.enabled && announcement.text && live && !barClosed && !scrolled && !menu && (
            <motion.div
              className="relative overflow-hidden bg-midnight text-pearl"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <p className="container-lux py-2 text-center text-[0.65rem] uppercase tracking-[0.22em] sm:text-[0.7rem]">
                {announcement.link ? (
                  <Link href={announcement.link} className="hover:text-gold">
                    {announcement.text}
                  </Link>
                ) : (
                  announcement.text
                )}
              </p>
              <button
                onClick={() => {
                  setBarClosed(true);
                  try {
                    sessionStorage.setItem("shk-bar", announcement.text);
                  } catch {}
                }}
                aria-label="Dismiss announcement"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-pearl/60 hover:text-pearl"
              >
                <IconClose size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-gold focus:px-4 focus:py-2 focus:text-midnight">
          Skip to content
        </a>
        <div className={cn("container-lux flex items-center justify-between transition-[height] duration-1000 ease-silk", scrolled ? "h-16" : "h-20 lg:h-24")}>
          <button className="-ml-2 grid h-11 w-11 place-items-center lg:hidden" onClick={() => setMenu(!menu)} aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu}>
            {menu ? <IconClose size={24} /> : <IconMenu size={24} />}
          </button>

          <Link href="/" aria-label="Shakshi home" className="lg:mr-10">
            <Logo tone={onDark || menu ? "light" : "brand"} className={cn("block transition-[height] duration-1000 ease-silk", scrolled ? "h-7" : "h-8 lg:h-9")} />
          </Link>

          <nav aria-label="Primary" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-7 xl:gap-9">
              {site.nav.map((n) =>
                hasMenu(n) ? (
                  <li key={n.label} onMouseEnter={() => setDiscover(true)} className="inline-flex items-center gap-1.5">
                    {n.href ? (
                      <Link href={n.href} onClick={() => setDiscover(false)} className={cn("link-lux text-[0.8rem] tracking-[0.06em]", discoverActive && "bg-[length:100%_1px]")} aria-current={pathname === n.href ? "page" : undefined}>
                        {n.label}
                      </Link>
                    ) : null}
                    <button
                      ref={discoverBtn}
                      onClick={() => setDiscover(!discover)}
                      aria-expanded={discover}
                      aria-controls="discover-panel"
                      aria-label={n.href ? `Show ${n.label.toLowerCase()} categories` : undefined}
                      className={cn("inline-flex items-center gap-1.5 text-[0.8rem] tracking-[0.06em]", !n.href && "link-lux", !n.href && discoverActive && "bg-[length:100%_1px]")}
                    >
                      {!n.href && n.label}
                      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className={cn("transition-transform duration-500", discover && "rotate-180")}>
                        <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" />
                      </svg>
                    </button>
                  </li>
                ) : (
                  <li key={n.href + n.label}>
                    <Link href={n.href} className="link-lux text-[0.8rem] tracking-[0.06em]" aria-current={pathname.startsWith(n.href) ? "page" : undefined}>
                      {n.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          <div className="-mr-2 flex items-center">
            <div className="hidden sm:flex">
              <AmbientControl />
              <ThemeToggle />
            </div>
            <Link href="/account" aria-label={hydrated && profile ? `Your account, ${profile.name}` : "Account"} className="relative hidden h-11 w-11 place-items-center sm:grid">
              <IconUser size={21} />
              {hydrated && profile && <span className="absolute right-2 top-2.5 h-1.5 w-1.5 rounded-full bg-gold" />}
            </Link>
            <Link href="/wishlist" aria-label={`Wishlist${hydrated && wishlist.length ? `, ${wishlist.length} saved` : ""}`} className="relative hidden h-11 w-11 place-items-center md:grid">
              <IconHeart size={21} />
              {hydrated && wishlist.length > 0 && <span className="absolute right-2 top-2.5 h-1.5 w-1.5 rounded-full bg-gold" />}
            </Link>
            <button data-cart-icon onClick={() => setCartOpen(true)} aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`} className="relative grid h-11 w-11 place-items-center">
              <IconBag size={22} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold text-midnight"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
        <div className="hidden lg:block">
          <DiscoverMenu item={dropdown} categories={categories} open={discover} setOpen={setDiscover} />
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-[55] overflow-y-auto bg-midnight text-pearl linen-dark lg:hidden"
            data-lenis-prevent
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 1, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <nav aria-label="Mobile" className="container-lux flex min-h-full flex-col justify-between gap-10 pb-10 pt-28">
              <ul className="space-y-2">
                {[{ href: "/", label: "Home" }, ...links].map((n, i) => (
                  <motion.li key={n.href + n.label} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: EASE }}>
                    <Link href={n.href} className="font-serif text-4xl font-light">
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div className="grid grid-cols-2 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}>
                {dropdown?.menu === "categories" && (
                  <div className="col-span-2">
                    <p className="eyebrow text-gold">Shop by feel</p>
                    <ul className="mt-3 space-y-2">
                      {categories
                        .filter((c) => c.slug && c.name)
                        .map((c) => (
                          <li key={c.slug}>
                            <Link href={`/shop/${c.slug}`} className="font-serif text-2xl">
                              {c.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                {dropdown?.menu !== "categories" && dropdown?.children && columns(dropdown.children).map((col, i) => (
                  <div key={i}>
                    <p className="eyebrow text-gold">{i === 0 ? dropdown.label : " "}</p>
                    <ul className="mt-3 space-y-2">
                      {col.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className="font-serif text-xl">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="space-y-5">
                <div className="flex items-center gap-2">
                  <AmbientControl />
                  <ThemeToggle />
                  <Link href="/account" className="grid h-11 w-11 place-items-center" aria-label="Account">
                    <IconUser size={21} />
                  </Link>
                  <Link href="/wishlist" className="grid h-11 w-11 place-items-center" aria-label="Wishlist">
                    <IconHeart size={21} />
                  </Link>
                </div>
                <div className="gold-rule" />
                <p className="eyebrow text-gold">{site.brand.tagline}</p>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
