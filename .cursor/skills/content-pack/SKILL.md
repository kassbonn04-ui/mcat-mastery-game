---
name: content-pack
description: >-
  Add or fix MCAT question packs, passages, figures, shuffle/mastery wiring.
  Use when ingesting AAMC/markdown content, questions wrong or missing
  graphics, randomization, diagnostic seeding, or expanding beyond Q1–50.
---

# Content pack

## Canonical paths

| Path | Role |
| --- | --- |
| `content/raw/` | Source markdown / exports |
| `js/questions.js` | Browser pack (`window.QUESTION_PACK`) |
| `js/questions-extra.js` | Extra / overflow items if used |
| `js/engine.js` | Mastery, SR, weak preference, shuffle helpers |
| `js/campaign.js` | Worlds / levels / which questions attach |

Source of starter pack: `Kass/MCAT/aamc-sample-test-q1-50.md` (or copy under `content/raw/`).

## Question object shape

Keep fields consistent with existing pack:

- `id`, `number`, `section`, `passageLabel`, `passage`, `stem`
- `choices` `{A,B,C,D}`, `correct`, `solution`
- `topic`, `skill`
- `image` / `figureSrc` (URL or asset path) — **null if none**
- `figureNote` — honest note when stem implies a figure but no asset exists
- `diagnostic` — `{ result, yourAnswer }` when seeding from Kass’s results

## Rules

1. **Never invent fake AAMC figures.** Atmosphere art + `figureNote` if missing.
2. Wire stem/passage images so trials render them (`app.js` checks `image` / `figureSrc`).
3. Mission queues: build pool (prefer weak/spaced when flags say so) then **shuffle presentation** each entry; do not persist order.
4. Incorrect diagnostic items ? lower starting mastery / earlier SR due (engine seed behavior).
5. After pack edits: bump cache (`cache-bust-pwa`) so Pages picks up `questions.js`.

## Ingest workflow

1. Drop export in `content/raw/`
2. Parse ? append/merge into `js/questions.js` (or generate then paste)
3. Attach new items to campaign levels/sides in `campaign.js` without turning the UI into a deck browser
4. Sanity-check a few IDs in the running game (passage, choices, correct key, image)

## Related

- Feel/gates: `.cursor/skills/game-feel/SKILL.md`
