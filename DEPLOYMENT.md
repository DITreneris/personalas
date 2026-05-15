# Deployment – Personalas

**QA standartas:** [DITreneris/spinoff01](https://github.com/DITreneris/spinoff01)

### Vercel + promptanatomy.help (pagrindinis deploy)

1. Prijunkite repozitoriją Vercel; **Build Command:** `npm test` (įskaitant build ir lint; žr. [vercel.json](vercel.json)), output – repo šaknis.
2. **Production** domenas: `promptanatomy.help` (arba per Vercel priskirtas custom domain).
3. **Environment variables** (Production / Preview pagal poreikį):
   - `SITE_ORIGIN` – numatytai build skripte jau `https://promptanatomy.help`; galite aiškiai nustatyti Vercel UI.
   - `BASE_PATH` – palikite **tuščią**, jei svetainė publikuojama iš domeno šaknies (`/`, `/lt/`, `/en/`).
   - Jei reikia **vienareikšmės** bazės (pvz. preview URL): `SITE_PUBLIC_BASE=https://<projektas>.vercel.app` (be galo `/`).
4. Po deploy patikrinkite OG / canonical naršyklės devtools arba [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).

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
npx pa11y http://127.0.0.1:3000/privatumas.html --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/lt/ --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/en/ --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/lt/privatumas.html --config .pa11yrc.json
npx pa11y http://127.0.0.1:3000/en/privatumas.html --config .pa11yrc.json
```

---

## Po deploy – gyvas testavimas

- Atlikti gyvą testavimą pagal [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md).
- Rezultatus įrašyti į testavimo žurnalą (tame pačiame faile arba susietame).

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
