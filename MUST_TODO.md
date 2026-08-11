# MUST_TODO (open)

Atviri promo vartai. Detalės – [DEPLOYMENT.md](DEPLOYMENT.md), [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md).  
Shipped engineering (1.6.0): prompt spokes, paid PDF API hardening, spoke CI — [CHANGELOG.md](CHANGELOG.md).

## Purchase QA (manual, before promo)

Recovery: `node scripts/check-fulfillment.js --session=cs_… --resend` (or `--payment_intent=pi_…`).

Helpers (partial automation — do **not** replace live test buys):

```bash
node scripts/verify-stripe-promo-gate.js
node scripts/run-purchase-qa-checks.js
```

1. [ ] Confirm Vercel Production env: `SITE_URL=https://www.promptanatomy.help` (**required** — fulfillment fails closed without it)
2. [ ] Stripe **test mode**: buy Beginner → Resend email with working download link
3. [ ] Stripe **test mode**: buy Advanced → same
4. [ ] Webhook replay → Redis `already_fulfilled` (`check-fulfillment.js` when Upstash reachable)

## Post-deploy (after 1.6.0 is on production)

1. [ ] Hit `/en/` + three spokes (`/en/hr-ai-prompts/{job-description,interview-scorecard,master-hiring-prompt}/`)
2. [ ] `success.html` poll after a test purchase (rate-limit must not block normal poll)
3. [ ] GSC URL Inspection + Request indexing for the three spokes — [DEPLOYMENT.md](DEPLOYMENT.md)
4. [ ] Optional: `npm run seo:indexnow:diff` after `main` deploy

## Next bets (from former roadmap)

1. **Trust:** real buyer reviews (no fabricated testimonials; Phase D constraints stay)
2. Keep CSP enforce + delegated handlers (no inline `onclick` regression)
3. Post-promo security: single-use download jti, refund auto-revoke

## Done (do not re-open)

Shipped: EN-only `/en/`, Stripe products/links/webhook/env, PDF Blob, success poll contract, terms license anchor, DS v2.0, GEO/CSP — see CHANGELOG **1.4.0** / **1.4.1** / **1.5.x**.  
**1.6.0:** prompt spokes + entity footer + GSC hygiene + download API rate limits / `SITE_URL` prod gate / price-first product resolve.
