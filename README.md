# Vigil — AI Human Risk Platform

A multi-vector phishing & vishing simulation platform with adaptive training, behavior-weighted risk scoring, and LMS bridge APIs.

## What's inside

- **Next.js 16 + React 19 + Tailwind v4 + Base UI (shadcn)** frontend
- **Prisma + SQLite** for zero-dependency local runs (switch `DATABASE_URL` to Postgres for prod)
- **AI Campaign Composer** — one sentence in, full email + landing + voice script + training out
- **Email phishing pipeline** with tracked landing pages, open pixels, click/submit/report capture
- **Vishing engine** over Twilio Voice + Polly TTS + DTMF/speech capture
- **90-second micro-training** rendered in-browser with a scored quiz
- **Behavior-weighted risk score** with 45-day half-life decay
- **Training Prescription API** + SCORM/xAPI export for any LMS
- **Ethical Simulation Principles** enforced at the platform level

## Run locally

```bash
npm install
npx prisma migrate deploy
npm run seed
npm run build && npm start
```

Visit http://localhost:3000

Demo admin: `admin@acme.demo` / `demo1234`

## Demo flow for the pitch

1. `/` — landing page. Scroll to Ethics and LMS sections.
2. `/login` — sign in with the seeded admin.
3. `/dashboard` — stats, trends, highest-risk, recent activity.
4. `/campaigns/new` — the wow moment.
   - Type: "Finance team. Fake invoice from vendor 'Kyocera' asking for urgent wire to new account."
   - Click **Compose** — email, landing page, voice script, and training module all appear.
   - Select targets, click **Launch**.
5. `/risk` — department heatmap.
6. `/lms` — create an API key, curl the Prescription API live.

For the live vishing demo: add your own phone to an employee record, launch a voice campaign, and your phone rings with an AI voice.

## Plug in real services (optional)

Everything works in "preview mode" without any keys. To go live, set env vars:

| Feature | Env vars |
|---|---|
| LLM Composer (AI-generated scenarios) | `LLM_PROVIDER=groq`, `LLM_API_KEY=...`, `LLM_MODEL=llama-3.3-70b-versatile`, `LLM_BASE_URL=https://api.groq.com/openai/v1` |
| Email delivery | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY=...`, `EMAIL_FROM="Alerts <alerts@your-domain.com>"` |
| Voice calls | `TWILIO_ACCOUNT_SID=...`, `TWILIO_AUTH_TOKEN=...`, `TWILIO_FROM_NUMBER=+1...` |
| Realistic TTS (optional) | `ELEVENLABS_API_KEY=...`, `ELEVENLABS_VOICE_ID=...` |

Without keys, the app:
- Generates high-quality deterministic mock campaigns (invoice fraud, IT support, courier — pick by keyword)
- Logs "email sent" to the console instead of hitting Resend
- Logs "call would be placed" instead of calling Twilio

This means **the whole MVP demo runs offline**, and you can swap in live keys when ready without touching code.

## Key routes

- `/` — marketing landing
- `/ethics` — Ethical Simulation Principles
- `/login`, `/signup` — auth
- `/dashboard` — admin overview
- `/campaigns`, `/campaigns/new`, `/campaigns/[id]` — simulation management
- `/employees` — enrollment and CSV import
- `/risk` — behavior-weighted heatmap
- `/templates` — scenario library
- `/lms` — API keys + xAPI LRS config
- `/settings` — workspace + integration status
- `/lure/[token]` — what a phished employee sees
- `/gotcha/[token]` — post-click educational moment
- `/train/[token]` — 90-second micro-training

## API

- `GET /api/v1/prescription/{employeeId}` — Training Prescription JSON
- `GET /api/v1/scorm/{templateId}` — SCORM 2004 bundle
- `GET /api/track/open/{token}` — 1x1 open-tracking pixel
- `POST /api/voice/twiml` — Twilio TwiML for vishing calls
- `POST /api/voice/gather` — DTMF / speech capture callback
- `POST /api/voice/status` — call lifecycle callback

## Deploy

### Vercel (recommended for demo link)

```bash
# One-time
vercel link

# Every deploy
vercel --prod
```

Set env vars in the Vercel dashboard. For the database, Vercel SQLite isn't persistent — use [Neon](https://neon.tech) Postgres (free tier). Swap in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then `npx prisma migrate deploy && npm run seed`.

## What disadvantages this addresses

| Industry complaint | Vigil's answer |
|---|---|
| Legacy tools have dated UIs | Tailwind v4 + shadcn + motion, dark-first, 2026-era |
| Admin burden is heavy | AI Composer generates full campaign in one prompt |
| Weak on AI threats (deepfake voice) | AI vishing is the hero feature, not an afterthought |
| One-size-fits-all content | Per-employee risk score, personalized prescription |
| Click-rate is a vanity metric | Behavior-weighted score with time decay + reporting credit |
| 15-minute training modules | 90-second micro-training at the gotcha moment |
| SCORM export is all the LMS story | Training Prescription API + SCORM + xAPI webhook |
| Legal / ethics landmines | Platform-level refusals, consent framework, generic voices only |
| Multi-tenant missing (GoPhish) | Org-scoped from day one |
| False positives from scanners | Token-based tracking with metadata for filtering |

## License

Proprietary — Vigil pilot MVP.
