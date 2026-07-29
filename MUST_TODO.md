# MUST_TODO (MVP)

Kritinės užduotys prieš promo. Detalės – [DEPLOYMENT.md](DEPLOYMENT.md), [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md).

## Bendra

- [x] `npm test` praeina lokaliai prieš 1.4.0 ship (**375 PASS**, 0 FAIL) — re-confirm on `main` after push
- [x] [CHANGELOG.md](CHANGELOG.md) atnaujintas (release cut → **1.4.0** / **1.3.0** catch-up)

## Stripe Dashboard — before promo (manual, not in git)

Repo cannot change Stripe product metadata. Complete in Stripe Dashboard:

- [ ] **Advanced HR Hiring Guide ($11.99):** description **32 pages** (not 24); cover = `assets/pdf-covers/advanced.png`
- [ ] **Bundle ($15.99):** description **16 + 32 pages** (not 12 + 24)
- [ ] (Optional) Advanced tagline: debrief transcript + comp/pay-transparency worksheet
- [ ] Verify checkout copy matches [config/sot.json](config/sot.json) `pdfGuides.*.pages` and `/en/#pdf-guides`

### Already done (do not re-open)

- [x] Beginner / Advanced / Bundle Products + Prices ($5.99 / $11.99 / $15.99)
- [x] Payment Links → [config/sot.json](config/sot.json) `pdfGuides.*.stripePaymentLink`; success URL → `/success.html?session_id={CHECKOUT_SESSION_ID}`
- [x] Webhook endpoint `https://www.promptanatomy.help/api/stripe-webhook` (`checkout.session.completed`, `checkout.session.async_payment_succeeded`) → `STRIPE_WEBHOOK_SECRET` on Vercel
- [x] Vercel env: Stripe keys/prices, `DOWNLOAD_TOKEN_SECRET`, Resend, Upstash, `SITE_URL`, Blob PDF URLs (`PDF_*_SOURCE_URL`, `BLOB_READ_WRITE_TOKEN`)
- [x] PDF content export + private Blob upload (`npm run pdf:upload:blob`)

## Purchase QA runbook (manual)

Ordered sign-off before promo. Recovery: `node scripts/check-fulfillment.js --session=cs_… --resend` (or `--payment_intent=pi_…`).

1. [ ] Stripe **test mode**: buy Beginner → Resend email with working download link
2. [ ] Stripe **test mode**: buy Advanced → same
3. [ ] [success.html](success.html): “Download PDF” within ~5 s after Stripe redirect (`/api/download-link` poll)
4. [ ] In-page token (~15 min) expired → 403; email link still works (7 d)
5. [ ] Webhook replay of same event → Redis `already_fulfilled` (idempotent)
6. [ ] [terms.html](terms.html)`#paid-pdf-license` reachable from email + success page
7. [ ] Visual: `/en/` PDF section (cards, See inside thumbs, trust line) + hero funnel CTAs

## Design System / in-repo (done)

- [x] DS v2.0 token hygiene, CTA size tokens, satellite parity, screenshot baseline procedure

## Saugumas

- [x] `.env` / `.env.local` in `.gitignore`; use `.env.example` as template only
