# Agentų operacinis SOT (Source of Truth)

**Vienas šaltinis** Cursor agentams ir PR peržiūrai: keliai, build, deploy, brand. Rolės ir workflow diagrama – [AGENTS.md](../AGENTS.md). Kalbos ir prekės ženklo detalės – [language-guidelines-en-lt.md](language-guidelines-en-lt.md). Deploy operacijos – [DEPLOYMENT.md](../DEPLOYMENT.md).

**Paskutinis atnaujinimas:** 2026-05-19

---

## 1. Produkto modelis (2026)

| Aspektas | Kanonas |
|----------|---------|
| Viešas produktas | **EN-only** (`en-US`), kanoninis URL **`/en/`** |
| LT turinys | Tik **authoring** šablonuose (`templates/index-lt.html`); **nesiunčiamas** kaip atskira LT svetainė |
| `/lt/*` produkcijoje | **308 redirect** į `/en/*` ([vercel.json](../vercel.json)) — nėra atskiro LT QA puslapio |
| Konversija | **Mokami PDF** (Stripe) + 10 nemokamų promptų įsitraukimui |
| Fulfillment | Vercel serverless `api/` + Upstash Redis + Resend + Blob (arba `api/_private/pdfs/` lokaliai) |
| GitHub Pages | Tik statika — **be** mokamų PDF fulfillment |

Kontaktinė forma (Google Apps Script) – **neįjungta**; žr. [INTEGRACIJA.md](../INTEGRACIJA.md).

---

## 2. Failų žemėlapis

