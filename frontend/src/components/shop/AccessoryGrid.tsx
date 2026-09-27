"use client";

import { useEffect, useState } from "react";
import type { AccessoryKind } from "@shakshi/shared/products";
import { cn, formatINR } from "@shakshi/shared/utils";
import { useCatalog } from "@/lib/catalog-context";
import { useStore } from "@/lib/store";
import { Img } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { IconCheck, IconPlus } from "@/components/ui/Icons";

/**
 * Every pillow (or cover) in the range, each with its own anchor so the Products menu can link
 * straight to it. The linked one is gently highlighted.
 */
export function AccessoryGrid({ kind }: { kind: AccessoryKind }) {
  const { accessories } = useCatalog();
  const items = accessories.filter((a) => a.kind === kind);
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const [target, setTarget] = useState("");

  useEffect(() => {
    const read = () => setTarget(decodeURIComponent(location.hash.slice(1)));
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [target]);

  if (!items.length) return <p className="py-16 text-center text-stone">Nothing here just yet.</p>;

  return (
    <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((a, i) => {
        const inBag = cart.some((c) => c.ref === a.id);
        return (
          <Reveal as="li" key={a.id} delay={i * 0.06}>
            <article id={a.id} className={cn("scroll-mt-32 transition-shadow duration-1000", target === a.id && "outline outline-1 outline-offset-8 outline-gold")}>
              <Img src={a.image} alt={a.name} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" wrapperClassName="aspect-[4/5]" />
              <h2 className="mt-5 font-serif text-2xl">{a.name}</h2>
              {a.note && <p className="mt-1 text-sm text-stone">{a.note}</p>}
              {a.description && <p className="mt-3 text-sm leading-relaxed text-ink/75">{a.description}</p>}
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="font-serif text-xl">{formatINR(a.price)}</span>
                <button
                  type="button"
                  onClick={() => addToCart({ key: a.id, kind: "accessory", ref: a.id, name: a.name, detail: a.note, image: a.image, price: a.price })}
                  className={cn("btn btn-sm", inBag ? "btn-outline" : "btn-dark")}
                  aria-label={`Add ${a.name} to your bag`}
                >
                  {inBag ? <IconCheck size={14} /> : <IconPlus size={14} />} {inBag ? "In your bag" : "Add to bag"}
                </button>
              </div>
            </article>
          </Reveal>
        );
      })}
    </ul>
  );
}
