# Agentų operacinis SOT (Source of Truth)

**Vienas šaltinis** Cursor agentams ir PR peržiūrai: keliai, build, deploy, brand. Rolės ir workflow diagrama – [AGENTS.md](../AGENTS.md). Kalbos ir prekės ženklo detalės – [language-guidelines-en-lt.md](language-guidelines-en-lt.md). Deploy operacijos – [DEPLOYMENT.md](../DEPLOYMENT.md).

**Paskutinis atnaujinimas:** 2026-09-05

---

## 1. Produkto modelis (2026)

| Aspektas | Kanonas |
|----------|---------|
| **Brand north star** | **`https://www.promptanatomy.app`** — entity HQ; community / footer / `Organization.url` / `llms.txt` Training hub |
| Viešas produktas (šis repo) | **Hire spoke** ant **`promptanatomy.help`**: **EN-only** (`en-US`), kanoninis URL **`/en/`** |
| LT turinys | Tik **authoring** šablonuose (`templates/index-lt.html`); **nesiunčiamas** kaip atskira LT svetainė |
| `/lt/*` produkcijoje | **308 redirect** į `/en/*` ([vercel.json](../vercel.json)) — nėra atskiro LT QA puslapio |
| **Local KPI (spoke)** | **Mokami PDF** (Stripe) + 10 nemokamų promptų; `primaryKpi: pdf` (hero → `#pdf-guides`) — **neperrašo** brand HQ |
| Fulfillment | Vercel serverless `api/` + Upstash Redis + Resend + Blob (arba `api/_private/pdfs/` lokaliai) |
| GitHub Pages | Tik statika — **be** mokamų PDF fulfillment |

Kontaktinė forma (Google Apps Script) – **neįjungta**; žr. [INTEGRACIJA.md](../INTEGRACIJA.md).

---

## 2. Failų žemėlapis

| Redaguoti (šaltinis) | Generuojama / neliesti ranka |
|----------------------|------------------------------|
| [templates/index-lt.html](../templates/index-lt.html) | `en/index.html`, šaknies `index.html` (vartas) |
| [templates/prompt-spoke.html](../templates/prompt-spoke.html) | `en/hr-ai-prompts/<slug>/index.html` (3 spoke) |
| [assets/styles.css](../assets/styles.css), [assets/landing.css](../assets/landing.css) | Tokenai + komponentų CSS (v0.2; be inline `<style>` šablone) |
| [templates/privacy.html](../templates/privacy.html) | `en/privacy.html`, šaknies `privacy.html` (vartas) |
| [config/sot.json](../config/sot.json) | Marketing, `promptSpokes[]`, PDF specs, `businessAddress`, Stripe Payment Links |
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
6. `npm run lint:html:locales` (`en/index.html`, `en/privacy.html`, 3× `en/hr-ai-prompts/*/index.html`)
7. `npm run lint:html:static` (`success.html`, `terms.html`)
8. `npm run lint:js`

---

## 4. API ir fulfillment (trumpai)

| Route | Paskirtis |
|-------|-----------|
| `POST /api/stripe-webhook` | `checkout.session.completed`, `async_payment_succeeded` — Stripe Dashboard URL **must** be `https://www.promptanatomy.help/api/stripe-webhook` (apex POST 308 drops body; §10) |
| `GET /api/download-link?session_id=` | Poll iš `success.html` (15 min tokenai) |
| `GET /api/download?t=` | PDF stream (7 d. email tokenai) |

Produktai: beginner $5.99, advanced $11.99, bundle $15.99. Stripe **Price ID** – env; Payment Links – [config/sot.json](../config/sot.json).

Env šablonas: [.env.example](../.env.example). Pilna lentelė: [DEPLOYMENT.md](../DEPLOYMENT.md).

---

## 5. Kalba ir prekės ženklas (santrauka)

