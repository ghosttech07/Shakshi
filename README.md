# Shakshi — luxury mattress storefront

Next.js 16 (App Router, Turbopack) · Tailwind CSS 4 · Framer Motion · GSAP ScrollTrigger · Lenis · React Three Fiber · Zustand

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Optional: copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` to power the Sleep Concierge with Claude. Without it, the concierge answers from a built-in guide. Set `NEXT_PUBLIC_SITE_URL` for canonical URLs, the sitemap and structured data.

## Where things live

| Area | Path |
| --- | --- |
| Catalogue, sizes, add-ons, reviews, showrooms | `src/lib/products.ts` |
| Photography (Unsplash IDs) | `src/lib/images.ts` |
| Cart, wishlist, recently viewed, compare (saved to localStorage) | `src/lib/store.ts` |
| Quiz scoring | `src/lib/quiz.ts` |
| Delivery estimator (pincode rules) | `src/lib/utils.ts` → `estimateDelivery` |
| Concierge API route and knowledge | `src/app/api/concierge/route.ts`, `src/lib/concierge-knowledge.ts` |
| 3D scenes (hero duvet, 360° viewer, configurator) | `src/components/three/` |
| Design tokens (colours, easing, textures) | `src/app/globals.css` |

## Pages

`/` home · `/shop` · `/mattress/[slug]` · `/quiz` · `/build-your-bed` · `/sleep-studio` (firmness simulator, sleep calculator, swatches) · `/about` · `/showroom` (salons, booking, contact) · `/wishlist` · `/checkout`

## Still simulated

Forms (newsletter, swatches, booking, contact) and checkout validate and confirm in the browser but aren't connected to a backend or payment gateway. "View in your room" is a camera preview with a to-scale footprint; true AR placement would need a GLB/USDZ model per mattress (for example via `<model-viewer>`).
