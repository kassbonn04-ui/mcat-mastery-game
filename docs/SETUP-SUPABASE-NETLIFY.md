# Setup — Supabase + Netlify (Arcanum)

Progress already saves on-device. Supabase adds **cloud sync** (phone ↔ laptop). Netlify hosts the live site with keys injected at build time.

## What Kass needs from her partner (or Supabase owner)

Ask them to either **create a project** or **invite Kass** to an existing one, then send:

1. **Project URL** — looks like `https://xxxx.supabase.co`
2. **anon public key** — Settings → API → `anon` `public`  
   (Never send the `service_role` key.)
3. Optional: **invite Kass as a developer** on the Supabase org/project

Also confirm they can create a **Netlify** site (or invite Kass) and paste those two values as env vars.

---

## Step A — Supabase (database)

1. Open [supabase.com](https://supabase.com) → the project
2. **SQL Editor** → New query
3. Paste everything in `supabase/schema.sql` → **Run**
4. **Authentication → Providers** → Email enabled (password signups on)
5. **Authentication → URL configuration**  
   - Site URL: your Netlify URL (e.g. `https://arcanum-mcat.netlify.app`)  
   - Redirect URLs: add that same URL (and `http://localhost:5500` if testing locally)

Done when the `game_saves` table exists under **Table Editor**.

---

## Step B — Netlify (hosting)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → Import from Git  
   - Repo: `kassbonn04-ui/mcat-mastery-game` (or the family repo with base directory `Kass/mcat-mastery-game`)
2. Build settings (should read from `netlify.toml`):
   - **Build command:** `bash scripts/write-config.sh`
   - **Publish directory:** `.`
3. **Site configuration → Environment variables** → Add:
   - `SUPABASE_URL` = `https://xxxx.supabase.co`
   - `SUPABASE_ANON_KEY` = the anon key
4. Deploy

Live URL will look like: `https://something.netlify.app`

---

## Step C — Kass plays with sync

1. Open the Netlify URL on phone + laptop
2. **Cloud account** → Create account (her email + password)
3. Play — progress uploads after each cast
4. On the other device: Sign in → **Restore from cloud** (or it merges on sign-in)

Partner can create their **own** account for a separate save. Same database, private rows (RLS).

---

## Local testing (optional)

1. Copy `js/config.example.js` → `js/config.js`
2. Paste URL + anon key
3. Open `index.html` (or any static server)

---

## Checklist for chat

Paste back here when ready (safe — anon key is public-by-design):

```
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJ...
NETLIFY_URL=https://....netlify.app   (once deployed)
```

Then I can verify sync end-to-end and point the phone home-screen icon at Netlify.
