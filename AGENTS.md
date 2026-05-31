# Agentų Sistemos Modelis – Apžvalga

**Projektas:** Personalas 
**Versija:** 1.0 
**Šio dokumento kalba:** LT (agentų aprašymas). **Viešas produktas:** **EN-only** (`en-US`, `/en/`); LT puslapiai nebegeneruojami, `/lt/*` URL nukreipiami į `/en/*`.

**Agentų operacinis SOT (keliai, build, deploy, brand):** [docs/AGENT_SOT.md](docs/AGENT_SOT.md) — skaityti prieš pakeitimus. Kalbos detalės: [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md).

---

## 1. Architektūra

```
ORCHESTRATOR AGENT (koordinacija)
    ├── Content Agent      (promptai, tekstai)
    ├── Curriculum Agent   (struktūra, logika, seka)
    ├── UI/UX Agent        (dizainas, a11y, UX)
    ├── QA Agent           (kodas + turinys)
    └── Feedback Store     (duomenys, metrikos)
            │
            └── GitHub / Version Control
```

---

## 2. Agentų rolės

### Content Agent
- **Tikslas:** Kuria ir prižiūri teksto turinį (promptus, aprašymus)
- **Įvestis:** Specifikacija, grįžtamasis ryšys, Curriculum rekomendacijos
- **Išvestis:** Turinio redagavimai, nauji promptai
- **Kalba:** viešas kanonas – **anglų** (`/en/`); LT šablonuose redaguojamas šaltinis – žr. [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) (*SOT*). Po pakeitimų – `npm run build`.

### Curriculum Agent
- **Tikslas:** Nustato turinio struktūrą ir mokymosi logiką
- **Įvestis:** Tikslai, auditorija, MVP_ROADMAP.md
- **Išvestis:** Promptų seka, priklausomybių modelis

### UI/UX & Usability Agent
- **Tikslas:** Sąsajos kokybė, prieinamumas, vartotojo patirtis
- **Įvestis:** .cursorrules, WCAG AA, sesijų duomenys
- **Išvestis:** UI pakeitimai, CSS/HTML optimizacijos, a11y patikros

### QA Agent
- **Tikslas:** Tikrina kokybę – kodas ir turinys
- **Įvestis:** Pakeitimų diff, MUST_TODO.md, test scenarijai
- **Išvestis:** Klaidų ataskaitos, acceptance checklist
- **Dokumentacija:** Prieš merge tikrina, ar pakeitimams atitinka dokumentacijos atnaujinimai (žr. [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)). Prieš release – ar CHANGELOG.md atnaujintas ir versija atitinka SemVer.

### Orchestrator Agent
- **Tikslas:** Koordinuoja agentus, prioritizuoja užduotis
- **Įvestis:** Verslo užduotys, Feedback Store metrikos
- **Išvestis:** Užduočių eilės, prioritetų planas

---

## 3. Workflow

1. **Vartotojas/Verslas** → Orchestrator: nauja užduotis
2. **Orchestrator** → Curriculum: struktūros rekomendacijos
3. **Curriculum** → Orchestrator: specifikacija
4. **Orchestrator** → Content: turinio kūrimas
5. **Content** → Orchestrator: turinio versija
6. **Orchestrator** → UI/UX: integracijos užduotis
7. **UI/UX** → Orchestrator: UI pakeitimai
8. **Orchestrator** → QA: validacija
9. **QA fail** → grąžinti Content/UI taisymams
10. **QA pass** → GitHub: PR sukūrimas

---

## 4. Loop logika

| Ciklas | Aprašymas |
|--------|-----------|
| Planavimo | Orchestrator → Curriculum → prioritetų sąrašas |
| Kūrimo | Content + UI/UX (lygiagrečiai, jei leidžia priklausomybės) |
| Validacijos | QA → fail = grąžinti; pass = merge |
| Įvertinimo | Release → Feedback Store → metrikos → nauji prioritetai |

---

## 5. Commit prefiksai (agentų)

- `[Content]` – turinio pakeitimai
- `[Curriculum]` – struktūros/sekos pakeitimai
- `[UI]` – dizainas, UX, a11y
- `[QA]` – testai, validacija, fix'ai
- `[Orchestrator]` – koordinacija, konfigūracija

---

## 6. Komandos (vykdomas prieš merge / lokaliai)

| Komanda | Paskirtis |
|---------|-----------|
| `npm install` | Įdiegti priklausomybes |
| `npm run build` | `scripts/build-locale-pages.js` → `en/*`, vartai, sitemap |
| `npm test` | build + `pdf:validate` + structure + HTML/JS lint (pilna seka – [docs/AGENT_SOT.md](docs/AGENT_SOT.md) §3) |
| `npm run lint:html` | HTML validacija (šaknies `index.html` – vartai) |
| `npm run lint:js` | ESLint visiems .js failams |
| CI (GitHub Actions) | Tas pats `npm test` + pa11y (žr. AGENT_SOT §6) |

Prieš PR įsitikinti, kad `npm test` praeina. PDF: `pdf:validate`, `pdf:export`, `pdf:covers` — [docs/AGENT_SOT.md](docs/AGENT_SOT.md).

---

## Agentų peržiūra prieš merge

