# Game Design Contract

## North star

This is an **interactive RPG**. MCAT items are the magic system — the combat, puzzles, and trial logic inside missions — not a separate study mode bolted on.

If a session feels like flipping Quizlet cards, the design failed.

## Feel

- Harry Potter–inspired worlds, mentors, rivals, and trial chambers
- Advancement is earned by correct reasoning under pressure
- Side missions use real MCAT logic and unlock rewards
- The campaign reads as a **journey with a chosen companion**, not a quiz deck
- Campus feels like a place you **visit** (map pins + arrival beats), with a clear **Play** path — not a flashcard deck

## UX patterns borrowed (structure only — never their assets)

Inspired by public fan/official play hubs (location-visit school RPGs and guided “Play” activity sites):

| Pattern | How Arcanum does it |
| --- | --- |
| **Location visit** | Interactive campus board with pins; roster list; arrival dialogue at visits |
| **Year / area gating** | Day 1–4 path; halls unlock only after MCAT gate trials (≥60% mains) |
| **Guided Play path** | Numbered journey beats + “Play next trial” hub CTA |
| **Reward cadence** | Train / market / inn / hut open as score rewards; immersion after mastery |
| **Dialogue pacing** | Short scene beats before trials; skip-to-trial allowed |

**Refused:** scraping or cloning their images, audio, CSS, JS, trademarks, or character likenesses. We use our own code, licensed photos, original companions, and AAMC-derived study content.

## Structure

| Layer | What it is |
| --- | --- |
| **Companion** | Chosen at start; travels the map with the player (dialogue + path nudges) |
| **Campus atlas** | Interactive map + location roster; pins for halls and village visits |
| **Play journey** | Numbered main-trial beats across the year; Continue always points at the next open gate |
| **Worlds** | Four wings (~4 days): Asphodel, Mercury, Lodestone, Hall of OWLs |
| **Levels** | Story beats inside a world; clear to progress |
| **Side missions** | Optional NPC quests |
| **Trials** | MCAT encounters that gate unlocks |
| **Decisions** | Branching micro-choices after missions (flavor / inventory / suggestions) |

## Companions (legal naming)

Player companions are **Harry Potter–inspired archetypes with original names** — not trademarked character names or likenesses — so a public Pages build stays safer:

| Id | Name | Archetype |
| --- | --- | --- |
| `rowan` | Rowan Brightmane | Brave / Lionheart |
| `sage` | Sage Nightquill | Clever / Tower scholar |
| `pip` | Pip Hazelcroft | Loyal / Hearthkeeper |
| `vesper` | Vesper Blackmere | Ambitious / Green-coil |

Choice persists in save (`companionId`). Mentors (Elowen, Cassian, Bramble, Lyra) remain wing NPCs.

## Journey decisions

After a mission summary, the companion offers RPG choices (press on, side door, rest/Grimoire). Effects may set `flags`, `journey.mood`, inventory charms, or `journey.suggestedSideWorldId` (highlights a side quest). **These never replace the 60% main-clear rule.**

## Trial presentation

- Mission question queues are **shuffled each entry** (in memory). Selection still prefers spaced/weak items via `GameEngine` when `preferWeak` / `dynamicReview` apply — order is not persisted.
- Trials always show atmospheric art (`assets/` chamber/map/characters) plus topic glyphs.
- If a stem references a figure/image/graph and the pack has no `image`/`figureSrc`, show atmosphere + an honest note — **never invent fake AAMC figures**.

## Learning systems

- Spaced repetition on misses
- Mastery map by topic/skill
- Fault pattern tracking reshapes review side missions
- Diagnostic Incorrect items are pre-cursed (lower starting mastery)

## Soundtrack (adaptive underscore)

Music is part of the RPG feel — not a study playlist bolted on. Cues shift with **where you are** and **how far you’ve advanced**. Player can mute / set volume from the chrome bar; preference persists in `localStorage`.

### Cue map

| Cue id | When it plays | Mood |
| --- | --- | --- |
| `title` | Title + companion select | Invitation / wonder — first foot on Platform 9¾ |
| `map` | Castle map | Soft roaming ambient; brighter after campaign clear |
| `wing-asphodel` | Day 1 wing hub + dialogue | Candlelit herbology / ozone corridors |
| `wing-mercury` | Day 2 wing hub + dialogue | Metallic ticking, restless lab kinetic |
| `wing-lodestone` | Day 3 wing hub + dialogue | Heavy wire & force — deeper low strings |
| `wing-owls` | Day 4 wing hub + dialogue | Empty great hall; judgment quiet |
| `trial` | During MCAT trial questions | Higher tension variant of current wing |
| `trial-finale` | Final CoA Sanctum trial | Peak pressure — OWLs intensity |
| `ending` | Campaign clear | Triumph / leaving the hall |

### Advancement rules

1. **World theme** follows the active wing (`wing-*`); each cue **rotates** among a pool of files.
2. **Trials** swap to `trial` (or `trial-finale` on the last main) so combat pressure is audible.
3. **Map after campaign clear** may linger on a softer `ending` bed instead of plain `map`.
4. **Outcome stingers:** correct → success flourish + congratulate SFX; wrong → curse flourish + berate SFX (bed ducks briefly).
5. **Quest clear / world unlock** → `advance` pool; main-quest fail → `dark` pool.
6. Missing audio files fail silently — UI still works.

### File drop contract

Loopable MP3s under `audio/` use pool names, e.g. `audio/wing-asphodel-01.mp3`, `audio/title-02.mp3`. Stingers: `success-*`, `curse-*`, `congratulate-*`, `berate-*`, `advance-*`, `dark-*`. Live tables: `js/music.js`. Full attribution: [`docs/soundtrack.md`](soundtrack.md).

### Licensing note

Official Harry Potter / John Williams / Hogwarts Legacy score **cannot** be redistributed in the public Pages build. Shipped audio is CC0 / CC BY royalty-free inspired beds (see `docs/soundtrack.md`). Companion Spotify/Apple playlist URLs may hint at the real OST but are never embedded as game BGM.
