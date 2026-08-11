# Deploy checklist

Everything is committed already — the folder you unzipped **is** a git repo with
one commit on `main`. You do not need to run `git init` or `git commit`.

---

## Step 1 — Put it on GitHub (~2 min, no terminal)

**Easiest: GitHub Desktop**
1. Open GitHub Desktop → `File` → `Add local repository…`
2. Choose this folder (`partypage-builder`).
3. Click **Publish repository**. Name it `partypage-builder`. Untick "Keep this
   code private" if you want it public.

**Or with a terminal**, from inside this folder:
```bash
git remote add origin https://github.com/harkiratz-beep/partypage-builder.git
git push -u origin main
```
(Create the empty repo at https://github.com/new first — no README, no
.gitignore, no licence.)

---

## Step 2 — Netlify (~2 min)

1. https://app.netlify.com → **Add new site** → **Import an existing project**
2. Connect GitHub, pick `partypage-builder`.
3. Build settings are already correct — `netlify.toml` is in the repo.
4. Add these three environment variables (Site configuration → Environment
   variables). Copy them exactly:

```
NEXT_PUBLIC_SUPABASE_URL
https://bztbpkcvjcuqqprwksdr.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dGJwa2N2amN1cXFwcndrc2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDM4MzEsImV4cCI6MjEwMjAxOTgzMX0.aYmF55C8ivJ279tJIG_2pv5WW6tqlDZsAC9rqZOz9dY

NEXT_PUBLIC_SITE_URL
https://YOUR-SITE-NAME.netlify.app     ← fill in after Netlify assigns it
```

The anon key is safe to expose — it is designed to be public, and Row Level
Security is what protects the data. Never add a service-role key here.

5. **Deploy**.

---

## Step 3 — Tell Claude the URL

Paste your `https://….netlify.app` address back into the chat. Claude will then:
- add it to Supabase → Authentication → URL Configuration (otherwise your
  host sign-in link will fail)
- update `NEXT_PUBLIC_SITE_URL` guidance if needed
- walk through the first real end-to-end test

---

## What to test once it is live

| Check | Expected |
|---|---|
| `/aarav-turns-5` | the invite renders |
| Submit an RSVP | confirmation appears |
| Same phone, reply again | it corrects, does not duplicate |
| `/meher-turns-3` | 404 (it is a draft) |
| `/admin` | redirects to `/login` |
| Sign in via emailed link | lands on `/admin` |

The RSVP is the important one — it is the only path that has never run against
real Supabase over a network.
