# Agentų Sistemos Modelis – Apžvalga

**Projektas:** Personalas  
**Šio dokumento kalba:** LT (agentų aprašymas). **Viešas produktas:** EN-only (`/en/`).

**Ops SOT (keliai, build, deploy, brand):** [docs/AGENT_SOT.md](docs/AGENT_SOT.md) — skaityti prieš pakeitimus.  
**Kalba / brand:** [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md).  
**Doc hub:** [docs/INDEX.md](docs/INDEX.md) · DMS: [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md).

---

## 1. Architektūra

```
ORCHESTRATOR AGENT (koordinacija)
 ├── Content Agent      (promptai, tekstai)
 ├── Curriculum Agent   (struktūra, logika, seka)
 ├── UI/UX Agent        (dizainas, a11y, UX)
 ├── QA Agent           (kodas + turinys)
 └── Feedback Store     (duomenys, metrikos — rezervuota)
            │
            └── GitHub / Version Control
```

---

## 2. Agentų rolės

### Content Agent
- **Tikslas:** Teksto turinys (promptai, aprašymai)
- **Įvestis:** Specifikacija, Curriculum, grįžtamasis ryšys
- **Išvestis:** Turinio redagavimai; po pakeitimų – `npm run build`
- **Kalba:** viešas kanonas EN (`/en/`); LT authoring – language-guidelines

### Curriculum Agent
- **Tikslas:** Turinio struktūra ir mokymosi logika
- **Įvestis:** Tikslai, auditorija, [MUST_TODO.md](MUST_TODO.md), [docs/AGENT_SOT.md](docs/AGENT_SOT.md)
- **Išvestis:** Promptų seka, priklausomybių modelis

### UI/UX & Usability Agent
- **Tikslas:** Sąsaja, a11y, UX
- **Įvestis:** .cursorrules, WCAG AA, [docs/LEGACY_GOLDEN_STANDARD.md](docs/LEGACY_GOLDEN_STANDARD.md)
- **Išvestis:** CSS/HTML, a11y; ne promptų tekstas
- **Mobile:** sticky clearance, safe-area, `dvh`, `--btn-min-h-sm: 48px` — [docs/AGENT_SOT.md](docs/AGENT_SOT.md) §6b

### QA Agent
- **Tikslas:** Kokybė (kodas + turinys + doc)
- **Įvestis:** Diff, MUST_TODO, [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md), [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)
- **Išvestis:** Pass / grąžinti; prieš release – CHANGELOG + SemVer

### Orchestrator Agent
- **Tikslas:** Koordinacija, prioritetai
- **Įvestis:** Verslo užduotys; Feedback Store (kai bus – [INTEGRACIJA.md](INTEGRACIJA.md))
- **Išvestis:** Užduočių eilė
- **Brand north star:** spoke (PDF) neužkasa kelių į `promptanatomy.app` — [docs/AGENT_SOT.md](docs/AGENT_SOT.md) §1

---

## 3. Workflow

1. Verslas → Orchestrator  
2. Orchestrator → Curriculum → specifikacija  
3. Content → UI/UX (lygiagrečiai, jei leidžia priklausomybės)  
4. QA validacija → fail = taisyti; pass = PR  

**Loop:** Planavimas → Kūrimas → Validacija → Release → metrikos → nauji prioritetai.

---

## 4. Commit prefiksai

`[Content]` · `[Curriculum]` · `[UI]` · `[QA]` · `[Orchestrator]`

---

## 5. Komandos ir PR

| Komanda | Paskirtis |
|---------|-----------|
| `npm install` | Priklausomybės |
| `npm run build` | → `en/*`, vartai, sitemap |
| `npm test` | Merge gate — [docs/AGENT_SOT.md](docs/AGENT_SOT.md) §3 |
| `npm run lint:html` / `lint:js` | HTML / ESLint |
| CI | `npm test` + pa11y |

**PR procesas:**

1. Šaka nuo `main` → pakeitimai → `npm test`
2. **Turinys:** redaguoti [`templates/index-lt.html`](templates/index-lt.html) ir [`templates/privacy.html`](templates/privacy.html) — ne ranka generuotų `en/*` / šaknies vartų
3. Viešas kanonas `/en/`; `/lt/*` → redirect — AGENT_SOT + language-guidelines
4. PR aprašas: kas / kodėl; nuoroda į doc, jei keičiami procesai
5. Merge po žalios CI (+ peržiūra, jei taikoma)

PDF: `pdf:validate`, `pdf:export`, `pdf:covers` — AGENT_SOT.

---

## 6. Agentų peržiūra prieš merge

- Locale / brand / GEO north star — [docs/AGENT_SOT.md](docs/AGENT_SOT.md), [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) (ne dubliuoti čia)
- `Organization.url`, community, footer, `llms.txt` Training hub → **`promptanatomy.app`**; local KPI = PDF
- Repo vidinis vardas Personalas; viešai tik Prompt Anatomy
- `npm test`; mobile sticky — [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md) Mobile matrix
- Greita paieška: `rg -i "personalas|series no|spin-off|promptų|biblioteka|marketingas|prompt.?library"` ant viešų HTML
- Šaltinis: `templates/index-lt.html`, `templates/privacy.html`
- Stripe receipts: Public details support email = `info@promptanatomy.app` (Dashboard; own-account API blocked) — [docs/AGENT_SOT.md](docs/AGENT_SOT.md) §5 + §10

---

## 7. UI / CTA sutartys (Design System)

- Po DS v2.0 **neįvesti naujų CTA klasių** — `.btn`, `.cta-button`, `.pdf-guide-cta`, `.community-cta-primary`, `.pdf-sticky-cta-btn`, `.form-submit`, `.btn--ghost`
- Dydžiai: `--btn-pad-*` / `--btn-min-h-*` ant tų pačių 7 selector'ių; **`--btn-min-h-sm` = 48px**
- Sticky → `body.has-pdf-sticky-cta` + `--pdf-sticky-offset`
- Kanonas: [docs/design_system_v2.md](docs/design_system_v2.md) · sutartys: [docs/LEGACY_GOLDEN_STANDARD.md](docs/LEGACY_GOLDEN_STANDARD.md) · istorija: [docs/archive/design_systemv02.md](docs/archive/design_systemv02.md)

---

## 8. Release seka

1. Orchestrator → scope ([MUST_TODO.md](MUST_TODO.md))
2. Content / UI pagal poreikį
3. QA: `npm test`, CHANGELOG, rankinis QA
4. Pass → tag / deploy; fail → taisyti

---

## 9. Užduočių seka ir golden standard

Keičiant **turinį** — Content; **struktūrą / JS** — QA vs [docs/LEGACY_GOLDEN_STANDARD.md](docs/LEGACY_GOLDEN_STANDARD.md).

| Etapas | Agentas | Užduotis | Įvestis | Išvestis |
|--------|---------|----------|---------|----------|
| 1 | Orchestrator | Scope | Verslas, MUST_TODO | Prioritetai |
| 2 | Curriculum | Seka / priklausomybės | Scope | Specifikacija |
| 3 | Content | Tekstai; laikytis LEGACY (id/klasės/JS) | Spec | Tekstai |
| 4 | UI/UX | CSS / a11y / layout | Reikalavimai | UI pakeitimai |
| 5 | QA | `npm test`, pa11y, doc | Diff, DOCUMENTATION | Pass / grąžinti |

---

**Visų doc sąrašas:** [docs/INDEX.md](docs/INDEX.md).

**Paskutinis atnaujinimas:** 2026-07-29
