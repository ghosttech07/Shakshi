# Shakshi: luxury mattress storefront and studio

Next.js 16 (App Router, Turbopack) · Tailwind CSS 4 · Framer Motion · GSAP ScrollTrigger · Lenis · React Three Fiber · Zustand · Tiptap · Supabase (optional)

The site is split into two independent apps so either can fail without taking down the other:

| Workspace | Port | What it is |
| --- | --- | --- |
| `frontend/` | 3000 | The storefront. Renders every page from published content, with built-in fallbacks if the backend is unreachable. |
| `backend/` | 4000 | API, database access, uploads, and the password-protected **studio** (admin + CMS). |
| `shared/` | — | Types, catalogue seed, content model (sections, defaults), shared helpers. |

```bash
npm install
npm run studio:setup   # once: creates the studio address, password, secrets and both .env.local files
npm run dev            # starts backend (4000) and frontend (3000) together
npm run build && npm start
```

`studio:setup` prints the studio address (`http://localhost:4000/admin`; `/admin` on the shop forwards there) and a generated password. See `.env.example` for every setting.

## The studio

Sign in with the password only. The studio lives at `/admin` on the backend (change it with `ADMIN_PATH`), is `noindex`, and isn't listed in robots or the sitemap. The password is checked on the server against a bcrypt hash. A signed, httpOnly, `sameSite=strict` session lasts 8 hours. Five failed attempts lock an IP out for 15 minutes, and every attempt is logged.

- **Overview**: today's orders, revenue this week and month, pending deliveries, low stock, reviews to approve, open inquiries, bookings, a daily revenue chart and the visitor funnel.
- **Commerce**: Orders (search, filter, status that updates the customer's timeline), Products (details, images, price and stock per size, visibility), Discount codes (percent or flat, expiry, usage limit, minimum order), Abandoned carts (email and WhatsApp templates).
- **People**: Customers (order history), Reviews (approve, hide, reply), Bookings (calendar, confirm or cancel), Inquiries (mark handled).
- **Content**:
  - **Pages**: every page is an ordered list of sections. Edit, add, duplicate, hide, delete and drag to reorder, with a live preview at desktop, tablet and mobile sizes. Click anything in the preview to edit it. Autosaves every 10 seconds; drafts go live only on Publish. Each publish keeps a version you can restore, whole or one section at a time. New custom pages get their own address.
  - **Site & theme**: brand, announcement bar, navigation, footer, contact and social links, colours, fonts, feature toggles, animation intensity, SEO defaults, analytics IDs, redirects, delivery pincodes, GST and fees, showrooms.
  - **Sleep Library**: rich-text essays, categories, scheduled publishing.
  - **Media**: uploads (images become WebP), required alt text, and deletion is blocked while a file is still in use.
- **Activity log**: every change and every sign-in attempt.

Publishing asks the storefront to refresh (`REVALIDATE_SECRET`); pages are otherwise statically generated and refresh on a timer.

## Data

Without Supabase, everything is stored in `backend/.data/db.json` and uploads in `backend/.data/media/`, which is fine for local use. For production:

1. Run `backend/supabase/migrations/0001_init.sql` and `0002_media_bucket.sql` in the Supabase SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (the **secret** key) in `backend/.env.local`.

Only the backend talks to Supabase. Row-level security is on with no public policies, so the publishable key can't read anything.

## Where things live

| Area | Path |
| --- | --- |
| Section types and their fields | `shared/src/cms/sections.ts` |
| Default page content and site settings | `shared/src/cms/defaults.ts` |
| Section renderers (storefront) | `frontend/src/components/cms/` |
| Studio screens | `backend/src/app/studio-internal/`, `backend/src/components/studio/` |
| Studio access guard | `backend/src/proxy.ts`, `backend/src/lib/server/admin-session.ts` |
| Catalogue seed, sizes, add-ons | `shared/src/products.ts` |
| 3D scenes | `frontend/src/components/three/` |
| Design tokens | `frontend/src/app/globals.css` |

## Before launch

Several claims are placeholders and must be confirmed or edited in the studio: certifications, press quotes, testimonials, hospitality figures, and the GSTIN on invoices. Payments are not yet connected to a gateway.
