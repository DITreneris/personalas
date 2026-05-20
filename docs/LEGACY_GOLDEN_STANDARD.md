# Golden standard (legacy atskaita)

**Paskirtis:** Vienas operacinis sąrašas — ką **ne laužyti** keičiant turinį, CSS arba build. Detalus DS implementacijos planas — [design_systemv02.md](design_systemv02.md). Keliai, deploy, brand — [AGENT_SOT.md](AGENT_SOT.md). Agentų seka — [AGENTS.md](../AGENTS.md) §9.

**Paskutinis atnaujinimas:** 2026-05-20 (DS v0.2.1)

---

## 1. Kas yra „golden standard“

| Keičiate | Laikykitės |
|----------|------------|
| Prompt tekstai, antraštės | Prompt DOM §3 (id, klasės, `copyPrompt`, checkbox) |
| Vizualinė polish (spalvos, šešėliai) | DS §5–6; nekeisti layout be QA |
| Marketing copy, kainos, Stripe URL | [config/sot.json](../config/sot.json) + `npm run build` |
| Struktūra, JS elgsena | Šis dokumentas + atnaujinti [tests/structure.test.js](../tests/structure.test.js) |

**Taisyklė:** Jei sąmoningai laužote sutartį — pirmiausia atnaujinkite šį failą ir struktūrinius testus, tada CHANGELOG.

---

## 2. Puslapio struktūra (PDF-first funnel)

Viešas EN puslapis (`en/index.html` po build) turi išlaikyti **sekos logiką** (tikrinama `structure.test.js`):

```
hero (primary CTA → #pdf-guides)
  → objectives
  → #workflow-overview (6 fazės chip'ai — ne hero viduje)
  → #pdf-guides (mokami PDF)
  → free-tier-band (#free-prompts-label)
  → instructions → FAQ → progress → jump-nav
  → promptai (block1…block10, prompt1…prompt10)
  → community → footer
```

| Sutartis | Kodėl |
|----------|--------|
| Hero **neturi** `.header-phases` | Fazės perkeltos į `#workflow-overview` (PDF-first UX) |
| `#pdf-guides` **prieš** `#block1` / nemokamus promptus | Konversijos KPI: PDF virš free tier |
| `#free-prompts-label` tarp PDF ir pirmo prompto | Aiškus „free band“ atskyrimas |
| `objectives` **prieš** `pdf-guides` | Problemos → workflow → produktas |

**Šaltinis turiniui:** [templates/index-lt.html](../templates/index-lt.html) (authoring). **Neredaguoti ranka:** `en/index.html` — tik per build.

---

## 3. Prompt kortelės (DOM sutartis)

10 promptų: struktūra **`.prompt` > `.prompt-header` / `.prompt-body` / `.prompt-footer`**.

### 3.1 Privalomi identifikatoriai

| Elementas | Reikalavimas |
|-----------|----------------|
| Prompt ID | `prompt1` … `prompt10` |
| Anchor | `id="block1"` … `id="block10"` |
| Kopijavimas | `copyPrompt(...)` su teisingu `promptId` |
| Progresas | `.prompt-done` checkbox + `data-prompt-id` |
| Kodas | `.code-block` (≥10) |

### 3.2 Design System v1 — sąmoningi vizualiniai nukrypimai

Struktūra **nekeičiama**; tik CSS arba minimalūs markup pašalinimai:

- **`<p class="prompt-cta">`** — pašalinta iš `.prompt-footer`; instrukcija lieka `instructions` sekcijoje.
- **`.prompt .number` (PHASE badge)** — `display: none`; fazės kontekstas — `#workflow-overview` chip'ai.
- **`.info-box`** — CSS suplotas; markup (icon / strong / p) išsaugotas.
- **`.prompt-footer`** — `display: flex` (Copy + Mark as done vienoje eilėje); tab eilė nepakeista.

---

## 4. Fazės ir workflow chip'ai

| Komponentas | Sutartis |
|-------------|----------|
| `#workflow-overview` | Atskira sekcija; chip'ai `.header-phase-link[data-phase="1"]` … `6` |
| Chip CSS | **Scoped** `.workflow-overview .header-phase-link` — ne hero baltas pill stilius |
| `generator.js` | Click: `is-active` + atidaro atitinkamą `.phase`, `scrollIntoView` (`prefers-reduced-motion`) |
| Prompt fazės | `article.prompt[data-phase="N"]` — atitinka chip numerį |

---

## 5. PDF commerce blokas

| Elementas | Sutartis |
|-----------|----------|
| `.pdf-guide-cta` | `--cta-primary-bg`, `--text-on-accent`, `:link/:visited/:hover/:active`, `--ring-focus` (regression testai) |
| Preview | `class="btn btn--ghost pdf-guide-preview-btn"` + `data-preview-trigger="beginner|advanced"` |
| Stripe | `data-product`, `data-analytics` ant CTA; URL iš SOT → build |
| Buyer FAQ | `{{SOT_BUYER_FAQ_HTML}}` build metu; `<details class="faq-details">` **be** `open`; `initBuyerFaq()` skip jei jau užpildyta |
| Disclaimer | Tik footer `.footer-disclaimer` + `{{SOT_DISCLAIMER}}` — **ne** dubliuoti `.pdf-guides-after-purchase` |
| Po pirkimo blokas | `.pdf-guides-after-purchase`: FAQ + `pdf-guides-free-bridge` |

