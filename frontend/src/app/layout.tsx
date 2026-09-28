import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { GlobalWidgets } from "@/components/ambient/GlobalWidgets";
import { Preloader } from "@/components/ambient/Preloader";
import { Toaster } from "@/components/ui/Toaster";
import { CatalogProvider } from "@/lib/catalog-context";
import { getSite, getStorefront } from "@/lib/data";
import { SiteProvider } from "@/lib/site-context";
import { MotionPrefs } from "@/components/cms/MotionPrefs";
import { Analytics } from "@/components/cms/Analytics";
import { fontCss, fontVariables } from "@/lib/fonts";
import { themeCss } from "@shakshi/shared/cms/theme";
import type { SiteConfig } from "@shakshi/shared/cms/types";
import { bootScript, jsonLd } from "@/lib/boot-script";
import { SITE_URL } from "@shakshi/shared/site";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, brand } = await getSite();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.defaultTitle, template: seo.titleTemplate || `%s · ${brand.name}` },
    description: seo.description,
    keywords: ["luxury mattress", "handcrafted mattress", "memory foam", "latex mattress", "hybrid mattress", "India"],
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: "en_IN",
      images: seo.ogImage ? [{ url: seo.ogImage.includes("unsplash.com") && !seo.ogImage.includes("?") ? `${seo.ogImage}?w=1200&h=630&fit=crop&q=75` : seo.ogImage, width: 1200, height: 630, alt: brand.tagline }] : undefined,
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
    icons: seo.favicon ? { icon: seo.favicon, apple: seo.favicon } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#0e1420",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = (site: SiteConfig) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.brand.name,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/shakshi-lockup-red.png`,
  slogan: site.brand.tagline,
  sameAs: site.social.map((x) => x.url),
  contactPoint: [{ "@type": "ContactPoint", telephone: site.contact.phone, contactType: "customer service", areaServed: "IN" }],
  department: site.showrooms.map((s) => ({
    "@type": "FurnitureStore",
    name: s.name,
    address: s.address,
    telephone: s.phone,
    geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
  })),
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { products, accessories, stock, site } = await getStorefront();
  const { theme } = site;
  const css = themeCss(theme) + fontCss(theme.fonts);
  return (
    <html lang="en-IN" className={fontVariables} data-theme="day" data-motion={theme.motion} suppressHydrationWarning>
      <head>
        {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      </head>
      <body className="min-h-screen overflow-x-clip">
        {/* Picks day or night before anything paints. Sent as raw HTML so the browser runs it while
            parsing; React never re-creates it in the browser (which it would warn about). */}
        <div hidden dangerouslySetInnerHTML={{ __html: `<script>${bootScript(theme.toggles.nightMode)}</script>` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgJsonLd(site)) }} />
        <SiteProvider site={site}>
          <MotionPrefs>
            <CatalogProvider products={products} accessories={accessories} stock={stock}>
              {theme.toggles.preloader && theme.motion !== "off" && <Preloader />}
              <SmoothScroll />
              <Header />
              <ViewTransition default="page">
                <main id="main">{children}</main>
              </ViewTransition>
              <Footer site={site} />
              <GlobalWidgets />
              <Toaster />
            </CatalogProvider>
          </MotionPrefs>
        </SiteProvider>
        <Analytics ids={site.analytics} />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
