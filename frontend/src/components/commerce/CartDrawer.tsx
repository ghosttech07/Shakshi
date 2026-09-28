"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "@/components/ui/Dialog";
import { Img } from "@/components/ui/Img";
import { useStore, cartSubtotal } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useCatalog } from "@/lib/catalog-context";
import { useSite } from "@/lib/site-context";
import { EASE, emiFrom, formatINR } from "@shakshi/shared/utils";
import { IconMinus, IconPlus, IconGift, IconLock, IconMoon, IconShield, IconTruck } from "@/components/ui/Icons";

export function TrustBadges({ dark }: { dark?: boolean }) {
  const items = [
    { icon: IconLock, label: "Secure payment" },
    { icon: IconTruck, label: "White-glove delivery" },
    { icon: IconShield, label: "10-year warranty" },
  ];
  return (
    <ul className={`grid grid-cols-3 gap-2 text-center text-[0.68rem] leading-tight ${dark ? "text-pearl/70" : "text-stone"}`}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex flex-col items-center gap-2">
          <Icon size={22} className="text-gold" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function GiftProgress({ subtotal }: { subtotal: number }) {
  const FREE_GIFT_THRESHOLD = useSite().commerce.freeGiftThreshold;
  const pct = Math.min(100, (subtotal / FREE_GIFT_THRESHOLD) * 100);
  const reached = subtotal >= FREE_GIFT_THRESHOLD;
  return (
    <div>
      <p className="flex items-start gap-3 text-sm">
        <IconGift size={20} className="mt-0.5 shrink-0 text-gold-ink" />
        <span>
          {reached ? (
            <>A pair of <strong className="font-semibold">Cloud Pillows</strong> will be included, with our compliments.</>
          ) : (
            <>
              You&rsquo;re <strong className="font-semibold">{formatINR(FREE_GIFT_THRESHOLD - subtotal)}</strong> away from complimentary Cloud Pillows.
            </>
          )}
        </span>
      </p>
      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Progress toward free gift">
        <motion.div className="h-full bg-gradient-to-r from-gold-soft to-gold" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: EASE }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const hydrated = useHydrated();
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const addToCart = useStore((s) => s.addToCart);
  const subtotal = cartSubtotal(cart);
  const close = () => setOpen(false);
  const { accessories } = useCatalog();
  // One suggestion of each kind (a pillow, a cover, bedding) that isn't already in the bag.
  const upsells = (["pillow", "cover", "bedding"] as const).map((k) => accessories.find((a) => a.kind === k && !cart.some((c) => c.ref === a.id))).filter((a) => !!a);

  return (
    <Dialog open={open && hydrated} onClose={close} title="Your Bag" variant="right">
      <div className="flex min-h-[calc(100%-4.5rem)] flex-col">
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
            <IconMoon size={40} className="text-gold" />
            <p className="mt-6 font-serif text-3xl font-light">Your bag is resting.</p>
            <p className="mt-3 max-w-xs text-sm text-stone">Let us help you find the mattress you&rsquo;ll never want to leave.</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/shop" className="btn btn-dark" onClick={close}>Explore mattresses</Link>
              <Link href="/showroom?kind=video#book" className="btn btn-outline" onClick={close}>Talk to a specialist</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pt-5">
              <GiftProgress subtotal={subtotal} />
            </div>
            <ul className="mt-6 flex-1 divide-y divide-ink/10 border-y border-ink/10 px-6">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.li
                    key={item.key}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-4 py-5">
                      <Img src={item.image} alt="" sizes="96px" wrapperClassName="h-24 w-20 shrink-0" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <p className="font-serif text-lg leading-tight">{item.name}</p>
                          <p className="shrink-0 text-sm">{formatINR(item.price * item.qty)}</p>
                        </div>
                        {item.detail && <p className="mt-1 text-xs text-stone">{item.detail}</p>}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center border border-ink/15">
                            <button className="grid h-8 w-8 place-items-center hover:text-gold-ink" onClick={() => setQty(item.key, item.qty - 1)} aria-label={`Decrease quantity of ${item.name}`}>
                              <IconMinus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm" aria-live="polite">{item.qty}</span>
                            <button className="grid h-8 w-8 place-items-center hover:text-gold-ink" onClick={() => setQty(item.key, item.qty + 1)} aria-label={`Increase quantity of ${item.name}`}>
                              <IconPlus size={14} />
                            </button>
                          </div>
                          <button className="text-xs text-stone underline-offset-4 hover:underline" onClick={() => setQty(item.key, 0)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {upsells.length > 0 && (
              <div className="px-6 py-6">
                <p className="eyebrow text-gold-ink">Complete the ritual</p>
                <ul className="no-scrollbar -mx-6 mt-4 flex gap-3 overflow-x-auto px-6" data-lenis-prevent>
                  {upsells.map((a) => (
                    <li key={a.id} className="flex w-56 shrink-0 gap-3 border border-ink/10 bg-ivory-2/60 p-3">
                      <Img src={a.image} alt="" sizes="64px" wrapperClassName="h-16 w-14 shrink-0" />
                      <div className="flex min-w-0 flex-col">
                        <p className="truncate text-sm">{a.name}</p>
                        <p className="text-xs text-stone">{formatINR(a.price)}</p>
                        <button
                          className="mt-auto self-start text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink"
                          onClick={() => addToCart({ key: a.id, kind: "accessory", ref: a.id, name: a.name, detail: a.note, image: a.image, price: a.price }, false)}
                        >
                          + Add
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="sticky bottom-0 mt-auto border-t border-ink/10 bg-ivory/95 px-6 pb-6 pt-5 backdrop-blur">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone">Subtotal</dt>
                  <dd>{formatINR(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">White-glove delivery</dt>
                  <dd className="text-gold-ink">Complimentary</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-stone">
                Or from <strong className="font-semibold text-ink">{formatINR(emiFrom(subtotal))}/month</strong> with no-cost EMI
              </p>
              <Link href="/checkout" className="btn btn-gold mt-5 w-full" onClick={close}>
                Proceed to checkout
              </Link>
              <div className="mt-5">
                <TrustBadges />
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
