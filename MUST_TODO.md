# MUST_TODO (open)

Atviri promo vartai. Detalės – [DEPLOYMENT.md](DEPLOYMENT.md), [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md).  
Baigti Stripe / env / DS darbai – [CHANGELOG.md](CHANGELOG.md) (1.4.x).

## Purchase QA (manual, before promo)

Recovery: `node scripts/check-fulfillment.js --session=cs_… --resend` (or `--payment_intent=pi_…`).

1. [ ] Stripe **test mode**: buy Beginner → Resend email with working download link
2. [ ] Stripe **test mode**: buy Advanced → same
3. [ ] Webhook replay → Redis `already_fulfilled` (`check-fulfillment.js` when Upstash reachable)

## Next bets (from former roadmap)

1. **Trust:** real buyer reviews (no fabricated testimonials; Phase D constraints stay)
2. Keep CSP enforce + delegated handlers (no inline `onclick` regression)

## Done (do not re-open)

Shipped: EN-only `/en/`, Stripe products/links/webhook/env, PDF Blob, success poll contract, terms license anchor, DS v2.0, GEO/CSP — see CHANGELOG **1.4.0** / **1.4.1**.
