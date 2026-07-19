---
name: game-feel
description: >-
  Keep MCAT Mastery feeling like an RPG journey with forced learning gates,
  not a Quizlet clone. Use when changing navigation, campus/Play hub, trials,
  companions, dialogue, progression, or when the user says it feels like a
  quiz, flashcards, Minecraft, or wants hogwarts.io / SHP Play–style structure.
---

# Game feel (RPG contract)

## North star

Read `docs/game-design.md`. If a change makes the session feel like flashcards, reject or redesign it.

## Forced learning (never weaken)

- Main trials gate world unlocks (**?60%** clear)
- Spaced repetition + mastery + fault patterns stay in the loop
- Post-mission **decisions** are flavor only — never override gates
- Questions are the combat system (~majority of play time); world chrome supports the quest

## Structure patterns (borrow UX, never assets)

Inspired by public hubs (location-visit school RPGs / guided Play sites):

| Pattern | Arcanum |
| --- | --- |
| Location visit | Campus pin map + roster + arrival dialogue |
| Year gating | Day 1–4; halls unlock after MCAT gates |
| Play path | Numbered beats + “Play next trial” CTA |
| Reward cadence | Train / market / inn / hut after score rewards |

**Refuse:** scraping their images, CSS, JS, audio, trademarks, or character likenesses.

## Legal naming (public Pages)

Companions use **original** names only:

| Id | Name |
| --- | --- |
| `rowan` | Rowan Brightmane |
| `sage` | Sage Nightquill |
| `pip` | Pip Hazelcroft |
| `vesper` | Vesper Blackmere |

Do not ship trademarked HP character names/likenesses in UI copy for the public build. House-elf / owl-post FX can be *inspired* without naming Dobby etc. in player-facing strings.

## Journey

- Companion chosen at start ? `companionId` in `mcat-mastery-save-v1`
- Mission queues shuffled each entry (`GameEngine.shuffleArray`); selection may still prefer weak/spaced items
- Home / Save & Home + `activeMission` resume are part of the product loop

## Anti-patterns from past chats

- Pure quiz UI with no place/visit framing
- Dim unreadable “Minecraft” worlds as the whole game
- Navigation that traps scroll or breaks bottom clicks (mobile)
- Inventing AAMC figures when pack has no image

## Related

- Art/licensing: `.cursor/skills/art-pass/SKILL.md`
- Questions: `.cursor/skills/content-pack/SKILL.md`
