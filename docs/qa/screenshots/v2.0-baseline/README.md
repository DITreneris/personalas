# Design System v2.0 — visual baseline

Capture before/after token PRs at **1440px**, **768px**, and **375px** width.

## Pages

- `/en/` — hero, PDF grid, first prompt
- `/success.html` — thank-you card
- `/terms.html` — legal card

## Procedure

1. `npm run build && npx serve -s . -l 3000`
2. Browser devtools → responsive mode → save full-page PNGs here
3. Name files: `{page}-{width}.png` (e.g. `en-1440.png`)

Optional: add Playwright screenshot compare in CI (backlog).
