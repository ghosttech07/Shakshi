# Deploying Shakshi on Vercel

Shakshi is two apps in one repository, so it becomes **two Vercel projects** from the same GitHub repo:

| Vercel project | Root Directory | What it is |
|---|---|---|
| `shakshi-api` | `backend` | API, database access, uploads and the password-protected admin (`/admin`) |
| `shakshi` | `frontend` | The shop your customers see |

Both are plain Next.js projects; Vercel detects the framework, the npm workspace and the shared code by itself.

---

## 1. Database (Supabase), once

Vercel's servers can't keep files, so the live site stores everything in Supabase.

1. In [supabase.com](https://supabase.com), open your project → **SQL Editor**.
2. Paste and run `backend/supabase/migrations/0001_init.sql`, then `0002_media_bucket.sql`.
3. **Project Settings → API**: copy the **Project URL** and the **service_role** (secret) key.

To bring over everything you've already set up on your computer (products, pages, site settings,
articles, reviews, orders and uploaded photos), add those two values to `backend/.env.local`:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

then run, from the repository folder:

```
npm run db:push
```

It's safe to run again; rows are matched by id.

### Customer sign-in codes (Supabase → Authentication)

Customers sign in with a code emailed by Supabase. Supabase's standard email contains a link, so
change it to show the code:

1. **Authentication → Emails → Templates → Magic Link**: set the subject to `Your Shakshi sign-in code`
   and the body to:
   ```html
   <h2>Your sign-in code</h2>
   <p>Enter this code on the Shakshi website to sign in:</p>
   <p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
   <p>It expires in one hour. If you didn't ask for it, you can ignore this email.</p>
   ```
2. Do the same for **Confirm signup** (new customers receive that one first).
3. **Authentication → Emails → SMTP Settings**: turn on custom SMTP. Supabase's built-in sender
   only manages a few emails an hour. With Resend: host `smtp.resend.com`, port `465`,
   username `resend`, password = your Resend API key, sender = an address on your verified domain.

## 2. Backend project (`shakshi-api`)

Vercel → **Add New… → Project** → import the GitHub repo → **Root Directory: `backend`** → add these
**Environment Variables** → Deploy.

| Name | Value |
|---|---|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
| `ADMIN_PASSWORD_HASH` | The bcrypt hash of your admin password (see below) |
| `ADMIN_SESSION_SECRET` | 32+ random characters (copy it from `backend/.env.local`, or make a new one) |
| `ADMIN_PATH` | `admin` |
| `REVALIDATE_SECRET` | Any long random text; **the same value** goes in the frontend project |
| `FRONTEND_URL` | The shop's address, e.g. `https://shakshi.vercel.app` (fill in after step 3, then redeploy) |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) → API Keys. Sends order confirmations and delivery updates |
| `EMAIL_FROM` | e.g. `Shakshi <orders@yourdomain.com>`, once your domain is verified in Resend |
| `CRON_SECRET` | Any long random text; lets Vercel run the daily order-update emails |
| `ANTHROPIC_API_KEY` | Optional: turns on the AI Sleep Concierge |

**The admin password hash**: copy the `ADMIN_PASSWORD_HASH=` value from `backend/.env.local`.
It's written there with `\$` in place of each `$`; you can paste it either way, both work.
To choose a new password instead, run `npm run studio:setup -- "your new password"` and copy the new hash.

## 3. Frontend project (`shakshi`)

Import the same repo again as a second project → **Root Directory: `frontend`** → environment variables → Deploy.

| Name | Value |
|---|---|
| `API_URL` | The backend project's address, e.g. `https://shakshi-api.vercel.app` |
| `REVALIDATE_SECRET` | Same value as in the backend |
| `NEXT_PUBLIC_SITE_URL` | The shop's public address, e.g. `https://shakshi.vercel.app` (or your own domain) |
| `STUDIO_ORIGIN` | Optional; defaults to `API_URL` (the admin's address, allowed to show live previews) |

Then go back to the backend project, set `FRONTEND_URL` to this shop address, and **redeploy** the backend.

## 4. Check it

- Open the shop address: pages, menus and the 3D bed load.
- Open `<shop address>/admin`: it forwards to the admin; sign in with your password.
- Change something small in **Settings**, **Publish**, and see it on the shop within a few seconds.

If the admin says *"This server has no database yet…"*, the Supabase variables are missing from the
backend project: add them and redeploy.

## Your own domain

Add it under the frontend project's **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL`
(frontend) and `FRONTEND_URL` (backend) to it and redeploy both.
