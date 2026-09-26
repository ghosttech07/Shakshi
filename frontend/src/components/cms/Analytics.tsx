import Script from "next/script";

/** Google Analytics 4 and Meta Pixel, only when their IDs are set in the studio. Loaded after the page is interactive. */
export function Analytics({ ids }: { ids: { gaId?: string; metaPixelId?: string } }) {
  const ga = ids.gaId && /^G-[A-Z0-9]{4,20}$/i.test(ids.gaId) ? ids.gaId : null;
  const px = ids.metaPixelId && /^\d{6,20}$/.test(ids.metaPixelId) ? ids.metaPixelId : null;
  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      )}
      {px && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}
