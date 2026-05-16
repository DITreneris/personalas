# Changelog

Visi reikšmingi pakeitimai projekte dokumentuojami čia. Formatas pagal [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versijavimas – [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pridėta

- **Mokami PDF vadovai (teacher-parity):** [docs/pdf-source/](docs/pdf-source/) — Beginner 12 psl. ir Advanced 24 psl. HTML (`beginner-personalas-hr.html`, `advanced-personalas-hr.html`, `pdf-print.css`); eksportas — [docs/pdf-source/README.md](docs/pdf-source/README.md), `npm run pdf:export`, `npm run pdf:covers:preview`. Prekės ženklas: footer `www.promptanatomy.app` kiekviename puslapyje; `promptanatomy.help` viršuje ir uždarymo puslapyje. [config/sot.json](config/sot.json) — TOC ir buyer FAQ; [generator.js](generator.js) — preview lightbox ir FAQ. Landing [templates/index-lt.html](templates/index-lt.html) — pilna PDF pirkėjo sekcija (covers, specs, trust, Personal license, compare strip, testimonials, author panel). [assets/pdf-covers/](assets/pdf-covers/) — viršeliai ir PREVIEW puslapiai 2–4.
- **EN-only svetainė + mokami PDF (Stripe):** šaknies vartai, build’as ir testai dabar veikia tik su anglų kalba; sukurta Vercel serverless `api/` infrastruktūra Stripe webhook’ui ([api/stripe-webhook.js](api/stripe-webhook.js)), pasirašytoms download nuorodoms ([api/download.js](api/download.js)), in-page poll endpoint’ui ([api/download-link.js](api/download-link.js)) ir bendrai fulfillment logikai ([api/_lib/fulfillment.js](api/_lib/fulfillment.js); produktai – Beginner $5.99 / Advanced $11.99). Naujas [success.html](success.html) (poll į `/api/download-link`) ir [terms.html](terms.html) (paid PDF licencija, refundai). Pridėtos `dependencies`: `stripe`, `@upstash/redis`, `resend`. Aprašyta [DEPLOYMENT.md](DEPLOYMENT.md) sekcijoje „Paid PDF environment variables“.
- **PDF CTA EN landing’e:** [templates/index-lt.html](templates/index-lt.html) – nauja `pdf-guides` sekcija prieš community su Beginner ($5.99 / buvo $15.99) ir Advanced ($11.99 / buvo $22.99) mygtukais bei nuoroda į `terms.html#paid-pdf-license`.
- **Stripe MVP checklist ir env template:** [MUST_TODO.md](MUST_TODO.md) išplėstas išsamiu mokamų PDF sąrašu (Stripe Dashboard, repo darbas, Vercel env, QA prieš release); naujas [.env.example](.env.example) – versijuojamas šablonas su visais privalomais kintamaisiais (Stripe, `DOWNLOAD_TOKEN_SECRET`, Resend, Upstash, `SITE_URL`, `PDF_*_SOURCE_URL`, opcionalūs TTL), be realių verčių. `.env` ir `.env.local` lieka gitignore’uoti ([.gitignore](.gitignore)).
- **Dokumentacija – kalbos SOT:** [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) sekcija *Source of truth (SOT)* – viešas frontend, deploy numatytasis kelias, SEO ir OG anglų kalba; nuorodos iš [AGENTS.md](AGENTS.md), [.cursorrules](.cursorrules), [DEPLOYMENT.md](DEPLOYMENT.md), [docs/INDEX.md](docs/INDEX.md).
- **Minimali doc struktūra:** [MUST_TODO.md](MUST_TODO.md), [MVP_ROADMAP.md](MVP_ROADMAP.md), [feedback-schema.md](feedback-schema.md), [docs/INDEX.md](docs/INDEX.md) ir susiję stub dokumentai (procesas, saugumas, LT/EN gairės, QA, testavimas, golden standard).
- **SEO / social / indeksavimas:** absoliutūs `canonical` ir `hreflang` LT/EN puslapiuose, `meta description`, Open Graph ir Twitter kortelės, [images/og-default.png](images/og-default.png) (1200×630), `robots.txt` ir `sitemap.xml` generuojami build metu; JSON-LD (`WebSite`, `Organization` / `WebPage` privatumui); pasirinktinis URL keitimas – [scripts/patch-published-base.js](scripts/patch-published-base.js) (`PATCH_FROM_PREFIX` / `PUBLISHED_SITE_BASE`).
- **Įrankiai:** `npm run generate:og` ([scripts/generate-og-image.js](scripts/generate-og-image.js), priklausomybė `sharp`).
- **DUK ([index.html](index.html)):** suskleidžiama sekcija (`<details>` / `<summary>`), `lang="lt"` šaltinyje; EN versija generuojama [scripts/build-locale-pages.js](scripts/build-locale-pages.js); patobulinti `.faq-*` stiliai (rodyklė, hover, fokusas).
- **Navigacija „Kas toliau?“:** vidinės nuorodos į `#block1`–`#block10`; mobilūs stiliai `.jump-nav`.
- **Instrukcijos:** paminėtas **Gemini** kartu su ChatGPT ir Claude (LT + EN per [scripts/build-locale-pages.js](scripts/build-locale-pages.js)).
- **Testai:** [tests/structure.test.js](tests/structure.test.js) tikrina, kad bendruomenės nuoroda būtų `t.me/prompt_anatomy`.
- **Dokumentacija:** nuorodos į `docs/` iš [README.md](README.md) ir [AGENTS.md](AGENTS.md) (žr. [docs/INDEX.md](docs/INDEX.md)).
- **CI:** `pa11y` papildomai tikrina `/lt/`, `/en/` ir lokalių privatumo puslapių URL.
- **Testai:** `lint:html:locales` – HTML validacija `lt/` ir `en/` puslapiams po build.
- **US localization (PR #2, `en-US`):** anglų generuota patirtis su JAV formatais (žr. [tests/structure.test.js](tests/structure.test.js) ir `en/index.html` po build).
- **[Orchestrator] Numatytoji lankytojo kalba EN:** šaknies `/` ir `/privatumas.html` – EN vartai (į `en/`); pilnas LT turinys – [templates/index-lt.html](templates/index-lt.html) ir [templates/privatumas-lt.html](templates/privatumas-lt.html); [scripts/build-locale-pages.js](scripts/build-locale-pages.js) skaito šablonus; SEO kanonas ir `x-default` – `/en/`; [vercel.json](vercel.json) – papildomas redirect `/` → `/en/`; dokumentacija ([README.md](README.md), [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md), [AGENTS.md](AGENTS.md), [docs/process/development.md](docs/process/development.md)).

### Pakeista

- **EN-only build pipeline:** [scripts/build-locale-pages.js](scripts/build-locale-pages.js) nebegeneruoja `lt/*` puslapių; pašalinti `hreflang="lt"`, `og:locale:alternate`, `inLanguage: 'lt'` įrašai; sitemap turi tik `/`, `/en/`, `/en/privatumas.html`, `/privatumas.html`, `/terms.html`, `/success.html`. [vercel.json](vercel.json) – nauji 308 redirect’ai `/lt`, `/lt/`, `/lt/privatumas.html` → atitinkami `/en/*`, security headers (`X-Frame-Options`, `Referrer-Policy`, `HSTS`, `COOP`, `CORP`) ir `/api/(.*) Cache-Control: private, no-store`. Tests, CI (`pa11y`) ir `lint:html:locales` perorientuoti į EN tik (`success.html` ir `terms.html` papildomai validuojami `lint:html:static`). [.eslintrc.json](.eslintrc.json) gauna `api/**/*.js` Node override.
- **Dokumentacija (lean repo):** pašalinti pasenę auditų / UX ataskaitų failai (`docs/*AUDIT*`, `MOBILE_UX*`, `LOW_HANGING*`, `UI_PREMIUM*`, `PEDAGOGINES*`, `TURINIO_*`, `us-localization-report.md`), šaknies ataskaitos (`LT_EN_UI_UX_REPORT.md`, `DEPLOY_PREP_REPORT.md`, `KODO_BAZES_ANALIZE.md`, `VARIANTU_PALYGINIMAS.md`, `STYLEGUIDE.md`) ir `docs/archive/` dublikatai; kanoninis doc sąrašas – [docs/INDEX.md](docs/INDEX.md).
- **`/lt/` QA ir JAV EN kanonas:** [templates/index-lt.html](templates/index-lt.html) – vietoje LT/EN perjungiklio viena nuoroda „JAV svetainė (EN)“ (`lt-only-qa-nav`); [scripts/build-locale-pages.js](scripts/build-locale-pages.js) – `stripLanguageSwitcher()` pašalina šį bloką (ir bet kokį seną `lang-switcher`) iš `en/index.html`; [generator.js](generator.js) – pašalinta kalbos perjungiklio logika; atnaujinti [tests/structure.test.js](tests/structure.test.js), [docs/TESTAVIMAS.md](docs/TESTAVIMAS.md), [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md), [README.md](README.md).
- **[UI] Vizualinė tema – navy + auksas (PA ekosistema):** hero gradientas, `--accent-primary`, CTA ir „community“ tokenai perorientuoti į Prompt Anatomy navy paletę (`#0b1320`/`#103b5a`/`#1f5e88`), `--accent-gold` grąžintas į tikrą auksą (`#cfa73a`) ir naudojamas tik dekoratyviems akcentams (fokuso kontūrai, progress bar, aktyvios fazės taškas); `.number` ir `.phase-badge` foną perkelta į navy, kad baltas 12 px tekstas atitiktų WCAG AA; `.header-phase-link.is-active` – baltas piliulis su navy tekstu; visi hardcoded `rgba(14, 122, 51, …)` šešėliai/rėmeliai pakeisti į `rgba(16, 59, 90, …)`; `--orange-light` ir hero CTA hover fonas – šaltai šviesūs (`#EEF2F7`); [assets/styles.css](assets/styles.css), [templates/index-lt.html](templates/index-lt.html), [templates/privatumas-lt.html](templates/privatumas-lt.html); `lt/` ir `en/` atnaujinami `npm run build`.
- **[UI] OG paveikslėlis:** [scripts/generate-og-image.js](scripts/generate-og-image.js) – navy gradientas + auksinis akcento brūkšnys, EN canonical žinutė („HR hiring system / AI prompts for US teams“); [images/og-default.png](images/og-default.png) pergeneruotas (`npm run generate:og`).
- **Design system:** bendri tokenai ir primitivai – [assets/styles.css](assets/styles.css) (`.page-shell`, `.surface-card`, `.btn`); [templates/index-lt.html](templates/index-lt.html) ir [templates/privatumas-lt.html](templates/privatumas-lt.html) naudoja shared stylesheet; build keičia kelią į `../assets/styles.css` locale puslapiuose.
- **EN kanonas be viešo LT UI:** [scripts/build-locale-pages.js](scripts/build-locale-pages.js) – `stripLanguageSwitcher()` pašalina `lt-only-qa-nav` ir seną `lang-switcher` iš generuoto `en/index.html`; šaknies [index.html](index.html) ir [privatumas.html](privatumas.html) vartai – tik EN nuorodos body; [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md), [README.md](README.md), [AGENTS.md](AGENTS.md), [docs/process/development.md](docs/process/development.md); LT privatumas – „nerenkame“ ([templates/privatumas-lt.html](templates/privatumas-lt.html)); [tests/structure.test.js](tests/structure.test.js) – regresijos EN/LT navigacijai ir vartams.
- **[UI] Instrukcijų blokas ([index.html](index.html), [scripts/build-locale-pages.js](scripts/build-locale-pages.js)):** tylesni „token“ stiliai `.instructions code`, kompaktiškesnis laiko ženklelis, antraštės eilutė su meta dešinėje, mažesnis tarpas iki DUK, 4 žingsnis su vidiniu `instructions-subcard` (LT šaltinyje + EN per `EN_REPLACEMENTS`); [tests/structure.test.js](tests/structure.test.js) – lankstesni JAV formato assertai.
- **LT turinys ([index.html](index.html)):** pilnas DUK lietuvių kalba ir `lang="lt"`; instrukcijos suvienodintos į „jūs“; progreso eilutė „Sistema: … iš 6 fazių“; šuolių meniu įvadas (dalyvis + „pereisite“); 5-o prompto antraštė „Kaip geriau vesti pokalbį?“; Telegram CTA „Sekite Telegram kanale“ ir aiškesnis `aria-label` (kanalas).
- **EN build ir runtime ([scripts/build-locale-pages.js](scripts/build-locale-pages.js), [generator.js](generator.js)):** visi atitinkami LT→EN `EN_REPLACEMENTS`; matomas progresas EN „System: … of 6 phases“; JSON-LD `Organization.name` – **Prompt Anatomy**; `PRIVACY_EN` – Series No. 3, H1 „Privacy Policy“; master `PROMPTS_EN` – natūralesnė „first three months“ formulė; darbo skelbimo info – „commas as thousands separators“; neutralus „Join on Telegram“; prekės ženklo rašyba nuorodose (po bendro vertimo).
- **Testai:** [tests/structure.test.js](tests/structure.test.js) – regresija: `lt/index.html` neturi angliškos DUK antraštės `Common questions before you start`.

- **Kopijavimas, kodų blokai ir kalbos perjungiklis (UX / a11y):** [generator.js](generator.js) – `activateCodeBlock`: pelės paspaudimas ant `.code-block` atitinka klaviatūrą (žymėjimas + kopijavimas į mainų atmintinę po 300 ms); `copyPromptInternal` ir atskiras debounce tik footerio `copyPrompt` (nebenaudojamas bendras laikmatis su žymejimu, todėl kopija iš bloko nebėra atšaukiama); antraštės fazės mygtukas su `aria-current`; atidarant `#phase1`–`#phase6` iš URL, sinchronizuojama antraštės aktyvi fazė; dabartinė kalba perjungiklyje `disabled`, `aria-current` ir aiškesnis `aria-label` („… (dabartinė)“ / „… (current)“). [index.html](index.html) – kopijavimo mygtukai su `type="button"`; `.header-phase-link` `min-height: 44px` (liesimo taikinys); `.lang-btn:disabled` stiliai. `lt/index.html` ir `en/index.html` atnaujinami `npm run build`.

- **Hero subline (LT + EN):** ryšys su Promptų anatomijos ekosistema ir pagalbinė / „helper“ pozicija (`promptanatomy.help`); [index.html](index.html), [scripts/build-locale-pages.js](scripts/build-locale-pages.js); `lt/index.html` ir `en/index.html` atnaujinami `npm run build`.
- **Žodynas ir prekės ženklas:** kanonas **Personalas**; pašalinta „biblioteka“ / „marketingas“ / senas npm pavadinimas iš turinio ir deploy doc; LT „promptų rinkinys“, EN – „hiring prompts“ (be „prompt library“ kaip etiketės); [AGENTS.md](AGENTS.md) – sekcija „Agentų peržiūra prieš merge“.
- **Build / deploy:** [generator.js](generator.js), [google-apps-script.js](google-apps-script.js), workflow komentarai; šaknies `window.BASE_PATH` injekcija, kai `BASE_PATH` nustatytas ([scripts/build-locale-pages.js](scripts/build-locale-pages.js)); [vercel.json](vercel.json) – build komanda `npm test`; [DEPLOYMENT.md](DEPLOYMENT.md) – Vercel vs Pages, pa11y URL kaip CI.
- **Repo:** [.gitignore](.gitignore) – `package-lock.json` versijuojamas, markdown išimtys (`AGENTS.md`, `MUST_TODO.md`, `MVP_ROADMAP.md`, `feedback-schema.md`), `docs/` katalogas nebeignoruojamas; npm paketo vardas `personalas` ([package.json](package.json)).
- **HTML lint:** [package.json](package.json) – numatytai [html5.validator.nu](https://html5.validator.nu/) (W3C 403 aplinkoje).
- **Build ([scripts/build-locale-pages.js](scripts/build-locale-pages.js)):** `SITE_ORIGIN` ir `BASE_PATH` absoliučiam baziniam URL; šaknies `index.html` / `privatumas.html` SEO užbaigiama po locale generavimo; `stripIndexForLocaleBuild` / `stripPrivacyForLocaleBuild` idempotentiškam pakartotiniam build; DUK ir kiti LT→EN tekstai valdomi per `EN_REPLACEMENTS`.
- **CI / deploy:** [.github/workflows/ci.yml](.github/workflows/ci.yml) ir [.github/workflows/deploy.yml](.github/workflows/deploy.yml) – `SITE_ORIGIN` ir `BASE_PATH` `npm test` / `npm run build` (GitHub Pages subkeliui).
- **Testai:** [tests/structure.test.js](tests/structure.test.js) – HTTPS canonical, OG, `robots.txt` / `sitemap.xml`; [package.json](package.json) – `lint:html:privatumas`, `repository` laukas, `html-validator-cli` grandinėje.
- **Dokumentacija:** [README.md](README.md), [DEPLOYMENT.md](DEPLOYMENT.md) – GitHub Pages (repo **personalas**), Vercel ir SEO pastabos.
- **Deploy:** numatytoji vieša bazė SEO build – `https://promptanatomy.help` (Vercel); [vercel.json](vercel.json); GitHub Pages lieka per `SITE_ORIGIN` + `BASE_PATH` CI; pašalintas perteklinis patch žingsnis iš [deploy.yml](.github/workflows/deploy.yml); [scripts/patch-published-base.js](scripts/patch-published-base.js) naudoja `PATCH_FROM_PREFIX` / `PUBLISHED_SITE_BASE`.
- **Bendruomenė:** vietoje WhatsApp naudojama Prompt Anatomy **Telegram** kanalas [t.me/prompt_anatomy](https://t.me/prompt_anatomy); atnaujinti matomi tekstai, `aria-label` ir EN build poros [scripts/build-locale-pages.js](scripts/build-locale-pages.js).
- **Vizualinė sinchronizacija su Prompt Anatomy:** [index.html](index.html) – motinos brendo kintamieji (`--brand-prompt-anatomy*`), ekosistemos tretinė spalva (PA `frontend/src/index.css` `--color-ecosystem-1`), Prompt Anatomy nuorodų ir hero ženkliuko akcentai; [favicon.svg](favicon.svg) sutapatintas su [DITreneris/promptanatomy](https://github.com/DITreneris/promptanatomy) šaknies `favicon.svg`.
- **Dokumentacija:** [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) – greita schema ir inventorius papildyti naujais doc failais.
- **Privatumas (tik turinys, ne CSS):** [privatumas.html](privatumas.html) ir EN build (`PRIVACY_EN` [scripts/build-locale-pages.js](scripts/build-locale-pages.js)) – produktas „Personalas“, HR kontekstas.
- **Dokumentacija:** `INTEGRACIJA.md` (rezervuota kontaktų formai / GAS), `google-apps-script.js` – neprivaloma statinei svetainei.
- **US hiring EN (`en-US`):** Phase 5 contact-format guidance; Phase 4 geographic localization; `lang="en-US"` ir `hreflang="en-US"` su išsaugotu `/en/` maršrutu; JAV pavyzdžiai (adresai, datos, telefonai, atlygis); runtime normalizacija į `en-US` (žr. PR #2 santrauką angliškai žemiau).

### Pataisyta

- **HTML5:** šaknies vartų `meta http-equiv="refresh"` – `content` reikšmėje tarpas po kabliataškio (`0; url=…`), kad atitiktų validatorių ([scripts/build-locale-pages.js](scripts/build-locale-pages.js)).

- **GitHub Actions (CI ir Pages build):** [ci.yml](.github/workflows/ci.yml) ir [deploy.yml](.github/workflows/deploy.yml) – `actions/checkout@v5`, `actions/setup-node@v5` (veiksmų Node 24 runtime, be ankstesnių Node 20 veiksmų deprekacijos įspėjimų); `nick-fields/retry@v4`; `npm test` – iki **5** bandymų su **40** s laukimu tarp bandymų (`html5.validator.nu` tinklo trikdžiai); projektinis Node **22**; `timeout-minutes: 20`. Po pakeitimų **lint-and-test** ir **Deploy to GitHub Pages** darbai praeina sėkmingai.

- **GitHub Pages:** prieš `upload-pages-artifact` deploy job šalina `node_modules`, kad artefakte liktų tik statiniai failai.
- **Deploy workflow:** `test` job nebekartoja `npm run build` prieš `npm test` (build jau įeina į `npm test`).

### US PR #2 summary (English, kept for release notes)

**Added**

- Changelog tracking; JAV lokalizacijos detalėms žr. [tests/structure.test.js](tests/structure.test.js) ir šį changelog.

**Changed**

- Phase 5 contact-format guidance (Street Address, City, State, Zip Code, `+1 (XXX) XXX-XXXX`).
- Phase 4 geographic localization with US city/state examples, optional Zip Code, `Remote – US` guidance.
- English hiring workflow copy, phase labels, prompt examples, and privacy copy for US HR teams.
- US-format examples for locations, addresses, dates, phone numbers, and compensation.
- Runtime locale handling: English-like page language values normalize to `en-US`.
- README and package metadata for the US-localized HR hiring prompts site.

**Tests**

- Phase 5 contact-format regression checks.
- Phase 4 geographic regression checks.
- Structure tests for US locale metadata, US examples, dollar/date/phone/Zip Code terminology, and absence of obvious non-US or Lithuanian fragments in generated English UI.

---

## [1.0.0] - 2026-03-09

### Pridėta

- GitHub Pages deploy: `.github/workflows/deploy.yml` – push į `main` → test job → deploy su `BASE_PATH=/${{ github.event.repository.name }}/`.
- LT/EN lokalių puslapių build: `scripts/build-locale-pages.js` generuoja `lt/`, `en/` su canonical, hreflang, EN tekstų pakeitimais.
- Struktūriniai testai lt/en: `tests/structure.test.js` tikrina lt/index.html, en/index.html egzistavimą, `lang`, canonical/hreflang, 10 promptų, EN stringus.

### Pakeista

- **Build script:** canonical ir hreflang nuorodos lokaliai (kai `BASE_PATH` tuščias) naudoja `BASE_FOR_LINKS = BASE_PATH || '/'`, kad `/lt/`, `/en/` būtų teisingi vietinėje aplinkoje.
- **package.json:** `devDependencies` indentas sutvarkytas (`serve` eilutė).

### Nereleisuota

- (Tuščia – nauji pakeitimai įrašomi čia prieš release.)

---

[1.0.0]: https://github.com/DITreneris/personalas/releases/tag/v1.0.0
