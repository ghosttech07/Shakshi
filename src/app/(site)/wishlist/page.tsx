import type { Metadata } from "next";
import { WishlistClient } from "@/components/commerce/WishlistClient";

export const metadata: Metadata = {
  title: "Your Wishlist",
  description: "The Shakshi mattresses you've saved and recently admired.",
  robots: { index: false },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
