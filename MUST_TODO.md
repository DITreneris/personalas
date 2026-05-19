# MUST_TODO (MVP)

Kritinės užduotys – papildykite pagal projekto poreikį. Prieš release peržiūrėkite kartu su [MVP_ROADMAP.md](MVP_ROADMAP.md).

## Bendra

- [ ] `npm test` praeina `main` šakoje
- [ ] [CHANGELOG.md](CHANGELOG.md) atnaujintas

## Stripe + paid PDF (EN-only, Vercel)

Kontekstas: [DEPLOYMENT.md](DEPLOYMENT.md) sekcija „Paid PDF environment variables“ ir [api/_lib/fulfillment.js](api/_lib/fulfillment.js) `PRODUCTS`.

### Stripe Dashboard

- [ ] Sukurti **Beginner PDF Guide** Product + Price `$5.99` (Stripe Price ID → `STRIPE_PRICE_BEGINNER_PDF`)
- [ ] Sukurti **Advanced PDF Guide** Product + Price `$11.99` (Stripe Price ID → `STRIPE_PRICE_ADVANCED_PDF`)
- [ ] Sukurti **Payment Link** kiekvienam Price; success URL: `https://promptanatomy.help/success.html?session_id={CHECKOUT_SESSION_ID}`
- [ ] (Pasirinktinai) Payment Link → metadata: `product=beginner` arba `product=advanced` (alternatyva – Price ID mapping)
- [ ] Įjungti **Stripe receipts** ON (Settings → Customer emails → Successful payments)
- [ ] Pridėti **webhook endpoint** `https://promptanatomy.help/api/stripe-webhook`, įvykiai: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- [ ] Webhook secret → Vercel env `STRIPE_WEBHOOK_SECRET`

### Repo darbas

- [ ] [templates/index-lt.html](templates/index-lt.html): pakeisti `REPLACE_BEGINNER_PAYMENT_LINK` ir `REPLACE_ADVANCED_PAYMENT_LINK` realiomis Stripe Payment Link URL’omis, tada `npm run build`
- [x] Sugeneruoti / atnaujinti Beginner ir Advanced PDF turinį (EN) — žr. [docs/pdf-source/](docs/pdf-source/README.md); `npm run pdf:export`
- [ ] Įkelti PDF į privatų storage (R2 / S3 / Railway / Vercel Blob); URL → `PDF_BEGINNER_SOURCE_URL`, `PDF_ADVANCED_SOURCE_URL` (su `PDF_SOURCE_AUTH_TOKEN` arba `PDF_SOURCE_AUTH_HEADER`, jei storage reikalauja auth)
- [x] Lokalus dev: `api/_private/pdfs/beginner-guide.pdf` ir `advanced-guide.pdf` (gitignore; generuojami `npm run pdf:export`)

### Vercel env (Production / Preview)

Pilnas sąrašas – [DEPLOYMENT.md](DEPLOYMENT.md). Privalomi:

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_BEGINNER_PDF`
- [ ] `STRIPE_PRICE_ADVANCED_PDF`
- [ ] `DOWNLOAD_TOKEN_SECRET` (>= 32 atsitiktinių baitų; pvz. `openssl rand -base64 48`)
- [ ] `RESEND_API_KEY`
- [ ] `FULFILLMENT_FROM_EMAIL` (verified Resend sender)
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `SITE_URL=https://promptanatomy.help`
- [ ] `PDF_BEGINNER_SOURCE_URL`
- [ ] `PDF_ADVANCED_SOURCE_URL`

### QA prieš release

- [ ] Stripe **test mode**: pirkti Beginner ir Advanced → patikrinti, kad atvyksta el. laiškas iš Resend su veikiančia download nuoroda
- [ ] [success.html](success.html) parodo „Download PDF“ mygtuką per ~5 s po `Stripe redirect` (poll į `/api/download-link`)
- [ ] Pasibaigus 15 min in-page tokenui – senas mygtukas grąžina 403; el. laiško nuoroda dar veikia (7 d.)
- [ ] Pakartotinis to paties webhook’o pristatymas – fulfillment lieka `already_fulfilled` (Redis idempotency)
- [ ] [terms.html](terms.html) `#paid-pdf-license` pasiekiamas iš laiško ir iš `success.html`

## Saugumas

- [ ] **Niekada** necommitinti `.env` ar `.env.local` – patikrinti `.gitignore` prieš push
- [ ] Naudoti `.env.example` kaip vienintelį versijuojamą template (be realių verčių)
