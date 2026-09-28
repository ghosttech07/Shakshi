import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./studio.css";

// Every page the backend serves is part of the private studio: one clear, readable typeface throughout.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans-face", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = { themeColor: "#0e1420", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={sans.variable}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>{children}</body>
    </html>
  );
}
