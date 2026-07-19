# Soundtrack & licensing

In-game BGM is **royalty-free / CC-licensed wizarding-inspired** music hosted under `audio/`.  
We do **not** redistribute the official Harry Potter, John Williams, Hogwarts Legacy, or Skyrim scores in this public GitHub Pages repo.

For the “homepage OST” *feel*, the title cue uses warm, magical invitation beds (piano/orchestral fairy-tale + enchanted valley + frost waltz). Companion Spotify/Apple playlist URLs can be pasted into `js/music.js` (`playlistUrl`) later — those open the real score in native apps and are never embedded as PWA BGM.

Full attribution for every shipped file is below. Cue rotation, long crossfades, ambient under-beds, and soft UI/vocal SFX are implemented in `js/music.js`.

---

## Cue → files

| Cue / stinger | Files (rotated) | Mood |
| --- | --- | --- |
| `title` | `title-01`, `title-02`, `map-04` | Warm invitation |
| `map` | `map-01`…`map-05` | Castle roam / pastoral |
| `ambient` | `ambient-01`…`03` | Soft under-bed (menus/explore) |
| `wing-asphodel` | `wing-asphodel-01`…`04` | Greenhouse warmth |
| `wing-mercury` | `wing-mercury-01`, `02` | Kinetic lab |
| `wing-lodestone` | `wing-lodestone-01`, `02` | Force / low tension |
| `wing-owls` | `wing-owls-01`…`04` | Judgment / empty hall |
| `trial` | `trial-01`, `02` | Question pressure |
| `trial-finale` | `trial-finale-01`, `02` | Peak OWL pressure |
| `ending` | `ending-01`…`03`, `map-05` | Triumph |
| `success` / `congratulate` | soft chimes + warm vocal pads + Kenney confirms | Correct ward |
| `curse` / `berate` | soft thuds + soft vocal pads + Kenney errors | Wrong answer |
| `cast` / `whoosh` / UI | generated soft WAV clicks, doors, whooshes | Interaction layer |
| `advance` | `advance-*` + warm vocal pad | Quest / world unlock |
| `dark` | `dark-*` + soft vocal pad | Mission fail beat |

Beds are loopable MP3 sized for PWA. UI/vocal one-shots are short WAV (plus MP3 fallbacks). Stingers are quieter than beds and spaced so they do not stack abruptly.

---

## Source tracks & licenses

### OpenGameArt

| Shipped as | Source title | Author | License | URL |
| --- | --- | --- | --- | --- |
| `title-01`, parts of `advance-01`, `success-flourish-01` | Once Upon a Time (loop) | TAD | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | https://opengameart.org/content/once-upon-a-time-loop |
| `ending-01`, `advance-04`, `success-flourish-03` | Fantasy Orchestral Theme | Joth | CC0 (credit appreciated) | https://opengameart.org/content/fantasy-orchestral-theme |
| `map-01` | My Little Castle (Loop) | Kim Lightyear (KLY) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | https://opengameart.org/content/my-little-castle-loop |
| `wing-owls-03`, `dark-03`, `curse-flourish-03` | Abandoned Castle Music (Loop) | StarNinjas | CC0 (credit appreciated) | https://opengameart.org/content/abandoned-castle-music-loop |

### Kevin MacLeod (incompetech.com)

All listed MacLeod tracks: **CC BY 3.0** — https://creativecommons.org/licenses/by/3.0/  
Credit form: *“[Track] Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 3.0”*

