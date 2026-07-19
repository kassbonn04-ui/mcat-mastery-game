# MCAT Mastery Game

Interactive Harry Potter–styled MCAT RPG: unlock worlds and levels, talk to characters, run side missions, and win trials with real MCAT reasoning — not flashcards.

## Play now (this computer)

Double-click `index.html`, or from PowerShell:

```powershell
.\play.ps1
```

## Play online + on your phone (app icon)

See **[docs/GO-LIVE.md](docs/GO-LIVE.md)**. The game is a PWA — once hosted on HTTPS, use **Add to Home Screen** (iPhone) or **Install app** (Android).

## Cloud save (Supabase) + Netlify

Progress syncs across devices when you sign in. Setup guide:

→ **[docs/SETUP-SUPABASE-NETLIFY.md](docs/SETUP-SUPABASE-NETLIFY.md)**

## What’s in this build

- **Content:** AAMC Sample Test **Q1–50** (Chem/Phys), parsed from `Kass/MCAT/aamc-sample-test-q1-50.md`
- **4-day campaign:** Wing of Asphodel → Mercury → Lodestone → Hall of OWLs
- **Characters:** Professor Elowen, rival Cassian, house-elf Bramble, archives ghost Lyra
- **Side missions** with MCAT logic + rewards
- **Spaced repetition + mastery map** seeded from your diagnostic correct/incorrect results
- Progress saved in the browser (`localStorage`)

## Add more content later

1. Drop the next markdown/JSON export into `content/raw/`
2. Ask the agent to parse and wire new worlds / days

## Files

| Path | Role |
| --- | --- |
| `index.html` | Game entry |
| `js/questions.js` | Q1–50 pack |
| `js/campaign.js` | Worlds, levels, dialogue |
| `js/engine.js` | Mastery / SR / faults |
| `js/app.js` | Interactive UI |
| `docs/game-design.md` | Design contract |