- **Kalbos SOT (viešas produktas = anglų):** žr. [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) ir [docs/AGENT_SOT.md](docs/AGENT_SOT.md). Santrauka: viešas UI – **`/en/`**; build generuoja tik **`en/`**; produkcijoje `/lt/*` → redirect į `/en/*`; LT turinys tik `templates/index-lt.html` (authoring).
- **Viešas brand + locale:** viešai tik **Prompt Anatomy**, **EN-only** išsiunčiamuose HTML; jokio „Personalas“ / „Series No. 3“ / LT diakritikų — žr. [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) (*Viešas prekės ženklas ir locale*).
- **Repo (vidinis):** Personalas. Dokumentacijoje nenaudoti **„marketingas“**. LT šablone vengti **„biblioteka“**; EN – vengti **„prompt library“** kaip prekės ženklo.
- **Techninė:** `npm test` privalo praeiti; deploy ir a11y URL – [DEPLOYMENT.md](DEPLOYMENT.md).
- **Greita paieška** (repo šaknyje, išskyrus `node_modules`): `rg -i "personalas|series no|spin-off|promptų|biblioteka|marketingas|prompt.?library"` – viešame UI likučiai turi būti paaiškinti arba pašalinti.
- **Turinio šaltinis:** [templates/index-lt.html](templates/index-lt.html) (authoring → `npm run build` → `en/`), [templates/privacy.html](templates/privacy.html). Šaknies `index.html` / `privacy.html` – EN vartai po build.

---

## 10. UI / CTA sutartys (Design System)

- Po DS v2.0 **neįvesti naujų CTA klasės pavadinimų** — naudoti esamus (`.btn`, `.cta-button`, `.pdf-guide-cta`, `.community-cta-primary`, `.pdf-sticky-cta-btn`, `.form-submit`, `.btn--ghost`).
- CTA dydžiai: `--btn-pad-*` / `--btn-min-h-*` token'ai pritaikyti **tiems patiems** 7 selectoriams (AGENTS.md §10).
- Detaliau: [docs/design_system_v2.md](docs/design_system_v2.md) (kanonas), [docs/design_systemv02.md](docs/design_systemv02.md) (istorija), [docs/LEGACY_GOLDEN_STANDARD.md](docs/LEGACY_GOLDEN_STANDARD.md).

---

## 7. Release seka

1. Orchestrator → Curriculum: release scope (MUST_TODO, roadmap).
2. Orchestrator → Content / UI/UX: reikiai (jei yra).
3. Orchestrator → QA: release validacija.
4. QA: `npm test`, CHANGELOG atnaujintas (SemVer), rankinis QA (naršyklės, mobilus, kopijavimas, a11y).
5. QA pass → tag (pvz. `v1.x.0`), deploy. QA fail → grąžinti Content/UI.

---

## 8. Susiję dokumentai

- [docs/AGENT_SOT.md](docs/AGENT_SOT.md) – **agentų operacinis SOT** (keliai, build, deploy, brand)
- [docs/INDEX.md](docs/INDEX.md) – **dokumentacijos indeksas** (vienas įėjimo taškas į visus doc)
- [.cursorrules](.cursorrules) – projekto taisyklės (saugumas, kokybė, dokumentacija)
- [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) – dokumentų valdymas, atsakomybės, archyvavimas
- [docs/process/development.md](docs/process/development.md) – PR / lokalaus kūrimo procesas
- [docs/security.md](docs/security.md) – npm audit, priklausomybės
- [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) – LT/EN ir prekės ženklo nuoseklumas
- [docs/QA_STANDARTAS.md](docs/QA_STANDARTAS.md) – QA standartas (nuoroda į [DITreneris/spinoff01](https://github.com/DITreneris/spinoff01))
- [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md) – gyvo testavimo scenarijai ir žurnalas
- [DEPLOYMENT.md](DEPLOYMENT.md) – deploy (Vercel, GitHub Pages), post-deploy testavimas
- [CHANGELOG.md](CHANGELOG.md) – versijų pakeitimų istorija (Keep a Changelog)
- [MUST_TODO.md](MUST_TODO.md) – MVP kritinės užduotys
- [MVP_ROADMAP.md](MVP_ROADMAP.md) – roadmap
- [feedback-schema.md](feedback-schema.md) – Feedback Store schema
- [docs/LEGACY_GOLDEN_STANDARD.md](docs/LEGACY_GOLDEN_STANDARD.md) – atskaitos kodas ir taisyklės keičiant turinį

---

## 9. Užduočių seka ir golden standard

Keičiant **turinį** – atsakingas Content Agent; keičiant **struktūrą arba JS** – reikia QA patvirtinimo, kad nepažeidžiamas golden standard (arba [docs/LEGACY_GOLDEN_STANDARD.md](docs/LEGACY_GOLDEN_STANDARD.md) atnaujinamas sąmoningai).

| Etapas | Agentas | Užduotis | Įvestis | Išvestis |
|--------|---------|----------|---------|----------|
| 1 | **Orchestrator** | Prioritizuoja užduotį, nustato scope | Verslo užduotis, MUST_TODO | Užduočių eilė, prioritetai |
| 2 | **Curriculum** | Nustato promptų seką, priklausomybes, mokymosi tikslus | Scope iš Orchestrator | Specifikacija: ką keisti, kokia seka |
| 3 | **Content** | Redaguoja tik turinį (promptai, antraštės, aprašymai, info boksai); **privalo laikytis** [docs/LEGACY_GOLDEN_STANDARD.md](docs/LEGACY_GOLDEN_STANDARD.md) | Specifikacija | Pakeisti tekstai; nekeičia id/klasės/JS |
| 4 | **UI/UX** | Keičia tik išvaizdą/a11y (CSS, ARIA, layout) – ne promptų teksto | Reikalavimai; golden standard struktūra | CSS/HTML pakeitimai, a11y patikros |
| 5 | **QA** | Vykdo `npm test`, pa11y, dokumentacijos atitikimą; prieš merge – diff vs golden standard | Pakeitimų diff, MUST_TODO, docs/DOCUMENTATION.md | Ataskaita: pass / grąžinti Content/UI |

---

**Paskutinis atnaujinimas:** 2026-05-19
