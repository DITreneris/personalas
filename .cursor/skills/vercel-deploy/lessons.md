# Vercel deploy lessons

Short table also in [docs/AGENT_SOT.md](../../../docs/AGENT_SOT.md) §10. Add a row here when the same class of fail repeats.

| Date | Lesson | Why |
|------|--------|-----|
| 2026-09-05 | `.vercelignore` is applied **before** `npm test` | 1.6.2 ignored `scripts/` → `Cannot find module …/build-locale-pages.js`. Keep build trees uploaded; hide them with `routes` 404. |
| 2026-09-05 | CI pass ≠ Vercel pass | 1.6.3: leftover `BASE_PATH=/personalas/` (old GitHub Pages). Built `WebSite.url` became `/personalas/en/`. `VERCEL=1` clears `BASE_PATH`; `buildCommand` pins www `SITE_ORIGIN`. |
| 2026-09-05 | `redirects` `statusCode: 404` is invalid | Vercel allows 301–308 only and **drops** 404 redirects before tests (1.6.4: 452/1, six `404 lock` FAILs). Use `routes` `{ src, dest: "/404.html", status: 404 }`. |
| 2026-09-05 | Geo `tallyLocal` is **one** `Result` tally | Many `FAIL:` lines can still show `1 failed`. Scroll to every `FAIL:`. |
| 2026-09-05 | Stopping Pages **workflow** does not unpublish | GitHub → Settings → Pages → Source **None** is still required for leftover `github.io` (paid PDF HTML leak). |
