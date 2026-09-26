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
import { useSettings } from "@/lib/settings-context";

export const NAV = [
  { href: "/shop", label: "Mattresses" },
  { href: "/quiz", label: "Sleep Quiz" },
  { href: "/build-your-bed", label: "Build Your Bed" },
];

export const DISCOVER = [
  {
    title: "Explore",
    links: [
      { href: "/sleep-studio", label: "Sleep Studio", note: "Feel the firmness, time your cycles" },
      { href: "/sleep-library", label: "Sleep Library", note: "Essays on resting well" },
      { href: "/real-bedrooms", label: "Real Bedrooms", note: "Our sleepers, at home" },
      { href: "/about", label: "Craftsmanship", note: "Inside the atelier" },
    ],
  },
  {
    title: "Belong",
    links: [
      { href: "/sleep-society", label: "Sleep Society", note: "Rewards, tiers and referrals" },
      { href: "/gift-cards", label: "Gift Cards", note: "The gift of deep sleep" },
      { href: "/hospitality", label: "Hospitality & Trade", note: "Hotels, homes and offices" },
      { href: "/setup", label: "Setup Guide", note: "Unboxing, and the first 24 hours" },
    ],
  },
];


function DiscoverMenu({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="discover-panel"
          className="glass absolute inset-x-0 top-full border-x-0 text-ink shadow-lift"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.7, ease: EASE }}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="container-lux grid grid-cols-[1fr_1fr_1.1fr] gap-12 py-10">
            {DISCOVER.map((g) => (
              <div key={g.title}>
                <p className="eyebrow text-gold-ink">{g.title}</p>
                <ul className="mt-5 space-y-4">
                  {g.links.map((l) => (
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
  const { announcement } = useSettings();
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
  const discoverActive = DISCOVER.some((g) => g.links.some((l) => pathname.startsWith(l.href)));

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
          {announcement.enabled && announcement.text && !barClosed && !scrolled && !menu && (
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
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="link-lux text-[0.8rem] tracking-[0.06em]" aria-current={pathname.startsWith(n.href) ? "page" : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
              <li onMouseEnter={() => setDiscover(true)}>
                <button
                  ref={discoverBtn}
                  onClick={() => setDiscover(!discover)}
                  aria-expanded={discover}
                  aria-controls="discover-panel"
                  className={cn("link-lux inline-flex items-center gap-1.5 text-[0.8rem] tracking-[0.06em]", discoverActive && "bg-[length:100%_1px]")}
                >
                  Discover
                  <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className={cn("transition-transform duration-500", discover && "rotate-180")}>
                    <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" />
                  </svg>
                </button>
              </li>
              <li>
                <Link href="/showroom" className="link-lux text-[0.8rem] tracking-[0.06em]" aria-current={pathname.startsWith("/showroom") ? "page" : undefined}>
                  Showrooms
                </Link>
              </li>
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
          <DiscoverMenu open={discover} setOpen={setDiscover} />
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
                {[{ href: "/", label: "Home" }, ...NAV, { href: "/showroom", label: "Showrooms" }].map((n, i) => (
                  <motion.li key={n.href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: EASE }}>
                    <Link href={n.href} className="font-serif text-4xl font-light">
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div className="grid grid-cols-2 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}>
                {DISCOVER.map((g) => (
                  <div key={g.title}>
                    <p className="eyebrow text-gold">{g.title}</p>
                    <ul className="mt-3 space-y-2">
                      {g.links.map((l) => (
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
                <p className="eyebrow text-gold">100-night trial · Free white-glove delivery</p>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
