---
name: vercel-deploy
description: >-
  Personalas / Prompt Anatomy Hire spoke Vercel deploy and public static lock.
  Use when changing .vercelignore, vercel.json, buildCommand, BASE_PATH,
  SITE_ORIGIN, routes/redirects, or when a Vercel npm test deploy fails.
---

# Vercel deploy (Personalas)

Production is **Vercel only** (`promptanatomy.help` / `/en/`). GitHub Pages is retired.

Canon: [docs/AGENT_SOT.md](../../../docs/AGENT_SOT.md) §6 + §10. Lessons: [lessons.md](lessons.md).

## Before changing ignore or routes

1. `.vercelignore` runs **before** `npm test`. Do **not** ignore `scripts/`, `docs/`, `tests/`, `templates/`, `.eslintrc.json`, `api/**/*.js`, or `config/sot.json`.
2. Ignore only non-build files: `.github/`, `*.md` (keep `!en/**/*.md` so llms.txt v2 twins upload), `.cursorrules`, `.pa11yrc.json`.
3. Public lock is `vercel.json` **`routes`** with `status: 404` → `/404.html`. Do **not** use `redirects` `statusCode: 404` (Vercel allows 301–308 only and drops 404 rules).
4. Never 404 `/api/download`, `/api/download-link`, or `/api/stripe-webhook`.

## Build command

`vercel.json` must pin:

`SITE_ORIGIN=https://www.promptanatomy.help REQUIRE_STRIPE_LINKS=1 npm test`

`scripts/build-locale-pages.js` ignores `BASE_PATH` when `VERCEL=1` (leftover Pages `/personalas/`).

## After a failed Vercel deploy

1. Read **`FAIL:`** lines, not only `Result: N passed, 1 failed` (geo asserts count as one tally).
2. CI green does not prove Vercel green (ignore filter + leftover env).
3. Reproduce locally: `VERCEL=1` plus the suspected env (`BASE_PATH=/personalas/`).
4. Do not “fix” a fail by deleting the assertion. Fix the lock or the env.

## Post-deploy spot-check

- `/en/` → 200
- `/docs/foo`, `/scripts/foo` → 404
- `/api/download` without token → 4xx (not a 404 rule)
- GitHub → Settings → Pages → Source **None** (manual; stopping the workflow does not unpublish `github.io`)
