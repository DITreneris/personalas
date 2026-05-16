# Personalas – HR Hiring Prompts

Statinė HTML platforma: 10 HR atrankos promptų. Pasirinkti → kopijuoti → įklijuoti į ChatGPT, Claude ar Gemini. Lokalizuota JAV komandoms (`en-US`: valiuta, data, telefonas ir lokacijos pavyzdžiai). Pasirinktinai: mokami PDF guides (Beginner $5.99, Advanced $11.99) per Stripe.

**Kalba ir URL:** svetainė yra **anglų kalba (EN-only)** – `/en/`. Lietuvių kalba projekte nebepalaikoma (build’as nebegeneruoja `lt/*`); senieji `/lt/*` URL nukreipiami į `/en/*` per [vercel.json](vercel.json). Šaknies **`/`** ir **`/privatumas.html`** – tik EN vartai (peradresavimas į `/en/`). Turinys redaguojamas **[`templates/index-lt.html`](templates/index-lt.html)** ir **[`templates/privatumas-lt.html`](templates/privatumas-lt.html)** (failo vardas paliktas legacy – build pipeline iš jo generuoja anglų HTML) prieš `npm run build`.

**Production (numatytasis):** [https://promptanatomy.help](https://promptanatomy.help) – **Vercel**; build komanda repozitorijoje – `npm test` (įskaitant `npm run build`, žr. [vercel.json](vercel.json)). Mokami PDF veikia tik Vercel’yje – serverless `api/` reikalauja Stripe, Upstash Redis ir Resend env (žr. [DEPLOYMENT.md](DEPLOYMENT.md) sekciją „Paid PDF environment variables“). **Alternatyva:** GitHub Pages (`https://ditreneris.github.io/<repo>/`) – tik statinė svetainė, **mokami PDF neveikia** be serverless platformos.

**SEO ir build:** `npm run build` skaito šablonus iš `templates/`, generuoja `en/index.html`, `en/privatumas.html`, `robots.txt`, `sitemap.xml` ir papildo šaknies **`index.html`** / **`privatumas.html`** (tik vartų puslapių) `<head>`. Numatytai: `SITE_ORIGIN=https://promptanatomy.help`, tuščias `BASE_PATH` (šaknis ant domeno). Vercel **Preview**: projekto nustatymuose galite nustatyti `SITE_PUBLIC_BASE` (pilna vieša bazė be galo `/`, pvz. `https://xxx.vercel.app`). GitHub Actions CI vis dar naudoja `SITE_ORIGIN=https://ditreneris.github.io` ir `BASE_PATH=/<repo>/`. Po build šaknies vartų HTML gali skirtis nuo repo šaltinio – prieš commit: `git checkout -- index.html privatumas.html` (šablonai `templates/` lieka kanoniniai).

**OG paveikslėlis:** `npm run generate:og` sukuria [images/og-default.png](images/og-default.png) (1200×630, reikia `sharp`).

**Dokumentacija:** visų doc nuorodų indeksas – [docs/INDEX.md](docs/INDEX.md) (procesas: [docs/process/development.md](docs/process/development.md), saugumas: [docs/security.md](docs/security.md), LT/EN: [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md)).

---

**GitHub Pages (pasirinktinai):** push į `main` → Actions → **Deploy to GitHub Pages**.

**Pirmas kartas:** [Settings → Pages](https://github.com/DITreneris/personalas/settings/pages) → **Build and deployment** → šaltinis: **GitHub Actions**.

```bash
git remote add personalas https://github.com/DITreneris/personalas.git
git push personalas main
```

## Contributor workflow

Source of truth:

- **Turinys ir UI:** [`templates/index-lt.html`](templates/index-lt.html), [`templates/privatumas-lt.html`](templates/privatumas-lt.html) (failo vardas legacy – iš jų generuojamas EN HTML); bendri tokenai ir primitivai – [`assets/styles.css`](assets/styles.css); logika – [`generator.js`](generator.js); build – [`scripts/build-locale-pages.js`](scripts/build-locale-pages.js).
- **Mokami PDF (Stripe):** [`api/stripe-webhook.js`](api/stripe-webhook.js), [`api/download.js`](api/download.js), [`api/download-link.js`](api/download-link.js), [`api/_lib/fulfillment.js`](api/_lib/fulfillment.js); UI – [`success.html`](success.html), [`terms.html`](terms.html); produktų katalogas (Beginner / Advanced) – `PRODUCTS` `fulfillment.js`.
- Šaknies `index.html` / `privatumas.html` – tik EN vartai (build papildo `<head>`); ne redaguokite ranka po `npm run build` be commit intent.
- **Neredaguokite** generuotų `en/*` failų ranka – po pakeitimų paleiskite `npm run build` (arba `npm test`).
