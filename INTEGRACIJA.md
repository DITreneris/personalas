# Integracija

**Production:** Vercel (`promptanatomy.help` / `www`) — static site + serverless `api/` for Stripe PDF fulfillment (webhook, download tokens, Resend email). See [DEPLOYMENT.md](DEPLOYMENT.md).

GitHub Pages is **retired** (it published the full repo, including paid PDF HTML). Paid PDF fulfillment is Vercel-only.

## Paid PDF (live)

- Stripe Payment Links from [config/sot.json](config/sot.json)
- Webhook → [api/stripe-webhook.js](api/stripe-webhook.js) → [api/_lib/fulfillment.js](api/_lib/fulfillment.js). Stripe Dashboard URL **must** be `https://www.promptanatomy.help/api/stripe-webhook` (apex POST 308 drops the body).
- Sub-processors: Stripe, Resend, Upstash Redis, Vercel Blob — disclosed in [templates/privacy.html](templates/privacy.html)

## Kontaktų forma (rezervuota)

Šiame projekte **kontaktų forma dar neįjungta**. Šaknies `google-apps-script.js` pašalintas (nebeviešinamas). Pavyzdinis stubas — [docs/archive/google-apps-script.js](docs/archive/google-apps-script.js) (ne hot-path).

Jei įjungsite formą vėliau:

1. Modal arba forma ant landing (žr. CSS komentarą „MODAL / KONTAKTŲ FORMA“).
2. Backend: Google Apps Script arba kita serverless forma — ne commitinti secretų; **nedėti** šaknies `.js`, kurį Vercel servintų.
3. Atnaujinti [templates/privacy.html](templates/privacy.html) + `npm run build`, ir šį failą.

## Feedback Store (rezervuota)

Grįžtamojo ryšio schema / metrikos — **dar neįjungta**. Kol forma ir store neaktyvūs, nėra atskiros `feedback-schema` bylos; būsimą schemą pridėti čia arba `docs/` (Tier 1) pagal [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md).
