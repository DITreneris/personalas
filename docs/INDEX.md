# Dokumentacijos indeksas – Personalas

| Dokumentas | Paskirtis |
|------------|-----------|
| [AGENT_SOT.md](AGENT_SOT.md) | **Agentų operacinis SOT** — keliai, build, deploy, brand |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Dokumentų valdymas ir atsakomybės |
| [process/development.md](process/development.md) | PR ir lokalaus kūrimo procesas |
| [security.md](security.md) | npm audit, priklausomybės |
| [language-guidelines-en-lt.md](language-guidelines-en-lt.md) | LT authoring / EN viešas produktas; viešas brand **Prompt Anatomy**, vidinis repo **Personalas** |
| [QA_STANDARTAS.md](QA_STANDARTAS.md) | QA standartas |
| [TESTAVIMAS.md](TESTAVIMAS.md) | Gyvas testavimas po deploy |
| [LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md) | Golden standard: DOM, PDF-first seka, DS sutartys, QA (ne tik turinys) |
| [design_systemv02.md](design_systemv02.md) | Design System v0.2 įgyvendinimo planas (tokenai, PR seka, QA) |

## Aktyvus PDF authoring

- [pdf-source/README.md](pdf-source/README.md) — HTML šaltinis, eksporto SOP, prekės ženklo taisyklės (`www.promptanatomy.app` footer; `promptanatomy.help` viršuje / apačioje).
- [pdf-source/beginner-personalas-hr.html](pdf-source/beginner-personalas-hr.html) — **16 psl.** Beginner guide (EN).
- [pdf-source/advanced-personalas-hr.html](pdf-source/advanced-personalas-hr.html) — **32 psl.** Advanced guide (EN).
- [../config/sot.json](../config/sot.json) — PDF kortelių TOC ir buyer FAQ.
- Build: [../scripts/build-locale-pages.js](../scripts/build-locale-pages.js). Runtime PDF UI: [../generator.js](../generator.js).

Šaknis: [README.md](../README.md), [AGENTS.md](../AGENTS.md), [DEPLOYMENT.md](../DEPLOYMENT.md), [CHANGELOG.md](../CHANGELOG.md). Papildomai šaknyje: [MUST_TODO.md](../MUST_TODO.md), [MVP_ROADMAP.md](../MVP_ROADMAP.md), [INTEGRACIJA.md](../INTEGRACIJA.md), [feedback-schema.md](../feedback-schema.md).

Pasenusios UX/UI auditų ataskaitos laikomos git istorijoje; repozitorijoje palaikomas tik šis kanoninis sąrašas ir [CHANGELOG.md](../CHANGELOG.md).
