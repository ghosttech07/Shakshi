import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Logo } from "@/components/brand/Logo";
import { BOOT_SCRIPT } from "@/lib/boot-script";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-cormorant", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "Page not found · Shakshi",
  robots: { index: false },
};

/** Any address that matches no route at all lands here, dressed like the rest of the house. */
export default function GlobalNotFound() {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${manrope.variable} seen`} data-theme="day" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <main className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-midnight px-5 text-center text-pearl linen-dark">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_40%,rgb(201_169_110/0.15),transparent)]" />
          <div className="relative">
            <Link href="/" aria-label="Shakshi home">
              <Logo variant="lockup" tone="light" className="mx-auto h-16" />
            </Link>
            <p className="eyebrow mt-14 text-gold">404</p>
            <h1 className="display mt-6 text-5xl sm:text-7xl">This page has drifted off.</h1>
            <p className="mx-auto mt-6 max-w-md text-pearl/65">Perhaps it&rsquo;s sleeping somewhere peaceful. Let us guide you back.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/" className="btn btn-gold">
                Return home
              </Link>
              <Link href="/shop" className="btn btn-outline">
                Explore mattresses
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
