---
name: cache-bust-pwa
description: >-
  Bump PWA/service-worker cache and script query versions so local and GitHub
  Pages builds show new CSS/JS/assets. Use when the user cannot see changes,
  after UI/JS/CSS/SW edits, before publish, or when mentioning hard-refresh,
  stale cache, or “old version.”
---

# Cache bust (PWA)

## Why

This game is a PWA. Stale `sw.js` / `?v=` params are the #1 reason Kass reports “I’m not seeing the changes.”

## Always bump together

1. **`sw.js`** — `const CACHE = "mcat-mastery-vN-slug";`  
   - Increment `N`  
   - Slug = short kebab of the change (e.g. `elements-home`)
2. **`index.html`** — every `?v=N` on CSS, JS, manifest, and `sw.js` registration must match the new `N`
3. **`progress.md`** — note the new cache tag + local preview `http://127.0.0.1:8765/?v=N`

## Do not regress SW audio rules

While editing `sw.js`:

- Network-first for `.js` / `.css` / HTML is fine
- **Never intercept** `.mp3` / `/audio/` (Range + SW stalls `Audio.play()` on Chromium/Pages)
- Prefer per-file `cache.add` over `addAll` for install
- Large scene images: network-first OK; do not precache entire `audio/` on install

## Verify

- Grep: `CACHE` in `sw.js` and `?v=` in `index.html` share the same integer
- Tell user: hard-refresh or reopen the Home Screen app after Pages deploy

## Related

- Publish flow: `.cursor/skills/commit-and-publish/SKILL.md`
- Audio invariants: `.cursor/skills/audio-safe/SKILL.md`
