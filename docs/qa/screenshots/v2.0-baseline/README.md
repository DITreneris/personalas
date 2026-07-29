# Design System v2.0 — visual baseline

Capture before/after token PRs at **1440px**, **768px**, and **375px** width.

## Pages

- `/en/` — hero, PDF grid, first prompt
- `/success.html` — thank-you card
- `/terms.html` — legal card

## Procedure

1. `npm run build && python -m http.server 3001 --bind 127.0.0.1`  
   (Do **not** use `serve -s` — SPA mode breaks `/en/` and causes redirect loops.)
2. `BASE_URL=http://127.0.0.1:3001 node scripts/capture-ds-baseline.js`  
   or browser devtools → responsive mode → save full-page PNGs here
3. Name files: `{page}-{width}.png` (e.g. `en-1440.png`)

Captured baseline (2026-07-29): `en|success|terms` × `1440|768|375`.

Optional: add Playwright screenshot compare in CI (backlog).
