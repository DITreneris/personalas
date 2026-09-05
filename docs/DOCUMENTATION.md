# Dokumentacijos valdymas (DMS)

**Hub:** [INDEX.md](INDEX.md) — tier žemėlapis.  
**Ops kanonas:** [AGENT_SOT.md](AGENT_SOT.md) — keliai, build, deploy, brand (redaguoti čia pirmiausia).

**Paskutinis atnaujinimas:** 2026-07-29

---

## Tieriai (0–3)

| Tier | Paskirtis | Agentų hot-path |
|------|-----------|-----------------|
| **0 – Entry** | Įėjimas: INDEX + AGENT_SOT + šis DMS | Taip — skaityti prieš pakeitimus |
| **1 – Ops** | README, DEPLOYMENT, security, TESTAVIMAS, INTEGRACIJA, CHANGELOG, MUST_TODO (open) | Taip — kai keičiasi deploy / QA / integracija |
| **2 – Design / QA** | design_system_v2, LEGACY, language-guidelines, QA_STANDARTAS, pdf-source README | Taip — UI / turinio / brand darbams |
| **3 – Archive** | `docs/archive/*` (istorija, PR logai, senas CHANGELOG) | **Ne** — tik kai reikia istorijos |

Archive **nėra** agentų karštasis kelias. Naujos taisyklės neįrašomos į archive.

---

## Gyvavimo ciklas (lifecycle)

1. **Create** — naujas doc: pridėti į [INDEX.md](INDEX.md) atitinkamą tierį + ownership lentelę žemiau; root `.md` — `!failas.md` [.gitignore](../.gitignore); `docs/**/*.md` jau leidžiami.
2. **Update** — keisti kanoną (AGENT_SOT / Tier 1–2); atnaujinti ownership „Kada“; jei brand/north-star — žr. sync matrix.
3. **Archive** — perkelti į `docs/archive/`; INDEX Tier 3 + viena nuoroda iš kanono (nepilnas turinys).
4. **Delete** — tik stubai be unikalaus turinio (po merge į kitą doc). Git istorija lieka.

---

## Sync matrix (brand / north star)

Keičiant brand HQ, spoke KPI, locale ar GEO destination hierarchy — **ne** kopijuoti esė į visus failus. Sinchronizuoti trumpas eilutes / checklist:

| Eilė | Failas | Ką atnaujinti |
|------|--------|----------------|
| 1 | [AGENT_SOT.md](AGENT_SOT.md) §1 + §6a | Pilnas kanonas |
| 2 | [language-guidelines-en-lt.md](language-guidelines-en-lt.md) | Locale + brand HQ vs spoke |
| 3 | [../.cursorrules](../.cursorrules) | Tik pointer / viena brand eilutė |
| 4 | [../AGENTS.md](../AGENTS.md) | Merge checklist (nuorodos, ne dublikatai) |
| 5 | [../README.md](../README.md) | GEO faktų santrauka |

---

## Atsakomybės

| Dokumentas | Kas atnaujina | Kada |
|------------|---------------|------|
| [AGENT_SOT.md](AGENT_SOT.md) | Orchestrator | Keliai, build, deploy, brand, mobile §6b, pamokos §10 |
| [INDEX.md](INDEX.md) | Orchestrator | Naujas / archived doc → tier žemėlapis |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Orchestrator | Tieriai, lifecycle, sync matrix, ownership |
| [language-guidelines-en-lt.md](language-guidelines-en-lt.md) | Content / Orchestrator | Locale, viešas brand |
| [../.cursorrules](../.cursorrules) | Orchestrator | Saugumas, a11y, commit; brand = pointer |
| [../AGENTS.md](../AGENTS.md) | Orchestrator | Rolės, workflow, CTA §10, merge checklist |
| [../README.md](../README.md) | Orchestrator / QA | GEO faktų sync |
| [LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md) | QA + UI | Struktūra / DOM / funnel sutartys |
| [design_system_v2.md](design_system_v2.md) | UI | Token / CTA / a11y kanonas |
| [../CHANGELOG.md](../CHANGELOG.md) | Orchestrator / QA | Kiekvienas release (SemVer); senesni → archive |
| [../MUST_TODO.md](../MUST_TODO.md) | Orchestrator | Tik atviri promo / purchase QA |
| [../DEPLOYMENT.md](../DEPLOYMENT.md) | Orchestrator | Env, Vercel, post-deploy |
| [../INTEGRACIJA.md](../INTEGRACIJA.md) | Orchestrator | Integracijos statusas (forma, API, Feedback Store) |
| [security.md](security.md) | QA | npm audit, CSP, static surface, GEO blurb |
| [TESTAVIMAS.md](TESTAVIMAS.md) | QA | Gyvas testavimas + Mobile matrix |
| [QA_STANDARTAS.md](QA_STANDARTAS.md) | QA | Merge / release vartai |
| [pdf-source/README.md](pdf-source/README.md) | Content | PDF export SOP |
| `docs/archive/*` | — | Tik skaitymui; neaktyvus kanonas |

---

## Taisyklės

- Turinio pakeitimai — PR + Content; struktūros / JS — QA peržiūra ([AGENTS.md](../AGENTS.md) §9).
- Viešas brand: **Prompt Anatomy**, EN-only; repo vidinis vardas **Personalas**.
- Brand destination hierarchy → sync matrix (ne vienas failas).
- Aktyvus kanonas — [INDEX.md](INDEX.md) Tier 0–2; istorija — Tier 3 / git.
