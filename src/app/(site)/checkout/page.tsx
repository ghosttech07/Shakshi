import type { Metadata } from "next";
import { Checkout } from "@/components/commerce/Checkout";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-lux">
      <Checkout />
    </div>
  );
}
