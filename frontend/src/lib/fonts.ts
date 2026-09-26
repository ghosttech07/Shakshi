import { Bodoni_Moda, Cormorant_Garamond, DM_Sans, Fraunces, Inter, Jost, Manrope, Playfair_Display } from "next/font/google";

// The studio's curated pairings. Every family is declared here (next/font needs them at build time),
// but a browser only downloads the files for the families the page actually uses.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap", preload: false });
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-bodoni", display: "swap", preload: false });
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-fraunces", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap", preload: false });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap", preload: false });

export const fontVariables = [cormorant, manrope, playfair, bodoni, fraunces, inter, dmSans, jost].map((f) => f.variable).join(" ");

const VARS: Record<string, string> = {
  "Cormorant Garamond": "--font-cormorant",
  "Playfair Display": "--font-playfair",
  "Bodoni Moda": "--font-bodoni",
  Fraunces: "--font-fraunces",
  Manrope: "--font-manrope",
  Inter: "--font-inter",
  "DM Sans": "--font-dmsans",
  Jost: "--font-jost",
};

/** CSS pointing the serif/sans tokens at the chosen families; empty for the house pairing. */
export function fontCss(fonts: { heading: string; body: string }) {
  const out: string[] = [];
  if (fonts.heading !== "Cormorant Garamond" && VARS[fonts.heading]) out.push(`--font-serif:var(${VARS[fonts.heading]}),Georgia,serif`);
  if (fonts.body !== "Manrope" && VARS[fonts.body]) out.push(`--font-sans:var(${VARS[fonts.body]}),ui-sans-serif,system-ui,sans-serif`);
  return out.length ? `:root{${out.join(";")}}` : "";
}