| Redaguoti (šaltinis) | Generuojama / neliesti ranka |
|----------------------|------------------------------|
| [templates/index-lt.html](../templates/index-lt.html) | `en/index.html`, šaknies `index.html` (vartas) |
| [assets/styles.css](../assets/styles.css), [assets/landing.css](../assets/landing.css) | Tokenai + komponentų CSS (v0.2; be inline `<style>` šablone) |
| [templates/privacy.html](../templates/privacy.html) | `en/privacy.html`, šaknies `privacy.html` (vartas) |
| [config/sot.json](../config/sot.json) | Marketing, PDF specs, `businessAddress`, Stripe Payment Links |
| [docs/pdf-source/*.html](pdf-source/) | Eksportuoti PDF per `pdf:export` |
| [api/_lib/fulfillment.js](../api/_lib/fulfillment.js), `api/*.js` | — |
| [success.html](../success.html), [terms.html](../terms.html) | Hand-edit (trust adresas sinchronizuoti su SOT) |

Po turinio pakeitimų: **`npm run build`** (arba **`npm test`**, kuris build'ą paleidžia pirmas).

---

## 3. Build ir testai

### Build

```bash
npm run build   # scripts/build-locale-pages.js
```

**Išvestis:** `en/index.html`, `en/privacy.html`, `privacy.html`, `index.html`, `robots.txt`, `sitemap.xml`. **Nėra** `lt/` katalogo.

**Ne build:** [generator.js](../generator.js) — runtime (kopijavimas, PDF preview lightbox, Stripe fallback, analytics).

### PDF pipeline

```bash
npm run pdf:validate    # HTML šaltinio paruošimas
npm run pdf:export        # Playwright → api/_private/pdfs/*.pdf
npm run pdf:covers        # Viršeliai iš binary PDF
npm run pdf:upload:blob   # Production Blob (optional)
```

**PDF kiekiai (SOT):** Beginner **16** psl., Advanced **32** psl. Preview puslapiai: beginner `[6,8,9]`, advanced `[10,15,17]`.

### `npm test` (privaloma prieš merge)

Vykdoma seka ([package.json](../package.json)):

1. `npm run build`
2. `npm run pdf:validate`
3. `node tests/structure.test.js`
4. `npm run lint:html` (šaknies `index.html`)
5. `npm run lint:html:privacy` (`privacy.html`)
6. `npm run lint:html:locales` (`en/index.html`, `en/privacy.html`)
7. `npm run lint:html:static` (`success.html`, `terms.html`)
8. `npm run lint:js`

---

## 4. API ir fulfillment (trumpai)

| Route | Paskirtis |
|-------|-----------|
| `POST /api/stripe-webhook` | `checkout.session.completed`, `async_payment_succeeded` |
| `GET /api/download-link?session_id=` | Poll iš `success.html` (15 min tokenai) |
| `GET /api/download?t=` | PDF stream (7 d. email tokenai) |

Produktai: beginner $5.99, advanced $11.99, bundle $15.99. Stripe **Price ID** – env; Payment Links – [config/sot.json](../config/sot.json).

Env šablonas: [.env.example](../.env.example). Pilna lentelė: [DEPLOYMENT.md](../DEPLOYMENT.md).

---

## 5. Kalba ir prekės ženklas (santrauka)

- **Viešai:** tik **Prompt Anatomy** — `/en/`, PDF, terms, privacy, success, el. laiškai.
- **Draudžiama viešame UI:** „Personalas“, „Series No. 3“, „Spin-off“, lietuviškos raidės išsiunčiamuose HTML.
- **Vidinis repo pavadinimas:** Personalas (`product.name` SOT) — ne rodyti lankytojui.
- **Privacy URL:** `/privacy.html` → `/en/privacy.html` (ne `privatumas`).

Detaliau: [language-guidelines-en-lt.md](language-guidelines-en-lt.md).

---

## 6. Deploy ir QA URL

**Produkcija:** Vercel, `npm test` build komanda ([vercel.json](../vercel.json)).

**Post-deploy (pirmiausia):** `/en/`, tada vartai ir statiniai puslapiai.

**Pa11y (sutampa su CI):** po `npx serve . -l 3000`:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/privacy.html`
- `http://127.0.0.1:3000/en/`
- `http://127.0.0.1:3000/en/privacy.html`
- `http://127.0.0.1:3000/success.html`
- `http://127.0.0.1:3000/terms.html`

Scenarijai: [TESTAVIMAS.md](TESTAVIMAS.md). Stripe gyvas testas: [MUST_TODO.md](../MUST_TODO.md) QA skyrius.

---

## 6a. GEO + AI crawler policy (2026 hardening)

Visi GEO / structured-data / robots / IndexNow artefaktai emit'inami iš vienos vietos — [scripts/build-locale-pages.js](../scripts/build-locale-pages.js) — naudojant SOT lauks iš [config/sot.json](../config/sot.json). Build laiko guardrail'as — [tests/structure.test.js](../tests/structure.test.js) `assertGeoSurface()` (80+ assert'ų).

### Robots.txt kontraktas

| Klasė | UA pavyzdžiai | Politika |
|-------|---------------|----------|
| **ALLOW search/citation** | `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User`, `Applebot-Extended` | `Allow: /` (varo referral traffic'ą į PDF) |
| **ALLOW landing, DISALLOW PDF assets + /api/** | `GPTBot`, `ClaudeBot`, `Google-Extended`, `Amazonbot` | Brand'as matomas AI answers'uose, bet sample turinys neteka į training set'us |
| **BLOCK** | `anthropic-ai`, `cohere-ai`, `CCBot`, `Bytespider`, `Meta-ExternalAgent` | Training-only, no referral |
| **Default `*`** | (Googlebot, Bingbot, kiti) | `Disallow: /api/`, `Allow: /` |

`Sitemap:` ir `# IndexNow:` eilutės — privalomos pabaigoje.

### JSON-LD @graph

Vienas `@graph` su `WebSite` (`@id` `/#website`, `publisher` ref), `Organization` (`@id` `/#organization`, `logo`, `slogan`, `knowsAbout`, `contactPoint`, `sameAs` ×4, `founder` ref), `Person` (`@id` `/#tomas`, `worksFor` ref, `sameAs` LinkedIn + operator X). Atskiri `<script type="application/ld+json">` block'ai: `FAQPage` (9 entries iš `sot.frontFaq` + `sot.buyerFaq`, parity su visible text), 3× `Product` (`Offer` su `priceCurrency: USD`, `priceValidUntil`, `MerchantReturnPolicy` 14d/US/free), `BreadcrumbList` (privacy/terms), `speakable` SpeakableSpecification (visi WebPage node'ai).

**Draudžiama:** `aggregateRating` / `Review` schema be realių klientų review'ų (Google policy violation).

### SOT laukai (privalomi)

- `sot.frontFaq[4]` — mirror'ina visible front FAQ (Q+A parity FAQPage'ui).
- `sot.brand.{slogan, logoUrl, knowsAbout[], socialProfiles{telegram, x, linkedin}, verification{google, bing}}`.
- `sot.product.{operatorLinkedin, operatorTwitter}` (Person.sameAs).
- `sot.pdfGuides.{beginner|advanced|bundle}.{description, sku, priceUSD, priceValidUntil, pages}` (Product + Offer).
- Validacija — `validateGeoFields()` throw'ina jei trūksta privalomų laukų arba URL ne HTTPS.

### IndexNow

- Key konstanta — [scripts/build-locale-pages.js](../scripts/build-locale-pages.js) `INDEXNOW_KEY` (kartojama [scripts/indexnow-ping.js](../scripts/indexnow-ping.js); rotacija — abi vietos sinchronu).
- Hosted `https://promptanatomy.help/{INDEXNOW_KEY}.txt` (vercel.json — `immutable` cache).
- Ping per `npm run seo:indexnow:diff` (`--since-head`), automatiškai wired į [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) post-deploy step'ą tik ant `main`; `continue-on-error: true` (non-blocking).
- Diff mapping `fileToUrls()` mappina template → public URL (laukia priežiūros kai keičiasi sitemap struktūra).

### Meta robots + OG

- 4 indeksuojami puslapiai (en/index.html, en/privacy.html, terms.html, root gateway) — `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`.
- `success.html` — lieka `noindex, nofollow, max-image-preview:large` (transactional).
- Visi 5 puslapiai — `og:site_name`, `og:image:alt`, `twitter:image:alt`, `<meta name="twitter:site" content="@promptanatom">`, `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#103B5A">`.

### Sitemap.xml

- `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`.
- Kiekvienas URL — `<lastmod>` iš `git log -1 --format=%cs <source-file>` (fallback'as — today UTC).
- `/en/` — 3 `<image:image>` (OG default + 2 PDF covers).

### Nauji root failai (generated by build)

| Failas | Paskirtis | Cache |
|--------|-----------|-------|
| [llms.txt](../llms.txt) | <5 KB AI-friendly site map (H1 + blockquote + Free/Paid/Policies/Contact) | 24h |
| [llms-full.txt](../llms-full.txt) | Full markdown digest (10 promptų + 6-phase workflow) | 24h |
| [manifest.webmanifest](../manifest.webmanifest) | PWA-lite (`start_url: /en/`, theme_color navy) | 24h |
| [404.html](../404.html) | EN-only noindex,follow, canonical → /en/ | 5min |
| `{INDEXNOW_KEY}.txt` | IndexNow protocol key file | immutable |

### Promotion path (CSP Report-Only → enforce)

- CSP yra `Content-Security-Policy-Report-Only` ([vercel.json](../vercel.json) `/(.*)`).
- **NE PERLEISTI į enforce** kol [en/index.html](../en/index.html) yra inline `onclick=` / `onkeydown=` handler'iai (refactor'inti į `addEventListener` per [generator.js](../generator.js)).
- Detaliau — [docs/security.md](security.md).

---

## 7. Agentų rolės ir turinio seka

| Agentas | Atsakomybė |
|---------|------------|
| **Orchestrator** | Prioritetai, scope, koordinacija |
| **Curriculum** | Promptų seka, priklausomybės |
| **Content** | Tekstai; laikytis [LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md) (id/klasės/JS) |
| **UI/UX** | CSS, a11y, layout — ne promptų teksto |
| **QA** | `npm test`, pa11y, doc atitiktis, CHANGELOG prieš release |

**Turinio keitimo seka:** Orchestrator → Curriculum → Content → UI/UX → QA.

**Commit prefiksai:** `[Content]`, `[Curriculum]`, `[UI]`, `[QA]`, `[Orchestrator]`.

---

## 8. Kas nebeaktualu (nenaudoti kaip instrukcijos)

| Artefaktas | Kodėl |
|------------|--------|
| `.cursor/plans/hr_atrankos_spin-off_nr.3_*.plan.md` | Spin-off Nr. 3, žalia HR tema — pakeista Prompt Anatomy navy + gold |
| Viešas `/lt/` kaip QA svetainė | Build negeneruoja `lt/`; URL redirect į EN |
| `templates/privatumas-lt.html` | Pašalintas v1.2.0; naudoti `templates/privacy.html` |
| Privalomas Google Apps Script kontaktų forma | Neįjungta — [INTEGRACIJA.md](../INTEGRACIJA.md) |
| PDF 12 + 24 psl. | Dabar **16 + 32** |

---

## 9. Greita patikra

```bash
# Viešame UI draudžiami likučiai
rg -i "personalas|series no|spin-off|promptų|biblioteka|marketingas|prompt.?library" en/ terms.html success.html templates/privacy.html docs/pdf-source

# Pasenę keliai dokumentuose
rg -i "privatumas-lt|/lt/|generuoja.*lt/|12 psl|24 psl" docs/ AGENTS.md .cursorrules README.md DEPLOYMENT.md
```

Prieš merge: **`npm test`** privalo praeiti.

---

## Susiję dokumentai

- [AGENTS.md](../AGENTS.md) — rolės, workflow, release
- [.cursorrules](../.cursorrules) — saugumas, a11y, merge vartai
- [docs/INDEX.md](INDEX.md) — dokumentacijos indeksas
- [docs/DOCUMENTATION.md](DOCUMENTATION.md) — doc valdymas
- [docs/QA_STANDARTAS.md](QA_STANDARTAS.md) — QA checklist
