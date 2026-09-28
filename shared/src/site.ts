// The public site address, for canonical URLs, the sitemap, referral and gift links.
// NEXT_PUBLIC_SITE_URL wins; on Vercel it falls back to the project's production address.
const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/+$/, "");
