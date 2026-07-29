# Integracija

**Production:** Vercel (`promptanatomy.help` / `www`) — static site + serverless `api/` for Stripe PDF fulfillment (webhook, download tokens, Resend email). See [DEPLOYMENT.md](DEPLOYMENT.md).

GitHub Pages remains optional for static-only preview (no paid PDF fulfillment).

## Paid PDF (live)

- Stripe Payment Links from [config/sot.json](config/sot.json)
- Webhook → [api/stripe-webhook.js](api/stripe-webhook.js) → [api/_lib/fulfillment.js](api/_lib/fulfillment.js)
- Sub-processors: Stripe, Resend, Upstash Redis, Vercel Blob — disclosed in [templates/privacy.html](templates/privacy.html)

## Kontaktų forma (rezervuota)

Šiame projekte **kontaktų forma dar neįjungta**. Pavyzdinis backend stub: [google-apps-script.js](google-apps-script.js) (Prompt Anatomy EN placeholders; not wired).

Jei įjungsite formą vėliau:

1. Modal arba forma ant landing (žr. CSS komentarą „MODAL / KONTAKTŲ FORMA“).
2. Backend: Google Apps Script arba kita serverless forma — ne commitinti secretų.
3. Atnaujinti [templates/privacy.html](templates/privacy.html) + `npm run build`, ir šį failą.

## Feedback Store (rezervuota)

Grįžtamojo ryšio schema / metrikos — **dar neįjungta**. Kol forma ir store neaktyvūs, nėra atskiros `feedback-schema` bylos; būsimą schemą pridėti čia arba `docs/` (Tier 1) pagal [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md).
