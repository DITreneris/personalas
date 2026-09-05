# MUST_TODO (open)

Atviri post-promo punktai (GSC). Money-path QA uždarytas 2026-09-05.  
Shipped engineering (1.6.1): PDF voice pass + Blob overwrite — [CHANGELOG.md](CHANGELOG.md).

## Purchase QA (manual, before promo)

Recovery: `node scripts/check-fulfillment.js --session=cs_… --resend` (or `--payment_intent=pi_…`).

Helpers (partial automation — do **not** replace live test buys):

```bash
node scripts/verify-stripe-promo-gate.js
node scripts/run-purchase-qa-checks.js
```

1. [x] Confirm Vercel Production env: `SITE_URL=https://www.promptanatomy.help` (**required** — fulfillment fails closed without it) — local `.env` is www; Redis/download path healthy on Production (403/404, not 503)
2. [x] Buy Beginner → `success.html` ready + masked email + Download + Redis fulfillment (live session 2026-09-05; poll `/api/download-link` 200)
3. [x] Buy Advanced → same (live 2026-09-05 09:21 EEST; Stripe receipt #1580-6052 $11.99 + LT 21% VAT; poll 200 `productId=advanced` + Redis fulfillment)
4. [x] Webhook replay → Redis `already_fulfilled` — Dashboard Resend on www `.help` (2026-09-05 09:43 EEST): Beginner `evt_1UCCsl…` + Advanced `evt_1UCCyo…` both **200** `{ "received": true, "fulfillment": "already_fulfilled" }` (Recovered / Resent manually). Event-level `pending_webhooks` may stay >0 because this Stripe account also delivers to `.space` / `.ceo` / `.online` / `.app` — look at the **.help** attempt only.

**Webhook (2026-09-03):** live Stripe endpoint is **www** `https://www.promptanatomy.help/api/stripe-webhook` (apex disabled). Apex POST still 308s — do not re-add an apex endpoint.

Helpers 2026-09-05: `run-purchase-qa-checks.js` PASS — latest paid session is Advanced (`productId=advanced`), download-link 200 + Redis idempotency key.

## Post-deploy (after 1.6.1 is on production)

1. [x] Hit `/en/` + three spokes (`/en/hr-ai-prompts/{job-description,interview-scorecard,master-hiring-prompt}/`) — 200 on 2026-09-03; live `config/sot.json` has voice-pass chapters (no Cover)
2. [x] `success.html` poll after a test purchase (rate-limit must not block normal poll) — Beginner + Advanced 2026-09-05 both reached ready
3. [ ] GSC URL Inspection + Request indexing for the three spokes — [DEPLOYMENT.md](DEPLOYMENT.md)
4. [ ] Optional: `npm run seo:indexnow:diff` after `main` deploy

**Promo: go** (2026-09-05). Purchase QA complete (SITE_URL, Beginner, Advanced, webhook replay). Remaining: GSC spoke indexing (SEO, not a money-path gate).

## Next bets (from former roadmap)

1. **Trust:** real buyer reviews (no fabricated testimonials; Phase D constraints stay)
2. Keep CSP enforce + delegated handlers (no inline `onclick` regression)
3. Post-promo security: single-use download jti, refund auto-revoke

## Done (do not re-open)

Shipped: EN-only `/en/`, Stripe products/links/webhook/env, PDF Blob, success poll contract, terms license anchor, DS v2.0, GEO/CSP — see CHANGELOG **1.4.0** / **1.4.1** / **1.5.x**.  
**1.6.0:** prompt spokes + entity footer + GSC hygiene + download API rate limits / `SITE_URL` prod gate / price-first product resolve.  
**1.6.1:** PDF voice pass (book frame), Advanced landing TOC omits Cover, Blob PDFs overwritten.
