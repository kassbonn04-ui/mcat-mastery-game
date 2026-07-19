---
name: commit-and-publish
description: >-
  Commit MCAT Mastery game changes under the family git root and publish the
  public GitHub Pages mirror. Use when the user says commit, publish, deploy,
  push live, or update the live site.
---

# Commit and publish

## Layout

| Role | Path |
| --- | --- |
| Git root | `C:\Users\C2K\family` |
| Game | `Kass/mcat-mastery-game` |
| Private remote | `sledgeworks/family` |
| Public Pages mirror | `kassbonn04-ui/mcat-mastery-game` |
| Live URL | https://kassbonn04-ui.github.io/mcat-mastery-game/ |

## Preflight

1. Read this skill fully; run **cache-bust-pwa** if JS/CSS/SW/assets changed and version not bumped yet
2. `git status` / `git diff` / `git log -8` from family root
3. **Secrets:** never commit `.env`, real Supabase keys. Check `js/config.js` — if it has real keys, do **not** stage it (prefer `config.example.js` only)
4. Exclude `working/` scratch

## Commit (family)

- Stage under `Kass/mcat-mastery-game/` only (plus related docs)
- Author via **env vars only** (never `git config`):

```powershell
$env:GIT_AUTHOR_NAME = "kassbonn04-ui"
$env:GIT_AUTHOR_EMAIL = "kassbonn04@gmail.com"
$env:GIT_COMMITTER_NAME = "kassbonn04-ui"
$env:GIT_COMMITTER_EMAIL = "kassbonn04@gmail.com"
```

- PowerShell: use `;` not `&&`; commit message via here-string `@\" ... \"@`
- Message: why, not file list
- Only commit when the user asked to commit/publish

## Push family

```powershell
git push origin main
```

## Mirror to public Pages

1. Robocopy game ? temp dir, exclude `.git`, `working`, `.env*`
2. Ensure `.github/workflows/pages.yml` exists in the temp tree (deploy `path: .`)
3. Init git in temp; commit; force-push to `https://github.com/kassbonn04-ui/mcat-mastery-game.git` using `git credential fill` if `gh` auth is bad
4. **Never print tokens** in chat
5. Confirm Actions run succeeded; fetch live `sw.js` and report `CACHE` string

## After publish

- Update `progress.md` with publish note + live cache tag
- Tell Kass: hard-refresh or reopen Home Screen app
- Soft-note if `gh` auth still invalid

## Do not

- Force-push `sledgeworks/family` main
- Commit secrets
- Skip cache bust when client assets changed
