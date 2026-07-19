---
name: reorient
description: >-
  Re-orient the agent on MCAT Mastery / Arcanum after a gap or when revisiting
  the project. Use when the user says they are revisiting, asks where things
  stand, starts a new session after time away, or wants a status / handoff
  summary before new work.
---

# Reorient — session start

## When

User is returning to the project, unclear on state, or asks “where are we?”

## Read first (in order)

1. `progress.md` — current workstream, recent bullets, blockers
2. `DECISIONS.md` — last ~10 entries (do not re-litigate)
3. `docs/game-design.md` — north star (RPG, not Quizlet)
4. `git log --oneline -8` from git root `C:\Users\C2K\family` (paths under `Kass/mcat-mastery-game`)
5. Live check if relevant: https://kassbonn04-ui.github.io/mcat-mastery-game/ — note SW `CACHE` in `sw.js` vs local

## Output to user

Short handoff only:

- **Current workstream** (one line)
- **Last shipped** (version / cache tag if known)
- **Open blockers**
- **Safe next step** (one concrete task)

Do not rebuild the game from scratch. Do not re-propose settled DECISIONS.

## Stale gate

If `progress.md` has no update in 7+ days, warn and ask what changed offline before coding.
