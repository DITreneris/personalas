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

- [ ] DS v0.2.1 elevation: `/en/` — PDF sekcija pilkas fonas, kortelės su šešėliu, workflow chip'ai skaitomi; preview mygtukas ne „tuščias“ ant baltos
- [ ] Hero/PDF funnel: `/en/` – primary CTA scroll į `#pdf-guides`; secondary → Prompt 1; PDF blokas virš nemokamų promptų; hero sentence case + U.S. + kaina tik `priceTeaser` (žr. CHANGELOG Unreleased)
- [ ] Stripe **test mode**: pirkti Beginner ir Advanced → patikrinti, kad atvyksta el. laiškas iš Resend su veikiančia download nuoroda
- [ ] [success.html](success.html) parodo „Download PDF“ mygtuką per ~5 s po `Stripe redirect` (poll į `/api/download-link`)
- [ ] Pasibaigus 15 min in-page tokenui – senas mygtukas grąžina 403; el. laiško nuoroda dar veikia (7 d.)
- [ ] Pakartotinis to paties webhook’o pristatymas – fulfillment lieka `already_fulfilled` (Redis idempotency)
- [ ] [terms.html](terms.html) `#paid-pdf-license` pasiekiamas iš laiško ir iš `success.html`

## Design System v0.3.1 (po v0.3.0 release'o)

Plan: [docs/design_systemv02.md](docs/design_systemv02.md) §18 v0.3.1 backlog.

- [ ] Hard removal of 7 deprecated `:root` aliases (`--orange`, `--orange-light`, `--blue-light`, `--community-cta-green`, `--community-cta-green-hover`, `--shadow-card`, `--shadow-card-hover`) iš [assets/styles.css](assets/styles.css). Pre-flight `rg "var\(\s*--(orange|blue-light|community-cta-green|shadow-card)" templates/ assets/landing.css` privalo grąžinti zero. Strukturinis test'as `tests/structure.test.js` (DS v0.3.0 PR-4 deprecation guard) jau saugo, kad nebūtų regresijos.
- [ ] PR-5 — CTA size-token harmonization: pridėti `--btn-pad-sm/md/lg/xl` ir `--btn-min-h-sm/md/lg` token'us [assets/styles.css](assets/styles.css) `:root`; pritaikyti **esamoms** 7 selectoriams (`.btn`, `.cta-button` (hero), `.community-cta-primary`, `.pdf-guide-cta`, `.next-steps-links a`, `.pdf-sticky-cta-btn`, `.form-submit`) be naujų klasių pavadinimų (AGENTS.md §10 — "no new CTA class names after v0.2"). Reikia screenshot baseline 1440 / 768 / 375 prieš ir po.
- [ ] Line-height token consolidation: 7 ad-hoc literal'ai (`1.2`, `1.3`, `1.45`, `1.5`, `1.55`, `1.6`, `1.65`) → 3 `--leading-tight/normal/relaxed` token'ai (jau deklaruoti `assets/styles.css` `:root`).
- [ ] Deduplicate `:root` blokus `success.html` / `terms.html` → linkuoti tik shared [assets/styles.css](assets/styles.css).
- [ ] (Optional) Playwright arba manual screenshot baseline (1440 / 768 / 375) per [docs/design_systemv02.md](docs/design_systemv02.md) §9.4.

## Saugumas

- [ ] **Niekada** necommitinti `.env` ar `.env.local` – patikrinti `.gitignore` prieš push
- [ ] Naudoti `.env.example` kaip vienintelį versijuojamą template (be realių verčių)
