# Changelog

Visi reikšmingi pakeitimai projekte dokumentuojami čia. Formatas pagal [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versijavimas – [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pridėta

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
- **US localization (PR #2, `en-US`):** ataskaita [docs/us-localization-report.md](docs/us-localization-report.md); anglų generuota patirtis su JAV formatais (žr. žemiau „Changed / Tests“ anglišku santraukos stiliumi).

### Pakeista

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

- **GitHub Actions:** `deploy.yml` ir `ci.yml` – Node **22** (Actions Node 20 deprecation); `npm test` su **3 bandymais** (`nick-fields/retry@v3`), kad sumažinti `html5.validator.nu` tinklo trikdžių riziką; test job `timeout-minutes` padidintas iki **20**.

- **GitHub Pages:** prieš `upload-pages-artifact` deploy job šalina `node_modules`, kad artefakte liktų tik statiniai failai.
- **Deploy workflow:** `test` job nebekartoja `npm run build` prieš `npm test` (build jau įeina į `npm test`).

### US PR #2 summary (English, kept for release notes)

**Added**

- Changelog tracking and USA localization report (`docs/us-localization-report.md`).

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
