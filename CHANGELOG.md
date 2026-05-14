# Changelog

Visi reikšmingi pakeitimai projekte dokumentuojami čia. Formatas pagal [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versijavimas – [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pridėta

- **Puslapis ([index.html](index.html)):** sekcija „Dažniausi klausimai prieš startą“ (HR / atranka, `<dl>`), navigacija „Kas toliau?“ su vidinėmis nuorodomis į `#block1`–`#block10`; mobilūs stiliai `.faq` / `.jump-nav`.
- **Instrukcijos:** paminėtas **Gemini** kartu su ChatGPT ir Claude (LT + EN per [scripts/build-locale-pages.js](scripts/build-locale-pages.js)).
- **Testai:** [tests/structure.test.js](tests/structure.test.js) tikrina, kad bendruomenės nuoroda būtų `t.me/prompt_anatomy`.
- **Dokumentacija:** `docs/INDEX.md` (hub), `docs/process/development.md`, `docs/security.md`, `docs/language-guidelines-en-lt.md` (įskaitant CSS brendo sluoksnius); nuorodos iš [README.md](README.md) ir [AGENTS.md](AGENTS.md).
- **CI:** `pa11y` papildomai tikrina `/lt/`, `/en/` ir lokalių privatumo puslapių URL.
- **Testai:** `lint:html:locales` – HTML validacija `lt/` ir `en/` puslapiams po build.
- **US localization (PR #2, `en-US`):** ataskaita [docs/us-localization-report.md](docs/us-localization-report.md); anglų generuota patirtis su JAV formatais (žr. žemiau „Changed / Tests“ anglišku santraukos stiliumi).

### Pakeista

- **Bendruomenė:** vietoje WhatsApp naudojama Prompt Anatomy **Telegram** kanalas [t.me/prompt_anatomy](https://t.me/prompt_anatomy); atnaujinti matomi tekstai, `aria-label` ir EN build poros [scripts/build-locale-pages.js](scripts/build-locale-pages.js).
- **Vizualinė sinchronizacija su Prompt Anatomy:** [index.html](index.html) – motinos brendo kintamieji (`--brand-prompt-anatomy*`), ekosistemos tretinė spalva (PA `frontend/src/index.css` `--color-ecosystem-1`), Prompt Anatomy nuorodų ir hero ženkliuko akcentai; [favicon.svg](favicon.svg) sutapatintas su [DITreneris/promptanatomy](https://github.com/DITreneris/promptanatomy) šaknies `favicon.svg`.
- **Dokumentacija:** [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) – greita schema ir inventorius papildyti naujais doc failais.
- **Privatumas (tik turinys, ne CSS):** [privatumas.html](privatumas.html) ir EN build (`PRIVACY_EN` [scripts/build-locale-pages.js](scripts/build-locale-pages.js)) – produktas „Personalas“, HR kontekstas.
- **Dokumentacija:** `INTEGRACIJA.md` (rezervuota kontaktų formai / GAS), README pastaba apie npm `name` ir produkto pavadinimą, `google-apps-script.js` antraštė – neprivaloma statinei svetainei.
- **US hiring EN (`en-US`):** Phase 5 contact-format guidance; Phase 4 geographic localization; `lang="en-US"` ir `hreflang="en-US"` su išsaugotu `/en/` maršrutu; JAV pavyzdžiai (adresai, datos, telefonai, atlygis); runtime normalizacija į `en-US` (žr. PR #2 santrauką angliškai žemiau).

### Pataisyta

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
- README and package metadata for the US-localized HR hiring prompt library.

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
