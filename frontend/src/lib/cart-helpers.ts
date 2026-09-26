import { ADDONS, SIZES, priceFor, type AddonId, type Product, type SizeId } from "@shakshi/shared/products";
import type { CartItem } from "./store";

export function mattressItem(p: Product, size: SizeId): Omit<CartItem, "qty"> {
  const s = SIZES.find((x) => x.id === size)!;
  return {
    key: `${p.slug}-${size}`,
    kind: "mattress",
    ref: p.slug,
    name: p.name,
    detail: `${s.label} · ${s.dims} · ${p.firmnessLabel}`,
    image: p.images[0],
    size,
    price: priceFor(p, size),
  };
}

export function addonItem(id: AddonId, image: string): Omit<CartItem, "qty"> {
  const a = ADDONS.find((x) => x.id === id)!;
  return { key: `addon-${id}`, kind: "addon", ref: id, name: a.name, detail: a.note, image, price: a.price };
}
