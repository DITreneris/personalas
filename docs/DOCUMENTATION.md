# Dokumentacijos valdymas

**Hub:** [INDEX.md](INDEX.md) — kanoninis dokumentų sąrašas.

## Atsakomybės

| Dokumentas | Kas atnaujina | Kada |
|------------|---------------|------|
| [AGENT_SOT.md](AGENT_SOT.md) | Orchestrator | Keliai, build, deploy, brand keičiasi |
| [language-guidelines-en-lt.md](language-guidelines-en-lt.md) | Content / Orchestrator | Locale ar viešas brand |
| [LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md) | QA + UI | Struktūra / DOM / funnel sutartys |
| [design_system_v2.md](design_system_v2.md) | UI | Token / CTA / a11y kanonas |
| [CHANGELOG.md](../CHANGELOG.md) | Orchestrator / QA | Kiekvienas release (SemVer) |
| [MUST_TODO.md](../MUST_TODO.md) | Orchestrator | Promo / Stripe / QA vartai |
| [DEPLOYMENT.md](../DEPLOYMENT.md) | Orchestrator | Env, Vercel, post-deploy |
| [INTEGRACIJA.md](../INTEGRACIJA.md) | Orchestrator | Integracijos statusas (forma, API) |
| [security.md](security.md) | QA | npm audit, CSP |
| [TESTAVIMAS.md](TESTAVIMAS.md) | QA | Gyvas testavimas po deploy |
| [pdf-source/README.md](pdf-source/README.md) | Content | PDF export SOP |

## Taisyklės

- Turinio pakeitimai — PR + Content; struktūros / JS — QA peržiūra ([AGENTS.md](../AGENTS.md) §9).
- Viešas brand: **Prompt Anatomy**, EN-only; repo vidinis vardas **Personalas**.
- Archyvavimas: pasenusios audit ataskaitos — git istorijoje; aktyvus kanonas — [INDEX.md](INDEX.md).
