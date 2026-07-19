---
name: audio-safe
description: >-
  Debug or change MCAT Mastery soundtrack/SFX without breaking playback.
  Use when music is silent, abrupt, too loud, missing on Pages/PWA, or when
  editing music.js, sw.js audio rules, or files under audio/.
---

# Audio-safe changes

## Canonical files

- `js/music.js` — cue map, beds, stingers, unlock
- `audio/` — royalty-free loops + Kenney UI (see `docs/soundtrack.md`)
- `sw.js` — must **not** intercept `/audio/` or `.mp3`
- Prefs: `localStorage` key `mcat-mastery-music-v1`

## Hard invariants (do not regress)

1. **Gesture window:** First bed `Audio.play()` must run inside the user gesture. Never `await` network probes before that play.
2. **Unlock path:** Title/companion **Enable sound** = unlock + play in one click handler.
3. **No double-kill:** Track `activeBedCue` / `bedStarting`; skip non-force restart of the same bed. A later `sync()` must not abort the gesture play via `playGeneration`.
4. **Fades:** Per-audio fade timers (shared timer cancelled beds ? volume stuck at 0).
5. **SW:** Do not put `.mp3` / `/audio/` through the service worker (Range request stall).
6. **Install:** Do not `addAll` dozens of MP3s; audio is network / direct.
7. **Licensing:** No official HP / Williams / Skyrim OST in the public repo. CC0/CC BY only; credit in `docs/soundtrack.md`.

## Feel targets

- Skyrim-like: long bed crossfades (~3s), soft stinger ducking — not hard cuts
- Outcome: whimsical success vs darker curse flourishes; vary pools
- Leave audio alone unless the user asked — parallel art work must not “fix” music.js

## Silence checklist

1. Live vs local: does `music.js` load? HUD `?` / Enable sound?
2. Browser autoplay blocked? Gesture path only.
3. Volume stuck at 0? Fade / prefs.
4. SW intercepting audio? Inspect `sw.js` fetch handler.
5. Missing files? Pool probes / HUD Missing state.
6. After fix: bump cache (skill `cache-bust-pwa`) before publish.

## Related

- `docs/soundtrack.md`, `docs/game-design.md` (cue map)
