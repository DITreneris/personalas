# Deployment – Personalas

**QA standartas:** [DITreneris/spinoff01](https://github.com/DITreneris/spinoff01)

**Vieša kalba ir kelias:** anglų (`en-US`), **`/en/`**. Lietuvių kalba projekte nebepalaikoma – build’as generuoja tik `/en/` puslapius; `/lt/*` URL nukreipiami į `/en/*` per [vercel.json](vercel.json) redirect taisykles.

**Mokami PDF:** Stripe + Vercel serverless (`api/`) + Upstash Redis + Resend. **GitHub Pages šio srauto nepalaiko** (nėra serverio); paid PDF veikia tik Vercel deploy’e.

### Vercel + promptanatomy.help (pagrindinis deploy)

1. Prijunkite repozitoriją Vercel; **Build Command:** `npm test` (įskaitant build ir lint; žr. [vercel.json](vercel.json)), output – repo šaknis.
2. **Production** domenas: `promptanatomy.help` (arba per Vercel priskirtas custom domain).
3. **Site environment variables** (Production / Preview pagal poreikį):
   - `SITE_ORIGIN` – numatytai build skripte jau `https://promptanatomy.help`; galite aiškiai nustatyti Vercel UI.
   - `BASE_PATH` – palikite **tuščią**, jei svetainė publikuojama iš domeno šaknies (`/`, `/en/`).
   - Jei reikia **vienareikšmės** bazės (pvz. preview URL): `SITE_PUBLIC_BASE=https://<projektas>.vercel.app` (be galo `/`).
4. Po deploy patikrinkite OG / canonical naršyklės devtools arba [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).

### Paid PDF environment variables (Stripe + Resend + Redis)

Vercel Project → Settings → Environment Variables. **Niekada necommitinti slaptažodžių į repo.**

| Kintamasis | Privaloma | Paskirtis |
|------------|-----------|-----------|
| `STRIPE_SECRET_KEY` | Taip | Stripe API raktas, naudojamas webhook’o prie Checkout Session retrieve. |
| `STRIPE_WEBHOOK_SECRET` | Taip | Tikrina `https://promptanatomy.help/api/stripe-webhook` įvykius. |
| `STRIPE_PRICE_BEGINNER_PDF` | Taip | Stripe Price ID Beginner PDF guide ($5.99). |
| `STRIPE_PRICE_ADVANCED_PDF` | Taip | Stripe Price ID Advanced PDF guide ($11.99). |
| `STRIPE_PRICE_BUNDLE_PDF` | Taip | Stripe Price ID Bundle (Both guides, $15.99). |
| `DOWNLOAD_TOKEN_SECRET` | Taip | HMAC raktas pasirašytoms download nuorodoms. Ilgas atsitiktinis (>= 32 baitai). |
| `RESEND_API_KEY` | Taip | Siunčia transakcinius PDF pristatymo el. laiškus. |
| `FULFILLMENT_FROM_EMAIL` | Taip | Patvirtintas siuntėjas, pvz. `Prompt Anatomy <hello@promptanatomy.help>`. |
| `UPSTASH_REDIS_REST_URL` | Taip | Upstash Redis REST URL fulfillment būsenai ir token jti. |
| `UPSTASH_REDIS_REST_TOKEN` | Taip | Upstash Redis REST token (palaikomi ir `KV_REST_API_*`, `VERCEL_KV_REST_API_*` vardai). |
| `REDIS_KEY_PREFIX` | Pasirinkt. | Prefiksas bendram Upstash DB (pvz. `personalas:` → raktai `personalas:fulfillment:cs_...`). |
| `SITE_URL` | Rekomenduojama | Kanoninis URL emailed download nuorodoms. Pvz. `https://promptanatomy.help`. |
| `BLOB_READ_WRITE_TOKEN` | Taip (Blob) | Auto, kai Vercel projekte sukurtas **Private** Blob store. Naudojamas fulfillment `fetch` į `*.private.blob.vercel-storage.com` (žr. [api/_lib/fulfillment.js](api/_lib/fulfillment.js)). |
| `PDF_BEGINNER_SOURCE_URL` | Production | Private Blob URL Beginner PDF (žr. žemiau `npm run pdf:upload:blob`). |
| `PDF_ADVANCED_SOURCE_URL` | Production | Private Blob URL Advanced PDF. |
| `PDF_SOURCE_AUTH_TOKEN` | Pagal poreikį | Tik jei šaltinis **ne** Vercel Blob; kitaip pakanka `BLOB_READ_WRITE_TOKEN`. |
| `PDF_SOURCE_AUTH_HEADER` | Pagal poreikį | Custom header formatu `Header-Name: value`. |
| `DOWNLOAD_TOKEN_TTL_SECONDS` | Pasirinkt. | Numatytai 7 d. (ilgalaikė email nuoroda). |
| `IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS` | Pasirinkt. | Numatytai 15 min (`success.html` poll). |
| `FULFILLMENT_STATE_TTL_SECONDS` | Pasirinkt. | Numatytai 90 d. fulfillment įrašams. |

### Verslo pašto adresas (CAN-SPAM + Stripe trust)

1. Repo SOT: [config/sot.json](config/sot.json) → `product.businessAddress`. Po pakeitimo `npm run build` perrašo `en/index.html` (footer + JSON-LD `PostalAddress`), `en/privacy.html` (Contact sekciją) ir root gateway JSON-LD. Hand-edit jei keičiate: [terms.html](terms.html), [success.html](success.html).
2. **Fulfillment laiškai (Resend per Vercel):** `api/_lib/fulfillment.js` užkrauna adresą iš SOT. Jei norite rotuoti adresą be redeploy, nustatykite Vercel env `BUSINESS_ADDRESS_OVERRIDE` su JSON tame pačiame formate (`{"name":"…","street":"…","unit":"…","city":"…","region":"…","postalCode":"…","country":"US","countryName":"United States"}`).
3. **Manual one-time:** Stripe Dashboard → Settings → Business → **Public details** → įrašykite tą patį adresą. Stripe rendered receipts (kurie keliauja po „separate cover") tą adresą deda automatiškai – jo iš mūsų kodo negalime kontroliuoti.
4. **Po deploy:** užsisakykite testinį PDF (`stripe trigger checkout.session.completed` arba live test pirkimą) ir patvirtinkite, kad Resend laiškas pabaigoje turi 4 eilučių pašto bloką.

### Stripe konfigūracija

1. Sukurkite Products / Prices: **Beginner** ($5.99), **Advanced** ($11.99), **Bundle** ($15.99). Į Vercel env įrašykite `STRIPE_PRICE_BEGINNER_PDF`, `STRIPE_PRICE_ADVANCED_PDF`, `STRIPE_PRICE_BUNDLE_PDF`.
2. Sukurkite po vieną Payment Link kiekvienam produktui (ir pasirinktinai bundle) ir įklijuokite URL’us į [config/sot.json](config/sot.json) → `pdfGuides.beginner.stripePaymentLink`, `pdfGuides.advanced.stripePaymentLink`, `pdfGuides.bundle.stripePaymentLink`, tada `npm run build`.
3. **Success URL** (Stripe Dashboard → Payment Link → After payment → Don’t show confirmation page → Redirect to your website):
   ```
   https://promptanatomy.help/success.html?session_id={CHECKOUT_SESSION_ID}
   ```
   Stripe pakeičia `{CHECKOUT_SESSION_ID}` realiu session id, kurį `success.html` perduoda `/api/download-link`.
4. **Stripe receipts** ON (Stripe Dashboard → Settings → Customer emails → Successful payments).
5. Pridėkite live webhook į `https://promptanatomy.help/api/stripe-webhook`, prenumeruokite `checkout.session.completed` ir `checkout.session.async_payment_succeeded`.
6. (Pasirinktinai) Stripe Payment Link → metadata: `product=beginner` arba `product=advanced` – ankstyvas produkto identifikavimas; jei nenustatyta, fulfillment naudoja Price ID.

### PDF saugykla ir authoring

- **Šaltinis (repo):** [docs/pdf-source/](docs/pdf-source/README.md) — HTML + `pdf-print.css`; eksportas per Chrome „Save as PDF“ arba `npm run pdf:export` (Playwright).
- **Prekės ženklas:** kiekviename puslapyje footer `www.promptanatomy.app`; viršuje ir pabaigoje — `promptanatomy.help`.
- **Lokalūs failai:** `api/_private/pdfs/beginner-guide.pdf`, `advanced-guide.pdf` (gitignore). Generuoti: `npm run pdf:export`. Lokaliai galite palikti `PDF_*_SOURCE_URL` tuščius — fulfillment skaito iš `_private/pdfs/`.
- **Production (Vercel Blob, private):**
  1. Vercel → **Storage** → **Blob** → Create store (**Private**).
  2. Lokaliai: `BLOB_READ_WRITE_TOKEN` į `.env` (arba `vercel env pull`).
  3. `npm run pdf:export` → `npm run pdf:upload:blob` — skriptas [scripts/upload-pdfs-to-vercel-blob.js](scripts/upload-pdfs-to-vercel-blob.js) spausdina `PDF_BEGINNER_SOURCE_URL` ir `PDF_ADVANCED_SOURCE_URL`.
  4. Įklijuokite abu URL + patikrinkite `BLOB_READ_WRITE_TOKEN` į **Vercel env** (Production + Preview) → **Redeploy**.
  5. Po PDF turinio pakeitimo: vėl `pdf:export` + `pdf:upload:blob` (`allowOverwrite: true`).
- Viešas site root **negali** hostinti mokamų PDF.
- **Cover / preview PNG:** `assets/pdf-covers/` — `npm run pdf:covers:preview` po eksporto.

### GitHub Pages (pasirinktinai)

- URL priklauso nuo repo vardo, pvz. `https://ditreneris.github.io/personalas/`.
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) build metu nustato `SITE_ORIGIN=https://ditreneris.github.io` ir `BASE_PATH=/<repo>/` – canonical ir sitemap jau sutampa, papildomo patch žingsnio nereikia.

**Build / SEO:** žr. [scripts/build-locale-pages.js](scripts/build-locale-pages.js) – `SITE_ORIGIN`, `BASE_PATH`, pasirinktinai `SITE_PUBLIC_BASE`.

---

## Įspėjimas: į kurią repo keliama

- Naudokite numatytą remote (pvz. `personalas`). **Visada** pushinkite į tą repo, kur norite matyti pakeitimus (`git push personalas main`).
- **Nepushinti į kitas repozitorijas** per klaidą.

---

## GitHub Pages – bendras procesas

### Pirmas kartas

1. **GitHub:** repozitorija [DITreneris/personalas](https://github.com/DITreneris/personalas) (ar jūsų analogas).
2. **Lokaliai:** `git remote -v` – įsitikinkite, kad `personalas` (ar naudojamas vardas) rodo į teisingą URL.
3. **GitHub:** Settings → Pages → **Build and deployment** → Source: **GitHub Actions**.
4. Po pirmo push į `main` workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) paleidžiamas automatiškai: testai → deploy.

### Vėlesni deploy

- Kiekvienas push į `main` paleidžia testus ir deploy į `https://ditreneris.github.io/<repo-name>/`.

### Rankinis deploy

- **Actions** → workflow **Deploy to GitHub Pages** → **Run workflow** (branch: `main`).

---

## SEO (santrauka)

- Statinių `robots.txt` ir `sitemap.xml` generavimas: `npm run build` ([scripts/build-locale-pages.js](scripts/build-locale-pages.js)).
- Jei reikia pakeisti jau sugeneruotą bazinį URL (retas atvejis): [scripts/patch-published-base.js](scripts/patch-published-base.js) – `PATCH_FROM_PREFIX` (numatytai `https://promptanatomy.help`) ir `PUBLISHED_SITE_BASE` (tikslas).
- **Google Search Console (nuosavybės patvirtinimas):** repo šaknyje laikomas [google7305663b2567346e.html](google7305663b2567346e.html) (HTML failo metodas). Po deploy patikrinkite `https://promptanatomy.help/google7305663b2567346e.html` — turinys turi būti viena eilutė `google-site-verification: google7305663b2567346e.html` (be redirect į `/en/`). Alternatyva — meta žyma per [config/sot.json](config/sot.json) → `brand.verification.google` + `npm run build` (tuščia = meta neįterpiama).

---

## Lokalus tikrinimas prieš deploy

```bash
npm install
npm test
```

A11y (pasirinktinai; tie patys keliai kaip CI po `npm test`):

```bash
npx serve -s . -l 3000
# Kitoje terminale:
npx pa11y http://127.0.0.1:3000/ --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/privacy.html --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/en/ --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/en/privacy.html --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/success.html --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/terms.html --config .pa11yrc.json
```

---

## Po deploy – gyvas testavimas

- Atlikti gyvą testavimą pagal [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md).
- Rezultatus įrašyti į testavimo žurnalą (tame pačiame faile arba susietame).
- **Favicon:** `https://promptanatomy.help/favicon.svg` (ir `.ico`) grąžina 200; `/en/` skirtuke matoma ikona (ne 404 į `/en/favicon.svg`). Po SVG keitimo: `npm run generate:favicon` ir redeploy.
- **Google Search Console:** `https://promptanatomy.help/google7305663b2567346e.html` → 200, body kaip repo faile; tada GSC → Verify ownership.

---

## Troubleshooting

| Problema | Sprendimas |
|----------|------------|
| Pages rodo 404 | Patikrinti, ar Settings → Pages šaltinis = **GitHub Actions**. |
| Workflow nepaleidžiamas | Patikrinti, ar failas `.github/workflows/deploy.yml` yra `main` šakoje. |
| **Deploy workflow failed** | Actions → atidaryti nepavykusį run → žiūrėti **test** job: jei nepraėjo `npm test`, lokaliai paleisti `npm test` ir taisyti; jei nepraėjo **deploy** job – tikrinti environment/permissions. |
| **CI workflow failed** | Dažniausiai `pa11y` (a11y klaidos) arba `npm test`. CI naudoja `.pa11yrc.json` (Chrome `--no-sandbox` ir kt., kad pa11y veiktų GitHub Actions). Lokaliai: `npm test`, tada `npx serve -s . -l 3000` ir `npx pa11y http://127.0.0.1:3000/ --config .pa11yrc.json` (arba be config, jei nereikia sandbox). |
| Svetainė tuščia / neteisingas kelias | Projektas – statinis iš root; `path: .` – teisingas. Jei naudojate subfolderį, pakeisti `path`. |

---

## Susiję dokumentai

- [docs/QA_STANDARTAS.md](docs/QA_STANDARTAS.md) – QA standartas (nuoroda į spinoff01)
- [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md) – gyvo testavimo dokumentacija
- [AGENTS.md](AGENTS.md) – release ir QA procesas