- **Viešai:** tik **Prompt Anatomy** — `/en/`, PDF, terms, privacy, success, el. laiškai. Stripe receipts (separate cover) support email = **`info@promptanatomy.app`** — Dashboard Public details; empty support_email falls back to the account-holder address. No personal Gmail / non-US phone on receipts.
- **Mother brand / entity:** community, footer, `Organization.url`, `llms.txt` Training hub → **`promptanatomy.app`** (ne tik `.help`). Footer entity line (hub QW1b): `Part of Prompt Anatomy · Training & checkout → promptanatomy.app` su `utm_source=help`.
- **Draudžiama viešame UI:** „Personalas“, „Series No. 3“, „Spin-off“, lietuviškos raidės išsiunčiamuose HTML.
- **Vidinis repo pavadinimas:** Personalas (`product.repoName` SOT / `package.json` name) — ne rodyti lankytojui; viešas `product.name` = Prompt Anatomy.
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
- `http://127.0.0.1:3000/en/hr-ai-prompts/job-description/`
- `http://127.0.0.1:3000/en/hr-ai-prompts/interview-scorecard/`
- `http://127.0.0.1:3000/en/hr-ai-prompts/master-hiring-prompt/`
- `http://127.0.0.1:3000/success.html`
- `http://127.0.0.1:3000/terms.html`

Scenarijai: [TESTAVIMAS.md](TESTAVIMAS.md) (įsk. **Mobile matrix**). Stripe gyvas testas: [MUST_TODO.md](../MUST_TODO.md) QA skyrius.

---

## 6a. GEO + AI crawler policy (2026 hardening)

