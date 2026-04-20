# Deploying Vigil to Vercel

10-minute walkthrough. Free tiers the whole way.

---

## 1. Create a free Postgres database on Neon

1. Go to https://neon.tech and sign up (no credit card).
2. Click **Create Project** → name it `vigil-demo` → pick the region closest to your users → **Create**.
3. Copy the connection string shown on the dashboard. It looks like:
   ```
   postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
   ```
   Save this — you'll paste it into Vercel.

## 2. Push your code to GitHub (if you haven't)

Already done per your message. Just make sure the latest commits are pushed.

## 3. Import the repo into Vercel

1. Go to https://vercel.com/new
2. Click **Import** on your GitHub repo.
3. Vercel auto-detects Next.js. **Do not change the build command** — `package.json` already handles it.
4. Expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | *paste the Neon connection string* |
   | `AUTH_SECRET` | *any 32+ char random string. Tip: run `openssl rand -base64 32`* |
   | `NEXT_PUBLIC_APP_URL` | Leave blank for now — Vercel will give you a URL in step 5, then set it |

5. Click **Deploy**. First build takes ~2-3 minutes.

## 4. After first successful deploy

1. Vercel shows a URL like `https://vigil-xyz.vercel.app`. Copy it.
2. Go to **Project Settings → Environment Variables**, set `NEXT_PUBLIC_APP_URL` = that URL.
3. **Redeploy** (Deployments → latest → … → Redeploy) so the new env var is picked up.

## 5. That's it

Visit your URL. On the first request, the app will:
- Create all Postgres tables (via `prisma db push` in the build step)
- Seed 80 demo employees, 3 templates, and 6 past campaigns with 90 days of activity
- Be ready to demo

### Login for the seeded demo
- Email: `admin@acme.demo`
- Password: `demo1234`

---

## What works without any paid keys

- ✅ Full dashboard, risk heatmap, campaign list
- ✅ AI Campaign Composer (mock templates that look like real AI output)
- ✅ Phishing landing page + gotcha + 90-sec training flow (share `/lure/<token>` links directly)
- ✅ Training Prescription API + SCORM export

## What needs paid keys later (optional)

- Real emails landing in employee inboxes → add `RESEND_API_KEY` (Resend free tier: 3k emails/month)
- Real vishing calls → add Twilio credentials (trial: $15 free credit)
- Smarter AI composer → add `LLM_API_KEY` from Groq (free, no card)

All three are plug-and-play — add the env var in Vercel, redeploy, done. No code changes.

---

## If something goes wrong

**"Table 'Org' does not exist"** → The build didn't run `prisma db push`. Check your Vercel build logs for the prisma step. Make sure `DATABASE_URL` is set correctly.

**"Connection pool timeout"** → Your Neon connection string is missing `?sslmode=require`. Add it.

**"AUTH_SECRET missing"** → Vercel environment variable wasn't saved for the current environment (Production/Preview). Re-add it and redeploy.

**Stuck on any step** — the demo admin credentials above always work once the DB is seeded. If you can't log in, the seed didn't run; check `/` loads first (seeding happens on first request).
