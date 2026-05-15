# Personalas – HR Hiring Prompts

Statinė HTML platforma: 10 HR atrankos promptų. Pasirinkti → kopijuoti → įklijuoti į ChatGPT, Claude ar Gemini. Anglų puslapis lokalizuotas JAV komandoms (`en-US`: valiuta, data, telefonas ir lokacijos pavyzdžiai).

**Numatytoji kalba ir URL:** lankytojui pagrindinis įėjimas yra **anglų** – **`/en/`** (be viešo perjungiklio į LT). Šaknies **`/`** ir **`/privatumas.html`** – tik EN vartai (peradresavimas į `/en/`). **Lietuvių (`/lt/`):** QA / testuotojams – tiesioginė nuoroda; turinys redaguojamas **[`templates/index-lt.html`](templates/index-lt.html)** ir **[`templates/privatumas-lt.html`](templates/privatumas-lt.html)** prieš `npm run build`. Detaliau – [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md).

**Production (numatytasis):** [https://promptanatomy.help](https://promptanatomy.help) – **Vercel**; build komanda repozitorijoje – `npm test` (įskaitant `npm run build`, žr. [vercel.json](vercel.json)). Ant Vercel **`/`** gali būti serverinis peradresavimas į **`/en/`** (papildomai prie HTML vartų). **Alternatyva:** GitHub Pages (`https://ditreneris.github.io/<repo>/`) – build metu nustatykite `SITE_ORIGIN` ir `BASE_PATH` (žr. [DEPLOYMENT.md](DEPLOYMENT.md)).

**SEO ir build:** `npm run build` skaito LT šablonus `templates/`, generuoja `lt/`, `en/`, `robots.txt`, `sitemap.xml` ir papildo šaknies **`index.html`** / **`privatumas.html`** (tik vartų puslapių) `<head>`. Numatytai: `SITE_ORIGIN=https://promptanatomy.help`, tuščias `BASE_PATH` (šaknis ant domeno). Vercel **Preview**: projekto nustatymuose galite nustatyti `SITE_PUBLIC_BASE` (pilna vieša bazė be galo `/`, pvz. `https://xxx.vercel.app`). GitHub Actions CI vis dar naudoja `SITE_ORIGIN=https://ditreneris.github.io` ir `BASE_PATH=/<repo>/`. Po build šaknies vartų HTML gali skirtis nuo repo šaltinio – prieš commit: `git checkout -- index.html privatumas.html` (šablonai `templates/` lieka kanoniniai).

**OG paveikslėlis:** `npm run generate:og` sukuria [images/og-default.png](images/og-default.png) (1200×630, reikia `sharp`).

**Dokumentacija:** visų doc nuorodų indeksas – [docs/INDEX.md](docs/INDEX.md) (procesas: [docs/process/development.md](docs/process/development.md), saugumas: [docs/security.md](docs/security.md), LT/EN: [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md)).

---

**GitHub Pages (pasirinktinai):** push į `main` → Actions → **Deploy to GitHub Pages**.

**Pirmas kartas:** [Settings → Pages](https://github.com/DITreneris/personalas/settings/pages) → **Build and deployment** → šaltinis: **GitHub Actions**.

```bash
git remote add personalas https://github.com/DITreneris/personalas.git
git push personalas main
```
