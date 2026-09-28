# Deploying Shakshi on Vercel

Shakshi is two apps in one repository, so it becomes **two Vercel projects** from the same GitHub repo:

| Vercel project | Root Directory | What it is |
|---|---|---|
| `shakshi-api` | `backend` | API, database access, emails and the password-protected admin (`/admin`) |
| `shakshi` | `frontend` | The shop your customers see |

Both are plain Next.js projects. Vercel detects the framework, the npm workspace and the shared code by itself;
leave the build settings at their defaults.

## Before you start

- The Supabase database is set up (tables, photo storage, customer sign-in codes).
- Your settings are ready to paste: `backend/.env.vercel.local` and `frontend/.env.vercel.local`.
  They hold your real keys, stay on your computer and are never uploaded to GitHub.
  (To make them again on another computer, see `.env.example` for every setting.)

## 1. Deploy the backend

1. Vercel → **Add New… → Project** → import `ghosttech07/Shakshi`.
2. **Project Name**: `shakshi-api`. **Root Directory**: click Edit → choose `backend`.
3. Open **Environment Variables**, click in the first Key box and **paste the whole contents of
   `backend/.env.vercel.local`**. Vercel fills in every row.
4. **Deploy**. Note the address it gives you, e.g. `https://shakshi-api.vercel.app`.

## 2. Deploy the shop

1. **Add New… → Project** → import the same repo again.
2. **Project Name**: `shakshi`. **Root Directory**: `frontend`.
3. Paste the contents of `frontend/.env.vercel.local` into Environment Variables.
4. Change `API_URL` to the backend address from step 1, e.g. `https://shakshi-api.vercel.app`.
5. **Deploy**. Note the shop's address, e.g. `https://shakshi.vercel.app`.

## 3. Connect the two

1. Shop project → Settings → Environment Variables: set `NEXT_PUBLIC_SITE_URL` to the shop's address.
2. Backend project → Settings → Environment Variables: set `FRONTEND_URL` to the shop's address.
3. Redeploy both (Deployments → ⋯ → Redeploy).

## 4. Check it

- Open the shop address: pages, menus and the 3D bed load.
- Open `<shop address>/admin`: it forwards to the admin; sign in with your password.
- Change something small in **Settings**, **Publish**, and see it on the shop within a few seconds.

## Emails (sign-in codes and order emails)

They're sent through Resend. Until a domain is verified in Resend, they only reach the Resend
account's own address, so customers can't receive sign-in codes yet (and signing in is needed to order).
When you have a domain:

1. Resend → **Domains → Add domain**, and add the DNS records it shows at your domain provider.
2. Set `EMAIL_FROM` (backend project) to an address on it, e.g. `Shakshi <orders@yourdomain.com>`, and redeploy.
3. Supabase → **Authentication → Emails → SMTP Settings**: change the sender email to the same address.

## Your own web address

Add it under the shop project's **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` (shop) and
`FRONTEND_URL` (backend) to it and redeploy both.

## Good to know

- Order-update emails for orders on the automatic calendar are sent by a daily job (`backend/vercel.json`);
  Vercel runs it automatically using `CRON_SECRET`.
- Customer sign-in limits are per visitor. The shop passes each visitor's address to the backend,
  proven with `REVALIDATE_SECRET`, so **both projects must have the same `REVALIDATE_SECRET`**.
- If the admin says *"This server has no database yet…"*, the Supabase settings are missing from the
  backend project: add them and redeploy.
- Moving local data to a fresh Supabase project: add its keys to `backend/.env.local` and run `npm run db:push`.
