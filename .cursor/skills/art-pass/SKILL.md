---
name: art-pass
description: >-
  Improve Arcanum visuals with licensed photographic/atmosphere art, correct
  framing, and denser scene graphics. Use when faces are cropped, art is
  sparse, user rejects AI plates, mobile scroll/hit-testing breaks, or when
  adding assets under assets/ or updating art credits.
---

# Art pass

## Licensing (public Pages)

Ship only:

- Unsplash / Pexels / Pixabay Content License photos
- Project-generated **sigil** portraits (not celebrity / film likenesses)

**Never:** WB / Pottermore / film stills / trademarked logos / scraped hogwarts.io or SHP assets.

Ledger: `docs/art-credits.md`

## Framing

- Portraits: head-biased `object-position` / `background-position` — no chopped faces
- Scene panels: taller face-safe crops; moss/gold/deep palette (avoid purple AI-slop / generic cream-serif looks)
- Prefer photographic campus/chamber plates over toy “Minecraft” or obvious AI castle plates
- Map: real campus board art + location cards; lock copy names the MCAT gate

## Density without clutter

- Per-wing backgrounds, mission door thumbs, owl-post / hut / grounds accents
- Ambient corner vignettes OK; do not turn every screen into a card dashboard
- Trial screens: atmosphere + topic glyphs; question figures when pack provides them

## Mobile / interaction (common regression)

- Only **`html`** should scroll; avoid dual `html`+`body` `overflow-y: auto` (breaks hit-testing after wheel scroll)
- Burst/FX layers: `position: fixed` + `pointer-events: none`
- Scene content needs interactive stacking (`z-index`) so bottom CTAs remain clickable

## Parallel work

Do **not** regress `music.js` / audio SW rules while doing art. Touch audio only if asked.

## Ship checklist

- [ ] Assets under `assets/scenes/`, `assets/creatures/`, `assets/chars/` as needed
- [ ] Credits updated in `docs/art-credits.md`
- [ ] Cache bumped (`cache-bust-pwa`)
- [ ] Spot-check title, map, one trial, one portrait on desktop + narrow width

## Related

- `.cursor/skills/game-feel/SKILL.md`
- `.cursor/skills/audio-safe/SKILL.md`