**PDF sekcijos fragmentas:** sinchronizuoti [templates/index-lt.html](../templates/index-lt.html) su [scripts/pdf-guides-section.fragment.html](../scripts/pdf-guides-section.fragment.html) jei keičiate HTML struktūrą.

---

## 6. CSS ir Design System (v0.2 + v0.2.1)

### 6.1 Kur redaguoti

| Failas | Turinys |
|--------|---------|
| [assets/styles.css](../assets/styles.css) | `:root` tokenai, `.btn`, `.btn--ghost` |
| [assets/landing.css](../assets/landing.css) | Visi landing komponentai |
| [templates/index-lt.html](../templates/index-lt.html) | HTML; **be** inline `<style>` |

Po pakeitimų: **`npm run build`** → **`npm test`**.

### 6.2 Tokenai ir draudimai

- **Nenaudoti** naujame CSS: `--orange-light`, `--blue-light`, `--community-cta-green*` (deprecated iki v0.3).
- **Focus** ant šviesaus fono: `outline: var(--ring-focus); outline-offset: 2px`.
- **Hero** ant navy: 3px baltas outline (išimtis).
- **Šešėliai:** `--shadow-soft` / `--medium` / `--elevated` / `--shadow-cta` / `--shadow-toast` / `--shadow-modal` / `--shadow-sticky`.
- **Tipografija:** `--fs-*`; hero H1 responsive `px` leidžiami.

### 6.3 Surface ladder (v0.2.1 — elevation)

Ant šviesaus fono **vengti** `surface-1` ant `surface-1` be šešėlio arba tarpinio `surface-2`:

| Komponentas | Fonas / elevation |
|-------------|-------------------|
| `.pdf-guides` | `--surface-2` |
| `.pdf-guide-card` | `--surface-1` + `--shadow-soft` (hover `--shadow-medium`) |
| `.pdf-guide-card--featured` | Navy border + `--shadow-medium` (hover `--shadow-elevated`) |
| `.pdf-bundle-offer` | `--surface-1` + `--shadow-soft` ant tinted sekcijos |
| `.workflow-overview` chip default | `--surface-2`, `border-subtle-dark` |
| Chip active | `--surface-1`, navy border, `--shadow-soft` |

Pilna lentelė: [design_systemv02.md](design_systemv02.md) §17.

---

## 7. Runtime (generator.js)

Nelaužyti be QA:

- `window.copyPrompt` (debounced)
- Phase accordion API (`.phase`, `.phase-header`, `.is-open` jei naudojama)
- `.header-phase-link` ↔ fazės scroll
- PDF preview: `#pdfPreviewDialog`, `[data-preview-trigger]`
- Analytics: `data-analytics` + `trackEvent()` (Plausible / Vercel)

---

## 8. QA prieš merge

1. **`npm test`** — 240+ structure assert'ų, HTML/JS lint.
2. **Prompt audit:** visi `prompt1`…`prompt10`, `block1`…`block10`, `aria-label`, `onclick` argumentai.
3. **Viešas brand:** `rg -i "personalas|series no"` šaknyje (išskyrus `node_modules`, vidinę doc).
4. **Rankinis smoke `/en/`:** hero → PDF, workflow chip'ai, preview ghost mygtukas, pirmo prompto kopijavimas.
5. **Release:** pa11y pagal [AGENT_SOT.md](AGENT_SOT.md) §6; DS v0.2.1 checklist [MUST_TODO.md](../MUST_TODO.md).

### Struktūriniai testai (DS v0.2.1)

`tests/structure.test.js` fiksuoja tarp alia:

- `landing.css`: `.pdf-guides` → `surface-2`, `.pdf-guide-card` → `shadow-soft`
- Workflow chip default `surface-2`
- `btn--ghost` + `assets/styles.css` komponentas
- `--ring-focus` ≥8× `landing.css`
- Nėra `legal-disclaimer` PDF after-purchase bloke

---

## 9. Susiję dokumentai

| Dokumentas | Kada skaityti |
|------------|----------------|
| [design_systemv02.md](design_systemv02.md) | DS PR, token migracija, §18 v0.3 backlog |
| [AGENT_SOT.md](AGENT_SOT.md) | Keliai, build, deploy, Stripe |
| [language-guidelines-en-lt.md](language-guidelines-en-lt.md) | EN viešas copy, brand |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Doc atnaujinimai prieš merge |

---

## 10. Revision history

| Data | Versija | Pastabos |
|------|---------|----------|
| 2026-05 | v1 | Prompt kompresija, PDF CTA visited fix |
| 2026-05-19 | v0.2 | `landing.css`, tokenai, inline CSS pašalintas |
| 2026-05-20 | v0.2.1 | Surface ladder, `btn--ghost`, išplėstas golden standard (šis failas) |
