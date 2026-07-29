# MUST_TODO (MVP)

Kritinės užduotys prieš promo. Detalės – [DEPLOYMENT.md](DEPLOYMENT.md), [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md).

## Bendra

- [x] `npm test` praeina `main` (**375 PASS**, 0 FAIL); shipped as `v1.4.0` (`b491f33`)
- [x] [CHANGELOG.md](CHANGELOG.md) atnaujintas (release cut → **1.4.0** / **1.3.0** catch-up)

## Stripe Dashboard — before promo (manual, not in git)

Repo cannot change Stripe product metadata. Complete in Stripe Dashboard:

- [x] **Advanced HR Hiring Guide ($11.99):** description **32 pages** (verified via Stripe API 2026-07-29; cover image set on product)
- [x] **Bundle ($15.99):** description **16 + 32 pages** (verified via Stripe API 2026-07-29)
- [x] (Optional) Advanced tagline: debrief transcript + comp worksheet (present in live product description)
- [x] Verify checkout copy matches [config/sot.json](config/sot.json) `pdfGuides.*.pages` and `/en/#pdf-guides` (API verify script)
- [x] Payment Link success URLs → `https://www.promptanatomy.help/success.html?session_id={CHECKOUT_SESSION_ID}` (updated via Stripe API 2026-07-29)

### Already done (do not re-open)

- [x] Beginner / Advanced / Bundle Products + Prices ($5.99 / $11.99 / $15.99)
- [x] Payment Links → [config/sot.json](config/sot.json) `pdfGuides.*.stripePaymentLink`; success URL → `/success.html?session_id={CHECKOUT_SESSION_ID}`
- [x] Webhook endpoint `https://www.promptanatomy.help/api/stripe-webhook` (`checkout.session.completed`, `checkout.session.async_payment_succeeded`) → `STRIPE_WEBHOOK_SECRET` on Vercel
- [x] Vercel env: Stripe keys/prices, `DOWNLOAD_TOKEN_SECRET`, Resend, Upstash, `SITE_URL`, Blob PDF URLs (`PDF_*_SOURCE_URL`, `BLOB_READ_WRITE_TOKEN`)
- [x] PDF content export + private Blob upload (`npm run pdf:upload:blob`)

## Purchase QA runbook (manual)

Ordered sign-off before promo. Recovery: `node scripts/check-fulfillment.js --session=cs_… --resend` (or `--payment_intent=pi_…`).

1. [ ] Stripe **test mode**: buy Beginner → Resend email with working download link *(needs `sk_test` + human checkout; not runnable from this machine)*
2. [ ] Stripe **test mode**: buy Advanced → same *(same blocker as #1)*
3. [x] [success.html](success.html) polls `/api/download-link`; production page + API contract verified (`scripts/run-purchase-qa-checks.js` 2026-07-29)
4. [x] Expired / unknown session → non-200 from `/api/download-link` (404/400 verified on prod); full 15m TTL wait + 7d email link still human-optional
5. [ ] Webhook replay → Redis `already_fulfilled` *(Upstash host DNS ENOTFOUND from this machine — re-run `check-fulfillment.js` when Redis reachable)*
6. [x] [terms.html](terms.html)`#paid-pdf-license` present; linked from [success.html](success.html)
7. [x] Visual: `/en/` PDF section (See inside, highlights, sample labels, funnel CTAs) verified on production

## Design System / in-repo (done)

- [x] DS v2.0 token hygiene, CTA size tokens, satellite parity, screenshot baseline procedure

## Saugumas

- [x] `.env` / `.env.local` in `.gitignore`; use `.env.example` as template only