Visi GEO / structured-data / robots / IndexNow artefaktai emit'inami iš vienos vietos — [scripts/build-locale-pages.js](../scripts/build-locale-pages.js) — naudojant SOT lauks iš [config/sot.json](../config/sot.json). Build laiko guardrail'as — [tests/structure.test.js](../tests/structure.test.js) `assertGeoSurface()` (80+ assert'ų).

**GEO north star:** brand destination = **`https://www.promptanatomy.app`**. Šis repo (`.help`) = Hire spoke (PDF + free prompts). `Organization.url` = `brand.motherBrandUrl` (`.app`); `WebSite.url` = **`https://www.promptanatomy.help/en/`** (product home). CTA / `llms.txt` Training hub → `.app`.

### Robots.txt kontraktas

| Klasė | UA pavyzdžiai | Politika |
|-------|---------------|----------|
| **ALLOW search/citation** | `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User`, `Applebot-Extended` | `Allow: /` (referral į PDF **ir** brand discovery → `.app`) |
| **ALLOW landing, DISALLOW PDF assets + /api/** | `GPTBot`, `ClaudeBot`, `Google-Extended`, `Amazonbot` | Brand'as matomas AI answers'uose, bet sample turinys neteka į training set'us |
| **BLOCK** | `anthropic-ai`, `cohere-ai`, `CCBot`, `Bytespider`, `Meta-ExternalAgent` | Training-only, no referral |
| **Default `*`** | (Googlebot, Bingbot, kiti) | `Disallow: /api/`, `Allow: /` |

`Sitemap:` ir `# IndexNow:` eilutės — privalomos pabaigoje.

### JSON-LD @graph

Vienas `@graph` su `WebSite` (`@id` `/#website`, `publisher` ref), `Organization` (`@id` `/#organization`, `url` = mother brand `.app`, `logo`, `slogan`, `knowsAbout`, `contactPoint`, `sameAs` = `.app` + blog + site + social, `founder` ref), `Person` (`@id` `/#tomas`, `worksFor` ref, `sameAs` LinkedIn + operator X). Atskiri `<script type="application/ld+json">` block'ai: `FAQPage` (8 entries iš `sot.frontFaq` + `sot.buyerFaq`, parity su visible text), 3× `Product` (`Offer` su `priceCurrency: USD`, `priceValidUntil`, `MerchantReturnPolicy` 14d/US/free), `BreadcrumbList` (privacy/terms), `speakable` + `dateModified` (WebPage node'ai).

**Draudžiama:** `aggregateRating` / `Review` schema be realių klientų review'ų (Google policy violation).

### SOT laukai (privalomi)

- `sot.frontFaq[3]` — mirror'ina visible front FAQ (Q+A parity FAQPage'ui).
- `sot.brand.{slogan, logoUrl, motherBrandUrl, knowsAbout[], socialProfiles{telegram, x, linkedin}, ecosystemUrls{blog, site}, verification{google, bing}}`.
- `sot.product.{operatorLinkedin, operatorTwitter}` (Person.sameAs).
- `sot.pdfGuides.{beginner|advanced|bundle}.{description, sku, priceUSD, priceValidUntil, pages}` (Product + Offer).
- Validacija — `validateGeoFields()` throw'ina jei trūksta privalomų laukų arba URL ne HTTPS.

### IndexNow

- Key konstanta — [scripts/build-locale-pages.js](../scripts/build-locale-pages.js) `INDEXNOW_KEY` (kartojama [scripts/indexnow-ping.js](../scripts/indexnow-ping.js); rotacija — abi vietos sinchronu).
- Hosted `https://www.promptanatomy.help/{INDEXNOW_KEY}.txt` (vercel.json — `immutable` cache).
- Ping per `npm run seo:indexnow:diff` (`--since-head`), automatiškai wired į [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) post-deploy step'ą tik ant `main`; `continue-on-error: true` (non-blocking).
- Diff mapping `fileToUrls()` mappina template → public URL (laukia priežiūros kai keičiasi sitemap struktūra).

### Meta robots + OG

- **3 indeksuojami** baziniai puslapiai (`en/index.html`, `en/privacy.html`, `terms.html`) + **3 prompt spoke** (`/en/hr-ai-prompts/job-description/`, `…/interview-scorecard/`, `…/master-hiring-prompt/`) — `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`.
- Šaknies gateway'ai (`index.html`, `privacy.html`) — `noindex, follow` (308 → `/en/*`; ne sitemap).
- `success.html` — lieka `noindex, nofollow, max-image-preview:large` (transactional).
- Visi vieši HTML — `og:site_name`, `og:image:alt`, `twitter:image:alt`, `<meta name="twitter:site" content="@promptanatom">`, `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#103B5A">`.

### Sitemap.xml

- `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`.
- Kanoniniai loc'ai: `/en/`, `/en/privacy.html`, `/terms.html`, plius 3× `/en/hr-ai-prompts/<slug>/` (be gateway `/` ir `/privacy.html`).
- Kiekvienas URL — `<lastmod>` iš `git log -1 --format=%cs <source-file>` (fallback'as — today UTC).
- `/en/` — 3 `<image:image>` (OG default + 2 PDF covers).

### Nauji root failai (generated by build)

| Failas | Paskirtis | Cache |
|--------|-----------|-------|
| [llms.txt](../llms.txt) | <5 KB AI-friendly site map (H1 + blockquote + Training hub → `.app` + Free/Paid/Contact + Optional) | 24h |
| [llms-full.txt](../llms-full.txt) | Full markdown digest (10 promptų + 6-phase workflow) | 24h |
| [manifest.webmanifest](../manifest.webmanifest) | PWA-lite (`start_url: /en/`, theme_color navy) | 24h |
| [404.html](../404.html) | EN-only `noindex, follow`; **be** canonical į `/en/` (tik body nuorodos) | 5min |
| `{INDEXNOW_KEY}.txt` | IndexNow protocol key file | immutable |

### CSP

- Produkcijoje **`Content-Security-Policy` enforce** ([vercel.json](../vercel.json) `/(.*)`); inline `onclick` / `onkeydown` pašalinti (delegacija [generator.js](../generator.js)).
- Detaliau — [docs/security.md](security.md).

---

## 6b. Mobile / sticky sutartys (2026-07-29)

| Sutartis | Kanonas |
|----------|---------|
| Sticky PDF CTA | `initPdfStickyCta` → `body.has-pdf-sticky-cta` kai juosta matoma |
| Clearance | `--pdf-sticky-offset` → `html` scroll-padding, `body` padding-bottom, `.toast` bottom |
| Safe-area | `.pdf-sticky-cta`: bottom + L/R; `.page-lanes-nav`: top (`env(safe-area-inset-*)`) |
| Viewport | Vieši HTML: `viewport-fit=cover` (įsk. privacy/terms/success/404) |
| Modal height | `100dvh` / `90dvh` + `@supports not (height: 100dvh)` → `vh` |
| Tap target | `--btn-min-h-sm: 48px` ([design_system_v2.md](design_system_v2.md)) |
| Draudžiama | `user-scalable=no`, `maximum-scale=1`, `position: fixed` ant `body` (iOS clip) |

Rankinis QA: [TESTAVIMAS.md](TESTAVIMAS.md) Mobile matrix. Pamokos agentams: §10.

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

## 10. Pamokos (lessons) – agentams

Šiame repo **nėra** `.cursor/skills/*/lessons.md` (skills framework neįdiegtas). Trumpas kaupimas čia; plėsti tik kai kartojasi klaida.

| Data | Pamoka | Kodėl |
|------|--------|-------|
| 2026-07-29 | Sticky bottom CTA **privalo** kelti toast/footer per `--pdf-sticky-offset` + `body.has-pdf-sticky-cta` | Kitaip Copy toast ir community CTA lieka po juosta |
| 2026-07-29 | `env(safe-area-inset-*)` veikia tik su `viewport-fit=cover` | Be cover inset = 0 (privacy/terms/404 anksčiau be cover) |
| 2026-07-29 | Modal / full-height: preferuok `dvh`, ne tik `100vh` | iOS Safari URL bar „suvalgo“ `vh` |
| 2026-07-29 | Primary tap = **48px** (`--btn-min-h-sm`), ne 44 | Lighthouse/Material; Apple 44 vis tiek tenkinamas |
| 2026-07-29 | Nenaudok `user-scalable=no` „mobile polish“ | WCAG / a11y pažeidimas |
| 2026-07-29 | Emuliatorius ≠ realus iPhone Safari + Android Chrome | Keyboard, clipboard, safe-area, Stripe — tik device / TESTAVIMAS matrix |
| 2026-09-03 | Stripe webhook **tik www** (`https://www.promptanatomy.help/api/stripe-webhook`) | Apex `promptanatomy.help` POST 308 → www; Stripe neperneša body — fulfillment never runs. Healthy junk POST on www = 400 (signature), not 308 |
| 2026-09-03 | Dedicated Upstash — **be** `REDIS_KEY_PREFIX` | Prefix tik kai DB dalijama. Naujas Redis = tušti `fulfillment:*`; senų pirkimų eilutės dingsta — resend per `check-fulfillment.js` |
| 2026-09-03 | Production `/api/download?t=short` **503** = Redis fail-closed | Rate-limit `checkRateLimit` meta; sveika = **403**. Local `.env` Upstash ≠ Vercel env kol neįklijuota ir redeploy |
| 2026-09-05 | Stripe **Public details** = receipt contact (not our HTML) | Empty `support_email` → account-holder Gmail on “If you have any questions…”. `accounts.update` **cannot** change your own account — Dashboard only. Canon: `info@promptanatomy.app`; no +370 / personal phone |
| 2026-09-05 | One Stripe account can have many products and many webhook URLs | Replay proof = Dashboard 200 `already_fulfilled` on the **www .help** endpoint, not `pending_webhooks === 0`. Other spokes (`.space` / `.ceo` / `.online` / `.app`) on the same account are valid; event-level pending stays >0 if those return 400 (wrong endpoint secret). Fix that project's `STRIPE_WEBHOOK_SECRET` — do not open a new Stripe account per repo. |

---

## Susiję dokumentai

- [INDEX.md](INDEX.md) — tier žemėlapis (hub)
- [DOCUMENTATION.md](DOCUMENTATION.md) — DMS lifecycle
- [AGENTS.md](../AGENTS.md) — rolės, workflow, CTA §10
- [.cursorrules](../.cursorrules) — saugumas, a11y, merge vartai
- Tier 1–2 detalės — [INDEX.md](INDEX.md)
