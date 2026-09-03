# MUST_TODO (open)

Atviri promo vartai. Detalės – [DEPLOYMENT.md](DEPLOYMENT.md), [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md).  
Shipped engineering (1.6.1): PDF voice pass + Blob overwrite — [CHANGELOG.md](CHANGELOG.md).

## Purchase QA (manual, before promo)

Recovery: `node scripts/check-fulfillment.js --session=cs_… --resend` (or `--payment_intent=pi_…`).

Helpers (partial automation — do **not** replace live test buys):

```bash
node scripts/verify-stripe-promo-gate.js
node scripts/run-purchase-qa-checks.js
```

1. [x] Confirm Vercel Production env: `SITE_URL=https://www.promptanatomy.help` (**required** — fulfillment fails closed without it) — local `.env` is www; Redis/download path healthy on Production (403/404, not 503)
2. [ ] Stripe **test mode**: buy Beginner → Resend email with working download link — **blocked until www webhook** (see below)
3. [ ] Stripe **test mode**: buy Advanced → same
4. [ ] Webhook replay → Redis `already_fulfilled` (`check-fulfillment.js` when Upstash reachable)

**Webhook blocker (2026-09-03):** Stripe has an enabled endpoint on **apex** `promptanatomy.help/api/stripe-webhook`. Apex **POST 308 → www**; Stripe does not follow that redirect, so fulfillment will not run. www `POST /api/stripe-webhook` itself returns 400 (signature) — the function is up. Add a Stripe webhook at `https://www.promptanatomy.help/api/stripe-webhook` (`checkout.session.completed` + `async_payment_succeeded`), put the new signing secret in Vercel `STRIPE_WEBHOOK_SECRET`, disable the apex endpoint. Then do the test buys.

Helpers 2026-09-03: `verify-stripe-promo-gate.js` PASS (products + Payment Link success URLs are www). `run-purchase-qa-checks.js` PASS on static + 404 for the 2026-09-02 live session (new empty Redis — expected).

## Post-deploy (after 1.6.1 is on production)

1. [x] Hit `/en/` + three spokes (`/en/hr-ai-prompts/{job-description,interview-scorecard,master-hiring-prompt}/`) — 200 on 2026-09-03; live `config/sot.json` has voice-pass chapters (no Cover)
2. [ ] `success.html` poll after a test purchase (rate-limit must not block normal poll)
3. [ ] GSC URL Inspection + Request indexing for the three spokes — [DEPLOYMENT.md](DEPLOYMENT.md)
4. [ ] Optional: `npm run seo:indexnow:diff` after `main` deploy

**Promo: hold** until test buys + webhook replay are green.

## Next bets (from former roadmap)

1. **Trust:** real buyer reviews (no fabricated testimonials; Phase D constraints stay)
2. Keep CSP enforce + delegated handlers (no inline `onclick` regression)
3. Post-promo security: single-use download jti, refund auto-revoke

## Done (do not re-open)

Shipped: EN-only `/en/`, Stripe products/links/webhook/env, PDF Blob, success poll contract, terms license anchor, DS v2.0, GEO/CSP — see CHANGELOG **1.4.0** / **1.4.1** / **1.5.x**.  
**1.6.0:** prompt spokes + entity footer + GSC hygiene + download API rate limits / `SITE_URL` prod gate / price-first product resolve.  
**1.6.1:** PDF voice pass (book frame), Advanced landing TOC omits Cover, Blob PDFs overwritten.
