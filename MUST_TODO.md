# MUST_TODO (MVP)

Kritinės užduotys – papildykite pagal projekto poreikį. Prieš release peržiūrėkite kartu su [MVP_ROADMAP.md](MVP_ROADMAP.md).

## Bendra

- [ ] `npm test` praeina `main` šakoje
- [ ] [CHANGELOG.md](CHANGELOG.md) atnaujintas

## Stripe + paid PDF (EN-only, Vercel)

Kontekstas: [DEPLOYMENT.md](DEPLOYMENT.md) sekcija „Paid PDF environment variables“ ir [api/_lib/fulfillment.js](api/_lib/fulfillment.js) `PRODUCTS`.

### Stripe Dashboard

- [x] Sukurti **Beginner PDF Guide** Product + Price `$5.99` (Stripe Price ID → `STRIPE_PRICE_BEGINNER_PDF`)
- [x] Sukurti **Advanced PDF Guide** Product + Price `$11.99` (Stripe Price ID → `STRIPE_PRICE_ADVANCED_PDF`)
- [x] Sukurti **Bundle (Both guides)** Product + Price `$15.99` (Stripe Price ID → `STRIPE_PRICE_BUNDLE_PDF`); Payment Link → [config/sot.json](config/sot.json) → `pdfGuides.bundle.stripePaymentLink`

#### Pass 3 hand-off — product description sync (Advanced v2.0, May 2026)

Stripe Dashboard product metadata yra Stripe pusėje, **ne repo**. Po Advanced v2.0 (32 pages) release'o reikia atnaujinti, kad pirkėjai checkout'e matytų tą pačią value proposition kaip PDF'e:

- [ ] **Advanced HR Hiring Guide ($11.99)** product description: „24 pages" → **„32 pages"**; refresh cover image į `assets/pdf-covers/advanced.png` (naujas Pass 2 + 3 hook).
- [ ] **Bundle ($15.99)** product description: „12 + 24 pages" → **„16 + 32 pages"**.
- [ ] (Optional) Pridėti tagline „Includes sample debrief transcript + comp/pay-transparency worksheet" prie Advanced description.
- [x] Sukurti **Payment Link** kiekvienam Price; success URL: `https://promptanatomy.help/success.html?session_id={CHECKOUT_SESSION_ID}` (repo: visi 3 linkai [config/sot.json](config/sot.json) `pdfGuides.*.stripePaymentLink`)
- [ ] (Pasirinktinai) Payment Link → metadata: `product=beginner` arba `product=advanced` (alternatyva – Price ID mapping)
- [ ] Įjungti **Stripe receipts** ON (Settings → Customer emails → Successful payments)
- [ ] Pridėti **webhook endpoint** `https://promptanatomy.help/api/stripe-webhook`, įvykiai: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- [ ] Webhook secret → Vercel env `STRIPE_WEBHOOK_SECRET`

### Repo darbas

- [x] [config/sot.json](config/sot.json): įrašyti realias `pdfGuides.beginner.stripePaymentLink`, `advanced` ir `bundle` (`https://buy.stripe.com/...`); po pakeitimo – `npm run build`
- [x] Sugeneruoti / atnaujinti Beginner ir Advanced PDF turinį (EN) — žr. [docs/pdf-source/](docs/pdf-source/README.md); `npm run pdf:export`
- [x] Įkelti PDF į **Vercel Blob** (private): `npm run pdf:upload:blob` → Blob path `prompt-anatomy/pdfs/*.pdf`
- [x] Vercel env: `PDF_BEGINNER_SOURCE_URL`, `PDF_ADVANCED_SOURCE_URL` (iš upload output) + `BLOB_READ_WRITE_TOKEN` (auto iš Blob store) → **Redeploy**
- [x] Lokalus dev: `api/_private/pdfs/beginner-guide.pdf` ir `advanced-guide.pdf` (gitignore; generuojami `npm run pdf:export`)

### Vercel env (Production / Preview)

Pilnas sąrašas – [DEPLOYMENT.md](DEPLOYMENT.md). Privalomi:

- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET`
- [x] `STRIPE_PRICE_BEGINNER_PDF`
- [x] `STRIPE_PRICE_ADVANCED_PDF`
- [x] `STRIPE_PRICE_BUNDLE_PDF`
- [x] `DOWNLOAD_TOKEN_SECRET` (>= 32 atsitiktinių baitų; pvz. `openssl rand -base64 48`)
- [x] `RESEND_API_KEY`
- [x] `FULFILLMENT_FROM_EMAIL` (verified Resend sender)
- [x] `UPSTASH_REDIS_REST_URL`
- [x] `UPSTASH_REDIS_REST_TOKEN`
- [x] `SITE_URL=https://promptanatomy.help`
- [x] `PDF_BEGINNER_SOURCE_URL` (iš `npm run pdf:upload:blob` output)
- [x] `PDF_ADVANCED_SOURCE_URL`
- [x] `BLOB_READ_WRITE_TOKEN` (Vercel Blob store → auto; lokaliai `.env`)

### QA prieš release

- [ ] Hero/PDF funnel: `/en/` – primary CTA scroll į `#pdf-guides`; secondary → Prompt 1; PDF blokas virš nemokamų promptų
- [ ] Stripe **test mode**: pirkti Beginner ir Advanced → patikrinti, kad atvyksta el. laiškas iš Resend su veikiančia download nuoroda
- [ ] [success.html](success.html) parodo „Download PDF“ mygtuką per ~5 s po `Stripe redirect` (poll į `/api/download-link`)
- [ ] Pasibaigus 15 min in-page tokenui – senas mygtukas grąžina 403; el. laiško nuoroda dar veikia (7 d.)
- [ ] Pakartotinis to paties webhook’o pristatymas – fulfillment lieka `already_fulfilled` (Redis idempotency)
- [ ] [terms.html](terms.html) `#paid-pdf-license` pasiekiamas iš laiško ir iš `success.html`

## Saugumas

- [ ] **Niekada** necommitinti `.env` ar `.env.local` – patikrinti `.gitignore` prieš push
- [ ] Naudoti `.env.example` kaip vienintelį versijuojamą template (be realių verčių)