| Shipped as | Track |
| --- | --- |
| `title-02`, `wing-asphodel-01`, `advance-02` | Enchanted Valley |
| `map-02` | Midnight Tale |
| `map-03` | Angevin |
| `map-04` | Frost Waltz |
| `map-05`, also in `ending` pool | Ascending the Vale |
| `ambient-01` | Comfortable Mystery 2 |
| `ambient-02` | Comfortable Mystery 3 |
| `ambient-03` | Comfortable Mystery 4 |
| `wing-asphodel-02` | Folk Round |
| `wing-asphodel-03` | Rites |
| `wing-asphodel-04` | Dreamy Flashback |
| `wing-mercury-01` | Wizardtorium |
| `wing-mercury-02` | Celtic Impulse |
| `wing-lodestone-01`, `trial-finale-02` | Unholy Knight |
| `wing-lodestone-02` | Mystic Force |
| `wing-owls-01`, `dark-01`, `curse-flourish-01` | Oppressive Gloom |
| `wing-owls-02` | Hiding Your Reality |
| `wing-owls-04` | Lost Time |
| `trial-01`, `dark-02`, `curse-flourish-02` | Darkest Child |
| `trial-02` | Volatile Reaction |
| `trial-finale-01` | The Pyre |
| `ending-02` | Truth of the Legend |
| `ending-03`, `advance-03`, `success-flourish-02` | Heroic Age |

### Kenney.nl Interface Sounds (CC0)

Source pack: https://opengameart.org/content/interface-sounds (also kenney.nl)  
License: [CC0](https://creativecommons.org/publicdomain/zero/1.0/) — credit “Kenney.nl” appreciated, not required.

| Shipped as | Kenney file / note |
| --- | --- |
| `success-01`…`04` | `confirmation_001`…`004` |
| `curse-01`…`04` | `error_001`…`004` |
| `congratulate-01`…`04` | `maximize_*`, `glass_001`, `open_001` |
| `berate-01`…`04` | `scratch_*`, `glitch_001`, `close_001` |
| `ui-*-01.mp3` fallbacks | Quiet copies of Kenney confirms / opens for Safari-safe MP3 paths |

### Soft generated UI / vocal pads (original)

Short WAV files under `audio/` (`ui-*.wav`, `cast-whoosh-01.wav`, `success-chime-*.wav`, `curse-thud-*.wav`, `vocal-*.wav`) are original synthesized tones (soft plucks, whooshes, and choir-like sine pads). They are not celebrity voices and are free to redistribute with the game. Dialogue text remains on-screen; pads only color companion mood.

---

## Companion playlist (optional — real OST)

These are **hints only**. Do not download or commit official score audio.

| Moment | Suggested companion listen |
| --- | --- |
| Title | Hedwig’s Theme / Harry’s Wondrous World |
| Map | Hogwarts Forever / Moving Stairs |
| Asphodel | Greenhouse / soft Hogwarts Legacy roam |
| Mercury | Diagon Alley / Hogsmeade bustle |
| Lodestone | Chess Game / Guardians tension |
| OWLs | Entry into the Great Hall (quieter) |
| Trial | In the Devil’s Snare / anticipation cues |
| Finale | Face of Voldemort / restrained Legacy boss energy |
| Ending | Leaving Hogwarts / Legacy of Magic |

Paste real Spotify/Apple URLs into `GameMusic.setPlaylistUrl(cueId, url)` or the `playlistUrl` fields in `js/music.js` when Kass shares them.

---

## Runtime behavior

1. First tap unlocks audio (browser autoplay policy) — gesture-safe `play()` (no await before start).
2. View changes call `GameMusic.sync` → bed cue with **~3.2s** eased crossfade; optional soft scene whoosh.
3. Exploration / menus keep a **quiet ambient under-bed** that stays more stable across menu switches; trials fade it out.
4. Correct/incorrect answers call `playOutcome` → soft chime/thud + warm/soft vocal pad over gently ducked bed (not hard mute).
5. Stingers are volume-limited and spaced (~1.1s) so they do not stack abruptly.
6. UI: soft click/hover/select/door on buttons, map hotspots, doors, choices; trial cast whoosh on incantation.
7. Account screen **Music / SFX** sliders persist in `localStorage` key `mcat-mastery-music-v1` (`musicVolume`, `sfxVolume`).
8. HUD **♪ On/Off** toggles mute; title **Enable sound** remains when audio needs a gesture.
9. Service worker does **not** intercept `/audio/` (avoids Chromium Range/partial-content stalls).
