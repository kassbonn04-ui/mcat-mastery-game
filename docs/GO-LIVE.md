# Go live — online + phone app

## What “app on phone” means here

This is a **Progressive Web App (PWA)**. After it’s online (HTTPS):

- **iPhone (Safari):** Share → **Add to Home Screen** → opens like an app
- **Android (Chrome):** menu → **Install app** / **Add to Home screen**

True App Store / Play Store apps are a later optional step. PWA is the fast path.

## Live URL

**Play here:** https://kassbonn04-ui.github.io/mcat-mastery-game/

**Public mirror repo:** https://github.com/kassbonn04-ui/mcat-mastery-game  
(Needed because `sledgeworks/family` is private and free GitHub Pages wasn’t available there.)

## Status checklist

| Step | Who | Status |
| --- | --- | --- |
| PWA + mobile polish in code | Agent | Done |
| Commit game to `family` repo | Agent | Done |
| Public Pages deploy | Agent | Done — live |
| Install on phone from the live URL | You | Do this next |

## What we need from you (in order)

### 1) Say yes to committing & publishing

Reply something like: **“Commit and publish the game.”**

That lets the agent commit `Kass/mcat-mastery-game` (and the Pages workflow) to the family repo.

### 2) Re-login to GitHub on this PC (required)

GitHub CLI auth is currently **invalid**. In PowerShell or Terminal:

```powershell
gh auth login -h github.com
```

Choose: **GitHub.com** → **HTTPS** → **Login with a web browser**.

Use the account that can push to `sledgeworks/family`.

Tell the agent when that finishes.

### 3) Confirm hosting preference

**A (default):** GitHub Pages on `sledgeworks/family`  
→ URL will look like: `https://sledgeworks.github.io/family/`

**Note:** Free GitHub Pages for private repos needs GitHub Pro. If the repo is private and Pages fails, we switch to **Netlify** (still free, still installable as an app).

**B:** Netlify drop-deploy (agent can guide; you click “Deploy”)

### 4) On your phone (after URL is live)

1. Open the link in Safari (iPhone) or Chrome (Android)
2. Add / Install to Home Screen
3. Play from the new icon — progress saves on that phone’s browser

## Privacy note

The game includes AAMC sample-test study material from your diagnostic export. Prefer a **private** host if you don’t want that public. Netlify password protection or a private Pages setup are options if needed.
