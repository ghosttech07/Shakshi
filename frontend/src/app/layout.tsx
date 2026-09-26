import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ViewTransition } from "react";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { GlobalWidgets } from "@/components/ambient/GlobalWidgets";
import { Preloader } from "@/components/ambient/Preloader";
import { Toaster } from "@/components/ui/Toaster";
import { CatalogProvider } from "@/lib/catalog-context";
import { getCatalog, getStock } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";
import { SettingsProvider } from "@/lib/settings-context";
import { BOOT_SCRIPT, jsonLd } from "@/lib/boot-script";
import { CONTACT, SHOWROOMS } from "@shakshi/shared/products";
import { SITE_URL } from "@shakshi/shared/site";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Shakshi · A Commitment for Complete Rest", template: "%s · Shakshi" },
  description:
    "Handcrafted luxury mattresses for the deepest kind of rest. 100-night trial, 10-year warranty and complimentary white-glove delivery across India.",
  keywords: ["luxury mattress", "handcrafted mattress", "memory foam", "latex mattress", "hybrid mattress", "India"],
  openGraph: {
    type: "website",
    siteName: "Shakshi",
    locale: "en_IN",
    images: [{ url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&h=630&fit=crop&q=75", width: 1200, height: 630, alt: "A serene bedroom dressed in warm light" }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0e1420",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Shakshi",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/shakshi-lockup-red.png`,
  slogan: "A Commitment for Complete Rest",
  contactPoint: [{ "@type": "ContactPoint", telephone: CONTACT.phone, contactType: "customer service", areaServed: "IN" }],
  department: SHOWROOMS.map((s) => ({
    "@type": "FurnitureStore",
    name: s.name,
    address: s.address,
    telephone: s.phone,
    geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
  })),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [products, stock, settings] = await Promise.all([getCatalog(), getStock(), getSettings()]);
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${manrope.variable}`} data-theme="day" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgJsonLd) }} />
        <SettingsProvider settings={settings}>
        <CatalogProvider products={products} stock={stock}>
          <Preloader />
          <SmoothScroll />
          <Header />
          <ViewTransition default="page">
            <main id="main">{children}</main>
          </ViewTransition>
          <Footer settings={settings} />
          <GlobalWidgets />
          <Toaster />
        </CatalogProvider>
        </SettingsProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
