# MCAT Mastery Game — Agent Memory

**Start here** at the beginning of substantive sessions.

## What This Is

An interactive Harry Potter–styled MCAT mastery RPG: worlds, levels, side missions, and character dialogue — not flashcards — driven by diagnostic content, spaced repetition, and adaptive mastery tracking.

## Session Protocol

Read these at the start of substantive work:

- `progress.md` — current workstream and handoff state
- `DECISIONS.md` — append-only decisions (if present)
- `docs/game-design.md` — product / progression contract

At session end:

- Update `progress.md` (what changed, what’s next, blockers)
- Commit if the human asked you to
- Append to `DECISIONS.md` if you made a real decision

## Skill-First Rule

If a request matches a known workflow and a `SKILL.md` exists under `.cursor/skills/`, **Read that skill before** Shell, Glob, MCP, or Write.

| Trigger | Skill |
| --- | --- |
| Revisiting / status / “where are we” | `.cursor/skills/reorient/SKILL.md` |
| Commit, publish, deploy, push live | `.cursor/skills/commit-and-publish/SKILL.md` |
| Can’t see changes / hard-refresh / stale PWA | `.cursor/skills/cache-bust-pwa/SKILL.md` |
| Silent / abrupt music, `music.js`, `audio/` | `.cursor/skills/audio-safe/SKILL.md` |
| Feels like a quiz; campus/Play/journey/gates | `.cursor/skills/game-feel/SKILL.md` |
| Add/fix questions, figures, shuffle, packs | `.cursor/skills/content-pack/SKILL.md` |
| Art, framing, assets, mobile scroll/hit-test | `.cursor/skills/art-pass/SKILL.md` |

If no trigger matches, state `Skill: none matched` and proceed.

## Pre-Execution Discipline

Before any non-Read tool call, state:

```
Task: [what specifically is being done]
Scope: [which file / folder / project]
Skill: [skill name read, or "none matched"]
```

## Tool Risk Policy

| Tier | Examples | Rule |
| --- | --- | --- |
| T1 | Reads, local preview, grep | Auto-run |
| T2 | Code/docs, cache bust, content packs | When requested / in-scope |
| T3 | Commit/push, Pages mirror force-push, Supabase/Netlify secrets | Only when user asks; preview → confirm for destructive steps |

## Golden Principles

- Never commit secrets (`.env`, credentials, API keys).
- Prefer small, verified changes over big rewrites.
- Keep durable notes in `docs/`; keep scratch work in `working/`.
- Content packs live in `content/`; browser loads `js/questions.js`.
- The game must feel like an RPG with missions and characters — never a Quizlet clone.
- Do not regress `music.js` / SW audio bypass unless the task is audio.
- Public Pages: royalty-free / photo licenses only; original companion names — no WB assets.
