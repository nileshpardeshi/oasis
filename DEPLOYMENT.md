# OASIS — Vercel Deployment Guide

The OASIS web app is a **Next.js 14 + TypeScript** app located in the **`frontend/`** sub-directory of this repo. Vercel deploys it natively (SSR + serverless). The single most important setting is the **Root Directory = `frontend`**, because the app is not at the repo root.

> Build is verified locally (`next build` → ✓ compiled, 26 routes). The app currently runs on **mock data** (no backend/DB/env vars required to deploy).

---

## Option A — Git integration (recommended)

This gives you automatic production deploys on every push to `main`, and a preview deployment for every pull request.

1. Go to **[vercel.com/new](https://vercel.com/new)** and sign in (GitHub).
2. **Import** the repository: `nileshpardeshi/oasis`.
3. In the configure screen, **set the Root Directory to `frontend`**
   *(Edit → Root Directory → type `frontend` → Continue).* ← **required**
4. Framework is auto-detected as **Next.js** (also declared in `frontend/vercel.json`). Leave the auto-detected defaults:
   - Build Command: `next build`
   - Install Command: `npm install`
   - Output: managed automatically by Vercel's Next.js integration (SSR + static)
5. **Environment Variables:** none needed yet (mock data). *(See "Future" below.)*
6. Click **Deploy**. You'll get a `*.vercel.app` URL in ~1–2 minutes.

After this, every push to `main` redeploys production; PRs get preview URLs.

---

## Option B — Vercel CLI

```bash
npm i -g vercel

# from the app directory (important — the app is in frontend/)
cd frontend
vercel            # first run: log in + link the project (accept Next.js defaults)
vercel --prod     # promote to production
```
The CLI deploys the current directory (`frontend/`), so it inherently uses the correct root.

---

## What's configured in the repo

| File | Purpose |
|---|---|
| `frontend/vercel.json` | Declares the framework (Next.js) so Vercel applies the correct preset |
| `frontend/package.json` → `engines.node: "20.x"` | Pins the Node runtime on Vercel |
| `.gitignore` → `.vercel` | Keeps the local Vercel link folder out of git |

> **Root Directory** is a Vercel **project setting**, not a repo file — you must set it to `frontend` once during import (Option A) or it's implicit via `cd frontend` (Option B).

---

## Notes

- **Rendering:** Most pages are static; `/invoicing/batches/[id]` is server-rendered → Vercel runs it as a serverless function automatically. No extra config.
- **Embedding in Opus Sync:** no `X-Frame-Options` is set, so the app can be embedded via iframe / linked from Opus Sync. (Tighten later with a `Content-Security-Policy: frame-ancestors` rule once the Opus Sync origin is known.)
- **Custom domain:** add it later in Vercel → Project → Settings → Domains (e.g., `oasis.opustech…`), then link from Opus Sync.

## Future (when the backend lands)

When the Spring Boot + FastAPI services exist, add environment variables in
**Vercel → Project → Settings → Environment Variables**, e.g.:

```
NEXT_PUBLIC_API_BASE_URL = https://api.oasis.opustech.example
```

and replace the mock data layer (`frontend/lib/invoicing/*`) with calls to those APIs. The backend itself is **not** deployed on Vercel — it runs on the cloud/infra described in `invoice.md` (§15) and `implementation_plan.md` (§14). Vercel hosts only this frontend.
