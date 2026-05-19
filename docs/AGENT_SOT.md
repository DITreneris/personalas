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
| [templates/privacy.html](../templates/privacy.html) | `en/privacy.html`, šaknies `privacy.html` (vartas) |
| [config/sot.json](../config/sot.json) | Marketing, PDF specs, `businessAddress`, Stripe Payment Links |
| [docs/pdf-source/*.html](pdf-source/) | Eksportuoti PDF per `pdf:export` |
| [api/_lib/fulfillment.js](../api/_lib/fulfillment.js), `api/*.js` | — |
| [success.html](../success.html), [terms.html](../terms.html) | Hand-edit (trust adresas sinchronizuoti su SOT) |

| Deprecated — neredaguoti |
|--------------------------|
| [templates/privatumas-lt.html](../templates/privatumas-lt.html) |

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
| `templates/privatumas-lt.html` | Deprecated; naudoti `templates/privacy.html` |
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
