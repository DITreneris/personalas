# MUST_TODO (open)

Atviri post-promo punktai (GSC + public surface). Money-path QA uždarytas 2026-09-05.
Shipped engineering (1.6.6): llms.txt v2 twins. Prior: 1.6.5 Vercel 404 `routes` lock — [CHANGELOG.md](CHANGELOG.md).

## Purchase QA (manual, before promo)

Recovery: `node scripts/check-fulfillment.js --session=cs_… --resend` (or `--payment_intent=pi_…`).

Helpers (partial automation — do **not** replace live test buys):

```bash
node scripts/verify-stripe-promo-gate.js
node scripts/run-purchase-qa-checks.js
```

1. [x] Confirm Vercel Production env: `SITE_URL=https://www.promptanatomy.help` (**required** — fulfillment fails closed without it)
2. [x] Buy Beginner → `success.html` ready + masked email + Download + Redis fulfillment
3. [x] Buy Advanced → same (poll 200 + Redis fulfillment)
4. [x] Webhook replay → Redis `already_fulfilled` on www `.help` (apex POST 308 — do not re-add an apex endpoint)

**Promo: go** (2026-09-05). Purchase QA complete. Remaining: GSC spoke indexing + public-surface ops.

## Public surface (after 1.6.2 deploy)

Live-checked 2026-09-05 on `www.promptanatomy.help` (and `ditreneris.github.io/personalas/`).

1. [x] GitHub Pages unpublished — `https://ditreneris.github.io/personalas/` → **404** (keep Settings → Pages → Source **None**)
2. [x] Confirm 404 (not 200, not 308 → `/en/`): `/DEPLOYMENT.md`, `/MUST_TODO.md`, `/docs/security.md`, `/api/_lib/fulfillment.js`, `/scripts/check-fulfillment.js`, `/google-apps-script.js`, `/docs/pdf-source/beginner-personalas-hr.html`, `/vercel.json`
3. [x] Confirm 200: `/en/`, `/config/sot.json`, `/google7305663b2567346e.html`, IndexNow `.txt`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`
4. [x] API healthy: `GET /api/download?t=short` → **403**; junk `POST /api/stripe-webhook` → **400** (not 308)

## Post-deploy (SEO) — operator dashboards

1. [ ] GSC (www property) submit `https://www.promptanatomy.help/sitemap.xml` + URL Inspection + Request indexing for `/en/`, privacy, terms, and the three spokes — [DEPLOYMENT.md](DEPLOYMENT.md)
2. [ ] Bing Webmaster: import from GSC, same sitemap, confirm IndexNow key
3. [ ] Optional: `npm run seo:indexnow:diff` after `main` deploy (also runs in `.github/workflows/deploy.yml` after tests)

## Post-deploy (llms.txt v2 — after 1.6.6)

1. [ ] Confirm **200** + `Content-Type: text/markdown` on `/en/index.md`, `/en/hr-ai-prompts/job-description/index.md`, `/en/hr-ai-prompts/interview-scorecard/index.md`, `/en/hr-ai-prompts/master-hiring-prompt/index.md`
2. [ ] Confirm `/README.md` still **404**; view-source `/en/` has `rel="describedby"` → `/llms.txt` and markdown `rel="alternate"`

## Next bets (from former roadmap)

1. **Trust:** real buyer reviews (no fabricated testimonials; Phase D constraints stay)
2. Keep CSP enforce + delegated handlers (no inline `onclick` regression)
3. Post-promo security: single-use download jti, refund auto-revoke

## Done (do not re-open)

Shipped: EN-only `/en/`, Stripe products/links/webhook/env, PDF Blob, success poll contract, terms license anchor, DS v2.0, GEO/CSP — see CHANGELOG **1.4.0** / **1.4.1** / **1.5.x**.
**1.6.0:** prompt spokes + entity footer + GSC hygiene + download API rate limits / `SITE_URL` prod gate / price-first product resolve.
**1.6.1:** PDF voice pass (book frame), Advanced landing TOC omits Cover, Blob PDFs overwritten.
**1.6.2:** public static surface lockdown (`.vercelignore` + 404 redirects); GitHub Pages deploy retired.
**1.6.3:** `.vercelignore` no longer drops `scripts/` / `docs/` / `tests/` / `templates/` (Vercel build needs them).
**1.6.4:** Vercel ignores leftover `BASE_PATH=/personalas/`; buildCommand pins www `SITE_ORIGIN`.
**1.6.5:** public 404 lock uses `vercel.json` `routes` (Vercel drops `redirects` with `statusCode: 404`).
**1.6.6:** llms.txt v2 (`describedby` + EN `index.md` twins). GSC/Bing indexing still operator.
