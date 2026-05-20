# Golden standard (legacy atskaita)

**Paskirtis:** Vienas operacinis sąrašas — ką **ne laužyti** keičiant turinį, CSS arba build. Detalus DS implementacijos planas — [design_systemv02.md](design_systemv02.md). Keliai, deploy, brand — [AGENT_SOT.md](AGENT_SOT.md). Agentų seka — [AGENTS.md](../AGENTS.md) §9.

**Paskutinis atnaujinimas:** 2026-05-20 (DS v0.2.6)

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
  → #page-lanes-nav (sticky: PDF guides | Free prompts)
  → page-lane--shop
      → objectives
      → #pdf-guides (grid → trust → Buyer FAQ → 3 expert cards → free-bridge)
  → page-lane--free
      → free-tier-band (#free-prompts-label + section title)
      → #workflow-overview (6 fazės chip'ai — ne hero viduje)
      → instructions → FAQ → progress → jump-nav
  → promptai (block1…block10, prompt1…prompt10)
  → community → footer
```

| Sutartis | Kodėl |
|----------|--------|
| Hero **neturi** `.header-phases` | Fazės — `#workflow-overview` free lane (šalia promptų) |
| `#pdf-guides` **prieš** `#block1` / nemokamus promptus | Konversijos KPI: PDF virš free tier |
| `#workflow-overview` **po** `#free-prompts-label`, **prieš** instructions | Free toolkit kelias: fazės šalia darbo |
| Buyer FAQ **po** `.pdf-guides-grid`, ne po testimonial | Pirkimo objection'ai prie produkto (Gumroad pattern) |
| Hero secondary CTA → `#free-prompts-label` | Nemokamas kelias nepraleidžia free band |
| `objectives` **prieš** `pdf-guides` | Problemos → produktas (shop lane) |

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
| Po pirkimo blokas | `#pdf-guides-faq` po grid; `.pdf-guides-after-purchase`: **3 ekspertų kortelės** (`.pdf-expert-cards` grid) + `pdf-guides-free-bridge` |
| Ekspertų kortelės (DS v0.2.6) | Lygiai 3 `li.pdf-expert-card[role="listitem"]` viduje `ul.pdf-expert-cards[role="list"]` su elevation modifikatoriais `--elev-soft / --elev-medium / --elev-raised`; turinys iš `marketing.pdfSection.expertScenarios` SOT (Joan/Ohio, Lane/Oregon, Emanuel/Texas); privalomas `pdf-expert-scenarios-disclaimer` („Illustrative scenarios … not client testimonials") |

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
- **Focus ant tamsaus fono (v0.2.4):** `outline: var(--ring-focus-on-dark); outline-offset: 2px` (hero, `.header-phase-link`, `.cta-button*`, `.hero-lane-hint`).
- **Jokių literal'ių `outline: Npx solid …`** landing.css — visos `outline` deklaracijos privalo naudoti vieną iš dviejų token'ų.
- **Border-radius (v0.2.4):** literal'ai `999px / 8px / 4px / 12px` neleistini — naudoti `--r-pill / --r-sm / --r-xs / --r-md`.
- **State feedback per `:has()` (v0.2.5):** CSS-only būsenų grįžtamasis ryšys (pvz. `.prompt:has(.prompt-done:checked)`) **privalo** būti gate'intas `@supports selector(:has(*))` blokuose — Safari <15.4 / senesni Firefox išlieka su native checkbox tick'u kaip pagrindinis signalas.
- **`.btn` deduplikacija (v0.2.5):** vienintelė autoritetinė `.btn { ... }` deklaracija — [assets/styles.css](../assets/styles.css). [assets/landing.css](../assets/landing.css) neturi top-level `.btn { }` blokų, tik scoped override'us (`.prompt-footer .btn`) ir `.btn.success` state'ą.
- **Šešėliai:** `--shadow-soft` / `--medium` / `--elevated` / `--shadow-cta` / `--shadow-toast` / `--shadow-modal` / `--shadow-sticky`.
- **Tipografija:** `--fs-*`; hero H1 responsive `px` leidžiami.
- **Motion (v0.2.3):** `transition` deklaracijos naudoja `var(--duration-fast|normal|slow) var(--ease-out)`; jokių literal'ių `0.2s ease` / `0.3s ease`.
- **Hover lift (v0.2.3):** primary CTA = `translateY(var(--lift-md))`; hero / secondary / dense / sticky = `var(--lift-sm)`; ghost / info — be lift.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` blokas privalo turėti `*:hover, *:focus-visible { transform: none !important; }` (vestibulinė apsauga).
- **Hero sentence case:** `h1`, subhead, `.hero-price-teaser`, hero CTA labels — `text-transform: none` (turinys iš [config/sot.json](../config/sot.json)); uppercase tik `.badge`. Headline naudoja **U.S.** (ne izoliuotas `US` su forced caps). Kaina hero: tik `priceTeaser`, ne subhead. Žr. [design_systemv02.md](design_systemv02.md) §4.3.1; testai `structure.test.js`.

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

### 6.4 Sticky overlap & anchor clearance (v0.2.2)

- Visi sticky-perdengti anchor target'ai (`#pdf-guides`, `#free-prompts-label`, `#workflow-overview`, `.prompt[id^="prompt"]`, `[id^="block"]`) **privalo** turėti `scroll-margin-top: clamp(72px, 12vh, 96px)` (deklaruota globaliu `:where()` rule'u landing.css; specificity 0).
- `.page-lanes-nav` glass: `backdrop-filter: saturate(180%) blur(12px)` + `@supports not` solid fallback'as.
- `.pdf-sticky-cta` iOS safe-area: `padding-bottom: max(14px, env(safe-area-inset-bottom))`.

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
| 2026-05-20 | v0.2.2 | Sticky & anchor polish (scroll-margin, glass nav, safe-area, skip-link token) |
| 2026-05-20 | v0.2.3 | Motion ritmu & lift token sistema (--lift-sm/-md, transition tokens, reduced-motion transform reset) |
| 2026-05-20 | v0.2.4 | Focus + radius + form consolidation (--ring-focus-on-dark, --r-xs, gold form ring, code-block 3px) |
| 2026-05-20 | v0.2.5 | Affordance & state polish (:has done state, selected check marker, prompt hover lift, featured gold inset, scrollbar styling, .btn deduplication) |
| 2026-05-20 | v0.2.6 | PDF expert scenarios row (3 illustrative cards: Joan/Ohio, Lane/Oregon, Emanuel/Texas) replaces single pilot blockquote; new `.pdf-expert-cards` grid + soft/medium/raised elevation modifiers; SOT-driven via `marketing.pdfSection.expertScenarios` |
