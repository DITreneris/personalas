# QA standartas

Atskaitos projektas: **[DITreneris/spinoff01](https://github.com/DITreneris/spinoff01)**.

## Šio repo vartai (privaloma prieš merge)

```bash
npm test
```

Seka: `build` → `pdf:validate` → `tests/structure.test.js` → HTML lint (vartai, `en/`, `privacy`, `success`, `terms`) → ESLint. Detaliau – [AGENT_SOT.md](AGENT_SOT.md) §3.

## CI (GitHub Actions)

- Tas pats `npm test` (su `BASE_PATH` / `SITE_ORIGIN` CI env).
- **pa11y** URL (sutampa su [DEPLOYMENT.md](../DEPLOYMENT.md) lokaliai):
  - `/`, `/privacy.html`, `/en/`, `/en/privacy.html`, `/success.html`, `/terms.html`

## Prieš release (rankinis)

- [MUST_TODO.md](../MUST_TODO.md) – Stripe webhook, Vercel env, gyvas testinis pirkimas, `success.html` poll, el. laiškas su PDF.
- [docs/TESTAVIMAS.md](TESTAVIMAS.md) – post-deploy scenarijai + **Mobile matrix (iOS + Android)** (sticky/toast, Copy, safe-area, Stripe path).
- CHANGELOG [Unreleased] → versija su data (SemVer).
- Mobile sticky/CSS pakeitimai – sutartys [AGENT_SOT.md](AGENT_SOT.md) §6b.

## Turinio / struktūros taisyklės

- Keičiant promptų tekstą – išlaikyti `id`, klases, JS sutartį ([LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md), `tests/structure.test.js`).
- Viešame UI – tik **Prompt Anatomy**; greita patikra – [AGENT_SOT.md](AGENT_SOT.md) §9.
